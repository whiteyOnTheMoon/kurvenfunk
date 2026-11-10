# Vollständigkeitsprüfung Phase 0–21 – aktueller Nachweisstand (10.11.2026)

> **Kein pauschales DONE.** Diese Prüfung unterscheidet Implementierung, automatisierte Tests, reale DEV-Abnahme, STAGING-/PROD-Abnahme und Datenhygiene. Ein grüner Build oder früheres TODO in einem historischen Snapshot ist für sich allein weder Fehlerbeleg noch Abschlussnachweis.

## Umfang

Der Masterplan unter `docs/audits/verification-001-174-2026-10-22/masterplan.txt` beginnt mit **Phase 01**; eine gesonderte Aufgabenphase 00 ist darin nicht definiert. Phase 01–21 entsprechen **Tasks 001–208**. Phase 22 startet mit Task 209.

Der letzte vollständige unabhängige Einzelaudit für **001–174** datiert vom **22.10.2026** ([Statusmatrix](../verification-001-174-2026-10-22/STATUSMATRIX.md)): 42 DONE, 124 PARTIAL, 6 TODO, 2 UNKNOWN. **Dieser Stand ist historisch, keine aktuelle Quote.** Nachfolgende PRs haben viele Befunde nachweisbar korrigiert. Der Index [PRE_PHASE20_STATUS.md](../2026-11-04/PRE_PHASE20_STATUS.md) vom 04.11.2026 stellt ausdrücklich klar, dass keine frische vollständige Einzelabnahme 001–171 vorliegt.

## Prüffelder und derzeitige Grenzen

| Phase / Tasks | Nachweis | Offenes Abnahmegate / Risiko |
| --- | --- | --- |
| 01 / 001–005 | Produkt-, Architektur- und ADR-Dateien sind mittlerweile im Repo vorhanden. | Fachliche Freigabe und Gegenprüfung aller Masterplananforderungen sind nicht dokumentiert. |
| 02 / 006–009 | Monorepo, Workspace, Config-Package, CI und Builds vorhanden. | Aktuellen CI-Lauf verwenden, nicht alte Testzahlen. |
| 03–04 / 010–028 | DEV/STAGING/PROD-Overlays; PostgreSQL, Redis, Keycloak, Meilisearch, MinIO konfiguriert. | Host-/Secret-Isolation, Persistenz, Restart, Staging/Prod-Runtime und echter externer Betrieb wurden nicht vollständig einzeln abgenommen. |
| 05–08 / 029–051 | Web/API/Worker/Shared-Pakete; echte HTTP-E2E und Docker-Worker-Gates; erfolgreicher DEV-Deploy; Rollbackscript vorhanden. | Vollständiger Browser-/Mobile-/Staging-Release-, Alerting- und Rollbackdrill nicht allein durch CI bewiesen. |
| 09 / 052–057 | Backupscripts, Rotation, Restoreanleitung; Phase-21-Cleanup erzeugte private, via `pg_restore` verifizierte DEV-PostgreSQL-Backups. | Vollständiger isolierter End-to-End-Restore aus aktuellen PostgreSQL-, Keycloak- und Object-Storage-Backups samt RPO/RTO nicht nachgewiesen. |
| 10–11 / 058–092 | DB-Modelle, Migrationen, API, Validation und HTTP-Tests vorhanden. | Teilweise alte Vertragsabweichungen nur anhand aktueller API-/UI-Checks schließen (z. B. LIKE-Reactions vs. Up/Downvote). |
| 12–16 / 093–130 | Echtes DEV-Keycloak, Onboarding, Personalisierung, UI und responsive Anpassungen durch PRs abgesichert. | Noch keine durchgängige aktuelle Gesamtprüfung von Login/Verknüpfung, Browser/Mobile/Accessibility und Staging. |
| 17–19 / 131–171 | Redaktion, Medien, Newsimport, Community mit gezielten HTTP-/MinIO-/Browser-/Race-/DLQ-Checks ergänzt (PRs #30–#75). | End-to-End-Abnahme über alle im Masterplan geforderten Fälle und Staging noch nicht als Gesamtabschluss ausgewiesen; echte Providerrechte/licensing gesondert. |
| 20 / 172–191 | Gezielte PRs #24–#106 für Karten, Sanktionen, IP-Schutz, Appeal, Dashboard, Keycloak-Revoke, Retry und Worker; mehrere echte DEV- und isolierte Tests. | Insbesondere Browser-/Mobile-Rollenflows, operative Wiederanläufe und jede Task einzeln gegenüber Masterplan erneut prüfen. Alte parallele Draft-PRs #25/#28/#29 nicht blind mergen. |
| 21 / 192–208 | Implementierung PRs #107–#123; Fake-Sports-Testadapter nur in CI, reale 21.201-PostgreSQL/Redis-Worker-E2E; echte Seiten/Tabellen und bereinigte Startseite. DEV-Cleanup #42878255312 und #42880665500 erfolgreich. | Echte externe Sportdatenquelle noch nicht angebunden; STAGING-/PROD-Datenhygiene und Gesamt-Browserabnahme nicht bewiesen. |

## Datenhygiene / letzter gesicherter Stand

Die erfolgreiche [DEV-Aktion #42880665500](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42880665500) belegte 0 alte künstliche Match-Fingerprints, 0 Standings in den Seed-Saisons und 0 `fake-sports`-Provider/Importe. Sie belegte aber auch:

- **Zwei archivierte alte Seed-Artikel:** einer mit 29 Kommentaren. ARCHIVED bedeutet *nicht aus der Datenbank entfernt*. Der Kommentarbestand darf nicht blind gelöscht oder einem falschen echten Artikel zugewiesen werden.
- **Drei Seed-Anwendungsnutzer:** `seed-neutral-user`, `seed-rapid-user`, `seed-editor-user`; Keycloak-Gegenprüfung, Rechtsbeziehungen und abhängige Inhalte vorher prüfen.
- **Acht bekannte ursprüngliche Vereinsidentitäten:** alle mit Referenzen. Das sind echte Vereinsnamen und dürfen nicht als Fake-Clubs pauschal gelöscht werden.
- Weitere Test-/Demo-/Mockdatensätze **außerhalb der bekannten Sport-Seeds** sind mit dem früheren Sport-Check allein nicht ausgeschlossen; ebenso wenig STAGING und PROD.

Die neue schreibgeschützte, strikt auf DEV begrenzte Inventur in `infrastructure/scripts/verify/dev-phase0-21-data-audit.mjs` zählt **alle wesentlichen Fachmodule**, markierte Demo-/Test-Slugs, bekannte Test-Subjects und sämtliche ausgewiesenen Seed-Nutzerbeziehungen. Sie gibt keine echten IDs, E-Mails, Kommentartexte oder Tokens aus und mutiert keine Daten. Aufruf nur nach grünem PR-CI, DEV-Deployment und exakter Commit-Prüfung mit `[phase0-21-dev-readonly-audit]`.

## Freigabekriterien

**Phase 0–21 vollständig** erst nach aktueller Einzelprüfung aller 208 Anforderungen und zugehörigen Betriebs-/Browser-/STAGING-Nachweisen. **Keine Testdaten** erst nach dokumentierter Herkunfts- und Referenzprüfung in sämtlichen betroffenen Umgebungen, verifiziertem Backup, gezielten nachvollziehbaren Bereinigungsvorgängen und erneutem read-only Nachinventar mit 0 verbliebenen bestätigten synthetischen Inhalten/Konten.

Regressionstest-Fixtures im Repository bleiben **test-only**; sie dürfen nicht in echte Anwendungsdatenbanken importiert werden. Synthetische CI-Container werden nach Tests verworfen. Bereits archivierte Artikel, echter redaktioneller Content und echte Vereins- bzw. Nutzerbeziehungen werden nicht mit blanket DELETE entfernt.
