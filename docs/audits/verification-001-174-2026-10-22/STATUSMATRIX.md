# Statusmatrix 001–174 – unabhängige Entwicklungsverifikation

Zur Freigabe. `develop` @ `17693e9ca3e51d8b13161be90a47a7d3491ad164`. Stand 22.10.2026 UTC.

**Bewertungsregeln:** DONE erfüllt den konkreten Aufgabenscope mit technischem Nachweis. Modell-/Vertrags-/Dokumentaufgaben werden in ihrem engen Scope beurteilt; DONE eines Modells bedeutet keine fertige Fachfunktion. Bei vertikalen Features gelten zusätzlich Fehler/Permissions/UI/Loading/Empty/Error/Mobile/Staging/Dokumentation der Masterplan-DoD. Fehlende Browser-/Stagingabnahme verhindert deren DONE; sie wird nicht als bewiesener fehlender Code ausgegeben. PARTIAL umfasst vorhandene ausführbare Teilfunktion oder vorbereitete, aber nicht abgenommene Konfiguration. TODO bedeutet kein ausführbarer Featureanteil; UNKNOWN bedeutet unprüfbarer tatsächlicher Zustand. BLOCKED wäre eine konkrete Abhängigkeit, die die Arbeit verhindert; hier ist kein kompletter Auftrag ausschließlich extern blockiert.

**Verteilung:** {'TODO': 6, 'DONE': 42, 'PARTIAL': 124, 'UNKNOWN': 2}. Keine gewichtete Fortschrittsquote.

Tests unter „Repositorytests“ wurden in den jeweils vollständigen API-/Worker-/Validation-/Webläufen ausgeführt; Dateinamen „integration“ implizieren keine echten Infrastrukturzugriffe. Mehrere Tests mocken DB/JWT. I01–I20 sind die zusätzlich außerhalb des Repositorys ausgeführten, isolierten Prüfgruppen; Details und Grenzen in [PRUEFUNGEN.md](PRUEFUNGEN.md). Drei davon reproduzieren Defekte und sind keine bestandenen Produktabnahmen. Globale Gates/Builds ersetzen keine fachlichen Einzeltests.

| ID | Aufgabe | Status | Funktion/Implementierung | Fehlende Funktion | Fehlender Nachweis |
|---|---|---|---|---|---|
| [001](#task-001) | MVP Dokument erstellen | TODO | README enthält Produktabriss. | Gefordertes MVP-Dokument mit Zielgruppe, Scope, Nicht-MVP und Monetarisierung fehlt. | Keine Dokumentabnahme. |
| [002](#task-002) | Community Konzept dokumentieren | TODO | Community-Datenmodelle vorhanden. | Verbindliches Communitykonzept einschließlich Moderationsregeln fehlt. | Keine Produktfreigabe dokumentiert. |
| [003](#task-003) | Personalisierungskonzept dokumentieren | TODO | Personalisierungs-Code vorhanden. | Eigenständiges Konzept mit Auswahl-, Branding- und Rankingregeln fehlt. | Keine Konzeptfreigabe. |
| [004](#task-004) | technische Architektur dokumentieren | TODO | Compose und README beschreiben Teile des Stacks. | Gefordertes Systemdokument mit Datenflüssen und Netz-/Environmentarchitektur fehlt. | Keine Architekturabnahme. |
| [005](#task-005) | Architecture Decision Records einführen | TODO | Kein ADR-Verzeichnis im aktuellen Dateiinventar. | ADRs zu Architektur, Keycloak, Datenhoheit und Umgebungen fehlen. | Keine Entscheidungsprotokolle. |
| [006](#task-006) | Git Repository prüfen / erstellen | DONE | Git, Remote, Ignore, README und Branchkonvention vorhanden; develop/Commit geprüft. | — | — |
| [007](#task-007) | pnpm Workspace konfigurieren | DONE | Workspace apps/* und packages/*; frozen Install erfolgreich. | — | — |
| [008](#task-008) | Turborepo konfigurieren | DONE | Turbo dev/build/lint/typecheck/test konfiguriert; sieben Builds frisch erfolgreich. | — | — |
| [009](#task-009) | Shared Config Package | DONE | Shared TypeScript-, ESLint-, Prettierkonfiguration mit Packageexports; Checks laufen. | — | — |
| [010](#task-010) | Environment Separation definieren | PARTIAL | Basis und drei Compose-Overlays; unterschiedliche Pfade und Envdateien vorgesehen. | Kein bestätigter fehlender Konfigurationsbaustein; x-kurvenfunk-environment.env_file ist nur Metadatum, Skripte müssen --env-file setzen. | Drei laufende getrennte Umgebungen/Credentials nicht geprüft. |
| [011](#task-011) | Docker Projektnamen definieren | DONE | Drei unterschiedliche Compose-Projektnamen, keine festen container_name. | — | — |
| [012](#task-012) | VPS Persistenzstruktur erstellen | UNKNOWN | Compose referenziert getrennte /srv/kurvenfunk-Pfade. | Kein VPS-Zustand aus Repository ableitbar. | Existenz/Persistenz/Trennung auf Zielhosts unbekannt; kein Zugriff vorgenommen. |
| [013](#task-013) | Dateirechte definieren | PARTIAL | Owner-/Gruppen-/Secret-Rechte dokumentiert; chmod in Betriebsskripten. | Keine aus Code bestätigte Rechteverletzung. | Tatsächliche Hostrechte nicht geprüft. |
| [014](#task-014) | Docker Networks erstellen | PARTIAL | frontend/backend-Netze; DB/Redis ohne Hostports, DEV-Meili nur Loopback. | Kein Codebeleg für öffentlich exponierte DB; Netzdefinition allein ist kein Expositionstest. | Zielnetz-/Tunnelisolation und Restart fehlen als Nachweis. |
| [015](#task-015) | PostgreSQL DEV | PARTIAL | Postgres 17, Healthcheck und Persistenz konfiguriert; frische isolierte DB migriert und genutzt. | Keycloak-DB/User-Erzeugung nicht durch Basiscompose automatisiert sichtbar. | Compose-DEV mit Keycloak-DB, Persistenz nach Restart, Backup/Restore nicht vollständig geprüft. |
| [016](#task-016) | PostgreSQL STAGING | PARTIAL | Staging-Overlay mit eigenem Postgrespfad, Backup-Timer vorhanden. | Kein belegter Funktionsdefekt aus statischer Konfiguration. | Eigene Staging-Credentials, Laufbetrieb und Restore unbewiesen. |
| [017](#task-017) | PostgreSQL PRODUCTION vorbereiten | PARTIAL | Production-Postgres als separater Compose-Projekt-/Storagekontext vorbereitet. | Kein bestätigter Konfigurationsdefekt. | Infrastruktur-DoD einschließlich isolierter Start-/Restart-/Restoreprüfung offen; Production bewusst unberührt. |
| [018](#task-018) | Redis DEV | PARTIAL | Redis Passwort/AOF/256MB/noeviction/Healthcheck; echte Redis-Lua- und Queue-Nutzung erfolgreich. | Kein bestätigter Laufzeitdefekt im geprüften Slice. | Repository-Compose-Persistenz, Restart und SET/GET-Abnahme nicht vollständig ausgeführt. |
| [019](#task-019) | Redis STAGING | PARTIAL | Staging-Redis mit eigenem Projekt und Persistenzpfad konfiguriert. | Kein bestätigter Konfigurationsdefekt. | Eigene Credentials und Lauf-/Restartnachweis fehlen. |
| [020](#task-020) | Redis PRODUCTION vorbereiten | PARTIAL | Production-Redis übernimmt Limits/AOF und eigenen Pfad. | Kein bestätigter Konfigurationsdefekt. | Isolierte Konfigurations-/Containerabnahme offen; kein Produktionszugriff. |
| [021](#task-021) | Keycloak DEV | PARTIAL | Keycloak 26.6.3/Postgres/Healthcheck und Realm-Konfigurationsskripte vorhanden. | Realm-/Client-Bootstrap nicht vollständig deklarativ im Repository enthalten. | Kein realer Keycloak-Container/Client-/Redirect-/Origin-Test in diesem Audit. |
| [022](#task-022) | Keycloak STAGING | PARTIAL | Eigener Keycloak-Hostname/Compose-Projektkontext für Staging. | Kein belegter Defekt; externe Einstellungen unbekannt. | Benutzer-, Secret-, Redirecttrennung nicht ausgeführt geprüft. |
| [023](#task-023) | Keycloak PRODUCTION vorbereiten | PARTIAL | Production-Hostname und start-Konfiguration vorbereitet. | Vollständiger versionierter Realm-/Client-Export fehlt als reproduzierbare Vorbereitung. | Production bewusst nicht kontaktiert; isolierter Realmimport nicht getestet. |
| [024](#task-024) | Meilisearch DEV | PARTIAL | Meili-Container mit Masterkey, Healthcheck und Volume vorbereitet. | Testindex-/Suchfixture nicht als reproduzierbarer Prüfpfad vorhanden. | Kein Index-/Suchlauf in diesem Audit. |
| [025](#task-025) | Meilisearch STAGING | PARTIAL | Staging-Meili erhält getrennten Projekt-/Persistenzkontext. | Kein bestätigter Konfigurationsdefekt. | Eigener Index/Credentials/Laufbetrieb nicht geprüft. |
| [026](#task-026) | Meilisearch PRODUCTION vorbereiten | PARTIAL | Production-Meili separat konfiguriert. | Kein bestätigter Konfigurationsdefekt. | Isolierter Start-/Persistenz-/Restartnachweis offen. |
| [027](#task-027) | MinIO DEV | PARTIAL | DEV-MinIO mit Volume/Healthcheck/Loopbackports; S3-Abstraktion vorhanden. | MINIO_BUCKET-Variable allein provisioniert keinen Bucket; kein Init-Service im Compose. | Kein echter Bucket-/Upload-/Download-/Delete-Roundtrip. |
| [028](#task-028) | MinIO STAGING | PARTIAL | Staging-MinIO mit eigenem Datenpfad. | Bucket-Provisionierung nicht automatisiert nachgewiesen. | Storage- und Credentialisolation nicht getestet. |
| [029](#task-029) | Next.js Web App | PARTIAL | Next/TypeScript/AppRouter/Envparser/Healthroute/Dockerfile; Next-Build erfolgreich. | Kein fehlendes Grundgerüst gefunden. | Dockerimage-/Runtime-/Restart-Abnahme fehlt. |
| [030](#task-030) | NestJS API | PARTIAL | Nest Config, Zod-Pipes, Prefix, Errorfilter, Health; echte HTTP-App gestartet. | Nicht alle Eingaben validiert: öffentliche ungültige Media-ID erzeugt 500. | Dockerimage-/Containerabnahme und reguläres API-E2E-Gate fehlen. |
| [031](#task-031) | Worker Service | PARTIAL | BullMQ-Worker mit Shutdownhooks, Testjob und Dockerfile; echter Importjob verarbeitet. | Kein im Slice bestätigter Queue-Defekt. | SIGTERM-/Container-/Restartabnahme fehlt. |
| [032](#task-032) | Database Package | DONE | Prisma-Client generiert; Schema validiert, elf Migrationen auf leerer DB und Seed erfolgreich. | — | — |
| [033](#task-033) | Types Package | DONE | Geteilte Typen, Queuekonstanten und Providerverträge; keine ausführbaren Fachservices im Types-Package. | — | — |
| [034](#task-034) | Validation Package | DONE | Geteilte Zodschemas werden von API/Web konsumiert; 90 Validationtests bestanden. | — | — |
| [035](#task-035) | Logger Package | PARTIAL | Strukturierte Standardfelder und schlüsselbasierte rekursive Redaction vorhanden. | Freitext-/Error-/URL-Werte werden nicht inhaltlich redigiert; originalUrl enthält Querystrings. | Kein dediziertes Logger-Regressionssuite-/Log-Datenschutzgate. |
| [036](#task-036) | UI Package | PARTIAL | Wiederverwendbare Basis-UI und Tokenstyles; Build erfolgreich. | Kein eindeutig fehlender Basisbaustein gefunden. | Keine Komponenten-/Browser-/A11yabnahme. |
| [037](#task-037) | Environment Validation | PARTIAL | Zodparser für Web/API/Worker mit kontrollierten Fehlern. | OTS-Key ist auch bei gewähltem OTS-Provider nur optional; falsche Providerkonfiguration wird nicht vollständig beim Start abgefangen. | Systematische Start-Negativtests fehlen. |
| [038](#task-038) | Secrets Management | PARTIAL | Ignore-Regeln und getrennte Env-/Secretskonvention dokumentiert. | Keine aktuelle Secretpreisgabe festgestellt; Rotation ist kein implementierter reproduzierbarer Workflow. | Vollständige Git-Historienprüfung/externes Secretbinding nicht erfolgt. |
| [039](#task-039) | Request ID System | PARTIAL | API-Request-ID-Middleware, Queuepayload und Workercontext vorhanden; Diagnoseroute jetzt opt-in/lokal. | Web→API-Weitergabe nicht durchgängig vereinheitlicht. | Neue lokale Queueprobe prüft Import, keinen vollständigen Browser→API→Worker-Trace. |
| [040](#task-040) | Structured Logging | PARTIAL | Pretty in development, JSON sonst; strukturierte HTTP-/Jobereignisse. | Querystrings und Errorfreitext können sensible Werte enthalten. | Keine Redaction-Negativ-/Retentionabnahme. |
| [041](#task-041) | Healthchecks | PARTIAL | API /health/live und /health/ready mit echten DB/Redis geprüft; Web /health implementiert. | Workerhealth prüft nur Redis; keine eigene DB-Readiness des Workers. | Vollständige serviceübergreifende Ausfall-/Containerhealthabnahme fehlt. |
| [042](#task-042) | Queue Infrastruktur | DONE | Alle acht im Aufgabenwortlaut verlangten Queue-Namen definiert und in API/Worker registriert. | — | Consumer für Sports/Suche/Notifications/Moderation sind separate Aufgaben und hier kein Abnahmekriterium. |
| [043](#task-043) | Docker Compose finalisieren | PARTIAL | Alle Services separat in Compose adressierbar. | Kein bestätigter Strukturdefekt. | Nicht alle Compose-Services einzeln gestartet/restartet; App-Dockerimages nicht gebaut. |
| [044](#task-044) | Cloudflare DEV Routing | PARTIAL | DEV-cloudflared/Tunnel und Hostnamekonfiguration vorhanden. | DNS-/Tunnelrouting liegt außerhalb des Codes. | Kein DEV-Domain-/Accessnachweis; keine externen Dienste kontaktiert. |
| [045](#task-045) | Cloudflare STAGING Routing | PARTIAL | Staging-cloudflared und Hostnamen vorbereitet. | Externe Routen-/Accessregeln unbekannt. | Kein Staging-Routingtest. |
| [046](#task-046) | Production Routing vorbereiten | PARTIAL | Production-Overlay mit Livehostnamen und Tunnel vorbereitet. | Externe Domainfreigabe nicht im Code nachweisbar. | Kein Produktionsrouting geprüft, entsprechend Auftrag. |
| [047](#task-047) | CI Pipeline | PARTIAL | CI führt Install/Format/Prisma/sharedBuild/Lint/Typecheck/Test/Build aus. | Webtestliste lässt 22 Tests aus; API-E2E wird nicht ausgeführt; App-Typechecks fehlen im Turbo-Gate. Separater Worker-tsc scheitert an fehlendem trustedForAutoPublish in Testfixture; keine echte DB/Redis-Fachsuite in CI. | Lokale Gates bestanden, aktueller GitHub-CI-Lauf nicht als Nachweis erhoben. |
| [048](#task-048) | DEV Deployment | PARTIAL | develop-Push triggert DEV-Deploy nach CI; Script prüft Commit/Health. | Keine bestätigte zusätzliche Codelücke. | Deployment-/Host-/Restartnachweise nicht erhoben; kein Deployment ausgeführt. |
| [049](#task-049) | STAGING Deployment | PARTIAL | Staging-Script build→migrate→deploy→health→Shell-E2E vorhanden. | Shell-E2E prüft nur Infrastruktur/Realm, keine Produktabläufe. | Realer Stagingrelease nicht ausgeführt. |
| [050](#task-050) | PRODUCTION Deployment | PARTIAL | Manueller Workflow mit Bestätigung, main-Commitprüfung, Dump/Migration/Deploy/Smoke. | Kein Nachweis eines vollständigen Releasefreigabe-/Rollbackdrills. | Keine Produktion kontaktiert oder deployt. |
| [051](#task-051) | Rollback Konzept | PARTIAL | Rollbackscript mit aktuellem/vorherigem Commit und Wiederanlauf vorhanden. | Migrations-Rückwärtskompatibilität nicht durch Strategie/Test abgesichert. | Kein tatsächlicher Rollbackdrill. |
| [052](#task-052) | PostgreSQL Backup | PARTIAL | PG-Dumpskripte und getrennte Staging/Production-Timer vorhanden. | Kein bestätigter Skriptdefekt durch Syntaxprüfung. | Timerbetrieb, aktueller Dump und Wiederherstellbarkeit nicht getestet. |
| [053](#task-053) | Backup Rotation | PARTIAL | Rotation für Daily/Weekly/Monthly implementiert. | Kein bestätigter Defekt aus Quellprüfung. | Keine Fixtureprüfung zu Retention, Monatswechsel, beschädigten Backups. |
| [054](#task-054) | Keycloak Backup | PARTIAL | Keycloak-Export-/Backupscript und Timer vorhanden. | Kein bestätigter Skriptdefekt. | Aktuelle Realmexport-/Restore-Abnahme fehlt. |
| [055](#task-055) | Object Storage Backup Strategie | DONE | Eigenständige Objectstorage-Backupstrategie dokumentiert; Aufgabe verlangt Festlegung. | — | Praktische Kopie/Restore ist damit nicht als abgenommen ausgewiesen. |
| [056](#task-056) | Restore Scripts | PARTIAL | Postgres- und Keycloak-Restoreskripte mit Fehlerabbruch vorhanden. | Kein bestätigter Skriptdefekt. | Keine Ausführung mit aktuellem Backup in isolierter vollständiger Umgebung. |
| [057](#task-057) | Restore Test | UNKNOWN | Historischer Restorebericht vom 14.08.2026 vorhanden. | Kein aktueller Restorefehler nachgewiesen. | Historische Behauptung ohne aktuelle Artefakte nicht unabhängig bestätigt; frische Migration ist kein Restore. |
| [058](#task-058) | User Model | DONE | Userfelder/Defaults/Relationen migriert; realer User-Sync bestätigt UNSET und incomplete. | — | — |
| [059](#task-059) | Profile Model | DONE | Profile ist getrennte 1:1-Tabelle mit öffentlichem Namen/Bio/Avatarrelation; Migration erfolgreich. | — | — |
| [060](#task-060) | User Status Model | DONE | Enum ACTIVE/LIMITED/BANNED und Statusprüfung in Auth/Permissions; echte HTTP-Negativ-/Votingprobe. | — | Sanktionsvergabe und Sessionrevoke sind andere Aufgaben, durch dieses Modell nicht behauptet. |
| [061](#task-061) | User Roles Model | DONE | Rollenenum und getrennte UserRoleAssignment mit Ablauf/Grantrelation; Migration/Permissionssuites grün. | — | — |
| [062](#task-062) | Club Model | DONE | Club mit Namen/Slug/Logo/Website/active und äquivalenten Farb-/RGBAfeldern; Seed erfolgreich. | — | primaryColor etc. heißen im aktuellen Modell color1Hex/color2Hex/color3Hex/accentColorHex; funktionale Zuordnung explizit. |
| [063](#task-063) | Club Alias Model | DONE | ClubAlias mit Clubrelation/Index migriert; Aliasfixtures in Seed und Matchingtests. | — | — |
| [064](#task-064) | Neutral Preference | DONE | Explizites UNSET/CLUB/NEUTRAL; keine Gleichsetzung von NULL und Neutral; HTTP-Onboarding bestätigt. | — | — |
| [065](#task-065) | Competition Model | DONE | Competition unabhängig von Season mit Slug/Name/Typ und Relationen; Migration/Seed grün. | — | — |
| [066](#task-066) | Season Model | DONE | Season mit Wettbewerb und Stagebezug; Seed enthält Saisons und Stages. | — | — |
| [067](#task-067) | Match Model | DONE | Match mit Heim/Auswärts/Kickoff/Wettbewerb/Saison/Spieltag/Status/Score; Seedspiele persistiert. | — | — |
| [068](#task-068) | Standing Model | DONE | Standing-Zeilenmodell mit Wettbewerb-/Saison-/Club-/Stagebezug und Zahlenfeldern; Migration und Seed grün. | — | Keine Berechnungsfunktion durch Modell-DONE behauptet. |
| [069](#task-069) | Article Model | DONE | Article mit Autoren/Quelle/Kategorien/Tags/Clubs/Wettbewerb/Spiel; Migration und reale Datenzugriffe. | — | — |
| [070](#task-070) | Media Model | DONE | Media mit Storagekey/URL/MIME/Größe/Copyright/Quelle/Alttext migriert. | — | Kein Storage-Roundtrip allein durch Modellnachweis behauptet. |
| [071](#task-071) | Comment Model | DONE | Comment/CommentRevision mit Artikel/Autor/Parent/Status/Softdelete; echte Edit-/Reply-/Deleteprobe. | — | — |
| [072](#task-072) | Reaction Model | PARTIAL | ReactionType enthält LIKE und zusätzliche UPVOTE/DOWNVOTE; LIMITED-Permission real geprüft. | API akzeptiert ausschließlich UPVOTE/DOWNVOTE; gefordertes MVP-LIKE nicht im vertikalen Vertrag umgesetzt. | Produktentscheidung zur Abweichung fehlt. |
| [073](#task-073) | Forum Model | DONE | Alle sechs geforderten Forumentitäten samt Relationen im migrierten Schema. | — | Forumfunktionen bleiben außerhalb dieses Modellauftrags unimplementiert. |
| [074](#task-074) | Moderation Report Model | DONE | ModerationReport referenziert Kommentar/Post/User und Moderator; SQL migriert; Kommentarreport real gespeichert. | — | Post-/Userreportendpoints werden hierdurch nicht als fertig bezeichnet. |
| [075](#task-075) | Yellow Card Model | DONE | ModerationCard enthält YELLOW/RED, Ziel/Moderator/Grund/Notiz/Inhaltsreferenz/Zeit/Ablauf; Migration grün. | — | Vergabe/Benachrichtigung aus 174 wird nicht durch Modell erfüllt. |
| [076](#task-076) | Sanction Model | DONE | Sanction getrennt von Card; benötigte Sperrtypen und Gültigkeits-/Widerrufsfelder migriert. | — | Keine technische Durchsetzung beliebiger Sanktionen durch Modell-DONE behauptet. |
| [077](#task-077) | IP Block Model | DONE | IPBlock mit Hash/Grund/Ersteller/Zeit/Gültigkeit/active im migrierten Schema. | — | — |
| [078](#task-078) | Audit Log Model | PARTIAL | AuditLog-Modell mit Akteur/Ziel/Ereignis/Metadaten vorhanden und migriert. | Anforderung kritische Admin-/Moderationsaktionen nachvollziehbar speichern wird von den bestehenden Mutationen nicht durch Auditwrites erfüllt. | Kein tatsächlicher Auditdatensatzfluss geprüft; Schema allein reicht für den Speicherauftrag nicht. |
| [079](#task-079) | Notification Model | DONE | Notification und NotificationPreference pro Benutzer mit Read-/Typ-/Inhaltsdaten migriert. | — | Keine Zustellung oder Notification-UI durch Modell-DONE behauptet. |
| [080](#task-080) | Import Models | DONE | Provider/ImportJob/ImportRecord/RawPayload/EntityMatch migriert und im echten Import genutzt. | — | — |
| [081](#task-081) | Prisma Schema erstellen | DONE | Alle zuvor geforderten Domains in validiertem, generiertem und erfolgreich migriertem Schema. | — | — |
| [082](#task-082) | Initial Migration | PARTIAL | Elf Migrationen einschließlich Initialmigration auf leerem isoliertem PostgreSQL erfolgreich. | Kein lokaler Migrationsfehler. | Explizit verlangter Staging-Migrationsnachweis fehlt. |
| [083](#task-083) | Seed System | DONE | Seed legt Wettbewerbe/Saisons/28 Clubs/Farben/Aliases/3 Testuser/18 Artikel/9 Spiele an; frische Ausführung erfolgreich. | — | Nur lokale Testdaten; keine Produktivbereinigung als zusätzliches Kriterium erfunden. |
| [084](#task-084) | NestJS Module anlegen | DONE | Module der Backendstruktur angelegt; Wortlaut erlaubt ausdrücklich zunächst leere Module. | — | Fachfunktionalität leerer Module separat bewertet. |
| [085](#task-085) | API Versionierung | DONE | main setzt api/v1; echte HTTP-Feature-/Healthrouten dort erreichbar. | — | Swagger /docs ist eine separate Dokumentationsroute. |
| [086](#task-086) | Response Standard | PARTIAL | Responseinterceptor kapselt data/meta/requestId; reale HTTP-Probe nutzt denselben Interceptor. | Keine belegte Vertragslücke im geprüften Slice; Binärmedien sind bewusst roh. | Keine systematische Vertragsabnahme aller Endpoints und Staging. |
| [087](#task-087) | Error Standard | DONE | Zentraler Filter mit code/message/requestId, 500-Masking; Filtertests und echte Fehlerantworten geprüft. | — | — |
| [088](#task-088) | Validation | PARTIAL | Bodies/Queries überwiegend per Zod validiert; UUID-Pipes bei Kommentaren. | Ungültige öffentliche Media-UUID erzeugt 500 statt 400; einige redaktionelle IDs ebenfalls ungeprüft. | Vollständige Endpoint-Negativmatrix fehlt. |
| [089](#task-089) | Pagination | PARTIAL | Cursorparser und Paging für Artikel/Kommentare/Medien/Importjobs implementiert. | Unbegrenzte redaktionelle Artikelliste; kein durchgängiger Standard für alle großen Listen. | Reale Kommentar-Cursorprobe deckt statische Seiten ab, keine konkurrierenden Änderungen. |
| [090](#task-090) | Filtering | DONE | Zentrale wiederverwendbare Filterparser und Unitprüfungen bestehen. | — | Kein universeller Filter für jeden Endpoint im schmalen Standardauftrag verlangt. |
| [091](#task-091) | Sorting | DONE | Zentraler Sortierparser mit Whitelist und Tests besteht. | — | — |
| [092](#task-092) | Swagger / OpenAPI | PARTIAL | Swagger optional konfiguriert; Generator und docs/openapi.json vorgesehen. | Vollständige Fachschemas/Responses nicht überall annotiert. | Explizite Stagingbereitstellung/Schutz/Vertragsabnahme nicht geprüft. |
| [093](#task-093) | Keycloak ↔ API | PARTIAL | Realer jose/JWKS/RS256-Pfad prüft Signatur/Issuer/Audience/Expiry; HTTP-Negativfälle erfolgreich. | Kein Defekt in geprüfter Tokenprüfung. | Test-JWKS ist kein echter Keycloak; Rotation und Staging nicht geprüft. |
| [094](#task-094) | User Sync | PARTIAL | Subject-Upsert und Standardpräferenzen real durch signierten HTTP-Request persistiert. | Kein Defekt im geprüften Erstlogin-Slice. | Gleichzeitige Erstlogins, echter IdP-Flow und Staging unbewiesen. |
| [095](#task-095) | E-Mail Registrierung | PARTIAL | Registrierung/verifyEmail/resetPassword per Keycloakscript vorbereitet; Web delegiert Anmeldung. | Kein vollständiger reproduzierbarer Realm-/SMTP-Testaufbau im Repository. | E-Mail+Passwort→Mail→Bestätigung→Login→Onboarding nicht real geprüft. |
| [096](#task-096) | E-Mail Verifizierung | PARTIAL | email_verified=false per echtem JWT/HTTP abgelehnt; UI-Fehlerbehandlung vorhanden. | Kein belegter Defekt des API-Verifygates. | Mailzustellung/Bestätigungslink/anschließende Browserweiterleitung offen. |
| [097](#task-097) | Login mit E-Mail | PARTIAL | KeycloakJS-Login und BANNED/LIMITED-Behandlung in API/UI vorhanden. | Keine Tokenrefresh-/Expirystrategie im AuthProvider; React-Token kann veralten. | Passwortfehler/Nichtexistenz/echter KC-Login/Sessionablauf im Browser nicht geprüft. |
| [098](#task-098) | Google Login | PARTIAL | Google-idpHint und Brokerkonfiguration vorhanden. | Kein im Repository vollständig provisionierter Google-Testprovider. | OAuth-/Googleidentität und deren Emailverified-Vertrag nicht real geprüft. |
| [099](#task-099) | Logout | PARTIAL | Lokaler State wird gelöscht und Keycloak logout aufgerufen. | Kein im Code belegter Defekt des einfachen Logoutpfads. | SSO-/Browser-/Keycloak-Sessionende nicht getestet. |
| [100](#task-100) | Password Reset | PARTIAL | Keycloakscript aktiviert resetPasswordAllowed. | Kein Nachweis fehlender Keycloak-Resetfunktion; sie wird an den IdP delegiert. | Mail-/Einmallink-/Ablauf-/Passwortwechsel-Abnahme fehlt. |
| [101](#task-101) | Account Linking | PARTIAL | duplicateEmailsAllowed=false und First-Broker-Linking-Flow konfiguriert. | Keine bestätigte Dublettenfreiheit aus Script allein ableitbar. | Reales Email+Google-Linking inklusive Übernahme-/Fehlerfälle fehlt als Nachweis. |
| [102](#task-102) | Onboarding Gate | PARTIAL | Client-OnboardingGate leitet incomplete Nutzer um. | Server erlaubt incomplete ACTIVE-Usern Kommentarerstellung; HTTP 201 real bestätigt. | Browserweiterleitung und Ausnahmen noch nicht E2E abgenommen. |
| [103](#task-103) | Nickname Auswahl | PARTIAL | Länge/Zeichen/fünf reservierte Namen; case-insensitiver Index; realer Konflikt 409. | Verbotene Begriffe über reservierte Namen hinaus nicht implementiert. | Browser-/Konkurrenztest fehlt. |
| [104](#task-104) | Nickname Live Validation | PARTIAL | Availabilityendpoint und Debounce/AbortController im UI vorhanden. | Kein bestätigter Funktionsdefekt. | Echte UI-Rennen/Abbrüche und Mobile/Staging nicht geprüft. |
| [105](#task-105) | Vereinsauswahl | PARTIAL | Aktive Clubs mit Logos/Name und Neutraloption im UI. | Kein bestätigter Defekt der Auswahlfunktion. | Kein authentifizierter Browser-/Mobile-/Stagingdurchlauf. |
| [106](#task-106) | Neutral Auswahl | DONE | Neutral explizit im Modell und diskriminierten Schema; reale Completion speichert NEUTRAL ohne Club. | — | — |
| [107](#task-107) | Onboarding abschließen | PARTIAL | HTTP-Completion speichert Nickname/Preference/Completion; UI refresh/Redirect implementiert. | Servergate aus 102 fehlt außerhalb Completion. | Vollständiger Login→Onboarding→personalisierte Seite im Browser offen. |
| [108](#task-108) | Vereinswahl später ändern | PARTIAL | Reale HTTP-Änderung CLUB→NEUTRAL mit DB-Nachweis erfolgreich; SettingsUI vorhanden. | Kein bestätigter Persistenzdefekt. | Theme-/Feedwechsel und Mobile/Staging im Browser nicht geprüft. |
| [109](#task-109) | Club Theme System | PARTIAL | Farb-/Kontrastmapping zu CSS-Themeproperties; Helpertests grün. | Kein bestätigter Tokenmappingdefekt. | Alle Clubfarben/Kontraste/Komponenten im Browser nicht abgenommen. |
| [110](#task-110) | Default Kurvenfunk Theme | PARTIAL | Standardtheme für Gast/NEUTRAL/UNSET mit getesteten Helperdefaults. | Kein bestätigter Defaultdefekt. | Gerenderte Gast-/Neutral-/UNSET-Zustände nicht im Browser abgenommen. |
| [111](#task-111) | Personalized Club Theme | PARTIAL | Clubtheme setzt CSSvariablen auf Grundlage der Präferenz; Komponenten konsumieren Tokens. | Kein bestätigter Defekt im Mapping. | Realer Login-/Clubwechsel-/Kontrast-/Mobile-/Stagingtest fehlt. |
| [112](#task-112) | News Priorisierung | PARTIAL | API priorisiert Lieblingsclub, Wettbewerb, allgemeine News statt reinem Clubfilter; Unitfälle vorhanden. | Keine fehlende Rankingstufe festgestellt. | Reale repräsentative Rankingfixtures, Browser und Staging fehlen. |
| [113](#task-113) | Neutral News Ranking | PARTIAL | Neutralranking mit Top/Recent/Competition ohne Lieblingsclubfilter vorhanden. | Kein bestätigter Rankingdefekt. | Repräsentative DB- und Browserabnahme fehlt. |
| [114](#task-114) | Personalized Startpage | PARTIAL | Fan-/Neutralstartseite und echte News-API integriert. | Spiele/Ergebnisse/Tabelle/Diskussionen werden weiter aus Mockdaten bezogen. | Kein vollständiger authentifizierter Produkt-/Mobile-/Stagingflow. |
| [115](#task-115) | Design Tokens | PARTIAL | CSS-/TS-Tokens für Farben/Typografie/Spacing/Border/Radius/Breakpoints/Icons vorhanden. | Keine eindeutig fehlende Tokenkategorie; Icons sind Größen/Stroke-Konvention, kein vollständiger Iconsatz. | Visuelle/Theming-/A11y-/Mobileabnahme fehlt. |
| [116](#task-116) | UI Components | PARTIAL | Geforderte Form-/Display-/Overlay-/Interaktionskomponenten samt Theme-CSS vorhanden. | Keine bestätigte fehlende Komponente aus Exportinventar. | Keine Keyboard-/Screenreader-/Komponentensuite. |
| [117](#task-117) | App Shell | PARTIAL | Header/Desktop-/Mobilemenü/Container/Footer/Usermenü/Clubtheme implementiert. | Kein bestätigter Shell-Funktionsdefekt. | Responsive Auth-/Keyboard-/Mobile-/Stagingnachweis fehlt. |
| [118](#task-118) | Startseite Mock | PARTIAL | Beide ausdrücklich verlangten Mockvarianten implementiert; Mockdaten sind hier beabsichtigt. | Kein API-Anschluss für diese reine Mockaufgabe verlangt. | Interaktive/visuelle Fan-/Neutral-/Mobileabnahme fehlt. |
| [119](#task-119) | Newsübersicht | PARTIAL | News-API mit Cards, Pagination und Club-/Wettbewerbsfilter angeschlossen. | Kein aus Code bestätigter fehlender Filter. | Browser-/Mobile-/Filterseitenwechsel-Abnahme fehlt. |
| [120](#task-120) | Artikelseite | PARTIAL | Artikelansicht zeigt Inhalt/Metadaten/Clubs/Tags und Kommentarbereich. | Kein im statischen Slice fehlendes Kernelement bestätigt. | Editor→öffentliche Seite→Kommentar nicht als kompletter Browserflow geprüft. |
| [121](#task-121) | Vereinsseite | PARTIAL | Clubstammdaten aus API, Tabs und Bereichslayout vorhanden. | News/Spiele/Tabelle/Diskussionen aus getClubPageMockData; kein echtes Forum. | Browser-/Mobileabnahme und echte Bereichsintegration fehlen. |
| [122](#task-122) | Spielseite | PARTIAL | Matchdetail mit Teams/Score/Status/Datum/Wettbewerb/News vorhanden. | Spieldiskussion ist kein vollständig angebundener Communityflow. | Browser-/Mobile- und echte Importdatenprüfung fehlen; Import selbst ist andere Aufgabe. |
| [123](#task-123) | Tabelle | PARTIAL | DB-LeseAPI, Tabellenlayout, Lieblingsclubhighlight und Vorschau/Fallback vorhanden. | Fallbackdaten können echte Fehler verdecken; kein echter laufender Datenversorgungsnachweis. | Desktop/Mobile-Highlightabnahme fehlt; Tabellenberechnung ist separater späterer Auftrag. |
| [124](#task-124) | Spielplan | PARTIAL | API-Spielplan mit Spieltagswahl/Favoritenmarkierung und Vorschaufallback. | Fallback bei Datenproblemen fachlich nicht klar vom Produktbetrieb getrennt. | Browser-/Mobileabnahme fehlt; Liveimport nicht durch LeseUI behauptet. |
| [125](#task-125) | Profilseite | PARTIAL | Eigene Profilseite mit Nickname/Bio/Avatar/Club/Aktivitätszählern und API vorhanden. | Keine belegte vollständige öffentliche Profil-/Avatarbedienung. | Echter Profil-/Avatarbrowserflow und Staging fehlen. |
| [126](#task-126) | User Settings | PARTIAL | Profil- und Clubsettings funktionieren API-seitig; Account-/Sessionsabschnitte vorhanden. | Datenschutz/Notifications sind explizit geplant; Sessions zeigt statische aktuelle Session statt Liste/Management. | Browser-/Stagingabnahme fehlt. |
| [127](#task-127) | Admin Layout | PARTIAL | Alle verlangten Admin-Navigationspunkte vorhanden. | Keine zentrale Rollenprüfung im Adminlayout; mehrere Fachseiten Platzhalter. | Kein Nachweis unberechtigter API-Mutation; Menüanzeige allein ist kein API-Bypass. Browser-/Stagingabnahme fehlt. |
| [128](#task-128) | Loading States | PARTIAL | Skeletons und Loadingkomponenten für Kernseiten vorhanden. | Keine aus Inventar allein behauptete vollständige Zustandsabdeckung. | Langsame/abgebrochene Requests nicht systematisch im Browser geprüft. |
| [129](#task-129) | Empty States | PARTIAL | EmptyState und fachliche Leerhinweise vorhanden. | Keine vollständig nachgewiesene Abdeckung jeder Liste. | Leere Fixtures pro Kernseite/Browser/Mobile fehlen. |
| [130](#task-130) | Error States | PARTIAL | 403/404/429/500-Ansichten und Errorboundary vorhanden. | Vorhandene UI ist kein Beleg korrekter HTTPstatus-/Recoverysemantik. | Fehlerseitenstatus, Retry/Navigation und Mobile/Staging nicht systematisch geprüft. |
| [131](#task-131) | Article CRUD | PARTIAL | CRUD/Archive/Softdelete/Restore in Service/API/UI; realer HTTP-/DB-Durchlauf geprüft. | Keine durchgängige Auditspur redaktioneller Mutationen. | Browser-/Mobile-/Stagingworkflow fehlt. |
| [132](#task-132) | Publication Workflow | PARTIAL | DRAFT/REVIEW/SCHEDULED/PUBLISHED/ARCHIVED; Permissionchecks und reale Review/Publishtransition geprüft. | Keine durchgängigen Fach-/Auditevents der Transitionen. | Vollständiger UI-/Worker-/Stagingflow und verbotene Transitionen nicht real abgenommen. |
| [133](#task-133) | Article Editor | PARTIAL | Tiptap mit Text/Heading/Link/Listen/Zitat/Bild; serverseitiges Inhaltsschema vorhanden. | Kein bestätigter fehlender Editorbaustein. | Echte Tastatur-/Paste-/Bild-/Security-/Browserabnahme fehlt. |
| [134](#task-134) | Kategorien | PARTIAL | Category CRUD/Validation/Admin und Artikelzuordnung vorhanden. | Kein bestätigter fehlender CRUDpfad. | Echter vollständiger CRUD-/UI-/Staginglauf fehlt. |
| [135](#task-135) | Tags | PARTIAL | Tag CRUD/Validation/Admin und Artikelzuordnung vorhanden. | Kein bestätigter fehlender CRUDpfad. | Echter vollständiger CRUD-/UI-/Staginglauf fehlt. |
| [136](#task-136) | Club Assignment | PARTIAL | Mehrfachclubzuordnung im Schema/Validation/Service/Editor; relationale HTTP-Erstellung geprüft. | Kein fehlender Mehrfachvertrag festgestellt. | Mehrere Clubs gleichzeitig plus personalisierter Feed im Browser nicht real abgenommen. |
| [137](#task-137) | Competition Assignment | PARTIAL | competitionId in Schema/Validation/Service/Editor; echte HTTP-Erstellung mit Wettbewerb geprüft. | Kein bestätigter fehlender Zuordnungspfad. | Fehlende/falsche Wettbewerbe und Browser-/Stagingfälle nicht vollständig geprüft. |
| [138](#task-138) | Match Assignment | PARTIAL | matchId in Schema/Validation/Service/Editor; echte HTTP-Erstellung mit Spiel geprüft. | Kein bestätigter fehlender Zuordnungspfad. | Inkonsistente Spiel-/Wettbewerbskombination und Browser-/Stagingfälle offen. |
| [139](#task-139) | Media Upload | PARTIAL | S3-Storageabstraktion, Multipartgrenze 10MB und MIME-Allowlist implementiert. | Bildbytes werden nicht gegen Signatur/Dekodierung geprüft; Client-MIME reicht. | Kein echter MinIO/R2-Roundtrip und Browserupload. |
| [140](#task-140) | Media Library | PARTIAL | Media Library mit Metadaten und Usagezählung vorhanden. | Usage zählt Profile/Clubs/Leadbilder, keine OG-Verwendungen. | Echte Storage-/UI-/Delete-/Errorabnahme fehlt. |
| [141](#task-141) | SEO Fields | PARTIAL | Slug/seoTitle/seoDescription/canonicalUrl/ogImage im Modell/Editor und generateMetadata. | Kein aus Quellprüfung bestätigtes fehlendes Feld. | Crawler-/OG-/Canonical-/Browsernachweis fehlt. |
| [142](#task-142) | Revisions | PARTIAL | Revisionen speichern Inhaltssnapshots; echte Articleupdateprobe erzeugt Revision. | Expliziter Änderungsakteur fehlt im Revisionsmodell. | History-/Concurrency-/Frontend-/Stagingabnahme fehlt. |
| [143](#task-143) | Scheduled Publishing | PARTIAL | Due-Scanner mit konditionalem Update; echte DB-Probe publiziert einen fälligen Artikel genau einmal. | Keine Audit-/Reindex-/Notificationfolgen implementiert. | Direkter Serviceaufruf beweist Übergang, nicht den kompletten zeitgesteuerten UI→Queue→Workerflow; Staging offen. |
| [144](#task-144) | Provider Interface | DONE | NewsProvider-Interface mit Fähigkeiten, Fetch, Cursor und Trustvertrag; beide Adapter implementieren es. | — | — |
| [145](#task-145) | Fake Provider | PARTIAL | Fakeprovider verarbeitet fünf Records real über BullMQ/Worker/DB; zweiter Lauf dedupliziert. | Vier Records gehen mit aktuellen Seedaliases in Review; Gesamtprozess endet dort ohne redaktionelle Übernahme. | Admin-/Browser-/Stagingabnahme fehlt. |
| [146](#task-146) | Scheduler | PARTIAL | Providerbezogene BullMQ-Schedulerregistrierung und Tests vorhanden. | Kein bestätigter Schedulerdefekt. | Auditjob manuell eingereiht; periodisches Abrufen über reale Zeitintervalle nicht geprüft. |
| [147](#task-147) | Import Queue | PARTIAL | news-import registriert; echte Queue verarbeitet zwei vollständige Fakeimportjobs. | Kein bestätigter Queuefehler im erfolgreichen Slice. | Restart-/Ausfall-/Stagingabnahme fehlt. |
| [148](#task-148) | Raw Payload | PARTIAL | Originalpayloads/Hashes/Record-/Jobbezug real gespeichert; fünf pro Lauf. | Kein bestätigter Persistenzdefekt im Slice. | Replay-/Retention-/Fehler-/Stagingabnahme fehlt. |
| [149](#task-149) | Normalization | PARTIAL | Fake/OTS-Normalizer und Persistenzpfad; echte Fakepipeline normalisiert Records. | Kein bestätigter Fake-Normalisierungsdefekt. | OTS-real/Fehlerqualität/Admin-/Stagingnachweis fehlt. |
| [150](#task-150) | Validation | PARTIAL | Pflichtfeld-/Qualitätsprüfung und Fehlerstatus mit Unitfällen; echte gültige Fakefixtures passieren. | Kein bestätigter Defekt bei geprüften gültigen Records. | Ungültige Providerrecords nicht real durch DB/Queue-Ende gefahren; Staging fehlt. |
| [151](#task-151) | Duplicate Detection | PARTIAL | ProviderID/URL/Hash/Titel/Similarity implementiert; zweiter echter Import markiert fünf DUPLICATE. | Titelvergleich auf 200 Kandidaten begrenzt; keine starke einmalige Artikelzuordnung/Claim gegen Rennen. | Parallelitäts-/Abbruch-/Retryinvariante unbewiesen. |
| [152](#task-152) | Club Matching | PARTIAL | Aliasmatching und EntityMatchpersistenz vorhanden; echte Pipeline liefert Review und sicheren Treffer. | Keine fachlich freigegebene vollständige Aliasabdeckung; aktuelle Fakefixtures matchen nicht alle Seedclubs sicher. | Mehrdeutige Alias-/Browserreview-/Stagingabnahme fehlt. |
| [153](#task-153) | Competition Matching | PARTIAL | Wettbewerbsmatching und gespeicherte Matches vorhanden; Unitfälle grün. | Kein bestätigter Defekt aus aktuellem Slice. | Repräsentative mehrdeutige/fehlende Wettbewerbe in echter Pipeline ungetestet. |
| [154](#task-154) | Match Matching | PARTIAL | Matchmatching über Clubs/Wettbewerb/Datum und Confidence vorhanden. | Kein bestätigter fehlender Algorithmus. | Echte positive/mehrdeutige Spielmatchingfixtures und Staging fehlen. |
| [155](#task-155) | Confidence Score | PARTIAL | EXACT/HIGH/MEDIUM/LOW/UNKNOWN mit Reviewgate; Unitfälle und echter Pipelineeinsatz. | Kein bestätigter fehlender Scoretyp. | Fachliche Kalibrierung und alle Klassen durch reale Pipeline nicht abgenommen. |
| [156](#task-156) | Retry Logic | PARTIAL | Drei Versuche/exponentieller Backoff/Fehlerpersistenz implementiert. | Kein bestätigter Retrydefekt. | Reale Störung/Retry-Erschöpfung/Restart nicht getestet. |
| [157](#task-157) | Dead Letter Queue | PARTIAL | Deadletterqueue und Failed-Eventweitergabe nach Erschöpfung implementiert. | Kein bestätigter DLQdefekt. | Genau einmalige reale DLQaufnahme, Replay und Fehleralarme nicht geprüft. |
| [158](#task-158) | Import Admin | PARTIAL | Admin zeigt Provider/Jobs/Records/Duplikate/Fehler/Matchingprobleme über echte APIverträge. | Kein bestätigter fehlender Anzeigebereich. | Nach echtem Import nicht im authentifizierten Browser abgenommen; Staging fehlt. |
| [159](#task-159) | Review Workflow | PARTIAL | Reviewqueue mit Approve/Reject und Reviewer/Zeitpersistenz; echte DB-Freigabe ausgeführt. | Freigabe endet bei MATCHED/APPROVED; kein Folgejob oder Artikel entsteht. Quellprüfung bestätigt fehlenden Consumer. | Kompletter Review→Draft/Publishflow fehlt; kein Browser-/Stagingnachweis. |
| [160](#task-160) | Auto Publish | PARTIAL | Trustedflag und sichere Matches vor AutoPublish; echter Fakeimport erzeugt einen Artikel. | Keine eindeutige Record→Artikel-Claiminvariante gegen paralleles Publish; Race als Risiko, nicht reproduzierter Defekt. | Echte untrusted-/Race-/Retry-/Stagingabnahme fehlt. |
| [161](#task-161) | erster echter Newsprovider | PARTIAL | OTS-Adapter/Normalizer/Fehlerpfade und Unitfälle vorhanden; trusted=false. | Redaktioneller Übernahmeweg nach OTS-Review fehlt aus 159. | Kein Liveprovider-/Lizenz-/externes Zugangssignal; OTS nicht kontaktiert. |
| [162](#task-162) | Kommentar erstellen | PARTIAL | Echte HTTP-Kommentarerstellung mit DB und Redis funktioniert; LIMITED/BANNED-Guards vorhanden. | Onboardingcompletion serverseitig nicht erzwungen. | Browser-/Mobile-/Stagingflow fehlt. |
| [163](#task-163) | Antworten | PARTIAL | Echte HTTP-Antwort speichert Parentrelation; Status-/Artikel-/Permissionchecks implementiert. | Kein bestätigter Replydefekt im Slice. | LIMITED/BANNED-Replyvarianten und kompletter Browserbaum nicht real abgenommen. |
| [164](#task-164) | Comment Depth | PARTIAL | Parent/depth und UIbegrenzung auf fünf Ebenen vorhanden. | Kein bestätigter Defekt der sichtbaren Begrenzung. | Tiefer realer Baum, mobile Darstellung und Performance fehlen als Nachweis. |
| [165](#task-165) | Kommentar bearbeiten | PARTIAL | Eigener Kommentar editierbar; echte Fremdautorablehnung und Revision persistiert. | Kein bestätigter Ownershipdefekt. | Browsermarkierung/gleichzeitige Edits/Staging nicht getestet. |
| [166](#task-166) | Kommentar löschen | PARTIAL | Eigener Kommentar wird real softgelöscht; Tombstone-/Replydarstellung im Code. | Separat auditierte Moderatorenlöschung fehlt. | Browser-/Mobile-/Stagingabnahme fehlt. |
| [167](#task-167) | Voting / Reactions | PARTIAL | Votes mit Uniqueconstraints/Ownerregeln; real LIMITED auf fremden Kommentar erlaubt, BANNED blockiert. | UPVOTE/DOWNVOTE statt gefordertem MVP-Like; kein Vote-Ratelimit. | Browser-/Staging und parallele Votewechsel nicht vollständig geprüft. |
| [168](#task-168) | Kommentar Sortierung | PARTIAL | newest/oldest/popular im UI/API; alle drei real mit SQL ausgeführt. | Kein bestätigter Sortierdefekt bei statischen Fixtures. | Vote-/Deleteänderungen zwischen Seiten und Browserabnahme offen. |
| [169](#task-169) | Pagination | PARTIAL | Cursor mit Validierung, SQL-Rootpaging und Clientmerge; echte mehrseitige Probe für alle drei Sortierungen erfolgreich. | Kein aus Quellprüfung bestätigter Cursorfehler. | Nebenläufige Änderungen, tiefe Replygruppen und Browser-/Stagingabnahme fehlen. |
| [170](#task-170) | Reports | PARTIAL | Reportgründe/Details/Dedupe/Uniqueindex/UI; echter Report und Doppelreport409 bestätigt. | Moderationsbearbeitung fehlt; Report-Ratelimits fehlen. Andere Zieltypen sind Modell-/Folgeaufgaben. | Browser-/Stagingabnahme fehlt. |
| [171](#task-171) | Spam Protection | PARTIAL | Reale Redis-Lua-Reservation liefert Duplicate409/Cooldown429; Rate10/min und Linklimit2 im Code. | Keine bestätigte fehlende der vier geforderten Regeln; weitergehender IP-Schutz ist anderer Auftrag. | Echtes Ratefenster/Linklimit/Redis-Ausfall/Parallelität und Browser-/Staging nicht vollständig geprüft. |
| [172](#task-172) | Permission System | DONE | Zentraler Service/Guard/Decorator und alle verlangten Permissionkonstanten; ArticleEditorialGuard delegiert an PermissionsService; Unit- und reale Status-/HTTP-Proben grün. | — | Fehlende Moderations-/Forumaktionen sind separate Featureaufträge; der zentrale Permissionkern ist dadurch nicht unimplementiert. |
| [173](#task-173) | Account Status Guard | DONE | Zentraler AccountStatusGuard wird von AuthGuard benutzt; ACTIVE/LIMITED weiter, BANNED403; Unit- und echte HTTP-Probe. | — | Sessionrevoke und Onboarding sind separate Anforderungen, keine fehlenden Guard-Kriterien dieser Aufgabe. |
| [174](#task-174) | Yellow Card erstellen | TODO | Nur ModerationCard-/Notificationmodell, user.warn-Konstante und leere Module vorhanden. | Kein ausführbarer Kartenvergabeservice/Endpoint/UI; keine transaktionale Speicherung durch Moderator, Auditspur oder Usernotification. | Keine Vergabetests. Modell 075 ist nicht Feature 174; lokale Arbeit an Karte/Notification ist möglich, daher nicht pauschal BLOCKED. |

<a id="task-001"></a>
## 001 – MVP Dokument erstellen — TODO

Phase 1: PRODUCT FOUNDATION

### Originalanforderung aus dem Masterplan

```text
001 – MVP Dokument erstellen

Status:   ✅ TODO
Was gemacht werden muss

   ●   Zielgruppe definieren

   ●   Portalziel dokumentieren

   ●   Kernfunktionen festlegen

   ●   Nicht-MVP-Funktionen festlegen

   ●   Communityidee beschreiben

   ●   Personalisierung beschreiben

   ●   Moderationsidee beschreiben

   ●   Monetarisierung grob festhalten

Ergebnis

docs/product/mvp.md

Warum jetzt?

Alle späteren Architekturentscheidungen benötigen einen klaren Scope.
```

**Implementiert/nachgewiesen:** README enthält Produktabriss.

**Fehlende Funktion:** Gefordertes MVP-Dokument mit Zielgruppe, Scope, Nicht-MVP und Monetarisierung fehlt.

**Fehlender Nachweis:** Keine Dokumentabnahme.

**Aktuelle Code-/Konfigurationsbelege:**

- [.gitignore:1](/workspace/kurvenfunk/.gitignore:1)
- [README.md:1](/workspace/kurvenfunk/README.md:1)
- [package.json:1](/workspace/kurvenfunk/package.json:1)
- [pnpm-workspace.yaml:1](/workspace/kurvenfunk/pnpm-workspace.yaml:1)
- [turbo.json:1](/workspace/kurvenfunk/turbo.json:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher TODO → jetzt TODO. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-002"></a>
## 002 – Community Konzept dokumentieren — TODO

Phase 1: PRODUCT FOUNDATION

### Originalanforderung aus dem Masterplan

```text
002 – Community Konzept dokumentieren

Status:   ✅ TODO
Was gemacht werden muss

Festlegen:

   ●   Artikel besitzen Diskussionen

   ●   Vereinsforen

   ●   allgemeine Foren

   ●   Benutzerprofile

   ●   Reaktionen

   ●   Reports

   ●   gelbe Karten

   ●   rote Karten

   ●   LIMITED

   ●   BANNED

   ●   Moderatorenrechte

Ergebnis

docs/product/community.md
```

**Implementiert/nachgewiesen:** Community-Datenmodelle vorhanden.

**Fehlende Funktion:** Verbindliches Communitykonzept einschließlich Moderationsregeln fehlt.

**Fehlender Nachweis:** Keine Produktfreigabe dokumentiert.

**Aktuelle Code-/Konfigurationsbelege:**

- [.gitignore:1](/workspace/kurvenfunk/.gitignore:1)
- [README.md:1](/workspace/kurvenfunk/README.md:1)
- [package.json:1](/workspace/kurvenfunk/package.json:1)
- [pnpm-workspace.yaml:1](/workspace/kurvenfunk/pnpm-workspace.yaml:1)
- [turbo.json:1](/workspace/kurvenfunk/turbo.json:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher TODO → jetzt TODO. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-003"></a>
## 003 – Personalisierungskonzept dokumentieren — TODO

Phase 1: PRODUCT FOUNDATION

### Originalanforderung aus dem Masterplan

```text
003 – Personalisierungskonzept dokumentieren

Status:   ✅ TODO
Was gemacht werden muss

Festlegen:

   ●   Benutzer kann Lieblingsverein wählen

   ●   Benutzer kann "Neutral" wählen

   ●   Vereinswahl ist später änderbar

   ●   Vereinswahl beeinflusst Startseite

   ●   Vereinsnews werden priorisiert

   ●   Vereinsbranding wird angewendet

   ●   neutrale Nutzer sehen Standardbranding

Ergebnis

docs/product/personalization.md
```

**Implementiert/nachgewiesen:** Personalisierungs-Code vorhanden.

**Fehlende Funktion:** Eigenständiges Konzept mit Auswahl-, Branding- und Rankingregeln fehlt.

**Fehlender Nachweis:** Keine Konzeptfreigabe.

**Aktuelle Code-/Konfigurationsbelege:**

- [.gitignore:1](/workspace/kurvenfunk/.gitignore:1)
- [README.md:1](/workspace/kurvenfunk/README.md:1)
- [package.json:1](/workspace/kurvenfunk/package.json:1)
- [pnpm-workspace.yaml:1](/workspace/kurvenfunk/pnpm-workspace.yaml:1)
- [turbo.json:1](/workspace/kurvenfunk/turbo.json:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher TODO → jetzt TODO. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-004"></a>
## 004 – technische Architektur dokumentieren — TODO

Phase 1: PRODUCT FOUNDATION

### Originalanforderung aus dem Masterplan

```text
004 – technische Architektur dokumentieren

Status:   ✅ TODO
Was gemacht werden muss

Dokumentieren:

   ●   Web

   ●   API

   ●   Worker

   ●   PostgreSQL

   ●   Redis

   ●   Keycloak

   ●   Meilisearch

   ●   MinIO/R2

   ●   Datenflüsse

   ●   Netzwerke

   ●   Environment Separation

Ergebnis

docs/architecture/system.md
```

**Implementiert/nachgewiesen:** Compose und README beschreiben Teile des Stacks.

**Fehlende Funktion:** Gefordertes Systemdokument mit Datenflüssen und Netz-/Environmentarchitektur fehlt.

**Fehlender Nachweis:** Keine Architekturabnahme.

**Aktuelle Code-/Konfigurationsbelege:**

- [.gitignore:1](/workspace/kurvenfunk/.gitignore:1)
- [README.md:1](/workspace/kurvenfunk/README.md:1)
- [package.json:1](/workspace/kurvenfunk/package.json:1)
- [pnpm-workspace.yaml:1](/workspace/kurvenfunk/pnpm-workspace.yaml:1)
- [turbo.json:1](/workspace/kurvenfunk/turbo.json:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher TODO → jetzt TODO. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-005"></a>
## 005 – Architecture Decision Records einführen — TODO

Phase 1: PRODUCT FOUNDATION

### Originalanforderung aus dem Masterplan

```text
005 – Architecture Decision Records einführen

Status:   ✅ TODO
Was gemacht werden muss

Für wichtige Entscheidungen kurze ADR-Dateien erstellen.

Beispiele:

001-modular-monolith.md

002-keycloak-auth.md

003-postgres-source-of-truth.md

004-dev-staging-prod.md

005-provider-adapters.md

Warum?

Später lässt sich nachvollziehen, warum etwas so gebaut wurde.



PHASE 02 – REPOSITORY & MONOREPO
```

**Implementiert/nachgewiesen:** Kein ADR-Verzeichnis im aktuellen Dateiinventar.

**Fehlende Funktion:** ADRs zu Architektur, Keycloak, Datenhoheit und Umgebungen fehlen.

**Fehlender Nachweis:** Keine Entscheidungsprotokolle.

**Aktuelle Code-/Konfigurationsbelege:**

- [.gitignore:1](/workspace/kurvenfunk/.gitignore:1)
- [README.md:1](/workspace/kurvenfunk/README.md:1)
- [package.json:1](/workspace/kurvenfunk/package.json:1)
- [pnpm-workspace.yaml:1](/workspace/kurvenfunk/pnpm-workspace.yaml:1)
- [turbo.json:1](/workspace/kurvenfunk/turbo.json:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher TODO → jetzt TODO. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-006"></a>
## 006 – Git Repository prüfen / erstellen — DONE

Phase 2: REPOSITORY & MONOREPO

### Originalanforderung aus dem Masterplan

```text
006 – Git Repository prüfen / erstellen

Status:   ✅ TODO
Was gemacht werden muss

   ●   Repository initialisieren

   ●   Remote prüfen

   ●   .gitignore

   ●   README

       ●   Branch-Konzept

Branches

main

develop

feature/*

fix/*

chore/*
```

**Implementiert/nachgewiesen:** Git, Remote, Ignore, README und Branchkonvention vorhanden; develop/Commit geprüft.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [.gitignore:1](/workspace/kurvenfunk/.gitignore:1)
- [README.md:1](/workspace/kurvenfunk/README.md:1)
- [package.json:1](/workspace/kurvenfunk/package.json:1)
- [pnpm-workspace.yaml:1](/workspace/kurvenfunk/pnpm-workspace.yaml:1)
- [turbo.json:1](/workspace/kurvenfunk/turbo.json:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-007"></a>
## 007 – pnpm Workspace konfigurieren — DONE

Phase 2: REPOSITORY & MONOREPO

### Originalanforderung aus dem Masterplan

```text
007 – pnpm Workspace konfigurieren

Status:     ✅ TODO
Was gemacht werden muss

Workspace definieren:

packages:

 - apps/*

 - packages/*

Testen:

pnpm install
```

**Implementiert/nachgewiesen:** Workspace apps/* und packages/*; frozen Install erfolgreich.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [.gitignore:1](/workspace/kurvenfunk/.gitignore:1)
- [README.md:1](/workspace/kurvenfunk/README.md:1)
- [package.json:1](/workspace/kurvenfunk/package.json:1)
- [pnpm-workspace.yaml:1](/workspace/kurvenfunk/pnpm-workspace.yaml:1)
- [turbo.json:1](/workspace/kurvenfunk/turbo.json:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-008"></a>
## 008 – Turborepo konfigurieren — DONE

Phase 2: REPOSITORY & MONOREPO

### Originalanforderung aus dem Masterplan

```text
008 – Turborepo konfigurieren

Status:     ✅ TODO
Was gemacht werden muss

Tasks:

dev

build

lint

typecheck

test

Abnahmetest:

pnpm turbo build
```

**Implementiert/nachgewiesen:** Turbo dev/build/lint/typecheck/test konfiguriert; sieben Builds frisch erfolgreich.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [.gitignore:1](/workspace/kurvenfunk/.gitignore:1)
- [README.md:1](/workspace/kurvenfunk/README.md:1)
- [package.json:1](/workspace/kurvenfunk/package.json:1)
- [pnpm-workspace.yaml:1](/workspace/kurvenfunk/pnpm-workspace.yaml:1)
- [turbo.json:1](/workspace/kurvenfunk/turbo.json:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-009"></a>
## 009 – Shared Config Package — DONE

Phase 2: REPOSITORY & MONOREPO

### Originalanforderung aus dem Masterplan

```text
009 – Shared Config Package

Status:   ✅ TODO
Was gemacht werden muss

Unter:

packages/config

bereitstellen:

   ●    TypeScript Config

   ●    ESLint Config

   ●    Prettier

   ●    gemeinsame Node-Konventionen



PHASE 03 – DEV / STAGING / PRODUCTION
```

**Implementiert/nachgewiesen:** Shared TypeScript-, ESLint-, Prettierkonfiguration mit Packageexports; Checks laufen.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/eslint.config.mjs:1](/workspace/kurvenfunk/apps/api/eslint.config.mjs:1)
- [apps/web/eslint.config.mjs:1](/workspace/kurvenfunk/apps/web/eslint.config.mjs:1)
- [packages/config/eslint.config.js:1](/workspace/kurvenfunk/packages/config/eslint.config.js:1)
- [packages/config/package.json:1](/workspace/kurvenfunk/packages/config/package.json:1)
- [packages/config/prettier.config.js:1](/workspace/kurvenfunk/packages/config/prettier.config.js:1)
- [packages/config/tsconfig.base.json:1](/workspace/kurvenfunk/packages/config/tsconfig.base.json:1)
- [packages/config/tsconfig.node.json:1](/workspace/kurvenfunk/packages/config/tsconfig.node.json:1)
- [prettier.config.mjs:1](/workspace/kurvenfunk/prettier.config.mjs:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-010"></a>
## 010 – Environment Separation definieren — PARTIAL

Phase 3: DEV / STAGING / PRODUCTION

### Originalanforderung aus dem Masterplan

```text
010 – Environment Separation definieren

Status:   ✅ TODO
Was gemacht werden muss

Compose-Dateien:

compose.yml

compose.dev.yml

compose.staging.yml

compose.prod.yml

Environment-Dateien:

.env.dev

.env.staging

.env.prod

Nur:

.env.example

kommt in Git.
```

**Implementiert/nachgewiesen:** Basis und drei Compose-Overlays; unterschiedliche Pfade und Envdateien vorgesehen.

**Fehlende Funktion:** Kein bestätigter fehlender Konfigurationsbaustein; x-kurvenfunk-environment.env_file ist nur Metadatum, Skripte müssen --env-file setzen.

**Fehlender Nachweis:** Drei laufende getrennte Umgebungen/Credentials nicht geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-011"></a>
## 011 – Docker Projektnamen definieren — DONE

Phase 3: DEV / STAGING / PRODUCTION

### Originalanforderung aus dem Masterplan

```text
011 – Docker Projektnamen definieren

Status:   ✅ TODO
Was gemacht werden muss

kurvenfunk-dev

kurvenfunk-staging

kurvenfunk-prod

Keine festen container_name mehr verwenden.
```

**Implementiert/nachgewiesen:** Drei unterschiedliche Compose-Projektnamen, keine festen container_name.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-012"></a>
## 012 – VPS Persistenzstruktur erstellen — UNKNOWN

Phase 3: DEV / STAGING / PRODUCTION

### Originalanforderung aus dem Masterplan

```text
012 – VPS Persistenzstruktur erstellen

Status:   ✅ TODO
Was gemacht werden muss

/srv/kurvenfunk/

├── dev/

├── staging/

└── prod/

Je Environment:

postgres

redis

meilisearch

minio

logs

backups

Wichtig

Repository und persistente Daten müssen vollständig getrennt sein.
```

**Implementiert/nachgewiesen:** Compose referenziert getrennte /srv/kurvenfunk-Pfade.

**Fehlende Funktion:** Kein VPS-Zustand aus Repository ableitbar.

**Fehlender Nachweis:** Existenz/Persistenz/Trennung auf Zielhosts unbekannt; kein Zugriff vorgenommen.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher UNKNOWN → jetzt UNKNOWN. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-013"></a>
## 013 – Dateirechte definieren — PARTIAL

Phase 3: DEV / STAGING / PRODUCTION

### Originalanforderung aus dem Masterplan

```text
013 – Dateirechte definieren

Status:   ✅ TODO
Was gemacht werden muss

   ●   Owner festlegen

   ●   Gruppen festlegen

   ●   unnötige Schreibrechte entfernen

   ●   Secrets nur für notwendigen Benutzer lesbar machen
```

**Implementiert/nachgewiesen:** Owner-/Gruppen-/Secret-Rechte dokumentiert; chmod in Betriebsskripten.

**Fehlende Funktion:** Keine aus Code bestätigte Rechteverletzung.

**Fehlender Nachweis:** Tatsächliche Hostrechte nicht geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [docs/security/file-permissions.md:1](/workspace/kurvenfunk/docs/security/file-permissions.md:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-014"></a>
## 014 – Docker Networks erstellen — PARTIAL

Phase 3: DEV / STAGING / PRODUCTION

### Originalanforderung aus dem Masterplan

```text
014 – Docker Networks erstellen

Status:   ✅ TODO
Was gemacht werden muss

Logical Networks:

frontend

backend

Nur notwendige Services dürfen in beiden Netzwerken hängen.

PostgreSQL, Redis und Meilisearch dürfen nicht öffentlich erreichbar sein.



PHASE 04 – DATABASE & CORE INFRASTRUCTURE
```

**Implementiert/nachgewiesen:** frontend/backend-Netze; DB/Redis ohne Hostports, DEV-Meili nur Loopback.

**Fehlende Funktion:** Kein Codebeleg für öffentlich exponierte DB; Netzdefinition allein ist kein Expositionstest.

**Fehlender Nachweis:** Zielnetz-/Tunnelisolation und Restart fehlen als Nachweis.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-015"></a>
## 015 – PostgreSQL DEV — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
015 – PostgreSQL DEV

Status:   ✅ TODO
Was gemacht werden muss

   ●   postgres:17-alpine

   ●   Persistence

   ●   Healthcheck

   ●   Kurvenfunk DB

   ●   Keycloak DB

   ●   DB User

   ●   Restart Test
```

**Implementiert/nachgewiesen:** Postgres 17, Healthcheck und Persistenz konfiguriert; frische isolierte DB migriert und genutzt.

**Fehlende Funktion:** Keycloak-DB/User-Erzeugung nicht durch Basiscompose automatisiert sichtbar.

**Fehlender Nachweis:** Compose-DEV mit Keycloak-DB, Persistenz nach Restart, Backup/Restore nicht vollständig geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-016"></a>
## 016 – PostgreSQL STAGING — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
016 – PostgreSQL STAGING

Status:   ✅ TODO
Was gemacht werden muss

Eigene Instanz mit:

   ●   eigener Datenbank

   ●   eigenen Credentials

   ●   eigenem Storage

   ●   eigenem Backup
```

**Implementiert/nachgewiesen:** Staging-Overlay mit eigenem Postgrespfad, Backup-Timer vorhanden.

**Fehlende Funktion:** Kein belegter Funktionsdefekt aus statischer Konfiguration.

**Fehlender Nachweis:** Eigene Staging-Credentials, Laufbetrieb und Restore unbewiesen.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-017"></a>
## 017 – PostgreSQL PRODUCTION vorbereiten — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
017 – PostgreSQL PRODUCTION vorbereiten

Status:   ✅ TODO
Was gemacht werden muss

Production-Konfiguration vorbereiten, aber noch keine echten Produktionsdaten
verwenden.
```

**Implementiert/nachgewiesen:** Production-Postgres als separater Compose-Projekt-/Storagekontext vorbereitet.

**Fehlende Funktion:** Kein bestätigter Konfigurationsdefekt.

**Fehlender Nachweis:** Infrastruktur-DoD einschließlich isolierter Start-/Restart-/Restoreprüfung offen; Production bewusst unberührt.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-018"></a>
## 018 – Redis DEV — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
018 – Redis DEV

Status:   ✅ TODO
Was gemacht werden muss

   ●   Redis Container

   ●   Passwort

   ●   Persistenz

   ●   Healthcheck

   ●   Speicherlimit

   ●   PING/SET/GET Test
```

**Implementiert/nachgewiesen:** Redis Passwort/AOF/256MB/noeviction/Healthcheck; echte Redis-Lua- und Queue-Nutzung erfolgreich.

**Fehlende Funktion:** Kein bestätigter Laufzeitdefekt im geprüften Slice.

**Fehlender Nachweis:** Repository-Compose-Persistenz, Restart und SET/GET-Abnahme nicht vollständig ausgeführt.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-019"></a>
## 019 – Redis STAGING — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
019 – Redis STAGING

Status:   ✅ TODO
Was gemacht werden muss

Eigene Instanz und eigene Credentials.
```

**Implementiert/nachgewiesen:** Staging-Redis mit eigenem Projekt und Persistenzpfad konfiguriert.

**Fehlende Funktion:** Kein bestätigter Konfigurationsdefekt.

**Fehlender Nachweis:** Eigene Credentials und Lauf-/Restartnachweis fehlen.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-020"></a>
## 020 – Redis PRODUCTION vorbereiten — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
020 – Redis PRODUCTION vorbereiten

Status:   ✅ TODO
Was gemacht werden muss

Separate Production-Konfiguration inklusive Limits und Persistence.
```

**Implementiert/nachgewiesen:** Production-Redis übernimmt Limits/AOF und eigenen Pfad.

**Fehlende Funktion:** Kein bestätigter Konfigurationsdefekt.

**Fehlender Nachweis:** Isolierte Konfigurations-/Containerabnahme offen; kein Produktionszugriff.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-021"></a>
## 021 – Keycloak DEV — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
021 – Keycloak DEV

Status:   ✅ TODO
Was gemacht werden muss

   ●   Container

   ●   PostgreSQL DB

   ●   Realm kurvenfunk

   ●   Web Client

   ●   API Client

   ●   Redirect URLs

   ●   Web Origins

   ●   Healthcheck
```

**Implementiert/nachgewiesen:** Keycloak 26.6.3/Postgres/Healthcheck und Realm-Konfigurationsskripte vorhanden.

**Fehlende Funktion:** Realm-/Client-Bootstrap nicht vollständig deklarativ im Repository enthalten.

**Fehlender Nachweis:** Kein realer Keycloak-Container/Client-/Redirect-/Origin-Test in diesem Audit.

**Aktuelle Code-/Konfigurationsbelege:**

- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)
- [infrastructure/scripts/keycloak/configure-account-linking.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-account-linking.sh:1)
- [infrastructure/scripts/keycloak/configure-api-audience.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-api-audience.sh:1)
- [infrastructure/scripts/keycloak/configure-email-registration.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-email-registration.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/auth/auth.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.spec.ts:1)
- [apps/api/src/modules/auth/auth.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-022"></a>
## 022 – Keycloak STAGING — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
022 – Keycloak STAGING

Status:   ✅ TODO
Was gemacht werden muss

Eigene Instanz mit:

   ●   eigenen Benutzern

   ●   eigenen Secrets

   ●   eigenen Redirect URLs
```

**Implementiert/nachgewiesen:** Eigener Keycloak-Hostname/Compose-Projektkontext für Staging.

**Fehlende Funktion:** Kein belegter Defekt; externe Einstellungen unbekannt.

**Fehlender Nachweis:** Benutzer-, Secret-, Redirecttrennung nicht ausgeführt geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)
- [infrastructure/scripts/keycloak/configure-account-linking.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-account-linking.sh:1)
- [infrastructure/scripts/keycloak/configure-api-audience.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-api-audience.sh:1)
- [infrastructure/scripts/keycloak/configure-email-registration.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-email-registration.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/auth/auth.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.spec.ts:1)
- [apps/api/src/modules/auth/auth.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-023"></a>
## 023 – Keycloak PRODUCTION vorbereiten — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
023 – Keycloak PRODUCTION vorbereiten

Status:   ✅ TODO
Was gemacht werden muss

Production Realm und Clients vorbereiten.

Produktions-Secrets werden erst vor Launch erzeugt.
```

**Implementiert/nachgewiesen:** Production-Hostname und start-Konfiguration vorbereitet.

**Fehlende Funktion:** Vollständiger versionierter Realm-/Client-Export fehlt als reproduzierbare Vorbereitung.

**Fehlender Nachweis:** Production bewusst nicht kontaktiert; isolierter Realmimport nicht getestet.

**Aktuelle Code-/Konfigurationsbelege:**

- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)
- [infrastructure/scripts/keycloak/configure-account-linking.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-account-linking.sh:1)
- [infrastructure/scripts/keycloak/configure-api-audience.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-api-audience.sh:1)
- [infrastructure/scripts/keycloak/configure-email-registration.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-email-registration.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/auth/auth.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.spec.ts:1)
- [apps/api/src/modules/auth/auth.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-024"></a>
## 024 – Meilisearch DEV — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
024 – Meilisearch DEV

Status:   ✅ TODO
Was gemacht werden muss

   ●   Container

   ●   Master Key

   ●   Persistence

   ●   Healthcheck

   ●   Testindex

   ●   Testsuche
```

**Implementiert/nachgewiesen:** Meili-Container mit Masterkey, Healthcheck und Volume vorbereitet.

**Fehlende Funktion:** Testindex-/Suchfixture nicht als reproduzierbarer Prüfpfad vorhanden.

**Fehlender Nachweis:** Kein Index-/Suchlauf in diesem Audit.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-025"></a>
## 025 – Meilisearch STAGING — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
025 – Meilisearch STAGING

Status:   ✅ TODO
Eigene Instanz und eigener Index.
```

**Implementiert/nachgewiesen:** Staging-Meili erhält getrennten Projekt-/Persistenzkontext.

**Fehlende Funktion:** Kein bestätigter Konfigurationsdefekt.

**Fehlender Nachweis:** Eigener Index/Credentials/Laufbetrieb nicht geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-026"></a>
## 026 – Meilisearch PRODUCTION vorbereiten — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
026 – Meilisearch PRODUCTION vorbereiten

Status:   ✅ TODO
Separate Instanz vorbereiten.
```

**Implementiert/nachgewiesen:** Production-Meili separat konfiguriert.

**Fehlende Funktion:** Kein bestätigter Konfigurationsdefekt.

**Fehlender Nachweis:** Isolierter Start-/Persistenz-/Restartnachweis offen.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-027"></a>
## 027 – MinIO DEV — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
027 – MinIO DEV

Status:   ✅ TODO
Was gemacht werden muss

   ●   Container

   ●   Credentials

   ●    Bucket kurvenfunk-media

   ●    Upload

   ●    Download

   ●    Delete Test
```

**Implementiert/nachgewiesen:** DEV-MinIO mit Volume/Healthcheck/Loopbackports; S3-Abstraktion vorhanden.

**Fehlende Funktion:** MINIO_BUCKET-Variable allein provisioniert keinen Bucket; kein Init-Service im Compose.

**Fehlender Nachweis:** Kein echter Bucket-/Upload-/Download-/Delete-Roundtrip.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-028"></a>
## 028 – MinIO STAGING — PARTIAL

Phase 4: DATABASE & CORE INFRASTRUCTURE

### Originalanforderung aus dem Masterplan

```text
028 – MinIO STAGING

Status:   ✅ TODO
Eigener Bucket/Storage.



PHASE 05 – APPLICATION SERVICES
```

**Implementiert/nachgewiesen:** Staging-MinIO mit eigenem Datenpfad.

**Fehlende Funktion:** Bucket-Provisionierung nicht automatisiert nachgewiesen.

**Fehlender Nachweis:** Storage- und Credentialisolation nicht getestet.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-029"></a>
## 029 – Next.js Web App — PARTIAL

Phase 5: APPLICATION SERVICES

### Originalanforderung aus dem Masterplan

```text
029 – Next.js Web App

Status:   ✅ TODO
Was gemacht werden muss

Unter:

apps/web

   ●    Next.js initialisieren

   ●    TypeScript

   ●    App Router

   ●    Environment Validation

   ●    Health Endpoint

   ●    Dockerfile

   ●    .dockerignore
```

**Implementiert/nachgewiesen:** Next/TypeScript/AppRouter/Envparser/Healthroute/Dockerfile; Next-Build erfolgreich.

**Fehlende Funktion:** Kein fehlendes Grundgerüst gefunden.

**Fehlender Nachweis:** Dockerimage-/Runtime-/Restart-Abnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/app.module.ts:40](/workspace/kurvenfunk/apps/api/src/app.module.ts:40)
- [apps/api/src/main.ts:1](/workspace/kurvenfunk/apps/api/src/main.ts:1)
- [apps/web/next.config.ts:1](/workspace/kurvenfunk/apps/web/next.config.ts:1)
- [apps/worker/src/main.ts:1](/workspace/kurvenfunk/apps/worker/src/main.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-030"></a>
## 030 – NestJS API — PARTIAL

Phase 5: APPLICATION SERVICES

### Originalanforderung aus dem Masterplan

```text
030 – NestJS API

Status:   ✅ TODO
Was gemacht werden muss

Unter:

apps/api

   ●     NestJS initialisieren

   ●     Config Module

   ●     globale Validation

   ●     globales Error Handling

   ●     API Prefix

   ●     Health Endpoint

   ●     Dockerfile

API Prefix:

/api/v1
```

**Implementiert/nachgewiesen:** Nest Config, Zod-Pipes, Prefix, Errorfilter, Health; echte HTTP-App gestartet.

**Fehlende Funktion:** Nicht alle Eingaben validiert: öffentliche ungültige Media-ID erzeugt 500.

**Fehlender Nachweis:** Dockerimage-/Containerabnahme und reguläres API-E2E-Gate fehlen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/app.module.ts:40](/workspace/kurvenfunk/apps/api/src/app.module.ts:40)
- [apps/api/src/main.ts:1](/workspace/kurvenfunk/apps/api/src/main.ts:1)
- [apps/web/next.config.ts:1](/workspace/kurvenfunk/apps/web/next.config.ts:1)
- [apps/worker/src/main.ts:1](/workspace/kurvenfunk/apps/worker/src/main.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I01 HTTP live/ready real PostgreSQL and Redis; I16 DEFECT: invalid public media UUID returns 500.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-031"></a>
## 031 – Worker Service — PARTIAL

Phase 5: APPLICATION SERVICES

### Originalanforderung aus dem Masterplan

```text
031 – Worker Service

Status:   ✅ TODO
Was gemacht werden muss

Unter:

apps/worker

   ●     Worker initialisieren

   ●     Redis verbinden

   ●     BullMQ installieren

   ●     Test Queue

   ●     Test Job

   ●     Graceful Shutdown

   ●     Dockerfile



PHASE 06 – SHARED PACKAGES
```

**Implementiert/nachgewiesen:** BullMQ-Worker mit Shutdownhooks, Testjob und Dockerfile; echter Importjob verarbeitet.

**Fehlende Funktion:** Kein im Slice bestätigter Queue-Defekt.

**Fehlender Nachweis:** SIGTERM-/Container-/Restartabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/app.module.ts:40](/workspace/kurvenfunk/apps/api/src/app.module.ts:40)
- [apps/api/src/main.ts:1](/workspace/kurvenfunk/apps/api/src/main.ts:1)
- [apps/web/next.config.ts:1](/workspace/kurvenfunk/apps/web/next.config.ts:1)
- [apps/worker/src/main.ts:1](/workspace/kurvenfunk/apps/worker/src/main.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I17 Real BullMQ fake provider full pipeline and second-run duplicate detection.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-032"></a>
## 032 – Database Package — DONE

Phase 6: SHARED PACKAGES

### Originalanforderung aus dem Masterplan

```text
032 – Database Package

Status:   ✅ TODO
Was gemacht werden muss

packages/database

enthält:

   ●    Prisma

   ●    Prisma Client

   ●    Schema

   ●    Migrations

   ●    Seeds
```

**Implementiert/nachgewiesen:** Prisma-Client generiert; Schema validiert, elf Migrationen auf leerer DB und Seed erfolgreich.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:14](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:14)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I03 Real JWT user sync persists UNSET incomplete defaults.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-033"></a>
## 033 – Types Package — DONE

Phase 6: SHARED PACKAGES

### Originalanforderung aus dem Masterplan

```text
033 – Types Package

Status:    ✅ TODO
Was gemacht werden muss

Gemeinsam benötigte TypeScript-Typen zentral bereitstellen.

Keine Business Logic dort ablegen.
```

**Implementiert/nachgewiesen:** Geteilte Typen, Queuekonstanten und Providerverträge; keine ausführbaren Fachservices im Types-Package.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/types/package.json:1](/workspace/kurvenfunk/packages/types/package.json:1)
- [packages/types/src/common.ts:1](/workspace/kurvenfunk/packages/types/src/common.ts:1)
- [packages/types/src/index.ts:1](/workspace/kurvenfunk/packages/types/src/index.ts:1)
- [packages/types/src/news-normalization.ts:16](/workspace/kurvenfunk/packages/types/src/news-normalization.ts:16)
- [packages/types/src/news-provider.ts:25](/workspace/kurvenfunk/packages/types/src/news-provider.ts:25)
- [packages/types/src/queue.ts:1](/workspace/kurvenfunk/packages/types/src/queue.ts:1)
- [packages/types/src/request-context.ts:1](/workspace/kurvenfunk/packages/types/src/request-context.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-034"></a>
## 034 – Validation Package — DONE

Phase 6: SHARED PACKAGES

### Originalanforderung aus dem Masterplan

```text
034 – Validation Package

Status:    ✅ TODO
Was gemacht werden muss

Zod Schemas für gemeinsam genutzte Datenstrukturen erstellen.
```

**Implementiert/nachgewiesen:** Geteilte Zodschemas werden von API/Web konsumiert; 90 Validationtests bestanden.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/validation/package.json:1](/workspace/kurvenfunk/packages/validation/package.json:1)
- [packages/validation/src/article.ts:111](/workspace/kurvenfunk/packages/validation/src/article.ts:111)
- [packages/validation/src/category.ts:5](/workspace/kurvenfunk/packages/validation/src/category.ts:5)
- [packages/validation/src/comment.ts:3](/workspace/kurvenfunk/packages/validation/src/comment.ts:3)
- [packages/validation/src/common.ts:3](/workspace/kurvenfunk/packages/validation/src/common.ts:3)
- [packages/validation/src/fan-preference.ts:4](/workspace/kurvenfunk/packages/validation/src/fan-preference.ts:4)
- [packages/validation/src/index.ts:1](/workspace/kurvenfunk/packages/validation/src/index.ts:1)
- [packages/validation/src/media.ts:18](/workspace/kurvenfunk/packages/validation/src/media.ts:18)
- [packages/validation/src/nickname.ts:3](/workspace/kurvenfunk/packages/validation/src/nickname.ts:3)
- [packages/validation/src/profile.ts:3](/workspace/kurvenfunk/packages/validation/src/profile.ts:3)
- [packages/validation/src/tag.ts:5](/workspace/kurvenfunk/packages/validation/src/tag.ts:5)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-035"></a>
## 035 – Logger Package — PARTIAL

Phase 6: SHARED PACKAGES

### Originalanforderung aus dem Masterplan

```text
035 – Logger Package

Status:    ✅ TODO
Was gemacht werden muss

Standardfelder:

timestamp

level

service

requestId

userId

event

message

Keine Passwörter, Tokens oder unnötige personenbezogene Daten loggen.
```

**Implementiert/nachgewiesen:** Strukturierte Standardfelder und schlüsselbasierte rekursive Redaction vorhanden.

**Fehlende Funktion:** Freitext-/Error-/URL-Werte werden nicht inhaltlich redigiert; originalUrl enthält Querystrings.

**Fehlender Nachweis:** Kein dediziertes Logger-Regressionssuite-/Log-Datenschutzgate.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/logger/src/index.ts:1](/workspace/kurvenfunk/packages/logger/src/index.ts:1)
- [packages/logger/src/logger.ts:62](/workspace/kurvenfunk/packages/logger/src/logger.ts:62)
- [packages/logger/src/types.ts:7](/workspace/kurvenfunk/packages/logger/src/types.ts:7)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-036"></a>
## 036 – UI Package — PARTIAL

Phase 6: SHARED PACKAGES

### Originalanforderung aus dem Masterplan

```text
036 – UI Package

Status:   ✅ TODO
Was gemacht werden muss

Basiskomponenten vorbereiten, die innerhalb des Frontends wiederverwendet
werden.



PHASE 07 – TECHNICAL FOUNDATION
```

**Implementiert/nachgewiesen:** Wiederverwendbare Basis-UI und Tokenstyles; Build erfolgreich.

**Fehlende Funktion:** Kein eindeutig fehlender Basisbaustein gefunden.

**Fehlender Nachweis:** Keine Komponenten-/Browser-/A11yabnahme.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/web/src/app/design-system/design-system-client.tsx:304](/workspace/kurvenfunk/apps/web/src/app/design-system/design-system-client.tsx:304)
- [apps/web/src/app/design-system/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/design-system/page.tsx:1)
- [packages/ui/src/components/button.tsx:6](/workspace/kurvenfunk/packages/ui/src/components/button.tsx:6)
- [packages/ui/src/components/display.tsx:3](/workspace/kurvenfunk/packages/ui/src/components/display.tsx:3)
- [packages/ui/src/components/form-controls.tsx:15](/workspace/kurvenfunk/packages/ui/src/components/form-controls.tsx:15)
- [packages/ui/src/components/interactive.tsx:5](/workspace/kurvenfunk/packages/ui/src/components/interactive.tsx:5)
- [packages/ui/src/components/overlays.tsx:5](/workspace/kurvenfunk/packages/ui/src/components/overlays.tsx:5)
- [packages/ui/src/styles/components.css:1](/workspace/kurvenfunk/packages/ui/src/styles/components.css:1)
- [packages/ui/src/styles/tokens.css:1](/workspace/kurvenfunk/packages/ui/src/styles/tokens.css:1)
- [packages/ui/src/tokens.ts:1](/workspace/kurvenfunk/packages/ui/src/tokens.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-037"></a>
## 037 – Environment Validation — PARTIAL

Phase 7: TECHNICAL FOUNDATION

### Originalanforderung aus dem Masterplan

```text
037 – Environment Validation

Status:   ✅ TODO
Was gemacht werden muss

Beim Start prüfen, ob alle notwendigen Environment-Variablen vorhanden und gültig
sind.

Anwendung soll bei falscher Konfiguration kontrolliert abbrechen.
```

**Implementiert/nachgewiesen:** Zodparser für Web/API/Worker mit kontrollierten Fehlern.

**Fehlende Funktion:** OTS-Key ist auch bei gewähltem OTS-Provider nur optional; falsche Providerkonfiguration wird nicht vollständig beim Start abgefangen.

**Fehlender Nachweis:** Systematische Start-Negativtests fehlen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/app.module.ts:40](/workspace/kurvenfunk/apps/api/src/app.module.ts:40)
- [apps/api/src/main.ts:1](/workspace/kurvenfunk/apps/api/src/main.ts:1)
- [apps/web/next.config.ts:1](/workspace/kurvenfunk/apps/web/next.config.ts:1)
- [apps/worker/src/main.ts:1](/workspace/kurvenfunk/apps/worker/src/main.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-038"></a>
## 038 – Secrets Management — PARTIAL

Phase 7: TECHNICAL FOUNDATION

### Originalanforderung aus dem Masterplan

```text
038 – Secrets Management

Status:   ✅ TODO
Was gemacht werden muss

Trennen:

DEV Secrets

STAGING Secrets

PRODUCTION Secrets

Secrets niemals committen.
```

**Implementiert/nachgewiesen:** Ignore-Regeln und getrennte Env-/Secretskonvention dokumentiert.

**Fehlende Funktion:** Keine aktuelle Secretpreisgabe festgestellt; Rotation ist kein implementierter reproduzierbarer Workflow.

**Fehlender Nachweis:** Vollständige Git-Historienprüfung/externes Secretbinding nicht erfolgt.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [.gitignore:1](/workspace/kurvenfunk/.gitignore:1)
- [docs/security/secrets-management.md:1](/workspace/kurvenfunk/docs/security/secrets-management.md:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-039"></a>
## 039 – Request ID System — PARTIAL

Phase 7: TECHNICAL FOUNDATION

### Originalanforderung aus dem Masterplan

```text
039 – Request ID System

Status:   ✅ TODO
Was gemacht werden muss

Jeder Request erhält eindeutige ID.

Weiterreichen:

Web

→ API

→ Queue

→ Worker
```

**Implementiert/nachgewiesen:** API-Request-ID-Middleware, Queuepayload und Workercontext vorhanden; Diagnoseroute jetzt opt-in/lokal.

**Fehlende Funktion:** Web→API-Weitergabe nicht durchgängig vereinheitlicht.

**Fehlender Nachweis:** Neue lokale Queueprobe prüft Import, keinen vollständigen Browser→API→Worker-Trace.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/common/middleware/request-id.middleware.ts:6](/workspace/kurvenfunk/apps/api/src/common/middleware/request-id.middleware.ts:6)
- [apps/api/src/modules/request-id-test/request-id-test.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/request-id-test/request-id-test.controller.ts:5)
- [apps/api/src/modules/request-id-test/request-id-test.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/request-id-test/request-id-test.module.ts:8)
- [apps/api/src/modules/request-id-test/request-id-test.service.ts:13](/workspace/kurvenfunk/apps/api/src/modules/request-id-test/request-id-test.service.ts:13)
- [apps/worker/src/processors/test.processor.ts:17](/workspace/kurvenfunk/apps/worker/src/processors/test.processor.ts:17)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/request-id-test/request-id-test.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/request-id-test/request-id-test.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I14 Diagnostic route disabled before queue action.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-040"></a>
## 040 – Structured Logging — PARTIAL

Phase 7: TECHNICAL FOUNDATION

### Originalanforderung aus dem Masterplan

```text
040 – Structured Logging

Status:   ✅ TODO
Was gemacht werden muss

Development:

lesbare Console Logs.

Production:

strukturierte Logs.
```

**Implementiert/nachgewiesen:** Pretty in development, JSON sonst; strukturierte HTTP-/Jobereignisse.

**Fehlende Funktion:** Querystrings und Errorfreitext können sensible Werte enthalten.

**Fehlender Nachweis:** Keine Redaction-Negativ-/Retentionabnahme.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/common/interceptors/http-logging.interceptor.ts:18](/workspace/kurvenfunk/apps/api/src/common/interceptors/http-logging.interceptor.ts:18)
- [packages/logger/src/logger.ts:62](/workspace/kurvenfunk/packages/logger/src/logger.ts:62)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-041"></a>
## 041 – Healthchecks — PARTIAL

Phase 7: TECHNICAL FOUNDATION

### Originalanforderung aus dem Masterplan

```text
041 – Healthchecks

Status:   ✅ TODO
Was gemacht werden muss

Endpoints:

/health

/health/live

/health/ready

Readiness prüft mindestens:

   ●   PostgreSQL

   ●   Redis
```

**Implementiert/nachgewiesen:** API /health/live und /health/ready mit echten DB/Redis geprüft; Web /health implementiert.

**Fehlende Funktion:** Workerhealth prüft nur Redis; keine eigene DB-Readiness des Workers.

**Fehlender Nachweis:** Vollständige serviceübergreifende Ausfall-/Containerhealthabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/health/health.controller.ts:4](/workspace/kurvenfunk/apps/api/src/modules/health/health.controller.ts:4)
- [apps/api/src/modules/health/health.module.ts:5](/workspace/kurvenfunk/apps/api/src/modules/health/health.module.ts:5)
- [apps/api/src/modules/health/health.service.ts:13](/workspace/kurvenfunk/apps/api/src/modules/health/health.service.ts:13)
- [apps/web/src/app/health/route.ts:3](/workspace/kurvenfunk/apps/web/src/app/health/route.ts:3)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I01 HTTP live/ready real PostgreSQL and Redis.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-042"></a>
## 042 – Queue Infrastruktur — DONE

Phase 7: TECHNICAL FOUNDATION

### Originalanforderung aus dem Masterplan

```text
042 – Queue Infrastruktur

Status:   ✅ TODO

Was gemacht werden muss

Queues definieren:

news-import

sports-import

search-index

notifications

scheduled-publishing

cleanup

moderation

sanctions



PHASE 08 – DEPLOYMENT
```

**Implementiert/nachgewiesen:** Alle acht im Aufgabenwortlaut verlangten Queue-Namen definiert und in API/Worker registriert.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Consumer für Sports/Suche/Notifications/Moderation sind separate Aufgaben und hier kein Abnahmekriterium.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/app.module.ts:40](/workspace/kurvenfunk/apps/api/src/app.module.ts:40)
- [apps/worker/src/app.module.ts:30](/workspace/kurvenfunk/apps/worker/src/app.module.ts:30)
- [packages/types/src/queue.ts:1](/workspace/kurvenfunk/packages/types/src/queue.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt DONE. Aufgabe verlangt Queue-Definition, keine Consumer aller zukünftigen Features; registrierte Namen erfüllen diesen Scope.

<a id="task-043"></a>
## 043 – Docker Compose finalisieren — PARTIAL

Phase 8: DEPLOYMENT

### Originalanforderung aus dem Masterplan

```text
043 – Docker Compose finalisieren

Status:   ✅ TODO
Was gemacht werden muss

Alle Services müssen einzeln steuerbar sein.

Beispiel:

docker compose restart api

docker compose restart worker

docker compose restart meilisearch
```

**Implementiert/nachgewiesen:** Alle Services separat in Compose adressierbar.

**Fehlende Funktion:** Kein bestätigter Strukturdefekt.

**Fehlender Nachweis:** Nicht alle Compose-Services einzeln gestartet/restartet; App-Dockerimages nicht gebaut.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-044"></a>
## 044 – Cloudflare DEV Routing — PARTIAL

Phase 8: DEPLOYMENT

### Originalanforderung aus dem Masterplan

```text
044 – Cloudflare DEV Routing

Status:   ✅ TODO
Was gemacht werden muss

DEV Domains auf entsprechende Container routen.

DEV optional über Cloudflare Access schützen.
```

**Implementiert/nachgewiesen:** DEV-cloudflared/Tunnel und Hostnamekonfiguration vorhanden.

**Fehlende Funktion:** DNS-/Tunnelrouting liegt außerhalb des Codes.

**Fehlender Nachweis:** Kein DEV-Domain-/Accessnachweis; keine externen Dienste kontaktiert.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-045"></a>
## 045 – Cloudflare STAGING Routing — PARTIAL

Phase 8: DEPLOYMENT

### Originalanforderung aus dem Masterplan

```text
045 – Cloudflare STAGING Routing

Status:   ✅ TODO
Was gemacht werden muss

Staging Domains konfigurieren und Zugriff ggf. schützen.
```

**Implementiert/nachgewiesen:** Staging-cloudflared und Hostnamen vorbereitet.

**Fehlende Funktion:** Externe Routen-/Accessregeln unbekannt.

**Fehlender Nachweis:** Kein Staging-Routingtest.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-046"></a>
## 046 – Production Routing vorbereiten — PARTIAL

Phase 8: DEPLOYMENT

### Originalanforderung aus dem Masterplan

```text
046 – Production Routing vorbereiten

Status:   ✅ TODO
Was gemacht werden muss

Live Domains vorbereiten, aber noch nicht öffentlich freigeben.
```

**Implementiert/nachgewiesen:** Production-Overlay mit Livehostnamen und Tunnel vorbereitet.

**Fehlende Funktion:** Externe Domainfreigabe nicht im Code nachweisbar.

**Fehlender Nachweis:** Kein Produktionsrouting geprüft, entsprechend Auftrag.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [compose.dev.yml:1](/workspace/kurvenfunk/compose.dev.yml:1)
- [compose.prod.yml:1](/workspace/kurvenfunk/compose.prod.yml:1)
- [compose.staging.yml:1](/workspace/kurvenfunk/compose.staging.yml:1)
- [compose.yml:1](/workspace/kurvenfunk/compose.yml:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-047"></a>
## 047 – CI Pipeline — PARTIAL

Phase 8: DEPLOYMENT

### Originalanforderung aus dem Masterplan

```text
047 – CI Pipeline

Status:   ✅ TODO
Was gemacht werden muss

Bei Push:

Install

→ Lint

→ Typecheck

→ Tests

→ Build
```

**Implementiert/nachgewiesen:** CI führt Install/Format/Prisma/sharedBuild/Lint/Typecheck/Test/Build aus.

**Fehlende Funktion:** Webtestliste lässt 22 Tests aus; API-E2E wird nicht ausgeführt; App-Typechecks fehlen im Turbo-Gate. Separater Worker-tsc scheitert an fehlendem trustedForAutoPublish in Testfixture; keine echte DB/Redis-Fachsuite in CI.

**Fehlender Nachweis:** Lokale Gates bestanden, aktueller GitHub-CI-Lauf nicht als Nachweis erhoben.

**Aktuelle Code-/Konfigurationsbelege:**

- [.github/workflows/ci.yml:1](/workspace/kurvenfunk/.github/workflows/ci.yml:1)
- [.github/workflows/production.yml:1](/workspace/kurvenfunk/.github/workflows/production.yml:1)
- [infrastructure/scripts/deploy/dev.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/dev.sh:1)
- [infrastructure/scripts/deploy/production.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/production.sh:1)
- [infrastructure/scripts/deploy/rollback.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/rollback.sh:1)
- [infrastructure/scripts/deploy/staging.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/staging.sh:1)
- [tests/e2e/staging.sh:1](/workspace/kurvenfunk/tests/e2e/staging.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-048"></a>
## 048 – DEV Deployment — PARTIAL

Phase 8: DEPLOYMENT

### Originalanforderung aus dem Masterplan

```text
048 – DEV Deployment

Status:   ✅ TODO
Was gemacht werden muss

develop kann DEV automatisch aktualisieren.
```

**Implementiert/nachgewiesen:** develop-Push triggert DEV-Deploy nach CI; Script prüft Commit/Health.

**Fehlende Funktion:** Keine bestätigte zusätzliche Codelücke.

**Fehlender Nachweis:** Deployment-/Host-/Restartnachweise nicht erhoben; kein Deployment ausgeführt.

**Aktuelle Code-/Konfigurationsbelege:**

- [.github/workflows/ci.yml:1](/workspace/kurvenfunk/.github/workflows/ci.yml:1)
- [.github/workflows/production.yml:1](/workspace/kurvenfunk/.github/workflows/production.yml:1)
- [infrastructure/scripts/deploy/dev.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/dev.sh:1)
- [infrastructure/scripts/deploy/production.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/production.sh:1)
- [infrastructure/scripts/deploy/rollback.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/rollback.sh:1)
- [infrastructure/scripts/deploy/staging.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/staging.sh:1)
- [tests/e2e/staging.sh:1](/workspace/kurvenfunk/tests/e2e/staging.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-049"></a>
## 049 – STAGING Deployment — PARTIAL

Phase 8: DEPLOYMENT

### Originalanforderung aus dem Masterplan

```text
049 – STAGING Deployment

Status:   ✅ TODO
Was gemacht werden muss

Release Candidate:

Build

→ Deploy

→ Migration

→ Healthcheck

→ E2E
```

**Implementiert/nachgewiesen:** Staging-Script build→migrate→deploy→health→Shell-E2E vorhanden.

**Fehlende Funktion:** Shell-E2E prüft nur Infrastruktur/Realm, keine Produktabläufe.

**Fehlender Nachweis:** Realer Stagingrelease nicht ausgeführt.

**Aktuelle Code-/Konfigurationsbelege:**

- [.github/workflows/ci.yml:1](/workspace/kurvenfunk/.github/workflows/ci.yml:1)
- [.github/workflows/production.yml:1](/workspace/kurvenfunk/.github/workflows/production.yml:1)
- [infrastructure/scripts/deploy/dev.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/dev.sh:1)
- [infrastructure/scripts/deploy/production.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/production.sh:1)
- [infrastructure/scripts/deploy/rollback.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/rollback.sh:1)
- [infrastructure/scripts/deploy/staging.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/staging.sh:1)
- [tests/e2e/staging.sh:1](/workspace/kurvenfunk/tests/e2e/staging.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-050"></a>
## 050 – PRODUCTION Deployment — PARTIAL

Phase 8: DEPLOYMENT

### Originalanforderung aus dem Masterplan

```text
050 – PRODUCTION Deployment

Status:   ✅ TODO
Was gemacht werden muss

Nur manuell freigegeben:

Backup

→ Migration

→ Deployment

→ Healthcheck

→ Smoke Test
```

**Implementiert/nachgewiesen:** Manueller Workflow mit Bestätigung, main-Commitprüfung, Dump/Migration/Deploy/Smoke.

**Fehlende Funktion:** Kein Nachweis eines vollständigen Releasefreigabe-/Rollbackdrills.

**Fehlender Nachweis:** Keine Produktion kontaktiert oder deployt.

**Aktuelle Code-/Konfigurationsbelege:**

- [.github/workflows/ci.yml:1](/workspace/kurvenfunk/.github/workflows/ci.yml:1)
- [.github/workflows/production.yml:1](/workspace/kurvenfunk/.github/workflows/production.yml:1)
- [infrastructure/scripts/deploy/dev.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/dev.sh:1)
- [infrastructure/scripts/deploy/production.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/production.sh:1)
- [infrastructure/scripts/deploy/rollback.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/rollback.sh:1)
- [infrastructure/scripts/deploy/staging.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/staging.sh:1)
- [tests/e2e/staging.sh:1](/workspace/kurvenfunk/tests/e2e/staging.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-051"></a>
## 051 – Rollback Konzept — PARTIAL

Phase 8: DEPLOYMENT

### Originalanforderung aus dem Masterplan

```text
051 – Rollback Konzept

Status:   ✅ TODO
Was gemacht werden muss

Vorheriges Image bzw. vorheriger Release muss schnell wieder gestartet werden
können.



PHASE 09 – BACKUPS
```

**Implementiert/nachgewiesen:** Rollbackscript mit aktuellem/vorherigem Commit und Wiederanlauf vorhanden.

**Fehlende Funktion:** Migrations-Rückwärtskompatibilität nicht durch Strategie/Test abgesichert.

**Fehlender Nachweis:** Kein tatsächlicher Rollbackdrill.

**Aktuelle Code-/Konfigurationsbelege:**

- [.github/workflows/ci.yml:1](/workspace/kurvenfunk/.github/workflows/ci.yml:1)
- [.github/workflows/production.yml:1](/workspace/kurvenfunk/.github/workflows/production.yml:1)
- [infrastructure/scripts/deploy/dev.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/dev.sh:1)
- [infrastructure/scripts/deploy/production.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/production.sh:1)
- [infrastructure/scripts/deploy/rollback.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/rollback.sh:1)
- [infrastructure/scripts/deploy/staging.sh:1](/workspace/kurvenfunk/infrastructure/scripts/deploy/staging.sh:1)
- [tests/e2e/staging.sh:1](/workspace/kurvenfunk/tests/e2e/staging.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-052"></a>
## 052 – PostgreSQL Backup — PARTIAL

Phase 9: BACKUPS

### Originalanforderung aus dem Masterplan

```text
052 – PostgreSQL Backup

Status:   ✅ TODO
Was gemacht werden muss

Automatisierte Dumps für Staging und Production.
```

**Implementiert/nachgewiesen:** PG-Dumpskripte und getrennte Staging/Production-Timer vorhanden.

**Fehlende Funktion:** Kein bestätigter Skriptdefekt durch Syntaxprüfung.

**Fehlender Nachweis:** Timerbetrieb, aktueller Dump und Wiederherstellbarkeit nicht getestet.

**Aktuelle Code-/Konfigurationsbelege:**

- [docs/architecture/object-storage-backup.md:1](/workspace/kurvenfunk/docs/architecture/object-storage-backup.md:1)
- [docs/architecture/restore-test.md:1](/workspace/kurvenfunk/docs/architecture/restore-test.md:1)
- [infrastructure/scripts/backup/keycloak.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/keycloak.sh:1)
- [infrastructure/scripts/backup/postgres.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/postgres.sh:1)
- [infrastructure/scripts/backup/rotation.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/rotation.sh:1)
- [infrastructure/scripts/restore/keycloak.sh:1](/workspace/kurvenfunk/infrastructure/scripts/restore/keycloak.sh:1)
- [infrastructure/scripts/restore/postgres.sh:1](/workspace/kurvenfunk/infrastructure/scripts/restore/postgres.sh:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup@.service:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup@.service:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup-production.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup-production.timer:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup@.service:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup@.service:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-053"></a>
## 053 – Backup Rotation — PARTIAL

Phase 9: BACKUPS

### Originalanforderung aus dem Masterplan

```text
053 – Backup Rotation

Status:   ✅ TODO
Beispiel:

7 Daily

4 Weekly

6 Monthly
```

**Implementiert/nachgewiesen:** Rotation für Daily/Weekly/Monthly implementiert.

**Fehlende Funktion:** Kein bestätigter Defekt aus Quellprüfung.

**Fehlender Nachweis:** Keine Fixtureprüfung zu Retention, Monatswechsel, beschädigten Backups.

**Aktuelle Code-/Konfigurationsbelege:**

- [docs/architecture/object-storage-backup.md:1](/workspace/kurvenfunk/docs/architecture/object-storage-backup.md:1)
- [docs/architecture/restore-test.md:1](/workspace/kurvenfunk/docs/architecture/restore-test.md:1)
- [infrastructure/scripts/backup/keycloak.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/keycloak.sh:1)
- [infrastructure/scripts/backup/postgres.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/postgres.sh:1)
- [infrastructure/scripts/backup/rotation.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/rotation.sh:1)
- [infrastructure/scripts/restore/keycloak.sh:1](/workspace/kurvenfunk/infrastructure/scripts/restore/keycloak.sh:1)
- [infrastructure/scripts/restore/postgres.sh:1](/workspace/kurvenfunk/infrastructure/scripts/restore/postgres.sh:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup@.service:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup@.service:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup-production.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup-production.timer:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup@.service:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup@.service:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-054"></a>
## 054 – Keycloak Backup — PARTIAL

Phase 9: BACKUPS

### Originalanforderung aus dem Masterplan

```text
054 – Keycloak Backup

Status:   ✅ TODO
Realm-Konfiguration und relevante Einstellungen sichern.
```

**Implementiert/nachgewiesen:** Keycloak-Export-/Backupscript und Timer vorhanden.

**Fehlende Funktion:** Kein bestätigter Skriptdefekt.

**Fehlender Nachweis:** Aktuelle Realmexport-/Restore-Abnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [docs/architecture/object-storage-backup.md:1](/workspace/kurvenfunk/docs/architecture/object-storage-backup.md:1)
- [docs/architecture/restore-test.md:1](/workspace/kurvenfunk/docs/architecture/restore-test.md:1)
- [infrastructure/scripts/backup/keycloak.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/keycloak.sh:1)
- [infrastructure/scripts/backup/postgres.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/postgres.sh:1)
- [infrastructure/scripts/backup/rotation.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/rotation.sh:1)
- [infrastructure/scripts/restore/keycloak.sh:1](/workspace/kurvenfunk/infrastructure/scripts/restore/keycloak.sh:1)
- [infrastructure/scripts/restore/postgres.sh:1](/workspace/kurvenfunk/infrastructure/scripts/restore/postgres.sh:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup@.service:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup@.service:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup-production.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup-production.timer:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup@.service:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup@.service:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-055"></a>
## 055 – Object Storage Backup Strategie — DONE

Phase 9: BACKUPS

### Originalanforderung aus dem Masterplan

```text
055 – Object Storage Backup Strategie

Status:   ✅ TODO
Festlegen, welche Uploads zusätzlich gesichert werden müssen.
```

**Implementiert/nachgewiesen:** Eigenständige Objectstorage-Backupstrategie dokumentiert; Aufgabe verlangt Festlegung.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Praktische Kopie/Restore ist damit nicht als abgenommen ausgewiesen.

**Aktuelle Code-/Konfigurationsbelege:**

- [docs/architecture/object-storage-backup.md:1](/workspace/kurvenfunk/docs/architecture/object-storage-backup.md:1)
- [docs/architecture/restore-test.md:1](/workspace/kurvenfunk/docs/architecture/restore-test.md:1)
- [infrastructure/scripts/backup/keycloak.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/keycloak.sh:1)
- [infrastructure/scripts/backup/postgres.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/postgres.sh:1)
- [infrastructure/scripts/backup/rotation.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/rotation.sh:1)
- [infrastructure/scripts/restore/keycloak.sh:1](/workspace/kurvenfunk/infrastructure/scripts/restore/keycloak.sh:1)
- [infrastructure/scripts/restore/postgres.sh:1](/workspace/kurvenfunk/infrastructure/scripts/restore/postgres.sh:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup@.service:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup@.service:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup-production.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup-production.timer:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup@.service:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup@.service:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt DONE. Aufgabe verlangt Backupstrategie, nicht deren späteren Restore. Das vorhandene Strategiedokument deckt den Scope ab.

<a id="task-056"></a>
## 056 – Restore Scripts — PARTIAL

Phase 9: BACKUPS

### Originalanforderung aus dem Masterplan

```text
056 – Restore Scripts

Status:   ✅ TODO
Scripts unter:

infrastructure/scripts/restore/
```

**Implementiert/nachgewiesen:** Postgres- und Keycloak-Restoreskripte mit Fehlerabbruch vorhanden.

**Fehlende Funktion:** Kein bestätigter Skriptdefekt.

**Fehlender Nachweis:** Keine Ausführung mit aktuellem Backup in isolierter vollständiger Umgebung.

**Aktuelle Code-/Konfigurationsbelege:**

- [docs/architecture/object-storage-backup.md:1](/workspace/kurvenfunk/docs/architecture/object-storage-backup.md:1)
- [docs/architecture/restore-test.md:1](/workspace/kurvenfunk/docs/architecture/restore-test.md:1)
- [infrastructure/scripts/backup/keycloak.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/keycloak.sh:1)
- [infrastructure/scripts/backup/postgres.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/postgres.sh:1)
- [infrastructure/scripts/backup/rotation.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/rotation.sh:1)
- [infrastructure/scripts/restore/keycloak.sh:1](/workspace/kurvenfunk/infrastructure/scripts/restore/keycloak.sh:1)
- [infrastructure/scripts/restore/postgres.sh:1](/workspace/kurvenfunk/infrastructure/scripts/restore/postgres.sh:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup@.service:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup@.service:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup-production.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup-production.timer:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup@.service:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup@.service:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-057"></a>
## 057 – Restore Test — UNKNOWN

Phase 9: BACKUPS

### Originalanforderung aus dem Masterplan

```text
057 – Restore Test

Status:   ✅ TODO
Was gemacht werden muss

Backup tatsächlich auf leerer Testumgebung wiederherstellen.

Ein Backup ohne getesteten Restore zählt nicht als funktionierendes Backup.



PHASE 10 – DOMAIN MODEL
```

**Implementiert/nachgewiesen:** Historischer Restorebericht vom 14.08.2026 vorhanden.

**Fehlende Funktion:** Kein aktueller Restorefehler nachgewiesen.

**Fehlender Nachweis:** Historische Behauptung ohne aktuelle Artefakte nicht unabhängig bestätigt; frische Migration ist kein Restore.

**Aktuelle Code-/Konfigurationsbelege:**

- [docs/architecture/object-storage-backup.md:1](/workspace/kurvenfunk/docs/architecture/object-storage-backup.md:1)
- [docs/architecture/restore-test.md:1](/workspace/kurvenfunk/docs/architecture/restore-test.md:1)
- [infrastructure/scripts/backup/keycloak.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/keycloak.sh:1)
- [infrastructure/scripts/backup/postgres.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/postgres.sh:1)
- [infrastructure/scripts/backup/rotation.sh:1](/workspace/kurvenfunk/infrastructure/scripts/backup/rotation.sh:1)
- [infrastructure/scripts/restore/keycloak.sh:1](/workspace/kurvenfunk/infrastructure/scripts/restore/keycloak.sh:1)
- [infrastructure/scripts/restore/postgres.sh:1](/workspace/kurvenfunk/infrastructure/scripts/restore/postgres.sh:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer:1)
- [infrastructure/systemd/kurvenfunk-keycloak-backup@.service:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-keycloak-backup@.service:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup-production.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup-production.timer:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer:1)
- [infrastructure/systemd/kurvenfunk-postgres-backup@.service:1](/workspace/kurvenfunk/infrastructure/systemd/kurvenfunk-postgres-backup@.service:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher UNKNOWN → jetzt UNKNOWN. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-058"></a>
## 058 – User Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
058 – User Model

Status:   ✅ TODO
Was gemacht werden muss

Entity:

User

enthält z. B.:

id

keycloakSubject

nickname

status

favoriteClubId

onboardingCompleted

createdAt

updatedAt
```

**Implementiert/nachgewiesen:** Userfelder/Defaults/Relationen migriert; realer User-Sync bestätigt UNSET und incomplete.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:35](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:35)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I03 Real JWT user sync persists UNSET incomplete defaults.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-059"></a>
## 059 – Profile Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
059 – Profile Model

Status:   ✅ TODO
Was gemacht werden muss

Zusätzliche öffentliche Profildaten von Accountdaten trennen.

Beispielsweise:

displayName

bio

avatar

favoriteClub
```

**Implementiert/nachgewiesen:** Profile ist getrennte 1:1-Tabelle mit öffentlichem Namen/Bio/Avatarrelation; Migration erfolgreich.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:93](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:93)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-060"></a>
## 060 – User Status Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
060 – User Status Model

Status:   ✅ TODO
Was gemacht werden muss

Enum:

ACTIVE

LIMITED

BANNED

Status muss von Permissions berücksichtigt werden.
```

**Implementiert/nachgewiesen:** Enum ACTIVE/LIMITED/BANNED und Statusprüfung in Auth/Permissions; echte HTTP-Negativ-/Votingprobe.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Sanktionsvergabe und Sessionrevoke sind andere Aufgaben, durch dieses Modell nicht behauptet.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:14](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:14)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)
- [apps/api/src/modules/auth/account-status.guard.ts:12](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.ts:12)
- [apps/api/src/modules/permissions/permissions.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I10 LIMITED cannot post but can vote; BANNED cannot authenticate.

**Vergleich:** vorher PARTIAL → jetzt DONE. Enum plus zentrale Statusberücksichtigung jetzt real HTTP-verifiziert; Vergabe/Revoke gehören zu anderen Aufgaben.

<a id="task-061"></a>
## 061 – User Roles Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
061 – User Roles Model

Status:   ✅ TODO
Was gemacht werden muss

Rollen:

USER

TRUSTED_USER

MODERATOR

EDITOR

ADMIN

SUPERADMIN

Rolle und Status getrennt speichern.
```

**Implementiert/nachgewiesen:** Rollenenum und getrennte UserRoleAssignment mit Ablauf/Grantrelation; Migration/Permissionssuites grün.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:26](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:26)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-062"></a>
## 062 – Club Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
062 – Club Model

Status:   ✅ TODO
Was gemacht werden muss

Speichern:

name

shortName

slug

logo

primaryColor

secondaryColor

accentColor

website

active

Farben werden später für Personalisierung verwendet.
```

**Implementiert/nachgewiesen:** Club mit Namen/Slug/Logo/Website/active und äquivalenten Farb-/RGBAfeldern; Seed erfolgreich.

**Fehlende Funktion:** —

**Fehlender Nachweis:** primaryColor etc. heißen im aktuellen Modell color1Hex/color2Hex/color3Hex/accentColorHex; funktionale Zuordnung explizit.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:137](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:137)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-063"></a>
## 063 – Club Alias Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
063 – Club Alias Model

Status:   ✅ TODO
Was gemacht werden muss

Aliases wie:

SK Rapid

Rapid Wien

Rapid

SCR

einem Club zuordnen.

Wichtig für News- und Sportdatenmatching.
```

**Implementiert/nachgewiesen:** ClubAlias mit Clubrelation/Index migriert; Aliasfixtures in Seed und Matchingtests.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:174](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:174)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-064"></a>
## 064 – Neutral Preference — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
064 – Neutral Preference

Status:   ✅ TODO
Was gemacht werden muss

Benutzer muss ausdrücklich:

Lieblingsverein

oder:

Neutral

wählen können.

Nicht einfach favoriteClub = NULL verwenden, weil NULL auch "noch nicht gewählt"
bedeuten könnte.

Beispielsweise:

FanPreference:

CLUB

NEUTRAL

UNSET
```

**Implementiert/nachgewiesen:** Explizites UNSET/CLUB/NEUTRAL; keine Gleichsetzung von NULL und Neutral; HTTP-Onboarding bestätigt.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:20](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:20)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I06 Onboarding neutral persisted and nickname case insensitive conflict.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-065"></a>
## 065 – Competition Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
065 – Competition Model

Status:   ✅ TODO
Was gemacht werden muss

Wettbewerbe unabhängig von einzelnen Saisons modellieren.
```

**Implementiert/nachgewiesen:** Competition unabhängig von Season mit Slug/Name/Typ und Relationen; Migration/Seed grün.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:223](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:223)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-066"></a>
## 066 – Season Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
066 – Season Model

Status:   ✅ TODO
Was gemacht werden muss

Saisons einem Wettbewerb zuordnen.
```

**Implementiert/nachgewiesen:** Season mit Wettbewerb und Stagebezug; Seed enthält Saisons und Stages.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:245](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:245)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-067"></a>
## 067 – Match Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
067 – Match Model

Status:   ✅ TODO
Was gemacht werden muss

Speichern:

homeClub

awayClub

kickoff

competition

season

matchday

status

score
```

**Implementiert/nachgewiesen:** Match mit Heim/Auswärts/Kickoff/Wettbewerb/Saison/Spieltag/Status/Score; Seedspiele persistiert.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:293](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:293)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-068"></a>
## 068 – Standing Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
068 – Standing Model

Status:    ✅ TODO
Was gemacht werden muss

Tabellenstände und Tabellenzeilen modellieren.
```

**Implementiert/nachgewiesen:** Standing-Zeilenmodell mit Wettbewerb-/Saison-/Club-/Stagebezug und Zahlenfeldern; Migration und Seed grün.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Keine Berechnungsfunktion durch Modell-DONE behauptet.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:326](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:326)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-069"></a>
## 069 – Article Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
069 – Article Model

Status:    ✅ TODO
Was gemacht werden muss

Artikel mit:

      ●   Kategorien

      ●   Tags

      ●   Vereinen

      ●   Wettbewerb

      ●   Spiel

      ●   Quelle

      ●   Autor

verknüpfen können.
```

**Implementiert/nachgewiesen:** Article mit Autoren/Quelle/Kategorien/Tags/Clubs/Wettbewerb/Spiel; Migration und reale Datenzugriffe.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:448](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:448)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I15 Editorial real HTTP CRUD relations workflow revisions archive delete restore.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-070"></a>
## 070 – Media Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
070 – Media Model

Status:    ✅ TODO
Was gemacht werden muss

Speichern:

storageKey

url

mime

size

copyright

source

altText
```

**Implementiert/nachgewiesen:** Media mit Storagekey/URL/MIME/Größe/Copyright/Quelle/Alttext migriert.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Kein Storage-Roundtrip allein durch Modellnachweis behauptet.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:381](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:381)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-071"></a>
## 071 – Comment Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
071 – Comment Model

Status:   ✅ TODO
Was gemacht werden muss

Unterstützen:

   ●   Artikelbezug

   ●   Autor

   ●   Antworten

   ●   Soft Delete

   ●   Edit History

   ●   Moderation
```

**Implementiert/nachgewiesen:** Comment/CommentRevision mit Artikel/Autor/Parent/Status/Softdelete; echte Edit-/Reply-/Deleteprobe.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:578](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:578)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I08 Comment edit revision and foreign author denial real DB; I09 ACTIVE reply real parent relation; I13 Soft delete persists tombstone.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-072"></a>
## 072 – Reaction Model — PARTIAL

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
072 – Reaction Model

Status:   ✅ TODO
Was gemacht werden muss

MVP zunächst:

LIKE

LIMITED User dürfen weiterhin voten.
```

**Implementiert/nachgewiesen:** ReactionType enthält LIKE und zusätzliche UPVOTE/DOWNVOTE; LIMITED-Permission real geprüft.

**Fehlende Funktion:** API akzeptiert ausschließlich UPVOTE/DOWNVOTE; gefordertes MVP-LIKE nicht im vertikalen Vertrag umgesetzt.

**Fehlender Nachweis:** Produktentscheidung zur Abweichung fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/reactions/reactions.controller.ts:44](/workspace/kurvenfunk/apps/api/src/modules/reactions/reactions.controller.ts:44)
- [apps/api/src/modules/reactions/reactions.module.ts:7](/workspace/kurvenfunk/apps/api/src/modules/reactions/reactions.module.ts:7)
- [apps/api/src/modules/reactions/reactions.service.ts:24](/workspace/kurvenfunk/apps/api/src/modules/reactions/reactions.service.ts:24)
- [apps/web/src/features/articles/comment-voting.tsx:8](/workspace/kurvenfunk/apps/web/src/features/articles/comment-voting.tsx:8)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/reactions/reactions.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/reactions/reactions.controller.spec.ts:1)
- [apps/api/src/modules/reactions/reactions.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/reactions/reactions.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I10 LIMITED cannot post but can vote; BANNED cannot authenticate.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-073"></a>
## 073 – Forum Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
073 – Forum Model

Status:   ✅ TODO
Was gemacht werden muss

Entities:

ForumCategory

Forum

Thread

Post

ThreadSubscription

ThreadReadState
```

**Implementiert/nachgewiesen:** Alle sechs geforderten Forumentitäten samt Relationen im migrierten Schema.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Forumfunktionen bleiben außerhalb dieses Modellauftrags unimplementiert.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:650](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:650)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-074"></a>
## 074 – Moderation Report Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
074 – Moderation Report Model

Status:   ✅ TODO
Was gemacht werden muss

Reports müssen sowohl Kommentare als auch Forenbeiträge und Benutzer
referenzieren können.
```

**Implementiert/nachgewiesen:** ModerationReport referenziert Kommentar/Post/User und Moderator; SQL migriert; Kommentarreport real gespeichert.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Post-/Userreportendpoints werden hierdurch nicht als fertig bezeichnet.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:881](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:881)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I11 Reports persisted and duplicate rejected.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-075"></a>
## 075 – Yellow Card Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
075 – Yellow Card Model

Status:   ✅ TODO
Was gemacht werden muss

Entity:

ModerationCard

mit Typ:

YELLOW

RED

Speichern:

   ●     Benutzer

   ●     Moderator

   ●     Grund

   ●     Kommentar

   ●     Bezug zu Inhalt

   ●     Zeitpunkt

   ●     Ablauf optional
```

**Implementiert/nachgewiesen:** ModerationCard enthält YELLOW/RED, Ziel/Moderator/Grund/Notiz/Inhaltsreferenz/Zeit/Ablauf; Migration grün.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Vergabe/Benachrichtigung aus 174 wird nicht durch Modell erfüllt.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:918](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:918)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)
- [docs/database/moderation-card-model.md:1](/workspace/kurvenfunk/docs/database/moderation-card-model.md:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-076"></a>
## 076 – Sanction Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
076 – Sanction Model

Status:   ✅ TODO
Was gemacht werden muss

Sanktionen getrennt von Karten speichern.

Beispiele:

LIMITED

COMMENT_BLOCK

FORUM_BLOCK

ACCOUNT_BAN

IP_BLOCK

Dadurch können Karten und technische Sperren flexibel kombiniert werden.
```

**Implementiert/nachgewiesen:** Sanction getrennt von Card; benötigte Sperrtypen und Gültigkeits-/Widerrufsfelder migriert.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Keine technische Durchsetzung beliebiger Sanktionen durch Modell-DONE behauptet.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:954](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:954)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-077"></a>
## 077 – IP Block Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
077 – IP Block Model

Status:   ✅ TODO
Was gemacht werden muss

Speichern:

ipHash

reason

createdAt

expiresAt

createdBy

active
```

**Implementiert/nachgewiesen:** IPBlock mit Hash/Grund/Ersteller/Zeit/Gültigkeit/active im migrierten Schema.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:995](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:995)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-078"></a>
## 078 – Audit Log Model — PARTIAL

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
078 – Audit Log Model

Status:   ✅ TODO
Was gemacht werden muss

Kritische Admin-/Moderationsaktionen nachvollziehbar speichern.
```

**Implementiert/nachgewiesen:** AuditLog-Modell mit Akteur/Ziel/Ereignis/Metadaten vorhanden und migriert.

**Fehlende Funktion:** Anforderung kritische Admin-/Moderationsaktionen nachvollziehbar speichern wird von den bestehenden Mutationen nicht durch Auditwrites erfüllt.

**Fehlender Nachweis:** Kein tatsächlicher Auditdatensatzfluss geprüft; Schema allein reicht für den Speicherauftrag nicht.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:1114](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:1114)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)
- [apps/api/src/modules/audit/audit.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/audit/audit.module.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt PARTIAL. Der Wortlaut verlangt nachvollziehbares Speichern kritischer Aktionen; vorhandenes Modell allein erfüllt diesen Verhaltensanteil nicht.

<a id="task-079"></a>
## 079 – Notification Model — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
079 – Notification Model

Status:   ✅ TODO
Was gemacht werden muss

Benachrichtigungen pro Benutzer speichern.
```

**Implementiert/nachgewiesen:** Notification und NotificationPreference pro Benutzer mit Read-/Typ-/Inhaltsdaten migriert.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Keine Zustellung oder Notification-UI durch Modell-DONE behauptet.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:1184](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:1184)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-080"></a>
## 080 – Import Models — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
080 – Import Models

Status:   ✅ TODO
Was gemacht werden muss

Provider

ImportJob

ImportRecord

RawPayload

EntityMatch
```

**Implementiert/nachgewiesen:** Provider/ImportJob/ImportRecord/RawPayload/EntityMatch migriert und im echten Import genutzt.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:1351](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:1351)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I17 Real BullMQ fake provider full pipeline and second-run duplicate detection; I18 DEFECT: review approval persists decision but creates no article.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-081"></a>
## 081 – Prisma Schema erstellen — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
081 – Prisma Schema erstellen

Status:   ✅ TODO
Was gemacht werden muss

Alle zuvor definierten Domains sauber in Prisma abbilden.
```

**Implementiert/nachgewiesen:** Alle zuvor geforderten Domains in validiertem, generiertem und erfolgreich migriertem Schema.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:14](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:14)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)
- [docs/database/article-model.md:1](/workspace/kurvenfunk/docs/database/article-model.md:1)
- [docs/database/audit-log-model.md:1](/workspace/kurvenfunk/docs/database/audit-log-model.md:1)
- [docs/database/club-alias-model.md:1](/workspace/kurvenfunk/docs/database/club-alias-model.md:1)
- [docs/database/club-model.md:1](/workspace/kurvenfunk/docs/database/club-model.md:1)
- [docs/database/comment-model.md:1778](/workspace/kurvenfunk/docs/database/comment-model.md:1778)
- [docs/database/competition-model.md:1](/workspace/kurvenfunk/docs/database/competition-model.md:1)
- [docs/database/forum-model.md:1](/workspace/kurvenfunk/docs/database/forum-model.md:1)
- [docs/database/import-models.md:1](/workspace/kurvenfunk/docs/database/import-models.md:1)
- [docs/database/ip-block-model.md:1549](/workspace/kurvenfunk/docs/database/ip-block-model.md:1549)
- [docs/database/match-model.md:1](/workspace/kurvenfunk/docs/database/match-model.md:1)
- [docs/database/media-model.md:1](/workspace/kurvenfunk/docs/database/media-model.md:1)
- [docs/database/moderation-card-model.md:1](/workspace/kurvenfunk/docs/database/moderation-card-model.md:1)
- [docs/database/moderation-report-model.md:1373](/workspace/kurvenfunk/docs/database/moderation-report-model.md:1373)
- [docs/database/neutral-preference.md:171](/workspace/kurvenfunk/docs/database/neutral-preference.md:171)
- [docs/database/notification-model.md:2539](/workspace/kurvenfunk/docs/database/notification-model.md:2539)
- [docs/database/profile-model.md:1](/workspace/kurvenfunk/docs/database/profile-model.md:1)
- [docs/database/reaction-model.md:1](/workspace/kurvenfunk/docs/database/reaction-model.md:1)
- [docs/database/sanction-model.md:2504](/workspace/kurvenfunk/docs/database/sanction-model.md:2504)
- [docs/database/season-model.md:1](/workspace/kurvenfunk/docs/database/season-model.md:1)
- [docs/database/standing-model.md:917](/workspace/kurvenfunk/docs/database/standing-model.md:917)
- [docs/database/user-model.md:167](/workspace/kurvenfunk/docs/database/user-model.md:167)
- [docs/database/user-roles-model.md:1](/workspace/kurvenfunk/docs/database/user-roles-model.md:1)
- [docs/database/user-status-model.md:42](/workspace/kurvenfunk/docs/database/user-status-model.md:42)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-082"></a>
## 082 – Initial Migration — PARTIAL

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
082 – Initial Migration

Status:   ✅ TODO
Was gemacht werden muss

Migration zuerst DEV, danach STAGING testen.
```

**Implementiert/nachgewiesen:** Elf Migrationen einschließlich Initialmigration auf leerem isoliertem PostgreSQL erfolgreich.

**Fehlende Funktion:** Kein lokaler Migrationsfehler.

**Fehlender Nachweis:** Explizit verlangter Staging-Migrationsnachweis fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:14](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:14)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-083"></a>
## 083 – Seed System — DONE

Phase 10: DOMAIN MODEL

### Originalanforderung aus dem Masterplan

```text
083 – Seed System

Status:   ✅ TODO
Was gemacht werden muss

Testdaten:

   ●   Bundesliga

   ●   Saison

   ●   Vereine

   ●     Vereinsfarben

   ●     Aliases

   ●     Testuser

   ●     Testartikel

   ●     Testspiele



PHASE 11 – API FOUNDATION
```

**Implementiert/nachgewiesen:** Seed legt Wettbewerbe/Saisons/28 Clubs/Farben/Aliases/3 Testuser/18 Artikel/9 Spiele an; frische Ausführung erfolgreich.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Nur lokale Testdaten; keine Produktivbereinigung als zusätzliches Kriterium erfunden.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:14](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:14)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt DONE. Frische Seed-Ausführung belegt alle geforderten Testdaten; produktive Testdatenbereinigung ist kein Kriterium von 083.

<a id="task-084"></a>
## 084 – NestJS Module anlegen — DONE

Phase 11: API FOUNDATION

### Originalanforderung aus dem Masterplan

```text
084 – NestJS Module anlegen

Status:   ✅ TODO
Was gemacht werden muss

Module entsprechend Backendstruktur erzeugen.

Nicht sofort komplett implementieren.
```

**Implementiert/nachgewiesen:** Module der Backendstruktur angelegt; Wortlaut erlaubt ausdrücklich zunächst leere Module.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Fachfunktionalität leerer Module separat bewertet.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/app.module.ts:40](/workspace/kurvenfunk/apps/api/src/app.module.ts:40)
- [apps/api/src/modules/admin/admin.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/admin/admin.module.ts:3)
- [apps/api/src/modules/articles/articles.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.module.ts:8)
- [apps/api/src/modules/audit/audit.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/audit/audit.module.ts:3)
- [apps/api/src/modules/auth/auth.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.module.ts:9)
- [apps/api/src/modules/bans/bans.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/bans/bans.module.ts:3)
- [apps/api/src/modules/categories/categories.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/categories/categories.module.ts:9)
- [apps/api/src/modules/clubs/clubs.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.module.ts:6)
- [apps/api/src/modules/comments/comments.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.module.ts:8)
- [apps/api/src/modules/competitions/competitions.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.module.ts:6)
- [apps/api/src/modules/forums/forums.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/forums/forums.module.ts:3)
- [apps/api/src/modules/health/health.module.ts:5](/workspace/kurvenfunk/apps/api/src/modules/health/health.module.ts:5)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/matches/matches.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.module.ts:6)
- [apps/api/src/modules/media/media.module.ts:10](/workspace/kurvenfunk/apps/api/src/modules/media/media.module.ts:10)
- [apps/api/src/modules/moderation/moderation.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/moderation/moderation.module.ts:3)
- [apps/api/src/modules/notifications/notifications.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/notifications/notifications.module.ts:3)
- [apps/api/src/modules/onboarding/onboarding.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.module.ts:8)
- [apps/api/src/modules/permissions/permissions.module.ts:7](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.module.ts:7)
- [apps/api/src/modules/personalization/personalization.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/personalization/personalization.module.ts:3)
- [apps/api/src/modules/posts/posts.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/posts/posts.module.ts:3)
- [apps/api/src/modules/profiles/profiles.module.ts:7](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.module.ts:7)
- [apps/api/src/modules/providers/providers.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/providers/providers.module.ts:3)
- [apps/api/src/modules/reactions/reactions.module.ts:7](/workspace/kurvenfunk/apps/api/src/modules/reactions/reactions.module.ts:7)
- [apps/api/src/modules/reports/reports.module.ts:7](/workspace/kurvenfunk/apps/api/src/modules/reports/reports.module.ts:7)
- [apps/api/src/modules/request-id-test/request-id-test.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/request-id-test/request-id-test.module.ts:8)
- [apps/api/src/modules/sanctions/sanctions.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/sanctions/sanctions.module.ts:3)
- [apps/api/src/modules/search/search.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/search/search.module.ts:3)
- [apps/api/src/modules/seasons/seasons.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/seasons/seasons.module.ts:3)
- [apps/api/src/modules/standings/standings.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.module.ts:6)
- [apps/api/src/modules/tags/tags.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/tags/tags.module.ts:9)
- [apps/api/src/modules/threads/threads.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/threads/threads.module.ts:3)
- [apps/api/src/modules/users/users.module.ts:4](/workspace/kurvenfunk/apps/api/src/modules/users/users.module.ts:4)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-085"></a>
## 085 – API Versionierung — DONE

Phase 11: API FOUNDATION

### Originalanforderung aus dem Masterplan

```text
085 – API Versionierung

Status:   ✅ TODO
Was gemacht werden muss

Alle öffentlichen Endpoints unter:

/api/v1
```

**Implementiert/nachgewiesen:** main setzt api/v1; echte HTTP-Feature-/Healthrouten dort erreichbar.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Swagger /docs ist eine separate Dokumentationsroute.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/main.ts:1](/workspace/kurvenfunk/apps/api/src/main.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I01 HTTP live/ready real PostgreSQL and Redis; I15 Editorial real HTTP CRUD relations workflow revisions archive delete restore.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-086"></a>
## 086 – Response Standard — PARTIAL

Phase 11: API FOUNDATION

### Originalanforderung aus dem Masterplan

```text
086 – Response Standard

Status:   ✅ TODO
Was gemacht werden muss

Einheitliche Responses definieren.
```

**Implementiert/nachgewiesen:** Responseinterceptor kapselt data/meta/requestId; reale HTTP-Probe nutzt denselben Interceptor.

**Fehlende Funktion:** Keine belegte Vertragslücke im geprüften Slice; Binärmedien sind bewusst roh.

**Fehlender Nachweis:** Keine systematische Vertragsabnahme aller Endpoints und Staging.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/common/interceptors/response.interceptor.ts:13](/workspace/kurvenfunk/apps/api/src/common/interceptors/response.interceptor.ts:13)
- [apps/api/src/common/types/api-response.ts:1](/workspace/kurvenfunk/apps/api/src/common/types/api-response.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I01 HTTP live/ready real PostgreSQL and Redis; I03 Real JWT user sync persists UNSET incomplete defaults.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-087"></a>
## 087 – Error Standard — DONE

Phase 11: API FOUNDATION

### Originalanforderung aus dem Masterplan

```text
087 – Error Standard

Status:   ✅ TODO
Was gemacht werden muss

Fehler enthalten:

code

message

requestId
```

**Implementiert/nachgewiesen:** Zentraler Filter mit code/message/requestId, 500-Masking; Filtertests und echte Fehlerantworten geprüft.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/common/filters/http-exception.filter.ts:20](/workspace/kurvenfunk/apps/api/src/common/filters/http-exception.filter.ts:20)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/common/filters/http-exception.filter.spec.ts:1](/workspace/kurvenfunk/apps/api/src/common/filters/http-exception.filter.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I02 Auth rejects missing malformed unverified expired wrong issuer audience signature; I12 Comments all sort SQL and invalid cursor validation; I16 DEFECT: invalid public media UUID returns 500.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-088"></a>
## 088 – Validation — PARTIAL

Phase 11: API FOUNDATION

### Originalanforderung aus dem Masterplan

```text
088 – Validation

Status:   ✅ TODO
Was gemacht werden muss

Alle Benutzereingaben serverseitig validieren.
```

**Implementiert/nachgewiesen:** Bodies/Queries überwiegend per Zod validiert; UUID-Pipes bei Kommentaren.

**Fehlende Funktion:** Ungültige öffentliche Media-UUID erzeugt 500 statt 400; einige redaktionelle IDs ebenfalls ungeprüft.

**Fehlender Nachweis:** Vollständige Endpoint-Negativmatrix fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/common/pipes/zod-validation.pipe.ts:5](/workspace/kurvenfunk/apps/api/src/common/pipes/zod-validation.pipe.ts:5)
- [apps/api/src/modules/media/media.controller.ts:32](/workspace/kurvenfunk/apps/api/src/modules/media/media.controller.ts:32)
- [packages/validation/src/article.ts:111](/workspace/kurvenfunk/packages/validation/src/article.ts:111)
- [packages/validation/src/category.ts:5](/workspace/kurvenfunk/packages/validation/src/category.ts:5)
- [packages/validation/src/comment.ts:3](/workspace/kurvenfunk/packages/validation/src/comment.ts:3)
- [packages/validation/src/common.ts:3](/workspace/kurvenfunk/packages/validation/src/common.ts:3)
- [packages/validation/src/fan-preference.ts:4](/workspace/kurvenfunk/packages/validation/src/fan-preference.ts:4)
- [packages/validation/src/index.ts:1](/workspace/kurvenfunk/packages/validation/src/index.ts:1)
- [packages/validation/src/media.ts:18](/workspace/kurvenfunk/packages/validation/src/media.ts:18)
- [packages/validation/src/nickname.ts:3](/workspace/kurvenfunk/packages/validation/src/nickname.ts:3)
- [packages/validation/src/profile.ts:3](/workspace/kurvenfunk/packages/validation/src/profile.ts:3)
- [packages/validation/src/tag.ts:5](/workspace/kurvenfunk/packages/validation/src/tag.ts:5)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Zusätzliche echte lokale Prüfgruppen:** I12 Comments all sort SQL and invalid cursor validation; I16 DEFECT: invalid public media UUID returns 500.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-089"></a>
## 089 – Pagination — PARTIAL

Phase 11: API FOUNDATION

### Originalanforderung aus dem Masterplan

```text
089 – Pagination

Status:   ✅ TODO
Was gemacht werden muss

Cursor Pagination für große Listen.
```

**Implementiert/nachgewiesen:** Cursorparser und Paging für Artikel/Kommentare/Medien/Importjobs implementiert.

**Fehlende Funktion:** Unbegrenzte redaktionelle Artikelliste; kein durchgängiger Standard für alle großen Listen.

**Fehlender Nachweis:** Reale Kommentar-Cursorprobe deckt statische Seiten ab, keine konkurrierenden Änderungen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/comments/comment-pagination.ts:3](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.ts:3)
- [apps/api/src/modules/comments/comment-spam-protection.service.ts:67](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.ts:67)
- [apps/api/src/modules/comments/comments.controller.ts:21](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.ts:21)
- [apps/api/src/modules/comments/comments.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.module.ts:8)
- [apps/api/src/modules/comments/comments.service.ts:20](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.ts:20)
- [apps/web/src/features/articles/comment-composer.tsx:40](/workspace/kurvenfunk/apps/web/src/features/articles/comment-composer.tsx:40)
- [packages/validation/src/comment.ts:3](/workspace/kurvenfunk/packages/validation/src/comment.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/comments/comment-pagination.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.service.spec.ts:1)
- [apps/api/src/modules/comments/comment-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1)
- [apps/api/src/modules/comments/comments-spam-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments-spam-integration.spec.ts:1)
- [apps/api/src/modules/comments/comments.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.spec.ts:1)
- [apps/api/src/modules/comments/comments.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.spec.ts:1)
- [apps/web/src/features/articles/comment-pagination-client.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-pagination-client.spec.mjs:1)
- [apps/web/src/features/articles/comment-sort.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-sort.spec.mjs:1)
- [apps/web/src/features/articles/comment-spam-error.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-spam-error.spec.mjs:1)
- [packages/validation/src/comment.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/comment.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I19 Real SQL cursor traverses more than one page without repeated root IDs.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-090"></a>
## 090 – Filtering — DONE

Phase 11: API FOUNDATION

### Originalanforderung aus dem Masterplan

```text
090 – Filtering

Status:   ✅ TODO
Standard für API Filter festlegen.
```

**Implementiert/nachgewiesen:** Zentrale wiederverwendbare Filterparser und Unitprüfungen bestehen.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Kein universeller Filter für jeden Endpoint im schmalen Standardauftrag verlangt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/common/filtering/api-filtering.ts:3](/workspace/kurvenfunk/apps/api/src/common/filtering/api-filtering.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/common/filtering/api-filtering.spec.ts:1](/workspace/kurvenfunk/apps/api/src/common/filtering/api-filtering.spec.ts:1)

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-091"></a>
## 091 – Sorting — DONE

Phase 11: API FOUNDATION

### Originalanforderung aus dem Masterplan

```text
091 – Sorting

Status:   ✅ TODO
Einheitliche Sortierparameter definieren.
```

**Implementiert/nachgewiesen:** Zentraler Sortierparser mit Whitelist und Tests besteht.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/common/sorting/api-sorting.ts:3](/workspace/kurvenfunk/apps/api/src/common/sorting/api-sorting.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/common/sorting/api-sorting.spec.ts:1](/workspace/kurvenfunk/apps/api/src/common/sorting/api-sorting.spec.ts:1)

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-092"></a>
## 092 – Swagger / OpenAPI — PARTIAL

Phase 11: API FOUNDATION

### Originalanforderung aus dem Masterplan

```text
092 – Swagger / OpenAPI

Status:   ✅ TODO
Was gemacht werden muss

API Dokumentation auf Staging bereitstellen.



PHASE 12 – AUTHENTICATION
```

**Implementiert/nachgewiesen:** Swagger optional konfiguriert; Generator und docs/openapi.json vorgesehen.

**Fehlende Funktion:** Vollständige Fachschemas/Responses nicht überall annotiert.

**Fehlender Nachweis:** Explizite Stagingbereitstellung/Schutz/Vertragsabnahme nicht geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [.env.example:1](/workspace/kurvenfunk/.env.example:1)
- [apps/api/src/main.ts:1](/workspace/kurvenfunk/apps/api/src/main.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-093"></a>
## 093 – Keycloak ↔ API — PARTIAL

Phase 12: AUTHENTICATION

### Originalanforderung aus dem Masterplan

```text
093 – Keycloak ↔ API

Status:   ✅ TODO
Was gemacht werden muss

JWT prüfen:

   ●   Signature

   ●   Issuer

   ●   Audience

   ●   Expiry

NestJS Auth Guard erstellen.
```

**Implementiert/nachgewiesen:** Realer jose/JWKS/RS256-Pfad prüft Signatur/Issuer/Audience/Expiry; HTTP-Negativfälle erfolgreich.

**Fehlende Funktion:** Kein Defekt in geprüfter Tokenprüfung.

**Fehlender Nachweis:** Test-JWKS ist kein echter Keycloak; Rotation und Staging nicht geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/auth/account-status.guard.ts:12](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.ts:12)
- [apps/api/src/modules/auth/auth.controller.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.ts:6)
- [apps/api/src/modules/auth/auth.guard.ts:15](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.ts:15)
- [apps/api/src/modules/auth/auth.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.module.ts:9)
- [apps/api/src/modules/auth/auth.types.ts:4](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.types.ts:4)
- [apps/api/src/modules/auth/keycloak-jwt.service.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/keycloak-jwt.service.ts:6)
- [apps/api/src/modules/users/users.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.ts:4)
- [apps/web/src/app/login/login:1](/workspace/kurvenfunk/apps/web/src/app/login/login:1)
- [apps/web/src/app/login/login-client.tsx:6](/workspace/kurvenfunk/apps/web/src/app/login/login-client.tsx:6)
- [apps/web/src/app/login/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/login/page.tsx:1)
- [apps/web/src/features/auth/auth-provider.tsx:97](/workspace/kurvenfunk/apps/web/src/features/auth/auth-provider.tsx:97)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/auth/auth.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.spec.ts:1)
- [apps/api/src/modules/auth/auth.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.spec.ts:1)
- [apps/api/src/modules/users/users.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I02 Auth rejects missing malformed unverified expired wrong issuer audience signature; I03 Real JWT user sync persists UNSET incomplete defaults.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-094"></a>
## 094 – User Sync — PARTIAL

Phase 12: AUTHENTICATION

### Originalanforderung aus dem Masterplan

```text
094 – User Sync

Status:   ✅ TODO
Was gemacht werden muss

Nach erfolgreichem Keycloak Login prüfen:

existiert Kurvenfunk User?

Nein:

User anlegen

onboardingCompleted = false

FanPreference = UNSET
```

**Implementiert/nachgewiesen:** Subject-Upsert und Standardpräferenzen real durch signierten HTTP-Request persistiert.

**Fehlende Funktion:** Kein Defekt im geprüften Erstlogin-Slice.

**Fehlender Nachweis:** Gleichzeitige Erstlogins, echter IdP-Flow und Staging unbewiesen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/auth/account-status.guard.ts:12](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.ts:12)
- [apps/api/src/modules/auth/auth.controller.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.ts:6)
- [apps/api/src/modules/auth/auth.guard.ts:15](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.ts:15)
- [apps/api/src/modules/auth/auth.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.module.ts:9)
- [apps/api/src/modules/auth/auth.types.ts:4](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.types.ts:4)
- [apps/api/src/modules/auth/keycloak-jwt.service.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/keycloak-jwt.service.ts:6)
- [apps/api/src/modules/users/users.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.ts:4)
- [apps/web/src/app/login/login:1](/workspace/kurvenfunk/apps/web/src/app/login/login:1)
- [apps/web/src/app/login/login-client.tsx:6](/workspace/kurvenfunk/apps/web/src/app/login/login-client.tsx:6)
- [apps/web/src/app/login/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/login/page.tsx:1)
- [apps/web/src/features/auth/auth-provider.tsx:97](/workspace/kurvenfunk/apps/web/src/features/auth/auth-provider.tsx:97)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/auth/auth.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.spec.ts:1)
- [apps/api/src/modules/auth/auth.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.spec.ts:1)
- [apps/api/src/modules/users/users.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I03 Real JWT user sync persists UNSET incomplete defaults.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-095"></a>
## 095 – E-Mail Registrierung — PARTIAL

Phase 12: AUTHENTICATION

### Originalanforderung aus dem Masterplan

```text
095 – E-Mail Registrierung

Status:   ✅ TODO
Ablauf

E-Mail + Passwort

→ Keycloak Account

→ Verification Mail

→ E-Mail bestätigen

→ erster erfolgreicher Login

→ Kurvenfunk Onboarding
```

**Implementiert/nachgewiesen:** Registrierung/verifyEmail/resetPassword per Keycloakscript vorbereitet; Web delegiert Anmeldung.

**Fehlende Funktion:** Kein vollständiger reproduzierbarer Realm-/SMTP-Testaufbau im Repository.

**Fehlender Nachweis:** E-Mail+Passwort→Mail→Bestätigung→Login→Onboarding nicht real geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/auth/account-status.guard.ts:12](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.ts:12)
- [apps/api/src/modules/auth/auth.controller.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.ts:6)
- [apps/api/src/modules/auth/auth.guard.ts:15](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.ts:15)
- [apps/api/src/modules/auth/auth.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.module.ts:9)
- [apps/api/src/modules/auth/auth.types.ts:4](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.types.ts:4)
- [apps/api/src/modules/auth/keycloak-jwt.service.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/keycloak-jwt.service.ts:6)
- [apps/api/src/modules/users/users.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.ts:4)
- [apps/web/src/app/login/login:1](/workspace/kurvenfunk/apps/web/src/app/login/login:1)
- [apps/web/src/app/login/login-client.tsx:6](/workspace/kurvenfunk/apps/web/src/app/login/login-client.tsx:6)
- [apps/web/src/app/login/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/login/page.tsx:1)
- [apps/web/src/features/auth/auth-provider.tsx:97](/workspace/kurvenfunk/apps/web/src/features/auth/auth-provider.tsx:97)
- [infrastructure/scripts/keycloak/configure-account-linking.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-account-linking.sh:1)
- [infrastructure/scripts/keycloak/configure-api-audience.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-api-audience.sh:1)
- [infrastructure/scripts/keycloak/configure-email-registration.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-email-registration.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/auth/auth.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.spec.ts:1)
- [apps/api/src/modules/auth/auth.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.spec.ts:1)
- [apps/api/src/modules/users/users.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-096"></a>
## 096 – E-Mail Verifizierung — PARTIAL

Phase 12: AUTHENTICATION

### Originalanforderung aus dem Masterplan

```text
096 – E-Mail Verifizierung

Status:   ✅ TODO
Was gemacht werden muss

Ohne bestätigte Mail kein vollständiger Kurvenfunk Account.

Nach erfolgreicher Verifizierung beim nächsten Login:

onboardingCompleted == false

→ Onboarding öffnen.
```

**Implementiert/nachgewiesen:** email_verified=false per echtem JWT/HTTP abgelehnt; UI-Fehlerbehandlung vorhanden.

**Fehlende Funktion:** Kein belegter Defekt des API-Verifygates.

**Fehlender Nachweis:** Mailzustellung/Bestätigungslink/anschließende Browserweiterleitung offen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/auth/account-status.guard.ts:12](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.ts:12)
- [apps/api/src/modules/auth/auth.controller.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.ts:6)
- [apps/api/src/modules/auth/auth.guard.ts:15](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.ts:15)
- [apps/api/src/modules/auth/auth.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.module.ts:9)
- [apps/api/src/modules/auth/auth.types.ts:4](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.types.ts:4)
- [apps/api/src/modules/auth/keycloak-jwt.service.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/keycloak-jwt.service.ts:6)
- [apps/api/src/modules/users/users.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.ts:4)
- [apps/web/src/app/login/login:1](/workspace/kurvenfunk/apps/web/src/app/login/login:1)
- [apps/web/src/app/login/login-client.tsx:6](/workspace/kurvenfunk/apps/web/src/app/login/login-client.tsx:6)
- [apps/web/src/app/login/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/login/page.tsx:1)
- [apps/web/src/features/auth/auth-provider.tsx:97](/workspace/kurvenfunk/apps/web/src/features/auth/auth-provider.tsx:97)
- [infrastructure/scripts/keycloak/configure-account-linking.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-account-linking.sh:1)
- [infrastructure/scripts/keycloak/configure-api-audience.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-api-audience.sh:1)
- [infrastructure/scripts/keycloak/configure-email-registration.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-email-registration.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/auth/auth.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.spec.ts:1)
- [apps/api/src/modules/auth/auth.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.spec.ts:1)
- [apps/api/src/modules/users/users.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I02 Auth rejects missing malformed unverified expired wrong issuer audience signature.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-097"></a>
## 097 – Login mit E-Mail — PARTIAL

Phase 12: AUTHENTICATION

### Originalanforderung aus dem Masterplan

```text
097 – Login mit E-Mail

Status:   ✅ TODO
Was gemacht werden muss

Behandeln:

   ●   falsches Passwort

   ●   Account existiert nicht

   ●   E-Mail nicht bestätigt

   ●   LIMITED

   ●   BANNED
```

**Implementiert/nachgewiesen:** KeycloakJS-Login und BANNED/LIMITED-Behandlung in API/UI vorhanden.

**Fehlende Funktion:** Keine Tokenrefresh-/Expirystrategie im AuthProvider; React-Token kann veralten.

**Fehlender Nachweis:** Passwortfehler/Nichtexistenz/echter KC-Login/Sessionablauf im Browser nicht geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/auth/account-status.guard.ts:12](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.ts:12)
- [apps/api/src/modules/auth/auth.controller.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.ts:6)
- [apps/api/src/modules/auth/auth.guard.ts:15](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.ts:15)
- [apps/api/src/modules/auth/auth.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.module.ts:9)
- [apps/api/src/modules/auth/auth.types.ts:4](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.types.ts:4)
- [apps/api/src/modules/auth/keycloak-jwt.service.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/keycloak-jwt.service.ts:6)
- [apps/api/src/modules/users/users.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.ts:4)
- [apps/web/src/app/login/login:1](/workspace/kurvenfunk/apps/web/src/app/login/login:1)
- [apps/web/src/app/login/login-client.tsx:6](/workspace/kurvenfunk/apps/web/src/app/login/login-client.tsx:6)
- [apps/web/src/app/login/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/login/page.tsx:1)
- [apps/web/src/features/auth/auth-provider.tsx:97](/workspace/kurvenfunk/apps/web/src/features/auth/auth-provider.tsx:97)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/auth/auth.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.spec.ts:1)
- [apps/api/src/modules/auth/auth.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.spec.ts:1)
- [apps/api/src/modules/users/users.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-098"></a>
## 098 – Google Login — PARTIAL

Phase 12: AUTHENTICATION

### Originalanforderung aus dem Masterplan

```text
098 – Google Login

Status:   ✅ TODO
Ablauf

Google

→ Keycloak

→ erfolgreicher Login

→ User Sync

→ Onboarding falls neu

Google-Benutzer benötigen keine zusätzliche Kurvenfunk-Mail-Verifizierung, wenn
die Identität entsprechend vom Provider bestätigt wurde.
```

**Implementiert/nachgewiesen:** Google-idpHint und Brokerkonfiguration vorhanden.

**Fehlende Funktion:** Kein im Repository vollständig provisionierter Google-Testprovider.

**Fehlender Nachweis:** OAuth-/Googleidentität und deren Emailverified-Vertrag nicht real geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/auth/account-status.guard.ts:12](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.ts:12)
- [apps/api/src/modules/auth/auth.controller.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.ts:6)
- [apps/api/src/modules/auth/auth.guard.ts:15](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.ts:15)
- [apps/api/src/modules/auth/auth.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.module.ts:9)
- [apps/api/src/modules/auth/auth.types.ts:4](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.types.ts:4)
- [apps/api/src/modules/auth/keycloak-jwt.service.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/keycloak-jwt.service.ts:6)
- [apps/api/src/modules/users/users.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.ts:4)
- [apps/web/src/app/login/login:1](/workspace/kurvenfunk/apps/web/src/app/login/login:1)
- [apps/web/src/app/login/login-client.tsx:6](/workspace/kurvenfunk/apps/web/src/app/login/login-client.tsx:6)
- [apps/web/src/app/login/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/login/page.tsx:1)
- [apps/web/src/features/auth/auth-provider.tsx:97](/workspace/kurvenfunk/apps/web/src/features/auth/auth-provider.tsx:97)
- [infrastructure/scripts/keycloak/configure-account-linking.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-account-linking.sh:1)
- [infrastructure/scripts/keycloak/configure-api-audience.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-api-audience.sh:1)
- [infrastructure/scripts/keycloak/configure-email-registration.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-email-registration.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/auth/auth.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.spec.ts:1)
- [apps/api/src/modules/auth/auth.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.spec.ts:1)
- [apps/api/src/modules/users/users.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-099"></a>
## 099 – Logout — PARTIAL

Phase 12: AUTHENTICATION

### Originalanforderung aus dem Masterplan

```text
099 – Logout

Status:   ✅ TODO
Was gemacht werden muss

Lokale und Keycloak Session sauber beenden.
```

**Implementiert/nachgewiesen:** Lokaler State wird gelöscht und Keycloak logout aufgerufen.

**Fehlende Funktion:** Kein im Code belegter Defekt des einfachen Logoutpfads.

**Fehlender Nachweis:** SSO-/Browser-/Keycloak-Sessionende nicht getestet.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/auth/account-status.guard.ts:12](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.ts:12)
- [apps/api/src/modules/auth/auth.controller.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.ts:6)
- [apps/api/src/modules/auth/auth.guard.ts:15](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.ts:15)
- [apps/api/src/modules/auth/auth.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.module.ts:9)
- [apps/api/src/modules/auth/auth.types.ts:4](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.types.ts:4)
- [apps/api/src/modules/auth/keycloak-jwt.service.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/keycloak-jwt.service.ts:6)
- [apps/api/src/modules/users/users.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.ts:4)
- [apps/web/src/app/login/login:1](/workspace/kurvenfunk/apps/web/src/app/login/login:1)
- [apps/web/src/app/login/login-client.tsx:6](/workspace/kurvenfunk/apps/web/src/app/login/login-client.tsx:6)
- [apps/web/src/app/login/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/login/page.tsx:1)
- [apps/web/src/features/auth/auth-provider.tsx:97](/workspace/kurvenfunk/apps/web/src/features/auth/auth-provider.tsx:97)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/auth/auth.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.spec.ts:1)
- [apps/api/src/modules/auth/auth.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.spec.ts:1)
- [apps/api/src/modules/users/users.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-100"></a>
## 100 – Password Reset — PARTIAL

Phase 12: AUTHENTICATION

### Originalanforderung aus dem Masterplan

```text
100 – Password Reset

Status:   ✅ TODO
Was gemacht werden muss

Keycloak Passwort-Reset-Flow integrieren.
```

**Implementiert/nachgewiesen:** Keycloakscript aktiviert resetPasswordAllowed.

**Fehlende Funktion:** Kein Nachweis fehlender Keycloak-Resetfunktion; sie wird an den IdP delegiert.

**Fehlender Nachweis:** Mail-/Einmallink-/Ablauf-/Passwortwechsel-Abnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/auth/account-status.guard.ts:12](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.ts:12)
- [apps/api/src/modules/auth/auth.controller.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.ts:6)
- [apps/api/src/modules/auth/auth.guard.ts:15](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.ts:15)
- [apps/api/src/modules/auth/auth.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.module.ts:9)
- [apps/api/src/modules/auth/auth.types.ts:4](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.types.ts:4)
- [apps/api/src/modules/auth/keycloak-jwt.service.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/keycloak-jwt.service.ts:6)
- [apps/api/src/modules/users/users.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.ts:4)
- [apps/web/src/app/login/login:1](/workspace/kurvenfunk/apps/web/src/app/login/login:1)
- [apps/web/src/app/login/login-client.tsx:6](/workspace/kurvenfunk/apps/web/src/app/login/login-client.tsx:6)
- [apps/web/src/app/login/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/login/page.tsx:1)
- [apps/web/src/features/auth/auth-provider.tsx:97](/workspace/kurvenfunk/apps/web/src/features/auth/auth-provider.tsx:97)
- [infrastructure/scripts/keycloak/configure-account-linking.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-account-linking.sh:1)
- [infrastructure/scripts/keycloak/configure-api-audience.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-api-audience.sh:1)
- [infrastructure/scripts/keycloak/configure-email-registration.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-email-registration.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/auth/auth.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.spec.ts:1)
- [apps/api/src/modules/auth/auth.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.spec.ts:1)
- [apps/api/src/modules/users/users.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-101"></a>
## 101 – Account Linking — PARTIAL

Phase 12: AUTHENTICATION

### Originalanforderung aus dem Masterplan

```text
101 – Account Linking

Status:   ✅ TODO
Was gemacht werden muss

Verhindern, dass derselbe Benutzer durch E-Mail und Google unbeabsichtigt zwei
Profile bekommt.



PHASE 13 – USER ONBOARDING
```

**Implementiert/nachgewiesen:** duplicateEmailsAllowed=false und First-Broker-Linking-Flow konfiguriert.

**Fehlende Funktion:** Keine bestätigte Dublettenfreiheit aus Script allein ableitbar.

**Fehlender Nachweis:** Reales Email+Google-Linking inklusive Übernahme-/Fehlerfälle fehlt als Nachweis.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/auth/account-status.guard.ts:12](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.ts:12)
- [apps/api/src/modules/auth/auth.controller.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.ts:6)
- [apps/api/src/modules/auth/auth.guard.ts:15](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.ts:15)
- [apps/api/src/modules/auth/auth.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.module.ts:9)
- [apps/api/src/modules/auth/auth.types.ts:4](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.types.ts:4)
- [apps/api/src/modules/auth/keycloak-jwt.service.ts:6](/workspace/kurvenfunk/apps/api/src/modules/auth/keycloak-jwt.service.ts:6)
- [apps/api/src/modules/users/users.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.ts:4)
- [apps/web/src/app/login/login:1](/workspace/kurvenfunk/apps/web/src/app/login/login:1)
- [apps/web/src/app/login/login-client.tsx:6](/workspace/kurvenfunk/apps/web/src/app/login/login-client.tsx:6)
- [apps/web/src/app/login/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/login/page.tsx:1)
- [apps/web/src/features/auth/auth-provider.tsx:97](/workspace/kurvenfunk/apps/web/src/features/auth/auth-provider.tsx:97)
- [infrastructure/scripts/keycloak/configure-account-linking.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-account-linking.sh:1)
- [infrastructure/scripts/keycloak/configure-api-audience.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-api-audience.sh:1)
- [infrastructure/scripts/keycloak/configure-email-registration.sh:1](/workspace/kurvenfunk/infrastructure/scripts/keycloak/configure-email-registration.sh:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/auth/auth.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.controller.spec.ts:1)
- [apps/api/src/modules/auth/auth.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.spec.ts:1)
- [apps/api/src/modules/users/users.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/users/users.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-102"></a>
## 102 – Onboarding Gate — PARTIAL

Phase 13: USER ONBOARDING

### Originalanforderung aus dem Masterplan

```text
102 – Onboarding Gate

Status:   ✅ TODO
Was gemacht werden muss

Nach jedem erfolgreichen Login prüfen:

onboardingCompleted

Bei false darf der Benutzer noch nicht normal ins Portal gelangen.

Weiterleitung:

/onboarding
```

**Implementiert/nachgewiesen:** Client-OnboardingGate leitet incomplete Nutzer um.

**Fehlende Funktion:** Server erlaubt incomplete ACTIVE-Usern Kommentarerstellung; HTTP 201 real bestätigt.

**Fehlender Nachweis:** Browserweiterleitung und Ausnahmen noch nicht E2E abgenommen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/onboarding/onboarding.controller.ts:15](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.controller.ts:15)
- [apps/api/src/modules/onboarding/onboarding.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.module.ts:8)
- [apps/api/src/modules/onboarding/onboarding.service.ts:10](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.service.ts:10)
- [apps/web/src/features/onboarding/club-selection.tsx:52](/workspace/kurvenfunk/apps/web/src/features/onboarding/club-selection.tsx:52)
- [apps/web/src/features/onboarding/nickname-selection.tsx:48](/workspace/kurvenfunk/apps/web/src/features/onboarding/nickname-selection.tsx:48)
- [apps/web/src/features/onboarding/onboarding-completion.tsx:20](/workspace/kurvenfunk/apps/web/src/features/onboarding/onboarding-completion.tsx:20)
- [apps/web/src/features/onboarding/onboarding-gate.tsx:12](/workspace/kurvenfunk/apps/web/src/features/onboarding/onboarding-gate.tsx:12)
- [packages/validation/src/fan-preference.ts:4](/workspace/kurvenfunk/packages/validation/src/fan-preference.ts:4)
- [packages/validation/src/nickname.ts:3](/workspace/kurvenfunk/packages/validation/src/nickname.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/onboarding/onboarding.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.controller.spec.ts:1)
- [apps/api/src/modules/onboarding/onboarding.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.service.spec.ts:1)
- [packages/validation/src/fan-preference.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/fan-preference.spec.ts:1)
- [packages/validation/src/nickname.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/nickname.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I04 DEFECT: incomplete onboarding user can create comment via HTTP.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-103"></a>
## 103 – Nickname Auswahl — PARTIAL

Phase 13: USER ONBOARDING

### Originalanforderung aus dem Masterplan

```text
103 – Nickname Auswahl

Status:   ✅ TODO
Was gemacht werden muss

Benutzer muss einen Nickname wählen.

Prüfen:

   ●   eindeutig

   ●   case-insensitive eindeutig

   ●   Mindestlänge

   ●   Maximallänge

   ●   erlaubte Zeichen

   ●   verbotene Begriffe

   ●   reservierte Namen

Reserviert z. B.:

admin

moderator

kurvenfunk

support

system
```

**Implementiert/nachgewiesen:** Länge/Zeichen/fünf reservierte Namen; case-insensitiver Index; realer Konflikt 409.

**Fehlende Funktion:** Verbotene Begriffe über reservierte Namen hinaus nicht implementiert.

**Fehlender Nachweis:** Browser-/Konkurrenztest fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/onboarding/onboarding.controller.ts:15](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.controller.ts:15)
- [apps/api/src/modules/onboarding/onboarding.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.module.ts:8)
- [apps/api/src/modules/onboarding/onboarding.service.ts:10](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.service.ts:10)
- [apps/web/src/features/onboarding/club-selection.tsx:52](/workspace/kurvenfunk/apps/web/src/features/onboarding/club-selection.tsx:52)
- [apps/web/src/features/onboarding/nickname-selection.tsx:48](/workspace/kurvenfunk/apps/web/src/features/onboarding/nickname-selection.tsx:48)
- [apps/web/src/features/onboarding/onboarding-completion.tsx:20](/workspace/kurvenfunk/apps/web/src/features/onboarding/onboarding-completion.tsx:20)
- [apps/web/src/features/onboarding/onboarding-gate.tsx:12](/workspace/kurvenfunk/apps/web/src/features/onboarding/onboarding-gate.tsx:12)
- [packages/validation/src/fan-preference.ts:4](/workspace/kurvenfunk/packages/validation/src/fan-preference.ts:4)
- [packages/validation/src/nickname.ts:3](/workspace/kurvenfunk/packages/validation/src/nickname.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/onboarding/onboarding.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.controller.spec.ts:1)
- [apps/api/src/modules/onboarding/onboarding.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.service.spec.ts:1)
- [packages/validation/src/fan-preference.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/fan-preference.spec.ts:1)
- [packages/validation/src/nickname.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/nickname.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I06 Onboarding neutral persisted and nickname case insensitive conflict.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-104"></a>
## 104 – Nickname Live Validation — PARTIAL

Phase 13: USER ONBOARDING

### Originalanforderung aus dem Masterplan

```text
104 – Nickname Live Validation

Status:   ⬜ TODO
Was gemacht werden muss

Während Eingabe prüfen:

Nickname verfügbar?

Klare Benutzerinformation anzeigen.
```

**Implementiert/nachgewiesen:** Availabilityendpoint und Debounce/AbortController im UI vorhanden.

**Fehlende Funktion:** Kein bestätigter Funktionsdefekt.

**Fehlender Nachweis:** Echte UI-Rennen/Abbrüche und Mobile/Staging nicht geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/onboarding/onboarding.controller.ts:15](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.controller.ts:15)
- [apps/api/src/modules/onboarding/onboarding.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.module.ts:8)
- [apps/api/src/modules/onboarding/onboarding.service.ts:10](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.service.ts:10)
- [apps/web/src/features/onboarding/club-selection.tsx:52](/workspace/kurvenfunk/apps/web/src/features/onboarding/club-selection.tsx:52)
- [apps/web/src/features/onboarding/nickname-selection.tsx:48](/workspace/kurvenfunk/apps/web/src/features/onboarding/nickname-selection.tsx:48)
- [apps/web/src/features/onboarding/onboarding-completion.tsx:20](/workspace/kurvenfunk/apps/web/src/features/onboarding/onboarding-completion.tsx:20)
- [apps/web/src/features/onboarding/onboarding-gate.tsx:12](/workspace/kurvenfunk/apps/web/src/features/onboarding/onboarding-gate.tsx:12)
- [packages/validation/src/fan-preference.ts:4](/workspace/kurvenfunk/packages/validation/src/fan-preference.ts:4)
- [packages/validation/src/nickname.ts:3](/workspace/kurvenfunk/packages/validation/src/nickname.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/onboarding/onboarding.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.controller.spec.ts:1)
- [apps/api/src/modules/onboarding/onboarding.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.service.spec.ts:1)
- [packages/validation/src/fan-preference.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/fan-preference.spec.ts:1)
- [packages/validation/src/nickname.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/nickname.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-105"></a>
## 105 – Vereinsauswahl — PARTIAL

Phase 13: USER ONBOARDING

### Originalanforderung aus dem Masterplan

```text
105 – Vereinsauswahl

Status:   ✅ TODO

Was gemacht werden muss

Alle aktiven Vereine visuell anzeigen:

Logo

Vereinsname

Zusätzliche Auswahl:

Neutral
```

**Implementiert/nachgewiesen:** Aktive Clubs mit Logos/Name und Neutraloption im UI.

**Fehlende Funktion:** Kein bestätigter Defekt der Auswahlfunktion.

**Fehlender Nachweis:** Kein authentifizierter Browser-/Mobile-/Stagingdurchlauf.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/onboarding/onboarding.controller.ts:15](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.controller.ts:15)
- [apps/api/src/modules/onboarding/onboarding.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.module.ts:8)
- [apps/api/src/modules/onboarding/onboarding.service.ts:10](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.service.ts:10)
- [apps/web/src/features/onboarding/club-selection.tsx:52](/workspace/kurvenfunk/apps/web/src/features/onboarding/club-selection.tsx:52)
- [apps/web/src/features/onboarding/nickname-selection.tsx:48](/workspace/kurvenfunk/apps/web/src/features/onboarding/nickname-selection.tsx:48)
- [apps/web/src/features/onboarding/onboarding-completion.tsx:20](/workspace/kurvenfunk/apps/web/src/features/onboarding/onboarding-completion.tsx:20)
- [apps/web/src/features/onboarding/onboarding-gate.tsx:12](/workspace/kurvenfunk/apps/web/src/features/onboarding/onboarding-gate.tsx:12)
- [packages/validation/src/fan-preference.ts:4](/workspace/kurvenfunk/packages/validation/src/fan-preference.ts:4)
- [packages/validation/src/nickname.ts:3](/workspace/kurvenfunk/packages/validation/src/nickname.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/onboarding/onboarding.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.controller.spec.ts:1)
- [apps/api/src/modules/onboarding/onboarding.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.service.spec.ts:1)
- [packages/validation/src/fan-preference.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/fan-preference.spec.ts:1)
- [packages/validation/src/nickname.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/nickname.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-106"></a>
## 106 – Neutral Auswahl — DONE

Phase 13: USER ONBOARDING

### Originalanforderung aus dem Masterplan

```text
106 – Neutral Auswahl

Status:   ✅ TODO
Was gemacht werden muss

Neutral muss eine echte Preference sein und darf nicht mit "Onboarding noch nicht
erledigt" verwechselt werden.
```

**Implementiert/nachgewiesen:** Neutral explizit im Modell und diskriminierten Schema; reale Completion speichert NEUTRAL ohne Club.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/database/prisma/migrations/20260814035327_initial/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814035327_initial/migration.sql:1)
- [packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql:1)
- [packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql:1)
- [packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql:1)
- [packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql:1)
- [packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql:1)
- [packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql:1)
- [packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql:1)
- [packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql:1)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)
- [packages/database/prisma/schema.prisma:14](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:14)
- [packages/database/prisma/seed.ts:1](/workspace/kurvenfunk/packages/database/prisma/seed.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [packages/validation/src/fan-preference.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/fan-preference.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I06 Onboarding neutral persisted and nickname case insensitive conflict.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-107"></a>
## 107 – Onboarding abschließen — PARTIAL

Phase 13: USER ONBOARDING

### Originalanforderung aus dem Masterplan

```text
107 – Onboarding abschließen

Status:   ✅ TODO
Speichern

nickname

fanPreference

favoriteClubId optional

onboardingCompleted = true

Danach Weiterleitung auf personalisierte Startseite.
```

**Implementiert/nachgewiesen:** HTTP-Completion speichert Nickname/Preference/Completion; UI refresh/Redirect implementiert.

**Fehlende Funktion:** Servergate aus 102 fehlt außerhalb Completion.

**Fehlender Nachweis:** Vollständiger Login→Onboarding→personalisierte Seite im Browser offen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/onboarding/onboarding.controller.ts:15](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.controller.ts:15)
- [apps/api/src/modules/onboarding/onboarding.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.module.ts:8)
- [apps/api/src/modules/onboarding/onboarding.service.ts:10](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.service.ts:10)
- [apps/web/src/features/onboarding/club-selection.tsx:52](/workspace/kurvenfunk/apps/web/src/features/onboarding/club-selection.tsx:52)
- [apps/web/src/features/onboarding/nickname-selection.tsx:48](/workspace/kurvenfunk/apps/web/src/features/onboarding/nickname-selection.tsx:48)
- [apps/web/src/features/onboarding/onboarding-completion.tsx:20](/workspace/kurvenfunk/apps/web/src/features/onboarding/onboarding-completion.tsx:20)
- [apps/web/src/features/onboarding/onboarding-gate.tsx:12](/workspace/kurvenfunk/apps/web/src/features/onboarding/onboarding-gate.tsx:12)
- [packages/validation/src/fan-preference.ts:4](/workspace/kurvenfunk/packages/validation/src/fan-preference.ts:4)
- [packages/validation/src/nickname.ts:3](/workspace/kurvenfunk/packages/validation/src/nickname.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/onboarding/onboarding.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.controller.spec.ts:1)
- [apps/api/src/modules/onboarding/onboarding.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/onboarding/onboarding.service.spec.ts:1)
- [packages/validation/src/fan-preference.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/fan-preference.spec.ts:1)
- [packages/validation/src/nickname.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/nickname.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I06 Onboarding neutral persisted and nickname case insensitive conflict.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-108"></a>
## 108 – Vereinswahl später ändern — PARTIAL

Phase 13: USER ONBOARDING

### Originalanforderung aus dem Masterplan

```text
108 – Vereinswahl später ändern

Status:   ✅ TODO
Was gemacht werden muss

Unter Profileinstellungen:

Lieblingsverein ändern

oder:

Neutral



PHASE 14 – PERSONALIZATION & CLUB BRANDING
```

**Implementiert/nachgewiesen:** Reale HTTP-Änderung CLUB→NEUTRAL mit DB-Nachweis erfolgreich; SettingsUI vorhanden.

**Fehlende Funktion:** Kein bestätigter Persistenzdefekt.

**Fehlender Nachweis:** Theme-/Feedwechsel und Mobile/Staging im Browser nicht geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/profiles/profiles.controller.ts:13](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.controller.ts:13)
- [apps/api/src/modules/profiles/profiles.module.ts:7](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.module.ts:7)
- [apps/api/src/modules/profiles/profiles.service.ts:5](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.service.ts:5)
- [apps/web/src/features/profile/club-combobox.tsx:116](/workspace/kurvenfunk/apps/web/src/features/profile/club-combobox.tsx:116)
- [apps/web/src/features/profile/fan-preference-settings.tsx:24](/workspace/kurvenfunk/apps/web/src/features/profile/fan-preference-settings.tsx:24)
- [apps/web/src/features/profile/profile-page.tsx:69](/workspace/kurvenfunk/apps/web/src/features/profile/profile-page.tsx:69)
- [apps/web/src/features/settings/user-settings-page.tsx:72](/workspace/kurvenfunk/apps/web/src/features/settings/user-settings-page.tsx:72)
- [packages/validation/src/profile.ts:3](/workspace/kurvenfunk/packages/validation/src/profile.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/profiles/profiles.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.controller.spec.ts:1)
- [apps/api/src/modules/profiles/profiles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.service.spec.ts:1)
- [packages/validation/src/profile.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/profile.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I07 Favorite club changes persisted then neutral restored.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-109"></a>
## 109 – Club Theme System — PARTIAL

Phase 14: PERSONALIZATION & CLUB BRANDING

### Originalanforderung aus dem Masterplan

```text
109 – Club Theme System

Status:   ✅ TODO
Was gemacht werden muss

Pro Verein definieren:

primaryColor

secondaryColor

accentColor

logo

Daraus Frontend Theme Tokens generieren.
```

**Implementiert/nachgewiesen:** Farb-/Kontrastmapping zu CSS-Themeproperties; Helpertests grün.

**Fehlende Funktion:** Kein bestätigter Tokenmappingdefekt.

**Fehlender Nachweis:** Alle Clubfarben/Kontraste/Komponenten im Browser nicht abgenommen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/personalization/club-theme.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.ts:1)
- [apps/web/src/features/personalization/personalized-club-theme.tsx:38](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-club-theme.tsx:38)
- [apps/web/src/features/personalization/personalized-startpage.tsx:204](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-startpage.tsx:204)
- [apps/web/src/features/personalization/startpage-mock-data.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/startpage-mock-data.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [apps/web/src/features/personalization/club-theme.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.spec.mjs:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-110"></a>
## 110 – Default Kurvenfunk Theme — PARTIAL

Phase 14: PERSONALIZATION & CLUB BRANDING

### Originalanforderung aus dem Masterplan

```text
110 – Default Kurvenfunk Theme

Status:   ✅ TODO
Was gemacht werden muss

Für:

   ●   Gäste

   ●   neutrale Benutzer

   ●   unbekannte Preference

wird das normale Kurvenfunk Branding verwendet.
```

**Implementiert/nachgewiesen:** Standardtheme für Gast/NEUTRAL/UNSET mit getesteten Helperdefaults.

**Fehlende Funktion:** Kein bestätigter Defaultdefekt.

**Fehlender Nachweis:** Gerenderte Gast-/Neutral-/UNSET-Zustände nicht im Browser abgenommen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/personalization/club-theme.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.ts:1)
- [apps/web/src/features/personalization/personalized-club-theme.tsx:38](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-club-theme.tsx:38)
- [apps/web/src/features/personalization/personalized-startpage.tsx:204](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-startpage.tsx:204)
- [apps/web/src/features/personalization/startpage-mock-data.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/startpage-mock-data.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [apps/web/src/features/personalization/club-theme.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.spec.mjs:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-111"></a>
## 111 – Personalized Club Theme — PARTIAL

Phase 14: PERSONALIZATION & CLUB BRANDING

### Originalanforderung aus dem Masterplan

```text
111 – Personalized Club Theme

Status:   ✅ TODO
Was gemacht werden muss

Bei gewähltem Lieblingsverein dürfen ausgewählte UI-Elemente Vereinsfarben
übernehmen.

Beispielsweise:

   ●   Header Akzent

   ●   aktive Navigation

   ●   Buttons/Akzente

   ●   Badges

   ●   Vereinsbereich

Die Seite soll trotzdem klar als Kurvenfunk erkennbar bleiben.
```

**Implementiert/nachgewiesen:** Clubtheme setzt CSSvariablen auf Grundlage der Präferenz; Komponenten konsumieren Tokens.

**Fehlende Funktion:** Kein bestätigter Defekt im Mapping.

**Fehlender Nachweis:** Realer Login-/Clubwechsel-/Kontrast-/Mobile-/Stagingtest fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/personalization/club-theme.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.ts:1)
- [apps/web/src/features/personalization/personalized-club-theme.tsx:38](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-club-theme.tsx:38)
- [apps/web/src/features/personalization/personalized-startpage.tsx:204](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-startpage.tsx:204)
- [apps/web/src/features/personalization/startpage-mock-data.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/startpage-mock-data.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [apps/web/src/features/personalization/club-theme.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.spec.mjs:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-112"></a>
## 112 – News Priorisierung — PARTIAL

Phase 14: PERSONALIZATION & CLUB BRANDING

### Originalanforderung aus dem Masterplan

```text
112 – News Priorisierung

Status:   ✅ TODO
Was gemacht werden muss

Für Fan eines Vereins:

1. relevante News des Lieblingsvereins

2. wichtige Bundesliga News

3. restliche News

Nicht ausschließlich Vereinsnews anzeigen.
```

**Implementiert/nachgewiesen:** API priorisiert Lieblingsclub, Wettbewerb, allgemeine News statt reinem Clubfilter; Unitfälle vorhanden.

**Fehlende Funktion:** Keine fehlende Rankingstufe festgestellt.

**Fehlender Nachweis:** Reale repräsentative Rankingfixtures, Browser und Staging fehlen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/personalization/club-theme.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.ts:1)
- [apps/web/src/features/personalization/personalized-club-theme.tsx:38](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-club-theme.tsx:38)
- [apps/web/src/features/personalization/personalized-startpage.tsx:204](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-startpage.tsx:204)
- [apps/web/src/features/personalization/startpage-mock-data.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/startpage-mock-data.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [apps/web/src/features/personalization/club-theme.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.spec.mjs:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-113"></a>
## 113 – Neutral News Ranking — PARTIAL

Phase 14: PERSONALIZATION & CLUB BRANDING

### Originalanforderung aus dem Masterplan

```text
113 – Neutral News Ranking

Status:   ✅ TODO
Was gemacht werden muss

Neutrale Benutzer bekommen:

   ●   Top News

   ●   aktuelle News

   ●   relevante Liga News

ohne Vereinspriorisierung.
```

**Implementiert/nachgewiesen:** Neutralranking mit Top/Recent/Competition ohne Lieblingsclubfilter vorhanden.

**Fehlende Funktion:** Kein bestätigter Rankingdefekt.

**Fehlender Nachweis:** Repräsentative DB- und Browserabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/personalization/club-theme.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.ts:1)
- [apps/web/src/features/personalization/personalized-club-theme.tsx:38](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-club-theme.tsx:38)
- [apps/web/src/features/personalization/personalized-startpage.tsx:204](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-startpage.tsx:204)
- [apps/web/src/features/personalization/startpage-mock-data.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/startpage-mock-data.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [apps/web/src/features/personalization/club-theme.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.spec.mjs:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-114"></a>
## 114 – Personalized Startpage — PARTIAL

Phase 14: PERSONALIZATION & CLUB BRANDING

### Originalanforderung aus dem Masterplan

```text
114 – Personalized Startpage

Status:   ✅ TODO
Fan-Version

Beispielsweise:

Mein Verein

↓

Vereinsnews

↓

nächstes Spiel

↓

letztes Ergebnis

↓

Tabellenposition

↓

Liga News

↓

Diskussionen

Neutral-Version

Top News

↓

aktuelle Spiele

↓

Liga New

↓

Tabelle

↓

Diskussionen



PHASE 15 – DESIGN SYSTEM
```

**Implementiert/nachgewiesen:** Fan-/Neutralstartseite und echte News-API integriert.

**Fehlende Funktion:** Spiele/Ergebnisse/Tabelle/Diskussionen werden weiter aus Mockdaten bezogen.

**Fehlender Nachweis:** Kein vollständiger authentifizierter Produkt-/Mobile-/Stagingflow.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/personalization/club-theme.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.ts:1)
- [apps/web/src/features/personalization/personalized-club-theme.tsx:38](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-club-theme.tsx:38)
- [apps/web/src/features/personalization/personalized-startpage.tsx:204](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-startpage.tsx:204)
- [apps/web/src/features/personalization/startpage-mock-data.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/startpage-mock-data.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [apps/web/src/features/personalization/club-theme.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.spec.mjs:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-115"></a>
## 115 – Design Tokens — PARTIAL

Phase 15: DESIGN SYSTEM

### Originalanforderung aus dem Masterplan

```text
115 – Design Tokens

Status:   ⬜ TODO

Was gemacht werden muss

Definieren:

   ●     Kurvenfunk Farben

   ●     Vereins-Theme Tokens

   ●     Typografie

   ●     Spacing

   ●     Borders

   ●     Radius

   ●     Breakpoints

   ●     Icons
```

**Implementiert/nachgewiesen:** CSS-/TS-Tokens für Farben/Typografie/Spacing/Border/Radius/Breakpoints/Icons vorhanden.

**Fehlende Funktion:** Keine eindeutig fehlende Tokenkategorie; Icons sind Größen/Stroke-Konvention, kein vollständiger Iconsatz.

**Fehlender Nachweis:** Visuelle/Theming-/A11y-/Mobileabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/web/src/app/design-system/design-system-client.tsx:304](/workspace/kurvenfunk/apps/web/src/app/design-system/design-system-client.tsx:304)
- [apps/web/src/app/design-system/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/design-system/page.tsx:1)
- [packages/ui/src/components/button.tsx:6](/workspace/kurvenfunk/packages/ui/src/components/button.tsx:6)
- [packages/ui/src/components/display.tsx:3](/workspace/kurvenfunk/packages/ui/src/components/display.tsx:3)
- [packages/ui/src/components/form-controls.tsx:15](/workspace/kurvenfunk/packages/ui/src/components/form-controls.tsx:15)
- [packages/ui/src/components/interactive.tsx:5](/workspace/kurvenfunk/packages/ui/src/components/interactive.tsx:5)
- [packages/ui/src/components/overlays.tsx:5](/workspace/kurvenfunk/packages/ui/src/components/overlays.tsx:5)
- [packages/ui/src/styles/components.css:1](/workspace/kurvenfunk/packages/ui/src/styles/components.css:1)
- [packages/ui/src/styles/tokens.css:1](/workspace/kurvenfunk/packages/ui/src/styles/tokens.css:1)
- [packages/ui/src/tokens.ts:1](/workspace/kurvenfunk/packages/ui/src/tokens.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-116"></a>
## 116 – UI Components — PARTIAL

Phase 15: DESIGN SYSTEM

### Originalanforderung aus dem Masterplan

```text
116 – UI Components

Status:   ⬜ TODO
Was gemacht werden muss

Button

Input

Textarea

Select

Checkbox

Switch

Card

Badge

Avatar

Modal

Dialog

Dropdown

Tabs

Tooltip

Toast

Alert

Pagination

Skeleton

EmptyState

Alle müssen Theme Tokens unterstützen.



PHASE 16 – FRONTEND BASE
```

**Implementiert/nachgewiesen:** Geforderte Form-/Display-/Overlay-/Interaktionskomponenten samt Theme-CSS vorhanden.

**Fehlende Funktion:** Keine bestätigte fehlende Komponente aus Exportinventar.

**Fehlender Nachweis:** Keine Keyboard-/Screenreader-/Komponentensuite.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/web/src/app/design-system/design-system-client.tsx:304](/workspace/kurvenfunk/apps/web/src/app/design-system/design-system-client.tsx:304)
- [apps/web/src/app/design-system/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/design-system/page.tsx:1)
- [packages/ui/src/components/button.tsx:6](/workspace/kurvenfunk/packages/ui/src/components/button.tsx:6)
- [packages/ui/src/components/display.tsx:3](/workspace/kurvenfunk/packages/ui/src/components/display.tsx:3)
- [packages/ui/src/components/form-controls.tsx:15](/workspace/kurvenfunk/packages/ui/src/components/form-controls.tsx:15)
- [packages/ui/src/components/interactive.tsx:5](/workspace/kurvenfunk/packages/ui/src/components/interactive.tsx:5)
- [packages/ui/src/components/overlays.tsx:5](/workspace/kurvenfunk/packages/ui/src/components/overlays.tsx:5)
- [packages/ui/src/styles/components.css:1](/workspace/kurvenfunk/packages/ui/src/styles/components.css:1)
- [packages/ui/src/styles/tokens.css:1](/workspace/kurvenfunk/packages/ui/src/styles/tokens.css:1)
- [packages/ui/src/tokens.ts:1](/workspace/kurvenfunk/packages/ui/src/tokens.ts:1)
- [packages/ui/src/index.ts:1](/workspace/kurvenfunk/packages/ui/src/index.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-117"></a>
## 117 – App Shell — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
117 – App Shell

Status:   ⬜ TODO
Was gemacht werden muss

   ●   Header

   ●   Desktop Navigation

   ●   Mobile Navigation

   ●   Content Container

   ●   Footer

   ●   User Menu

   ●   Club Theme
```

**Implementiert/nachgewiesen:** Header/Desktop-/Mobilemenü/Container/Footer/Usermenü/Clubtheme implementiert.

**Fehlende Funktion:** Kein bestätigter Shell-Funktionsdefekt.

**Fehlender Nachweis:** Responsive Auth-/Keyboard-/Mobile-/Stagingnachweis fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/web/src/components/layout/app-shell.tsx:128](/workspace/kurvenfunk/apps/web/src/components/layout/app-shell.tsx:128)
- [apps/web/src/components/layout/route-shell.tsx:8](/workspace/kurvenfunk/apps/web/src/components/layout/route-shell.tsx:8)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-118"></a>
## 118 – Startseite Mock — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
118 – Startseite Mock

Status:   ⬜ TODO
Was gemacht werden muss

Beide Varianten mit Mock-Daten erstellen:

Neutral

Club Fan
```

**Implementiert/nachgewiesen:** Beide ausdrücklich verlangten Mockvarianten implementiert; Mockdaten sind hier beabsichtigt.

**Fehlende Funktion:** Kein API-Anschluss für diese reine Mockaufgabe verlangt.

**Fehlender Nachweis:** Interaktive/visuelle Fan-/Neutral-/Mobileabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/personalization/club-theme.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.ts:1)
- [apps/web/src/features/personalization/personalized-club-theme.tsx:38](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-club-theme.tsx:38)
- [apps/web/src/features/personalization/personalized-startpage.tsx:204](/workspace/kurvenfunk/apps/web/src/features/personalization/personalized-startpage.tsx:204)
- [apps/web/src/features/personalization/startpage-mock-data.ts:1](/workspace/kurvenfunk/apps/web/src/features/personalization/startpage-mock-data.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [apps/web/src/features/personalization/club-theme.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/personalization/club-theme.spec.mjs:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-119"></a>
## 119 – Newsübersicht — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
119 – Newsübersicht

Status:   ⬜ TODO

Was gemacht werden muss

   ●    News Cards

   ●    Pagination

   ●    Filter

   ●    Vereinsfilter

   ●    Wettbewerbsfilter
```

**Implementiert/nachgewiesen:** News-API mit Cards, Pagination und Club-/Wettbewerbsfilter angeschlossen.

**Fehlende Funktion:** Kein aus Code bestätigter fehlender Filter.

**Fehlender Nachweis:** Browser-/Mobile-/Filterseitenwechsel-Abnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/articles.controller.ts:41](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.controller.ts:41)
- [apps/web/src/features/articles/news-overview.tsx:98](/workspace/kurvenfunk/apps/web/src/features/articles/news-overview.tsx:98)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-120"></a>
## 120 – Artikelseite — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
120 – Artikelseite

Status:   ⬜ TODO
Was gemacht werden muss

Anzeigen:

   ●    Titel

   ●    Lead

   ●    Bild

   ●    Quelle

   ●    Autor

   ●    Datum

   ●    Artikel

   ●    Clubs

   ●    Tags

   ●    Diskussion
```

**Implementiert/nachgewiesen:** Artikelansicht zeigt Inhalt/Metadaten/Clubs/Tags und Kommentarbereich.

**Fehlende Funktion:** Kein im statischen Slice fehlendes Kernelement bestätigt.

**Fehlender Nachweis:** Editor→öffentliche Seite→Kommentar nicht als kompletter Browserflow geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/web/src/app/artikel/[slug]/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/artikel/[slug]/page.tsx:1)
- [apps/web/src/features/articles/article-detail.tsx:31](/workspace/kurvenfunk/apps/web/src/features/articles/article-detail.tsx:31)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-121"></a>
## 121 – Vereinsseite — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
121 – Vereinsseite

Status:   ⬜ TODO
Bereiche

Übersicht

News

Spiele

Tabelle

Forum
```

**Implementiert/nachgewiesen:** Clubstammdaten aus API, Tabs und Bereichslayout vorhanden.

**Fehlende Funktion:** News/Spiele/Tabelle/Diskussionen aus getClubPageMockData; kein echtes Forum.

**Fehlender Nachweis:** Browser-/Mobileabnahme und echte Bereichsintegration fehlen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/clubs/clubs.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.controller.ts:5)
- [apps/api/src/modules/clubs/clubs.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.module.ts:6)
- [apps/api/src/modules/clubs/clubs.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.service.ts:4)
- [apps/api/src/modules/competitions/competitions.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.controller.ts:5)
- [apps/api/src/modules/competitions/competitions.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.module.ts:6)
- [apps/api/src/modules/competitions/competitions.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.service.ts:4)
- [apps/api/src/modules/matches/matches.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.controller.ts:5)
- [apps/api/src/modules/matches/matches.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.module.ts:6)
- [apps/api/src/modules/matches/matches.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.service.ts:4)
- [apps/api/src/modules/seasons/seasons.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/seasons/seasons.module.ts:3)
- [apps/api/src/modules/standings/standings.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.controller.ts:5)
- [apps/api/src/modules/standings/standings.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.module.ts:6)
- [apps/api/src/modules/standings/standings.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.service.ts:4)
- [apps/web/src/features/clubs/club-detail.tsx:9](/workspace/kurvenfunk/apps/web/src/features/clubs/club-detail.tsx:9)
- [apps/web/src/features/matches/match-detail.tsx:8](/workspace/kurvenfunk/apps/web/src/features/matches/match-detail.tsx:8)
- [apps/web/src/features/matches/match-schedule-page.tsx:221](/workspace/kurvenfunk/apps/web/src/features/matches/match-schedule-page.tsx:221)
- [apps/web/src/features/standings/standings-page.tsx:287](/workspace/kurvenfunk/apps/web/src/features/standings/standings-page.tsx:287)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/clubs/clubs.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.controller.spec.ts:1)
- [apps/api/src/modules/clubs/clubs.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.service.spec.ts:1)
- [apps/api/src/modules/matches/matches.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.controller.spec.ts:1)
- [apps/api/src/modules/matches/matches.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.service.spec.ts:1)
- [apps/api/src/modules/standings/standings.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.controller.spec.ts:1)
- [apps/api/src/modules/standings/standings.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-122"></a>
## 122 – Spielseite — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
122 – Spielseite

Status:   ⬜ TODO
Was gemacht werden muss

   ●   Teams

   ●   Vereinslogos

   ●   Ergebnis

   ●   Status

   ●   Wettbewerb

   ●   Spieltag

   ●   Datum

   ●   News

   ●   Diskussion
```

**Implementiert/nachgewiesen:** Matchdetail mit Teams/Score/Status/Datum/Wettbewerb/News vorhanden.

**Fehlende Funktion:** Spieldiskussion ist kein vollständig angebundener Communityflow.

**Fehlender Nachweis:** Browser-/Mobile- und echte Importdatenprüfung fehlen; Import selbst ist andere Aufgabe.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/clubs/clubs.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.controller.ts:5)
- [apps/api/src/modules/clubs/clubs.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.module.ts:6)
- [apps/api/src/modules/clubs/clubs.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.service.ts:4)
- [apps/api/src/modules/competitions/competitions.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.controller.ts:5)
- [apps/api/src/modules/competitions/competitions.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.module.ts:6)
- [apps/api/src/modules/competitions/competitions.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.service.ts:4)
- [apps/api/src/modules/matches/matches.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.controller.ts:5)
- [apps/api/src/modules/matches/matches.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.module.ts:6)
- [apps/api/src/modules/matches/matches.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.service.ts:4)
- [apps/api/src/modules/seasons/seasons.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/seasons/seasons.module.ts:3)
- [apps/api/src/modules/standings/standings.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.controller.ts:5)
- [apps/api/src/modules/standings/standings.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.module.ts:6)
- [apps/api/src/modules/standings/standings.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.service.ts:4)
- [apps/web/src/features/clubs/club-detail.tsx:9](/workspace/kurvenfunk/apps/web/src/features/clubs/club-detail.tsx:9)
- [apps/web/src/features/matches/match-detail.tsx:8](/workspace/kurvenfunk/apps/web/src/features/matches/match-detail.tsx:8)
- [apps/web/src/features/matches/match-schedule-page.tsx:221](/workspace/kurvenfunk/apps/web/src/features/matches/match-schedule-page.tsx:221)
- [apps/web/src/features/standings/standings-page.tsx:287](/workspace/kurvenfunk/apps/web/src/features/standings/standings-page.tsx:287)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/clubs/clubs.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.controller.spec.ts:1)
- [apps/api/src/modules/clubs/clubs.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.service.spec.ts:1)
- [apps/api/src/modules/matches/matches.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.controller.spec.ts:1)
- [apps/api/src/modules/matches/matches.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.service.spec.ts:1)
- [apps/api/src/modules/standings/standings.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.controller.spec.ts:1)
- [apps/api/src/modules/standings/standings.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-123"></a>
## 123 – Tabelle — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
123 – Tabelle

Status:   ⬜ TODO
Desktop und Mobile optimieren.

Lieblingsverein visuell hervorheben.
```

**Implementiert/nachgewiesen:** DB-LeseAPI, Tabellenlayout, Lieblingsclubhighlight und Vorschau/Fallback vorhanden.

**Fehlende Funktion:** Fallbackdaten können echte Fehler verdecken; kein echter laufender Datenversorgungsnachweis.

**Fehlender Nachweis:** Desktop/Mobile-Highlightabnahme fehlt; Tabellenberechnung ist separater späterer Auftrag.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/clubs/clubs.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.controller.ts:5)
- [apps/api/src/modules/clubs/clubs.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.module.ts:6)
- [apps/api/src/modules/clubs/clubs.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.service.ts:4)
- [apps/api/src/modules/competitions/competitions.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.controller.ts:5)
- [apps/api/src/modules/competitions/competitions.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.module.ts:6)
- [apps/api/src/modules/competitions/competitions.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.service.ts:4)
- [apps/api/src/modules/matches/matches.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.controller.ts:5)
- [apps/api/src/modules/matches/matches.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.module.ts:6)
- [apps/api/src/modules/matches/matches.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.service.ts:4)
- [apps/api/src/modules/seasons/seasons.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/seasons/seasons.module.ts:3)
- [apps/api/src/modules/standings/standings.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.controller.ts:5)
- [apps/api/src/modules/standings/standings.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.module.ts:6)
- [apps/api/src/modules/standings/standings.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.service.ts:4)
- [apps/web/src/features/clubs/club-detail.tsx:9](/workspace/kurvenfunk/apps/web/src/features/clubs/club-detail.tsx:9)
- [apps/web/src/features/matches/match-detail.tsx:8](/workspace/kurvenfunk/apps/web/src/features/matches/match-detail.tsx:8)
- [apps/web/src/features/matches/match-schedule-page.tsx:221](/workspace/kurvenfunk/apps/web/src/features/matches/match-schedule-page.tsx:221)
- [apps/web/src/features/standings/standings-page.tsx:287](/workspace/kurvenfunk/apps/web/src/features/standings/standings-page.tsx:287)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/clubs/clubs.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.controller.spec.ts:1)
- [apps/api/src/modules/clubs/clubs.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.service.spec.ts:1)
- [apps/api/src/modules/matches/matches.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.controller.spec.ts:1)
- [apps/api/src/modules/matches/matches.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.service.spec.ts:1)
- [apps/api/src/modules/standings/standings.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.controller.spec.ts:1)
- [apps/api/src/modules/standings/standings.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-124"></a>
## 124 – Spielplan — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
124 – Spielplan

Status:   ⬜ TODO
Lieblingsverein ebenfalls hervorheben.
```

**Implementiert/nachgewiesen:** API-Spielplan mit Spieltagswahl/Favoritenmarkierung und Vorschaufallback.

**Fehlende Funktion:** Fallback bei Datenproblemen fachlich nicht klar vom Produktbetrieb getrennt.

**Fehlender Nachweis:** Browser-/Mobileabnahme fehlt; Liveimport nicht durch LeseUI behauptet.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/clubs/clubs.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.controller.ts:5)
- [apps/api/src/modules/clubs/clubs.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.module.ts:6)
- [apps/api/src/modules/clubs/clubs.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.service.ts:4)
- [apps/api/src/modules/competitions/competitions.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.controller.ts:5)
- [apps/api/src/modules/competitions/competitions.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.module.ts:6)
- [apps/api/src/modules/competitions/competitions.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/competitions/competitions.service.ts:4)
- [apps/api/src/modules/matches/matches.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.controller.ts:5)
- [apps/api/src/modules/matches/matches.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.module.ts:6)
- [apps/api/src/modules/matches/matches.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.service.ts:4)
- [apps/api/src/modules/seasons/seasons.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/seasons/seasons.module.ts:3)
- [apps/api/src/modules/standings/standings.controller.ts:5](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.controller.ts:5)
- [apps/api/src/modules/standings/standings.module.ts:6](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.module.ts:6)
- [apps/api/src/modules/standings/standings.service.ts:4](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.service.ts:4)
- [apps/web/src/features/clubs/club-detail.tsx:9](/workspace/kurvenfunk/apps/web/src/features/clubs/club-detail.tsx:9)
- [apps/web/src/features/matches/match-detail.tsx:8](/workspace/kurvenfunk/apps/web/src/features/matches/match-detail.tsx:8)
- [apps/web/src/features/matches/match-schedule-page.tsx:221](/workspace/kurvenfunk/apps/web/src/features/matches/match-schedule-page.tsx:221)
- [apps/web/src/features/standings/standings-page.tsx:287](/workspace/kurvenfunk/apps/web/src/features/standings/standings-page.tsx:287)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/clubs/clubs.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.controller.spec.ts:1)
- [apps/api/src/modules/clubs/clubs.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/clubs/clubs.service.spec.ts:1)
- [apps/api/src/modules/matches/matches.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.controller.spec.ts:1)
- [apps/api/src/modules/matches/matches.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/matches/matches.service.spec.ts:1)
- [apps/api/src/modules/standings/standings.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.controller.spec.ts:1)
- [apps/api/src/modules/standings/standings.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/standings/standings.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-125"></a>
## 125 – Profilseite — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
125 – Profilseite

Status:   ⬜ TODO
Anzeigen

   ●     Nickname

   ●     Avatar

   ●     Lieblingsverein

   ●     Bio

   ●     Communityaktivität
```

**Implementiert/nachgewiesen:** Eigene Profilseite mit Nickname/Bio/Avatar/Club/Aktivitätszählern und API vorhanden.

**Fehlende Funktion:** Keine belegte vollständige öffentliche Profil-/Avatarbedienung.

**Fehlender Nachweis:** Echter Profil-/Avatarbrowserflow und Staging fehlen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/profiles/profiles.controller.ts:13](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.controller.ts:13)
- [apps/api/src/modules/profiles/profiles.module.ts:7](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.module.ts:7)
- [apps/api/src/modules/profiles/profiles.service.ts:5](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.service.ts:5)
- [apps/web/src/features/profile/club-combobox.tsx:116](/workspace/kurvenfunk/apps/web/src/features/profile/club-combobox.tsx:116)
- [apps/web/src/features/profile/fan-preference-settings.tsx:24](/workspace/kurvenfunk/apps/web/src/features/profile/fan-preference-settings.tsx:24)
- [apps/web/src/features/profile/profile-page.tsx:69](/workspace/kurvenfunk/apps/web/src/features/profile/profile-page.tsx:69)
- [apps/web/src/features/settings/user-settings-page.tsx:72](/workspace/kurvenfunk/apps/web/src/features/settings/user-settings-page.tsx:72)
- [packages/validation/src/profile.ts:3](/workspace/kurvenfunk/packages/validation/src/profile.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/profiles/profiles.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.controller.spec.ts:1)
- [apps/api/src/modules/profiles/profiles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.service.spec.ts:1)
- [packages/validation/src/profile.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/profile.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-126"></a>
## 126 – User Settings — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
126 – User Settings

Status:   ⬜ TODO
Bereiche:

Profil

Lieblingsverein

Account

Datenschutz

Benachrichtigungen

Sessions
```

**Implementiert/nachgewiesen:** Profil- und Clubsettings funktionieren API-seitig; Account-/Sessionsabschnitte vorhanden.

**Fehlende Funktion:** Datenschutz/Notifications sind explizit geplant; Sessions zeigt statische aktuelle Session statt Liste/Management.

**Fehlender Nachweis:** Browser-/Stagingabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/profiles/profiles.controller.ts:13](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.controller.ts:13)
- [apps/api/src/modules/profiles/profiles.module.ts:7](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.module.ts:7)
- [apps/api/src/modules/profiles/profiles.service.ts:5](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.service.ts:5)
- [apps/web/src/features/profile/club-combobox.tsx:116](/workspace/kurvenfunk/apps/web/src/features/profile/club-combobox.tsx:116)
- [apps/web/src/features/profile/fan-preference-settings.tsx:24](/workspace/kurvenfunk/apps/web/src/features/profile/fan-preference-settings.tsx:24)
- [apps/web/src/features/profile/profile-page.tsx:69](/workspace/kurvenfunk/apps/web/src/features/profile/profile-page.tsx:69)
- [apps/web/src/features/settings/user-settings-page.tsx:72](/workspace/kurvenfunk/apps/web/src/features/settings/user-settings-page.tsx:72)
- [packages/validation/src/profile.ts:3](/workspace/kurvenfunk/packages/validation/src/profile.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/profiles/profiles.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.controller.spec.ts:1)
- [apps/api/src/modules/profiles/profiles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/profiles/profiles.service.spec.ts:1)
- [packages/validation/src/profile.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/profile.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-127"></a>
## 127 – Admin Layout — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
127 – Admin Layout

Status:   ⬜ TODO
Navigation:

Dashboard

Artikel

Medien

Importe

Sportdaten

Benutzer

Moderation

Forum

System
```

**Implementiert/nachgewiesen:** Alle verlangten Admin-Navigationspunkte vorhanden.

**Fehlende Funktion:** Keine zentrale Rollenprüfung im Adminlayout; mehrere Fachseiten Platzhalter.

**Fehlender Nachweis:** Kein Nachweis unberechtigter API-Mutation; Menüanzeige allein ist kein API-Bypass. Browser-/Stagingabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/admin/admin.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/admin/admin.module.ts:3)
- [apps/web/src/app/admin/artikel/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/admin/artikel/page.tsx:1)
- [apps/web/src/app/admin/benutzer/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/admin/benutzer/page.tsx:1)
- [apps/web/src/app/admin/forum/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/admin/forum/page.tsx:1)
- [apps/web/src/app/admin/importe/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/admin/importe/page.tsx:1)
- [apps/web/src/app/admin/kategorien/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/admin/kategorien/page.tsx:1)
- [apps/web/src/app/admin/medien/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/admin/medien/page.tsx:1)
- [apps/web/src/app/admin/moderation/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/admin/moderation/page.tsx:1)
- [apps/web/src/app/admin/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/admin/page.tsx:1)
- [apps/web/src/app/admin/sportdaten/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/admin/sportdaten/page.tsx:1)
- [apps/web/src/app/admin/system/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/admin/system/page.tsx:1)
- [apps/web/src/app/admin/tags/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/admin/tags/page.tsx:1)
- [apps/web/src/features/admin/admin-layout.tsx:31](/workspace/kurvenfunk/apps/web/src/features/admin/admin-layout.tsx:31)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-128"></a>
## 128 – Loading States — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
128 – Loading States

Status:   ⬜ TODO
Skeletons für alle wichtigen Inhalte.
```

**Implementiert/nachgewiesen:** Skeletons und Loadingkomponenten für Kernseiten vorhanden.

**Fehlende Funktion:** Keine aus Inventar allein behauptete vollständige Zustandsabdeckung.

**Fehlender Nachweis:** Langsame/abgebrochene Requests nicht systematisch im Browser geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/web/src/features/loading/loading-states.tsx:5](/workspace/kurvenfunk/apps/web/src/features/loading/loading-states.tsx:5)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-129"></a>
## 129 – Empty States — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
129 – Empty States

Status:   ⬜ TODO
Klare Zustände für leere Listen.
```

**Implementiert/nachgewiesen:** EmptyState und fachliche Leerhinweise vorhanden.

**Fehlende Funktion:** Keine vollständig nachgewiesene Abdeckung jeder Liste.

**Fehlender Nachweis:** Leere Fixtures pro Kernseite/Browser/Mobile fehlen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/web/src/app/design-system/design-system-client.tsx:304](/workspace/kurvenfunk/apps/web/src/app/design-system/design-system-client.tsx:304)
- [apps/web/src/app/design-system/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/design-system/page.tsx:1)
- [packages/ui/src/components/button.tsx:6](/workspace/kurvenfunk/packages/ui/src/components/button.tsx:6)
- [packages/ui/src/components/display.tsx:3](/workspace/kurvenfunk/packages/ui/src/components/display.tsx:3)
- [packages/ui/src/components/form-controls.tsx:15](/workspace/kurvenfunk/packages/ui/src/components/form-controls.tsx:15)
- [packages/ui/src/components/interactive.tsx:5](/workspace/kurvenfunk/packages/ui/src/components/interactive.tsx:5)
- [packages/ui/src/components/overlays.tsx:5](/workspace/kurvenfunk/packages/ui/src/components/overlays.tsx:5)
- [packages/ui/src/styles/components.css:1](/workspace/kurvenfunk/packages/ui/src/styles/components.css:1)
- [packages/ui/src/styles/tokens.css:1](/workspace/kurvenfunk/packages/ui/src/styles/tokens.css:1)
- [packages/ui/src/tokens.ts:1](/workspace/kurvenfunk/packages/ui/src/tokens.ts:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-130"></a>
## 130 – Error States — PARTIAL

Phase 16: FRONTEND BASE

### Originalanforderung aus dem Masterplan

```text
130 – Error States

Status:   ⬜ TODO
403

404

429

500



PHASE 17 – EDITORIAL SYSTEM
```

**Implementiert/nachgewiesen:** 403/404/429/500-Ansichten und Errorboundary vorhanden.

**Fehlende Funktion:** Vorhandene UI ist kein Beleg korrekter HTTPstatus-/Recoverysemantik.

**Fehlender Nachweis:** Fehlerseitenstatus, Retry/Navigation und Mobile/Staging nicht systematisch geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/web/src/app/403/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/403/page.tsx:1)
- [apps/web/src/app/429/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/429/page.tsx:1)
- [apps/web/src/app/500/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/500/page.tsx:1)
- [apps/web/src/app/error.tsx:1](/workspace/kurvenfunk/apps/web/src/app/error.tsx:1)
- [apps/web/src/app/not-found.tsx:1](/workspace/kurvenfunk/apps/web/src/app/not-found.tsx:1)
- [apps/web/src/features/errors/error-state.tsx:15](/workspace/kurvenfunk/apps/web/src/features/errors/error-state.tsx:15)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-131"></a>
## 131 – Article CRUD — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
131 – Article CRUD

Status:   ⬜ TODO
Was gemacht werden muss

   ●   Create

   ●   Read

   ●   Edit

   ●   Archive

   ●   Delete

   ●   Restore
```

**Implementiert/nachgewiesen:** CRUD/Archive/Softdelete/Restore in Service/API/UI; realer HTTP-/DB-Durchlauf geprüft.

**Fehlende Funktion:** Keine durchgängige Auditspur redaktioneller Mutationen.

**Fehlender Nachweis:** Browser-/Mobile-/Stagingworkflow fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/article-editorial.guard.ts:13](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.ts:13)
- [apps/api/src/modules/articles/articles.controller.ts:41](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.controller.ts:41)
- [apps/api/src/modules/articles/articles.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.module.ts:8)
- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/admin/articles/article-editor.tsx:145](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-editor.tsx:145)
- [apps/web/src/features/admin/articles/article-list.tsx:36](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-list.tsx:36)
- [packages/validation/src/article.ts:111](/workspace/kurvenfunk/packages/validation/src/article.ts:111)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/article-editorial.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.spec.ts:1)
- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [packages/validation/src/article.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/article.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I15 Editorial real HTTP CRUD relations workflow revisions archive delete restore.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-132"></a>
## 132 – Publication Workflow — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
132 – Publication Workflow

Status:   ⬜ TODO
draft

review

scheduled

published

archived
```

**Implementiert/nachgewiesen:** DRAFT/REVIEW/SCHEDULED/PUBLISHED/ARCHIVED; Permissionchecks und reale Review/Publishtransition geprüft.

**Fehlende Funktion:** Keine durchgängigen Fach-/Auditevents der Transitionen.

**Fehlender Nachweis:** Vollständiger UI-/Worker-/Stagingflow und verbotene Transitionen nicht real abgenommen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/article-editorial.guard.ts:13](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.ts:13)
- [apps/api/src/modules/articles/articles.controller.ts:41](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.controller.ts:41)
- [apps/api/src/modules/articles/articles.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.module.ts:8)
- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/admin/articles/article-editor.tsx:145](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-editor.tsx:145)
- [apps/web/src/features/admin/articles/article-list.tsx:36](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-list.tsx:36)
- [packages/validation/src/article.ts:111](/workspace/kurvenfunk/packages/validation/src/article.ts:111)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/article-editorial.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.spec.ts:1)
- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [packages/validation/src/article.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/article.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I15 Editorial real HTTP CRUD relations workflow revisions archive delete restore.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-133"></a>
## 133 – Article Editor — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
133 – Article Editor

Status:   ⬜ TODO
Unterstützen:

   ●    Text

   ●    Überschriften

   ●    Links

   ●    Listen

   ●    Zitate

   ●    Bilder
```

**Implementiert/nachgewiesen:** Tiptap mit Text/Heading/Link/Listen/Zitat/Bild; serverseitiges Inhaltsschema vorhanden.

**Fehlende Funktion:** Kein bestätigter fehlender Editorbaustein.

**Fehlender Nachweis:** Echte Tastatur-/Paste-/Bild-/Security-/Browserabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/article-editorial.guard.ts:13](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.ts:13)
- [apps/api/src/modules/articles/articles.controller.ts:41](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.controller.ts:41)
- [apps/api/src/modules/articles/articles.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.module.ts:8)
- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/admin/articles/article-editor.tsx:145](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-editor.tsx:145)
- [apps/web/src/features/admin/articles/article-list.tsx:36](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-list.tsx:36)
- [packages/validation/src/article.ts:111](/workspace/kurvenfunk/packages/validation/src/article.ts:111)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/article-editorial.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.spec.ts:1)
- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [packages/validation/src/article.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/article.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-134"></a>
## 134 – Kategorien — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
134 – Kategorien

Status:   ⬜ TODO
CRUD und Artikelzuordnung.
```

**Implementiert/nachgewiesen:** Category CRUD/Validation/Admin und Artikelzuordnung vorhanden.

**Fehlende Funktion:** Kein bestätigter fehlender CRUDpfad.

**Fehlender Nachweis:** Echter vollständiger CRUD-/UI-/Staginglauf fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/categories/categories.controller.ts:14](/workspace/kurvenfunk/apps/api/src/modules/categories/categories.controller.ts:14)
- [apps/api/src/modules/categories/categories.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/categories/categories.module.ts:9)
- [apps/api/src/modules/categories/categories.service.ts:11](/workspace/kurvenfunk/apps/api/src/modules/categories/categories.service.ts:11)
- [apps/web/src/features/admin/categories/category-admin.tsx:41](/workspace/kurvenfunk/apps/web/src/features/admin/categories/category-admin.tsx:41)
- [packages/validation/src/category.ts:5](/workspace/kurvenfunk/packages/validation/src/category.ts:5)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-135"></a>
## 135 – Tags — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
135 – Tags

Status:   ⬜ TODO
CRUD und Artikelzuordnung.
```

**Implementiert/nachgewiesen:** Tag CRUD/Validation/Admin und Artikelzuordnung vorhanden.

**Fehlende Funktion:** Kein bestätigter fehlender CRUDpfad.

**Fehlender Nachweis:** Echter vollständiger CRUD-/UI-/Staginglauf fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/tags/tags.controller.ts:14](/workspace/kurvenfunk/apps/api/src/modules/tags/tags.controller.ts:14)
- [apps/api/src/modules/tags/tags.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/tags/tags.module.ts:9)
- [apps/api/src/modules/tags/tags.service.ts:11](/workspace/kurvenfunk/apps/api/src/modules/tags/tags.service.ts:11)
- [apps/web/src/features/admin/tags/tag-admin.tsx:41](/workspace/kurvenfunk/apps/web/src/features/admin/tags/tag-admin.tsx:41)
- [packages/validation/src/tag.ts:5](/workspace/kurvenfunk/packages/validation/src/tag.ts:5)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-136"></a>
## 136 – Club Assignment — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
136 – Club Assignment

Status:   ⬜ TODO
Mehrere Vereine pro Artikel ermöglichen.

Extrem wichtig für Personalisierung.
```

**Implementiert/nachgewiesen:** Mehrfachclubzuordnung im Schema/Validation/Service/Editor; relationale HTTP-Erstellung geprüft.

**Fehlende Funktion:** Kein fehlender Mehrfachvertrag festgestellt.

**Fehlender Nachweis:** Mehrere Clubs gleichzeitig plus personalisierter Feed im Browser nicht real abgenommen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/article-editorial.guard.ts:13](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.ts:13)
- [apps/api/src/modules/articles/articles.controller.ts:41](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.controller.ts:41)
- [apps/api/src/modules/articles/articles.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.module.ts:8)
- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/admin/articles/article-editor.tsx:145](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-editor.tsx:145)
- [apps/web/src/features/admin/articles/article-list.tsx:36](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-list.tsx:36)
- [packages/validation/src/article.ts:111](/workspace/kurvenfunk/packages/validation/src/article.ts:111)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/article-editorial.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.spec.ts:1)
- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [packages/validation/src/article.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/article.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I15 Editorial real HTTP CRUD relations workflow revisions archive delete restore.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-137"></a>
## 137 – Competition Assignment — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
137 – Competition Assignment

Status:   ⬜ TODO
```

**Implementiert/nachgewiesen:** competitionId in Schema/Validation/Service/Editor; echte HTTP-Erstellung mit Wettbewerb geprüft.

**Fehlende Funktion:** Kein bestätigter fehlender Zuordnungspfad.

**Fehlender Nachweis:** Fehlende/falsche Wettbewerbe und Browser-/Stagingfälle nicht vollständig geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/article-editorial.guard.ts:13](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.ts:13)
- [apps/api/src/modules/articles/articles.controller.ts:41](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.controller.ts:41)
- [apps/api/src/modules/articles/articles.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.module.ts:8)
- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/admin/articles/article-editor.tsx:145](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-editor.tsx:145)
- [apps/web/src/features/admin/articles/article-list.tsx:36](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-list.tsx:36)
- [packages/validation/src/article.ts:111](/workspace/kurvenfunk/packages/validation/src/article.ts:111)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/article-editorial.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.spec.ts:1)
- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [packages/validation/src/article.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/article.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I15 Editorial real HTTP CRUD relations workflow revisions archive delete restore.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-138"></a>
## 138 – Match Assignment — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
138 – Match Assignment

Status:   ⬜ TODO
```

**Implementiert/nachgewiesen:** matchId in Schema/Validation/Service/Editor; echte HTTP-Erstellung mit Spiel geprüft.

**Fehlende Funktion:** Kein bestätigter fehlender Zuordnungspfad.

**Fehlender Nachweis:** Inkonsistente Spiel-/Wettbewerbskombination und Browser-/Stagingfälle offen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/article-editorial.guard.ts:13](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.ts:13)
- [apps/api/src/modules/articles/articles.controller.ts:41](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.controller.ts:41)
- [apps/api/src/modules/articles/articles.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.module.ts:8)
- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/admin/articles/article-editor.tsx:145](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-editor.tsx:145)
- [apps/web/src/features/admin/articles/article-list.tsx:36](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-list.tsx:36)
- [packages/validation/src/article.ts:111](/workspace/kurvenfunk/packages/validation/src/article.ts:111)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/article-editorial.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.spec.ts:1)
- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [packages/validation/src/article.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/article.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I15 Editorial real HTTP CRUD relations workflow revisions archive delete restore.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-139"></a>
## 139 – Media Upload — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
139 – Media Upload

Status:   ⬜ TODO
Upload über Storage Abstraction.
```

**Implementiert/nachgewiesen:** S3-Storageabstraktion, Multipartgrenze 10MB und MIME-Allowlist implementiert.

**Fehlende Funktion:** Bildbytes werden nicht gegen Signatur/Dekodierung geprüft; Client-MIME reicht.

**Fehlender Nachweis:** Kein echter MinIO/R2-Roundtrip und Browserupload.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/infrastructure/storage/s3-storage.service.ts:18](/workspace/kurvenfunk/apps/api/src/infrastructure/storage/s3-storage.service.ts:18)
- [apps/api/src/infrastructure/storage/storage.module.ts:6](/workspace/kurvenfunk/apps/api/src/infrastructure/storage/storage.module.ts:6)
- [apps/api/src/infrastructure/storage/storage.types.ts:1](/workspace/kurvenfunk/apps/api/src/infrastructure/storage/storage.types.ts:1)
- [apps/api/src/modules/media/media.controller.ts:32](/workspace/kurvenfunk/apps/api/src/modules/media/media.controller.ts:32)
- [apps/api/src/modules/media/media.module.ts:10](/workspace/kurvenfunk/apps/api/src/modules/media/media.module.ts:10)
- [apps/api/src/modules/media/media.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/media/media.service.ts:22)
- [apps/web/src/features/admin/media/media-library.tsx:97](/workspace/kurvenfunk/apps/web/src/features/admin/media/media-library.tsx:97)
- [packages/validation/src/media.ts:18](/workspace/kurvenfunk/packages/validation/src/media.ts:18)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/media/media.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/media/media.service.spec.ts:1)
- [packages/validation/src/media.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/media.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-140"></a>
## 140 – Media Library — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
140 – Media Library

Status:   ⬜ TODO
Verwalten:

   ●   Bild

   ●   Alt Text

   ●   Copyright

   ●   Quelle

   ●   Verwendung
```

**Implementiert/nachgewiesen:** Media Library mit Metadaten und Usagezählung vorhanden.

**Fehlende Funktion:** Usage zählt Profile/Clubs/Leadbilder, keine OG-Verwendungen.

**Fehlender Nachweis:** Echte Storage-/UI-/Delete-/Errorabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/infrastructure/storage/s3-storage.service.ts:18](/workspace/kurvenfunk/apps/api/src/infrastructure/storage/s3-storage.service.ts:18)
- [apps/api/src/infrastructure/storage/storage.module.ts:6](/workspace/kurvenfunk/apps/api/src/infrastructure/storage/storage.module.ts:6)
- [apps/api/src/infrastructure/storage/storage.types.ts:1](/workspace/kurvenfunk/apps/api/src/infrastructure/storage/storage.types.ts:1)
- [apps/api/src/modules/media/media.controller.ts:32](/workspace/kurvenfunk/apps/api/src/modules/media/media.controller.ts:32)
- [apps/api/src/modules/media/media.module.ts:10](/workspace/kurvenfunk/apps/api/src/modules/media/media.module.ts:10)
- [apps/api/src/modules/media/media.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/media/media.service.ts:22)
- [apps/web/src/features/admin/media/media-library.tsx:97](/workspace/kurvenfunk/apps/web/src/features/admin/media/media-library.tsx:97)
- [packages/validation/src/media.ts:18](/workspace/kurvenfunk/packages/validation/src/media.ts:18)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/media/media.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/media/media.service.spec.ts:1)
- [packages/validation/src/media.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/media.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-141"></a>
## 141 – SEO Fields — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
141 – SEO Fields

Status:   ⬜ TODO
slug

seoTitle

seoDescription

canonicalUrl

ogImage
```

**Implementiert/nachgewiesen:** Slug/seoTitle/seoDescription/canonicalUrl/ogImage im Modell/Editor und generateMetadata.

**Fehlende Funktion:** Kein aus Quellprüfung bestätigtes fehlendes Feld.

**Fehlender Nachweis:** Crawler-/OG-/Canonical-/Browsernachweis fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/article-editorial.guard.ts:13](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.ts:13)
- [apps/api/src/modules/articles/articles.controller.ts:41](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.controller.ts:41)
- [apps/api/src/modules/articles/articles.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.module.ts:8)
- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/admin/articles/article-editor.tsx:145](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-editor.tsx:145)
- [apps/web/src/features/admin/articles/article-list.tsx:36](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-list.tsx:36)
- [packages/validation/src/article.ts:111](/workspace/kurvenfunk/packages/validation/src/article.ts:111)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/article-editorial.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.spec.ts:1)
- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [packages/validation/src/article.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/article.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-142"></a>
## 142 – Revisions — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
142 – Revisions

Status:   ⬜ TODO
Änderungshistorie speichern.
```

**Implementiert/nachgewiesen:** Revisionen speichern Inhaltssnapshots; echte Articleupdateprobe erzeugt Revision.

**Fehlende Funktion:** Expliziter Änderungsakteur fehlt im Revisionsmodell.

**Fehlender Nachweis:** History-/Concurrency-/Frontend-/Stagingabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/articles/article-editorial.guard.ts:13](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.ts:13)
- [apps/api/src/modules/articles/articles.controller.ts:41](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.controller.ts:41)
- [apps/api/src/modules/articles/articles.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.module.ts:8)
- [apps/api/src/modules/articles/articles.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.ts:22)
- [apps/web/src/features/admin/articles/article-editor.tsx:145](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-editor.tsx:145)
- [apps/web/src/features/admin/articles/article-list.tsx:36](/workspace/kurvenfunk/apps/web/src/features/admin/articles/article-list.tsx:36)
- [packages/validation/src/article.ts:111](/workspace/kurvenfunk/packages/validation/src/article.ts:111)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/articles/article-editorial.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.spec.ts:1)
- [apps/api/src/modules/articles/articles.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/articles/articles.service.spec.ts:1)
- [packages/validation/src/article.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/article.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I15 Editorial real HTTP CRUD relations workflow revisions archive delete restore.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-143"></a>
## 143 – Scheduled Publishing — PARTIAL

Phase 17: EDITORIAL SYSTEM

### Originalanforderung aus dem Masterplan

```text
143 – Scheduled Publishing

Status:   ⬜ TODO
Worker veröffentlicht Artikel zum geplanten Zeitpunkt.



PHASE 18 – NEWS IMPORT
```

**Implementiert/nachgewiesen:** Due-Scanner mit konditionalem Update; echte DB-Probe publiziert einen fälligen Artikel genau einmal.

**Fehlende Funktion:** Keine Audit-/Reindex-/Notificationfolgen implementiert.

**Fehlender Nachweis:** Direkter Serviceaufruf beweist Übergang, nicht den kompletten zeitgesteuerten UI→Queue→Workerflow; Staging offen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/jobs/scheduled-publishing-job.service.ts:15](/workspace/kurvenfunk/apps/worker/src/jobs/scheduled-publishing-job.service.ts:15)
- [apps/worker/src/processors/scheduled-publishing.processor.ts:12](/workspace/kurvenfunk/apps/worker/src/processors/scheduled-publishing.processor.ts:12)
- [apps/worker/src/services/scheduled-publishing.service.ts:12](/workspace/kurvenfunk/apps/worker/src/services/scheduled-publishing.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/services/scheduled-publishing.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/services/scheduled-publishing.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I20 Scheduled publishing updates due article once real DB.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-144"></a>
## 144 – Provider Interface — DONE

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
144 – Provider Interface

Status:   ⬜ TODO
Was gemacht werden muss

Standard definieren, den jeder Newsprovider implementieren muss.
```

**Implementiert/nachgewiesen:** NewsProvider-Interface mit Fähigkeiten, Fetch, Cursor und Trustvertrag; beide Adapter implementieren es.

**Fehlende Funktion:** —

**Fehlender Nachweis:** —

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/types/src/news-provider.ts:25](/workspace/kurvenfunk/packages/types/src/news-provider.ts:25)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher DONE → jetzt DONE. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-145"></a>
## 145 – Fake Provider — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
145 – Fake Provider

Status:   ⬜ TODO
Was gemacht werden muss

Importpipeline vollständig mit Testdaten entwickeln.
```

**Implementiert/nachgewiesen:** Fakeprovider verarbeitet fünf Records real über BullMQ/Worker/DB; zweiter Lauf dedupliziert.

**Fehlende Funktion:** Vier Records gehen mit aktuellen Seedaliases in Review; Gesamtprozess endet dort ohne redaktionelle Übernahme.

**Fehlender Nachweis:** Admin-/Browser-/Stagingabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/providers/fake-news-provider.ts:83](/workspace/kurvenfunk/apps/worker/src/providers/fake-news-provider.ts:83)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/providers/fake-news-provider.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/providers/fake-news-provider.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I17 Real BullMQ fake provider full pipeline and second-run duplicate detection.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-146"></a>
## 146 – Scheduler — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
146 – Scheduler

Status:   ⬜ TODO
Provider regelmäßig abrufen.
```

**Implementiert/nachgewiesen:** Providerbezogene BullMQ-Schedulerregistrierung und Tests vorhanden.

**Fehlende Funktion:** Kein bestätigter Schedulerdefekt.

**Fehlender Nachweis:** Auditjob manuell eingereiht; periodisches Abrufen über reale Zeitintervalle nicht geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/jobs/news-import-scheduler.service.ts:20](/workspace/kurvenfunk/apps/worker/src/jobs/news-import-scheduler.service.ts:20)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/jobs/news-import-scheduler.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/jobs/news-import-scheduler.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-147"></a>
## 147 – Import Queue — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
147 – Import Queue

Status:   ⬜ TODO
news-import
```

**Implementiert/nachgewiesen:** news-import registriert; echte Queue verarbeitet zwei vollständige Fakeimportjobs.

**Fehlende Funktion:** Kein bestätigter Queuefehler im erfolgreichen Slice.

**Fehlender Nachweis:** Restart-/Ausfall-/Stagingabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/processors/news-import.processor.ts:26](/workspace/kurvenfunk/apps/worker/src/processors/news-import.processor.ts:26)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/processors/news-import.processor.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/processors/news-import.processor.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I17 Real BullMQ fake provider full pipeline and second-run duplicate detection.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-148"></a>
## 148 – Raw Payload — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
148 – Raw Payload

Status:   ⬜ TODO
Originaldaten speichern, um Importprobleme reproduzieren zu können.
```

**Implementiert/nachgewiesen:** Originalpayloads/Hashes/Record-/Jobbezug real gespeichert; fünf pro Lauf.

**Fehlende Funktion:** Kein bestätigter Persistenzdefekt im Slice.

**Fehlender Nachweis:** Replay-/Retention-/Fehler-/Stagingabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/services/raw-payload.service.ts:7](/workspace/kurvenfunk/apps/worker/src/services/raw-payload.service.ts:7)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/services/raw-payload.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/services/raw-payload.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I17 Real BullMQ fake provider full pipeline and second-run duplicate detection.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-149"></a>
## 149 – Normalization — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
149 – Normalization

Status:   ⬜ TODO
Providerdaten auf internes Kurvenfunk-Format abbilden.
```

**Implementiert/nachgewiesen:** Fake/OTS-Normalizer und Persistenzpfad; echte Fakepipeline normalisiert Records.

**Fehlende Funktion:** Kein bestätigter Fake-Normalisierungsdefekt.

**Fehlender Nachweis:** OTS-real/Fehlerqualität/Admin-/Stagingnachweis fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/services/news-normalization.service.ts:10](/workspace/kurvenfunk/apps/worker/src/services/news-normalization.service.ts:10)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/services/news-normalization.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/services/news-normalization.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I17 Real BullMQ fake provider full pipeline and second-run duplicate detection.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-150"></a>
## 150 – Validation — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
150 – Validation

Status:   ⬜ TODO
Pflichtfelder und Datenqualität prüfen.
```

**Implementiert/nachgewiesen:** Pflichtfeld-/Qualitätsprüfung und Fehlerstatus mit Unitfällen; echte gültige Fakefixtures passieren.

**Fehlende Funktion:** Kein bestätigter Defekt bei geprüften gültigen Records.

**Fehlender Nachweis:** Ungültige Providerrecords nicht real durch DB/Queue-Ende gefahren; Staging fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/services/news-validation.service.ts:39](/workspace/kurvenfunk/apps/worker/src/services/news-validation.service.ts:39)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/services/news-validation.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/services/news-validation.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I17 Real BullMQ fake provider full pipeline and second-run duplicate detection.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-151"></a>
## 151 – Duplicate Detection — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
151 – Duplicate Detection

Status:   ⬜ TODO
Prüfen:

   ●   Provider ID

   ●   URL

   ●   Hash

   ●   Titel

   ●   Ähnlichkeit
```

**Implementiert/nachgewiesen:** ProviderID/URL/Hash/Titel/Similarity implementiert; zweiter echter Import markiert fünf DUPLICATE.

**Fehlende Funktion:** Titelvergleich auf 200 Kandidaten begrenzt; keine starke einmalige Artikelzuordnung/Claim gegen Rennen.

**Fehlender Nachweis:** Parallelitäts-/Abbruch-/Retryinvariante unbewiesen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/services/news-duplicate-detection.service.ts:28](/workspace/kurvenfunk/apps/worker/src/services/news-duplicate-detection.service.ts:28)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/services/news-duplicate-detection.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/services/news-duplicate-detection.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I17 Real BullMQ fake provider full pipeline and second-run duplicate detection.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-152"></a>
## 152 – Club Matching — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
152 – Club Matching

Status:   ⬜ TODO
Club Aliases verwenden.
```

**Implementiert/nachgewiesen:** Aliasmatching und EntityMatchpersistenz vorhanden; echte Pipeline liefert Review und sicheren Treffer.

**Fehlende Funktion:** Keine fachlich freigegebene vollständige Aliasabdeckung; aktuelle Fakefixtures matchen nicht alle Seedclubs sicher.

**Fehlender Nachweis:** Mehrdeutige Alias-/Browserreview-/Stagingabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/services/news-club-matching.service.ts:5](/workspace/kurvenfunk/apps/worker/src/services/news-club-matching.service.ts:5)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/services/news-club-matching.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/services/news-club-matching.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I17 Real BullMQ fake provider full pipeline and second-run duplicate detection.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-153"></a>
## 153 – Competition Matching — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
153 – Competition Matching

Status:   ⬜ TODO
```

**Implementiert/nachgewiesen:** Wettbewerbsmatching und gespeicherte Matches vorhanden; Unitfälle grün.

**Fehlende Funktion:** Kein bestätigter Defekt aus aktuellem Slice.

**Fehlender Nachweis:** Repräsentative mehrdeutige/fehlende Wettbewerbe in echter Pipeline ungetestet.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/services/news-competition-matching.service.ts:5](/workspace/kurvenfunk/apps/worker/src/services/news-competition-matching.service.ts:5)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/services/news-competition-matching.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/services/news-competition-matching.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I17 Real BullMQ fake provider full pipeline and second-run duplicate detection.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-154"></a>
## 154 – Match Matching — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
154 – Match Matching

Status:   ⬜ TODO
```

**Implementiert/nachgewiesen:** Matchmatching über Clubs/Wettbewerb/Datum und Confidence vorhanden.

**Fehlende Funktion:** Kein bestätigter fehlender Algorithmus.

**Fehlender Nachweis:** Echte positive/mehrdeutige Spielmatchingfixtures und Staging fehlen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/services/news-match-matching.service.ts:9](/workspace/kurvenfunk/apps/worker/src/services/news-match-matching.service.ts:9)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/services/news-match-matching.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/services/news-match-matching.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-155"></a>
## 155 – Confidence Score — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
155 – Confidence Score

Status:   ⬜ TODO
exact

high

medium

low

unknown
```

**Implementiert/nachgewiesen:** EXACT/HIGH/MEDIUM/LOW/UNKNOWN mit Reviewgate; Unitfälle und echter Pipelineeinsatz.

**Fehlende Funktion:** Kein bestätigter fehlender Scoretyp.

**Fehlender Nachweis:** Fachliche Kalibrierung und alle Klassen durch reale Pipeline nicht abgenommen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/services/news-confidence-score.service.ts:8](/workspace/kurvenfunk/apps/worker/src/services/news-confidence-score.service.ts:8)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/services/news-confidence-score.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/services/news-confidence-score.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I17 Real BullMQ fake provider full pipeline and second-run duplicate detection.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-156"></a>
## 156 – Retry Logic — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
156 – Retry Logic

Status:   ⬜ TODO
Fehlgeschlagene Imports automatisch erneut versuchen.
```

**Implementiert/nachgewiesen:** Drei Versuche/exponentieller Backoff/Fehlerpersistenz implementiert.

**Fehlende Funktion:** Kein bestätigter Retrydefekt.

**Fehlender Nachweis:** Reale Störung/Retry-Erschöpfung/Restart nicht getestet.

**Aktuelle Code-/Konfigurationsbelege:**

- [packages/types/src/queue.ts:1](/workspace/kurvenfunk/packages/types/src/queue.ts:1)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/processors/news-import.processor.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/processors/news-import.processor.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-157"></a>
## 157 – Dead Letter Queue — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
157 – Dead Letter Queue

Status:   ⬜ TODO
Dauerhaft fehlgeschlagene Jobs isolieren.
```

**Implementiert/nachgewiesen:** Deadletterqueue und Failed-Eventweitergabe nach Erschöpfung implementiert.

**Fehlende Funktion:** Kein bestätigter DLQdefekt.

**Fehlender Nachweis:** Genau einmalige reale DLQaufnahme, Replay und Fehleralarme nicht geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/services/news-import-dead-letter.service.ts:16](/workspace/kurvenfunk/apps/worker/src/services/news-import-dead-letter.service.ts:16)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/services/news-import-dead-letter.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/services/news-import-dead-letter.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-158"></a>
## 158 – Import Admin — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
158 – Import Admin

Status:   ⬜ TODO
Anzeigen:

   ●   Provider

   ●   Job

   ●   Status

   ●   importierte Artikel

   ●   Duplikate

   ●   Matchingprobleme

   ●   Fehler
```

**Implementiert/nachgewiesen:** Admin zeigt Provider/Jobs/Records/Duplikate/Fehler/Matchingprobleme über echte APIverträge.

**Fehlende Funktion:** Kein bestätigter fehlender Anzeigebereich.

**Fehlender Nachweis:** Nach echtem Import nicht im authentifizierten Browser abgenommen; Staging fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/web/src/features/admin/imports/import-admin.tsx:219](/workspace/kurvenfunk/apps/web/src/features/admin/imports/import-admin.tsx:219)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/imports/imports.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-159"></a>
## 159 – Review Workflow — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
159 – Review Workflow

Status:   ⬜ TODO
Unsichere Artikel werden manuell geprüft.
```

**Implementiert/nachgewiesen:** Reviewqueue mit Approve/Reject und Reviewer/Zeitpersistenz; echte DB-Freigabe ausgeführt.

**Fehlende Funktion:** Freigabe endet bei MATCHED/APPROVED; kein Folgejob oder Artikel entsteht. Quellprüfung bestätigt fehlenden Consumer.

**Fehlender Nachweis:** Kompletter Review→Draft/Publishflow fehlt; kein Browser-/Stagingnachweis.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/services/news-review-workflow.service.ts:9](/workspace/kurvenfunk/apps/worker/src/services/news-review-workflow.service.ts:9)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/services/news-review-workflow.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/services/news-review-workflow.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I18 DEFECT: review approval persists decision but creates no article.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-160"></a>
## 160 – Auto Publish — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
160 – Auto Publish

Status:   ⬜ TODO
Nur vertrauenswürdige Provider und sichere Matches automatisch veröffentlichen.
```

**Implementiert/nachgewiesen:** Trustedflag und sichere Matches vor AutoPublish; echter Fakeimport erzeugt einen Artikel.

**Fehlende Funktion:** Keine eindeutige Record→Artikel-Claiminvariante gegen paralleles Publish; Race als Risiko, nicht reproduzierter Defekt.

**Fehlender Nachweis:** Echte untrusted-/Race-/Retry-/Stagingabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/services/news-auto-publishing.service.ts:10](/workspace/kurvenfunk/apps/worker/src/services/news-auto-publishing.service.ts:10)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/services/news-auto-publishing.service.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/services/news-auto-publishing.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I17 Real BullMQ fake provider full pipeline and second-run duplicate detection.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-161"></a>
## 161 – erster echter Newsprovider — PARTIAL

Phase 18: NEWS IMPORT

### Originalanforderung aus dem Masterplan

```text
161 – erster echter Newsprovider

Status:   ⬜ TODO
Erst nach funktionierender Testpipeline anbinden.



PHASE 19 – COMMENTS & REACTIONS
```

**Implementiert/nachgewiesen:** OTS-Adapter/Normalizer/Fehlerpfade und Unitfälle vorhanden; trusted=false.

**Fehlende Funktion:** Redaktioneller Übernahmeweg nach OTS-Review fehlt aus 159.

**Fehlender Nachweis:** Kein Liveprovider-/Lizenz-/externes Zugangssignal; OTS nicht kontaktiert.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/worker/src/providers/ots-news-provider.ts:42](/workspace/kurvenfunk/apps/worker/src/providers/ots-news-provider.ts:42)
- [apps/api/src/modules/imports/imports.controller.ts:17](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.controller.ts:17)
- [apps/api/src/modules/imports/imports.module.ts:9](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.module.ts:9)
- [apps/api/src/modules/imports/imports.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/imports/imports.service.ts:12)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/worker/src/providers/ots-news-provider.spec.ts:1](/workspace/kurvenfunk/apps/worker/src/providers/ots-news-provider.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-162"></a>
## 162 – Kommentar erstellen — PARTIAL

Phase 19: COMMENTS & REACTIONS

### Originalanforderung aus dem Masterplan

```text
162 – Kommentar erstellen

Status:   ⬜ TODO
Permission

ACTIVE → erlaubt

LIMITED → verboten

BANNED → verboten
```

**Implementiert/nachgewiesen:** Echte HTTP-Kommentarerstellung mit DB und Redis funktioniert; LIMITED/BANNED-Guards vorhanden.

**Fehlende Funktion:** Onboardingcompletion serverseitig nicht erzwungen.

**Fehlender Nachweis:** Browser-/Mobile-/Stagingflow fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/comments/comment-pagination.ts:3](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.ts:3)
- [apps/api/src/modules/comments/comment-spam-protection.service.ts:67](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.ts:67)
- [apps/api/src/modules/comments/comments.controller.ts:21](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.ts:21)
- [apps/api/src/modules/comments/comments.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.module.ts:8)
- [apps/api/src/modules/comments/comments.service.ts:20](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.ts:20)
- [apps/web/src/features/articles/comment-composer.tsx:40](/workspace/kurvenfunk/apps/web/src/features/articles/comment-composer.tsx:40)
- [packages/validation/src/comment.ts:3](/workspace/kurvenfunk/packages/validation/src/comment.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/comments/comment-pagination.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.service.spec.ts:1)
- [apps/api/src/modules/comments/comment-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1)
- [apps/api/src/modules/comments/comments-spam-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments-spam-integration.spec.ts:1)
- [apps/api/src/modules/comments/comments.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.spec.ts:1)
- [apps/api/src/modules/comments/comments.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.spec.ts:1)
- [apps/web/src/features/articles/comment-pagination-client.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-pagination-client.spec.mjs:1)
- [apps/web/src/features/articles/comment-sort.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-sort.spec.mjs:1)
- [apps/web/src/features/articles/comment-spam-error.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-spam-error.spec.mjs:1)
- [packages/validation/src/comment.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/comment.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I04 DEFECT: incomplete onboarding user can create comment via HTTP; I05 Comment spam actual Redis rejects duplicate and cooldown; I10 LIMITED cannot post but can vote; BANNED cannot authenticate.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-163"></a>
## 163 – Antworten — PARTIAL

Phase 19: COMMENTS & REACTIONS

### Originalanforderung aus dem Masterplan

```text
163 – Antworten

Status:   ⬜ TODO
Gleiche Statusprüfung wie Kommentare.
```

**Implementiert/nachgewiesen:** Echte HTTP-Antwort speichert Parentrelation; Status-/Artikel-/Permissionchecks implementiert.

**Fehlende Funktion:** Kein bestätigter Replydefekt im Slice.

**Fehlender Nachweis:** LIMITED/BANNED-Replyvarianten und kompletter Browserbaum nicht real abgenommen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/comments/comment-pagination.ts:3](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.ts:3)
- [apps/api/src/modules/comments/comment-spam-protection.service.ts:67](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.ts:67)
- [apps/api/src/modules/comments/comments.controller.ts:21](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.ts:21)
- [apps/api/src/modules/comments/comments.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.module.ts:8)
- [apps/api/src/modules/comments/comments.service.ts:20](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.ts:20)
- [apps/web/src/features/articles/comment-composer.tsx:40](/workspace/kurvenfunk/apps/web/src/features/articles/comment-composer.tsx:40)
- [packages/validation/src/comment.ts:3](/workspace/kurvenfunk/packages/validation/src/comment.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/comments/comment-pagination.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.service.spec.ts:1)
- [apps/api/src/modules/comments/comment-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1)
- [apps/api/src/modules/comments/comments-spam-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments-spam-integration.spec.ts:1)
- [apps/api/src/modules/comments/comments.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.spec.ts:1)
- [apps/api/src/modules/comments/comments.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.spec.ts:1)
- [apps/web/src/features/articles/comment-pagination-client.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-pagination-client.spec.mjs:1)
- [apps/web/src/features/articles/comment-sort.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-sort.spec.mjs:1)
- [apps/web/src/features/articles/comment-spam-error.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-spam-error.spec.mjs:1)
- [packages/validation/src/comment.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/comment.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I09 ACTIVE reply real parent relation.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-164"></a>
## 164 – Comment Depth — PARTIAL

Phase 19: COMMENTS & REACTIONS

### Originalanforderung aus dem Masterplan

```text
164 – Comment Depth

Status:   ⬜ TODO

Technisch Parent Relation.

Darstellung auf wenige Ebenen begrenzen.
```

**Implementiert/nachgewiesen:** Parent/depth und UIbegrenzung auf fünf Ebenen vorhanden.

**Fehlende Funktion:** Kein bestätigter Defekt der sichtbaren Begrenzung.

**Fehlender Nachweis:** Tiefer realer Baum, mobile Darstellung und Performance fehlen als Nachweis.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/comments/comment-pagination.ts:3](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.ts:3)
- [apps/api/src/modules/comments/comment-spam-protection.service.ts:67](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.ts:67)
- [apps/api/src/modules/comments/comments.controller.ts:21](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.ts:21)
- [apps/api/src/modules/comments/comments.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.module.ts:8)
- [apps/api/src/modules/comments/comments.service.ts:20](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.ts:20)
- [apps/web/src/features/articles/comment-composer.tsx:40](/workspace/kurvenfunk/apps/web/src/features/articles/comment-composer.tsx:40)
- [packages/validation/src/comment.ts:3](/workspace/kurvenfunk/packages/validation/src/comment.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/comments/comment-pagination.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.service.spec.ts:1)
- [apps/api/src/modules/comments/comment-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1)
- [apps/api/src/modules/comments/comments-spam-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments-spam-integration.spec.ts:1)
- [apps/api/src/modules/comments/comments.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.spec.ts:1)
- [apps/api/src/modules/comments/comments.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.spec.ts:1)
- [apps/web/src/features/articles/comment-pagination-client.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-pagination-client.spec.mjs:1)
- [apps/web/src/features/articles/comment-sort.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-sort.spec.mjs:1)
- [apps/web/src/features/articles/comment-spam-error.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-spam-error.spec.mjs:1)
- [packages/validation/src/comment.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/comment.spec.ts:1)

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-165"></a>
## 165 – Kommentar bearbeiten — PARTIAL

Phase 19: COMMENTS & REACTIONS

### Originalanforderung aus dem Masterplan

```text
165 – Kommentar bearbeiten

Status:   ⬜ TODO
Nur eigener Kommentar innerhalb definierter Regeln.

Bearbeitung markieren.
```

**Implementiert/nachgewiesen:** Eigener Kommentar editierbar; echte Fremdautorablehnung und Revision persistiert.

**Fehlende Funktion:** Kein bestätigter Ownershipdefekt.

**Fehlender Nachweis:** Browsermarkierung/gleichzeitige Edits/Staging nicht getestet.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/comments/comment-pagination.ts:3](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.ts:3)
- [apps/api/src/modules/comments/comment-spam-protection.service.ts:67](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.ts:67)
- [apps/api/src/modules/comments/comments.controller.ts:21](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.ts:21)
- [apps/api/src/modules/comments/comments.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.module.ts:8)
- [apps/api/src/modules/comments/comments.service.ts:20](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.ts:20)
- [apps/web/src/features/articles/comment-composer.tsx:40](/workspace/kurvenfunk/apps/web/src/features/articles/comment-composer.tsx:40)
- [packages/validation/src/comment.ts:3](/workspace/kurvenfunk/packages/validation/src/comment.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/comments/comment-pagination.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.service.spec.ts:1)
- [apps/api/src/modules/comments/comment-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1)
- [apps/api/src/modules/comments/comments-spam-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments-spam-integration.spec.ts:1)
- [apps/api/src/modules/comments/comments.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.spec.ts:1)
- [apps/api/src/modules/comments/comments.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.spec.ts:1)
- [apps/web/src/features/articles/comment-pagination-client.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-pagination-client.spec.mjs:1)
- [apps/web/src/features/articles/comment-sort.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-sort.spec.mjs:1)
- [apps/web/src/features/articles/comment-spam-error.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-spam-error.spec.mjs:1)
- [packages/validation/src/comment.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/comment.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I08 Comment edit revision and foreign author denial real DB.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-166"></a>
## 166 – Kommentar löschen — PARTIAL

Phase 19: COMMENTS & REACTIONS

### Originalanforderung aus dem Masterplan

```text
166 – Kommentar löschen

Status:   ⬜ TODO
Soft Delete für User.

Moderatoraktionen separat auditieren.
```

**Implementiert/nachgewiesen:** Eigener Kommentar wird real softgelöscht; Tombstone-/Replydarstellung im Code.

**Fehlende Funktion:** Separat auditierte Moderatorenlöschung fehlt.

**Fehlender Nachweis:** Browser-/Mobile-/Stagingabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/comments/comment-pagination.ts:3](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.ts:3)
- [apps/api/src/modules/comments/comment-spam-protection.service.ts:67](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.ts:67)
- [apps/api/src/modules/comments/comments.controller.ts:21](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.ts:21)
- [apps/api/src/modules/comments/comments.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.module.ts:8)
- [apps/api/src/modules/comments/comments.service.ts:20](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.ts:20)
- [apps/web/src/features/articles/comment-composer.tsx:40](/workspace/kurvenfunk/apps/web/src/features/articles/comment-composer.tsx:40)
- [packages/validation/src/comment.ts:3](/workspace/kurvenfunk/packages/validation/src/comment.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/comments/comment-pagination.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.service.spec.ts:1)
- [apps/api/src/modules/comments/comment-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1)
- [apps/api/src/modules/comments/comments-spam-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments-spam-integration.spec.ts:1)
- [apps/api/src/modules/comments/comments.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.spec.ts:1)
- [apps/api/src/modules/comments/comments.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.spec.ts:1)
- [apps/web/src/features/articles/comment-pagination-client.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-pagination-client.spec.mjs:1)
- [apps/web/src/features/articles/comment-sort.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-sort.spec.mjs:1)
- [apps/web/src/features/articles/comment-spam-error.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-spam-error.spec.mjs:1)
- [packages/validation/src/comment.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/comment.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I13 Soft delete persists tombstone.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-167"></a>
## 167 – Voting / Reactions — PARTIAL

Phase 19: COMMENTS & REACTIONS

### Originalanforderung aus dem Masterplan

```text
167 – Voting / Reactions

Status:   ⬜ TODO
Permission

ACTIVE → erlaubt

LIMITED → erlaubt

BANNED → verboten

MVP:

Like
```

**Implementiert/nachgewiesen:** Votes mit Uniqueconstraints/Ownerregeln; real LIMITED auf fremden Kommentar erlaubt, BANNED blockiert.

**Fehlende Funktion:** UPVOTE/DOWNVOTE statt gefordertem MVP-Like; kein Vote-Ratelimit.

**Fehlender Nachweis:** Browser-/Staging und parallele Votewechsel nicht vollständig geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/reactions/reactions.controller.ts:44](/workspace/kurvenfunk/apps/api/src/modules/reactions/reactions.controller.ts:44)
- [apps/api/src/modules/reactions/reactions.module.ts:7](/workspace/kurvenfunk/apps/api/src/modules/reactions/reactions.module.ts:7)
- [apps/api/src/modules/reactions/reactions.service.ts:24](/workspace/kurvenfunk/apps/api/src/modules/reactions/reactions.service.ts:24)
- [apps/web/src/features/articles/comment-voting.tsx:8](/workspace/kurvenfunk/apps/web/src/features/articles/comment-voting.tsx:8)
- [packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/reactions/reactions.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/reactions/reactions.controller.spec.ts:1)
- [apps/api/src/modules/reactions/reactions.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/reactions/reactions.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I10 LIMITED cannot post but can vote; BANNED cannot authenticate.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-168"></a>
## 168 – Kommentar Sortierung — PARTIAL

Phase 19: COMMENTS & REACTIONS

### Originalanforderung aus dem Masterplan

```text
168 – Kommentar Sortierung

Status:   ⬜ TODO
Neueste

Älteste

Beliebt
```

**Implementiert/nachgewiesen:** newest/oldest/popular im UI/API; alle drei real mit SQL ausgeführt.

**Fehlende Funktion:** Kein bestätigter Sortierdefekt bei statischen Fixtures.

**Fehlender Nachweis:** Vote-/Deleteänderungen zwischen Seiten und Browserabnahme offen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/comments/comment-pagination.ts:3](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.ts:3)
- [apps/api/src/modules/comments/comment-spam-protection.service.ts:67](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.ts:67)
- [apps/api/src/modules/comments/comments.controller.ts:21](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.ts:21)
- [apps/api/src/modules/comments/comments.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.module.ts:8)
- [apps/api/src/modules/comments/comments.service.ts:20](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.ts:20)
- [apps/web/src/features/articles/comment-composer.tsx:40](/workspace/kurvenfunk/apps/web/src/features/articles/comment-composer.tsx:40)
- [packages/validation/src/comment.ts:3](/workspace/kurvenfunk/packages/validation/src/comment.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/comments/comment-pagination.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.service.spec.ts:1)
- [apps/api/src/modules/comments/comment-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1)
- [apps/api/src/modules/comments/comments-spam-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments-spam-integration.spec.ts:1)
- [apps/api/src/modules/comments/comments.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.spec.ts:1)
- [apps/api/src/modules/comments/comments.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.spec.ts:1)
- [apps/web/src/features/articles/comment-pagination-client.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-pagination-client.spec.mjs:1)
- [apps/web/src/features/articles/comment-sort.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-sort.spec.mjs:1)
- [apps/web/src/features/articles/comment-spam-error.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-spam-error.spec.mjs:1)
- [packages/validation/src/comment.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/comment.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I12 Comments all sort SQL and invalid cursor validation; I19 Real SQL cursor traverses more than one page without repeated root IDs.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-169"></a>
## 169 – Pagination — PARTIAL

Phase 19: COMMENTS & REACTIONS

### Originalanforderung aus dem Masterplan

```text
169 – Pagination

Status:   ⬜ TODO
Cursor-basiert.
```

**Implementiert/nachgewiesen:** Cursor mit Validierung, SQL-Rootpaging und Clientmerge; echte mehrseitige Probe für alle drei Sortierungen erfolgreich.

**Fehlende Funktion:** Kein aus Quellprüfung bestätigter Cursorfehler.

**Fehlender Nachweis:** Nebenläufige Änderungen, tiefe Replygruppen und Browser-/Stagingabnahme fehlen.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/comments/comment-pagination.ts:3](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.ts:3)
- [apps/api/src/modules/comments/comment-spam-protection.service.ts:67](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.ts:67)
- [apps/api/src/modules/comments/comments.controller.ts:21](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.ts:21)
- [apps/api/src/modules/comments/comments.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.module.ts:8)
- [apps/api/src/modules/comments/comments.service.ts:20](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.ts:20)
- [apps/web/src/features/articles/comment-composer.tsx:40](/workspace/kurvenfunk/apps/web/src/features/articles/comment-composer.tsx:40)
- [packages/validation/src/comment.ts:3](/workspace/kurvenfunk/packages/validation/src/comment.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/comments/comment-pagination.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.service.spec.ts:1)
- [apps/api/src/modules/comments/comment-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1)
- [apps/api/src/modules/comments/comments-spam-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments-spam-integration.spec.ts:1)
- [apps/api/src/modules/comments/comments.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.spec.ts:1)
- [apps/api/src/modules/comments/comments.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.spec.ts:1)
- [apps/web/src/features/articles/comment-pagination-client.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-pagination-client.spec.mjs:1)
- [apps/web/src/features/articles/comment-sort.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-sort.spec.mjs:1)
- [apps/web/src/features/articles/comment-spam-error.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-spam-error.spec.mjs:1)
- [packages/validation/src/comment.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/comment.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I12 Comments all sort SQL and invalid cursor validation; I19 Real SQL cursor traverses more than one page without repeated root IDs.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-170"></a>
## 170 – Reports — PARTIAL

Phase 19: COMMENTS & REACTIONS

### Originalanforderung aus dem Masterplan

```text
170 – Reports

Status:   ⬜ TODO
Meldegründe definieren.
```

**Implementiert/nachgewiesen:** Reportgründe/Details/Dedupe/Uniqueindex/UI; echter Report und Doppelreport409 bestätigt.

**Fehlende Funktion:** Moderationsbearbeitung fehlt; Report-Ratelimits fehlen. Andere Zieltypen sind Modell-/Folgeaufgaben.

**Fehlender Nachweis:** Browser-/Stagingabnahme fehlt.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/reports/reports.controller.ts:8](/workspace/kurvenfunk/apps/api/src/modules/reports/reports.controller.ts:8)
- [apps/api/src/modules/reports/reports.module.ts:7](/workspace/kurvenfunk/apps/api/src/modules/reports/reports.module.ts:7)
- [apps/api/src/modules/reports/reports.service.ts:22](/workspace/kurvenfunk/apps/api/src/modules/reports/reports.service.ts:22)
- [apps/web/src/features/articles/comment-report-client.ts:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-report-client.ts:1)
- [apps/web/src/features/articles/comment-report.tsx:15](/workspace/kurvenfunk/apps/web/src/features/articles/comment-report.tsx:15)
- [packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1](/workspace/kurvenfunk/packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql:1)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/reports/reports.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/reports/reports.controller.spec.ts:1)
- [apps/api/src/modules/reports/reports.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/reports/reports.service.spec.ts:1)
- [apps/web/src/features/articles/comment-report-client.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-report-client.spec.mjs:1)

**Zusätzliche echte lokale Prüfgruppen:** I11 Reports persisted and duplicate rejected.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-171"></a>
## 171 – Spam Protection — PARTIAL

Phase 19: COMMENTS & REACTIONS

### Originalanforderung aus dem Masterplan

```text
171 – Spam Protection

Status:   ⬜ TODO
   ●   Rate Limit

   ●   Duplicate Spam

   ●   Link Limits

   ●   Posting Frequency



PHASE 20 – MODERATION & CARDS
```

**Implementiert/nachgewiesen:** Reale Redis-Lua-Reservation liefert Duplicate409/Cooldown429; Rate10/min und Linklimit2 im Code.

**Fehlende Funktion:** Keine bestätigte fehlende der vier geforderten Regeln; weitergehender IP-Schutz ist anderer Auftrag.

**Fehlender Nachweis:** Echtes Ratefenster/Linklimit/Redis-Ausfall/Parallelität und Browser-/Staging nicht vollständig geprüft.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/comments/comment-pagination.ts:3](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.ts:3)
- [apps/api/src/modules/comments/comment-spam-protection.service.ts:67](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.ts:67)
- [apps/api/src/modules/comments/comments.controller.ts:21](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.ts:21)
- [apps/api/src/modules/comments/comments.module.ts:8](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.module.ts:8)
- [apps/api/src/modules/comments/comments.service.ts:20](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.ts:20)
- [apps/web/src/features/articles/comment-composer.tsx:40](/workspace/kurvenfunk/apps/web/src/features/articles/comment-composer.tsx:40)
- [packages/validation/src/comment.ts:3](/workspace/kurvenfunk/packages/validation/src/comment.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/comments/comment-pagination.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.service.spec.ts:1)
- [apps/api/src/modules/comments/comment-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-popular-pagination.spec.ts:1)
- [apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comment-spam-protection.service.spec.ts:1)
- [apps/api/src/modules/comments/comments-spam-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments-spam-integration.spec.ts:1)
- [apps/api/src/modules/comments/comments.controller.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.controller.spec.ts:1)
- [apps/api/src/modules/comments/comments.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/comments/comments.service.spec.ts:1)
- [apps/web/src/features/articles/comment-pagination-client.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-pagination-client.spec.mjs:1)
- [apps/web/src/features/articles/comment-sort.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-sort.spec.mjs:1)
- [apps/web/src/features/articles/comment-spam-error.spec.mjs:1](/workspace/kurvenfunk/apps/web/src/features/articles/comment-spam-error.spec.mjs:1)
- [packages/validation/src/comment.spec.ts:1](/workspace/kurvenfunk/packages/validation/src/comment.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I05 Comment spam actual Redis rejects duplicate and cooldown.

**Vergleich:** vorher PARTIAL → jetzt PARTIAL. Unveränderte Einstufung; neue Belege/Lücken stehen separat.

<a id="task-172"></a>
## 172 – Permission System — DONE

Phase 20: MODERATION & CARDS

### Originalanforderung aus dem Masterplan

```text
172 – Permission System

Status:   ⬜ TODO
Was gemacht werden muss

Nicht überall Rollen manuell vergleichen.

Zentrale Permissions:

comment.create

comment.vote

comment.delete

comment.moderate



thread.create

thread.reply

thread.lock



article.create

article.publish



user.warn

user.limit

user.ban

user.ipban
```

**Implementiert/nachgewiesen:** Zentraler Service/Guard/Decorator und alle verlangten Permissionkonstanten; ArticleEditorialGuard delegiert an PermissionsService; Unit- und reale Status-/HTTP-Proben grün.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Fehlende Moderations-/Forumaktionen sind separate Featureaufträge; der zentrale Permissionkern ist dadurch nicht unimplementiert.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/auth/account-status.guard.ts:12](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.ts:12)
- [apps/api/src/modules/permissions/permissions.constants.ts:3](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.constants.ts:3)
- [apps/api/src/modules/permissions/permissions.guard.ts:16](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.guard.ts:16)
- [apps/api/src/modules/permissions/permissions.module.ts:7](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.module.ts:7)
- [apps/api/src/modules/permissions/permissions.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.service.ts:12)
- [apps/api/src/modules/permissions/require-permissions.decorator.ts:8](/workspace/kurvenfunk/apps/api/src/modules/permissions/require-permissions.decorator.ts:8)
- [apps/api/src/modules/articles/article-editorial.guard.ts:13](/workspace/kurvenfunk/apps/api/src/modules/articles/article-editorial.guard.ts:13)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/permissions/article-publication-permission.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/permissions/article-publication-permission.spec.ts:1)
- [apps/api/src/modules/permissions/permissions-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions-integration.spec.ts:1)
- [apps/api/src/modules/permissions/permissions.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.guard.spec.ts:1)
- [apps/api/src/modules/permissions/permissions.module.spec.ts:10](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.module.spec.ts:10)
- [apps/api/src/modules/permissions/permissions.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I10 LIMITED cannot post but can vote; BANNED cannot authenticate; I15 Editorial real HTTP CRUD relations workflow revisions archive delete restore.

**Vergleich:** vorher PARTIAL → jetzt DONE. Zentraler Permissionkern tatsächlich implementiert; auch ArticleEditorialGuard delegiert an ihn. Fehlende Forum-/Kartenfeatures nicht als fehlender Kern doppelt zählen.

<a id="task-173"></a>
## 173 – Account Status Guard — DONE

Phase 20: MODERATION & CARDS

### Originalanforderung aus dem Masterplan

```text
173 – Account Status Guard

Status:   ⬜ TODO
Was gemacht werden muss

Zentrale Prüfung:

ACTIVE

LIMITED

BANNED

Nicht in jedem Controller separat improvisieren.
```

**Implementiert/nachgewiesen:** Zentraler AccountStatusGuard wird von AuthGuard benutzt; ACTIVE/LIMITED weiter, BANNED403; Unit- und echte HTTP-Probe.

**Fehlende Funktion:** —

**Fehlender Nachweis:** Sessionrevoke und Onboarding sind separate Anforderungen, keine fehlenden Guard-Kriterien dieser Aufgabe.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/auth/account-status.guard.ts:12](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.ts:12)
- [apps/api/src/modules/permissions/permissions.constants.ts:3](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.constants.ts:3)
- [apps/api/src/modules/permissions/permissions.guard.ts:16](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.guard.ts:16)
- [apps/api/src/modules/permissions/permissions.module.ts:7](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.module.ts:7)
- [apps/api/src/modules/permissions/permissions.service.ts:12](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.service.ts:12)
- [apps/api/src/modules/permissions/require-permissions.decorator.ts:8](/workspace/kurvenfunk/apps/api/src/modules/permissions/require-permissions.decorator.ts:8)
- [apps/api/src/modules/auth/auth.guard.ts:15](/workspace/kurvenfunk/apps/api/src/modules/auth/auth.guard.ts:15)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

- [apps/api/src/modules/auth/account-status-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status-integration.spec.ts:1)
- [apps/api/src/modules/auth/account-status.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/auth/account-status.guard.spec.ts:1)
- [apps/api/src/modules/permissions/article-publication-permission.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/permissions/article-publication-permission.spec.ts:1)
- [apps/api/src/modules/permissions/permissions-integration.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions-integration.spec.ts:1)
- [apps/api/src/modules/permissions/permissions.guard.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.guard.spec.ts:1)
- [apps/api/src/modules/permissions/permissions.module.spec.ts:10](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.module.spec.ts:10)
- [apps/api/src/modules/permissions/permissions.service.spec.ts:1](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.service.spec.ts:1)

**Zusätzliche echte lokale Prüfgruppen:** I10 LIMITED cannot post but can vote; BANNED cannot authenticate.

**Vergleich:** vorher PARTIAL → jetzt DONE. Zentraler Guard real geprüft. Sessionrevoke/Onboarding sind andere Anforderungen, nicht zusätzliche Guard-Kriterien.

<a id="task-174"></a>
## 174 – Yellow Card erstellen — TODO

Phase 20: MODERATION & CARDS

### Originalanforderung aus dem Masterplan

```text
174 – Yellow Card erstellen

Status:   ⬜ TODO
Moderator kann gelbe Karte vergeben.

Dabei speichern

   ●   Grund

   ●   interne Notiz

   ●   betroffener Inhalt

   ●   Moderator

   ●   Zeitpunkt

User erhält Notification.
```

**Implementiert/nachgewiesen:** Nur ModerationCard-/Notificationmodell, user.warn-Konstante und leere Module vorhanden.

**Fehlende Funktion:** Kein ausführbarer Kartenvergabeservice/Endpoint/UI; keine transaktionale Speicherung durch Moderator, Auditspur oder Usernotification.

**Fehlender Nachweis:** Keine Vergabetests. Modell 075 ist nicht Feature 174; lokale Arbeit an Karte/Notification ist möglich, daher nicht pauschal BLOCKED.

**Aktuelle Code-/Konfigurationsbelege:**

- [apps/api/src/modules/bans/bans.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/bans/bans.module.ts:3)
- [apps/api/src/modules/moderation/moderation.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/moderation/moderation.module.ts:3)
- [apps/api/src/modules/sanctions/sanctions.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/sanctions/sanctions.module.ts:3)
- [apps/web/src/app/admin/moderation/page.tsx:1](/workspace/kurvenfunk/apps/web/src/app/admin/moderation/page.tsx:1)
- [packages/database/prisma/schema.prisma:14](/workspace/kurvenfunk/packages/database/prisma/schema.prisma:14)
- [apps/api/src/modules/notifications/notifications.module.ts:3](/workspace/kurvenfunk/apps/api/src/modules/notifications/notifications.module.ts:3)
- [apps/api/src/modules/permissions/permissions.constants.ts:3](/workspace/kurvenfunk/apps/api/src/modules/permissions/permissions.constants.ts:3)

**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**

Keine spezifischen Repositorytests vorhanden.

**Vergleich:** vorher PARTIAL → jetzt TODO. Kein ausführbarer Featureanteil vorhanden: Vorbereitendes Modell/Permission rechtfertigen kein PARTIAL der Kartenvergabe.
