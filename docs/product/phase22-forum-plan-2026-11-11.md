# Phase 22 – Forum (Masterplan 209–223)

Stand: 11.11.2026. Entwicklungsbasis: `develop` nach erfolgreich verifiziertem DEV-Datenreset und Startseitenfix. **Vorherige Abnahmen bleiben offen, wo sie nicht ausdrücklich nachgewiesen sind.**

## Aufgaben und Umsetzungsslices

| Masterplan | Inhalt | Vorgehen | Nachweisstatus |
| --- | --- | --- | --- |
| 209 | Forenkategorien | Öffentliche aktive Kategorien, sortierte Unterforen, schreibgeschützte Leerliste bei sauberer DEV-Datenbank; rollenbasierte Verwaltung mit Audit | **Technisch in DEV geprüft** – Actions #43032913255: API 200, 0 Kategorien, anonymes Admin-Gate 401, Web 200 |
| 210 | Vereinsforen | Clubs referenzieren, Vereinsforen bei kontrollierter realer Club-Verwaltung zuordnen, idempotent und ohne Fakedaten | **Code in `develop` integriert (PR #158/#159), PR-CI #43076528691 PASS; DEV-Endabnahme offen (Issue #160)** |
| 211–213 | Threads, Posts, Replies | Status-/Onboarding-Permissions, atomare Eröffnung mit erstem Beitrag, Thread-Grenzen für Antworten | Ausstehend |
| 214–217 | Paginierung, Abos, Ungelesen, Leseposition | Stabile Cursor/Sequenzen und persönliche Read-States | Ausstehend |
| 218–221 | Pin, Lock, Move, Merge | Moderatorenrechte, Audits, konsistente kanonische Thread-Identitäten | Ausstehend |
| 222 | Forum-Reports | Anschluss an bestehendes Report-/Moderationssystem | Ausstehend |
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
- **Noch kein unabhängig verifizierter Gesamt-PASS des DEV-Push-Laufs nach #159**; keine Aussage über bestandene reale Tunnel-Admin-RBAC- und Mobilbrowser-Abnahme.
- Alle fehlenden Nachweise werden in [Issue #160](https://github.com/whiteyOnTheMoon/kurvenfunk/issues/160) einzeln geführt.

**Abnahme 210 bleibt offen**, bis die vollständige DEV-Deployment-/HTTP-Prüfung, ein realer Admin-Provisionierungsflow über den vertrauenswürdigen Tunnel und mobile Browserprüfungen nachweisbar erfolgreich sind.

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
