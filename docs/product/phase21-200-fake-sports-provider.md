# Phase 21.200 – Fake Sports Provider

## Purpose and acceptance boundary

Use the stable `SportsProvider` contract from Task 199 to exercise the
sport-data retrieval boundary entirely offline. This task deliberately does
**not** import external records into canonical `Club`/`Match`/`Standing`
tables. The `sports-import` queue, persistence, retry orchestration, provider
matching and scheduler remain Tasks 201–204.

## Deterministic synthetic feed

`apps/api/src/modules/providers/fake-sports-provider.ts` implements the
shared `@kurvenfunk/types` interface. Key: `fake-sports`.

Use only this synthetic scope:

- `competitionExternalId = fake-austrian-league`
- `seasonExternalId = fake-2026-27`
- `resource` is one of `clubs`, `fixtures`, `results`, `live`.

All IDs are prefixed `fake-` and **are not** real Kurvenfunk UUIDs or
external provider identifiers. Four fictional clubs and eight games cover:
three final results (including a draw), one LIVE match with scores, one
SCHEDULED, one POSTPONED, one CANCELLED and one ABANDONED fixture.
These are not a real or complete Austrian Bundesliga season. Do not use them
to calculate or publish a real standings table.

Each request returns at most two records. Pagination uses a deterministic
`f1:<query fingerprint>:<offset>` cursor. A cursor is valid only for the same
resource, competition, season and time-window query. Malformed, reused for
another query, unaligned or out-of-range cursors are rejected. Fixture/result/
live timestamps are filtered inclusively by UTC kickoff. Clubs have no kickoff
and are therefore unaffected by the optional time window.

The `fail-once` test scenario throws `FAKE_SPORTS_TRANSIENT_FAILURE`
only for the first call on a given instance and then returns normal pages.
It is available to tests through `new FakeSportsProvider('fail-once')`.
No clocks, randomness, external traffic, secrets or writes are involved.
The registry validates every returned record and removes untrusted properties.

## Environment and registration

By default `SportsProviderRegistry` has **no registered fake adapter**.
For an intentionally enabled development/test application instance:

```dotenv
NODE_ENV=development
SPORTS_FAKE_PROVIDER_ENABLED=true
```

The opt-in is declared in `.env.example` with the safe default `false`,
validated as a strict `true|false` string by API environment validation, and
forwarded **only in the DEV Compose override**. Setting the flag to `true`
outside `development` or `test` fails startup
(`FAKE_SPORTS_FORBIDDEN_ENVIRONMENT`); STAGING/PROD never register it by
default. This flag only registers the in-memory adapter with NestJS; it does
not queue imports, expose HTTP endpoints, touch PostgreSQL or start a poller.

## Verification

`apps/api/src/modules/providers/fake-sports-provider.spec.ts` tests:

- Full two-record page walkthrough for club, fixture, result and live feeds;
- six match statuses, final/live score shape and unique external IDs;
- deterministic output and protection against mutation of returned records;
- inclusive time windows and strict query-bound cursor safety;
- unknown scope, invalid windows and intentional one-shot failure/recovery;
- NestJS disabled-by-default and explicit opt-in paths plus a production
  startup-rejection test.

Run the existing CI gates (format, lint, typecheck, Jest, build, isolated API
E2E and Docker) before review. Task 200 depends on Task 199 / PR #114.
While PR #114 remains open, the Task 200 PR is based on its tested head;
**merge 199 first**, then review the reduced Task 200 diff against `develop`.
No automatic merge or deployment; DEV-only deployment after approval.
