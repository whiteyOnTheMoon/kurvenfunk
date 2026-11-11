# DEV-Anwendungsdatenbank: kontrollierter Komplett-Reset (11.11.2026)

## Autorisierung und Grenzen

Der Anwender hat ausdrücklich freigegeben, **sämtliche Inhalte der DEV-Datenbank** von Kurvenfunk zu entfernen (nicht nur Seed-/Testdaten). Dieser Vorgang ist absichtlich weiter gefasst als die früheren streng fingerprint-basierten Cleanup-Läufe. Das betrifft auch bisher echte bzw. redaktionelle Daten. **Kein STAGING/PROD-Eingriff.**

Der Reset entfernt alle Datensätze aus den Anwendungstabellen im `public`-Schema der separaten DEV-App-PostgreSQL-Datenbank. Die Tabellen, Constraints, Indizes und das Prisma-Migrationsledger `_prisma_migrations` bleiben erhalten, ebenso die Anwendungscodebasis. Es ist **kein** Schema-Drop und **keine** neue Migration.

Zusätzlich leert der Ablauf die isolierte DEV-Redis-Datenbank (BullMQ-Queues, Cache, temporäre Ratelimits) und deaktiviert die automatisch laufenden Newsimporte auf DEV in `compose.dev.yml`. Künftige Anmeldung oder manuelle Aktionen können später wieder neue Daten erzeugen.

**Nicht Bestandteil dieses DB-Resets:** Keycloak-Realm und dessen Benutzerkonten, Keycloak-Datenbankschema, MinIO-Objekte, Meilisearch-Indizes, Mailpit-Inhalte, private historische Backups und DEV-Umgebungskonfiguration. Diese Dienste besitzen eigene Datenbestände und erfordern einen getrennt verifizierten Reset. Die Keycloak-Datenbank wird vorsorglich gesichert, aber **nicht geleert**, damit bestehende Identity-/Admin-Konfiguration nicht verloren geht. Die bisherige Keycloak-Anmeldung kann beim nächsten Login neue Anwendungskonten erzeugen.

## Sicherheitsverfahren

1. Merge nur eines vollständig CI-geprüften PR nach `develop`; Commitmarker **`[dev-full-app-reset]`**. Github-Actions-Job nur nach erfolgreich abgeschlossenem DEV-Deployment.
2. Script ausschließlich mit `DEV_FULL_RESET_TARGET=DEV`, `DEV_FULL_RESET_MODE=apply`, `DEV_FULL_RESET_CONFIRM=RESET_ALL_DEV_APPLICATION_DATA`, exaktem `EXPECTED_COMMIT`, sauberem `develop`, vorhandener `.env.dev` und den gegenseitigen DEV-Deploy-/Cleanup-Locks.
3. Postgres/Keycloak-Datenbanknamen müssen sich unterscheiden; API-Datenbank-URL muss auf dieselbe `postgres`-DB zeigen. Mindestens 20 Anwendungstabellen und bestimmte Prisma-Tabellen inklusive `_prisma_migrations` müssen vorhanden sein.
4. Schreibende DEV-API und DEV-Worker vor dem Backup anhalten; beide Datenbanken jeweils privat als vollständiges Custom-Format `pg_dump` sichern. Für jedes Backup `pg_restore --list` und vollständiges lesendes `pg_restore --file /dev/null` bestehen lassen. SHA256 protokollieren, keine Dumps/Secrets in GitHub-Artefakte hochladen.
5. In einer SQL-Transaktion **alle** Anwendungstabellen, aber **nicht** `_prisma_migrations` leeren. Innerhalb derselben Transaktion auf leere Tabellen prüfen. Scheitert irgendetwas, rollback und Fehlerstatus.
6. Isolierten DEV-Redis per `FLUSHDB SYNC` leeren, danach Größe 0 prüfen. Redis-Inhalte sind anschließend weg; der PostgreSQL-Dump ersetzt keinen Redis-Snapshot.
7. API/Worker starten, read-only DEV-Fachinventur ausführen, privates Backup auf dem DEV-Host aufbewahren. Bei Fehlversuch Dienste wieder starten und Fehler klar melden. Keine automatische Wiederherstellung über einen möglicherweise beschädigten Zwischenzustand.

## Erwarteter Postzustand

Unmittelbar am Ende der SQL-Transaktion: sämtliche Anwendungsdatenzeilen Null, Prisma-Migrationshistorie erhalten. Nach dem Neustart können Authentifizierung und explizite Benutzeraktionen wieder Daten erzeugen, und der Inventur-Job dokumentiert den tatsächlichen Zustand. Die deaktivierten DEV-Import-Scheduler sollen automatische News-Reimporte verhindern. Ein vollständiger Reset auch von Identity-/Objektspeichern ist damit **noch nicht** nachgewiesen.

Die Ausführung muss vom erfolgreichen GitHub-Action-Job sowie den dort ausgegebenen Markern `DEV_APP_RESET_BACKUP_VERIFIED`, `DEV_APP_DATA_RESET_VERIFIED`, `DEV_APP_RESET_RESULT` und der DEV-Inventur bestätigt werden. Ein grüner PR-CI-Lauf allein belegt **keinen** erfolgten Datenbankreset.
