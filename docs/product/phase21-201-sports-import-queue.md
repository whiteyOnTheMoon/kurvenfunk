# Phase 21.201 – Sports Import Queue

## Scope and operational gate

The existing BullMQ queue name `sports-import` is wired to a real NestJS
worker processor. It stages **synthetic** provider records in the existing
Provider / ImportJob / RawPayload / ImportRecord tables, **never** canonical
Club/Match/Standing rows.

This task does not enable a scheduler (21.204), third-party provider adapters,
club or match matching (21.202/203), or automatic corrections (21.205).
It deliberately has no HTTP import endpoint and no startup-created jobs.

## Internal contract

`SportsImportJobPayload` requires `providerKey`, `resource`,
`competitionExternalId`, and `seasonExternalId`; optional `windowStart` /
`windowEnd` are UTC timestamps. Only the `fake-sports` adapter and the
`fake-austrian-league` / `fake-2026-27` external scope are supported. Input is
strictly validated twice: by the internal producer before enqueue and by the
processor after Redis deserialization.

`SportsImportQueueService.enqueue(payload)` provides a safe internal
producer for later manual-control and scheduler tasks. Identical payloads
receive the same SHA-256 BullMQ `jobId` so active duplicate requests do not
create competing tasks. No caller currently schedules or invokes it by
default.

Queue processing is limited to one active job per worker instance, 50 pages
and 5,000 records per job; pages over 500 records are rejected. Each page
checks for cursor loops and checkpoints progress after records are durably
staged. Incomplete jobs can restart from their first page; import-record
writes are idempotent for the same `(importJobId, recordType, externalId)`
under a transaction-scoped PostgreSQL advisory lock. A changed record during
the same retry fails closed.

The processor uses the offline shared `FakeSportsProvider` from
`@kurvenfunk/types`, which is also re-exported at its original API path so
21.200 callers keep working. No network request, external API credential or
canonical data modification is required.

## Import history, retry, dead letters

- A `Provider` row has `type=SPORTS`; disabled/conflicting provider rows
  are **not** silently activated.
- The `ImportJob` row is `RUNNING` then `SUCCEEDED` or `FAILED`, with
  `queueJobId`, timestamps, cursor checkpoints and received/processed counts.
- A normalized synthetic record is atomically stored with a SHA-256
  `RawPayload` of type `RECORD` and an `ImportRecord` with
  `REVIEW_REQUIRED`. No internal UUID is inferred from an external ID.
- Failures persist a bounded error code, not raw vendor payloads, credentials
  or exception text. BullMQ retries up to three times with exponential
  backoff, starting at 2 seconds. After the final failure, a separate
  `sports-import-dead-letter` queue holds a safe redacted job summary;
  the associated import history becomes `DEAD_LETTER`.
- Existing `news-import` behavior and schemas are unchanged.

## Safety and enablement

Default OFF. Worker and API both require the explicit
`SPORTS_FAKE_PROVIDER_ENABLED=true` and `NODE_ENV=development` (or a
test runtime). The DEV Compose override forwards the flag to both.
Worker startup refuses an enabled fake provider in production. STAGING and
PROD configuration files remain untouched. No automatic enqueues occur.

**Do not enable this flag with real user data or execute synthetic imports
against a shared production database.** Use isolated PostgreSQL/Redis test
instances for acceptance and short-lived synthetic test data.

## Verification

Unit tests cover the producer's deduplication and guard, whole fake feed
pagination (clubs, fixtures, results and live), disabled/invalid inputs,
per-job idempotent persistence, safe failure status and final-attempt DLQ
routing. Normal CI also exercises the existing isolated API-E2E and Docker
build workflows. Queue-integration with real Redis/worker and DEV synthetic
import acceptance is separately required before declaring **DEV DONE**;
unit tests alone are not proof of that operational flow.

After review, merge into `develop` only (automatic DEV deployment); no
STAGING or PROD changes. The opt-in branch cleanup workflow reuses the
existing protected/open-branch-preserving script and is triggered explicitly
by `[phase21-branch-cleanup]` in the tested merge commit after a successful
DEV deployment.
