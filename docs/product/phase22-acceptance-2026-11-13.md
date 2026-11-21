# Phase 22 (209–223) – DEV-Abnahmematrix

Stand: **13.11.2026**. Technische Basis: `develop` bei `f20a84803dccc566c7faf15880936c03cc4d2abd` vor diesem Dokumentations-/CI-PR.

> **Status: technisch verifiziert, fachlich NICHT vollständig abgenommen.** Echte Login-/Moderator-/Desktop-/Mobilabnahme bleibt offen. Es wurde kein DEV-Testbestand angelegt.

## Nachweise und Abgrenzung

- **[Merge-Push-/DEV-CI #43510681534](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/43510681534):** `completed/success`, Hauptjob und DEV-Deployment erfolgreich, nachgelagerte DEV APA-OTS-Abnahme erfolgreich; alle bisherigen Phase-22-Read-only-Smokes PASS. DEV-Log: `DEV_PHASE22_FORUM_CATEGORY_COUNT=0`.
- **[PR-CI #43509982567](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/43509982567):** `completed/success`, insbesondere isolierte echte HTTP-Tests auf wegwerfbarer PostgreSQL-/Redis-Umgebung, Docker-Images und Web-/API-Builds.
- **[PR #184](https://github.com/whiteyOnTheMoon/kurvenfunk/pull/184):** Artikel-/Forum-Gemeinschaftsdiskussion gemergt, ohne zweite Datenablage.
- **Neu in diesem PR:** Eigenes negatives DEV-HTTP-Gate für 22.211 Thread-Erstellung; erst nach erfolgreicher Merge-Push-/DEV-CI als bestätigt markieren.
- **[GitHub #185](https://github.com/whiteyOnTheMoon/kurvenfunk/issues/185):** Gesamtfachabnahme mit echten DEV-Konten, Ingress, Interaktionen, Browsern und Datenschutz.

## Einzelstatus – technische Prüfungen

| Task | Nachweis aus DEV-CI #43510681534 oder isolierter PR-CI #43509982567 | Fachliches Rest-Gate |
| --- | --- | --- |
| 209 Kategorien | DEV `GET` 200, Kategorieanzahl **0**, anonymes Admin-Gate 401, Webseite 200 | Mit echten Kategorien Sortierung, Sichtbarkeit, Admin-CRUD und Audit prüfen |
| 210 Vereinsforen | DEV Kategorieantwort 200, nicht vorhandene Kategorie/Verein 404, unerlaubtes Ensure 503; isolierte Club-E2E PASS | Echte Clubs, autorisiertes Ensure, Audit und Browser prüfen – #160 |
| 211 Threads eröffnen | Isolierte Club-/Forum-HTTP-E2E PASS; **neues negatives DEV-Gate in diesem PR** | Reale aktive Accounts, ersten Post, Anti-Doppelsubmit und Fehlerzustände – #169 |
| 212 Posts/Detail | DEV unsichtbarer Thread 404, Web-Routenantwort 200 | Echte sichtbare Threads, Beitragsdarstellung und Löschredaktion |
| 213 Antworten | DEV untrusted Reply-POST 503, isolierte E2E | Echte Reply-Rechte, Elternbezug, Spam und gesperrte Threads |
| 214 Cursor | DEV unbekannte Thread-/Foren-Cursor 404, isolierte E2E | Reale Sortierung, nächste Seiten, keine Duplikate und Race-Cases |
| 215 Abonnements | DEV untrusted PUT/DELETE jeweils 503, isolierte E2E | Reales Ein-/Ausschalten, mehrere Konten |
| 216 Ungelesen | DEV untrusted PUT 503, isolierte E2E | Ungelesenstand bei neuen Antworten, kontoübergreifende Isolation |
| 217 Leseposition | DEV untrusted PUT 503, isolierte E2E | Genaue Position über Geräte und Seiten, kein unbeabsichtigtes Markieren |
| 218 Anpinnen | DEV untrusted PUT/DELETE je 503, isolierte Moderations-E2E | Moderator/Member-RBAC, Reihenfolge, Audit, Idempotenz |
| 219 Sperren | DEV untrusted PUT/DELETE je 503, isolierte E2E | Schreibsperre für Mitglied, Entsperren, Audit |
| 220 Verschieben | DEV untrusted PUT 503, isolierte E2E | Echte Foren, kanonische URL, Abo-/Post-Identität, Audit |
| 221 Zusammenführen | DEV untrusted PUT 503, isolierte E2E | Redirect, Parents/Posts/Lesestände, Idempotenz, Audit |
| 222 Melden/Moderieren | DEV Meldung 503, Moderation 401, isolierte 6/6 Report-E2E PASS | Echtes Reporting, Warteschlange, redigierte Posts, Rechte und Audit |
| 223 Artikel/Forum | DEV `/forum/artikel` 200, Artikelliste 200, unbekannte Artikel/Forum-Detail je 404; isolierte 5/5 E2E PASS | Gleiche Kommentar-IDs an beiden URLs über Browser, Responsiveness und SEO |

**Wichtig:** Ein grüner 401/503-Guard schützt untrusted Loopback-Schreibzugriffe. Er beweist *nicht* die korrekte 401/403/2xx-Rechtekette über einen echten vertrauenswürdigen Ingress. Die durch CI getesteten isolierten E2E sind eine separate, datenbankgestützte Bestätigung.

## Noch offene echte DEV-Abnahme (nicht automatisiert)

1. **Daten-/Accountfreigabe:** Der aktuelle DEV-Datenbestand enthält null Forenkategorien. Eine berechtigte Person muss reale freigegebene Kategorien/Vereine und die Testrollen für den kontrollierten Ablauf bereitstellen oder ihre Einrichtung ausdrücklich erlauben. Keine automatisch erzeugten Kategorien, Nutzer, Vereine, Beiträge oder Seed-Daten.
2. **Echte Auth-/Ingress-Matrix:** Anonym, vor Onboarding, ACTIVE, LIMITED, BANNED, MODERATOR, ADMIN/SUPERADMIN über den regulären vertrauenswürdigen Tunnel testen. Keine Tokens in GitHub/Chat, keine gefälschten Proxy-Header und keine abgeschalteten Sicherheitsguards.
3. **CRUD-/Sichtbarkeits-/Moderationspfade:** Sichtbare echte Themen von Erstellung über Antwort, Abo/Leseposition bis Pin, Lock, Move, Merge und Report prüfen. Datenschutz, Audit und Idempotenz mit tatsächlichen Datensätzen belegen.
4. **Artikel-Kanonizität:** Ein Artikel und seine Forum-Ansicht zeigen dieselben Kommentar-IDs; Meldung/Vote/Delete wirkt in beiden; unveröffentlichte Artikel bleiben verborgen.
5. **Desktop/Mobil/Accessibility:** Breiten um 320–375px und Desktop, Tastaturfokus/Tab-Reihenfolge, Screenreader-Beschriftung, lesbare Fehlermeldungen, leere/404/API-Ausfallzustände prüfen. Relevante Pfade: `/forum`, `/forum/kategorie/:slug`, `/forum/verein/:slug`, `/forum/verein/:slug/thema/:slug`, `/forum/artikel`, `/forum/artikel/:slug`, `/artikel/:slug#diskussion`.
6. **Evidenz, Cleanup, Sign-off:** Datums-/Rollen-/HTTP-/Audit-Belege im [Abnahme-Issue #185](https://github.com/whiteyOnTheMoon/kurvenfunk/issues/185) dokumentieren; PII/Tokens aus Logs und Screenshots entfernen. Kein pauschaler DONE-Haken vor nachgewiesenem Fachtest.

## Grenzen

Nur DEV und isolierte CI-Testdatenbanken; STAGING/PROD unverändert. Die Abnahme älterer Phasen bleibt unabhängig offen.

## Ergänzung 21.11.2026 – isolierte UI-/Barrierefreiheits-Regressionsprüfung

**Weiterhin kein Phase-22-Fach-Sign-off.** Die auf `develop` nach Phase 22 integrierte
Notification-Arbeit der Phase 23 ändert nichts an den noch offenen echten DEV-Gates.
Die zuletzt belegte DEV-Kategorieanzahl ist **0**; es wurden keine Foren, Accounts,
Artikel, Threads oder Demo-/Seed-Daten für die Prüfung eingerichtet.

Dieser Ergänzungs-PR führt ausschließlich technische Schutzmaßnahmen ein:

- `apps/web/test/phase22-forum-browser.cjs`: echter isolierter Chromium-Test der
  React-Komponenten und Forum-CSS bei 320, 375 und 1280 Pixeln, inklusive
  leeren Kategorien/Artikeln, Kategorie-404, API-Fehlern, real gerenderten Links,
  tastaturbasierter Navigation und horizontalem Overflow. Testdaten werden
  ausschließlich in einem lokalen Test-HTTP-Server bereitgestellt; die Prüfung
  tätigt nur GET-Anfragen und berührt DEV nicht.
- `.github/workflows/phase22-forum-browser.yml`: dedizierter PR-CI-Job
  auf `develop` für diese Chromium-Suite, unabhängig von echten Accounts.
- `ForumOverview`: echte Kategorie-404 als nicht vorhandene Kategorie statt
  allgemeinem API-Fehler, mit klarer Statusmeldung; beim Nachladen keine
  alte Kategorieliste weiterzeigen.
- `ClubForumPage`: vorherige Vereinsdaten beim Nachladen verwerfen.
  Seiten-Layout mit `lang="de-AT"` für deutschsprachige Screenreader.
- Die vorhandenen quellcodebasierten Unit-Tests sichern diese Regressionen
  zusätzlich ab.

**Nachweisstatus:** Erst nach erfolgreicher PR-CI und separater Prüfung des
Merge-Push-/DEV-Gates als technisch bestätigt markieren. Selbst ein grüner
Chromium-Test mit isolierten Fixtures bestätigt **keinen** echten Keycloak-Login,
keine Moderationsoperation, keinen vertrauenswürdigen Tunnel und keine
Live-Mobilabnahme. Die offenen Einzeltests in #160, #169 und #185 bleiben offen.
Keine automatische Testdatenanlage, keine STAGING-/PROD-Änderung.

## Ergänzung 21.11.2026 – kontoübergreifende UI-Isolation (215–217, 222)

- **Technischer Anlass:** Die Moderationsmeldungs-Warteschlange hielt bisher eine
  ungebundene lokale Ergebnisliste vor. Nach einem direkten Wechsel zwischen zwei
  berechtigten Moderatoren konnte die alte Liste bis zur nächsten Antwort sichtbar
  bleiben. Die Leseposition übernahm die Auswahl eines anderen Kontos im Formular.
- **Schutz:** Die Queue-Darstellung wird beim Rendern explizit an Benutzer-ID,
  Bearer-Token und Reload-Revision gebunden; keine Anzeige von vorherigen
  Moderationsmeldungen nach Rollen-, Konto- oder Tokenwechsel, auch nicht
  während eines ausstehenden GET. Fetch-Abbrüche bleiben erhalten.
- **Lesestand:** Geladene Position, Fehlermeldung und ausgewählte Post-ID sind
  an Benutzer-ID, Token und Thread-Revision gebunden. Keine Übernahme eines
  vorausgewählten Beitrags bei einem Konto- oder Tokenwechsel.
- **Browser-Nachweis:** Neuer isolierter realer Chromium-Test
  `apps/web/test/phase22-private-ui.browser.cjs` mit echten React-Komponenten:
  Moderator A und B mit absichtlich verzögerter zweiter Antwort; normale
  Mitglieder, eingeschränkte Moderatoren und Logout; Leseposition von Konto A
  darf bei Konto B weder erscheinen noch vorausgewählt sein. Ausschließlich
  GET-Requests an lokalen Fixture-Server, keine echten Tokens, keine DEV-Writes.
  Das PR-Workflow-Gate `phase22-forum-browser.yml` führt beide Chromium-Suiten aus.
- **Verifikation:** Erfolgreiche neue PR-CI, Merge-Push-/DEV-CI und isolierte
  Chromium-Jobs erst nach tatsächlichem Lauf bestätigen. Alle echten
  Account-/Tunnel-/Moderations-/Mobil-Abnahmen in #185 bleiben offen.

Der unmittelbar davor gemergte PR #190 ist laut
[Merge-/DEV-CI #44947422211](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/44947422211)
`completed/success`: 15/15 Phase-22-Read-only-Gates PASS, DEV-Kategorien
weiterhin **0**. Keine Seed-Daten angelegt; STAGING/PROD unverändert.
