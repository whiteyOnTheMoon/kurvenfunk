# Phase 21 – Sportdaten: technischer Abschluss / DEV-Abnahme (10.11.2026)

## Scope und Quellstand

Die historische Masterplan-Fassung unter `docs/audits/verification-001-174-2026-10-22/masterplan.txt` definiert **Phase 21 als Tasks 192–208**. Task **209 ist bereits Phase 22 (Forum)**. Diese historische, auditierte Vorlage ist kein Live-Status-Tracker und ihre alten TODO-Zeilen werden nicht nachträglich verändert.

Alle 17 Implementierungspunkte **21.192–21.208** sind mit PRs [#107–#123](https://github.com/whiteyOnTheMoon/kurvenfunk/pulls?q=is%3Apr+is%3Amerged+base%3Adevelop+phase21) in `develop` integriert. Zusätzliche, getrennt abgesicherte Schritte:

- [#124](https://github.com/whiteyOnTheMoon/kurvenfunk/pull/124): Alte Prisma-Sports-Seeds entfernen, synthetische Import-Scheduler auf DEV abschalten; FakeSportsProvider bleibt nur Testadapter.
- [#125](https://github.com/whiteyOnTheMoon/kurvenfunk/pull/125): Realer 21.201-BullMQ-Worker mit isoliertem PostgreSQL/Redis, Idempotenz, Retry/Dead Letter und **null** kanonischen Schreibzugriffen.
- [#126](https://github.com/whiteyOnTheMoon/kurvenfunk/pull/126): Erfundenen Startseiten-Spielplan, Tabellenstand und Diskussionszähler entfernen; reale read-only API und ehrliche Leerzustände.
- [#127–#129](https://github.com/whiteyOnTheMoon/kurvenfunk/pull/129): DEV-Bestandsaufnahme, geschützte Referenzen und Transaktions-/Backup-gesicherte Bereinigung.
- [#130](https://github.com/whiteyOnTheMoon/kurvenfunk/pull/130): Fehlgeschlagenen Stale-Head-Cleanup-Lauf ohne gelockerte Sicherheitsprüfungen auf aktuellem SHA wiederholen.
- [#132](https://github.com/whiteyOnTheMoon/kurvenfunk/pull/132): Letzten Seed-Spielrest entfernen; nachbearbeiteten, aber seed-eigenen Artikel **reversibel archivieren**.

## Bestätigte DEV-Abnahme

- **PR-CI für #132:** [#42879972942](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42879972942), alle erforderlichen Tests erfolgreich, einschließlich Build, realem 21.201 Redis/PostgreSQL/Worker, isolierter API HTTP E2E und Worker-Docker-Build.
- **DEV-Push/Deployment/Cleanup nach #130:** [#42878255312](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42878255312) erfolgreich. Vor jedem Delete wurde ein privates PostgreSQL-Backup erstellt und mit `pg_restore` lesend geprüft. 16 sicher bestätigte Seed-Artikel, acht künstliche Spiele und 18 unbenutzte Seed-Clubs entfernt, ein Seed-Artikel mit 29 echten Kommentaren archiviert, eine falsche Spielverknüpfung echter Redaktion entfernt.
- **Finaler DEV-Push/Deployment/Cleanup nach #132:** [#42880665500](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42880665500), Commit `8172caf4a2b1d72e7ab700c215560822bb3c0698`: **SUCCESS** für CI, DEV-Deployment, Branch-Prune und den eigens geschützten DEV-Seed-Cleanup. Zweites privates Backup mit `pg_restore` bestätigt; ein weiterer nachweislich künstlicher Spiel-Datensatz entfernt, letzter nachbearbeiteter Seed-Artikel reversibel archiviert, zwei weitere vollständig unreferenzierte Seed-Club-Datensätze entfernt.

**Finales read-only DEV-Nachinventar nach #42880665500:**

| Kennzahl | Bestätigter Wert |
| --- | ---: |
| Ursprüngliche Seed-Spiel-Fingerprints in DEV | **0** |
| Weitere Spiele in den betroffenen Seed-Saisons | **0** |
| Tabellenzeilen in diesen Seed-Saisons | **0** |
| Synthetische Sport-Provider / ImportJobs / ImportRecords / RawPayloads / EntityMatches | **0** |
| Verbliebene ursprüngliche Seed-Club-Identitäten | **8, alle referenziert** |
| Seed-Artikel | **2, beide ARCHIVED und ohne Spielverknüpfung** |
| Seed-Nutzeridentitäten | **3, bewusst nicht gelöscht** |

Die acht Vereinsidentitäten repräsentieren echte Vereine und werden von redaktionellem Material oder Nutzervorlieben verwendet; sie sind **keine erfundenen Clubs**. Der archivierte Seed-Artikel mit 29 Kommentaren bewahrt die Diskussionsdaten. Die drei synthetischen Nutzer erfordern eine **separate Identitäts- und Keycloak-Prüfung**; sie dürfen nicht durch eine pauschale Sportdaten-Migration entfernt werden.

## Abschluss / Grenzen

**Phase 21 (192–208): Code und abgesicherte DEV-Sportdatenbereinigung abgenommen.** Keine erfundenen Spiele, Tabellenwerte oder veröffentlichten Seed-Sportartikel im bestätigten DEV-Nachinventar. Ein echter externer Sportdatenanbieter ist nicht automatisch durch diesen Abschluss angeschlossen; ohne reale Daten zeigen die öffentlichen Seiten korrekte Leerzustände. Keine Behauptung eines STAGING- oder PROD-Deployments oder einer Bereinigung dort.

Der DEV-Cleanup läuft nur nach erfolgreicher Prüfung und DEV-Deploy mit exaktem Git-SHA, explizitem Trigger, privatem verifiziertem Backup, gegenseitigen Locks, strikten Provenienz-Fingerprints und serialisierbarer Transaktion. Weitere irreversible Löschungen oder Account-/Keycloak-Eingriffe sind **nicht** Bestandteil dieser Phase-21-Abnahme.
