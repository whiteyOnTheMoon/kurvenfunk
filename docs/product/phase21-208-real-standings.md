# Phase 21.208 – Echte Tabelle (DEV-only)

## Umsetzung
- Öffentliche `/tabelle`-Seite lädt ausschließlich `GET /api/v1/standings/austrian-bundesliga` mit dem tatsächlich im Spielplan/Seed verwendeten kanonischen Slug und `cache: 'no-store'`.
- Die bisherige fest hinterlegte 12er-Demotabelle (Mock-Vereine/Spiele/Punkte) wurde vollständig entfernt.
- Für fehlende aktive Saisonen, leere echte Tabellen und API-/Netzwerkfehler erscheinen verständliche, getrennte Leer- bzw. Fehlerzustände; niemals erfundene Punkte oder Platzierungen.
- Angezeigt werden die tatsächlich persistierten Positionen, Siege/Remis/Niederlagen, Tore/Tordifferenz, Punkte und ggf. Punkteabzüge. Persönlich favorisierte Vereine werden weiterhin ausschließlich anhand echter IDs/Slugs markiert.
- Zu Vereinsseiten führen reale Slugs; Logos stammen nur aus dem expliziten lokalen Asset-Inventar, für neue Vereine werden Initialen statt fehlender SVG-URLs verwendet.

## Korrekte Phasenwahl
- Die öffentliche `findCurrent`-Abfrage prüft bis zu 20 Phasen in absteigender Reihenfolge auf **vorhandene gespeicherte Tabellenzeilen**. Eine bereits angelegte, aber leere neuere Phase verdeckt nicht die reale Tabelle einer älteren Phase.
- Erst wenn sämtliche Phasen leer sind, werden saisonweite Tabellenzeilen mit `stageId=null` verwendet. Niemals werden verschiedene Phasen oder Wettbewerbe in einer Tabellenansicht zusammengeführt.
- Die Historien-/Admin-API aus 21.197 sowie die Berechnungsvorschau aus 21.198 bleiben unverändert. Eine Berechnung oder Veröffentlichung wird beim Seitenaufruf nicht angestoßen.

## Tests und Grenzen
- Unit-Regressionsfälle prüfen Phasenwahl und saisonweiten Fallback, Webtests das Fehlen synthetischer Inhalte und korrekte Fehler-/Leerzustände.
- Vor Merge alle PR-CI-Gates, danach DEV-Deployment und sicheren Branch-Cleanup kontrollieren.
- Kein Canonical-Write, keine Migration, keine Aktivierung externer Sports-Provider, kein STAGING/PROD. Der gesonderte echte Worker-/Redis-/PostgreSQL-Nachweis 21.201 bleibt offen.
