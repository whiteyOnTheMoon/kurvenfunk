# Phase 22 – Forum (Masterplan 209–223)

Stand: 11.11.2026. Entwicklungsbasis: `develop` nach erfolgreich verifiziertem DEV-Datenreset und Startseitenfix. **Vorherige Abnahmen bleiben offen, wo sie nicht ausdrücklich nachgewiesen sind.**

## Aufgaben und Umsetzungsslices

| Masterplan | Inhalt | Vorgehen | Nachweisstatus |
| --- | --- | --- | --- |
| 209 | Forenkategorien | Öffentliche aktive Kategorien, sortierte Unterforen, schreibgeschützte Leerliste bei sauberer DEV-Datenbank; rollenbasierte Verwaltung mit Audit | **Technisch in DEV geprüft** – Actions #43032913255: API 200, 0 Kategorien, anonymes Admin-Gate 401, Web 200 |
| 210 | Vereinsforen | Clubs referenzieren, Vereinsforen bei kontrollierter realer Club-Verwaltung zuordnen, idempotent und ohne Fakedaten | **Implementierung in Arbeit (PR nach CI)** |
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

**Abnahme 210 bleibt offen**, bis die CI, ein DEV-only-Live-HTTP-Gate, ein realer Admin-Provisionierungsflow und mobile Browserprüfungen nachweisbar erfolgreich sind.

## Abnahme-Gates (noch offen)

1. PR-CI: Format, Lint, Prisma-Typen, Unit-Tests, Web-Build, API-/Worker-Integration.
2. DEV-Deployment + schreibgeschützter `GET /forums/categories`-HTTP-Test muss ohne Kategorien `200` und `data=[]` ergeben; danach nach real administriertem Inhalt Sortierung und Inaktivität prüfen.
3. Manueller mobiler/Browser-Zugang zu `/forum` und `/forum/kategorie/:slug`, inkl. Fehlerzuständen und Zugänglichkeit.
4. Admin-Authentifizierungs-/Autorisierungs-Negativtests sowie Lebenszyklus-/Audit-Abnahme über echte DEV-Accounts.
5. STAGING und PROD bleiben unverändert; separate Freigaben für deren Prüfung sind erforderlich.

**Der technische Abschluss von 209 ersetzt keine Gesamtphasenabnahme 22 und schließt keinen der noch offenen 1–21-Abnahmepunkte.**
