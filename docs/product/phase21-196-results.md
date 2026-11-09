# Phase 21.196 – Results

Provide an operator-controlled, provider-independent score and match-status
workflow. Use the existing canonical `Match` fields; no separate result model
or migration is required.

## Contract

`PATCH /api/v1/matches/:id/result`: authenticated ACTIVE ADMIN/SUPERADMIN
with `result.manage`, accepting exactly:

- `status`: LIVE, FINISHED or ABANDONED
- `homeScore` and `awayScore`: two scores in 0..999, or both null to express
  an unknown score
- `expectedUpdatedAt`: ISO timestamp from the latest match view, required
  for optimistic concurrency protection

FINISHED requires both final scores, including valid 0–0. Unknown `null` is
not equivalent to zero. LIVE and ABANDONED may have unknown scores (both null)
or known scores. The request fully replaces the score/status tuple, never
modifies fixture identity, team IDs, matchday or kickoff.

Permitted status transitions:

- SCHEDULED -> LIVE, FINISHED (historical backfill), ABANDONED
- LIVE -> LIVE (score update), FINISHED, ABANDONED
- FINISHED -> FINISHED (score correction)
- ABANDONED -> ABANDONED (partial-score correction)
- POSTPONED and CANCELLED remain outside the result editor; return to SCHEDULED
  through Task 195 fixture management before entering a result state

No implicit rollback of a final result to a scheduled game. Such changes
require a controlled correction workflow (Task 205). A result correction is
audited transactionally with before/after status, scores and timestamps.

The service uses a compare-and-swap update and monotonic updatedAt value.
A stale browser/provider edit returns HTTP 409 and must be reloaded.
Concurrent changes by Task 195's fixture editor use the same row-version
condition, so result data cannot be silently overwritten.

The existing public match detail and schedule endpoints already expose
`status`, `homeScore` and `awayScore` and remain backward compatible.
The operator UI is available in `/admin/sportdaten`, with match and season
selectors and explicit result editing. No provider API is used.

## Out of scope

- Penalty shootout, extra-time breakdown, awarded/administrative scores,
  event timelines, official score provider mapping
- Table materialization/standings calculation (Tasks 197–198)
- Automatically importing or overwriting provider results (Tasks 199–205)
- STAGING/PROD modifications

## Acceptance

Signed-JWT HTTP/PostgreSQL isolated E2E tests cover role restrictions, all
score invariants, lifecycle changes, stale revisions, 0–0, corrections,
transactional audit, public reads and Task-195 locking. CI and DEV health
must pass. Human browser review remains a separate acceptance step.
