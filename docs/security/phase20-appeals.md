# Phase 20.189 – Einsprüche / Appeals

Status: **Feature-Branch; DEV DONE erst nach exaktem CI-/Deploy-/Smoke-Nachweis**.

## Zweck und Berechtigungsgrenze

Verifizierte Nutzer können gegen eine **eigene** Moderationskarte oder accountgebundene Nicht-IP-Sanktion Einspruch einlegen. Auch bei `BANNED` darf ausschließlich `/appeals` und die drei persönlichen `/api/v1/appeals`-Endpunkte verwendet werden; **alle bisherigen regulären AuthGuard- und Permission-Checks bleiben unverändert**. Nach Task 186 ausgeloggte BANNED-Accounts müssen für einen Einspruch eine neue Keycloak-Anmeldung per Authorization Code + PKCE durchführen. Der Server prüft für jede Einspruchsanfrage erneut ein signiertes, gültiges Keycloak-JWT mit korrektem Issuer/Audience und `email_verified=true`; dann wird die interne User-ID ausschließlich aus dem serverseitig synchronisierten Keycloak-Subject gewonnen. Keine User-ID wird aus dem Antragsbody akzeptiert.

Das Web-Auth-Context stellt `appealToken` **separat** von `authenticated`, `token` und `user` bereit. Nur beim expliziten `ACCOUNT_BANNED`-Fehler mit gültiger Keycloak-Sitzung wird `appealToken` gefüllt. Reguläre UI/API-Consumer behalten `token=undefined`, `authenticated=false`, `user=undefined`. Bei Logout, falscher Identität, fehlender Verifizierung oder temporärem Auth-Fehler wird der Sondertoken gelöscht. Ein BANNED-Konto erhält kein neues allgemeines Recht.

## Datenmodell

Additive Prisma-Migration `20261109011000_phase20_189_appeals`: `Appeal` mit `userId`, genau einem Verweis auf `ModerationCard` oder `Sanction` (CHECK auf DB-Ebene), begrenztem Freitextgrund, Status `OPEN | ACCEPTED | REJECTED`, Reviewer und internem Entscheidungsvermerk. Pro Nutzer und Ziel genau ein Einspruch (zwei DB-Unique-Indizes; auch bei parallelen HTTP-Anfragen). Audit-Aktionen `APPEAL_CREATED` und `APPEAL_RESOLVED` samt AuditTargetType `APPEAL`. Bestehende Konten, Karten und Daten bleiben durch diese Migration unverändert.

## API

| Route | Authentifizierung | Rückgabe |
| --- | --- | --- |
| `GET /api/v1/appeals/eligible` | AppealIdentityGuard (auch BANNED) | bis zu 50 eigene Karten und 50 eigene Nicht-IP-Sanktionen; ohne Beweis-/interne Notizen |
| `POST /api/v1/appeals` | AppealIdentityGuard (auch BANNED) | genau eine eigene Ziel-UUID, Grund 10–2.000 Zeichen, atomar: Einspruch, Audit und persönliche Empfangsbestätigung |
| `GET /api/v1/appeals/mine` | AppealIdentityGuard (auch BANNED) | bis zu 50 eigene Fälle, Status, Zeit und eigene Begründung; ohne Reviewer-ID und Entscheidungsnotiz |
| `GET /api/v1/moderation/appeals` | regulärer AuthGuard + `user.warn` | max. 50 offene Fälle, älteste zuerst, interne Moderationswarteschlange |
| `PATCH /api/v1/moderation/appeals/:appealId/decision` | regulärer AuthGuard + `user.ban` | `ACCEPTED/REJECTED` und Pflicht-Begründung 10–2.000 Zeichen; interne Notiz nur in der DB |

Alle Routen setzen `Cache-Control: private, no-store`. Die App nutzt nur `cache: 'no-store'` und React-Textausgabe ohne unsicheres HTML, exportiert keine Notizen in URLs, Analytics oder lokale Speicherung.

### Annahme und Auswirkungen

Die Entscheidung ist eine DB-Transaktion mit `FOR UPDATE`-Lock auf den Zielnutzer. Der Reviewer darf nicht Einspruchsteller sein, und ein schon bearbeiteter Einspruch kann nicht erneut entschieden werden. `REJECTED` lässt Sanktionen unverändert. `ACCEPTED` widerruft ausschließlich die betroffene aktive Karte oder Sanktion. Danach werden weitere aktive RED-Karten, ACCOUNT_BAN- und LIMITED-Sanktionen geprüft. Nur wenn keine weiteren aktiven Sperrgründe existieren, wechselt der Kontostatus; jede Änderung erhält einen gesonderten Audit-Eintrag. Audit und Benachrichtigung erfolgen im selben Commit wie die Entscheidung.

**Netzwerksicherheit:** `IP_BLOCK`-Sanktionen sind über diesen Endpoint *nicht* auswählbar, beantragbar oder widerrufbar. Der `user.ban`-Reviewer darf hier **niemals** `IPBlock` deaktivieren oder dessen Hash/Notizen lesen; `user.ipban` und die bestehenden SUPERADMIN-Schutzmechanismen bleiben unberührt. Ein bestehender IP-Block bleibt auch nach Akzeptanz einer anderen Sanktion unverändert; ggf. ist ein separater SUPERADMIN-Prozess erforderlich. Task **20.190 Vier-Augen-Prinzip** ist weiterhin gesondert offen und wird durch diese Implementierung nicht vorweggenommen.

## Prüfung

1. Alle Monorepo-Gates in GitHub Actions (Format/Lint/Typecheck/Unit/Build, isolierter HTTP-E2E mit wegwerfbarem PostgreSQL + Redis + eigener JWKS/JWT, Worker/Prisma Docker, Gateway-Quota/Redis-Recovery).
2. Isolierter HTTP-E2E: signierter BANNED-JWT darf nur persönliche Einsprüche abrufen und einreichen, normales `/auth/me` bleibt 403. Anonyme 401, Rollenmatrix bei Staff-Endpunkten, andere Nutzer-Ziele 404, ungültiger Antrag 400, Doppel-Einspruch 409, self-review 403. Reviewer-Entscheidung mit Pflichtnote, Status-/Audit-/Benachrichtigungs-Prüfung, weitere aktive Bans verhindern Entsperren und IP-Schutz bleibt unverändert.
3. **DEV-Postdeploy-Gate nur read-only** auf exakt gemergtem `develop`-SHA: `ap`, sauberer Checkout, `.env.dev` 600, beide IP-TEMP-Flags OFF; kompilierten Guard-/Permission-Metadaten, echte DB-Abfragen auf zufällige unbesetzte UUID und anonymous HTTP-401 für Appeal-Routen. Keine realen Einsprüche/Notizen aus DEV laden, keine Fälle erstellen/ändern.
4. Task 189 nur nach grüner CI, dokumentierter technischer Prüfung (COMMENT ≠ unabhängige Freigabe), Merge, erfolgreichem DEV-Deploy und grünem DEV-Smoke als **DEV DONE** markieren. STAGING/PROD unverändert.

**Bewusste Grenze:** Die DEV-Abnahme testet keine echte BANNED-Keycloak-Browsersitzung; eine neue PKCE-Anmeldung und der vollständige BANNED-Positivpfad werden aus Datenschutzgründen zunächst mit synthetischem JWKS/JWT in isoliertem HTTP-E2E und mit Web-Auth-Regressionstests abgesichert. Ein zusätzlicher Browser-Abnahmetest mit ausschließlich synthetischer Identität wäre separat möglich.
