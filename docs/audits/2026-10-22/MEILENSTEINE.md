# Meilensteinübersicht – Masterplan v1.1

Basis: `develop` @ `cabf1477136e0a4c8951655a11cf122cd834617e`, 22.10.2026. Die Original-Abnahmekriterien bleiben maßgeblich. Diese Übersicht aktualisiert ausschließlich die Audit-Artefakte, nicht die bestehende Projektdokumentation.

| Meilenstein | Status | Nachgewiesener Bestand | Fehlende Abnahme / nächstes Gate | Aufgabenbezug |
|---|---|---|---|---|
| M1 Architecture Ready | PARTIAL | Monorepo, Stack, Compose-Trennung und Persistenzpfade vorhanden | MVP/Community/Personalisierungs-/Systemdokumente und ADRs fehlen; reale VPS-Struktur unbekannt | 001–014 |
| M2 Infrastructure Ready | PARTIAL | Lokale PostgreSQL/Redis-Dienste funktionieren; andere Services in Compose | Keycloak, Meilisearch, MinIO, Netz-/Persistenz-/Restarttests je Zielumgebung nicht vollständig bewiesen | 015–028, 043 |
| M3 Application Foundation Ready | PARTIAL | Web/API/Worker laufen lokal; Build, Queuejob, Request-ID und Readiness erfolgreich | Docker-/Shutdown-/Restart-DoD, vollständige Web-ID-Propagation, Diagnoseendpoint absichern | 029–042 |
| M4 Deployment Ready | PARTIAL | CI-/Deploy-/Backup-/Restore-Skripte, Timer und historischer Restorebericht | Kein aktueller DEV/STAGING-Deploy-/Restore-Nachweis; aktuelle Automation/Alarme unbekannt | 043–057 |
| M5 Core Backend Ready | PARTIAL | Umfangreiches Schema, 11 Migrationen, Seed, API-Grundlagen und zentrale Permissions | Paramvalidation/Auditspur/Integration unvollständig; Fachmodule teils leer; Stagingmigration nicht belegt | 058–092, 172–173 |
| M6 Authentication & Onboarding Ready | PARTIAL | JWT-Guard, User-Sync, Emailverified-Prüfung, Onboarding, Club/Neutral, Profil und Logoutanbindung | Echte Email/Google/Reset/Linking/Sessions nicht abgenommen; Tokenrefresh und Server-Onboardinggate fehlen | 093–108, 125–126, 265, 270 |
| M7 Personalization Ready | PARTIAL | Theme-/Kontrastlogik, Club/Neutral und Newsranking getestet | Startseite enthält Sport-/Diskussionsmocks; Browser-/Clubwechsel-/Mobileabnahme fehlt | 109–114, 123–124, 267, 282 |
| M8 Editorial Ready | PARTIAL | Article-CRUD, Tiptap, Kategorien/Tags, Medienmetadaten, Workflow, Revisions und Scheduling | Echter Storage-/Editor-/Publish-/Scheduled-Publishflow, Audits und Uploadhärtung fehlen | 131–143, 240, 256 |
| M9 News Automation Ready | PARTIAL | Fake/OTS-Adapter, Queues, Normalisierung, Dedupe, Matching, Confidence, Retry/DLQ, Review und Auto-Publish-Bausteine | Review endet beim Statuswechsel; kein echter Pipeline-/Idempotenz-/OTS-Abnahmetest | 144–161, 241, 268, 274 |
| M10 Community Ready | PARTIAL | Kommentare/Replies/Edit/Delete, Pagination, Votes und Kommentarreports mit Unit-/Helpertests | LIKE-Abweichung klären; echte Auth/DB/Browserflüsse, Moderationsweiterverarbeitung und Abuselimits fehlen | 162–171, 264, 270 |
| M11 Moderation Ready | PARTIAL | Rollen-/Statusguards und detaillierte Karten-/Sanktions-/IP-Datenmodelle | Kartenvergabe, Drei-Gelb→Rot, Direktrot, LIMITED setzen/ablaufen, HMAC/IP-Schutz, Revoke, Audit und Dashboard fehlen | 172–191, 266, 271 |
| M12 Football Data Ready | PARTIAL | Clubs/Matches/Results/Standings als Schema/Seed/öffentliche Lese-API und einige Seiten | Management, Tabellenberechnung, Sportsadapter/Import/Scheduler/Correction fehlen; Clubinhalte teils Mock | 192–208, 269, 304–306 |
| M13 Forum Ready | PARTIAL – nur Struktur/Modell | Forum/Thread/Post/Subscription/ReadState-Modell und leere Module | Keine vollständige Forum-API, UI, Readtracking-, Abo- oder Moderationsfunktion | 209–223 |
| M14 Platform Ready | PARTIAL – überwiegend Grundlagen | Notificationmodelle, Queue-Namen, Meilisearch-Compose, Adminnavigation und technische Logs | Notificationversand/-UI, Suche/Reindex, echter Admin, Cache, Dashboards und Alarme fehlen | 224–245, 258, 272–278 |
| M15 Launch Ready | BLOCKED | Lokaler Codeaudit, Unit-/Buildprüfungen und historischer Restorebericht | Security-/Privacybefunde, Rechtsdokumente, echte E2E, Accessibility, Lasttest, aktueller Restore und Beta nicht abgeschlossen | 246–302, 309–314 |
| M16 KURVENFUNK LIVE | UNKNOWN | Kein zulässiger Live-Betriebsnachweis erhoben | Öffentliche Erreichbarkeit/Stabilität nicht geprüft; nach Code fehlen zentrale Produktfunktionen. Ein technisch erreichbarer Host allein würde M16 nicht erfüllen | 315–334 |

**Wichtig:** PARTIAL bei M11/M13/M14 bedeutet nicht, dass bereits ein nutzbares Moderations-/Forum-/Plattformsystem existiert. Der Umfang ist pro Zeile ausdrücklich eingeschränkt. UNKNOWN bei M16 behauptet weder einen erfolgten noch einen ausgebliebenen Launch. Produktionszugriffe waren ausgeschlossen.

Keine Zahl der abgeschlossenen Einzelaufgaben wird auf eine Meilenstein-Prozentquote umgerechnet: Aufwand und Risiken der Aufgaben unterscheiden sich erheblich. Die Reihenfolge der nächsten Gates steht in [ROADMAP.md](ROADMAP.md).
