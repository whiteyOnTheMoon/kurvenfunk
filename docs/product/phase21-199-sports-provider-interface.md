# Phase 21.199 – Sports Provider Interface

**Scope:** Decouple third-party football APIs from Kurvenfunk's canonical
Competition, Season, Club, Match, Result and Standing models. This is the
contract/foundation task; it does **not** connect a commercial provider, import
data or schedule jobs.

## Contract and lifecycle

- Shared, dependency-light TypeScript contract:
  `packages/types/src/sports-provider.ts`, exported by `@kurvenfunk/types`.
- Adapters implement `SportsProvider` with a unique lowercase `key`, a
  descriptive `name`, declared `capabilities` and one asynchronous
  `fetch(input)` operation.
- Four resource kinds: `clubs`, `fixtures`, `results`, `live`.
  Requests carry the provider's opaque **external** competition/season IDs,
  optional UTC ISO time window and an opaque pagination cursor.
- Adapters translate vendor-specific payloads and authentication internally;
  no vendor response or API key belongs in the shared contract. Each page
  returns normalized club or match records and optionally `nextCursor`.
- `SportsProviderRegistry` in `apps/api/src/modules/providers/` is an
  injectable, exported NestJS provider. Only trusted application bootstrap
  code registers adapters; no HTTP endpoint dynamically configures them.
  Unknown keys, duplicate registrations, missing capabilities and unsupported
  resources fail closed.
- Registry validates input time windows, strictly typed club/match records,
  UTC kickoff, legal match statuses and score consistency; it also rejects
  duplicate external IDs, pages larger than 500 and repeated/invalid cursors.
  It emits only allowlisted normalized fields, never raw vendor extensions.
- Provider external IDs are scoped by `provider.key` and are **not** Kurvenfunk
  UUIDs. Matching and reconciliation against canonical entities must be
  explicit, audited and idempotent; this interface must not save records
  directly or trigger a standings recalculation.

## Future integration

1. **200 Fake Sports Provider:** implement this interface and register the
   deterministic test adapter at application bootstrap. Exercise pagination,
   statuses and both successful/error responses without network access.
2. **201 Sports Import Queue:** let the worker consume adapter pages through
   the same boundary, apply retry/rate-limit semantics, and persist import
   attempts separately from canonical data. Never auto-publish provider data.
3. **202–203 Matching:** resolve `(provider.key, externalId)` to reviewed
   canonical club/match IDs. Unmatched, ambiguous or changed external data
   stays in review; no guessed associations.
4. **204 Scheduler:** add independently configurable, observable fixtures,
   results and live polling. Provider credentials stay in per-environment
   secrets; do not enable a live provider without explicit approval.
5. **205 Corrections:** allow authorized human review/correction with audit
   before canonical writes. Existing 192–198 admin CRUD and guarded standings
   calculation remain the source of truth.

## Verification and safety

Unit tests in `sports-provider.registry.spec.ts` cover Nest registration,
capability gates, club/fixture/result shapes, unauthorized or malformed data,
time windows, inconsistent scores, duplicate IDs and pagination limits.
There are no new environment variables, schema migrations, queue consumers,
automatic jobs, external API calls or public endpoints in this task.

Deploy only to DEV via the established reviewed `develop` PR and CI gates.
No STAGING/PROD deployment or provider secrets.
