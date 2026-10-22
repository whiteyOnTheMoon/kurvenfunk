# Import Domain Models

**Project:** Kurvenfunk
**Task:** 080 – Import Models
**Status:** Domain model defined
**Target:** `docs/database/import-models.md`

---

## 1. Purpose

Kurvenfunk imports external data from news providers and sports-data providers.

The canonical Kurvenfunk domain must remain independent from any specific external provider.

Provider-specific identifiers, raw payloads, import execution state, import provenance and entity matching therefore belong to a dedicated import domain.

Task 080 defines the following core entities:

- `Provider`
- `ImportJob`
- `ImportRecord`
- `RawPayload`
- `EntityMatch`

These models form the persistence and traceability layer behind later import pipelines.

They support both:

```text
News Import
```

and:

```text
Sports Data Import
```

without coupling canonical entities such as `Article`, `Club`, `Competition`, `Season` or `Match` to external provider identifiers.

---

## 2. Core Principle

The central architectural rule is:

```text
External Provider
        ↓
Provider Adapter
        ↓
Raw Payload
        ↓
Normalization
        ↓
Validation
        ↓
Entity Matching
        ↓
Canonical Kurvenfunk Domain
```

The canonical domain must not become provider-specific.

For example:

```text
Provider A
clubId = 12345

Provider B
teamId = 987
```

may both resolve to the same canonical Kurvenfunk entity:

```text
Club
SK Rapid Wien
```

The external identifiers remain in the import domain.

They do not become fields such as:

```text
Club.apiFootballId
Club.providerClubId
Match.providerMatchId
Competition.providerCompetitionId
```

on canonical domain entities.

---

## 3. Domain Goals

The import domain must provide:

- provider registration and configuration metadata
- provider capability classification
- provider activation/deactivation
- import job tracking
- import attempt tracking
- raw provider payload persistence
- deterministic import provenance
- provider entity identifier persistence
- canonical entity matching
- matching confidence
- matching review state
- manual matching correction
- duplicate detection support
- retry support
- dead-letter/review workflows
- reproducibility of import problems
- safe reprocessing after adapter changes
- historical traceability
- provider-independent canonical entities

---

## 4. Domain Boundary

The import domain owns:

- external provider identity
- provider type
- provider technical capability metadata
- import execution history
- raw provider responses
- normalized import record metadata
- external entity identifiers
- mapping between provider entities and canonical Kurvenfunk entities
- matching decisions
- matching confidence
- matching review state
- import error metadata
- retry metadata
- import provenance

The import domain does not own:

- canonical Club identity
- canonical Competition identity
- canonical Season identity
- canonical Match identity
- canonical Article identity
- canonical User identity
- editorial publication rules
- football standings calculation
- comments
- forum content
- notifications
- moderation rules
- authentication credentials belonging to Keycloak
- provider secrets in plaintext database fields
- queue state as authoritative business data

---

# 5. Entities

## 5.1 Provider

`Provider` represents one external system from which Kurvenfunk can import data.

Examples:

```text
Fake News Provider
APA News Adapter
Football Data Provider
Fixture API
Results API
```

A Provider is a stable Kurvenfunk record describing the external integration.

It is not the provider adapter implementation itself.

The adapter is application code.

The Provider entity is persisted domain/configuration metadata.

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | UUID | yes | Internal immutable Kurvenfunk Provider identifier |
| `key` | String | yes | Stable machine-readable Provider key |
| `name` | String | yes | Human-readable Provider name |
| `type` | ProviderType | yes | Main Provider domain |
| `status` | ProviderStatus | yes | Operational availability state |
| `description` | String | no | Internal description |
| `baseUrl` | String | no | Optional non-secret API/base URL metadata |
| `supportsNews` | Boolean | yes | Whether Provider can supply news |
| `supportsSports` | Boolean | yes | Whether Provider can supply sports data |
| `supportsIncrementalImport` | Boolean | yes | Whether cursor/time-based incremental import is supported |
| `supportsReplay` | Boolean | yes | Whether provider data can be requested/replayed deterministically |
| `trustedForAutoPublish` | Boolean | yes | Whether provider may later participate in auto-publish workflows |
| `configuration` | JSON | no | Non-secret provider-specific configuration |
| `lastSuccessfulImportAt` | DateTime | no | Timestamp of last successful completed ImportJob |
| `lastFailedImportAt` | DateTime | no | Timestamp of last failed ImportJob |
| `createdAt` | DateTime | yes | Creation timestamp |
| `updatedAt` | DateTime | yes | Last modification timestamp |
| `disabledAt` | DateTime | no | Optional disable timestamp |

### Provider Key

`key` is the stable application-level identifier.

Examples:

```text
fake-news
fake-sports
provider-x-news
provider-y-football
```

`key` should:

- be lowercase
- be URL/config friendly
- remain stable
- be unique
- not contain credentials
- not depend on display naming

Example:

```text
name = "Example Football Data"
key  = "example-football-data"
```

Changing the human-readable Provider name must not require changing the Provider identity.

### Provider Type

Initial values:

```text
NEWS
SPORTS
HYBRID
```

`NEWS`

Provider primarily supplies editorial/news content.

`SPORTS`

Provider primarily supplies structured football data.

`HYBRID`

Provider supplies both.

Capability booleans still exist because provider classification alone should not be used as the only capability check.

### Provider Status

Initial values:

```text
ACTIVE
DISABLED
DEGRADED
```

`ACTIVE`

Provider may be scheduled and used normally.

`DISABLED`

Provider must not be automatically scheduled.

Historical records remain valid.

`DEGRADED`

Provider is temporarily unreliable or partially unavailable.

Imports may be restricted depending on operational policy.

Provider status is not a replacement for health monitoring.

### Provider Credentials

Secrets must not be stored directly in the Provider entity.

Do not persist fields such as:

```text
apiKey
password
clientSecret
bearerToken
```

as plaintext provider database configuration.

Provider credentials belong in environment/secrets management.

The Provider record may store a secret reference if later required, for example:

```text
secretRef = "NEWS_PROVIDER_X_API_KEY"
```

but the secret value itself must remain outside canonical database configuration.

### Provider Deactivation

Deleting a Provider merely because it is no longer used is unsafe.

Historical imports must remain traceable.

Normal behavior:

```text
Provider.status = DISABLED
disabledAt = timestamp
```

Existing:

- ImportJobs
- ImportRecords
- RawPayloads
- EntityMatches

remain intact.

---

## 5.2 ImportJob

`ImportJob` represents one logical execution of an import operation for one Provider.

Examples:

```text
Fetch latest news from provider
Fetch Bundesliga fixtures
Refresh match results
Import competition metadata
Replay one failed provider response
```

An ImportJob is persisted independently from BullMQ job state.

BullMQ coordinates execution.

PostgreSQL remains the authoritative source for import history.

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | UUID | yes | Internal immutable ImportJob identifier |
| `providerId` | UUID | yes | Provider being imported |
| `kind` | ImportJobKind | yes | Logical import operation |
| `status` | ImportJobStatus | yes | Current persisted job lifecycle state |
| `trigger` | ImportTrigger | yes | Why the job was started |
| `queueName` | String | no | Queue used for execution |
| `queueJobId` | String | no | Optional BullMQ job identifier for correlation |
| `requestId` | String | no | Optional propagated request/correlation ID |
| `parentJobId` | UUID | no | Optional relation for retry/replay/child jobs |
| `attempt` | Int | yes | Logical attempt number |
| `cursor` | String | no | Provider cursor used for incremental import |
| `windowStart` | DateTime | no | Optional import time-range start |
| `windowEnd` | DateTime | no | Optional import time-range end |
| `startedAt` | DateTime | no | Processing start timestamp |
| `completedAt` | DateTime | no | Completion timestamp |
| `failedAt` | DateTime | no | Failure timestamp |
| `errorCode` | String | no | Stable internal error classification |
| `errorMessage` | String | no | Sanitized diagnostic summary |
| `recordsReceived` | Int | yes | Number of external records received |
| `recordsProcessed` | Int | yes | Number of records processed |
| `recordsCreated` | Int | yes | Number resulting in new canonical entities |
| `recordsUpdated` | Int | yes | Number resulting in canonical updates |
| `recordsSkipped` | Int | yes | Number intentionally skipped |
| `recordsDuplicate` | Int | yes | Number classified as duplicates |
| `recordsFailed` | Int | yes | Number failing processing |
| `recordsReview` | Int | yes | Number requiring review |
| `metadata` | JSON | no | Non-secret provider/job execution metadata |
| `createdAt` | DateTime | yes | Creation timestamp |
| `updatedAt` | DateTime | yes | Last modification timestamp |

### ImportJobKind

Initial shared values:

```text
NEWS_FETCH
NEWS_REPLAY

SPORTS_COMPETITIONS
SPORTS_SEASONS
SPORTS_CLUBS
SPORTS_FIXTURES
SPORTS_RESULTS
SPORTS_STANDINGS

ENTITY_REPROCESS
RAW_PAYLOAD_REPROCESS
MANUAL_REPLAY
```

The enum may later be extended.

The important rule is that the kind identifies the semantic import operation, not merely the queue.

### Import Trigger

Initial values:

```text
SCHEDULED
MANUAL
RETRY
REPLAY
SYSTEM
```

`SCHEDULED`

Started by a scheduler.

`MANUAL`

Started by an authorized administrator.

`RETRY`

Automatically created/re-run after failure.

`REPLAY`

Explicit reprocessing of existing raw data.

`SYSTEM`

Internal technical operation not fitting the other triggers.

### ImportJob Status

Initial values:

```text
QUEUED
RUNNING
SUCCEEDED
PARTIALLY_SUCCEEDED
FAILED
CANCELLED
DEAD_LETTER
```

#### QUEUED

Persisted job exists but processing has not started.

#### RUNNING

Worker is actively processing it.

#### SUCCEEDED

The job completed successfully.

Individual duplicate/skipped records do not necessarily make a job partial.

#### PARTIALLY_SUCCEEDED

The job completed but one or more records failed or require intervention.

#### FAILED

The logical job could not complete successfully.

#### CANCELLED

Processing was intentionally cancelled.

#### DEAD_LETTER

The job or its processing context has exceeded normal retry policy and requires intervention.

### Import Counters

Counters are operational summaries.

They must be derived from actual job processing and should remain internally consistent.

For example:

```text
recordsReceived >= recordsProcessed
```

and normally:

```text
recordsProcessed
=
recordsCreated
+ recordsUpdated
+ recordsSkipped
+ recordsDuplicate
+ recordsFailed
+ recordsReview
```

The exact accounting rules must be finalized in implementation to avoid double-counting.

A record must not simultaneously be counted as both:

```text
created
```

and:

```text
duplicate
```

for the same processing result.

### Queue Correlation

Existing application queues include:

```text
news-import
sports-import
```

`queueName` and `queueJobId` are correlation metadata.

They must not make Redis/BullMQ the authoritative historical database.

If Redis is lost, ImportJob history remains available from PostgreSQL.

### Request ID

Where an import is initiated from an HTTP/API operation:

```text
Web
→ API
→ Queue
→ Worker
```

the existing request ID should be propagated when practical.

Scheduled imports may instead receive a new system correlation ID.

### Retry Relationship

A retry may create a new ImportJob related to the original:

```text
original ImportJob
        ↓
retry ImportJob
        ↓
retry ImportJob
```

`parentJobId` supports this lineage.

The original failed ImportJob must not be overwritten to look as though it succeeded later.

Historical truth is important.

---

## 5.3 ImportRecord

`ImportRecord` represents one provider-level logical record processed within an ImportJob.

Examples:

News:

```text
one external news article
```

Sports:

```text
one external club
one external competition
one fixture
one result update
one standing row
```

ImportRecord is the central unit for import provenance.

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | UUID | yes | Internal immutable ImportRecord identifier |
| `importJobId` | UUID | yes | Owning ImportJob |
| `providerId` | UUID | yes | Denormalized/provider relation for efficient lookup |
| `rawPayloadId` | UUID | no | Raw payload containing the source data |
| `recordType` | ImportRecordType | yes | Logical type of imported provider record |
| `externalId` | String | no | Provider-specific entity/record identifier |
| `externalVersion` | String | no | Optional provider revision/version/etag |
| `externalUrl` | String | no | Optional provider source URL |
| `sourcePublishedAt` | DateTime | no | Provider-reported publication/event timestamp |
| `status` | ImportRecordStatus | yes | Processing result |
| `contentHash` | String | no | Deterministic hash used for duplicate/change detection |
| `normalizedHash` | String | no | Optional hash of normalized representation |
| `canonicalEntityType` | CanonicalEntityType | no | Resulting Kurvenfunk entity type |
| `canonicalEntityId` | UUID | no | Resulting Kurvenfunk entity identifier |
| `duplicateOfRecordId` | UUID | no | Optional duplicate relation to prior ImportRecord |
| `errorCode` | String | no | Stable internal error classification |
| `errorMessage` | String | no | Sanitized diagnostic message |
| `processingMetadata` | JSON | no | Non-secret processing metadata |
| `processedAt` | DateTime | no | Processing completion timestamp |
| `createdAt` | DateTime | yes | Creation timestamp |
| `updatedAt` | DateTime | yes | Last modification timestamp |

### ImportRecordType

Initial values should support both news and sports.

Suggested values:

```text
NEWS_ARTICLE

SPORTS_COMPETITION
SPORTS_SEASON
SPORTS_CLUB
SPORTS_MATCH
SPORTS_RESULT
SPORTS_STANDING

UNKNOWN
```

The import layer may later add additional types.

### ImportRecord Status

Initial values:

```text
RECEIVED
NORMALIZED
VALIDATED
MATCHED
CREATED
UPDATED
DUPLICATE
SKIPPED
REVIEW_REQUIRED
FAILED
```

A persisted record may move through processing states.

A simplified lifecycle:

```text
RECEIVED
   ↓
NORMALIZED
   ↓
VALIDATED
   ↓
MATCHED
   ↓
CREATED / UPDATED
```

Alternative terminal paths include:

```text
DUPLICATE
SKIPPED
REVIEW_REQUIRED
FAILED
```

Not every pipeline needs to persist every transient state change.

The final persisted status should accurately describe the current processing outcome.

### External Identifier

`externalId` stores the Provider's identifier for the source record.

Examples:

```text
news item ID
team ID
competition ID
fixture ID
match ID
```

The identifier has meaning only together with at least:

```text
providerId
recordType
externalId
```

An external ID must never be assumed globally unique across providers.

### Canonical Result

Where one ImportRecord directly creates or updates one canonical entity, the result may be captured as:

```text
canonicalEntityType
canonicalEntityId
```

Examples:

```text
NEWS_ARTICLE → Article
SPORTS_CLUB → Club
SPORTS_COMPETITION → Competition
SPORTS_MATCH → Match
```

This field is provenance.

It does not replace EntityMatch where matching evidence and provider mappings must be tracked.

### Duplicate Detection

Duplicate detection may use:

- Provider ID
- external URL
- exact content hash
- normalized hash
- title
- publication timestamp
- canonical source URL
- similarity logic
- known canonical entity mapping

A duplicate classification must be explicit.

When possible:

```text
duplicateOfRecordId
```

points to the previously known record responsible for the duplicate decision.

### Hashing

`contentHash` may represent a deterministic hash of relevant provider data.

The hash is useful for:

- detecting unchanged records
- deduplication
- reprocessing comparisons
- provider correction detection

Hash algorithms must be stable and versionable in implementation.

Sensitive data must not be exposed through logs merely because it participates in a hash.

### Record Reprocessing

An ImportRecord must be reprocessable from its RawPayload where retention policy permits.

Reprocessing may:

- create a new ImportJob
- create a new ImportRecord
- reference the old RawPayload
- apply a new adapter/normalizer version
- produce a corrected EntityMatch

Historical records should not be mutated to erase the earlier processing result.

---

## 5.4 RawPayload

`RawPayload` stores provider data as received before canonical normalization.

Its primary purpose is reproducibility and traceability.

It allows Kurvenfunk to:

- reproduce import failures
- inspect provider changes
- re-run normalization
- re-run matching
- compare provider responses
- debug adapter changes
- investigate duplicate decisions
- investigate bad canonical updates
- retain provenance without polluting canonical domain entities

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | UUID | yes | Internal immutable RawPayload identifier |
| `providerId` | UUID | yes | Source Provider |
| `importJobId` | UUID | yes | ImportJob that received the payload |
| `payloadType` | RawPayloadType | yes | Payload granularity/type |
| `externalId` | String | no | Optional external record identifier |
| `contentType` | String | no | Provider response MIME/content type |
| `encoding` | String | no | Optional original encoding metadata |
| `payload` | JSON/Text/Bytes | yes | Raw provider content representation |
| `payloadHash` | String | yes | Deterministic integrity/deduplication hash |
| `sizeBytes` | BigInt | yes | Stored payload size |
| `httpStatus` | Int | no | Provider HTTP status if applicable |
| `sourceUrl` | String | no | Provider endpoint/source URL without secrets |
| `receivedAt` | DateTime | yes | Timestamp payload was received |
| `expiresAt` | DateTime | no | Optional retention expiration |
| `deletedAt` | DateTime | no | Optional controlled deletion marker |
| `createdAt` | DateTime | yes | Persistence timestamp |

### Raw Payload Type

Suggested initial values:

```text
RESPONSE
RECORD
PAGE
WEBHOOK
REPLAY
```

`RESPONSE`

Complete external response.

`RECORD`

One raw provider record extracted for isolated persistence.

`PAGE`

One paginated provider page.

`WEBHOOK`

Future inbound provider event.

`REPLAY`

Payload created/imported through explicit replay tooling.

The exact persistence granularity may differ by provider.

### Raw Means Raw

The stored payload should represent provider data before semantic normalization.

Do not silently rewrite:

```text
Rapid Vienna
```

to:

```text
SK Rapid Wien
```

inside RawPayload.

Normalization belongs later.

Raw data may still undergo unavoidable transport-safe handling such as:

- encoding normalization
- decompression
- encryption-at-rest
- structured JSON storage

but the semantic provider content must remain reconstructable.

### Provider Response vs Record Payload

A single API response may contain many records.

Two approaches are possible:

```text
one RawPayload per provider response
```

or:

```text
one response RawPayload
+
optional extracted record RawPayloads
```

Task 081 should choose a practical persistence structure.

The domain requirement is:

A processed ImportRecord must be traceable back to the source provider payload that produced it.

### Sensitive Data

Raw provider data can unexpectedly contain:

- personal information
- tracking parameters
- tokens
- internal provider metadata
- copyrighted content
- large HTML bodies

Therefore RawPayload requires explicit security and retention treatment.

Raw payloads must not be:

- exposed through public APIs
- indexed in Meilisearch by default
- logged in full
- copied into audit logs
- retained forever without policy
- used as canonical Article content without validation/sanitization

### Secret Redaction

If provider responses or source URLs contain credentials, secrets must be removed before normal persistence where technically possible without destroying necessary reproducibility.

Examples to strip or avoid storing:

```text
Authorization headers
API keys in query strings
cookies
bearer tokens
signed temporary credentials
```

### Payload Storage

PostgreSQL is the authoritative metadata store.

The physical payload may initially be stored in PostgreSQL if sizes are reasonable.

For very large payloads, a future implementation may store:

```text
RawPayload metadata in PostgreSQL
+
payload object in object storage
```

provided that:

- the payload remains recoverable
- integrity is verified with hash
- lifecycle/retention is coordinated
- PostgreSQL retains authoritative provenance metadata

The initial Prisma design should avoid premature complexity unless real provider payload size requires external storage.

### Retention

RawPayload should not automatically be permanent.

Retention depends on:

- provider terms
- copyright constraints
- debugging needs
- privacy classification
- storage cost
- import replay requirements

A later retention policy should define periods such as:

```text
successful raw payloads: shorter retention
failed/review payloads: longer retention
critical correction payloads: longer retention
```

Task 080 defines the capability.

Final retention periods belong to privacy/operational policy tasks.

---

## 5.5 EntityMatch

`EntityMatch` represents a persisted relationship or matching decision between an external provider entity and a canonical Kurvenfunk entity.

This model is critical.

Canonical entities must remain provider-independent.

EntityMatch is where provider-specific identity belongs.

Examples:

```text
Provider Club ID 12345
→ Club SK Rapid Wien
```

```text
Provider Competition ID 77
→ Competition Austrian Bundesliga
```

```text
Provider Match ID 991122
→ canonical Match UUID
```

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | UUID | yes | Internal immutable EntityMatch identifier |
| `providerId` | UUID | yes | External Provider |
| `entityType` | MatchEntityType | yes | Type of provider/canonical entity |
| `externalId` | String | yes | Provider-specific entity identifier |
| `externalName` | String | no | Last/initial provider-observed name |
| `canonicalEntityId` | UUID | no | Matched canonical Kurvenfunk entity |
| `status` | EntityMatchStatus | yes | Matching decision state |
| `confidence` | MatchConfidence | yes | Confidence classification |
| `method` | MatchMethod | yes | How the decision was produced |
| `firstSeenAt` | DateTime | yes | First observation timestamp |
| `lastSeenAt` | DateTime | yes | Most recent observation timestamp |
| `matchedAt` | DateTime | no | Timestamp match was accepted |
| `reviewedAt` | DateTime | no | Manual review timestamp |
| `reviewedByUserId` | UUID | no | Optional reviewer/admin User |
| `sourceImportRecordId` | UUID | no | ImportRecord producing/supporting this decision |
| `evidence` | JSON | no | Non-secret matching evidence |
| `notes` | String | no | Internal review note |
| `active` | Boolean | yes | Whether mapping is currently usable |
| `createdAt` | DateTime | yes | Creation timestamp |
| `updatedAt` | DateTime | yes | Last modification timestamp |

### Match Entity Type

Initial values:

```text
CLUB
COMPETITION
SEASON
MATCH
ARTICLE
```

Potential later extensions:

```text
PLAYER
VENUE
REFEREE
```

Only add entity types when Kurvenfunk has a canonical domain entity that needs provider mapping.

### External ID Uniqueness

A mapping identity is scoped by:

```text
providerId
entityType
externalId
```

This combination should normally be unique.

Example:

```text
provider = Provider A
entityType = CLUB
externalId = 123
```

must resolve to at most one active canonical Club mapping.

But:

```text
Provider A / CLUB / 123
```

and:

```text
Provider B / CLUB / 123
```

are unrelated.

Likewise:

```text
Provider A / CLUB / 123
```

and:

```text
Provider A / MATCH / 123
```

may coexist.

### EntityMatch Status

Initial values:

```text
PENDING
MATCHED
UNMATCHED
AMBIGUOUS
REVIEW_REQUIRED
REJECTED
```

#### PENDING

Observed but matching has not completed.

#### MATCHED

Accepted mapping to a canonical entity exists.

#### UNMATCHED

No suitable canonical entity was found.

#### AMBIGUOUS

Multiple plausible candidates exist.

#### REVIEW_REQUIRED

Automatic processing intentionally stopped for human review.

#### REJECTED

A candidate mapping was explicitly rejected.

### Match Confidence

Initial values required for later news import behavior:

```text
EXACT
HIGH
MEDIUM
LOW
UNKNOWN
```

#### EXACT

Deterministic trusted mapping.

Typical case:

```text
known provider external ID
→ existing accepted EntityMatch
```

#### HIGH

Strong evidence with minimal ambiguity.

#### MEDIUM

Plausible match but not safe enough for all automatic actions.

#### LOW

Weak match.

Should generally require review or remain unresolved.

#### UNKNOWN

No reliable confidence can be established.

### Confidence Is Contextual

Confidence belongs to the matching decision.

It must not be stored as a permanent property on `ClubAlias`.

Example:

```text
"Rapid"
```

may be high confidence when:

```text
competition = Austrian Bundesliga
country = Austria
```

but ambiguous globally.

Therefore:

```text
ClubAlias.confidence
```

must not exist as a global truth.

EntityMatch or import matching evidence is the correct context.

### Match Method

Initial values:

```text
EXTERNAL_ID
MANUAL
CANONICAL_NAME
ALIAS
COMPOSITE
HEURISTIC
IMPORT_HISTORY
```

`EXTERNAL_ID`

Existing trusted provider mapping.

`MANUAL`

Explicit administrator decision.

`CANONICAL_NAME`

Matched from canonical domain name.

`ALIAS`

Matched using alias data such as ClubAlias.

`COMPOSITE`

Matched using multiple structured dimensions.

Example Match:

```text
competition
season
home club
away club
kickoff
```

`HEURISTIC`

Similarity/scoring-based inference.

`IMPORT_HISTORY`

Derived from trusted previous import provenance.

### Matching Priority

A trusted explicit provider mapping should normally outrank textual inference.

Recommended high-level priority:

```text
1. existing active EntityMatch by provider external ID
2. trusted deterministic provider/context mapping
3. canonical structured composite match
4. normalized canonical name
5. trusted aliases
6. heuristic similarity
7. unresolved/manual review
```

This avoids repeatedly guessing identity after Kurvenfunk already knows it.

### Safe Failure

Matching must fail safely.

Kurvenfunk must prefer:

```text
UNMATCHED
AMBIGUOUS
REVIEW_REQUIRED
UNKNOWN
```

over an unsafe automatic match.

A wrong automatic mapping can corrupt canonical data.

A delayed import is preferable to corrupting:

- club identity
- competition identity
- season identity
- match identity
- article associations

### Manual Match

An authorized administrator may resolve an uncertain mapping.

Example:

```text
external:
"Rapid Vienna"
provider club id: 12345

candidates:
SK Rapid Wien
Rapid II
```

Admin selects:

```text
SK Rapid Wien
```

The EntityMatch becomes:

```text
status = MATCHED
confidence = EXACT
method = MANUAL
```

or another explicitly defined accepted manual confidence policy.

The important point is that subsequent imports can use the stable external-ID mapping instead of repeating the ambiguous inference.

### Mapping Correction

Provider mappings can be wrong.

A correction must not silently erase history.

Possible workflow:

```text
existing match
→ mark inactive/rejected
→ persist corrected mapping
→ reprocess affected records
```

or maintain one record with explicit revision history if Task 081 introduces such support.

At minimum, correction must preserve enough provenance to investigate why canonical data changed.

### External Name

`externalName` is informational evidence.

It must not become the canonical entity name automatically.

Example:

```text
externalName = "Admiral Bundesliga"
```

does not automatically rename:

```text
Competition.name = "Austrian Bundesliga"
```

Canonical naming remains owned by the Competition domain.

---

# 6. Relationships

High-level relationship model:

```text
Provider
│
├── ImportJob
│    │
│    ├── ImportRecord
│    │    │
│    │    └── RawPayload
│    │
│    └── RawPayload
│
└── EntityMatch
```

More precisely:

```text
Provider 1 ─── N ImportJob

ImportJob 1 ─── N ImportRecord

ImportJob 1 ─── N RawPayload

Provider 1 ─── N EntityMatch

ImportRecord N ─── 0..1 RawPayload

EntityMatch N ─── 0..1 ImportRecord
```

Canonical references are polymorphic at the domain level:

```text
EntityMatch
→ Club
→ Competition
→ Season
→ Match
→ Article
```

Task 081 must choose a safe Prisma/database representation.

---

# 7. Canonical Entity Reference Strategy

Prisma does not provide unrestricted relational polymorphism in the same way as some ORMs.

Task 081 therefore needs an explicit persistence strategy.

The domain requirement is:

```text
entity type
+
canonical entity ID
```

must resolve unambiguously.

Possible implementation directions include:

### Option A – Generic Typed Reference

```text
canonicalEntityType
canonicalEntityId
```

Advantages:

- compact
- generic
- easy to extend

Disadvantages:

- database foreign-key integrity cannot directly enforce all target tables

### Option B – Nullable Typed Relations

Example:

```text
clubId
competitionId
seasonId
matchId
articleId
```

with invariant:

```text
exactly one applicable canonical target
```

Advantages:

- real foreign keys
- better relational integrity

Disadvantages:

- more columns
- more schema changes for future entity types

### Direction for Task 081

Because canonical integrity is important, Task 081 should evaluate nullable typed relations seriously for EntityMatch.

However Task 080 does not prematurely lock the Prisma implementation.

The invariant is more important than the storage mechanism:

> One accepted EntityMatch must point to exactly one canonical entity of the declared entity type.

---

# 8. News Import Flow

Expected later flow:

```text
Scheduler
   ↓
news-import queue
   ↓
ImportJob
   ↓
Provider Adapter
   ↓
RawPayload
   ↓
ImportRecord
   ↓
Normalization
   ↓
Validation
   ↓
Duplicate Detection
   ↓
Club Matching
   ↓
Competition Matching
   ↓
Match Matching
   ↓
Confidence / Review
   ↓
Canonical Article
```

Task 080 provides persistence for this flow.

It does not implement the flow itself.

Relevant later tasks include:

- 144 – Provider Interface
- 145 – Fake Provider
- 146 – Scheduler
- 147 – Import Queue
- 148 – Raw Payload
- 149 – Normalization
- 150 – Validation
- 151 – Duplicate Detection
- 152 – Club Matching
- 153 – Competition Matching
- 154 – Match Matching
- 155 – Confidence Score
- 156 – Retry Logic
- 157 – Dead Letter Queue
- 158 – Import Admin
- 159 – Review Workflow
- 160 – Auto Publish
- 161 – First Real News Provider

---

# 9. Sports Import Flow

Expected later flow:

```text
Scheduler
   ↓
sports-import queue
   ↓
ImportJob
   ↓
Sports Provider Adapter
   ↓
RawPayload
   ↓
ImportRecord
   ↓
Normalization
   ↓
Validation
   ↓
Competition Matching
   ↓
Season Matching
   ↓
Club Matching
   ↓
Match Matching
   ↓
Canonical Football Domain
```

Relevant later tasks include:

- 199 – Sports Provider Interface
- 200 – Fake Sports Provider
- 201 – Sports Import Queue
- 202 – Club Matching
- 203 – Match Matching
- 204 – Sports Scheduler
- 205 – Correction Interface

---

# 10. Provider Mapping vs Alias

Provider mappings and aliases solve different problems.

## Provider Mapping

Example:

```text
Provider:
example-football-data

entityType:
CLUB

externalId:
12345

canonical:
SK Rapid Wien
```

This is provider-specific identity.

It belongs to `EntityMatch`.

## Club Alias

Example:

```text
Rapid
Rapid Wien
SCR
SK Rapid
```

These are textual variants useful independently of one specific provider.

They belong to `ClubAlias`.

### Rule

A provider-observed text value must not automatically become a permanent ClubAlias.

Example:

```text
Provider returns:
"SK Rapid Vienna FC"
```

That text may be retained in:

- RawPayload
- EntityMatch.externalName
- matching evidence

without being promoted to a canonical alias.

Alias creation requires separate validation according to the ClubAlias domain.

---

# 11. Provider Independence

Canonical entities must not contain provider-specific identity fields.

Forbidden examples include:

```text
Club.providerId
Club.providerClubId
Club.apiFootballId

Competition.providerCompetitionId

Season.providerSeasonId

Match.providerMatchId
Match.providerStatus

Article.providerArticleId
```

Provider-specific identity belongs to:

```text
EntityMatch
ImportRecord
RawPayload
```

depending on semantics.

This allows Kurvenfunk to:

- change providers
- use multiple providers simultaneously
- merge data sources
- remove a provider
- replay old imports
- preserve canonical IDs
- avoid migrations when external IDs change

---

# 12. Import Provenance

Every canonical entity created or materially updated by an import should be traceable to the import context where practical.

The provenance chain should allow answering:

```text
Which provider supplied this?
```

```text
Which ImportJob processed it?
```

```text
Which ImportRecord caused the change?
```

```text
Which RawPayload contained the source data?
```

```text
Which EntityMatch resolved the provider identity?
```

This is distinct from the Audit Log.

Routine provider imports should not flood the administrative audit history.

The import domain owns routine import provenance.

Audit Log remains responsible for critical human/admin/moderation actions and exceptional administrative changes.

---

# 13. Idempotency

Import processing should be idempotent where possible.

Reprocessing the same external record must not blindly create duplicate canonical entities.

Important idempotency evidence includes:

- Provider
- external ID
- record type
- payload/content hash
- existing EntityMatch
- canonical source URL
- normalized content
- import history

Example:

```text
Provider A
external match ID = 991122
```

is imported twice.

The second import should normally update or skip the existing canonical Match rather than create another Match.

---

# 14. Duplicate Detection

Duplicate detection is broader than provider ID mapping.

News providers may:

- change article IDs
- syndicate the same story under different IDs
- update URLs
- republish corrected content

Therefore duplicate detection may consider:

```text
provider external ID
original URL
canonicalized URL
content hash
normalized title
publication timestamp
source
text similarity
existing canonical Article
```

Duplicate detection results belong to ImportRecord processing state.

EntityMatch represents external entity identity, not every possible content duplicate decision.

---

# 15. Import Correction

External data can be wrong.

Kurvenfunk must support corrections without abandoning provider independence.

Examples:

- wrong club matched
- fixture linked to wrong competition
- provider changes kickoff
- provider corrects score
- provider sends renamed competition
- news item incorrectly linked to a match

Possible correction workflow:

```text
identify bad ImportRecord
        ↓
inspect RawPayload
        ↓
correct EntityMatch if necessary
        ↓
re-run normalization/matching
        ↓
apply safe canonical correction
        ↓
persist new provenance
```

Canonical history/revisions may be handled by the owning domain.

---

# 16. Manual Review

Manual review is required when automation is not sufficiently safe.

Typical triggers:

- ambiguous club alias
- unknown provider external ID
- multiple competition candidates
- uncertain match association
- duplicate ambiguity
- low confidence
- conflicting provider mappings
- validation failure needing editorial decision

Manual review should have enough context to display:

- Provider
- ImportJob
- ImportRecord
- RawPayload preview
- external ID
- external name
- candidate canonical entities
- matching method
- confidence
- evidence
- validation errors

The full admin interface belongs to later tasks.

---

# 17. Auto Publish Boundary

`Provider.trustedForAutoPublish` does not itself guarantee publication.

Later auto-publish must require all applicable conditions, for example:

```text
trusted provider
+
successful normalization
+
successful validation
+
safe duplicate result
+
safe entity matching
+
sufficient confidence
+
publication policy
```

Task 160 defines the actual auto-publish behavior.

Task 080 only provides supporting metadata.

---

# 18. Error Handling

Import errors should use stable internal codes where possible.

Examples:

```text
PROVIDER_TIMEOUT
PROVIDER_RATE_LIMITED
PROVIDER_AUTH_FAILED
PROVIDER_INVALID_RESPONSE
PAYLOAD_PARSE_FAILED
NORMALIZATION_FAILED
VALIDATION_FAILED
DUPLICATE_AMBIGUOUS
CLUB_MATCH_FAILED
COMPETITION_MATCH_FAILED
SEASON_MATCH_FAILED
MATCH_MATCH_FAILED
CANONICAL_WRITE_FAILED
```

`errorMessage` may contain sanitized diagnostics.

Do not persist:

- access tokens
- authorization headers
- passwords
- raw cookies
- unnecessary personal information

inside error strings.

---

# 19. Retry Model

Retry logic belongs operationally to later worker tasks, but persistence must support it.

A failed ImportJob may be retried.

Recommended behavior:

```text
Job A – FAILED
   ↓
Job B – RETRY – FAILED
   ↓
Job C – RETRY – SUCCEEDED
```

All three remain visible historically.

Do not mutate:

```text
Job A
```

from:

```text
FAILED
```

to:

```text
SUCCEEDED
```

after Job C succeeds.

The final successful retry is a new historical fact.

---

# 20. Dead Letter Model

Task 157 introduces the dead-letter workflow.

Task 080 must support persistence of the state.

An ImportJob may become:

```text
DEAD_LETTER
```

when normal retry policy is exhausted.

Individual ImportRecords may remain:

```text
FAILED
```

or:

```text
REVIEW_REQUIRED
```

depending on workflow.

A dead-letter state must preserve:

- original Provider
- source RawPayload where retained
- error classification
- retry lineage
- timestamps
- record context

so administrators can replay it later.

---

# 21. Concurrency

Schedulers or manual imports may accidentally overlap.

The implementation must protect against unsafe concurrent imports.

Potential controls include:

- BullMQ job IDs
- Redis distributed locks
- database uniqueness
- provider/kind execution locks
- external cursor ownership

Redis locks are temporary coordination mechanisms.

They are not the source of truth.

Database constraints must still prevent persistent duplicate mappings and impossible identity states.

---

# 22. Incremental Imports

Some Providers support incremental fetching.

Possible provider mechanisms:

```text
cursor
since timestamp
updated_after
page token
etag
last-modified
```

ImportJob may retain:

```text
cursor
windowStart
windowEnd
metadata
```

Provider-specific opaque cursor state may be stored as non-secret metadata.

Cursor state must not leak into canonical domain entities.

A failed import must not advance durable provider state incorrectly.

Implementation must only mark a cursor checkpoint successful when the relevant processing guarantees are satisfied.

---

# 23. Pagination

A provider import can consist of multiple API pages.

One logical ImportJob may therefore produce:

```text
RawPayload page 1
RawPayload page 2
RawPayload page 3
...
```

and many ImportRecords.

The job remains the logical aggregate.

Pagination tokens are provider/import metadata.

---

# 24. Provider Rate Limits

Provider rate limits are operational integration concerns.

The import domain may persist error/status information such as:

```text
PROVIDER_RATE_LIMITED
```

and retry timing metadata if useful.

Long-lived rate-limit business state should not be embedded into canonical entities.

Temporary rate-limit coordination belongs primarily to worker/Redis logic.

---

# 25. Data Ownership

PostgreSQL is the authoritative source of truth for:

- Provider metadata
- ImportJob history
- ImportRecord provenance
- EntityMatch mappings
- RawPayload metadata
- retained RawPayload content unless deliberately externalized

Redis/BullMQ may be lost and rebuilt without destroying canonical import history.

Meilisearch must not become authoritative for import data.

---

# 26. Search

Import internals must not be indexed publicly by default.

Do not put into public Meilisearch indexes:

- RawPayload
- provider credentials
- import errors
- provider internal IDs
- matching evidence
- review notes

Search indexes should contain canonical public domain data only.

Admin search requirements can later use PostgreSQL queries or a dedicated secured index if necessary.

---

# 27. Logging

Logs should contain identifiers and status, not full raw data.

Good example:

```text
event=import.record.failed
providerId=<uuid>
importJobId=<uuid>
importRecordId=<uuid>
recordType=SPORTS_MATCH
errorCode=MATCH_MATCH_FAILED
requestId=<uuid>
```

Avoid:

```text
payload=<entire provider response>
authorization=<token>
```

RawPayload provides controlled persisted diagnostics.

Logs are not raw payload storage.

---

# 28. Audit Logging

Routine imports do not require one AuditLog row for every record.

This would:

- create excessive volume
- duplicate import provenance
- make administrative audit history noisy

ImportJob, ImportRecord, RawPayload and EntityMatch provide import provenance.

Audit logging is appropriate for actions such as:

- admin manually changes a critical mapping
- admin disables a Provider
- admin initiates destructive reprocessing
- admin overrides protected canonical data

The exact audit event list belongs to implementation tasks.

---

# 29. Security

Provider integration must follow:

- least privilege
- secret isolation
- no credentials in URLs where avoidable
- no secrets in logs
- no secrets in RawPayload
- no public RawPayload APIs
- validation of external data
- HTML/content sanitization
- size limits
- timeout limits
- outbound request restrictions
- controlled redirects
- decompression limits
- safe JSON/XML parsing

External provider data is untrusted input.

Even trusted Providers may return malformed or compromised data.

---

# 30. Privacy

Raw provider payloads may contain personal data unexpectedly.

Therefore:

- collect only necessary payloads
- define retention
- restrict access
- avoid indexing
- avoid log duplication
- redact secrets
- delete expired payloads according to policy
- consider provider contractual requirements

Task 247 – Data Minimization and later privacy tasks must include import data.

---

# 31. Copyright and Editorial Content

News provider payloads may contain copyrighted content.

RawPayload retention does not imply permission to publicly reproduce all provider content.

Canonical Article creation must follow:

- provider agreement
- licensing
- editorial rules
- permitted excerpt/full-text scope
- source attribution

Task 080 is a technical provenance model, not a copyright authorization mechanism.

---

# 32. Deletion and Retention

ImportJob and ImportRecord history should normally be retained longer than large raw payloads.

Possible lifecycle:

```text
ImportJob
retained

ImportRecord
retained

EntityMatch
retained while mapping/history is relevant

RawPayload
retention-controlled
```

If a RawPayload expires:

```text
ImportRecord.rawPayloadId
```

must be handled safely according to the final relational design.

Historical import metadata should not become invalid merely because large raw content is deleted under retention policy.

---

# 33. Provider Removal

A Provider can stop being used.

Do not cascade-delete historical import data automatically.

Preferred behavior:

```text
Provider.status = DISABLED
```

Mappings can remain for historical traceability.

If a Provider is permanently removed, the database must still be able to explain old imports.

---

# 34. Multiple Providers

Kurvenfunk may use multiple providers for the same domain.

Example:

```text
Provider A
→ fixtures

Provider B
→ results

Provider C
→ news
```

or even:

```text
Provider A + Provider B
→ same Match
```

EntityMatch allows multiple external identities to resolve to one canonical entity.

Example:

```text
Provider A / MATCH / 100
→ canonical Match X

Provider B / MATCH / 555
→ canonical Match X
```

This is valid.

The canonical Match remains one entity.

---

# 35. Conflicting Providers

Providers may disagree.

Examples:

- kickoff time differs
- score differs
- club name differs
- competition naming differs

EntityMatch resolves identity.

It does not by itself resolve authoritative field precedence.

Provider precedence and canonical update policy belong to later normalization/import business logic.

The import domain must retain enough provenance to investigate conflicts.

---

# 36. Season Matching

Season is a canonical domain entity.

External Providers may identify seasons differently.

Examples:

```text
2025
2025/26
2025-2026
seasonId = 7788
```

Provider-specific season IDs belong to EntityMatch.

Textual season labels remain RawPayload/ImportRecord evidence.

Canonical Season identity must remain provider-independent.

---

# 37. Match Matching

A Match should use the strongest available provider evidence.

Recommended dimensions:

```text
existing external ID mapping
competition
season
home club
away club
kickoff
matchday
provider evidence
```

The import system must never create duplicate canonical Matches merely because:

- the Provider changes its ID
- kickoff changes
- a result update arrives
- another Provider supplies the same fixture

EntityMatch helps persist stable provider identity once determined.

---

# 38. Competition Matching

External Competition names may include sponsor branding.

Example:

```text
Admiral Bundesliga
```

Canonical Kurvenfunk Competition may remain:

```text
Austrian Bundesliga
```

Matching can use:

- external ID
- country
- normalized name
- type
- known provider mapping
- manual mapping

Provider names must not automatically overwrite canonical names.

---

# 39. Club Matching

Club matching may use:

- existing EntityMatch
- canonical name
- short name
- ClubAlias
- country
- competition context
- season context
- manual mapping

Once a stable external Provider ID has been accepted, subsequent imports should normally resolve through EntityMatch first.

This avoids repeated alias inference.

---

# 40. Article Import Mapping

Imported news Articles may have:

- external article ID
- original URL
- source publication time
- provider source
- external author
- raw body/html
- club mentions
- competition mentions
- match mentions

Provider article identity belongs to ImportRecord/EntityMatch as appropriate.

Canonical Article fields remain provider-independent.

Raw provider HTML must not become trusted canonical Article content automatically.

---

# 41. ImportRecord vs EntityMatch

These concepts must remain distinct.

## ImportRecord

Represents:

```text
this external record was processed in this import execution
```

It is execution/provenance oriented.

## EntityMatch

Represents:

```text
this provider entity identity maps to this canonical Kurvenfunk entity
```

It is identity/mapping oriented.

Example:

```text
ImportJob #1
ImportRecord:
provider match 100
→ canonical Match X
```

Later:

```text
ImportJob #2
ImportRecord:
provider match 100 updated score
→ canonical Match X
```

Both ImportRecords may use the same EntityMatch:

```text
Provider A / MATCH / 100
→ Match X
```

---

# 42. RawPayload vs ImportRecord

These concepts must also remain distinct.

## RawPayload

Represents:

```text
what the Provider actually sent
```

## ImportRecord

Represents:

```text
how Kurvenfunk processed one logical record
```

One RawPayload can produce many ImportRecords.

Example:

```text
RawPayload
API response containing 50 fixtures
```

produces:

```text
50 ImportRecords
```

---

# 43. ImportJob vs Queue Job

These concepts must not be conflated.

## BullMQ Job

Operational execution object in Redis.

## ImportJob

Durable domain/history record in PostgreSQL.

A BullMQ job may disappear after retention/cleanup.

The ImportJob must remain available according to database retention policy.

---

# 44. Provider vs Provider Adapter

These concepts must remain distinct.

## Provider

Persisted external integration identity/configuration metadata.

## Provider Adapter

Application code implementing calls and normalization for that Provider.

Example:

```text
Provider
key = "fake-news"

Adapter class
FakeNewsProviderAdapter
```

Replacing/refactoring adapter code must not create a new Provider identity unless the external integration itself is conceptually different.

---

# 45. Adapter Versioning

Reprocessing old RawPayloads after code changes may produce different normalized results.

The import system should therefore consider recording adapter/normalizer version metadata.

Possible metadata:

```text
adapterVersion
normalizerVersion
schemaVersion
```

This may live in:

```text
ImportJob.metadata
ImportRecord.processingMetadata
```

The domain does not require dedicated columns initially, but provenance should be able to explain material processing differences.

---

# 46. Schema Versioning

Raw external responses may change shape over time.

Provider metadata or RawPayload may optionally capture:

```text
providerSchemaVersion
apiVersion
```

when known.

Do not assume provider schemas remain stable.

---

# 47. Validation Boundary

External data must be validated before canonical persistence.

Validation may include:

News:

- title present
- source URL valid
- publication date plausible
- content within limits
- body sanitizable

Sports:

- club identifiers present
- competition resolvable
- kickoff valid
- score shape valid
- status recognized

Invalid provider data should produce:

```text
FAILED
```

or:

```text
REVIEW_REQUIRED
```

rather than silently corrupt canonical entities.

---

# 48. Normalization Boundary

Normalization maps provider-specific structures to internal import DTOs.

Example:

```text
provider status:
"FT"
```

becomes internal normalized status:

```text
FINISHED
```

Only after normalization and validation should canonical domain updates occur.

Raw provider values remain available through RawPayload/provenance.

---

# 49. Transaction Boundary

Canonical writes and import provenance need careful transactional behavior.

Ideal behavior for one ImportRecord:

```text
matching decision
+
canonical create/update
+
ImportRecord final result
```

should avoid impossible partial state.

Task 081/application implementation must define transaction boundaries.

At minimum:

- do not mark a record CREATED if canonical creation rolled back
- do not mark a mapping MATCHED if its canonical target does not exist
- do not count a job result before record persistence succeeds

---

# 50. Referential Integrity

The database should enforce as much integrity as practical.

Important relationships:

- ImportJob requires Provider
- ImportRecord requires ImportJob
- RawPayload requires Provider and ImportJob
- EntityMatch requires Provider
- EntityMatch canonical relation must be valid when MATCHED
- reviewer IDs must reference valid Users where used
- duplicateOfRecordId must not point to self
- parentJobId must not point to self

---

# 51. Uniqueness Direction

Likely database uniqueness/index candidates for Task 081:

### Provider

```text
UNIQUE(key)
```

### EntityMatch

```text
UNIQUE(providerId, entityType, externalId)
```

subject to final historical/correction strategy.

### ImportRecord

Potential lookup/index:

```text
(providerId, recordType, externalId)
```

This should not necessarily be globally unique because the same external record may appear in multiple ImportJobs.

Potential idempotency uniqueness may use additional job/version semantics rather than blocking legitimate repeated processing.

### RawPayload

Index:

```text
(providerId, payloadHash)
```

may support deduplication but should not necessarily force global uniqueness.

---

# 52. Index Direction

Task 081 should consider indexes for:

```text
Provider.key
Provider.status

ImportJob.providerId
ImportJob.status
ImportJob.kind
ImportJob.createdAt
ImportJob.startedAt

ImportRecord.importJobId
ImportRecord.providerId
ImportRecord.recordType
ImportRecord.externalId
ImportRecord.status
ImportRecord.canonicalEntityId
ImportRecord.createdAt

RawPayload.providerId
RawPayload.importJobId
RawPayload.externalId
RawPayload.payloadHash
RawPayload.receivedAt
RawPayload.expiresAt

EntityMatch.providerId
EntityMatch.entityType
EntityMatch.externalId
EntityMatch.canonicalEntityId
EntityMatch.status
EntityMatch.lastSeenAt
```

The final database index set should be based on actual query patterns.

---

# 53. Timestamp Semantics

All persisted timestamps should use UTC internally.

Examples:

```text
createdAt
startedAt
receivedAt
sourcePublishedAt
matchedAt
```

Frontend/API presentation can convert to local time.

Provider timestamps must be normalized carefully because providers may:

- omit timezone
- return offsets
- return local times
- return Unix seconds
- return Unix milliseconds

Raw values remain reproducible through RawPayload.

---

# 54. Counter Consistency

ImportJob counters are summaries.

They should be updated safely.

Avoid race conditions where multiple worker tasks process records concurrently and overwrite counters.

Implementation options include:

- atomic database increments
- aggregation after processing
- transaction-safe updates

Do not rely solely on in-memory counters.

---

# 55. Cancellation

A cancelled ImportJob may leave already completed ImportRecords.

Cancellation does not imply rollback of every previously applied canonical update unless a special compensating workflow exists.

Therefore:

```text
status = CANCELLED
```

means execution stopped intentionally.

It does not necessarily mean:

```text
zero canonical effects
```

The admin interface should present counters accordingly.

---

# 56. Partial Success

Example:

```text
100 records received
95 processed successfully
3 duplicates
1 review required
1 failed
```

The job may be:

```text
PARTIALLY_SUCCEEDED
```

depending on policy.

A single duplicate should not make an import partial failure.

The exact status aggregation policy must be deterministic and tested.

---

# 57. Replay

Replay means processing retained source data again.

A replay should normally create a new ImportJob.

Example:

```text
Original Job
kind = NEWS_FETCH

Replay Job
kind = RAW_PAYLOAD_REPROCESS
trigger = REPLAY
parentJobId = original
```

Historical results remain intact.

---

# 58. Manual Import

Admin-triggered imports use:

```text
trigger = MANUAL
```

The requesting User may later be referenced in metadata or a dedicated field if required.

If a manual import is an administrative action worth auditing, the action of starting it can create an AuditLog event.

The individual imported records remain import provenance, not audit events.

---

# 59. Scheduled Import

Scheduler-triggered imports use:

```text
trigger = SCHEDULED
```

The scheduler should not require a User identity.

The Provider and ImportJob provide sufficient ownership context.

---

# 60. Provider Health Metadata

Fields like:

```text
lastSuccessfulImportAt
lastFailedImportAt
```

provide useful operational context.

They are not full monitoring.

Monitoring later observes:

- queue state
- provider error rate
- failure streaks
- latency
- rate limiting
- stale imports

Do not overload Provider with every runtime metric.

---

# 61. Import Admin Requirements

Task 158/241 should be able to query this model to show:

### Provider List

- name
- key
- type
- status
- last successful import
- last failed import

### Job List

- Provider
- job kind
- trigger
- status
- started
- completed
- counters
- error

### Job Detail

- records
- failures
- duplicates
- review-required records
- raw payload references
- retry lineage

### Entity Matching

- unmatched
- ambiguous
- review required
- external ID
- external name
- candidates/evidence
- manual resolution

---

# 62. Review Safety

Manual review endpoints must be restricted to appropriate administrative/editorial permissions.

RawPayload access should be more restricted than ordinary Article/football administration because it may contain sensitive or licensed provider data.

---

# 63. Public API Boundary

Public APIs must not expose import implementation details by default.

Do not expose fields such as:

```text
provider external IDs
raw payload IDs
internal confidence evidence
provider errors
review notes
queue job IDs
```

unless an authenticated administrative endpoint explicitly requires them.

Canonical public API representations remain provider-independent.

---

# 64. Testing Requirements

Later tests should cover at least:

### Provider

- unique Provider key
- disabled Provider not scheduled
- secrets not persisted in normal configuration

### ImportJob

- lifecycle transitions
- retry lineage
- partial success
- failed job
- dead-letter state
- counters

### ImportRecord

- duplicate classification
- canonical provenance
- failed record
- reprocessing

### RawPayload

- payload persistence
- hash calculation
- large payload limits
- secret redaction
- retention handling

### EntityMatch

- provider-scoped external ID uniqueness
- existing mapping precedence
- ambiguous matching
- safe failure
- manual resolution
- mapping correction
- multiple Providers → one canonical entity

---

# 65. Important Invariants

The following invariants must be preserved.

1. Canonical entities remain provider-independent.
2. Provider-specific identifiers belong to the import domain.
3. `Provider.key` is unique and stable.
4. Provider secrets are not stored as plaintext Provider fields.
5. ImportJob history is durable in PostgreSQL.
6. BullMQ job state is not authoritative import history.
7. Every ImportJob belongs to exactly one Provider.
8. Every ImportRecord belongs to exactly one ImportJob.
9. Every RawPayload belongs to an ImportJob and Provider.
10. RawPayload preserves semantically original provider content.
11. RawPayload is never trusted canonical content automatically.
12. ImportRecord represents one logical record processing result.
13. EntityMatch represents provider identity mapping, not one import execution.
14. External IDs are scoped by Provider and entity type.
15. A trusted existing EntityMatch outranks repeated textual inference.
16. Matching confidence is contextual.
17. ClubAlias does not own permanent provider matching confidence.
18. Unsafe matching must fail safely.
19. Ambiguous matches must not choose an arbitrary canonical entity.
20. A MATCHED EntityMatch must resolve to exactly one canonical entity.
21. Multiple Provider mappings may point to one canonical entity.
22. Provider removal must not destroy historical provenance.
23. Retry attempts preserve the original failed job.
24. Replay creates new historical processing context.
25. Import failures must not leak secrets into error messages.
26. Routine provider imports do not flood AuditLog.
27. RawPayload is not indexed publicly.
28. PostgreSQL is source of truth.
29. Redis/BullMQ is execution infrastructure.
30. Meilisearch is reconstructable and not authoritative.
31. Import processing should be idempotent where practical.
32. Duplicate provider deliveries must not blindly create duplicate canonical entities.
33. Provider naming must not automatically overwrite canonical naming.
34. Provider corrections must be traceable.
35. Manual mapping correction must preserve provenance.
36. RawPayload retention is policy-controlled.
37. Public APIs remain provider-independent.
38. External data is always treated as untrusted input.
39. Final Prisma implementation belongs to Task 081.
40. No migration is created as part of Task 080.

---

# 66. Suggested Enum Summary

## ProviderType

```text
NEWS
SPORTS
HYBRID
```

## ProviderStatus

```text
ACTIVE
DISABLED
DEGRADED
```

## ImportTrigger

```text
SCHEDULED
MANUAL
RETRY
REPLAY
SYSTEM
```

## ImportJobStatus

```text
QUEUED
RUNNING
SUCCEEDED
PARTIALLY_SUCCEEDED
FAILED
CANCELLED
DEAD_LETTER
```

## ImportJobKind

```text
NEWS_FETCH
NEWS_REPLAY

SPORTS_COMPETITIONS
SPORTS_SEASONS
SPORTS_CLUBS
SPORTS_FIXTURES
SPORTS_RESULTS
SPORTS_STANDINGS

ENTITY_REPROCESS
RAW_PAYLOAD_REPROCESS
MANUAL_REPLAY
```

## ImportRecordType

```text
NEWS_ARTICLE

SPORTS_COMPETITION
SPORTS_SEASON
SPORTS_CLUB
SPORTS_MATCH
SPORTS_RESULT
SPORTS_STANDING

UNKNOWN
```

## ImportRecordStatus

```text
RECEIVED
NORMALIZED
VALIDATED
MATCHED
CREATED
UPDATED
DUPLICATE
SKIPPED
REVIEW_REQUIRED
FAILED
```

## RawPayloadType

```text
RESPONSE
RECORD
PAGE
WEBHOOK
REPLAY
```

## MatchEntityType

```text
CLUB
COMPETITION
SEASON
MATCH
ARTICLE
```

## EntityMatchStatus

```text
PENDING
MATCHED
UNMATCHED
AMBIGUOUS
REVIEW_REQUIRED
REJECTED
```

## MatchConfidence

```text
EXACT
HIGH
MEDIUM
LOW
UNKNOWN
```

## MatchMethod

```text
EXTERNAL_ID
MANUAL
CANONICAL_NAME
ALIAS
COMPOSITE
HEURISTIC
IMPORT_HISTORY
```

---

# 67. Suggested Entity Summary

```text
Provider
- id
- key
- name
- type
- status
- capabilities
- non-secret configuration
- last import timestamps
- timestamps
```

```text
ImportJob
- id
- provider
- kind
- status
- trigger
- queue correlation
- retry lineage
- cursor/window
- counters
- sanitized error
- timestamps
```

```text
ImportRecord
- id
- job
- provider
- raw payload
- type
- external identity
- hashes
- processing status
- canonical result
- duplicate provenance
- sanitized error
- timestamps
```

```text
RawPayload
- id
- provider
- job
- payload type
- external identity
- raw content
- hash
- size
- transport metadata
- retention timestamps
```

```text
EntityMatch
- id
- provider
- entity type
- external ID
- external name
- canonical target
- status
- confidence
- method
- evidence
- review metadata
- lifecycle timestamps
```

---

# 68. Prisma Direction

Task 080 defines domain semantics only.

The complete Prisma schema belongs to Task 081.

Task 081 should implement:

- UUID primary keys
- relations
- enums
- unique constraints
- indexes
- cascading behavior
- deletion restrictions
- canonical entity references
- raw payload storage type
- JSON field types
- timestamps
- database constraints where Prisma/PostgreSQL allow them

Particular attention is required for:

```text
EntityMatch → canonical entity
```

because typed polymorphic relations need a deliberate relational design.

---

# 69. Migration Boundary

No migration is created as part of Task 080.

Task 082 creates the initial migration after all domain models have been represented in Prisma.

The order remains:

```text
080 Import Models
        ↓
081 Prisma Schema
        ↓
082 Initial Migration
```

---

# 70. Dependencies on Existing Domain Models

Task 080 completes provider/import boundaries intentionally deferred by earlier models.

## Club

Provider-specific Club IDs belong here, not in `Club`.

## ClubAlias

Provider mappings and matching confidence belong here, not in `ClubAlias`.

Aliases remain provider-independent textual matching evidence.

## Competition

Provider Competition IDs belong here, not in `Competition`.

## Season

Provider Season IDs belong here, not in `Season`.

## Match

Provider Match IDs and raw provider status/data belong here, not in `Match`.

## Article

Raw provider payloads, provider credentials, import jobs and matching records belong here, not in `Article`.

## Audit Log

Routine provider import provenance belongs here, not in `AuditLog`.

---

# 71. Relationship to Queues

Existing queue names:

```text
news-import
sports-import
```

remain execution channels.

ImportJob can correlate to them using:

```text
queueName
queueJobId
```

but the database model must not hard-code all import semantics around BullMQ.

The import domain should remain usable if queue infrastructure changes later.

---

# 72. Relationship to Request ID

The existing Request ID system should propagate into import processing where applicable.

Example:

```text
Admin API request
requestId = abc
        ↓
ImportJob.requestId = abc
        ↓
BullMQ payload context
        ↓
Worker logs
requestId = abc
```

This provides cross-service traceability.

Scheduled jobs can generate their own correlation context.

---

# 73. Relationship to Structured Logging

Structured import log events may include:

```text
import.job.created
import.job.started
import.job.succeeded
import.job.failed

import.record.received
import.record.duplicate
import.record.review_required
import.record.failed

entity_match.created
entity_match.ambiguous
entity_match.reviewed
entity_match.corrected
```

Logs should reference IDs rather than embed raw payloads.

---

# 74. Relationship to Notifications

Routine imports normally do not create user notifications.

Administrative/system notifications may later be appropriate for:

- persistent provider outage
- import dead-letter condition
- critical import failure

The Notification model remains separate.

---

# 75. Relationship to Search

Canonical Article, Club and Forum data may later be indexed.

Import entities themselves are administrative/internal data.

They must not accidentally enter public search indexes.

---

# 76. Future Extensibility

The model should support later additions such as:

- more football competitions
- additional countries
- multiple news providers
- multiple sports providers
- provider failover
- provider precedence
- webhook imports
- live match events
- player data
- venue data
- referee data
- transfer data
- provider reconciliation
- replay tooling
- import diff tooling

without changing canonical entity identity.

---

# 77. Non-Goals of Task 080

Task 080 does not implement:

- provider HTTP clients
- provider authentication
- scheduler logic
- BullMQ processors
- normalization code
- validation code
- duplicate algorithms
- matching algorithms
- confidence scoring algorithms
- review UI
- admin UI
- auto publish
- real news provider integration
- real sports provider integration
- Prisma schema
- migration

It defines the domain contract those later tasks must follow.

---

# 78. Acceptance Criteria

Task 080 is complete when the domain model clearly defines:

- Provider
- ImportJob
- ImportRecord
- RawPayload
- EntityMatch
- provider independence
- import provenance
- provider external identifiers
- raw payload ownership
- matching confidence
- matching status
- matching methods
- manual review behavior
- safe failure
- duplicate/reprocessing concepts
- retry lineage
- dead-letter persistence direction
- queue correlation
- Request ID correlation
- security/privacy boundaries
- retention direction
- Prisma boundary

---

# 79. Final Domain Rules

1. Kurvenfunk canonical entities never derive their identity from a Provider.
2. Provider IDs are integration metadata, not canonical primary keys.
3. `Provider` identifies the external integration.
4. `ImportJob` identifies one durable logical import execution.
5. `ImportRecord` identifies one logical record processing result.
6. `RawPayload` preserves provider source data for reproducibility.
7. `EntityMatch` stores provider-to-canonical identity mapping.
8. Known provider mappings should be reused before textual inference.
9. Raw provider data is untrusted.
10. Raw provider data is not canonical content.
11. Matching confidence is decision-specific.
12. Ambiguity must result in safe failure/review.
13. Retry and replay create new historical processing context.
14. BullMQ is not authoritative import history.
15. PostgreSQL is the source of truth.
16. Provider secrets remain outside normal persisted Provider configuration.
17. Routine imports use import provenance rather than AuditLog spam.
18. Historical import provenance survives Provider deactivation.
19. Multiple Providers may map to the same canonical entity.
20. Task 081 must preserve these invariants in Prisma.

---

# 80. Task Result

Task 080 defines the import domain required by the Kurvenfunk architecture.

The resulting model separates:

```text
external provider identity
```

from:

```text
canonical Kurvenfunk identity
```

and establishes the durable processing chain:

```text
Provider
   ↓
ImportJob
   ↓
RawPayload
   ↓
ImportRecord
   ↓
EntityMatch
   ↓
Canonical Kurvenfunk Domain
```

This prepares the project for:

```text
Task 081 – Prisma Schema
```

and later:

```text
News Import
Sports Import
Provider Adapters
Matching
Review
Retry
Dead Letter
Import Admin
```

without coupling the core product domain to external APIs.
