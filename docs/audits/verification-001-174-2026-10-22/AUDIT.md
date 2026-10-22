# Kurvenfunk – Development Verification Audit 001–174

**Ergebnisse zur Freigabe.** Die Aussage „001 bis einschließlich 174 sind vollständig umgesetzt“ ist am geprüften `develop`-Stand nicht haltbar. Es existiert ein umfangreicher, lokal in wesentlichen Teilpfaden funktionierender Entwicklungsstand. Mehrere Anforderungen fehlen als ausführbares Verhalten, andere besitzen nachvollziehbaren Code, aber nicht die vollständige Abnahme nach Masterplan.

Geprüfter Branch: **develop**. Commit: **17693e9ca3e51d8b13161be90a47a7d3491ad164**. Datum: **22.10.2026 UTC**. Arbeitsbaum zu Beginn und Ende sauber. Keine Anwendungscode- oder bestehenden Dokumentationsänderungen, keine Commits/PRs, keine Deployments, keine Produktionszugriffe. Alle neuen Berichte und Audit-Harnessdateien liegen außerhalb des Repositorys.

## Ergebnis für alle 174 Aufgaben

| Status | Anzahl | Bedeutung in diesem Audit |
|---|---:|---|
| DONE | 42 | Konkreter enger Aufgabenscope erfüllt und nachgewiesen; überwiegend Modelle, Grundlagen, Verträge und Standards |
| PARTIAL | 124 | Ausführbare Teilfunktion oder vorbereitete Konfiguration vorhanden; Funktions- und Nachweislücken getrennt dokumentiert |
| TODO | 6 | 001–005 Produkt-/Architekturdokumentation und 174 Kartenvergabe ohne ausführbaren Featureanteil |
| BLOCKED | 0 | Keine komplette Aufgabe allein wegen externer Abhängigkeit als blockiert eingestuft; lokale Teilprüfung/Implementierung bleibt möglich |
| UNKNOWN | 2 | 012 tatsächliche VPS-Persistenzstruktur und 057 unabhängig bestätigter aktueller Restore |

Die [vollständige Statusmatrix](STATUSMATRIX.md) enthält **jede ID 001–174 genau einmal**, den Originalwortlaut, aktuelle Dateibelege mit Zeilen, vorhandene/ausgeführte Tests, zusätzliche Integrationsproben und den Vergleich zum alten Status. Maschinenlesbar: [CSV](statusmatrix.csv), [JSON](statusmatrix.json). Die Summen sind keine gewichtete Fertigstellungsquote.

**DONE eines Modells ist kein fertiges Produktfeature.** Das Kartenmodell 075 kann seinen Modellauftrag erfüllen, während Kartenvergabe 174 fehlt. Der Auftrag 084 verlangt ausdrücklich nur angelegte Module und erlaubt leere Module; daraus darf kein fertiges Moderationssystem abgeleitet werden. Bei vertikalen Features berücksichtigt PARTIAL auch fehlende Mobile-/Stagingabnahme. Dies wird in einer eigenen Spalte von fehlender Funktion unterschieden; fehlender Beweis wird nicht automatisch als fehlender Code ausgegeben.

## Quellen, Unabhängigkeit und Definition of Done

Anforderungsquelle ist der vollständige Master Project Plan v1.1 einschließlich Architektur, Core Rules, 334 Aufgaben, Entwicklungsreihenfolge, DoD und 16 Meilensteinen. PDF-SHA256: `29da557115852ff771b776243b2ea97f69710dfbf59f3bb493c35bae0a2a3b32`. Originalaufgaben 001–174 wurden erneut gelesen und einzeln bewertet. [Masterplan-Volltext](masterplan.txt) und [Aufgabenquelle](tasks.json) sind separat beigefügt.

Die eingebetteten Statusmarker „✅ TODO“ sind Dokumentinhalt, kein Implementierungsbeweis. Handlungsanweisungen im PDF, etwa Deployments, werden als Produktanforderung und **nicht** als Berechtigung zu Infrastrukturänderungen verstanden. Maßgeblich für die zulässigen Aktionen ist der aktuelle Auditauftrag.

Die alten sechs Auditdateien unter `docs/audits/2026-10-22/` wurden zum Vergleich herangezogen. Ihre Statuswerte sind keine Bewertungsgrundlage. Die neuen Beurteilungen stehen in einem separat verfassten Assessment; das alte Dateiinventar diente als Suchindex und wurde am aktuellen Commit überprüft. [Evidence-Manifest](evidence-manifest.json) dokumentiert 344 Belegdateien mit SHA256 und Zeilenzahl. Neue Prüfläufe stammen ausschließlich aus `develop`, nicht aus offenen Fixbranches. Details aller Abweichungen: [VERGLEICH.md](VERGLEICH.md).

Feature-DoD verlangt neben Datenmodell/Schema/Migration Backend, Validation, Permissions und Statusbehandlung, Fehlerfälle, Logging/Audit wo relevant, Tests, Frontend mit Loading/Empty/Error, **Mobile- und Stagingtest** sowie Dokumentation. Infrastruktur-DoD verlangt außerdem Einzelstart/-restart, funktionierende Healthchecks/Persistenz, Trennung/Secrets/Netzzugriff sowie Backup/Restore. Das kann weder ein grüner Build noch ein gemockter Servicetest ersetzen. Für reine Modell-, Typ-, Parser- oder Dokumentaufgaben werden nicht sachfremd sämtliche UI-/Launchanforderungen erfunden.

## Was lokal nachweislich funktioniert

Die folgenden Bereiche besitzen echte lokale Funktionsnachweise. Das ist eine Aussage über den geprüften Slice, keine pauschale vollständige Featureabnahme:

- Monorepo/Frozen-Install, Prisma-Generation, gültiges Schema und **elf Migrationen auf leerem PostgreSQL**. Seed erzeugt 28 Clubs, 90 Aliases, drei Testuser, 18 Artikel und neun Spiele neben Wettbewerben/Saisons/Stages.
- API-Health/Readiness mit realem PostgreSQL und Redis. Echte JWTprüfung über lokalen JWKSserver: Signatur, RS256, Issuer, Audience und Ablauf; fehlende/unverifizierte/ungültige Tokens werden abgelehnt.
- Subjectbasierter User-Sync, Neutral-Onboarding, case-insensitiver Nicknamekonflikt und Änderung CLUB→NEUTRAL mit real persistierten Daten.
- Kommentare erstellen, antworten, eigene Kommentare bearbeiten samt Revision, fremde Edits ablehnen, softlöschen, Reports speichern und Doppelreports ablehnen. Drei Sortierungen und mehrseitige Cursor laufen gegen echtes PostgreSQL.
- LIMITED wird beim Kommentieren abgewiesen und darf einen fremden Kommentar votieren; BANNED wird zentral abgewiesen. Eigene Votes werden zusätzlich fachlich abgelehnt, nicht fälschlich als Statusdefekt gewertet.
- Redis-Lua weist unmittelbare Duplikate und zu schnelle Folgeposts zurück.
- Redaktioneller HTTP-Durchlauf mit Erstellen/Ändern, Beziehungen/SEO, Revision, Review/Publish, öffentlichem Lesen, Archivieren, Löschen und Wiederherstellen.
- Echte BullMQ→Worker→DB-Fakeimportpipeline: fünf Rawrecords, ein neuer Artikel und vier Reviewrecords. Beim zweiten Lauf fünf zusätzliche Duplikaterkennungen. Ein fälliger geplanter Artikel wird vom realen Publishingservice genau einmal veröffentlicht.
- Alle vorhandenen 50 Webhelpertests bestehen bei vollständiger Auswahl; Theme-/Commenthelper haben damit technische Nachweise. Interaktive UIbedienung ist dadurch nicht nachgewiesen.

[PRUEFUNGEN.md](PRUEFUNGEN.md) beschreibt Kommandos, Logs, Fixtures und Grenzen. **699 Repositorytests bestehen.** Hinzu kommen 20 externe Prüfgruppen: 17 positive Funktions-/Negativschutzgruppen und drei erfolgreiche **Defektreproduktionen**. API-E2E bleibt kaputt, und der unabhängige Worker-Typecheck scheitert. Daher sind die Gesamtgates nicht vollständig grün.

## Konkrete unvollständige Anforderungen und Risiken

### V01 – Server-Onboardinggate fehlt: real bestätigt, P1 / hoch

Bei einem frisch synchronisierten ACTIVE-User mit `onboardingCompleted=false` liefert Kommentar-POST **201** und speichert Daten. Der Clientgate leitet zwar um, aber Auth/Permissions blockieren die direkte Mutation nicht. Der Test setzt keine Guardmocks ein. Damit ist 102 funktional unvollständig; 162 erbt die Integrationslücke. Erforderlich: serverseitige Completionpolicy mit expliziten Ausnahmen für Me/Onboarding/Clubliste und echte negative/positive HTTPtests.

Belege: `apps/api/src/modules/auth/auth.guard.ts`, `apps/api/src/modules/permissions/permissions.service.ts`, `apps/web/src/features/onboarding/onboarding-gate.tsx`; I04.

### V02 – 174 Yellow Card erstellen ist TODO: P1 / hoch

Gefordert: Moderator vergibt gelbe Karte, Grund/interne Notiz/Inhaltsbezug/Moderator/Zeit werden gespeichert, User erhält Notification. Tatsächlich vorhanden: `ModerationCard` samt passenden Feldern, `user.warn` als Permissionname, leeres Moderation-/Notificationsmodul und Adminplatzhalter. Nicht vorhanden: Service/Controller zur Vergabe, autorisierte UIaktion, realer Persistenz-/Audit-/Benachrichtigungsfluss und Tests.

Die repoübergreifende Quellsuche findet keine produktiven `moderationCard`-Writepfade und keine Notification-/Auditwrites. Das ist nicht bloß fehlende Testabdeckung. 075 erfüllt den Datenmodellauftrag, **174 ist nicht implementiert**. Weitergehende Drei-Gelb→Rot-, Ablauf- und Revokeaufträge liegen jenseits 174 und sind ebenfalls keine durch dieses Modell bewiesene Funktion.

### V03 – Importreview erzeugt keinen Artikel: real + statisch bestätigt, P1 / hoch

Im realen Fakeimport landen vier Records in REVIEW_REQUIRED. `ImportsService.approveReview` speichert MATCHED/APPROVED samt Reviewer/Zeit. Die Artikelanzahl bleibt unverändert. Quellprüfung findet keinen Folgejob/Consumer zur redaktionellen Übernahme; der ursprüngliche Processor publiziert nur ohne Review unmittelbar im Importlauf. OTS ist untrusted und wird durch AutoPublish absichtlich übersprungen. Ohne Übernahmeweg ist die redaktionelle Automatisierung unvollständig (145/159/161).

Erforderlich: fachlich festgelegter Review→Draft- oder Review→Publikationsauftrag mit Idempotenz, Permission, Quellen-/Lizenzmetadaten und Retry. Paralleles Publish besitzt derzeit keinen nachgewiesenen exklusiven Recordclaim; ein Doppelpublish wurde **nicht** reproduziert und bleibt separates Risiko (151/160).

### V04 – Test- und CIgates sind unvollständig: P0 für Freigabevertrauen

- API-E2E scheitert am ESMexport aus dem Workspace, **0 Tests**. Die alte Hello-World-Assertion und die vom Mainbootstrap abweichende E2E-App sind zusätzlich fachlich unbrauchbar.
- Reguläres Webskript wählt 28 von 50 vorhandenen Tests aus. Pagination-/Reportclienttests werden damit nicht automatisch berücksichtigt.
- `turbo typecheck` prüft nur fünf Shared Packages. Separates `tsc --noEmit` des Workers scheitert in `raw-payload.service.spec.ts:16`, weil die NewsProviderfixture `trustedForAutoPublish` nicht enthält. API/Web-tsc bestehen; die fehlende App-Taskanbindung verdeckt den Workerfehler im CIgate.
- Vorhandene Tests mit „integration“ im Namen mocken teils JWT/DB und ersetzen keine Infrastruktur-/Browserabnahme. Das externe Auditharness ist noch keine regelmäßig laufende Projektsuite.

Erforderlich: ESM-E2E-Runner, vollständige Webdiscovery, explizite App-Typechecks, Fixturekorrektur und isolierte Fachintegration in CI. Offene PRs #11/#12 sind keine bereits in develop vorhandene Lösung.

### V05 – Dependencies mit kritischen Advisories: P0 vor externer Freigabe

Frischer Productionaudit: **38 Einträge, davon sechs critical und 18 high**. Geprüfter Branch verwendet weiterhin Next 16.3.0 und den bisherigen Nest-/Express-/Uploadgraph. Der Dependencyfix im offenen PR #10 ist nicht integriert und wird nicht angerechnet. Pro Advisory müssen Version, erreichbarer Codepfad und Betriebsbedingungen bewertet werden; dieser Audit behauptet keine 38 bestätigten Exploits. Keine automatischen Dependencyänderungen vorgenommen.

### V06 – Auth ist angebunden, aber nicht vollständig abgenommen: P1

KeycloakJS und Realm-Konfigurationsskripte bilden Registrierung, Verify, Googlehinweis, Linking, Reset und Logout grundsätzlich ab. Kein echter Keycloak-/SMTP-/Google-/Browserflow wurde ausgeführt. Das ist eine **Nachweislücke**, kein Beweis, dass delegierte IdPfunktionen fehlen.

Dagegen ist fehlende `updateToken`-/`onTokenExpired`-Behandlung im AuthProvider eine konkrete Implementierungslücke. Der Context hält eine initiale Tokenkopie; lange Sessions können nach Ablauf in 401 laufen. Reale Sessionrevocation ist nicht implementiert, der BANNED-Guard blockiert lediglich APIzugriffe. Unter 103 fehlt zusätzlich eine verbotene-Begriffe-Policy über fünf reservierte Namen hinaus.

### V07 – Upload/Validation/Logs/Audit: P1

- Media erlaubt Dateitypen anhand des vom Client gelieferten MIME und speichert unveränderte Bytes. Keine Bilddekodierung/Signatur-/Pixelgrenzen. Kein echter MinIO/R2-Roundtrip in dieser Prüfung.
- Öffentliche `/media/not-a-uuid/content` liefert real **500**, nicht kontrolliert 400. Andere unvalidierte redaktionelle IDs benötigen dieselbe systematische Prüfung.
- Logger redigiert sensible Objektschlüssel, aber keine Secrets in Error-/Message-/URLfreitext. HTTPlogging nutzt `originalUrl` mit Querystring. Keine tatsächliche Secretpreisgabe beobachtet.
- Kritische redaktionelle/Moderationsaktionen erzeugen keine durchgängigen AuditLogwrites; Artikelrevisionen enthalten keinen expliziten Akteur. Daher reicht das Modell allein für die Verhaltensanforderung aus 078 nicht.

### V08 – Frontend ist teilweise echte Anwendung, teilweise Vorschau: P1/P2

114/121 mischen echte News beziehungsweise Clubstammdaten mit Mockspielen, Tabellen und Diskussionen. Das Forum ist als Fachflow nicht implementiert. 118 verlangt ausdrücklich einen Mock und ist deshalb nicht wegen fehlender APIintegration falsch; bei der echten Start-/Vereinsseite bleibt dieselbe Datenquelle jedoch eine Lücke.

126 enthält geplante Datenschutz-/Notificationbereiche und keine vollständige Sessionverwaltung. 127 hat die Navigation, aber keine zentrale Rollenbegrenzung des Layouts und mehrere Platzhalterseiten. APIguards sind separat vorhanden; sichtbares Adminlayout ist kein bewiesener Zugriff auf geschützte Daten oder Schreibaktionen. 123/124 haben LeseAPI/Favoritenhighlight, aber keine Browser-/Mobileabnahme; späterer Sportsimport/Tabellenberechnung wird nicht unzulässig zum alleinigen Kriterium dieser UIaufgaben gemacht.

### V09 – Infrastruktur ist vorbereitet, Betrieb nicht unabhängig bestätigt: P1/P2

Drei Compose-Overlays lassen sich mit synthetischen Variablen lokal fehlerfrei auflösen. Projekte/Pfade/Netze/Backup-/Deploy-/Restoreskripte existieren. Das bestätigt keine angelegten VPSverzeichnisse, Credentials, Realmclients, Tunnelrouten, Bucketprovisionierung oder installierten Timer. MinIOs `MINIO_BUCKET`-Variable allein erzeugt keinen Bucket. Keycloak-DB und User sind im Basiscompose nicht automatisch provisioniert.

Kein App-Dockerimage-/Restart-/Persistenz-/Rollback-/Restore-Drill ausgeführt. Historisches Restoredokument vom August wird als historische Aussage behandelt, nicht als aktueller unabhängiger Nachweis. Keine Produktionsprüfung zum Schließen dieser Lücke vorgenommen. Lokaler isolierter Betrieb kann vor einer separat autorisierten Stagingabnahme ausgebaut werden.

## Abnahmeentscheidung

Die 174 Aufgaben können **nicht gemeinsam als abgeschlossen freigegeben** werden. Es gibt funktionierende technische Kerne und erfolgreiche reale Teilflüsse; vollständige vertikale Feature-DoD einschließlich Browser/Mobile/Staging ist nicht nachgewiesen. Konkrete funktionale Lücken und reine Nachweislücken stehen je Aufgabe getrennt in der Matrix.

Priorisierte Nacharbeiten und eng geschnittene Agentenaufträge stehen in [ROADMAP.md](ROADMAP.md) und [AGENTENPAKETE.md](AGENTENPAKETE.md); [MEILENSTEINE.md](MEILENSTEINE.md) ordnet den Stand ein. Diese Dateien sind ein Reviewvorschlag. Keine Umsetzung oder Veröffentlichung ist erfolgt.
