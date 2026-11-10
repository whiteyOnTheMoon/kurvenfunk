# Phase 21.206 – Echte Vereinsseiten (Club Detail)

## Umsetzung

Die öffentliche Server-Route `/vereine/[slug]` verwendet nicht mehr
`getClubPageMockData`. Sie lädt ausschließlich
`GET /api/v1/clubs/:slug/overview`. Inaktive oder unbekannte Slugs ergeben
**404**, Backendfehler werden nicht durch erfundene Ersatz-News verdeckt.
Titel und Beschreibung werden aus dem kanonischen Vereinsnamen erzeugt.

Der Read-only-Endpunkt bezieht die Stammdaten aus dem vorhandenen
`ClubsService.findActiveBySlug` und lädt ausschließlich kanonisch
gespeicherte Inhalte (nicht `RawPayload`, `ImportRecord` oder
`EntityMatch`). Damit werden unverifizierte Importdaten nicht öffentlich.

- **News:** Maximal sechs tatsächlich veröffentlichte und nicht gelöschte
  Artikel, deren Veröffentlichungszeitpunkt bereits erreicht ist, und die
  explizit mit dem Verein oder einem seiner Spiele verknüpft sind. Titel
  führen zu `/artikel/[slug]`, alle News zur Vereinsfilter-Ansicht.
- **Spiele:** Maximal sechs kommende, sechs abgeschlossene und drei laufende
  kanonische Spiele für aktive Saisonen/Wettbewerbe mit sortierten Anstoßzeiten,
  realen Spielständen und Links auf `/spiele/[id]`. Ergebnisse werden nicht
  beim Laden berechnet oder mutiert. Uhrzeiten in `Europe/Vienna`.
- **Tabelle:** Nur die ausgewählte reale Tabellenzeile des Vereins aus einer
  aktiven Saison und ihrem aktiven Wettbewerb. Maximal 30 Tabellenzeilen
  **derselben Wettbewerb/Saison/Phase-Kombination**, sodass keine Phasen oder
  Wettbewerbe vermischt werden. Der betroffene Verein wird markiert.
- **Community:** Tatsächlich existierende aktive Vereinsforen und ihre
  nicht zusammengeführten, offenen/gesperrten Threads. Da öffentlich
  navigierbare Forumseiten noch nicht freigegeben sind, gibt es hier noch
  keine künstlich erzeugten Threadlinks.
- **Logo:** Bevorzugt vorhandenes Media-Objekt über öffentliche
  `/api/v1/media/:id/content`-Route oder eine geprüfte HTTP(S)-Bild-URL.
  Für vorhandene lokale Assets ist ein expliziter Fallback möglich;
  unbekannte Logos werden durch Initialen statt einen gebrochenen Link
  ersetzt. Private Storage-Keys tauchen nie in Bild-URLs auf.

Alle Abschnitte zeigen neutrale, datengestützte Leerzustände, wenn Daten
nicht vorhanden sind. Die bislang generierten Demo-News, Tabellenstände,
Ansetzungen und Diskussionen für Vereinsseiten wurden entfernt.

## Datenschutz und Sicherheitsgrenzen

Der öffentliche Endpunkt enthält keine redaktionellen Entwürfe,
unveröffentlichte Beiträge, interne Nutzerprofile, Import-Entscheidungen
oder Admin-/Korrekturinformationen. Nur aktive Vereinsidentitäten sind
abrufbar. Die Abfragen sind begrenzt und erfolgen nur lesend. Es werden
keine Tabellen-, Match- oder Artikelinformationen verändert.

Das bestehende Vereins-Stammdaten-API bleibt kompatibel; es erhält für
verknüpfte Bilder zusätzlich die Media-ID. Die neue Read-only-Aggregation
wurde bewusst als separater Endpunkt realisiert, damit bestehende
`GET /clubs`- und `GET /clubs/:slug`-Clients unverändert arbeiten können.

## Abnahme

- API: Tests für 404-/Aktiv-Gate, veröffentlichte News, begrenzte
  aktuelle Spiele, eindeutigen Tabellen-Kontext, reale Community-Threads
  und fehlende Daten.
- Web: Node-Tests zur sicheren Logo-/Asset-Auswahl und Speicherung von
  Storage-Keys; vollständige Next/Typecheck-/ESLint-/Format-CI.
- Nach Merge: DEV-Deployment, bestehende read-only Acceptance und
  sichere Branch-Bereinigung.
- Reale Daten erscheinen nur, sofern kanonische Vereins-/Spiel-/Artikel-/
  Tabellen-/Forumdatensätze existieren. Es werden **keine synthetischen
  Produktionsdaten** erzeugt.

Der unabhängig offene Ende-zu-Ende-Importnachweis aus **21.201**
(Redis/PostgreSQL mit bewusst angestoßenem Sports-Job) bleibt offen.
Keine STAGING-/PROD-Änderungen.
