# Phase 21.193 – Season Management

## Scope

Manage distinct canonical seasons of Austrian Bundesliga, 2. Liga and ÖFB Cup without
changing the identity of a competition. Current edition is derived from season status,
not from mutable Competition.currentSeasonId.

## API

- `GET /api/v1/seasons/competition/:competitionSlug`: public season archive, including inactive seasons and competitions.
- `GET /api/v1/seasons/competition/:competitionSlug/current`: public current active season; 404 when none.
- `GET /api/v1/seasons/competition/:competitionSlug/:seasonSlug`: public immutable season slug lookup.
- `POST /api/v1/seasons/competition/:competitionSlug`: ADMIN/SUPERADMIN create, audit log.
- `PATCH /api/v1/seasons/:id`: ADMIN/SUPERADMIN metadata and lifecycle changes, audit log.
- No deletion route. No slug or competition reassignment.

Names, calendar dates (YYYY-MM-DD), stable slugs, four lifecycle statuses and
`startDate <= endDate` are validated. `active` is derived from `status === 'ACTIVE'`.
The API refuses activation while another season is current (409), rather than silently
completing or modifying historic editions. An advisory transaction lock serializes
writes by competition, and a partial unique PostgreSQL index enforces the single-current
invariant even for other writers.

`@db.Date` values are stored as UTC midnight for transport, but represent calendar
dates, **not** fixture kickoff timestamps.

## Admin and safety

The existing `/admin/sportdaten` page includes season creation, selection by competition,
editing, lifecycle status and archive. Season writes require `season.manage`, which is
restricted to active ADMIN/SUPERADMIN. LIMITED and BANNED are denied.

Seed is safe to rerun: existing season dates, name, lifecycle status and active flag are
never overwritten by example data. New installations still get the initial 2026/27 data.

No API-Football credentials or production provider ingestion in this task. Task 199 and
following tasks integrate external data only through a provider interface.

## Acceptance

- Validate the HTTP/API auth and conflict cases in isolated PostgreSQL/Redis/JWT E2E.
- Verify migration and collision behavior, historical lookups and immutable slug.
- Review the DEV UI after green CI; do not mark DONE without DEV acceptance.
- PR for Task 193 is stacked on Task 192 until Task 192 CI/DEV acceptance is complete.
