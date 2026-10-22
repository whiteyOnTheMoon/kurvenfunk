# Vorschlag für kleine Codex-Agenten-Aufträge

**Nur Planung zur Freigabe. Es wurden keine Implementierungsagenten gestartet.** Alle späteren Aufgaben starten vom freigegebenen `develop`-Stand; keine Produktionszugriffe/Deployments. Kein Agent soll pauschal „den ganzen Masterplan“ umsetzen. Jedes Paket liefert eine prüfbare Änderung mit Tests und nennt verbleibende Grenzen. Neue Secrets werden nicht erfunden oder in Dateien/Chat eingecheckt.

## Parallelitätsregeln

- Ein Integrationsverantwortlicher besitzt `packages/database/prisma/schema.prisma`, Migrationen, Lockfile, gemeinsame Authverträge und CI-Workflowänderungen. Änderungen dieser Dateien nacheinander integrieren; Agenten für andere Bereiche bauen auf dem vereinbarten Vertrag auf.
- A01/A02 ändern beide Dependencygraph/Lockfile: nur nacheinander mergen. Analyse kann parallel laufen. A04 und A05 benötigen getrennte Fileownership, falls beide CI ändern wollen.
- A07 und A09 berühren API-Bootstrap/Guards: konkrete Dateiverantwortung vorher festlegen. Kein Feature darf Berechtigungs-/Statuschecks nur im Frontend implementieren.
- Vertragsslices zuerst, Producer/Consumer anschließend parallel. Alle Arbeitsaufträge müssen idempotentes Verhalten, Errorstates und relevante Negativtests benennen.
- Tests gegen eigene lokale Fixtures/isolierte Datenbanken und Queues; keine Abhängigkeit von laufenden Produktionssystemen. Eine vorhandene Datei oder ein Mocktest allein erfüllt kein E2E-Abnahmekriterium.
- Nach Integration nur betroffene Checks plus erforderliche gemeinsame Gates laufen lassen; eine volle Suite beim gemeinsamen Mergegate. Keine unnötigen globalen Refactorings.

## Erste Welle – sofort unabhängig vorbereitbar

| Paket | Enger Auftrag / Dateien | Abnahmekriterien | Abhängigkeit / parallel zu |
|---|---|---|---|
| A01 Runtime-Advisories | Production-Advisoryliste triagieren; kompatible Patches für Next/Express-Transitives/Uploadpfad auswählen. Eigentum: relevante `apps/*/package.json`, Lockfile über Integrator. Kein blindes audit fix. | Pro Advisory: Version/Pfad/Erreichbarkeit/Entscheidung; keine offenen erreichbaren Criticals; Frozen-Install, Build und relevante Regression grün. | Keine fachliche Abhängigkeit; Lockfile exklusiv; A02 danach integrieren. |
| A02 Tooling-Advisories | Verbleibende Dev-/Build-Advisories separat patchen oder begründet nicht betroffen markieren. | Gesamtaudit erneut; Keine unbewerteten High/Critical-Toolingpfade; Lint/Typecheck/Test/Build. | Nach A01-Lockfile; Analyse parallel A03–A05. |
| A03 Diagnosequeue sperren | `request-id-test.controller.ts`, zugehöriges Modul/Registrierung; gewählten DEV-only-/Auth-/Rate-Vertrag implementieren. Keine anderen Queues umbauen. | Nichtautorisierte öffentliche Konfiguration kann keinen Job erzeugen; erlaubter DEV-Test erhält Request-ID; HTTP-Test prüft Queue-Nichtaufruf im Negativfall. | Unabhängig A01/A04/A05. |
| A04 ESM-E2E-Runner | `apps/api/test/jest-e2e.json`, `app.e2e-spec.ts`, ggf. separater Bootstraphelper. Native Workspaceexports real laden, keine leeren Importmocks. | E2E startet, führt mindestens Health/Ready und Auth-401 wirklich aus, korrekter Prefix/Filter; Errorstatus zuverlässig ungleich 0 bei fehlerhafter Assertion. Kein Hello-World-Placeholder. | Lokal DB/Redis; nachgelagerte Fachflows noch nicht Teil dieses Pakets. |
| A05 Webtest-Auswahl | Nur `apps/web/package.json` und ggf. CI-Testdiscovery ergänzen; alle vorhandenen Featurehelpertests erfassen. | Aktuell 50 statt 28 Webtests werden ausgewählt; neue passende Datei wird automatisch mit erfasst; Testfehler bleiben sichtbar. | Unabhängig A03/A04; CI-Verantwortung abstimmen. |
| A06 Tokenrefresh | `apps/web/src/features/auth/auth-provider.tsx` plus schmaler Authhelper/-test. | Kontrollierter Ablauf/Refresh, deduplizierte parallele Requests, aktualisierter Contexttoken, Reauth bei ungültiger Session; kein Token in Storage/Logs; echter kurzer TTL-Test später A12. | Unabhängig API-Pakete; stabile Keycloak-Testkonfiguration erforderlich für Browserabnahme. |
| A07 Server-Onboardinggate | Neuer kleiner Guard/Decorator, Einbindung bei Communitymutationen; Ausnahmen für Me/Onboarding/Clubliste explizit. | Unvollständiger ACTIVE-User kann nicht kommentieren/voten gemäß freigegebener Policy; Abschluss schaltet erlaubte Aktionen frei; BANNED bleibt blockiert. Echte HTTP-Tests. | A04 für Integration; Abstimmung welche Aktionen vor Completion erlaubt sind; keine Schemaänderung. |
| A08 Uploadvalidierung | `media.service.ts` und Uploadgrenze/Tests; vorhandenen Storagevertrag beibehalten. | Falsche MIME/Signatur, leere/defekte/überdimensionierte Bilder abgelehnt; erlaubtes Bild wird korrekt dekodiert/gespeichert/geladen; echte Multipart-/Storage-Roundtripprüfung. | A01 für Libraryauswahl; falls neue Dependency: Lockfile über Integrator. |
| A09a UUID-Fehler | Nur Media-/Editorial-/Import-Paramvalidation mit gemeinsamen bestehenden Pipes. | Ungültige IDs 400 statt 500; gültige fehlende IDs 404; echte HTTP-Regression; keine Responseformatänderung. | A04; getrennt von A09b. |
| A09b Logredaction | `http-logging.interceptor.ts`, `packages/logger/src/logger.ts`, neue fokussierte Tests. | Arbiträre Querywerte werden nicht geloggt; synthetische Secretmarker in Errors/URLs redigiert; Request-ID/Event erhalten; keine echten Secrets als Testdaten. | Unabhängig A09a; kein Domainrefactoring. |

## Zweite Welle – bestehende Features vertikal schließen

| Paket | Enger Auftrag / Dateien | Abnahmekriterien | Abhängigkeit |
|---|---|---|---|
| A10 Review→Draft | `imports.service.ts`, kleiner Übernahmejob/-consumer, bestehende Admin-Reviewaktion. Vertrag: Freigabe erzeugt genau einen redaktionellen Draft, Publish bleibt eigener Berechtigungsschritt. | Echte DB/Queue: APPROVED erzeugt nachvollziehbaren Draft mit Quelle/Zuordnungen; REJECTED nicht; Reviewer/Request-ID gespeichert; Fehlerretry ohne Doppelartikel. | Zuerst Vertrag mit A11; A04. Keine Live-OTS-Aktivierung. |
| A11 Import-Idempotenz | Claim-/Uniquevertrag für Record→Artikel und Wiederholungen; Schemaänderung nur durch Integrator. | Zwei gleichzeitige Übernahmen desselben Records ergeben genau einen Artikel; Prozessabbruch/Retry nachvollziehbar; Slugkollision kontrolliert. | Gemeinsamer Datenvertrag vor A10-Implementierung; echte PostgreSQL-Tests. |
| A12 Authbrowser-Smoke | Neuer isolierter Testrealm plus Browserfixtures für verifiziert/unverifiziert/BANNED und CLUB/NEUTRAL. | Login→Onboarding→Preference→Startseite→Logout; negatives Emailverified-Gate; Tokenablauf/Refresh. Google-/SMTP-Liveteile separat markieren, nicht mockbasiert als echt melden. | A04/A06/A07; lokale Testzugänge, keine Produktionsidentitäten. |
| A13 Editorial-Vertikalsmoke | Browser-/Integrationstest für Create→Media→Review→Schedule→Published; Testdaten isoliert. | Inhalt/SEO/Clubzuordnung in öffentlicher Seite korrekt, unveröffentlichter Artikel geschützt; Schedulerübergang real geprüft; eigenständige Bereinigung. | A04/A08; reale lokale Storageinstanz. |
| A14 Web-Mockgrenzen | Clubdetail und Startseite: API-Verträge für jeweils einen echten Inhaltsblock; getrennte Untertickets für News, Matches, Tabelle, Diskussion. | Jeder übernommene Block nutzt echte API oder ehrliche Empty/Errorstate; Mockmodus nur explizit DEV/Vorschau. Kein stiller Datenersatz bei API-Ausfall. | API-Leseverträge; pro Block eigenes kleines PR, nicht alles in einem Agentenauftrag. |
| A15 Header/CORS-Policy | Kleine API-/Web-Headerkonfiguration und Negativ-/Preflighttests; CSP zunächst mit dokumentierten Quellen/Nonces. | erlaubte Origin korrekt, fremde Origin nicht freigegeben; sinnvolle lokale Header; CSP ohne Auth-/Editorbruch; HTTPS-spezifische Regeln umgebungsgerecht. | A12/A13 für Browserregression; keine Cloudflare-Änderung. |

## Dritte Welle – Moderationskern mit separater Vertragsverantwortung

| Paket | Enger Auftrag / Dateien | Abnahmekriterien | Abhängigkeit |
|---|---|---|---|
| M01 Sanktions-/Eventvertrag | Schema-/Invariantenprüfung, transaktionale Audit-/Outboxverträge, relevantes Gelb/Ablaufdefinition. **Kein gesamtes Moderationssystem.** | Akzeptierte Fachregeln und eindeutige Idempotenz-/Akteur-/Zeitsemantik; Migrationen falls nötig isoliert getestet. | Freigabe Moderationspolicy; Integrator besitzt Schema. |
| M02 Gelb/Direktrot | Kleiner Moderationsservice + Controller für Kartenerteilung; Eskalation transaktional. | 1/2 Gelb keine Rot; dritte relevante Gelbe genau eine Rot/Sperre; Direktrot nur mit Permission/Grund/Notiz; Race-/Audit-Tests. | M01; keine eigenen Keycloak-/Mailimplementierungen. |
| M03 Keycloak-Revokeadapter | Isolierter Adminadapter + idempotenter Outboxconsumer nur für Revoke. | Timeout/Retry/Already-revoked korrekt; Ban wirkt sofort im API-Guard; Workerfehler sichtbar; echter Testrealm bestätigt Sessionverlust. | M01-Vertrag; kann parallel M02 entstehen. |
| M04 LIMITED/Ablauf | Setzen/Beenden von LIMITED und Ablaufworker mit mehreren aktiven Sanktionen. | LIMITED kann lesen/voten, nicht schreiben; nach Ablauf nur ACTIVE wenn keine andere wirksame Sperre; Direktban wird nie vom Ablauf aufgehoben. | M01/M02; DB-/Queue-Integration. |
| M05 Reports-Arbeitsliste | Reports lesen/zuweisen/auflösen mit Moderator-RBAC und kleinem Adminscreen. | Ein konkreter Kommentarreport von User bis moderierter Entscheidung nachvollziehbar; getrennte interne Notiz und Userkommunikation; Audit. | M01/A04; kein komplettes Moderationsdashboard in diesem Paket. |
| M06 In-App-Notification-Slice | Ein Notificationtyp (zunächst Karte) vom Outboxevent bis Read/Unread-UI. | Genau-einmaliger fachlicher Effekt trotz Retry; nur Empfänger liest Nachricht; obligatorische Moderationsnachricht nicht abschaltbar. | M01; Mail/alle Typen eigene Folgepakete. |
| M07 IP-HMAC-Slice | Pseudonymisierungsservice mit Version/Keybinding und TTL-Policy, zunächst ohne globale IP-Bans. | Stabile Hashes pro Key, Rotationstrennung, kein Klartext-IP-Logging, Retentionjob mit Fixtures; Trusted-Proxy-Semantik nach F01 prüfen. | Fachliche Fristen und sichere lokale Testkeybindung. |

## Paralleler Sport-/Produktstrang

| Paket | Enger Auftrag / Dateien | Abnahmekriterien | Abhängigkeit |
|---|---|---|---|
| S01 Sportsprovidervertrag | Geteiltes Interface und kleiner Fakeprovider für Fixtures/Results, keine Liveanbieterintegration. | Normalisierung/Validierung und deterministische Fixturefälle; keine Kopplung an Newsprovider. | Keine Moderationsabhängigkeit; gemeinsames Types-Package abstimmen. |
| S02 Sportsimport-Consumer | Nur Matches eines Fakeproviders idempotent in isolierte Saison importieren. | Mehrfacher Import erzeugt keine Dubletten; Resultatänderung nachvollziehbar; Fehler nicht als Erfolg markiert. | S01; Integrator für erforderliche EntityMatch-Constraints. |
| S03 Tabellenberechnung | Reine deterministische Berechnungsfunktion für explizit freigegebene Bundesliga-Phase/Tie-Breaker. | Siege/Remis/Niederlagen, Punkteabzug, Gleichstand, verschobene Spiele und Phasenwechsel mit Fixtures; kein stilles Erfinden sportrechtlicher Regeln. | Fachliche Tabellenregeln; Persistenz separat von Berechnungsfunktion. |
| S04 Tabellenprojektion | Persistenz-/Rebuildjob aus Matchdaten und readseitige Stageauswahl. | Rebuild reproduziert dieselben Zeilen, korrigiertes Ergebnis aktualisiert Tabelle, paralleler Rebuild sicher. | S02/S03; danach echter Tabellenblock A14. |
| P01 MVP/ADR-Entscheidungen | Neue Dokumententwürfe für 001–005, LIKE-vs-Votes, Scope zusätzlicher Wettbewerbe, Mockgrenzen, Freigabegates. | Expliziter MVP/Nicht-MVP, Verantwortliche und akzeptierte Abweichungen; zur Produktfreigabe vorlegen. | Unabhängig implementierbar **erst nach Dokumentationsfreigabe**, da aktueller Auftrag keine bestehenden Docs ändern darf. |
| P02 Datenschutzinventar | Entwurf Datenklassen/Fristen/Export-/Löschvertrag, noch keine globale Löschroutine. | Datenquellen PostgreSQL/Keycloak/Storage/Logs/Backups, Fristen, Anonymisierung und Zuständigkeit erfasst; fachlich/juristisch prüfbar. | Unabhängig M01; Ergebnisse beeinflussen M07/Export/Deletion. |

## Spätere Slices, bewusst noch keine Sammelaufträge

Forum zuerst „Kategorie/Forum öffentlich lesen“, danach „Thread erstellen mit ACTIVE/Onboarding-Permission“, danach „Post/Reply“, danach Pagination/Readstate/Subscription/Moderationsaktionen jeweils separat. Suche zuerst „Artikelindex + vollständiger Rebuild“, dann Indexevents/Clubs/Forum, anschließend Ranking/UI. Administration pro echte Fachliste statt pauschal „Admin fertigstellen“. Betrieb zuerst isolierter PostgreSQL-Restore mit Fixtures, dann Keycloak, dann Objectstorage, anschließend Gesamt-Drill/Alarme.

Vor jedem solchen Auftrag Statusmatrix prüfen: Welche Lücke soll das konkrete Paket schließen, welche Dateien besitzt es, welches reale Abnahmesignal ersetzt die bisherige Unsicherheit? Kein Agent soll unabhängige Features erweitern, nur um einen Meilenstein nominell grün zu machen.

## Gemeinsames Mergegate

Branch/Commit im Ergebnis nennen; nur vereinbarte Dateigrenzen; relevante Negativtests und reale Integrationsnachweise; keine Secrets; keine Deployments; UI-/Loading-/Empty-/Errorstates berücksichtigen. Nach akzeptierten Änderungen den jeweiligen Aufgabenstatus samt Beleg aktualisieren. Mobile/Staging/externen Betrieb nur als bestanden melden, wenn tatsächlich geprüft. Der Integrator löst Schnittstellen-/Migration-/Lockfilekonflikte vor dem nächsten Paketstart.
