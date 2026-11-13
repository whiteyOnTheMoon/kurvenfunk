# Phase 22 – Forum (Masterplan 209–223)

Stand: 13.11.2026. Entwicklungsbasis: `develop` nach erfolgreich verifiziertem DEV-Datenreset und Startseitenfix. **Vorherige Abnahmen bleiben offen, wo sie nicht ausdrücklich nachgewiesen sind.**

## Aufgaben und Umsetzungsslices

| Masterplan | Inhalt | Vorgehen | Nachweisstatus |
| --- | --- | --- | --- |
| 209 | Forenkategorien | Öffentliche aktive Kategorien, sortierte Unterforen, schreibgeschützte Leerliste bei sauberer DEV-Datenbank; rollenbasierte Verwaltung mit Audit | **Technisch in DEV geprüft** – Actions #43032913255: API 200, 0 Kategorien, anonymes Admin-Gate 401, Web 200 |
| 210 | Vereinsforen | Clubs referenzieren, Vereinsforen bei kontrollierter realer Club-Verwaltung zuordnen, idempotent und ohne Fakedaten | **Code und automatisches DEV-Read-only-Gate PASS** – Push-CI #43332986378, echter Tunnel-Adminflow/Mobile noch offen (#160) |
| 211–213 | Threads, Posts, Replies | Status-/Onboarding-Permissions, atomare Eröffnung mit erstem Beitrag, Thread-Grenzen für Antworten | **211: DEV Push-CI #43343696724 PASS**; **212: DEV Push-CI #43347049886 PASS**; **213: DEV Push-CI #43352933103 PASS**; echte Account-/Browserabnahme offen |
| 214–217 | Paginierung, Abos, Ungelesen, Leseposition | Stabile Cursor/Sequenzen und persönliche Read-States | **214: Push-/DEV-CI #43360546561 PASS**; **215: Push-/DEV-CI #43366935038 PASS**; **216: DEV-CI #43375847270 PASS**; **217: DEV-CI #43380284008 PASS** |
| 218–221 | Pin, Lock, Move, Merge | Moderatorenrechte, Audits, konsistente kanonische Thread-Identitäten | **218: DEV-CI #43389281899 PASS**; **219: DEV-CI #43393243928 PASS**; **220: DEV-CI #43404251216 PASS**; **221: in Arbeit** |
| 222 | Forum-Reports | Anschluss an bestehendes Report-/Moderationssystem | **Implementierung in PR #182; PR-/DEV-CI und manuelle Abnahme offen** |
| 223 | Artikel/Forum | Eine gemeinsame Diskussion, keine unabhängige Parallelcommunity | Ausstehend |

## 22.209 Vertrag

- **Datenmodell existiert bereits**: `ForumCategory`, `Forum`, `Thread`. Für die erste vertikale API ist keine neue Migration notwendig.
- `GET /api/v1/forums/categories` liefert ausschließlich `active=true`-Kategorien und `active=true`-Unterforen, sortiert nach `sortOrder` und Name. Ergebnis `[]` ist bei einer leeren DB korrekt und kein Fehler.
- `GET /api/v1/forums/categories/:slug` darf inaktive oder unbekannte Kategorien nicht ausliefern.
- `GET /api/v1/forums/categories/admin/all` erlaubt die Inventur auch inaktiver Kategorien nur mit `forum.manage`.
- `POST /api/v1/forums/categories` sowie `PATCH /api/v1/forums/categories/:id` sind admin-/superadmin-geschützt; validieren eine strikte Eingabe und schreiben mit `AuditLog` in einer gemeinsamen Datenbanktransaktion. Ein Slug bleibt nach Erstellung stabil. `active=false` archiviert, statt Kategorien mit Foren zu löschen.
- Öffentliche Next.js-Routen `/forum` und `/forum/kategorie/:slug` zeigen echte API-Antworten, sinnvolle mobile und leere Zustände und keine erfundenen Unterforen. Noch nicht implementierte Thread-Seiten werden nicht vorgetäuscht.
- **Keine automatisch erzeugten Kategorien, Vereine, Threads, Posts, Benutzer oder Demo-Inhalte.** Masterplan-Beispiele (Bundesliga, Vereine, Nationalteam, International, Off Topic) sind eine redaktionelle Taxonomie-Option, kein Anlass zum ungeprüften Seeding.

## 22.210 Vereinsforen – Integrationsvertrag

- Ein bereits bestehendes, echtes `Club`-Objekt ist alleinige Quelle für Vereinsidentität und Namen. Es werden **weder Vereine noch Forumskategorien durch Seeding erzeugt**.
- Gibt es eine **aktive, ausdrücklich verwaltete Kategorie mit dem Slug `vereine`**, dann wird bei jeder neuen, aktiven Club-Anlage im **selben PostgreSQL-Transaktionsblock** ein Verein-Forum angelegt und auditiert. Fehlt die Kategorie, bleibt die Vereinsanlage gültig und das Forum aus – keine versteckte Kategorieerstellung.
- Das kanonische Vereinsforum verwendet `verein-<club.slug>` als global eindeutigen Slug; Club-Slugs sind nach ihrer Anlage nicht mehr änderbar. Die bestehende `Forum.slug UNIQUE`-Constraint verhindert auch bei konkurrierenden Schreibzugriffen doppelte kanonische Slugs. Ein globales `UNIQUE(clubId)` wird bewusst **nicht** eingeführt, da das Domainmodell spätere zusätzliche Vereinsforen erlaubt.
- Für bereits bestehende echte Vereine: `POST /api/v1/forums/clubs/:clubId/ensure` erfordert `forum.manage`. Der Vorgang ist wiederholbar, erkennt bereits verknüpfte Foren und erzeugt keine weiteren Kopien. Fehlt die Kategorie oder ist der Club inaktiv, wird ohne Mutation ein fachlicher Konflikt zurückgegeben. Mehrdeutige Altbestände werden nicht automatisch umgedeutet.
- `GET /api/v1/forums/clubs/:clubSlug` und `/forum/verein/:slug` zeigen das echte Forum bzw. einen klaren 404/Leerzustand. **Inaktive Vereine, Foren und Kategorien** werden öffentlich nicht gezeigt; bestehende historische Daten bleiben unverändert.
- Auf der Vereinsseite und in Kategorien werden tatsächliche zugeordnete Foren verlinkt; ohne Forum existiert kein vorgetäuschter Link. Threads werden erst ab Task 211 nutzbar.
- Es gibt keine neue Migration: `Forum` besitzt `clubId`, `categoryId` und `slug UNIQUE` bereits. AuditLog, Rollenberechtigungen und DEV-Read-only-Marker werden wiederverwendet.
- Die isolierte E2E-Suite legt Test-Vereine und eine Testkategorie **nur** in einer temporären, lokalen PostgreSQL/Redis-Umgebung an und löscht diese danach. Dies ist ausdrücklich kein DEV-Seed.

### Tatsächlicher Integrations- und Abnahmestand (11.11.2026)

- [PR #158](https://github.com/whiteyOnTheMoon/kurvenfunk/pull/158) **gemergt** auf `develop` (Merge `0d4c729dbccd337be35489cdffe22f0d388b09df`): Vereinsforum-Provisionierung, Admin-Ensure, öffentliche Read-Routen, Vereinslinks, isolierte HTTP-/DB-Tests.
- [Erster DEV-Push-Lauf #43075157506](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/43075157506): nach PR-#159-Befund Deploy und Startseiten-/Kategorienprüfungen erfolgreich, Task-210-HTTP-Smoke **fehlgeschlagen** wegen falscher erwarteter 401 bei nicht vertrauenswürdigem localhost-POST.
- [PR #159](https://github.com/whiteyOnTheMoon/kurvenfunk/pull/159) **gemergt** (Merge `8495ccc1df00829fce100c7f82d3df0abd00dffe`): rein lesender DEV-Smoke akzeptiert den sicherheitskorrekten **503 fail-closed** statt 401. Keine Schutzumgehung, keine DB-Mutation.
- [PR-CI #43076528691](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/43076528691) für #159: **completed/success**.
- **Dieser historische Stand wurde inzwischen durch den grünen Merge-Push-Lauf #43332986378 überholt.** Die reale Tunnel-Admin-RBAC- und Mobilbrowser-Abnahme bleibt weiterhin offen.
- Alle fehlenden Nachweise werden in [Issue #160](https://github.com/whiteyOnTheMoon/kurvenfunk/issues/160) einzeln geführt.

**Abnahme 210 bleibt offen**, bis der reale Admin-Provisionierungsflow über den vertrauenswürdigen Tunnel und mobile Browserprüfungen nachweisbar erfolgreich sind; der DEV-Deployment-/HTTP-Gate-PASS ist inzwischen oben dokumentiert.

### Nachgewiesener DEV-Push-Stand 13.11.2026

- [Merge-Push-CI #43332986378](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/43332986378) für Merge `8cd22e929c8ae658ff17f982193006ac2c639ac1`: **completed/success**, einschließlich DEV-Deploy, Startseite, Forenkategorien und APA-OTS-Read-only-Prüfung.
- Explizite DEV-Marker: Kategorien `200` mit gültiger `data`-Liste, unbekannte Kategorie `404`, Forum-Startseite `200`, unbekannter Verein `404`, nicht vertrauenswürdiger Schreibzugriff `503 fail-closed`, Vereinsseite `200`; `DEV_PHASE22_210_READONLY_RESULT=PASS`.
- Der Deploy-Erfolg beweist **nicht** die noch ausstehende echte Tunnel-Admin-Provisionierung, Role-/Audit-Abnahme oder manuelle Desktop-/Mobilprüfung. Aufgabe 210 bleibt daher offen, Details in [Issue #160](https://github.com/whiteyOnTheMoon/kurvenfunk/issues/160).

## 22.211 – Threads (technisch integriert, manuelle Abnahme offen)

- `GET /api/v1/forums/by-slug/:forumSlug/threads` liefert eine öffentliche, maximal 20 Einträge umfassende Übersicht und `hasMore`. Öffentlich unsichtbare/inaktive Foren, Vereine oder Kategorien erhalten 404; nur offene/gesperrte, nicht gemergte Threads werden gezeigt. Die vollständige Cursor-Paginierung bleibt Aufgabe 214.
- `POST /api/v1/forums/by-slug/:forumSlug/threads` verlangt ein authentifiziertes, aktives und vollständig onboardetes Mitglied mit `thread.create`; LIMITED/BANNED und anonyme Requests werden abgewiesen. Eingaben werden strikt validiert; eine deaktivierte Thread-Erstellung liefert 409.
- Der erste Beitrag wird in derselben PostgreSQL-Transaktion wie der Thread angelegt; der Thread erhält `postCount=1`, `lastPostSequenceNumber=1`, `lastPostId` und `lastPostAt`. Die bestehende Redis-gestützte Spam-Schutzreservierung wird übernommen und bei Schreibfehlern freigegeben.
- Auf der Vereinsforum-Seite werden ausschließlich tatsächlich vorhandene Threads als Übersicht gezeigt; keine erfundenen Inhalte. Der 22.211-Web-Slice ergänzt einen validierten Schreibdialog für ACTIVE/onboardete Mitglieder und aktualisiert die Übersicht nach erfolgreicher Erstellung. 22.212 ergänzt nachträglich Links auf echte, öffentliche Detailseiten; Antworten bleiben 213 vorbehalten.
- Isolierte HTTP-/DB-Tests verwenden nur kurzlebige lokale PostgreSQL-/Redis-Testumgebungen und räumen ihre Thread-/Post-Testdaten wieder weg; keinerlei Seeding in DEV. **Nachweis 211:** [Merge-Push-/DEV-CI #43343696724](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/43343696724) completed/success nach [Docker-Fix PR #171](https://github.com/whiteyOnTheMoon/kurvenfunk/pull/171). Manuelle Browser- und Accountabnahme weiter offen.

## 22.212 – Thread-Detailseiten und Beiträge (read-only Slice)

- `GET /api/v1/forums/by-slug/:forumSlug/threads/:threadSlug` liefert öffentliche Details nur für `OPEN`/`LOCKED`, nicht gemergte Threads in aktiven Foren und Kategorien bzw. für aktive Vereine. Nicht vorhandene, archivierte oder versteckte Themen liefern 404. Keine neuen DB-Tabellen oder Schreibzugriffe.
- Das Ergebnis enthält Thread-Metadaten, die ersten **maximal 30** Posts in `sequenceNumber`-Reihenfolge und `hasMorePosts` als expliziten Hinweis auf weitere Beiträge. Cursor-/Sequenz-Paginierung bleibt Auftrag 214.
- Beiträge mit `deletedAt` werden als gelöschte Platzhalter serialisiert. **Weder Inhalt noch Autorenidentität** oder Änderungsinformationen dürfen öffentlich ausgeliefert werden; auch spätere Replies dürfen diesen Schutz nicht aushebeln.
- Im Vereinsforum führen erst jetzt tatsächlich vorhandene Thread-Slugs zu `/forum/verein/:slug/thema/:threadSlug`; die mobile Ansicht zeigt Beiträge als **escaped Text** (kein HTML/Markdown-Rendering), passende Lade-/404-/Fehlerzustände und einen Hinweis, wenn weitere Beiträge folgen.
- Die isolierten PostgreSQL/Redis-HTTP-E2E-Tests prüfen echte Post-Inhalte, Redaction, Sichtbarkeit, 404 bei deaktivierten Kategorien und die Begrenzung. Ein zusätzlicher **rein lesender** DEV-Smoketest prüft unbekanntes Thema = 404 und die Next.js-Route = 200 ohne Seeding; ein positiver Test mit realem aktiven Verein erfordert nach wie vor echte DEV-Daten und manuelle Browserabnahme.
- Der erste Slice ist **nicht abgeschlossen**, solange PR-CI mit Web-Docker-Build und die anschließende Merge-Push-/DEV-CI nicht beide vollständig grün sind. Schreibrechte und Antworten folgen gesondert in 22.213.

## 22.213 – Antworten und Beitragsbezüge (in Arbeit)

- `POST /api/v1/forums/by-slug/:forumSlug/threads/:threadSlug/posts` verlangt `thread.reply`, ACTIVE-Account und abgeschlossenes Onboarding. Das gemeinsame Zod-Schema nimmt einen nichtleeren Beitrag mit höchstens 5.000 Zeichen und optional eine gültige `parentPostId` im gleichen, nicht gelöschten Thread an. Die bestehende Redis-Spam-/Duplicate-/Linkbegrenzung gilt auch für Forumsantworten.
- Nur **öffentliche OPEN-Themen** sind beschreibbar. LOCKED liefert 409, ARCHIVED/MERGED oder unsichtbare Foren, Vereine und Kategorien liefern 404. Eine abgeschaltete `threadCreationEnabled`-Option verbietet neue Themen, nicht automatisch Antworten auf vorhandene offene Themen.
- Ein bedingter `Thread.updateMany`-Vergleich auf `lastPostSequenceNumber` reserviert die nächste Nummer inklusive `postCount+1` innerhalb derselben Datenbanktransaktion. Erst dann wird der Post angelegt und `lastPostId/lastPostAt` gesetzt. Bei Konkurrenz wird begrenzt erneut versucht, statt Nummern zu duplizieren. Fehler rollen die komplette Transaktion zurück und geben eine reservierte Spam-Schutzsperre nach Möglichkeit wieder frei.
- Die Thread-Detailseite bekommt einen Reply-Dialog für angemeldete ACTIVE-Mitglieder mit abgeschlossenem Onboarding; eigene Antworten auf echte, nicht gelöschte Beiträge können über `parentPostId` verknüpft werden. Gesperrte Themen zeigen keine Eingabemaske; nach bestätigter Erstellung wird die öffentliche Liste aktualisiert.
- **Wichtig:** Die Übersicht bleibt bis Aufgabe 214 auf **30 Posts** begrenzt und darf keine neue Antwort als dort sichtbar versprechen, wenn weitere Seiten fehlen. Auch gelöschte Beiträge bleiben öffentlich redigiert. Keine autonomen DEV-Testposts und keine STAGING-/PROD-Mutation.
- Isolierte API-HTTP-E2E prüft Berechtigungen (401/403), Onboarding, Validierung (400), Atomarität und Sequenzen, gleichzeitige Autoren, Elternbezüge sowie abgewiesene Writes. DEV prüft ausschließlich den anonymen, fail-closed-Schreibschutz ohne echte Datenänderungen. **Erst vollständig grüne PR-CI plus Merge-Push-/DEV-CI erlauben technische Abnahme.**

## 22.214 – Sichere Cursor-Paginierung (in Arbeit)

- `GET /api/v1/forums/by-slug/:forumSlug/threads?cursor=...` liefert 20 reale Themen je Seite, sortiert nach `pinnedAt DESC NULLS LAST`, `lastPostAt DESC NULLS LAST`, `createdAt DESC`, `id ASC`. `nextCursor` ist ein opaker, strikt validierter, an den Forum-Slug gebundener Cursor; `hasMore` bleibt aus Kompatibilitätsgründen vorhanden. Ein lexikografischer Keyset-Filter vermeidet instabiles Offset-Blättern, auch bei gleichen Zeitstempeln.
- `GET /api/v1/forums/by-slug/:forumSlug/threads/:threadSlug?cursor=...` liefert weiter höchstens 30 echte Beiträge je Seite. Der Cursor enthält die eindeutige `sequenceNumber` und wird an die konkrete Thread-ID gebunden. Neue Antworten erhalten weiter ihre Sequenznummer transaktionssicher durch 22.213. `nextPostCursor` ergänzt das bisherige `hasMorePosts`. Gelöschte Beiträge bleiben auf **jeder** Seite mit `content=null`, `author=null` und `editedAt=null` redigiert.
- Fehlende Cursor sind die erste Seite; manipulierte, zu lange, nicht passende oder unvollständige Cursor führen zu 400, ohne eine fremde Diskussion freizugeben. Unsichtbare Foren und Threads bleiben 404. Cursor versprechen keinen unveränderlichen Snapshot bei nachträglichem Pin/Move/Lock/Schreiben; die Weboberfläche bietet eine Neuaktualisierung und dedupliziert angehängte Einträge.
- Die Vereinsforum- und Thread-Detailansicht bieten echte, zugängliche **„Weitere Themen/Beiträge laden“**-Bedienelemente, Ladezustände und wiederholbare Fehlerbehandlung; bereits sichtbare Einträge bleiben bei einem fehlgeschlagenen Folgeaufruf erhalten.
- Isolierte PostgreSQL-/Redis-HTTP-Tests prüfen 20/30-Seitengrenzen, Cursor-Ketten, Pin-Reihenfolge, neue Beiträge zwischen zwei Requests, Cross-Scope-/Manipulationsabwehr sowie Löschredaktion auf späteren Seiten. DEV erhält **nur negative read-only-HTTP-Smokes** (unbekannte Foren/Threads mit Cursor bleiben 404), keine Testbeiträge.
- **Abnahme:** PR-CI inklusive API-E2E und Web-Docker-Build grün; danach separate Merge-Push-/DEV-CI vollständig grün. Keine STAGING-/PROD-Änderungen und kein automatisches Seeding. Positive reale Browser-/Accountabnahme bleibt getrennt ausstehend.

## 22.215 – Themen-Abonnements (in Arbeit)

- Das vorhandene Prisma-Modell `ThreadSubscription` besitzt bereits die eindeutige Constraint `(userId,threadId)` und Referenzen mit Cascade-Löschung; **keine Migration** und kein neues Forum-Abo-Modell nötig. Der erste 215-Slice ist bewusst ein **Thread-Abonnement**, kein Abo einer gesamten Kategorie oder eines Vereinsforums.
- Persönliche API-Endpunkte `GET`, `PUT` und `DELETE /api/v1/forums/by-slug/:forumSlug/threads/:threadSlug/subscription` verwenden die bestehende JWT-Identität serverseitig, die neue `thread.subscribe`-Community-Berechtigung und ACTIVE-/Onboarding-Gates. Der Request akzeptiert keine fremde `userId`. Die Antwort enthält ausschließlich `{subscribed:boolean}` des angemeldeten Users; öffentliche Thread-GETs bleiben ohne persönliche Abos.
- `PUT` ist mit Unique-Constraint und `createMany(skipDuplicates=true)` auch bei wiederholtem/konkurrierendem Aufruf idempotent; `DELETE` nutzt nutzergebundenes `deleteMany` und ist ebenfalls wiederholbar. **LOCKED**-Themen dürfen weiterhin abonniert werden; `ARCHIVED`/`MERGED` und inaktive Foren/Kategorien/Vereine bleiben 404. Es gibt **keine Benachrichtigungszustellung** oder automatische Subscription beim Antworten; Aufgaben 216–217 behandeln persönliche Lesestände separat.
- In der Vereinsforum-Thread-Detailseite zeigt ein authentifizierter Schalter den tatsächlichen Abo-Status und unterstützt Abo/Abbestellen samt Lade-/Fehlerzuständen. Kein öffentlicher Abo-Zähler und keine E-Mail-/Push-Versprechen.
- Isolierte, kurzlebige PostgreSQL-/Redis-HTTP-E2E prüfen 401/403/Onboarding, getrennte Nutzerzustände, parallele und wiederholte PUTs, wiederholte DELETEs, den Abo-Status bei LOCKED sowie 404/Unveränderlichkeit bei verborgenen oder archivierten Themen. **Keine echten Test-Abos in DEV.**
- DEV prüft auf dem unverändert getesteten Merge-SHA mit zwei **ungeauthentifizierten, fail-closed** Loopback-Requests die bestehende Netzwerkblockade für PUT und DELETE (503), ohne gültige Token und ohne DB-Mutation. Technische Abnahme erst nach vollständig grüner PR-CI samt echtem Web-Docker-Build **und** grünem Merge-Push-/DEV-Lauf. Positive manuelle Account-/Browser-/Mobilabnahmen bleiben offen.

## 22.216 – Ungelesen-Status (erster Slice)

- Das vorhandene `ThreadReadState`-Modell wird pro Nutzer/Thema wiederverwendet; keine Migration. Fehlender Lesestand = Sequenz 0. Ungelesen bedeutet `Thread.lastPostSequenceNumber > lastReadSequenceNumber`; öffentliches Thema und Thread-Liste bleiben frei von persönlichen Lesedaten.
- Authentifizierte `GET/PUT /api/v1/forums/by-slug/:forumSlug/threads/:threadSlug/unread` verlangen `thread.read-state`, ACTIVE und abgeschlossenes Onboarding. Die Nutzer-ID stammt ausschließlich aus dem JWT. GET ändert **nichts**; erst ein bewusstes PUT markiert alle zum Zeitpunkt der Operation bekannten Beiträge als gelesen. Ein SQL-UPSERT mit `GREATEST` hält den Zähler monoton bei konkurrierenden PUTs.
- Nur sichtbare OPEN/LOCKED-Themen; versteckte/archivierte/gemergte Themen 404. Das UI zeigt privat den Ungelesen-Status und bietet einen expliziten Knopf. **Kein automatisches Markieren bei Seitenaufruf**; 22.217 behandelt genaue Lesepositionen pro Beitrag.
- Isolierte lokale PostgreSQL/Redis-E2E prüfen Auth, Nutzertrennung, Idempotenz, neue Beiträge und 404; DEV prüft nur den tokenlosen PUT-Guard (503) ohne jegliche echte Datenmutation. Manuelle positive Tunnel-/Browserabnahme bleibt offen.

## 22.217 – Exakte persönliche Leseposition (erster Slice)

- Bestehendes `ThreadReadState.lastReadPostId` ergänzt die Sequenz aus 22.216, ohne Migration. Privates `PUT /api/v1/forums/by-slug/:forumSlug/threads/:threadSlug/read-position` akzeptiert ausschließlich `{postId: UUID}` eines nicht gelöschten Beitrags aus demselben sichtbaren OPEN/LOCKED-Thema. Authentifizierung, ACTIVE, Onboarding und `thread.read-state`; die Nutzer-ID stammt aus dem Token.
- Atomarer PostgreSQL-UPSERT mit `GREATEST` hält Sequenz und referenzierte Post-ID auch bei parallelen/älteren Requests konsistent. Die private GET-/unread-Antwort enthält `lastReadPostId`, während öffentliche Antworten unverändert bleiben. Markierung aller aktuellen Beiträge aus 22.216 wird nicht zurückgesetzt.
- Im Web können angemeldete Mitglieder ausschließlich einen bereits geladenen, nicht gelöschten Beitrag bewusst als zuletzt gelesen speichern. Kein automatisches Tracking beim Scrollen oder Laden, keine erfundenen oder verborgenen Beiträge.
- Isolierte PostgreSQL-/Redis-HTTP-E2E prüfen Auth/Validierung/Privatsphäre/Löschung/Monotonie. Das DEV-Gate prüft nur einen tokenlosen, untrusted PUT => 503 fail-closed. Keine echten DEV-Testlesestände, keine STAGING-/PROD-Änderungen. Positive Account-/Browser-/Mobil-/Tunnelabnahme offen.

## 22.218 – Themen anpinnen (Moderation)

- Das vorhandene `Thread.pinnedAt` und `pinnedByUserId` samt `THREAD_PINNED`/`THREAD_UNPINNED` Audit-Aktionen wird wiederverwendet; **keine neue Migration**.
- Moderationsrecht `thread.pin` wird nur an Moderator, Admin und Superadmin vergeben, nie an normalen USER/TRUSTED_USER. Beide Mutationen unter `PUT/DELETE /api/v1/forums/by-slug/:forumSlug/threads/:threadSlug/pin` verlangen gültige Identität, ACTIVE und abgeschlossenes Onboarding.
- Ausschließlich öffentlich sichtbare OPEN/LOCKED-Themen, keine archivierten, gemergten oder inaktiven Kategorien/Foren/Vereine; 404 schützt verborgene Themen. Identische Wiederholung und parallele identische Writes sind erfolgreich, jedoch ohne zweite Mutation oder zweiten Audit-Eintrag. Die Änderung und das FORUM-THREAD-Audit mit Actor/JWT-User-ID, Vorher-/Nachher-Zustand laufen **in einer Transaktion**.
- Vorhandene öffentliche keyset-sortierte Thread-Liste verwendet `pinnedAt DESC NULLS LAST`; List- und Detailansicht zeigen angepinnte Themen, Moderator:innen können im Detail explizit anpinnen/lösen.
- Isolierte PostgreSQL-/Redis-/HTTP-E2E prüfen 401/403, Onboarding, sichtbare und versteckte Threads, idempotente parallele Writes, Audit, Sortierung und LOCKED-Zustand. DEV ausschließlich untrusted/tokenloses PUT + DELETE über Loopback mit erwartetem 503 fail-closed; **keine DEV-Mutation**. Reale authentifizierte Tunnel-/Browser-/Mobilabnahme bleibt offen.

## 22.219 – Themen sperren und entsperren (Moderation)

- Vorhandene `Thread.status` (OPEN/LOCKED), `lockedAt`, `lockedByUserId`, `lockReason` sowie `AuditLog`-Aktionen `THREAD_LOCKED`/`THREAD_UNLOCKED` werden wiederverwendet; **keine Migration**.
- `PUT /api/v1/forums/by-slug/:forumSlug/threads/:threadSlug/lock` mit streng validiertem optionalem `{reason}` (5–500 Zeichen) sperrt OPEN; `DELETE .../lock` hebt LOCKED auf und leert die Sperrmetadaten. `thread.lock` nur für MODERATOR, ADMIN und SUPERADMIN, mit ACTIVE, abgeschlossenem Onboarding und JWT-Aktoridentität; USER, TRUSTED_USER, EDITOR und LIMITED sind nicht berechtigt.
- Nur öffentlich sichtbare OPEN/LOCKED-Themen werden verändert; MERGED/ARCHIVED, inaktive Kategorien/Foren/Vereine bleiben 404. Idempotente Wiederholungen und parallele identische Requests ändern keinen zweiten Zustand und erzeugen keinen zweiten Audit. Statuswechsel und Audit mit vorherigem/nachherigem Zustand liegen in **einer Transaktion**.
- Die bestehende Antworttransaktion prüft `status=OPEN` beim atomaren Sequenz-/Beitragsschreiben. Nach einem bestätigten Lock akzeptiert die API keine neuen Antworten (409). Die Detailseite zeigt den Sperrstatus, blendet die Antwortfunktion aus und bietet Moderatoren einen expliziten Sperren-/Entsperren-Schalter mit optionaler Begründung. Öffentliche Antworten enthalten keine personenbezogenen Lock- oder Audit-Details.
- Isolierte PostgreSQL-/Redis-/HTTP-E2E prüfen Auth, Onboarding, Eingabevalidierung, Parallelität, Audit, Antwortsperre und verborgene Threads. DEV testet ausschließlich tokenlose Loopback-PUT-/DELETE-Anfragen mit erwartetem 503 fail-closed, ohne DEV-Schreibzugriffe. Echte manuelle Moderator-/Browser-/Mobil-/Tunnelabnahme bleibt offen.

## 22.220 – Sichtbare Forenthemen moderiert verschieben

- `PUT /api/v1/forums/by-slug/:forumSlug/threads/:threadSlug/move` mit strikt validiertem `{targetForumId: UUID, reason?: 5–500 Zeichen}`. Neues `thread.move` nur für ACTIVE MODERATOR/ADMIN/SUPERADMIN mit abgeschlossenem Onboarding; Moderator-ID ausschließlich aus JWT. USER, TRUSTED_USER, EDITOR und LIMITED sind nicht berechtigt.
- Quelle und Ziel müssen öffentlich sichtbare, aktive Foren und Kategorien sein; zugehörige Vereinsdatensätze müssen aktiv sein. Nur sichtbare OPEN-/LOCKED-Themen ohne Merge-Ziel sind verschiebbar. Unsichtbare Ziele/Quellen ergeben 404; bei identischem Ziel idempotent `moved:false` ohne Audit; ein Slug-Konflikt im Ziel ergibt 409 ohne Mutation.
- Die Transaktion aktualisiert ausschließlich `Thread.forumId`, löst eine bestehende Anpinnung und schreibt genau ein `THREAD_MOVED`-Audit mit vorheriger/nachheriger Zuordnung und optionalem Grund. Thread-ID, Slug, Antwortfolge, Originalbeiträge, persönliche Lesestände, Abonnements und Sperrstatus bleiben unverändert. Beim Zielwechsel ist der alte scoped URL absichtlich 404 und der neue scoped URL verfügbar. Das Audit enthält kein öffentliches Persönlichkeitsdatum.
- Vereinsforum-Detailansichten bieten eingeloggten Moderatoren die Auswahl eines anderen **öffentlichen Vereinsforums** aus der bereits vorhandenen öffentlichen Kategorienliste. Nach erfolgreichem Wechsel erfolgt die Navigation zur neuen Vereinsforum-Thread-URL; normale Mitglieder sehen keine Steuerung. Allgemeine sichtbare Zielforen sind per API zulässig, erhalten aber ohne Vereins-Slug in der vorhandenen Vereins-UI keine Navigationsoption.
- Isolierte lokale HTTP-/PostgreSQL-/Redis-E2E prüfen Rechte, Onboarding, Sichtbarkeit, Slug-Kollision, atomaren Audit, Antworten-/Abo-/Lesestand-Erhalt und gleichzeitige identische Verschiebeversuche. DEV ausschließlich tokenloser, untrusted Loopback-PUT mit erwarteter 503-Sperre; keine realen DEV-Mutationen oder Testdaten. Keine STAGING-/PROD-Änderung; positive Tunnel-/Moderator-/Desktop-/Mobilabnahme bleibt offen.

## 22.221 – Forenthemen zusammenführen (Moderation)

- `PUT /api/v1/forums/by-slug/:forumSlug/threads/:threadSlug/merge` mit strikt validiertem `{targetThreadId: UUID, reason?: 5–500 Zeichen}`. Eigenes Recht `thread.merge`, ausschließlich ACTIVE MODERATOR/ADMIN/SUPERADMIN mit abgeschlossenem Onboarding und JWT-Actor; keine Berechtigung für USER/TRUSTED_USER/EDITOR/LIMITED.
- Vorerst **nur innerhalb desselben sichtbaren Forums**: Quelle und Ziel müssen öffentlich sichtbar sein, OPEN/LOCKED und ohne Merge-Ziel. Quelle=Ziel ergibt 409. Die Quell-Thread-Zeile und Ziel-Thread-Zeile werden **in stabiler ID-Reihenfolge gesperrt** und vor Änderung erneut validiert, sodass parallele Replies/Merges keine widersprüchlichen Sequenzen erzeugen. Ein identischer Wiederholungsaufruf auf eine bereits mit genau diesem Ziel zusammengeführte Quelle liefert `merged:false` ohne doppelten Audit; andere/unsichtbare/archivierte Ziele 404.
- Eine Transaktion markiert die Quelle als MERGED und setzt `mergedIntoThreadId` auf die kanonische Ziel-ID, hängt sämtliche vorhandenen Beiträge samt gelöschter Platzhalter hinten an das Ziel an und vergibt neue Sequenznummern unter Erhalt der **Post-IDs, Parent-IDs, Autoren, Reaktionen und Reports**. Sie aktualisiert Zielzähler/letzten Post, entfernt Quell-Pin/Sperrstatus, passt bereits zusammengeführte Unterthemen direkt auf das Ziel an, überträgt Quellabos dedupliziert und erzeugt **genau ein `THREAD_MERGED`-Audit** mit Quelle/Ziel, Vorher/Nachher, Actor und optionalem Grund. Es gibt keine separate Migration und kein öffentliches Audit-Leak.
- Bestehende **Ziel-Lesestände** werden bewusst nicht vorgerückt: neue angehängte Beiträge bleiben ungelesen. Frühere Quell-Lesestände verbleiben als private historische Datensätze, statt unbemerkt fremde Ziel-Beiträge als gelesen zu markieren.
- Die normale öffentliche Detail-/Listen-API hält MERGED-Quellen versteckt (404). Ein separates `GET .../:threadSlug/merge-target` liefert ausschließlich bei einer sichtbaren MERGED-Quelle mit sichtbarem, aktivem kanonischem Ziel die öffentliche Zieladresse. Die Vereins-Detailseite leitet in diesem Fall auf das Ziel um; ein Moderator kann per begrenzter öffentlicher Themenpaginierung Zielthema und optionalen Grund auswählen und muss den irreversiblen Schritt explizit bestätigen.
- Isolierte PostgreSQL-/Redis-/HTTP-E2E prüfen 401/403, Onboarding, strenge Validierung, Konflikte, unsichtbare Ziele, parallele Idempotenz, Audit, Sequenzen, Parent/Deleted-Redaktion, Abo-Deduplizierung, unveränderte Ziel-Lesestände und kanonische Weiterleitung. DEV ausschließlich tokenloses untrusted Loopback-PUT als negatives 503-Fail-Closed-Gate; keine echte DEV-Mutation oder Testdaten, keine STAGING-/PROD-Änderung. Reale authentifizierte Moderator-/Tunnel-/Browser-/Mobil-Abnahme bleibt offen.


## 22.222 – Forenbeiträge melden und moderieren

- Gemeldete Beiträge werden als `ModerationReport(targetType=FORUM_POST, postId)` im bestehenden Moderationsmodell gespeichert. Es gibt **keine weitere Tabelle oder Migration**; das Dashboard zählt dieselben offenen Fälle. Private Meldungen sind keine öffentliche Thread-Eigenschaft.
- `POST /api/v1/forums/by-slug/:forumSlug/threads/:threadSlug/posts/:postId/reports` verlangt JWT und abgeschlossenes Onboarding; ACTIVE und LIMITED dürfen fremde sichtbare, nicht gelöschte Beiträge aus sichtbaren OPEN/LOCKED-Themen melden. BANNED und Selbstmeldungen werden blockiert; versteckte/archivierte/gemergte Quellen ergeben 404. Strikte Report-Gründe und optionale Details (max. 1000 Zeichen) folgen dem bestehenden Kommentar-Meldeschema.
- Pro Nutzer/Beitrag ist nur eine Meldung zulässig, auch nach Abschluss der ersten Meldung. Da der Bestand keine Post-Reporter-Unique-Constraint hat, schützt ein transaktionaler PostgreSQL-Advisory-Lock vor gleichzeitigen doppelten Reports. Kein neuer Index und keine DEV-Datenmigration.
- Moderation mit eigenem `forum-post.moderate`-Recht (nur ACTIVE MODERATOR/ADMIN/SUPERADMIN mit abgeschlossenem Onboarding): `GET /api/v1/moderation/forum-post-reports` zeigt höchstens 100 offene/in Prüfung befindliche Reports, nie Reporter-IDs. Bereits entfernte Posts bleiben auch im Queue-Payload redigiert.
- `POST /api/v1/moderation/forum-posts/:id/remove` entfernt einen Post mit verpflichtendem Grund nur einmal (Post-ID bleibt erhalten, Inhalte werden öffentlich redigiert) und schreibt im gleichen Transaktionsblock einen `POST_DELETED_BY_MODERATOR`-Audit. `POST /api/v1/moderation/forum-post-reports/:id/resolve` schließt mit einer validierten Entscheidung und internem Moderatorvermerk atomar ab. `ACTION_TAKEN` verlangt einen nachgewiesenen Post-Entfernungs-Audit; parallele Abschlüsse erzeugen keine doppelten Einträge.
- Die Vereinsforum-Detailseite bietet berechtigten angemeldeten Mitgliedern eine private Post-Meldemaske. Die bestehende `/admin/forum`-Ansicht enthält eine Moderatorwarteschlange mit expliziter Entfernungsbestätigung und anschließendem Report-Abschluss.
- Isolierte HTTP/PostgreSQL/Redis-E2E prüfen Auth, Self-Report, Unsichtbarkeit, unzulässige Angaben, konkurrierende Meldungen, Schutz der Warteschlange, Löschredaktion, Audit und idempotente Moderation. **Kein STAGING/PROD**, kein DEV-Seeding; tatsächliche Account-/Moderator-/Tunnel-/Mobile-Abnahme bleibt separat offen.
- **DEV-Guard-Nachweis:** Untrusted tokenlose Loopback-POSTs zu den neuen Report- und Moderationsrouten müssen fail-closed antworten (`401` AuthGuard oder `503` IP-Guard). Beide Statuscodes verhindern Schreibzugriffe; `404`/`2xx` zählen ausdrücklich nicht als bestandener Security-Gate. Der ursprüngliche 503-only-Check meldete nach erfolgreichem Merge falschen Alarm bei dem durch den AuthGuard korrekt abgewiesenen Report-POST (`401`).

### DEV-IP-Schutz beim read-only Abnahmetest

Bei aktivierter `IP_RATE_LIMIT_ENABLED`-Konfiguration werden schreibende Forum-Routen schon **vor** der Authentifizierung über den globalen IP-Rate-Limit-Guard geprüft. Ein anonymer, direkt an den lokalen API-Port gerichteter POST besitzt **keinen vertrauenswürdigen Cloudflare-Tunnel-Socket-Peer** und muss deshalb sicher mit **HTTP 503** abgewiesen werden. Der DEV-Live-Test erwartet ausdrücklich diese Sperre und sendet keine gefälschten IP-Header. Dies bestätigt **keine** Admin-RBAC-Abnahme über den echten Tunnel.

Die isolierte API-HTTP-E2E-Abnahme mit deaktiviertem optionalen IP-Guard prüft gesondert, dass anonyme Aufrufe **401**, Nicht-Admins **403** und berechtigte Admins erfolgreiche echte, idempotente PostgreSQL-Transaktionen erhalten. Der spätere reale Admin-/Tunnel-Flow und die mobile Fachabnahme bleiben eigene Gates.

## Abnahme-Gates (noch offen)

1. PR-CI: Format, Lint, Prisma-Typen, Unit-Tests, Web-Build, API-/Worker-Integration.
2. DEV-Deployment + schreibgeschützter `GET /forums/categories`-HTTP-Test muss ohne Kategorien `200` und `data=[]` ergeben; danach nach real administriertem Inhalt Sortierung und Inaktivität prüfen.
3. Manueller mobiler/Browser-Zugang zu `/forum` und `/forum/kategorie/:slug`, inkl. Fehlerzuständen und Zugänglichkeit.
4. Admin-Authentifizierungs-/Autorisierungs-Negativtests sowie Lebenszyklus-/Audit-Abnahme über echte DEV-Accounts.
5. STAGING und PROD bleiben unverändert; separate Freigaben für deren Prüfung sind erforderlich.

**Der technische Abschluss von 209 ersetzt keine Gesamtphasenabnahme 22 und schließt keinen der noch offenen 1–21-Abnahmepunkte.**
