# Vorschläge für kleine Codex-Agentenaufträge

Nur Vorschläge zur Freigabe; keine Agenten gestartet. Je Auftrag ein enger Branch ab aktuellem `develop`, relevante echte Regression, Ergebnis mit Tests/Risiken und Review. Keine Deployments/Produktionszugriffe. Gemeinsames Schema, Lockfile und CIintegration haben jeweils einen Integrationsverantwortlichen.

| Paket | Enger Auftrag / Eigentum | Abnahmekriterien | Abhängigkeit |
|---|---|---|---|
| G01 | Bestehenden Dependency-PR #10 am aktuellen develop nachprüfen und Restadvisories pro Pfad entscheiden; Manifeste/Lock exklusiv | Auditbefund→Version/Pfad/Erreichbarkeit/Entscheidung; relevante Regressionen und Frozen-Install | Unabhängig, keine parallelen Lockfileedits |
| G02 | Bestehenden E2E-PR #11 prüfen; nur Runner/Bootstrapkonfiguration/Health-Authbasis | Reale App/DB/Redis, keine Aliasattrappen, ESM lädt, Negativassertion bricht ab, Containercleanup | Grundlage weiterer Fachtests |
| G03 | Bestehenden Webtest-PR #12 prüfen; nur automatische Testauswahl | 50 bestehende + neue passende Datei, absichtlicher Fehler Exit ungleich 0 | Unabhängig G02 |
| G04a | Workerfixture in raw-payload.service.spec.ts mit aktuellem Providervertrag abgleichen | Worker `tsc --noEmit`, 120 Tests und Build erfolgreich | Kleiner eigenständiger Fix, keine Dependencyänderung |
| G04b | Fehlende API-/Web-/Worker-typecheck-Scripts an Turbo/CI anschließen | Alle drei Apps sichtbar geprüft; kontrollierter temporärer Typfehler stoppt das Gate | G04a; Manifestownership abstimmen |
| A01 | Kleiner serverseitiger Completionguard/Policy und explizite Ausnahmen | Incomplete commentPOST abgewiesen, Complete erlaubt; LIMITED/BANNED nicht aufgeweicht; echte HTTPtests | G02 für dauerhafte Integration |
| A02 | AuthProvider-Tokenrefreshhelper und deduplizierten Zugriff integrieren | Aktualisierter Context, kurze TTL, parallele Requests, ungültige Session/Logout; Tokens nie speichern/loggen | Lokaler Testrealm für Browserabnahme |
| A03 | Nicknamepolicy um verbotene Begriffe ergänzen; gemeinsame Validation und Fehlermeldung | Reservierung/Case/Normalisierung/Verbotsfälle und Bestandsnamenstrategie getestet | Produktpolicy zuerst |
| S01 | UUIDparamvalidation ausschließlich Media-/Imports-/Editorialrouten | Ungültig400, fehlend404, intern500 maskiert; echte HTTPregression | G02; keine Antwortformatänderung |
| S02 | HTTPquery-/Errorredaction in Logger/Interceptor | Synthetische Secretmarker fehlen im Sink, Request-ID/Event bleiben; Error-/URL-Negativfälle | Unabhängig S01 |
| S03 | Sichere Bilddekodierung/Dateigrößen-/Pixelgrenzen in Mediaannahme | MIMEtäuschung/defekte/leere/zu große Bilder abgelehnt; erlaubtes Bild echt speichern/laden; keine Storageattrappe für Abnahme | Dependencyownership G01, lokales MinIO |
| E01 | Ein redaktionelles Auditereignis: Publish mit Akteur und Request-ID | Publish und Audit konsistent, Retry keine Dubletten, unberechtigt kein Event | Kleiner Auditvertrag/Schemaownership |
| E02 | Revisionsakteur ergänzen und über Updatepfad weitergeben | Änderung→Revision enthält zutreffenden Akteur; alte Revisionen verträglich | Schema/Migration separat verantworten |
| N01 | Vertrag Record→Artikel samt atomarem Claim/Uniqueinvariante | Zwei parallele Übernahmen erzeugen exakt einen Artikel; Abbruch/Retry funktioniert | Vor N02; Schema exklusiv |
| N02 | ApproveReview erzeugt genau einen redaktionellen Draftauftrag | Echte DB/Queue: Approved→Draft mit Quelle/Zuordnung/Reviewer, Rejected→kein Draft; Fehlerretry | N01-Vertrag, G02 |
| N03 | Reale Retry-/DLQ-Prüfung für bestehenden Importconsumer, keine Anbietererweiterung | Vorübergehender Fehler erfolgreich retried; endgültiger Fehler isoliert, kein unkontrolliertes Doppelereignis | G02, eigene Redisfixtures |
| C01 | Bestehende Comments-/Votes-/Reportsintegration als dauerhafte Projekttests | Real JWT/JWKS+DB/Redis; ACTIVE/LIMITED/BANNED, Owner, Editrevision, Delete, Reportunique, Cursor | G02/A01, keine UIrefaktorierung |
| C02 | Reale Redis-Luagrentests für Ratefenster/Linklimit/Ausfall | 10/min, 5s, Duplikate, 2 Links, Failclosed und parallele Reservationen nachweisbar | Eigenes Redis; keine minutenlangen sleeps, kontrollierte Fixtures |
| C03 | LIKE-vs-Votes-Vertrag nach Produktentscheidung angleichen | Datenmigration/API/UI konsistent, LIMITED weiter erlaubt, BANNED blockiert | Vorher Produktfreigabe, Schemaownership |
| Y01 | Yellow-Card-Vergabe als kleiner API-/Persistenzslice | user.warn erforderlich; Ziel/Grund/Notiz/Inhalt/Moderator/Zeit korrekt, Nichtberechtigte403; echte Transaktions-/Negativtests | Notification-/Auditvertrag vorab; keine Drei-Gelb-/Banimplementierung im Paket |
| Y02 | Ein Notificationtyp „Karte erteilt“ mit zuverlässigem Consumer | Wiederholung ergibt fachlich eine Nachricht; nur Empfänger liest; interne Notiz nie öffentlich | Stabiler Eventvertrag Y01, kann danach parallel zur UI entstehen |
| Y03 | Kleine Moderatoraktion und Empfängernachricht im Web anschließen | Echte Vergabe→Notification im Browser, Loading/Error, Rollen-/Statusfälle; keine bloßen Platzhalter | Y01/Y02 |
| W01 | Ausschließlich Clubdetail-Newsblock von Mocks auf vorhandene ArtikelAPI umstellen | Clubfilter richtig, leer/Fehler ehrlich, kein stiller Mockfallback | Unabhängig vom Sportimport |
| W02 | Ausschließlich Startseiten-Spielblock an bestehende MatchAPI anschließen | Lieblingsclub und Neutral, echte/leere/Fehlerdaten, responsive Darstellung | Keine Tabellen-/Forumfunktion im selben Paket |
| W03 | Ein vertikaler Authbrowserflow mit lokalem Realm/SMTPfixture | Register→Verify→Login→Onboarding→Preference→Logout einschließlich Negativfällen | A01/A02; Google separat ausweisen |
| I01 | Lokalen reproduzierbaren MinIO-Bucket-/CRUD-Testpfad ergänzen | Eigenes Bucketfixture, Upload/Download/Delete, Cleanup, falsche Credentials klarer Fehler | Keine externen Buckets |
| I02 | Isolierten PostgreSQL-Backup→leereDB-Restore mit Seedfixtures prüfen | Schema/Inhalte/Constraints und Hash-/Anzahlvergleich; eigene Ressourcen bereinigt | Keine VPS-/Productiondaten; KC separat |
| I03 | Separater lokaler Keycloak-Realm-/Client-/Redirect-/Audiencetest | Reproduzierbarer Realmimport, echter Login/JWKS und getrennte Testnutzer | Keine Google-/Produktivsecrets |
| D01 | Entwürfe 001–005 erstellen und bewusste Produktabweichungen vorlegen | MVP/Nicht-MVP/Moderation/Personalisierung/System/ADRs nachvollziehbar, Produktfreigabe | Keine Änderungen bestehender Docs aus dem Auditauftrag; später separat autorisieren |

## Integrationsregeln

A01 und G02 müssen denselben Auth-/Bootstrapvertrag benutzen. N01 besitzt Schema/Claimregeln; N02 implementiert den Producer/Consumer dagegen. Y01/Y02 einigen sich vorab auf Ereignis-ID, Zieluser, öffentliche Nachricht, interne Notiz und Retrysemantik. Keine drei parallelen konkurrierenden Schemaänderungen.

W01 und W02 berühren getrennte Inhaltsblöcke und können unabhängig entstehen. Browser-/Mobiletests werden konkret pro Flow gefordert, nicht nachträglich aus grünen Helpertests abgeleitet. Externe Google-/OTS- und Stagingnachweise erhalten eigene später autorisierte Aufträge.

Ein Agentenpaket ist erst reviewbereit mit Codebeleg, positiven und relevanten negativen Tests, tatsächlicher Ausführung und ausdrücklich genannten Restgrenzen. Es darf nicht die ganze Aufgabe als DONE deklarieren, wenn die Matrix weiterhin ein fehlendes DoDkriterium ausweist.
