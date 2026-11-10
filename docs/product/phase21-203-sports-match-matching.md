# Phase 21.203 – Sports Match Matching

## Scope

The existing `sports-import` worker now matches synthetic `fixtures`,
`results` and `live` records against existing canonical `Match` rows
*after* the raw data has been staged by task 21.201. The service only writes
`EntityMatch` and `ImportRecord` history; it never creates or changes
canonical `Match`, `Club`, `Season`, `Competition` or `Standing` data.

No external API is connected. `SPORTS_FAKE_PROVIDER_ENABLED` remains
**disabled by default** and usable only in DEV/test. Task 21.205 will provide
the separate human review/correction interface; 21.204 covers scheduling.

## Resolution rules

1. Require an existing, integrity-checked staging record for the same
   `(importJobId, providerId, externalId, recordType)`. Validate its SHA-256
   content hash against the exact normalized record. Fixture imports use
   `SPORTS_MATCH`, results/live use `SPORTS_RESULT`.
2. Within an advisory-locked transaction, load any prior provider-scoped
   `EntityMatch` for the external **match ID**.
3. Respect reviewed records, rejected provider bindings and any existing
   manual match. A previous confirmed binding may be reused only if the
   canonical match still has the expected competition, season, ordered
   home/away clubs and kickoff/matchday identity. Changed identity is review,
   **not** automatic reassignment.
4. Without a prior approved binding, require explicit, `MATCHED` provider
   mappings for both clubs, the competition and season. No guessed
   competition/season from display names. Check that the canonical season
   belongs to the canonical competition and both clubs still exist and are
   active.
5. Search for matches inside this exact competition, season, **ordered**
   home/away pair, matching matchday (if supplied) and UTC kickoff within
   **±15 minutes**, inclusive. Zero candidates are `UNMATCHED`; more than
   one distinct candidate is `AMBIGUOUS`. Never choose a closest match.
   Reverse home/away, another season, or different competition do not match.
6. Before accepting a candidate, reject if another `MATCHED` external
   match ID of the **same provider** already points to that canonical match.
7. Save a `COMPOSITE`/HIGH-confidence mapping when and only when unique.
   Other cases remain `REVIEW_REQUIRED` or `UNMATCHED`/`AMBIGUOUS` in
   `EntityMatch`; staged `ImportRecord` remains `REVIEW_REQUIRED`.

External `stageExternalId` is retained as evidence but **does not imply a
canonical stage mapping**; without one the resolver still requires a unique
candidate in the whole season. Fixture status, scores and results are never
used as identity criteria. A provider score may differ from the canonical
score without triggering an automatic write. Matching across future feed
updates is idempotent using the stable external provider ID.

A fixed lock namespace `203` and provider-scoped external ID protect
parallel retries; the transaction updates the import history and mapping
atomically. Any persistence error fails the BullMQ job for existing retry and
dead-letter handling. Already staged records are re-evaluated on retry even
when the raw record was not duplicated.

## Tests and acceptance

- Pure resolution tests: exact ordered pair, season and competition, 15-minute
  kickoff tolerance, optional matchday, duplicates, ambiguity and invalid
  dates.
- Service tests: explicit prerequisite bindings, staging hash, missing
  scope/clubs, inactive or inconsistent scope, no canonical candidate,
  collisions, duplicate external IDs, manual/rejected review protection and
  stable replay.
- Worker tests: fixture/result/live routing, no club misrouting, idempotent
  retry and failed mapping propagation.

Run repository CI (Prettier, lint, typecheck, unit tests, build, isolated
API E2E, gateway checks and Docker builds). After successful merge into
`develop`, verify the DEV deployment and protected branch cleanup.

**Open operational acceptance:** A real end-to-end enqueue/worker run against
isolated Redis and PostgreSQL remains required from task 21.201; no UI-level
admin correction, production feed, automatic scoreboard update or
STAGING/PROD release is implied by unit and CI checks.
