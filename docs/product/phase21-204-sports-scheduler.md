# Phase 21.204 – Sports Scheduler

## Purpose and scope

Provide independent, safe BullMQ polling cadences for **fixtures**, **results**
and optionally **live** status updates, using the existing `sports-import`
queue (21.201), fake data provider (21.200), club matching (21.202) and match
matching (21.203). This task does **not** fetch a real sports API or write
canonical matches, scores, club data or standings.

The scheduler registers persistent BullMQ **Job Schedulers**, not in-process
timers or external cron tasks. One deterministic scheduler ID per resource
prevents duplicate schedules when the worker starts again or multiple worker
instances register the same configuration. Each occurrence receives the
existing `fetch-provider` job name, `fake-sports` provider, explicit
synthetic competition/season scope, and existing three-attempt exponential
retry settings. BullMQ generates a new job ID for each scheduled occurrence;
the import history remains specific to that occurrence.

## Configuration (worker / DEV only)

| Variable | Default | Purpose |
| --- | --- | --- |
| `SPORTS_FAKE_PROVIDER_ENABLED` | `false` | Required extra opt-in for synthetic provider |
| `SPORTS_IMPORT_SCHEDULER_ENABLED` | `false` | Global gate for sports schedules |
| `SPORTS_IMPORT_LIVE_ENABLED` | `false` | Optional third, faster schedule |
| `SPORTS_IMPORT_FIXTURES_INTERVAL_MS` | `43200000` | Fixtures, every 12 hours |
| `SPORTS_IMPORT_RESULTS_INTERVAL_MS` | `900000` | Results, every 15 minutes |
| `SPORTS_IMPORT_LIVE_INTERVAL_MS` | `60000` | Live, every 1 minute when enabled |

All interval values are positive integer **milliseconds** between 60,000
and 604,800,000 (1 minute to 7 days), inclusive. The worker environment
validator rejects invalid values on startup; the scheduler independently
rejects invalid values at the registration boundary.

To deliberately run the synthetic schedules in an **isolated DEV/test**
environment, enable both `SPORTS_FAKE_PROVIDER_ENABLED=true` and
`SPORTS_IMPORT_SCHEDULER_ENABLED=true`. Enable the separate
`SPORTS_IMPORT_LIVE_ENABLED=true` only when needed for live pipeline tests.
The DEV Compose override forwards these flags and intervals to the worker;
other environments are not modified. An enabled sports scheduler with no
enabled fake provider, or outside `development`/`test`, fails closed.
Production still rejects the fake-provider flag itself.

## Operational safeguards

- **OFF by default**: on startup, remove all three known fake scheduler IDs
  from Redis. When live is off but the overall scheduler is on, remove only
  the prior live scheduler. A disabled scheduler never enqueues another job.
- **No club polling**: club imports remain manual and separate from the three
  requested event cadences.
- **Idempotent registration**: stable IDs
  `sports-import-fake-{fixtures,results,live}-v1`. Rebooting or reapplying
  the same settings updates rather than adds scheduler identities.
- **Fail-closed cleanup**: when opt-in or cadence validation fails, remove
  all known schedules. If any upsert fails mid-registration, attempt to
  remove all three rather than leaving a partially enabled configuration.
  Such errors fail worker startup for investigation.
- **Bounded work**: existing processor limits, concurrency, Redis retry,
  DLQ routing and per-record staging/matching checks are unchanged.
- **No side effects without explicit opt-in**: the worker never installs
  these schedules on a default DEV deployment. BullMQ can materialize the
  first scheduled job when a Job Scheduler is first installed; deliberately
  enabling the scheduler is permission to run the synthetic import.
- **Shutdown/reconfiguration**: schedules persist in Redis across worker
  restarts and are reconciled at each startup. Pending jobs already created
  by a previous schedule are not automatically deleted by removing its
  scheduler; the existing processor still checks its own DEV/fake flag.
- **No live API or dynamic time windows yet**: the fake feed has fixed
  deterministic sample records. The scheduler deliberately supplies no
  rolling window until real provider-specific time-window policies are
  introduced and reviewed. Do not extrapolate synthetic feeds to real live
  score publication.

## Verification and known acceptance gap

`sports-import-scheduler.service.spec.ts` exercises default cleanup,
two different cadences, optional live polling, scheduler-ID idempotence,
production/missing-flag guards, invalid intervals and partial Redis failure
rollback. `env.validation.spec.ts` checks off-by-default settings, explicit
DEV opt-in and interval boundaries. Existing processor and matching tests
continue to apply. Verify format, lint, typecheck, tests, build, isolated
API E2E, Redis/gateway and Docker CI; merge only after all succeed, then
check DEV deployment and automated safe branch pruning.

The separate task **21.201** acceptance item – a full scheduled or manual
worker execution against isolated, real Redis and PostgreSQL – remains open
until demonstrated end-to-end. Unit/CI checks and successful DEV deployment
do not by themselves establish that the live scheduler has been intentionally
enabled, that a real import occurred, or that real results are publishable.

**No STAGING/PROD changes, no external sports API credentials, no canonical
fixture/result/standings writes.**
