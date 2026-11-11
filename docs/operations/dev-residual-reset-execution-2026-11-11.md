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

## Erfolgreicher Apply-Lauf (11.11.2026)
- [GitHub Actions #42958281430](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42958281430), Merge-Commit `b17973ec97729053a1de0a89b88eb08a0194a2dd`: abgeschlossener erfolgreicher DEV-only Workflow, `DEV_RESIDUAL_APPLY_RESULT=PASS_BACKED_UP_AND_CLEARED`.
- Vor Löschungen erfolgreich geprüft: 41 Anwendungstabellen, 1 Keycloak-Masterbenutzer, Import-Scheduler OFF, isolierte DEV-Volumes.
- Private, lesbar verifizierte Datenbank-Backups: Anwendung und Keycloak. Private, integritätsgeprüfte Archive: Redis, MinIO, Meilisearch, Mailpit. Alle sechs Backups bleiben serverseitig privat erhalten.
- MinIO-Anwendungsbucket: 2 Versionen gelöscht, keine verbleibenden Objekte/Versionen/Uploads. Mailpit: 10 Nachrichten gelöscht; Meilisearch: keine Restdokumente. DEV-Redis direkt nach FLUSHDB: 0 Schlüssel.
- Keycloak-Bereinigung: 1 Realm-Benutzer gelöscht, 0 privilegierte Identitäten innerhalb der von der Admin-API gelieferten Liste geschützt. Die frühere SQL-Inventur zeigte 10 Realm-Benutzer einschließlich 1 Servicebenutzer. Die Abweichung ist **nicht geklärt** und muss durch neue Live-Inventur ausgewertet werden.
- Anwendungstabellen erneut geleert; Master-Realm-Identität unverändert; API/Worker/Tunnel wieder gestartet.

## Verifikation nach dem Reset – offen
Ein erfolgreicher Apply-Lauf ist nicht gleichbedeutend mit einer abgeschlossenen Bestands- und fachlichen Abnahme. Nach Neustart schreibgeschützt erfassen: Keycloak-Realmbenutzer und Dienstkonten, MinIO-Anwendungsbucket, Meilisearch-Dokumente, Redis-Keys und Mailpit-Nachrichten; anschließend den separaten Phase-0–21-Datennachweis und die Gesundheit des DEV-Systems prüfen. **Keine** Produktiv-/STAGING-Mutation; keine echten Provider-Importe ohne geprüfte Herkunft und Nutzungsrechte.
