# Phase 21.198 – Standings Calculation

Task 198 turns authoritative canonical FINISHED Match results into a **preview**
of the table and, only with explicit administrator confirmation, persists
canonical Standing rows. It does not schedule background imports; that belongs
to later provider/scheduler tasks. It never silently overwrites the manual
Task 197 table.

## Season-specific rules

- Ordinary league tables use 3 points for a win, 1 for a draw, 0 for a loss.
  Played, W/D/L, goals, goal difference and points derive from finished matches.
  LIVE, POSTPONED, CANCELLED, SCHEDULED and ABANDONED are not counted.
  An invalid FINISHED score fails closed instead of silently treating NULL as 0.
- Austrian Bundesliga from **2026/27 onward**: 12 clubs play 22 rounds,
  top six enter Meistergruppe and bottom six enter Qualifikationsgruppe;
  **NO POINT HALVING**; all points, goals, games and direct duels from the
  Grunddurchgang are carried into the group. A stage-specific preview requires
  an explicit six-club group roster from its fixtures/table rows and a fully
  completed 12-club, 22-game-per-club Grunddurchgang.
- Austrian Bundesliga **2018/19 through 2025/26**: same grouping, but
  regular-season *net* points are halved and rounded down. The historical
  rounded-down-half-point priority is the first tie-breaker in final groups.
  Goal statistics, W/D/L and direct meetings carry over without halving.
  Other historical formats are rejected rather than assumed.
- Austrian Bundesliga 2026/27 tie-breaks: points, direct-duel mini-table
  (points, GD, goals), overall GD, goals, wins, away wins, away goals.
  Historic final groups apply rounded-down-half-point priority before direct
  meetings. Any fully unresolved tie blocks automatic publication; it is not
  arbitrarily resolved by alphabetic club IDs.
- For other league competitions, generic fallback is points, GD, goals,
  wins, away wins, away goals. Some competitions may have different official
  rules; these profiles must be added and tested before using the output as
  an official table.

Sources: [Austrian Bundesliga 2026/27 rules](https://www.bundesliga.at/de/news/artikel/alles-wissenswerte-zur-saison-2026-27),
[Austrian Bundesliga no-halving decision (2025-10-15)](https://www.bundesliga.at/de/news/artikel/neu-ab-2026-27-keine-punkteteilung-neuer-tv-verteilungsschluessel-inkl-oesterreicher-topf),
[historical 2025/26 rules](https://www.bundesliga.at/de/news/artikel/alles-wissenswerte-zur-saison-2025-26).

## API

All endpoints require ACTIVE ADMIN/SUPERADMIN `standing.manage`:
- `POST /api/v1/standings/admin/season/:seasonId/calculate/preview`
  body `{"stageId":null}` or explicit Stage UUID
- `POST /api/v1/standings/admin/season/:seasonId/calculate/apply`
  body `{"stageId":null,"expectedPreviewHash":"<sha256>","overwriteExisting":false}`

Preview does not write to the database. It returns match counts, rule
profile, ranked proposed rows, canonical-versus-proposed differences, unresolved
ties, existing row count, a SHA-256 source fingerprint and `canApply`.

Apply recomputes inside a Serializable PostgreSQL transaction, acquires a
scope-specific advisory lock, compares the fingerprint, rejects conflicts
with HTTP 409, and requires `overwriteExisting:true` for existing table rows.
It updates rows in place (stable Standing UUIDs), creates missing rows,
does not delete extras and creates transactional per-row audit entries with
source fingerprint and the before/after stats. Unchanged rows are left
untouched. A later score correction requires a fresh preview/apply; automatic
import-triggered rebuilds are not enabled in this task.

Manual point deductions from Task 197 are preserved; points are net of these
deductions. In group stages, regular-stage deductions are reflected in the
carried net points, while separate group-stage deductions remain independent.
Cup knockouts are not league tables and are refused.

## Limits and operational safety

Stage membership for Bundesliga groups must be explicit and complete; the
calculator never guesses which six clubs qualify from partial inputs.
No automatic deletion or reassignment of Clubs. A tie that remains unresolved
under the supported sporting criteria cannot receive an invented definitive
rank; admins may maintain official corrections through Task 197.

The `/admin/sportdaten` table editor displays the preview, clear warnings,
explicit overwrite acknowledgment and an apply button. No result-provider key
is required. Isolated E2E uses disposable PostgreSQL/Redis, local signed JWTs.
Deploy exclusively via develop to DEV, not staging or production.
