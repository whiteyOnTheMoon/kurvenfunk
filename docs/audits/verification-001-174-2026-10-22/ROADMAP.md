# Priorisierte Nachbesserungen für 001–174

Plan zur Freigabe, keine Umsetzung. Alle späteren Arbeiten starten vom dann aktuellen `develop`, mit eigenen Branches/Reviews; keine automatischen Merges oder Deployments. Bestehende offene Fix-PRs werden nach Review eingebunden, nicht nochmals parallel dupliziert.

| Reihenfolge | Konkrete Arbeit | Aufgaben / Befunde | Messbares Abnahmesignal |
|---|---|---|---|
| P0.1 | Production-Dependencies triagieren und kompatible Patches integrieren; offenen PR #10 prüfen | V05; übergreifend | Kein ungeklärter erreichbarer Critical/Highpfad; aktueller Auditgraph, Frozen-Install, Upload-/Editor-/Auth-/Buildregression. Registrymeldung von Erreichbarkeit unterscheiden. |
| P0.2 | ESM-E2E und echte isolierte APIbasis herstellen; PR #11 prüfen | 030/047, V04 | Reale Health/Ready/Auth-HTTPfälle laufen, keine Importmocks; fehlerhafte Assertion ergibt Exit ungleich 0; eigene Container bereinigt. |
| P0.3 | Alle Webtests automatisch erfassen; PR #12 prüfen | 047, V04 | Alle 50 plus neu hinzugefügte passende Testdatei automatisch erfasst; kontrollierter Fehler schlägt CI fehl. |
| P0.4 | Workerfixture typkorrekt machen, API/Web/Worker-`typecheck` tatsächlich an Turbo/CI anschließen | 047, neuer TS2741 | Uncached CIstyle-Typecheck führt nachweislich alle Apps aus; temporärer App-Typfehler wird erkannt. |
| P1.1 | Serverseitiges Onboardinggate | 102/107/162, V01 | Verifizierter incomplete Nutzer kann geschützte Communitymutation nicht ausführen; Me/Completion zulässig; nach Completion erlaubt; LIMITED/BANNED bleiben korrekt. |
| P1.2 | Tokenrefresh im Web | 097, V06 | Kurze Tokenlaufzeit im lokalen Keycloakbrowser: Refresh aktualisiert Context vor Mutation; parallele Refreshes dedupliziert; invalidierte Session reauthentifiziert. |
| P1.3 | Sichere Bildannahme, UUIDvalidation und Logredaction in getrennten Paketen | 035/040/088/139/140, V07 | Falsche Bildbytes/Pixelbomben abgelehnt; echtes erlaubtes Bild im lokalen Storage roundtrip; kaputte ID400; synthetische Secretwerte gelangen nicht in Logs. |
| P1.4 | Review→Draft-Vertrag festlegen, idempotent implementieren | 145/159/160/161, V03 | Freigegebener Record erzeugt genau einen nachvollziehbaren Draft; Reject erzeugt keinen; Retry/Parallelität erzeugt keinen zweiten Artikel; Publish bleibt eigener Permissionpfad. |
| P1.5 | 174 als schmalen vertikalen Yellow-Card-Slice implementieren | 075/078/079/174, V02 | Moderator kann Karte mit Pflichtdaten vergeben; Nichtberechtigte403; Persistenz/Audit/Notification atomar oder zuverlässig nachlieferbar; nur Empfänger liest Nachricht; echte DB-/API-/UItets. Keine pauschale Implementierung aller späteren Sanktionen. |
| P1.6 | Kritische vorhandene Mutationen auditieren; Revisionsakteur klären | 078/131/132/142/166 | Ein nachvollziehbarer Akteur-/Ziel-/Grund-/Request-ID-Nachweis pro Aktion; keine Doppelereignisse bei Retry; personenbezogene Daten minimiert. |
| P1.7 | Authbrowser-/SMTP-Testrealm und bestehende Fachintegration dauerhaft in CI | 093–108/131–143/162–171 | Registrierung→Verify→Login→Onboarding→Club/Neutral→Kommentar→Logout; echte DB/Redis/Storage; getrennte Kennzeichnung von FakeidP und realem Google. |
| P2.1 | Echte Inhaltsblöcke statt Mocks pro Seite/Block anschließen | 114/121–124 | Pro Block echte API oder ehrlicher Leer-/Fehlerzustand; kein stilles Ersatzresultat. Forum darf bis Implementierung als geplant dargestellt werden. |
| P2.2 | Fehlende Nickname-/Settings-/UIanforderungen schließen | 103/125–130 | Verbotene-Begriffe-Policy; reale Sessions/Notificationsteuerung im freigegebenen Scope; Browser/Mobile/Keyboard/Loading/Empty/Error nachgewiesen. |
| P2.3 | CI-Fachfixtures für Scheduler, Retry/DLQ, Matching, Dedupe-/Vote-/Cursorrennen und Redis-Ausfall | 143/146/150–157/160/167–171 | Echte Zeit-/Ausfall-/Parallelitätsszenarien mit isolierten Daten, deterministischer Assertion und Aufräumen; keine Infrastrukturmocktests als Ersatz. |
| P2.4 | Reproduzierbare lokale Infraabnahme vor separater Stagingfreigabe | 010–028/043–057/082/092 | Lokaler KC-/Meili-/MinIO-/Appcontainerstart, Restart/Persistenz, Testindex/CRUDstorage, kompletter Restore auf leerer Umgebung; keine Produktionsdaten. Danach gezielte Stagingnachweise separat autorisieren. |
| P2.5 | Produkt-/Architektur-/ADR-Dokumente und bewusste Planabweichungen freigeben | 001–005/072/167 | MVP/Nicht-MVP, LIKE-vs-Votes, Reviewpublikation, Moderationspolicy und Betriebsverantwortung schriftlich entschieden. Kein Feature als erledigt erklären, um fehlende Produktentscheidung zu verstecken. |

## Abhängigkeiten und Parallelität

P0.1 verändert Lockfile/Manifeste; Dependencyintegration durch einen Verantwortlichen. P0.2/P0.3 können fachlich unabhängig geprüft werden. P0.4 besitzt eigene Appskripte/Workerfixture, muss Manifeständerungen mit P0.1 abstimmen.

Servergate, Tokenrefresh, UUIDvalidation und Logredaction können bei klarer Dateiverantwortung unabhängig entstehen. Reviewübernahme und Claim-/Uniqueinvariante benötigen zuerst denselben Datenvertrag. Yellow-Card-Persistenz, Notificationevent und Auditereignis benötigen ebenfalls zuerst einen gemeinsamen Vertrag; danach können UI, Consumer und Tests getrennt entstehen.

Kein externer Google-/OTS-/VPSzugang blockiert die lokale Gatekorrektur, den Permissiontest, den Kartenservice oder die Fakepipeline. Er blockiert nur die entsprechende reale externe Abnahme. Sicherheits-/Dateninvarianten zuerst, danach Bedienung und Betriebsabnahme.

## Erforderliche Produktentscheidungen

1. LIKE laut Plan oder ausdrücklich freigegebene UPVOTE/DOWNVOTE-Abweichung?
2. Reviewfreigabe erzeugt Draft oder separaten Publishauftrag? Rechte/Lizenzen müssen erhalten bleiben.
3. Yellow Card: Pflichtgrund, sichtbare Usermessage versus interne Notiz, Inhaltsreferenz und Notificationvertrag. Drei-Gelb-Eskalation gehört anschließend zum eigenen Auftrag.
4. Welche Portalaktionen sind vor Onboardingcompletion erlaubt? Ausnahmen explizit dokumentieren.
5. Für Settings/Profil/MVP den tatsächlichen Umfang festlegen; geplante Folgefunktionen nicht als implementiert ausweisen.

Priorisierung P0 bedeutet hier vor externer Freigabe beziehungsweise vertrauenswürdigem CIgate, P1 vor Communitybeta, P2 vor jeweiliger Feature-/Betriebsabnahme. Sie ist keine Freigabe für einen Launch oder ein Deployment.
