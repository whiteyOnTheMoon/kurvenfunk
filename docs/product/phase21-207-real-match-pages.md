# Phase 21.207 – Echte Spielseiten (DEV-only)

## Implementierung
- `/spiele` verwendet nur noch die kanonische öffentliche `GET /api/v1/matches?competition=…`-Antwort; vorhandene Mock-Spielpläne und synthetische UUID-Links entfallen.
- Ein Wettbewerb ohne aktive Saison (HTTP 404) erhält einen neutralen Leerzustand. Bei API-/Netzwerkfehlern werden keine Spiele, Resultate oder Tabellenstände erfunden.
- `/spiele/[id]` lädt weiterhin ausschließlich den tatsächlichen Matchdatensatz von `GET /api/v1/matches/:id`, mit serverseitigem 404 und unverändertem `no-store`. Titel/Beschreibung verwenden tatsächliche Heim-/Auswärtsvereine.
- Spielstatus werden korrekt unterschieden: LIVE ist **Spielstand**, FINISHED **Endstand**, Verschiebung/Absage ohne Ergebnis keine scheinbare Anstoßzeit. Uhrzeiten sind in `Europe/Vienna`.
- Bekannte mitgelieferte Vereinslogos werden verwendet; bei unbekannten Slugs erscheinen Initialen statt nicht vorhandener SVG-Dateien.
- Nachrichten auf Spielseiten sind bereits veröffentlicht, nicht gelöscht und **tatsächlich publiziert** (`publishedAt <= now`); geplante zukünftige Meldungen sind nicht sichtbar.
- Community ist weiterhin nur als offen gekennzeichneter Platzhalter vorhanden; es werden keine Diskussionen simuliert.

## Nachweise und Grenzen
- API-Unit-Regression für den Veröffentlichungsfilter und Web-Regressionstest für fehlende Mock-Spiele, echte Links und Statusinformationen.
- Format, Lint, TS, Tests und Build sowie bestehende isolierte API-E2E über PR-CI prüfen; danach DEV-Deployment und sicheren Branch-Cleanup prüfen.
- Es wird **kein** externer Sports-Provider aktiviert und kein Canonical-Write oder Migrationsschritt ausgeführt. 21.201 Redis/PostgreSQL-Worker-Endabnahme bleibt gesondert offen; STAGING/PROD unverändert.
