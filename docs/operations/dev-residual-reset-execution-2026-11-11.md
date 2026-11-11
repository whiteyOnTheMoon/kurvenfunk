# DEV-Restdatenreset – Ausführungsfreigabe und Nachweisprotokoll (11.11.2026)

## Autorisierung
Der Projektbetreiber hat den vollständigen Reset **aller DEV-Anwendungsdaten einschließlich Medien und Testidentitäten** ausdrücklich freigegeben. Ziel: leere Inhaltsdatenbank und saubere DEV-Dienste als Basis für ausschließlich echte und rechtmäßig nutzbare News-/Sportquellen.

**Keine** Freigabe für STAGING/PROD, Löschen von Keycloak-Realm-/Master-Admins, Servicekonten, Secrets, Buckets/Policies, Suchkonfiguration, Prisma-Migrationsschema oder privater Backups.

## Ausgangslage: bestätigte schreibgeschützte Live-Inventur
[DEV-Action #42946881068](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42946881068), commit `161d1e05b522f664df38a287f079ac833d3923b1`:
- Keycloak Realm `kurvenfunk`: **10 Benutzer, davon 1 Servicekonto**; Master-Realm: 1 Benutzer.
- MinIO: **2 Objekte**, 2.092.574 Bytes im konfigurierten Anwendungsbucket; andere Buckets und Versionen noch nicht einzeln inventarisiert.
- Meilisearch: **0 Indizes, 0 Dokumente**.
- Redis: **86 Schlüssel**; nicht automatisch 86 redaktionelle Datensätze, sondern möglicherweise betriebliche Queue-/Cache-Keys.
- Mailpit: **10 Nachrichten**.
- DEV-News-Scheduler deaktiviert; APA-/OTS-Abnahme für den Off-Modus in der Action bestätigt.
- Anwendungsdatenbank wurde zuvor mit PR #141 zurückgesetzt; wird beim kombinierten Reset nochmals separat gesichert und geleert.

## Abgesicherte Durchführung
Quellcode: PR #144 auf `develop`; Workflowmarker `[dev-residual-plan]` ausschließlich read-only, `[dev-residual-reset]` ausschließlich mit expliziter Zustimmung und erfolgreichem DEV-Deployment.

1. Erfolgreiche PR-CI, der schreibgeschützte DEV-only-Preflight und exakter aktueller `develop`-Commit müssen bestätigt sein.
2. Alle geschützten DEV-Datenbank-/Volume-Identitäten und deaktivierten Import-Scheduler erneut prüfen. Cloudflared/API/Worker und Datenspeicher für konsistente Backups kontrolliert stoppen.
3. Beide PostgreSQL-Datenbanken getrennt mit `pg_dump` sichern; `pg_restore --list` und vollständige Lesekontrolle. Redis-, MinIO-, Meilisearch- und Mailpit-Volumes privat konsistent archivieren und gzip/tar-Dateiintegrität prüfen. SHA256 ausgeben, keine Backups in GitHub hochladen.
4. Nur DEV-Anwendungsdaten und historische DEV-Restdaten entfernen; Keycloak-Admin-/Servicebenutzer über privilegierte Rollenerkennung schützen, Realm-Konfiguration erhalten; Medien inklusive Versionen und Multipart-Uploads im aktiven Anwendungsbucket entfernen; Meilisearch-Dokumente bei Erhalt der Settings und Mailpit-Nachrichten entfernen; ausschließlich DEV-Redis DB flushen.
5. Alle Dienste starten; erneute read-only Inventur, Gesundheitsprüfungen, Migrations-/Realm-Schutz bestätigen. Bei Fehlern nicht als erfolgreich markieren. Ein Teilfehler nach der ersten Löschung erfordert manuelle Wiederaufnahme oder Wiederherstellung aus den gesicherten privaten Backups.

## Aktueller Status
**NOCH NICHT AUSGEFÜHRT** – dieses Dokument ist die genehmigte operative Grundlage, kein Erfolgsnachweis. Nach der tatsächlichen Ausführung ausschließlich anhand der zugehörigen GitHub-Actions-Logs ergänzen. Ein leeres DEV belegt weder STAGING-/PROD-Abnahme noch den Anschluss echter Sport-Provider.
