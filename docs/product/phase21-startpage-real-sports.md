# Phase 21 – Startseite ohne Sport-Mockdaten

Die öffentliche und personalisierte Startseite zeigte trotz 21.207/208
weiterhin feste Demo-Spiele, einen falschen Platz 1 mit 9 Punkten, die
gleiche Top-6-Tabelle für alle Besucher und erfundene Diskussionszahlen.

Sie lädt jetzt zusätzlich zu echten Artikeln die kanonischen öffentlichen
Endpunkte `/matches?competition=austrian-bundesliga` und
`/standings/austrian-bundesliga`. Es werden ausschließlich tatsächliche
API-Vereine und -Spiel-IDs verlinkt. Vereinsspezifische nächste/letzte Spiele
und Tabellenpositionen leiten sich nur aus echten Antworten ab.
Ohne bestätigte Daten werden lesbare Leerzustände dargestellt.

Die synthetische Startseiten-Datendatei und die bislang nicht durch eine
Community-API gedeckten erfundenen Diskussionszähler entfallen.
Kein zusätzlicher Import/Write, keine STAGING-/PROD-Änderung.
