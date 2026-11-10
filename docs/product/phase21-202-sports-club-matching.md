# Phase 21.202 – Sports Club Matching

## Scope

The `sports-import` worker now resolves **staged club records** to existing
canonical clubs using conservative name and alias matching. It runs only after
21.201 has persisted the synthetic raw payload and `ImportRecord`.

No canonical `Club`, `ClubAlias`, `Match` or `Standing` is created,
modified or deleted by the matcher. It does not fetch external providers,
schedule jobs or publish sport results. The worker remains DEV/test opt-in
(`SPORTS_FAKE_PROVIDER_ENABLED`) and OFF by default.

## Matching order and safety

1. Identify a staged `SPORTS_CLUB` import record by `importJobId`,
   `providerId` and external club ID. Missing or malformed records fail
   closed. Provider IDs are opaque and must never be used as canonical UUIDs.
2. Load a prior `EntityMatch` scoped by the unique
   `(providerId, entityType=CLUB, externalId)`. Respect explicit rejections,
   manual review and reviewed import records; never silently overwrite them.
3. An existing `MATCHED` provider-ID binding is reused **only when its
   canonical Club still exists and is active**. Inactive mappings remain for
   administrative correction, while the import record stays review-required.
4. With no binding, compare the normalized external club name to the full
   canonical name and **active `ClubAlias.normalizedAlias`** for active clubs.
   Exact normalized matches may link only when **one distinct active Club**
   matches. A canonical name and another club's alias are a collision.
5. Missing/short names result in `UNMATCHED`; multiple different club IDs
   result in `AMBIGUOUS`. Both are saved as `EntityMatch` evidence and
   remain `REVIEW_REQUIRED` in the import record. No arbitrary tie-break or
   fuzzy guess is allowed. Presentation-only `Club.shortName` does not
   participate unless separately recorded as an approved `ClubAlias`.

The name normalizer is deterministic: Unicode NFKD, accent folding,
German sharp-s conversion, lowercasing, conservative punctuation/whitespace
normalization. Meaningful club designators, places and numbers are preserved.
The original names and aliases are not altered.

## Persistence and retry

Matching and its audit record are committed inside one PostgreSQL
transaction with an advisory lock scoped to provider ID and external club
ID, preventing parallel importer retries from making competing choices.
Successful matches write `EntityMatch.status=MATCHED` (method
`CANONICAL_NAME` or `ALIAS`, confidence `HIGH`) and update the specific
`ImportRecord` to `MATCHED` with
`canonicalEntityType=CLUB`/`canonicalEntityId`. Already-approved
mappings use the stable provider ID and keep their manual provenance.
A name collision does not store a canonical target.

The existing 21.201 job retry can re-run matching even when its raw payload
was already staged, without duplicating the raw record or changing a
previously reviewed mapping. If the matching transaction fails, the BullMQ
job fails/retries; it is **not** marked successfully imported. Manual
correction and review interfaces belong to a later roadmap task (21.205).

## Verification and limits

Pure resolver tests cover normalized canonical and alias matching, duplicate
aliases for one club, cross-club collisions, unknown/short names and no fuzzy
match. Worker-service tests cover provider isolation, exact/alias binding,
manual mapping preservation, inactive mapping protection, rejected and
reviewed records, repeat execution and missing staging data.
Processor tests ensure club jobs call matching after staging and do not
match fixture/result/live jobs.

The prior 21.201 real Redis/PostgreSQL worker enqueue acceptance remains
open until separately executed against an isolated test database. Unit tests
and existing CI integration gates are not equivalent to this runtime
acceptance. No STAGING or PROD permission is implied by this change.
