# Kurvenfunk – Masterplan- und Code-Audit

**Zur Freigabe, keine Umsetzung.** Stand: 22.10.2026, Europe/Vienna. Ausschließlich `develop` @ `cabf1477136e0a4c8951655a11cf122cd834617e`. Arbeitsbaum zu Beginn des Audits sauber. Während der Analyse kein Branchwechsel, keine Anwendungscodeänderung, keine bestehende Dokumentation verändert, kein Deployment, kein Zugriff auf produktiven VPS oder produktive Domains.

## Archivierung

Diese sechs Ergebnisdateien wurden nach Abschluss des Audits zur versionierten Ablage nach `docs/audits/2026-10-22/` übernommen. Der Analysebezug bleibt der oben genannte `develop`-Commit. Repositorylinks sind an den Archivpfad angepasst. Rohlogs, JSON-Exporte, Volltext und Prüfscripte bleiben separate Artefakte unter `/workspace/kurvenfunk-audit/`; sie sind nicht Teil dieser Ablage und werden deshalb hier als Dateiverweise statt als verfügbare Repositorylinks bezeichnet.

## Ergebnis

Das Repository ist ein lauffähiger Entwicklungsstand mit tragfähigem Monorepo, umfangreichem Datenmodell, funktionierenden öffentlichen Lese-APIs, redaktionellen Funktionen, Newsimport-Bausteinen und Kommentar-/Voting-/Report-Funktionen. Es ist **nicht als vollständige, launchbereite Plattform nachgewiesen**. Insbesondere sind Forum, vollständige Moderation/Karten/Sanktionen, Benachrichtigungen, Suche und große Teile der Administration nur als Datenmodell, Queue-Name, leeres Modul oder Platzhalter vorhanden.

Alle **334 Aufgaben** wurden einzeln klassifiziert: **37 DONE, 212 PARTIAL, 56 TODO, 13 BLOCKED, 16 UNKNOWN**. Das ist keine gewichtete Produkt-Fortschrittsquote. Ein Modell oder Konfigurationsparser kann DONE sein, während das zugehörige Produktfeature PARTIAL bleibt. Vollständige Feature-Abnahme nach Masterplan umfasst auch Integration, UI, Mobile, Staging und Dokumentation; diese Nachweise fehlen vielfach.

Die 16 Meilensteine sind separat in [MEILENSTEINE.md](MEILENSTEINE.md) bewertet. Kein Meilenstein wird allein wegen vorhandener Verzeichnisse oder grüner Unit-Tests als vollständig abgenommen bezeichnet.

## Quellen und Methode

- Masterplan: „Kurvenfunk – Master Project Plan“, PDF-Version 1.1, vollständig ausgelesen, einschließlich Architektur, Core Rules, Definition of Done, Development Order und aller 16 Meilensteine.
- PDF-SHA256: `29da557115852ff771b776243b2ea97f69710dfbf59f3bb493c35bae0a2a3b32`.
- Volltext: masterplan.txt (`masterplan.txt`; separates Audit-Artefakt); strukturierte Originalaufgaben: tasks.json (`tasks.json`; separates Audit-Artefakt). Extraktion ergab genau die eindeutigen IDs 001–334 ohne Lücke.
- Der Plan ist die Anforderungsquelle. Seine eingebetteten Statusmarker „✅ TODO“ und Handlungssätze wurden weder als technischer Fertignachweis noch als Berechtigung zu Änderungen/Deployments übernommen.
- Repositoryinventur, Schema/Migrationen, Module/Controller/Services/Guards, Worker/Provider/Queues, Frontend-Verbindungen und Mockdaten, Compose/CI/Backupskripte sowie vorhandene Tests wurden abgeglichen. Relevante Belegdateien und konkrete Lücken stehen für **jede** Aufgabe in [STATUSMATRIX.md](STATUSMATRIX.md), [CSV](statusmatrix.csv) und JSON (`statusmatrix.json`; separates Audit-Artefakt).
- Statische Codebelege, ausgeführte Unit-/Helpertests und echte lokale HTTP-/DB-/Queue-Smokes werden getrennt ausgewiesen. Testnamen mit „integration“ sind kein Beweis einer echten DB-/Redis-Integration: mehrere entsprechende Tests mocken die Infrastruktur.
- Externe Zustände wie Cloudflare-Routing, Google-IdP, SMTP, R2, VPS-Rechte, bestehende Releases und Marketing/Beta sind ohne zulässigen externen Nachweis UNKNOWN oder nur teilweise konfiguriert. Keine Zustandsbehauptung aus Dateinamen abgeleitet.
- Der Bericht ist ein Code-/Anforderungs- und lokaler Laufzeitaudit, kein Penetrationstest, Rechtsgutachten oder Produktionsbetriebsnachweis. Abwesenheitsbefunde beziehen sich auf den geprüften Commit, nicht auf unbekannte externe Konfiguration.

## Technische Verifikation

Die Entwicklung verwendet Node 24.19.0 und pnpm 11.20.0. DEV-URLs und lokale PostgreSQL-/Redis-Dienste wurden verwendet. Für `next build` wurde nur der Buildprozess mit `NODE_ENV=production` gestartet; dies ist die normale Buildanforderung und kein Production-Deployment. Geheimniswerte wurden nicht ausgegeben.

| Prüfung | Ergebnis | Beleg |
|---|---|---|
| API-Unit-/Modultests | 42 Suites, 417 Tests bestanden | api-tests.log (`api-tests.log`; separates Audit-Artefakt) |
| Worker-Unit-/Servicetests | 18 Suites, 120 Tests bestanden | worker-tests.log (`worker-tests.log`; separates Audit-Artefakt) |
| Geteilte Validation | 90 Tests bestanden | validation-tests.log (`validation-tests.log`; separates Audit-Artefakt) |
| Reguläres Web-Testskript | 28 Tests bestanden | web-tests.log (`web-tests.log`; separates Audit-Artefakt) |
| Alle vorhandenen Web-Feature-Helpertests | 50 Tests bestanden, enthalten die regulären 28 | web-all-tests.log (`web-all-tests.log`; separates Audit-Artefakt) |
| API-E2E | **1 Suite fehlgeschlagen; 0 Tests ausgeführt** | api-e2e.log (`api-e2e.log`; separates Audit-Artefakt) |
| Lint und Typechecks, ohne Turbo-Cache | 8 Tasks bestanden; 3 Web-Bildwarnungen | static-checks-fresh.log (`static-checks-fresh.log`; separates Audit-Artefakt) |
| Build, ohne Turbo-Cache | 7 Tasks bestanden | build-fresh.log (`build-fresh.log`; separates Audit-Artefakt) |
| Format | bestanden | format.log (`format.log`; separates Audit-Artefakt) |
| Prisma-Schema | gültig | prisma-validate.log (`prisma-validate.log`; separates Audit-Artefakt) |
| Migrationsstatus | 11 Migrationen; lokale DB aktuell | migration-status.log (`migration-status.log`; separates Audit-Artefakt) |
| Shellsyntax der Infrastruktur-Skripte | `bash -n` bestanden; Skripte nicht ausgeführt | Prüfkommando im Auditprotokoll |
| Web-Health und Homepage | HTTP 200 | http-checks.json (`http-checks.json`; separates Audit-Artefakt) |
| API-Readiness | HTTP 200; PostgreSQL/Redis jeweils ok | http-checks.json (`http-checks.json`; separates Audit-Artefakt) |
| Öffentliche Clubs/Artikel/Matches | HTTP 200; 28 aktive Clubs | http-checks.json (`http-checks.json`; separates Audit-Artefakt) |
| Tabelle | korrekte Route `/api/v1/standings/austrian-bundesliga` HTTP 200 | standings.json (`standings.json`; separates Audit-Artefakt) |
| Auth ohne Token | HTTP 401, erwarteter Schutz | http-checks.json (`http-checks.json`; separates Audit-Artefakt) |
| Queue/Worker | Startup-Test und lokaler HTTP→Queue→Worker-Job abgeschlossen, Request-ID erhalten | worker-runtime.log (`worker-runtime.log`; separates Audit-Artefakt) |
| Dependency-Audit gesamt | Exit 1: 53 Advisory-Einträge; 8 critical, 27 high, 16 moderate, 2 low | dependency-audit-summary.csv (`dependency-audit-summary.csv`; separates Audit-Artefakt) |
| Dependency-Audit Produktionsabhängigkeiten | Exit 1: 38 Einträge; 6 critical, 18 high, 12 moderate, 2 low | dependency-audit-prod-summary.csv (`dependency-audit-prod-summary.csv`; separates Audit-Artefakt) |

**Einmalige Testanzahl:** 677 bestandene Unit-/Helpertests = 417 + 120 + 90 + 50. Die zusätzlichen 22 Webtests werden vom normalen Package-Testskript nicht ausgewählt. Die erfolgreiche Build-/Static-Verifikation wurde nach anfänglichen Cachetreffern ausdrücklich mit `--force` wiederholt. Prisma-Generation, Migration und Seed waren bereits bei identischem `develop`-Commit im vorherigen Setup erfolgreich; im aktuellen Audit wurden Schema und Migrationsstatus erneut geprüft. Es wurde kein Seed erneut auf unbekannte Daten angewandt.

Die zunächst probierte Route `/api/v1/standings` liefert erwartbar 404, weil der Controller einen Wettbewerbsslug verlangt. Dies ist **kein** Defekt. Die korrekte Route wurde anschließend erfolgreich geprüft.

Nicht ausgeführt: Browser-/Mobile-/Screenreader-E2E, echte Email-/Google-/Keycloak-Flows, echte MinIO/R2-Roundtrips, OTS-Liveabruf, Sportsprovider, Lasttest, VPS-/Productionprüfung, echter Gesamt-Restore. Ein abgeschlossener Scheduled-Publishing-Scan mit 0 fälligen Artikeln beweist keinen realen zeitgesteuerten Artikelübergang.

## Priorisierte Befunde

Priorität P0 bedeutet: vor externer Freigabe klären/beheben. P1: vor Closed Beta; P2: vor Launch beziehungsweise Feature-Abnahme. Severity beschreibt die mögliche Auswirkung; Evidenz und bestätigte Ausnutzbarkeit sind jeweils getrennt angegeben.

### F01 – Dependency-Advisories, darunter kritische Laufzeitmeldungen – P0 / CRITICAL laut Registry

`pnpm audit --prod --json` meldet sechs kritische Advisory-Einträge, darunter Next.js 16.3.0 und `proxy-addr` 2.0.7. Gesamt sind es 38 Production-Advisories. Dies sind Registry-Meldungen, **keine 38 bewiesenen ausnutzbaren Schwachstellen in Kurvenfunk**. Bedingungen müssen pro Advisory geprüft werden: eine Meldung betrifft Windows, während die geprüfte Umgebung Linux ist; weitere betreffen Image Optimization, `next/og`, bestimmte `use cache`-Pfade oder Proxyvertrauen. Der Report belegt nicht, dass all diese Funktionen exponiert sind.

Belege und von der Registry genannte Versionsbereiche/Patches: Produktionsübersicht (`dependency-audit-prod-summary.csv`; separates Audit-Artefakt), Rohdaten (`dependency-audit-prod.json`; separates Audit-Artefakt). Unter anderem: [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4), [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j), [GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h). Rohmeldungen wurden nicht durch Exploitversuche validiert.

Empfehlung: Runtime- und Tooling-Advisories getrennt triagieren, erreichbare Pfade dokumentieren, kompatible aktuelle Patches auswählen und im separaten Fixauftrag Lockfile/Manifest ändern. Danach Install-, Build-, Unit-, Browser- und Uploadregression. Kein automatisches `audit fix` im Audit ausgeführt.

### F02 – Öffentlicher Diagnoseendpoint erzeugt Queue-Jobs – P0 / HIGH, lokal bestätigt

[Controller](../../../apps/api/src/modules/request-id-test/request-id-test.controller.ts) hat keinen Auth-/Permission-/Rate-Guard und ist in [AppModule](../../../apps/api/src/app.module.ts) immer eingebunden. Lokaler POST auf `/api/v1/request-id-test/queue` ohne Authorization ergibt **201**; der Worker verarbeitet den Job. Nachweise: HTTP (`http-checks.json`; separates Audit-Artefakt), Worker (`worker-runtime.log`; separates Audit-Artefakt). Damit kann ein anonymer Aufrufer bei entsprechender API-Exposition Queuearbeit auslösen. Eine Überlastung wurde nicht provoziert.

Empfehlung: In öffentlich erreichbaren Umgebungen deaktivieren oder stark beschränken; Nichtregistrierung und anonymer Ablehnungsfall automatisiert testen. Gemeinsame Queue-/Worker-Ressourcen berücksichtigen.

### F03 – API-E2E startet nicht; vorhandene Assertion veraltet – P0 / HIGH für Freigaben, bestätigt

[Jest-E2E-Konfiguration](../../../apps/api/test/jest-e2e.json) verarbeitet den ESM-Export aus `packages/types/dist/index.js` nicht. Ergebnis: `SyntaxError: Unexpected token 'export'`, **0 Tests**. [app.e2e-spec.ts](../../../apps/api/test/app.e2e-spec.ts) erwartet außerdem `GET / → Hello World!`, erstellt AppModule aber ohne die produktive Bootstrap-Konfiguration aus `main.ts`. Selbst ein behobener Modulimport liefert also noch keinen Userflow-Nachweis. [Staging-Skript](../../../tests/e2e/staging.sh) prüft nur Health/Realm, nicht Registrierung/Onboarding/Kommentar.

Empfehlung: ESM-Strategie für Jest/ts-jest und Workspaceexports festlegen; gemeinsame testbare Bootstrap-Konfiguration; reale API-/Authflows mit isolierter DB/Redis. Kein Mock-Alias auf leere Module als Ersatz für Integration.

### F04 – Onboarding ist clientseitig erzwungen, serverseitig nicht – P1 / HIGH, statischer Befund

[OnboardingGate](../../../apps/web/src/features/onboarding/onboarding-gate.tsx) leitet um. [AuthGuard](../../../apps/api/src/modules/auth/auth.guard.ts) transportiert `kurvenfunkOnboardingCompleted`, prüft diesen Wert aber nicht. [PermissionsService](../../../apps/api/src/modules/permissions/permissions.service.ts) verwendet nur Rollen/Status; `USER` erlaubt Communityaktionen. Direkte API-Aufrufe verifizierter neuer ACTIVE-Nutzer werden damit nicht durch ein zentrales Completion-Gate abgefangen. Kein echter IdP-Exploitflow durchgeführt.

Empfehlung: Server-Gate mit expliziten Ausnahmen für `/auth/me`, Onboarding und benötigte Clubdaten; echte HTTP-Negativtests vor Abschluss und Positivtests danach.

### F05 – Karten-/Ban-Sanktionen und Session-Revoke fehlen – P1 / HIGH, Funktionslücke

[Moderation](../../../apps/api/src/modules/moderation/moderation.module.ts), [Sanctions](../../../apps/api/src/modules/sanctions/sanctions.module.ts), [Bans](../../../apps/api/src/modules/bans/bans.module.ts) sind leer. Das Schema beschreibt Karten und Sanktionen; es gibt keinen ausführbaren Drei-Gelb→Rot-Flow, kein Direkt-Rot, keinen Ablaufworker und keinen Keycloak-Session-Revoke. Der bestehende BANNED-Guard blockiert API-Requests, ersetzt aber keinen Sessionwiderruf. Kernregeln 2 und 3 des Plans sind nicht umgesetzt.

Empfehlung: transaktionaler Sanktionskern, idempotente Eskalation, zuverlässiger Revoke-/Notification-Outboxpfad, Ablaufregeln mit konkurrierenden Sanktionen und echte Integrationstests. Communityfreigabe davon abhängig machen.

### F06 – AuthProvider erneuert Tokens nicht – P1 / HIGH für Nutzbarkeit, statischer Befund

[AuthProvider](../../../apps/web/src/features/auth/auth-provider.tsx) übernimmt `client.token` initial und enthält keine `updateToken`-/`onTokenExpired`-Strategie. Die im React-State gehaltene Tokenkopie kann nach Ablauf veralten; lange Sessions können zu 401/fehlgeschlagenen Schreibaktionen führen. Ein realer Ablauf-/Refreshflow ist nicht getestet.

Empfehlung: zentraler Tokenzugriff mit Erneuerung, deduplizierte Refreshes, kontrollierte Reauthentifizierung und Browser-Abnahmetest mit kurzer Tokenlaufzeit. Tokens nicht persistieren/loggen.

### F07 – Uploadprüfung vertraut Client-MIME – P1 / HIGH, statischer Befund

[MediaService](../../../apps/api/src/modules/media/media.service.ts) kontrolliert Größe und `file.mimetype`, leitet daraus eine Bildextension ab und speichert unveränderte Bytes. Weder Dateisignatur noch tatsächliche Bilddekodierung/Abmessungsgrenzen werden geprüft. [Controller](../../../apps/api/src/modules/media/media.controller.ts) limitiert 10 MB, die Contentroute ist öffentlich. Das ist kein Nachweis erfolgreicher Schadcodeausführung; die zugesagte Dateityp-/Inhaltsprüfung aus Aufgabe 256 ist jedoch unvollständig.

Empfehlung: vertrauenswürdige Bilddekodierung, Größen-/Pixelgrenzen, erlaubtes Ausgabeformat, kontrollierte Contentheader; negative echte Multiparttests mit falscher MIME/Signatur und Storage-Roundtrip. Medienveröffentlichung und Draft-Bildzugriff fachlich klären.

### F08 – Import-Review endet beim Statuswechsel – P1 / HIGH, statischer Funktionsbefund

[ImportsService.decideReview](../../../apps/api/src/modules/imports/imports.service.ts) setzt bei Freigabe `MATCHED/APPROVED`; es startet keinen Folgejob und legt keinen Artikel an. [NewsImportProcessor](../../../apps/worker/src/processors/news-import.processor.ts) publiziert nur unmittelbar im ursprünglichen Durchlauf, wenn keine Review nötig ist. Der OTS-Adapter setzt `trustedForAutoPublish=false`; [AutoPublishingService](../../../apps/worker/src/services/news-auto-publishing.service.ts) überspringt untrusted Provider. Im geprüften Bestand wurde kein Consumer gefunden, der freigegebene Records danach redaktionell übernimmt. Eine grüne Statuswechsel-Unitprüfung belegt keinen geschlossenen Import→Review→Artikel-Flow.

Empfehlung: expliziter, autorisierter Übernahmeauftrag nach Review; idempotent einen Draft oder bewusst freigegebenen Publishauftrag erzeugen, Quellen-/Lizenz-/Matchingdaten bewahren. Einmaliger Integrationstest muss tatsächliche Artikelentstehung und Fehlerretry prüfen.

### F09 – Fehlende echte Infrastruktursuite und Testauswahl-Lücke – P1 / MEDIUM, bestätigt

655 reguläre Tests bestehen. 22 weitere bestehende Webtests sind durch das Package-Testglob ausgeschlossen, darunter Commentpagination und Reportclient. Alle 50 Webhelpertests bestehen bei expliziter Auswahl. Mehrere `*-integration.spec.ts` mocken DB/JWT/Services und prüfen keine realen PostgreSQL-/Redis-Eigenschaften. Dadurch bleiben Lua, SQL-Cursor, Constraints, Import-/Review- und Authflüsse unzureichend abgesichert.

Empfehlung: Testglob korrigieren, testdiscoverability in CI prüfen, echte Infrastruktur-Integration ergänzen. Ergebnisse als Unit/Modul/Integration/Browser getrennt publizieren.

### F10 – Mockdaten in Produktansichten – P1 / MEDIUM, bestätigt im Code

[ClubDetail](../../../apps/web/src/features/clubs/club-detail.tsx) nutzt `getClubPageMockData` für News/Spiele/Tabelle/Diskussionen. [Startseite](../../../apps/web/src/features/personalization/personalized-startpage.tsx) mischt echte News mit Sport-/Diskussionsmocks. Tabelle und Spielplan besitzen teils Vorschau-/Fallbackdaten. Reale Clubstammdaten und DB-Leseseiten sind daher nicht gleichbedeutend mit einem fertigen Fußballportal.

Empfehlung: Mock-/Previewmodus strikt erkennbar und umgebungsgebunden; Produktionsansichten zeigen echte Daten oder ehrliche Empty-/Errorstates, nie stillschweigend Ersatzresultate.

### F11 – Breiter Abuse-Schutz und Securityheader fehlen – P1 / MEDIUM, teilweise lokal bestätigt

Kommentarspam hat sinnvolle autorbasierte Lua-Limits und Fail-Closed-Behandlung. Separate Rate-Limits für Votes/Reports, IP-HMAC/-Limits und die IdP-Flows sind nicht vollständig implementiert. [main.ts](../../../apps/api/src/main.ts) konfiguriert CORS auf WEB_URL, jedoch keine lokale CSP/Helmet-Policy; [Nextconfig](../../../apps/web/next.config.ts) setzt ebenfalls keine Securityheader. Lokale Antworten enthalten keine CSP/X-Content-Type-Options/X-Frame-Options. Edgeheader könnten extern existieren und wurden nicht geprüft.

Empfehlung: API-/IdP-/Edge-Abusekonzept; CSP passend zu Keycloak, Tiptap und Bildern im Report-only-Modus entwickeln; exakte Origin-/Preflighttests. HSTS nur für tatsächliche HTTPS-Zielumgebung konfigurieren.

### F12 – Sensible Daten können in Freitextlogs gelangen – P1 / MEDIUM, statischer Befund

[HttpLoggingInterceptor](../../../apps/api/src/common/interceptors/http-logging.interceptor.ts) loggt `request.originalUrl` einschließlich Querystring. [Logger](../../../packages/logger/src/logger.ts) redigiert bekannte Objektschlüssel, nicht sensible Daten innerhalb von URL-, Message- oder Error-Strings; Error.message/stack werden unverändert übernommen. OTS benötigt laut Providervertrag einen Queryparameter `app`. Eine tatsächliche Secretpreisgabe wurde nicht beobachtet und es wurden keine echten Secrets zum Testen verwendet.

Empfehlung: Route/Pfad ohne beliebige Querywerte loggen, URL-/Error-Redaction und Logger-Negativtests mit synthetischen Markern; Aufbewahrung und Zugriffskonzept.

### F13 – Import-Nebenläufigkeit/Idempotenz nicht abgesichert nachgewiesen – P2 / MEDIUM, Risiko

[AutoPublishingService](../../../apps/worker/src/services/news-auto-publishing.service.ts) liest Recordstatus und generiert einen Slug vor/innerhalb einer Transaktion, ohne sichtbaren exklusiven Claim/Lock oder eindeutige Artikelzuordnung je Importrecord. [DuplicateDetection](../../../apps/worker/src/services/news-duplicate-detection.service.ts) prüft mehrfach unabhängig und begrenzt Titelkandidaten auf 200. Unter Parallelität sind Duplikate/Slugkonflikte denkbar. Kein realer Race reproduziert; nicht als bestätigter Doppelpublish gewertet.

Empfehlung: Invariante und Claim-/Unique-/Retrystrategie definieren, anschließend mehrfache parallele Verarbeitung und Crash-/Retryfälle gegen echte DB testen.

### F14 – Eingabevalidation und Auditspur lückenhaft – P2 / MEDIUM, teilweise lokal bestätigt

Ungültiges `GET /api/v1/media/not-a-uuid/content` ergibt **500 statt kontrolliertem 400/404**. Mehrere Editorial-/Import-/Media-IDs sind rohe Paramstrings. Zod ist verbreitet, aber nicht universell. `AuditLog` ist modelliert, im geprüften Fachcode gibt es keine entsprechenden `auditLog`-Schreibaufrufe; ArticleRevision ist eine Inhaltshistorie ohne expliziten Akteur und ersetzt kein Admin-/Moderationsaudit.

Empfehlung: Paramschemas/ParseUUIDPipe, konsistente Domainfehler, auditierbare sicherheitsrelevante Aktionen mit Akteur/Request-ID und PII-Minimierung; echte HTTP-Negativtests.

### F15 – Adminoberfläche ist kein zentral geschützter Bereich – P2 / LOW, statischer Befund

[AdminLayout](../../../apps/web/src/features/admin/admin-layout.tsx) rendert Navigation ohne zentralen Rollencheck. Backend-Mutationen verwenden Auth-/Editorial-/Permission-Guards; **keine daraus abgeleitete Berechtigungsumgehung nachgewiesen**. Leere Dashboards und Fachplatzhalter sind jedoch kein Adminsystem, und unberechtigte Nutzer erhalten keine konsistente Zugangsführung.

Empfehlung: zentraler, konsistenter UI-Zugangsschutz, Backend bleibt maßgeblich; negative Rollen- und Sessiontests.

### F16 – Datenschutz und rechtliche Launch-Gates offen – P1 / HIGH für Launchfähigkeit

Export/Löschung/Retention/Klassifizierung fehlen als vollständige Prozesse. Settings zeigen dafür Platzhalter. HMAC-IP-Schema ist keine implementierte Pseudonymisierung. Rechtstexte und Community-/interne Moderationsrichtlinien fehlen als freigegebene Artefakte. Kein rechtliches Urteil getroffen.

Empfehlung: Dateninventar und fachliche Fristen vor Implementierung, asynchrone Export-/Löschaufträge einschließlich Keycloak/Storage/Backups/Anonymisierung, juristische Freigabe separat.

### F17 – Betriebsnachweise fehlen für aktuelle Infrastruktur – P1 / HIGH für Launchfähigkeit

Compose-/Deploy-/Backup-/Restore-Skripte und ein historischer Restorebericht sind vorhanden. Das belegt keinen aktuellen VPS-Zustand, automatisierte Timer, Alarmierung oder vollständigen Restore inklusive Uploads. Worker-Compose-Health prüft primär Redis, nicht funktionierende Jobverarbeitung. CPU/RAM/Disk-/Backupalarmierung ist nicht als fertiges Monitoring implementiert.

Empfehlung: isolierter Restore-Drill mit eigenen Fixtures, RPO/RTO und tatsächlichen Alarmtests; Zielbetriebsprüfung nur in separat autorisierter Umgebung. Kein Produktionszugriff für diesen Audit erforderlich.

### F18 – Produktabweichung und Umfangsdrift – P2 / Produktentscheidung

Masterplan fordert zunächst LIKE; aktuelle Kommentar-API/UI verwenden UPVOTE/DOWNVOTE und öffentliche/angemeldete Voterlisten. Schema enthält außerdem BLUE-Karten und Seeds für mehrere Wettbewerbe, während wesentliche MVP-Moderation fehlt. Das ist nicht automatisch falsch, aber ohne dokumentierte Scopeentscheidung kein Beleg der Masterplanerfüllung. Die PDF-Version 1.1 darf nicht mit fertiggestellter Produktversion 1.1 verwechselt werden.

Empfehlung: MVP und ADRs nachholen, bewusste Abweichungen freigeben, Datenschutz/Votingdarstellung und zusätzliche Wettbewerbe ausdrücklich entscheiden.

## Technische Schulden und Architektur

- Positiv: modulare API, klare Rollen-/Status-Trennung, fail-closed Permissions, Zod-Verträge, case-insensitive Nickname-Unique-Index, DB-Constraints für Reaktionsziel und Reportduplikate, Soft-Delete-Tombstones, querybasiertes Newsranking, Provideradapter und ein zentraler Storagevertrag.
- Pro Fachservice wird häufig ein eigener PrismaClient/Pool erzeugt. Bei vielen aktiven Modulen DB-Verbindungsbudget messen und ggf. zentralen lifecyclegesteuerten DB-Service nutzen. Kein aktueller Poolausfall beobachtet.
- Einige Listen sind unbeschränkt (`findEditorialList`, vollständige Saisonmatches, Importjob-Records). Cursor-/Limitverträge, Querybudgets und EXPLAIN fehlen an diesen Grenzen.
- Staging-/Deployment-Smokes sind sinnvoll als Infrastrukturcheck, ersetzen jedoch keine fachliche Abnahme. Productionworkflow mit Bestätigungseingabe ist noch kein nachgewiesenes geschütztes Releaseverfahren oder Provenance-/Image-Digest-Nachweis.
- CDN-/Containerimages sind teilweise beweglich (`latest`, Tags ohne Digest); reproducible Builds und Registry-/Signatur-/SBOM-Strategie prüfen. Kein Containerimage-Securityscan durchgeführt.
- Shared Validation und Frontend kopieren stellenweise Regeln (Nickname-Konstanten). Browser und API können bei späteren Änderungen auseinanderlaufen.
- Search-/Notification-/Audit-/Sanction-Events benötigen zuverlässige Zustellung aus PostgreSQL; ein registrierter BullMQ-Name ist keine Outbox und macht Redis nicht rekonstruierbar.
- Clubseiten/Tabellen/Spielplan sollten echte Stage-/Saisonsemantik bekommen; Read-API allein berechnet keine Bundesliga-Tabelle und löst keine Playoff-/Tie-Breaker-Regeln.

## Kritische Blocker und Freigaben

1. Runtime-Advisories triagieren und erreichbare kritische Risiken beheben; öffentlichen Queue-Diagnosepfad schließen.
2. E2E-Runner reparieren und echte Auth-/Onboarding-/Kommentar-/Publishflows beweisen.
3. Moderations-/Sanktionssystem mit Sessionwiderruf und Audit/Notification vor Community-Beta fertigstellen.
4. Review→Artikel-Übernahme schließen; Upload/Token-/Onboarding-/Abuse-Lücken beheben.
5. Datenschutz-/Rechts-/Restore-/Monitoring-/Accessibility-/Last-Gates vor Launch erfüllen.
6. Für UNKNOWN-Aufgaben autorisierte Betriebs-/Geschäftsnachweise einholen; sie werden nicht durch Codebehauptungen auf DONE gesetzt.

Konkrete Umsetzungsschritte und kleine parallelisierbare Pakete stehen in [ROADMAP.md](ROADMAP.md) und [AGENTENPAKETE.md](AGENTENPAKETE.md). Diese Vorschläge sind nicht ausgeführt. Für weitere Umsetzung ist die vom Benutzer gewünschte Ergebnisfreigabe der nächste Schritt; aus dem Masterplan wurde keine Änderungs- oder Deploymentberechtigung abgeleitet.
