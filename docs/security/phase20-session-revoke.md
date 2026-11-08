# Phase 20.186 – Keycloak Session Revoke: Wiederanlauf und Abnahme

**Status: in Arbeit, keine DEV-Freigabe.** Änderungen ausschließlich über geprüften Feature-PR nach `develop`. STAGING und PROD bleiben unangetastet.

## Bestehender Schutz

- Automatische rote Karte nach drei gültigen gelben Karten und direkt vergebene rote Karte sperren das Kurvenfunk-Benutzerkonto auf `BANNED` innerhalb der Datenbanktransaktion.
- Dieselbe Transaktion erzeugt eine `RED_CARD`-Benachrichtigung mit dauerhaft gespeichertem `metadata.sessionRevocation=PENDING`.
- Erst nach Commit versucht die API über den dedizierten Keycloak-Serviceaccount mit begrenzter Berechtigung `realm-management/manage-users` den Session-Logout (`POST /admin/realms/kurvenfunk/users/:subject/logout`).
- Ein erfolgreiches `204` wird als `REVOKED` in der Benachrichtigung gespeichert. Fehler oder Keycloak-Unverfügbarkeit lassen `PENDING` bestehen. Der Status-Guard blockiert BANNED-Zugriffe selbst mit älteren oder neuen JWTs bereits vor erfolgreichem externen Logout.
- Ein nachgelagerter Retry liest höchstens 20 PENDING-Benachrichtigungen je Scan, ausschließlich für weiterhin BANNED-Konten.

## Erweiterung 20.186

- Sofortige, fehlertolerante Wiederaufnahme eines PENDING-Scans beim API-Modulstart sowie regelmäßiger Scan alle 60 Sekunden.
- Kein zweiter Scan gleichzeitig innerhalb derselben API-Instanz; nach Keycloak-/Datenbankfehlern wird die Sperre im `finally` freigegeben.
- Für aktive Konten wird nicht nachträglich ein Logout ausgelöst. Interne Notizen, Session-Tokens und Passwörter dürfen niemals als Logs oder API-Antworten ausgegeben werden.
- Ein Neustart der API ist kein notwendiger Bestandteil der erfolgreichen Normalfunktion. Die laufende Instanz versucht PENDING erneut, und ein späterer Neustart darf die noch gespeicherten PENDING-Einträge nicht verlieren.

## Erforderliche vollständige Abnahme

1. CI: Format, Lint, Typecheck, Unit-Tests, Build und isolierte HTTP-E2E sowie Docker-/Prisma-Build.
2. Isolierter Mock-Keycloak/DB-Nachweis: direkte und automatische rote Karte, erzwungenes Keycloak-Timeout/401/403, persistiertes `PENDING`, Wiederherstellung ohne Entsperren, erneuter Scan nach simulierter Prozessneustart-Situation, `REVOKED` und idempotentes Verhalten.
3. Real DEV: ausschließlich neue synthetische Keycloak- und Kurvenfunk-Konten, Authorization Code + PKCE statt Direct Grant, echte aktive Keycloak-Sitzung, rote Karte, danach Keycloak-Sessions leer. Älterer JWT wird serverseitig mit `403 ACCOUNT_BANNED` zurückgewiesen; kein realer Benutzer betroffen.
4. Kontrollierte Wiederholung von PENDING auf DEV ohne echte Unterbrechung der gemeinsam verwendeten Keycloak-Instanz. Gegebenenfalls gezielt gesetzter PENDING-Testdatensatz für eine synthetische, bereits BANNED-Identität (kein globaler Keycloak-Ausfall).
5. Strikte Prüfung von Cleanup aller eigenen Benutzer, Sitzungen, Benachrichtigungen und Audit-Datensätze; keine Keycloak-Sicherheitsoptionen verändern, kein STAGING/PROD.
6. Negative Browser- und Mobil-Regression des BANNED-Zustands, ohne allgemeinen BANNED-Bypass. Einspruchsausnahmen werden erst in Task 189 definiert.


## Ausführbarer DEV-Abnahmetest

- `infrastructure/scripts/verify/dev-phase20-session-revoke.sh` verlangt Benutzer `ap`, `develop`, exakten Merge-SHA, sauberen Checkout und `.env.dev` mit `0600`. Der Job läuft einmalig **nur nach erfolgreichem DEV-Deploy** beim Commit-Marker `[phase20-186-dev-session-revoke]`.
- `dev-phase20-session-revoke.mjs` erstellt ausschließlich drei neue, eindeutig markierte synthetische Keycloak-Konten (`@example.test`) und zugehörige DB-Benutzer. PKCE-Login per echter Keycloak-Browser-Sitzung, normale HTTP-RED-Karte, Keycloak-Sessionliste vor und nach Logout, alte und neue JWT, Browser- und Mobile-User-Agent sowie eingeschränkte Account-Aktionen werden geprüft.
- Für das dritte, **synthetische** Konto wird der Widerrufsfehler nur in einer isolierten Instanz von `DirectRedCardService` nachgestellt. **Keine** Unterbrechung oder Umkonfiguration des gemeinsamen Keycloak. Der schon gesperrte Account bleibt während der noch aktiven Session durch den API-Status-Guard geschützt; die RED-Benachrichtigung behält `PENDING`.
- Zwei isolierte Instanzen des echten kompilierten `ModerationService` prüfen erst den weiter ausstehenden Retry und dann die Wiederaufnahme via `onModuleInit()` mit dem **echten** Keycloak-Serviceaccount. Ein strikt auf die neu erstellte Benachrichtigungs-ID begrenzter Datenbankadapter verhindert Berührung anderer DEV-`PENDING`-Benachrichtigungen. Der Bootstrap-Scan ist ein simulierter Modul-/Prozessneustart; die gemeinsame API-Instanz wird nicht unterbrochen.
- Die 403-Negativprüfung für BANNED verwendet authentifizierte Konto- und Moderationsendpunkte. Community-Write-Endpunkte mit dem getrennten Task-182-IP-Limiter sind bewusst nicht Teil dieser Status-Guard-Prüfung: lokale DEV-Aufrufe können dort aus Sicherheitsgründen schon **vor** der Statusprüfung mit `503 IP_RATE_LIMIT_UNAVAILABLE` abgewiesen werden. Ein `503` darf nicht als erfolgreicher 403-Nachweis gewertet werden; die vollständige Route-Matrix gehört zur separaten IP-Guard-Abnahme.
- Danach wird `REVOKED`, eine leere Keycloak-Sessionliste, blockiertes Refresh-Token, weiterhin `BANNED` und `403 ACCOUNT_BANNED` für alte Browser-/Mobile-Tokens geprüft. Testdaten und Keycloak-Konten werden in `finally` entfernt, bei einem Cleanup-Fehler schlägt der Job fehl.
- **Keine** Änderung an bestehenden Keycloak-Accounts, Konfiguration, API- oder Keycloak-Container-Verfügbarkeit, STAGING oder PROD. Keine Zugangsdaten, Cookies oder Tokens in Logs. Vor dem DEV-Smoke darf weder `DONE` dokumentiert noch die Task-Checkbox abgehakt werden.

`DONE` erst nach CI und nachvollziehbarer isolierter sowie realer DEV-Abnahme. Ein positives Unit-Testergebnis alleine bedeutet nur `PARTIAL`.
