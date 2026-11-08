# Phase 20.187 – Moderation Dashboard

Status: **Feature-Branch / noch keine DEV-Abnahme**. Keine Veröffentlichung nach STAGING/PROD.

## Umfang

- Bestehende Adminroute `/admin/moderation` zeigt neu eine mobile-taugliche, lesende Übersicht mit Summen für **OPEN/IN_REVIEW Reports, aktive YELLOW/RED-Karten, LIMITED/BANNED-Konten und aktive LIMITED-Sanktionen**; zusätzlich höchstens 12 neue Meldungen, Karten und LIMITED-Sanktionen, ohne private Moderationsnotizen, Beweisdetails oder Audit-Metadaten.
- Die bestehende Kommentarmeldungs-Warteschlange bleibt erhalten. Entscheidungen erfolgen weiter ausschließlich über die bestehenden, auditierten und serverseitig geprüften Endpunkte. Das neue Dashboard vergibt keine Karten oder Sanktionen und hebt keine Sperren auf.
- Alle Übersichts-Endpunkte verlangen einen authentifizierten, nicht eingeschränkten Mitarbeiter. `GET /api/v1/moderation/dashboard` verlangt `user.warn` (MODERATOR/ADMIN/SUPERADMIN).
- IP-Sperr-Kennzahlen und letzte IP-Sperren sind separat unter `GET /api/v1/moderation/dashboard/ip-blocks` und **nur mit `user.ipban` (SUPERADMIN)** abrufbar. Auch dieser Endpunkt liefert ausschließlich Quelle, Zeit, Status und Reason-Code; **niemals** rohe IP, pseudonymisierte IP/HMAC, Schlüsselversion, interne Notizen, Actor-ID, Auswertungs- oder Revoke-Geheimnisse. Das Frontend lädt den Endpunkt für andere Rollen nicht.
- **Appeals 20.189 ist noch nicht implementiert**: kein `Appeal`-Prisma-Modell, keine Einspruchs-API und deshalb **keine erfundenen 0-Werte**. Eine klar gekennzeichnete Information ersetzt die Kennzahl bis Task 189. Die User-History einschließlich vertraulicher Notizen gehört separat zu **20.188** und wird hier bewusst nicht vorgezogen.
- Datensätze werden mit serverseitigen `select`-Projektionen begrenzt; Listen enthalten höchstens 12 Einträge je Kategorie und haben eine stabile Sortierung. Zeitbezogene Aktivitätszählungen beachten abgelaufene Einträge ohne sie oder Nutzerstatus zu verändern.
- Keine Änderung an `IP_TEMP_BLOCK_ENABLED` oder `IP_TEMP_AUTO_BLOCK_ENABLED`, keine Aktivierung von IP-Sanktionen.

## Abnahme

1. Format, Lint, Typecheck, Unit-Tests und Build der gesamten Monorepo-CI, plus isolierte Worker-/Prisma- und Gateway-/Redis-Gates.
2. HTTP-E2E auf ausdrücklich wegwerfbarem PostgreSQL und Redis (`API_E2E_ISOLATED=true`) mit signiertem JWT/JWKS: Anonym, USER, EDITOR, LIMITED und BANNED bekommen keinen Zugriff; MODERATOR/ADMIN dürfen nur normale Dashboarddaten lesen; SUPERADMIN hat zusätzlich den IP-Endpunkt.
3. Negativtest überprüft, dass `internalNote`, `moderatorNote`, `details`, `ipHash`, `hashKeyVersion` und die synthetische private Testnotiz nicht in API-Antworten erscheinen.
4. DEV-only Smoke auf **exaktem getesteten `develop` SHA**: nur lesende Aufrufe der kompilierten Dienstmethoden, mit Rollenprüfung für die Endpunkte, ohne bestehende Nutzerdaten zu loggen, zu ändern oder zu exportieren. Optionaler Browser-/Mobile-Screenshot nur aus einem genehmigten, synthetischen Mitarbeiterkonto.
5. `DONE` erst nach grünem PR-CI, Review, Merge nach `develop`, erfolgreichem DEV-Deployment und DEV-Smoke. Keine STAGING-/PROD-Ausführung.

Die alte Draft-PR #29 betrifft zusammenhängend Tasks 187–189 und kann wegen veralteter Auth-/Schema-Konflikte **nicht unverändert übernommen werden**. Dieses Paket verwendet ausschließlich die jetzt existierenden Prisma-Modelle und separiert 188/189.
