# Phase 22 – Forum (Masterplan 209–223)

Stand: 11.11.2026. Entwicklungsbasis: `develop` nach erfolgreich verifiziertem DEV-Datenreset und Startseitenfix. **Vorherige Abnahmen bleiben offen, wo sie nicht ausdrücklich nachgewiesen sind.**

## Aufgaben und Umsetzungsslices

| Masterplan | Inhalt | Vorgehen | Nachweisstatus |
| --- | --- | --- | --- |
| 209 | Forenkategorien | Öffentliche aktive Kategorien, sortierte Unterforen, schreibgeschützte Leerliste bei sauberer DEV-Datenbank; rollenbasierte Verwaltung mit Audit | **Implementierung in Arbeit** |
| 210 | Vereinsforen | Clubs referenzieren, Vereinsforen bei kontrollierter realer Club-Verwaltung zuordnen, idempotent und ohne Fakedaten | Ausstehend |
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

## Abnahme-Gates (noch offen)

1. PR-CI: Format, Lint, Prisma-Typen, Unit-Tests, Web-Build, API-/Worker-Integration.
2. DEV-Deployment + schreibgeschützter `GET /forums/categories`-HTTP-Test muss ohne Kategorien `200` und `data=[]` ergeben; danach nach real administriertem Inhalt Sortierung und Inaktivität prüfen.
3. Manueller mobiler/Browser-Zugang zu `/forum` und `/forum/kategorie/:slug`, inkl. Fehlerzuständen und Zugänglichkeit.
4. Admin-Authentifizierungs-/Autorisierungs-Negativtests sowie Lebenszyklus-/Audit-Abnahme über echte DEV-Accounts.
5. STAGING und PROD bleiben unverändert; separate Freigaben für deren Prüfung sind erforderlich.

**Der technische Abschluss von 209 ersetzt keine Gesamtphasenabnahme 22 und schließt keinen der noch offenen 1–21-Abnahmepunkte.**
