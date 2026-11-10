# Phase 21.201 – Real Worker / PostgreSQL / Redis Acceptance

## Scope

The new `phase21-201-real-queue` CI job runs after the mandatory format,
lint, TypeScript, unit-test and build checks, on every pull request to
`develop`/ `main`. It is **not** an in-memory BullMQ mock.

The job launches an ephemeral PostgreSQL 17 and password-protected Redis 7.4
with isolated ports, applies real Prisma migrations, builds the real Nest
worker and runs the same `SportsImportQueueService` as production code.
The fake provider is explicitly enabled **only inside that isolated test
runtime** (NODE_ENV=test). Neither DEV nor production receives synthetic jobs.

## Assertions

- Real queue producer enqueues club, fixture, result and live feeds.
- Running worker consumes BullMQ jobs, persists ImportJob, RawPayload and
  ImportRecord rows in PostgreSQL, checkpoints and completes.
- Repeating an identical payload uses the same Redis job ID; no duplicated
  import history.
- A provider error is retried three times and ends in a redacted dead-letter
  job and persisted ImportJob DEAD_LETTER status.
- **Zero writes** to canonical Club, Match and Standing tables.
- The CI runner deletes both disposable database containers on exit.

No shared database, DEV Redis instance, STAGING, PROD, secrets from the app,
or editorial records are accessed. This is a true isolated integration
acceptance; a separate read-only DEV runtime/flag audit confirms that synthetic
imports remain disabled on shared DEV.

The CI run must pass before Phase 21.201 can be marked technically complete.

## Acceptance record / release gate

The PR CI job must report `success` (not `skipped`) on the **current** commit before 21.201 is closed. The latest merged push job alone cannot prove this because the real queue test intentionally runs only on pull requests. Verify the exact run ID, the four resource feeds, retry/dead-letter, deduplication, and zero canonical writes from the job log. The fake provider and its fixtures must remain isolated to test-only containers and must never be enabled in shared DEV.
