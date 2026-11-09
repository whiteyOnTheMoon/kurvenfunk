# Phase 21.195 – Match Management

Manage canonical match **fixtures**; scores, live states and final results belong
to Task 196 (Results), not Task 195. Provider matching/import is handled later
in Tasks 199–205.

## Contracts

- Existing public `GET /api/v1/matches?competition=<slug>` and
  `GET /api/v1/matches/:id` stay unchanged.
- `GET /api/v1/matches/admin/season/:seasonId` (ADMIN/SUPERADMIN):
  all fixtures in an existing season, including past scores and inactive clubs,
  with stage and competition metadata.
- `POST /api/v1/matches` (ADMIN/SUPERADMIN): create a scheduled/postponed/cancelled
  fixture for an existing competition/season with two distinct, active clubs.
  Optional stage must belong to the season. Score always begins null.
- `PATCH /api/v1/matches/:id` (ADMIN/SUPERADMIN): update teams, stage, kickoff,
  matchday or scheduling status. Never change competition or season identity.
  Games in LIVE, FINISHED, ABANDONED state or games with existing scores are
  locked in this interface; Task 196 is responsible for result editing.
- There is no fixture DELETE endpoint.

Permissions are `match.manage`, only ACTIVE ADMIN/SUPERADMIN. All writes are
transactional and audited with before/after metadata. Validation rejects malformed
UUID, timezone-less kickoff, matchday outside 1–999, both clubs equal and any
attempt to set scores, provider IDs, season or competition during edits.

Identity is the UUID, not kickoff. Rescheduling a fixture updates the original
match. A database unique index rejects exact duplicates of the same season,
home/away pairing and kickoff, while allowing different matchdays or repeat
fixtures with different kickoffs.

Seed examples are **DEV-only, synthetic and non-authoritative**. After a season
already contains fixture data, rerunning the seed does not reinsert outdated
kickoffs or overwrite admin-managed fixtures. No real sports API key is required.

## Acceptance

Run tests for role restrictions, invalid data, competition/season and stage
mismatch, duplicate prevention, postponement and rescheduling, preserved UUIDs,
result-locking, audit and public backward compatibility. Merge to `develop`
only after complete green CI; confirm DEV deployment health. STAGING and PROD
must not be modified. Visual/manual DEV UI sign-off remains separate.
