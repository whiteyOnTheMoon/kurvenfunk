# DEV-Restdienste: schreibgeschützte Inventur und abgesicherte Bereinigung (11.11.2026)

## Geltungsbereich und Beweislage

Nur die Docker-Compose-Umgebung `kurvenfunk-dev` auf dem DEV-Host mit `.env.dev`, `compose.yml` und `compose.dev.yml`. Der letzte bestätigte `develop`-Stand bei Erstellung dieses Plans ist `203631e23fedc97d4878bf3ed8c72b004eba4422` (PR #141). Der erfolgreiche DB-Reset sagt **nichts** über noch vorhandene Daten in Keycloak, MinIO, Meilisearch oder Mailpit aus. Redis war direkt nach dem Reset leer; dieser Zustand ist erneut zu prüfen.

**Noch keine Live-Zahlen für die fünf Dienste:** Die GitHub-Verbindung kann Repository, Workflows und Logs prüfen, aber ohne ausgeführten DEV-Host-Inventurjob keine aktuellen Datenbank- oder Speicherinhalte auslesen. Keine Datenbestände aus Code oder alten Logs als aktuell ausgeben.

## Vorbereitende Sicherheitsgates

1. Ausschließlich `develop` auf dem DEV-Host; sauberer Checkout; `git rev-parse HEAD` muss exakt `origin/develop` entsprechen. Gegenprüfung von Docker-Compose-Projektnamen, `.env.dev`, DEV-Portbindungen und Datenbank-/Volume-Namen. Keine Geheimnisse oder Zugangstoken protokollieren.
2. Inventur zunächst **ohne Änderungen**; dieselben Deployment-/Wartungssperren beachten wie bei `dev-full-app-reset.sh`. Keine geplanten Import- oder Wartungsläufe während der Messung.
3. Nur Zahlen und technische Metadaten protokollieren; keine Benutzernamen, Mailadressen, Nachrichtentexte, Zugangsdaten, Tokens, persönlichen Objektpfade, RawPayloads oder identifizierbare Identitätsdaten in Actions-Logs/Artefakten.
4. Keine Löschung allein aus Namensmustern `test`, `seed` oder `demo`. Fremde/unbekannte Accounts zunächst isoliert klassifizieren und Admin-/Service-/Realm-Abhängigkeiten schützen.

## Inventur pro Dienst – nur lesende Abfragen

| Dienst | Inventur | Unbedingt erhalten |
| --- | --- | --- |
| Keycloak | Realm-Liste; je Realm aggregierte Benutzeranzahl, Rollen-/Gruppen-/Client-Anzahlen, Federations-/Identity-Provider- und Service-Account-Abhängigkeiten; getrennte Summen für eindeutig bekannte QA-Identitäten und unklare Benutzer. Nur im kurvenfunk-DEV-Realm nach konkreter Herkunft suchen; keine exportierten Passwörter oder Userlisten in CI. | Master-Realm, funktionierende DEV-Realm-Konfiguration, Admin-/Breakglass-Zugänge, Servicekonten, Clients, Secrets, Rollen, SMTP-/Identity-Provider-Settings |
| MinIO | Buckets, Objektanzahlen und Byte-Summen; getrennt nach im aktuellen leeren App-DB-Zustand referenzierten und nicht referenzierten Objekten, Objektversionierung/Retention/Lock prüfen. Object-Keys nur privat verarbeiten. | Buckets und Berechtigungen, legitime neue Uploads, Objekte mit Retention/Legal Hold, Konfiguration |
| Meilisearch | Index-UIDs, Dokumentanzahlen, aktiver Task-Status, Settings/Synonyme/Ranking-Konfiguration; Index-Inhalte gegen leere App-Datenbank prüfen. | Master-Key, Search-Konfiguration; Index-Schemas/Settings bis Wiederaufbau geplant |
| Redis | `DBSIZE`, BullMQ-Queue-/Scheduler-Zählung, aktive Jobs und Health, keine `KEYS *`-Dumps. Redis aus PR #141 wurde geleert, kann danach aber neue Caches/Queues gebildet haben. | Laufende Sessions, erforderliche Locks, neue legitime Jobs; niemals andere Redis-Datenbanken |
| Mailpit | Nachrichtenanzahl und technische Datensatzgröße über die isolierte Mailpit-API oder lokale Datenbank schreibgeschützt; keine Betreff-/Empfänger-/Nachrichteninhalte in Logs. | Mailpit-Konfiguration, SMTP-Erreichbarkeit und dauerhafte DEV-Funktion |

## Planung gezielter Bereinigungen (noch nicht autorisiert)

**Vor jedem Schreibvorgang:** neue DEV-only Backups von Keycloak-DB, MinIO-Buckets/Metadaten, Meilisearch-Snapshot/Dump/Settings, Redis soweit relevant und Mailpit-Datei; Prüfungen auf Lesbarkeit und Wiederherstellbarkeit; SHA256 und private, zugriffsgeschützte Ablage. Backup-Inhalte dürfen nicht nach GitHub gelangen. App-/KC-PostgreSQL separat sichern. Ein formaler Restore-Test in isolierter Umgebung ist vorzuziehen.

- Keycloak: nur exakt identifizierte veraltete Nicht-Admin-Testidentitäten nach Prüfung von App-Zuordnungen, Service-Accounts, Federationsverknüpfungen und Admin-Redundanz löschen. Keine Realm-Löschung.
- MinIO: nur zweifelsfrei unreferenzierte Objekte nach Abgleich mit dem aktuellen App-DB-Snapshot, Objektversionen und Retention entfernen. Bucket und Policy erhalten.
- Meilisearch: alte Dokumente gezielt entfernen oder DEV-Indizes neu aufbauen, **Settings zuvor sichern**. Keine API-Key-Löschung.
- Redis: neue Queues/Locks vor jeder Löschung prüfen. Kein unbedachtes `FLUSHALL`; erneutes `FLUSHDB` nur bei eindeutig isolierter DEV-DB und ausdrücklich bestätigter Aktion.
- Mailpit: nach privatem Backup ausschließlich historische DEV-Nachrichten löschen, nicht SMTP-/Service-Konfiguration.

Die ursprüngliche Freigabe zum **Anwendungsdatenbankreset** in PR #141 deckt diese zusätzlichen Dienstlöschungen nicht automatisch ab. Nach Vorlage konkreter, bestätigter Objektsummen und Löschmengen eine gesonderte Freigabe einholen. STAGING/PROD bleiben unberührt.

## Verifikation nach einer späteren Bereinigung

- Dienste gesund; Keycloak-Admin-Login und DEV-Auth-Flow technisch intakt; keine ungewollten neuen App-User.
- MinIO-Buckets verfügbar; erwartete Objektzählung und Zugriff geprüft.
- Meilisearch-Abfrage und Index-/Settings-Status geprüft.
- Redis-/BullMQ-Zählung stabil ohne ungewollte wiederkehrende Jobs; DEV-News- und Sport-Scheduler bleiben ausgeschaltet.
- Mailpit-Zähler leer, SMTP-Dienst verfügbar.
- Vollständige App-DB-Inventur erneut; Snapshot und GitHub-Actions-Nachweis mit exakt zugehörigem Commit dokumentieren.
- APA-/OTS-Akzeptanztest muss bei ausgeschaltetem Scheduler den **deaktivierten Zustand** bestätigen, statt aktiv laufende Importe zu fordern. Die echte Import-Abnahme bleibt ein separater expliziter Test.

## Nächste Umsetzung

Ein DEV-only, gegen exakten Commit und Umgebung abgesicherter Read-only-Inventurjob mit sicheren aggregierten Ausgaben muss vor Löschentscheidungen in CI integriert und nach erfolgreicher Prüfung auf dem DEV-Host ausgeführt werden. Bis dahin alle fünf Live-Inventurwerte als **unbekannt** behandeln.
