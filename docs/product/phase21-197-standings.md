# Phase 21.197 – Standings (canonical table rows)

Phase 21.197 introduces a manual, audited, provider-independent table row
management workflow. **Calculating standings from results is Task 21.198**.
Existing public `GET /api/v1/standings/:competitionSlug` remains unchanged.

## API

- `GET /api/v1/standings/season/:seasonId` — historical, public, **season-wide** table.
- `GET /api/v1/standings/season/:seasonId?stageId=<uuid>` — explicit Stage table.
  An unknown or other-season Stage is rejected, not silently substituted.
- `GET /api/v1/standings/admin/season/:seasonId[?stageId=...]` — authorized admin list.
- `POST /api/v1/standings/admin/season/:seasonId/rows` — add one table row
  for an existing canonical Club in the Season and optional Stage.
- `PATCH /api/v1/standings/admin/rows/:id` — correct a row's sporting stats,
  rank, deductions and sort order. Requires `expectedUpdatedAt` to prevent
  overwriting concurrent edits.

Only ACTIVE ADMIN/SUPERADMIN have `standing.manage`. All writes are
transactionally audited. No DELETE API. Competition, Season, Stage, Club and
Standing UUIDs are immutable on update. Inactive clubs remain represented
for historical tables. No provider-specific identifiers or rights assumptions.

Stat invariants: `played = won + drawn + lost`, nonnegative counters,
`goalDifference = goalsFor - goalsAgainst` calculated server-side. The
canonical `points` field is editable independently from a naïve 3/1 formula
to support league rules, point deductions and historic corrections.

A partial UNIQUE index closes the nullable-stage uniqueness hole in Prisma:
no duplicate rows for the same Season and Club with no Stage. Existing
Stage-specific `@@unique([seasonId, stageId, clubId])` remains in force.

Manual ranking input is authoritative for 197. Table sorting by
`position`, `sortOrder`, `id` is deterministic, with no implicit tie-breaking
calculation. Automated tables, Austrian Bundesliga split/halving rules, and
rank derivation belong to Phase 21.198, not this task. A future batch
re-ranking workflow may be needed for broader official provider use.

## Acceptance

CI, isolated signed-JWT/PostgreSQL E2E, DEV deployment and healthchecks.
Manual visual confirmation of the Admin UI is separate. STAGING and PROD
remain untouched.
