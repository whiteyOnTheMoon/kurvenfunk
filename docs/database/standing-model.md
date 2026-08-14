# Standing Domain Model

**Project:** Kurvenfunk
**Task:** 068 – Standing Model
**Status:** Domain model defined
**Target:** `docs/database/standing-model.md`

## 1. Purpose

Kurvenfunk requires canonical football standings that are independent of
external providers and consistent with the existing Competition, Season,
Stage, Club, and Match domains.

A Standing represents the current or historical table position and
accumulated sporting values of one Club within one concrete Season and,
where applicable, one Stage.

Conceptually:

```text
Competition
    |
    +-- Season
          |
          +-- Stage
          |     |
          |     +-- Standing
          |            |
          |            +-- Club
          |
          +-- Standing
                 |
                 +-- Club
```

The model must support:

-   Austrian Bundesliga regular-phase standings
-   Austrian Bundesliga Championship Group standings
-   Austrian Bundesliga Qualification Group standings
-   Austrian 2. Liga standings
-   other league-style standings
-   provider-independent canonical data
-   historical tables
-   future sports imports
-   rebuilding standings from canonical data where appropriate

Cup competitions do not require a league table for every Stage. A
Standing exists only where a table is meaningful.

------------------------------------------------------------------------

## 2. Domain Boundaries

Standing owns canonical table-row state.

Standing does **not** own:

-   Competition identity
-   Season identity
-   Stage identity
-   Club identity
-   Match identity
-   Match results
-   provider identifiers
-   raw provider payloads
-   import matching
-   editorial content

Those belong to their respective domains.

Provider-specific standing IDs or provider-specific Club IDs must not be
stored as canonical Standing identity.

------------------------------------------------------------------------

## 3. Standing Identity

Every Standing receives its own immutable internal Kurvenfunk UUID.

```text
Standing.id
```

The ID must not be derived from:

-   Club ID
-   Competition ID
-   Season ID
-   Stage ID
-   table position
-   provider identifier
-   provider row number

A Club changing position must not create a new Standing identity for the
same table scope.

------------------------------------------------------------------------

## 4. Standing Scope

A Standing belongs to exactly:

-   one Competition
-   one Season
-   one Club

and optionally:

-   one Stage

Conceptually:

```text
Standing.competitionId -> Competition.id
Standing.seasonId      -> Season.id
Standing.stageId?      -> Stage.id
Standing.clubId        -> Club.id
```

The Competition and Season references are explicit even though
Competition can be derived from Season.

This supports efficient canonical queries and makes the sporting context
explicit.

The following consistency rule is mandatory:

```text
Standing.season.competitionId == Standing.competitionId
```

If `stageId` is present:

```text
Standing.stage.seasonId == Standing.seasonId
```

These cross-row invariants may require application/domain validation if
they cannot be expressed safely in the initial Prisma schema.

------------------------------------------------------------------------

## 5. Stage-Aware Standings

Stage support is required for the Austrian Bundesliga.

Example:

```text
Season 2026/27
|
+-- Regular Phase
|     |
|     +-- Standing rows
|
+-- Championship Group
|     |
|     +-- Standing rows
|
+-- Qualification Group
      |
      +-- Standing rows
```

A Club may therefore have multiple Standing records in the same Season
when those records belong to different Stages.

The Stage is not a Competition.

The Standing must not encode Bundesliga-specific concepts such as:

```text
isChampionshipGroup
isQualificationGroup
```

Those meanings are represented through the canonical Stage relation.

For a simple league Season where a dedicated Stage is not required,
`stageId` may be null.

------------------------------------------------------------------------

## 6. Conceptual Entity

The initial Standing entity contains:

  ------------------------------------------------------------------------------------
  Field               Type                          Required Description
  ------------------- ---------------- --------------------- -------------------------
  `id`                UUID                               yes Stable internal
                                                             identifier

  `competitionId`     UUID                               yes Canonical Competition

  `seasonId`          UUID                               yes Canonical Season

  `stageId`           UUID                                no Optional canonical Stage

  `clubId`            UUID                               yes Canonical Club

  `position`          integer                            yes Current/final table
                                                             position

  `played`            integer                            yes Matches counted

  `won`               integer                            yes Wins

  `drawn`             integer                            yes Draws

  `lost`              integer                            yes Losses

  `goalsFor`          integer                            yes Goals scored

  `goalsAgainst`      integer                            yes Goals conceded

  `goalDifference`    integer                            yes Canonical goal difference

  `points`            integer                            yes Canonical table points

  `deductionPoints`   integer                            yes Administrative/sporting
                                                             deduction amount, default
                                                             `0`

  `sortOrder`         integer                             no Optional
                                                             provider-independent
                                                             tie/order aid when
                                                             canonical rules require
                                                             it

  `createdAt`         timestamp                          yes Creation timestamp

  `updatedAt`         timestamp                          yes Last persisted
                                                             modification
  ------------------------------------------------------------------------------------

The model intentionally starts with conventional table statistics.

Competition-specific rule engines and detailed tie-break metadata are
outside Task 068.

------------------------------------------------------------------------

## 7. Position

`position` is the canonical table rank for the Standing scope.

Examples:

```text
1
2
3
...
```

Rules:

-   position is positive
-   position is not the entity identity
-   position may change whenever results or corrections change
-   historical final positions remain stored with historical Standings
-   duplicate positions should normally not exist in one finalized table
    scope

The application must not identify a Standing row by position.

------------------------------------------------------------------------

## 8. Match Statistics

The canonical counters are:

```text
played
won
drawn
lost
```

All values must be non-negative.

Normally:

```text
played = won + drawn + lost
```

This is a domain invariant.

If a provider temporarily delivers inconsistent data, the import layer
must not silently corrupt canonical Standing state. Such records should
be rejected, reviewed, or normalized according to the import workflow.

------------------------------------------------------------------------

## 9. Goal Statistics

The canonical goal fields are:

```text
goalsFor
goalsAgainst
goalDifference
```

All goal totals must be non-negative except `goalDifference`, which may
be negative.

Canonical invariant:

```text
goalDifference = goalsFor - goalsAgainst
```

`goalDifference` is stored because it is a high-frequency display and
sorting value, but it must remain consistent with the canonical goal
totals.

------------------------------------------------------------------------

## 10. Points

`points` stores the canonical points value used for the table.

It must not be blindly recalculated from:

```text
won * 3 + drawn
```

because competition rules, deductions, split rules, corrections, and
historical formats may alter the displayed canonical points.

Kurvenfunk may calculate points from canonical Matches when the
competition rules are known, but the Standing model itself must support
the canonical value actually applicable to that table.

------------------------------------------------------------------------

## 11. Point Deductions

`deductionPoints` records an explicit deduction amount where relevant.

Default:

```text
0
```

Examples include:

-   administrative deductions
-   disciplinary deductions
-   competition-specific corrections

The field must not be used to model the Austrian Bundesliga split or
points-halving rules generically.

If Kurvenfunk later requires a detailed points-adjustment history, that
belongs in a dedicated sporting adjustment model rather than overloading
Standing.

------------------------------------------------------------------------

## 12. Bundesliga Split and Points Rules

The Standing model must support the Austrian Bundesliga without
hard-coding its rules.

The model therefore stores the canonical values for each Stage.

Example:

```text
Regular Phase Standing
points = canonical regular-phase points

Championship Group Standing
points = canonical championship-group points
```

Any transformation between phases, including points adjustment or
halving, belongs to season-specific sporting logic.

Standing does not store permanent fields such as:

```text
pointsBeforeHalving
pointsAfterHalving
wasRoundedUp
splitRuleVersion
```

unless a later dedicated requirement introduces them.

Historical correctness is more important than embedding one current
Bundesliga rule into the generic Standing entity.

------------------------------------------------------------------------

## 13. Club Relation

Every Standing belongs to exactly one canonical Club.

```text
Standing.clubId -> Club.id
```

The Standing must not duplicate:

-   Club name
-   Club short name
-   Club slug
-   Club colors
-   Club logo
-   provider Club ID

Those values remain owned by Club or Import domains.

A historical Standing remains valid when:

```text
Club.active = false
```

Club deactivation must not delete historical Standing records.

------------------------------------------------------------------------

## 14. Competition Relation

Every Standing belongs to exactly one canonical Competition.

```text
Standing.competitionId -> Competition.id
```

This relation must use the Kurvenfunk Competition identity.

Provider competition names or IDs must be resolved through the Import
domain before canonical assignment.

------------------------------------------------------------------------

## 15. Season Relation

Every Standing belongs to exactly one canonical Season.

```text
Standing.seasonId -> Season.id
```

Standings are never global permanent Club attributes.

A Club may have separate Standings for:

```text
Bundesliga 2025/26
Bundesliga 2026/27
ÖFB Cup context where a table exists
```

Historical Seasons retain their Standing records.

------------------------------------------------------------------------

## 16. Stage Relation

`stageId` is optional.

When present:

```text
Standing.stageId -> Stage.id
```

The Stage must belong to the same Season.

A Stage may have many Standing rows.

A Standing may belong to at most one Stage.

A Stage that does not use a table does not require Standing records.

------------------------------------------------------------------------

## 17. Match Relationship

Standing summarizes sporting state but does not own Match results.

Canonical Match data remains in the Match domain.

Conceptually:

```text
Match results
    |
    +--> standing calculation/import validation
             |
             +--> Standing
```

A Standing does not require a direct foreign key to every contributing
Match.

The relationship is derived through Competition, Season, Stage, and
participating Clubs.

------------------------------------------------------------------------

## 18. Canonical vs Imported Standings

External sports providers may deliver standings directly.

Provider data is evidence, not canonical identity.

Conceptually:

```text
Provider payload
    |
    v
RawPayload / ImportRecord
    |
    v
normalization + entity matching
    |
    v
Standing
```

The Import domain owns:

-   provider identity
-   external IDs
-   raw payload
-   import jobs
-   import records
-   matching evidence
-   retries
-   review state

Standing owns only normalized canonical table state.

------------------------------------------------------------------------

## 19. Recalculation

Kurvenfunk may later calculate Standings from canonical Match results.

The data model must support both:

1.  provider-supplied normalized standings
2.  internally recalculated standings

There is no need for separate canonical entities for those two origins.

If provenance becomes necessary, it belongs to Import/Audit metadata
rather than changing Standing identity.

------------------------------------------------------------------------

## 20. Corrections

A correction to:

-   Match score
-   Club mapping
-   points
-   deduction
-   table position

may update an existing Standing.

Such a correction does not create a new Standing identity for the same
Club/table scope.

Historical correction provenance belongs to the Import/Audit domains
where applicable.

------------------------------------------------------------------------

## 21. Uniqueness

A Club must have at most one Standing row for one canonical table scope.

For Stage-specific tables:

```text
seasonId + stageId + clubId
```

must identify one logical Standing.

For Season-level tables without a Stage:

```text
seasonId + clubId
```

must identify one logical Standing.

Because SQL/Prisma nullable unique semantics require care, Task 081 must
choose a representation that enforces both cases safely.

Possible strategies include:

-   requiring a canonical Stage for every table
-   PostgreSQL partial unique indexes
-   application enforcement plus explicit database migration constraints

The domain invariant is authoritative regardless of implementation
strategy.

------------------------------------------------------------------------

## 22. Ordering

Default table ordering is by canonical:

```text
position ASC
```

The database should not attempt to reproduce all sporting tie-break
rules merely through a generic SQL ordering expression.

The canonical `position` is authoritative after standings
calculation/normalization.

`sortOrder` may be used only where a deterministic secondary technical
order is useful. It must not silently replace sporting ranking rules.

------------------------------------------------------------------------

## 23. Deletion Behavior

Standing data is historical sports data.

Normal lifecycle operations should not hard-delete Standings merely
because:

-   a Season completes
-   a Competition becomes inactive
-   a Club becomes inactive
-   a Stage is no longer current

Preferred behavior is retention.

Hard deletion is reserved for:

-   erroneous duplicate canonical records
-   development/test cleanup
-   legally or operationally justified maintenance

Referenced canonical parents should normally use restrictive deletion
behavior where historical integrity matters.

------------------------------------------------------------------------

## 24. Expected Query Patterns

Important read paths include:

```text
standings for Season
standings for Stage
standing for Club in Season
standing for Club in Stage
table ordered by position
historical Club standings
```

Typical queries:

```text
WHERE seasonId = ?
ORDER BY position ASC
```

or:

```text
WHERE stageId = ?
ORDER BY position ASC
```

and:

```text
WHERE clubId = ?
AND seasonId = ?
```

------------------------------------------------------------------------

## 25. Recommended Indexes

Task 081 should strongly consider:

```text
Standing(seasonId, position)
Standing(stageId, position)
Standing(clubId, seasonId)
Standing(competitionId, seasonId)
```

Additional uniqueness support is required for the table-scope invariant
described above.

Exact PostgreSQL indexes may be refined later in Task 260 based on real
query plans.

------------------------------------------------------------------------

## 26. Database Constraints

The database should enforce as much as practical.

Required logical constraints:

```text
position > 0

played >= 0
won >= 0
drawn >= 0
lost >= 0

goalsFor >= 0
goalsAgainst >= 0

played = won + drawn + lost

goalDifference = goalsFor - goalsAgainst

deductionPoints >= 0
```

Cross-entity consistency:

```text
Season.competitionId = Standing.competitionId
Stage.seasonId = Standing.seasonId
```

may require application validation or migration-level PostgreSQL
constraints/triggers if Prisma cannot represent them directly.

Task 068 defines the invariant; Task 081 decides the practical initial
Prisma representation.

------------------------------------------------------------------------

## 27. No Provider Fields

Standing must not contain fields such as:

```text
provider
providerId
externalStandingId
externalClubId
externalCompetitionId
rawPayload
providerPayload
```

Those belong to Task 080 -- Import Models.

------------------------------------------------------------------------

## 28. No Presentation Duplication

Standing must not duplicate presentation data such as:

```text
clubName
clubLogo
competitionName
seasonName
stageName
```

Consumers obtain those values through canonical relations.

------------------------------------------------------------------------

## 29. No Permanent Competition Membership on Club

Standing does not change the Club-domain decision that Club membership
is season-dependent.

The existence of:

```text
Standing.clubId
Standing.competitionId
Standing.seasonId
```

does not imply:

```text
Club.competitionId
```

A Club may participate in multiple Competitions during the same football
year.

------------------------------------------------------------------------

## 30. Cup Competitions

Cup competitions do not automatically require Standings.

For a knockout Stage:

```text
Stage.type = KNOCKOUT
```

Standing rows may be absent.

If a future cup format contains a group/table phase, that Stage may use
Standing normally.

Therefore Standing availability is driven by sporting structure, not
simply by:

```text
Competition.type = LEAGUE
```

------------------------------------------------------------------------

## 31. Lifecycle

Standing does not require a separate lifecycle status enum in the
initial model.

Its lifecycle is determined by its canonical Season/Stage context.

Examples:

-   current table → Season/Stage currently relevant
-   final historical table → completed Season/Stage context
-   corrected table → same Standing identity updated

A generic `active` boolean would duplicate surrounding sporting
lifecycle state and is therefore not included initially.

------------------------------------------------------------------------

## 32. Timestamps

Every Standing stores:

```text
createdAt
updatedAt
```

`createdAt` is the time the canonical Standing row was first persisted.

`updatedAt` changes when canonical table values change.

These timestamps are operational persistence metadata, not sporting
event times.

------------------------------------------------------------------------

## 33. Relationship Summary

```text
Competition
    1
    |
    +----< Standing

Season
    1
    |
    +----< Standing

Stage
    1
    |
    +----< Standing

Club
    1
    |
    +----< Standing
```

A Standing has:

```text
one Competition
one Season
zero or one Stage
one Club
```

------------------------------------------------------------------------

## 34. Conceptual Prisma Direction

Task 068 does not modify Prisma.

Task 081 may conceptually introduce:

```prisma
model Standing {
  id               String   @id @default(uuid())
  competitionId    String
  seasonId         String
  stageId          String?
  clubId           String

  position         Int
  played           Int
  won              Int
  drawn            Int
  lost             Int
  goalsFor         Int
  goalsAgainst     Int
  goalDifference   Int
  points           Int
  deductionPoints  Int      @default(0)
  sortOrder        Int?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  competition      Competition @relation(fields: [competitionId], references: [id])
  season           Season      @relation(fields: [seasonId], references: [id])
  stage            Stage?      @relation(fields: [stageId], references: [id])
  club             Club        @relation(fields: [clubId], references: [id])
}
```

This is directional only.

Task 081 must finalize:

-   relation names
-   referential actions
-   nullable Stage uniqueness
-   indexes
-   database constraints
-   consistency with the complete schema

No migration is created as part of Task 068.

------------------------------------------------------------------------

## 35. Prisma Requirements for Task 081

When the complete Prisma schema is created, Task 081 must:

-   define `Standing`
-   add Competition relation
-   add Season relation
-   add optional Stage relation
-   add Club relation
-   add reverse relations
-   add UUID primary key
-   add timestamps
-   add table-query indexes
-   enforce one Standing per Club/table scope
-   preserve historical parent records
-   avoid ambiguous relation names
-   avoid provider-specific canonical fields
-   review PostgreSQL constraints for statistical invariants
-   verify Stage/Season/Competition consistency strategy

------------------------------------------------------------------------

## 36. Import Requirements

Task 080 -- Import Models must be able to represent imported standing
records without making provider identity canonical.

A sports import should conceptually perform:

```text
provider standing row
    |
    +--> resolve Competition
    +--> resolve Season
    +--> resolve Stage
    +--> resolve Club
    +--> validate statistics
    +--> create/update Standing
```

Unmatched or ambiguous Clubs must not silently create incorrect
canonical Standing rows.

Import failures and review-required records remain in the Import domain.

------------------------------------------------------------------------

## 37. Future Extensions

Possible future requirements include:

-   detailed points-adjustment history
-   tie-break rule metadata
-   qualification/relegation markers
-   form sequences
-   home/away split statistics
-   expected-points analytics
-   live/provisional standings
-   snapshot/history tables
-   provider comparison
-   standings recalculation versioning

These must not be added to the initial canonical model without a
concrete requirement.

------------------------------------------------------------------------

## 38. Domain Invariants

The Standing domain must preserve the following invariants:

1.  Every Standing has one immutable internal Kurvenfunk UUID.
2.  Every Standing belongs to exactly one canonical Competition.
3.  Every Standing belongs to exactly one canonical Season.
4.  Every Standing belongs to exactly one canonical Club.
5.  A Standing belongs to zero or one Stage.
6.  The Standing Season belongs to the Standing Competition.
7.  A referenced Stage belongs to the Standing Season.
8.  A Club has at most one Standing per canonical table scope.
9.  Position is positive.
10. Match counters are non-negative.
11. `played = won + drawn + lost`.
12. Goal totals are non-negative.
13. `goalDifference = goalsFor - goalsAgainst`.
14. `points` is the canonical applicable table value.
15. `deductionPoints` is non-negative.
16. Position is not Standing identity.
17. Provider IDs do not define Standing identity.
18. Provider fields do not belong on canonical Standing.
19. Club presentation data is not duplicated on Standing.
20. Competition presentation data is not duplicated on Standing.
21. Season presentation data is not duplicated on Standing.
22. Stage presentation data is not duplicated on Standing.
23. Standings are season-specific.
24. Standings may be Stage-specific.
25. Bundesliga groups are represented through Stage, not special
    Standing types.
26. Bundesliga points rules are not hard-coded into the generic Standing
    entity.
27. Cup Stages without tables do not require Standing rows.
28. Historical Standings remain queryable.
29. Club deactivation does not delete historical Standings.
30. Competition deactivation does not delete historical Standings.
31. Season completion does not delete Standings.
32. Canonical Match results remain owned by Match.
33. Standing does not require direct Match foreign keys.
34. Import provenance remains in the Import domain.
35. PostgreSQL is the source of truth for canonical Standings.
36. Derived search/cache state must be reconstructable from PostgreSQL.
37. No migration is created as part of Task 068.
38. Final Prisma implementation belongs to Task 081.

------------------------------------------------------------------------

## 39. Decisions Made in Task 068

1.  Standing is a first-class canonical domain entity.
2.  Standing represents one Club row in one Season/table scope.
3.  Competition, Season, and Club relations are mandatory.
4.  Stage relation is optional.
5.  Stage-aware Standings support the Austrian Bundesliga split.
6.  Bundesliga groups are not separate Competitions.
7.  Position is stored canonically.
8.  Played/won/drawn/lost are stored.
9.  Goals for/against/difference are stored.
10. Canonical points are stored.
11. Explicit deduction points are supported.
12. Detailed competition-rule logic is not embedded in Standing.
13. Provider identifiers remain outside Standing.
14. Standing does not duplicate Club/Competition/Season presentation
    data.
15. Historical Standings are retained.
16. A Club has one Standing per canonical table scope.
17. The initial model has no generic lifecycle status or `active` field.
18. PostgreSQL remains authoritative.
19. Prisma implementation is deferred to Task 081.
20. No migration is created in Task 068.

------------------------------------------------------------------------

## 40. Related Tasks

Standing directly depends on:

-   Task 062 -- Club Model
-   Task 065 -- Competition Model
-   Task 066 -- Season Model
-   Task 067 -- Match Model

Standing is used by or relevant to:

-   Task 080 -- Import Models
-   Task 081 -- Prisma Schema
-   Task 083 -- Seed System
-   Task 199 -- Sports Provider Interface
-   Task 203 -- Sports Data Normalization
-   Task 204 -- Match Import
-   Task 206 -- Standings Import
-   Task 210 -- Standings API
-   Task 211 -- Standings Widget
-   Task 260 -- Database Indexes

------------------------------------------------------------------------

## 41. Preparation for Task 081 -- Prisma Schema

Task 081 must reconcile Standing with the final definitions of:

```text
Competition
Season
Stage
Club
Match
ImportRecord
EntityMatch
```

Particular attention is required for the uniqueness rule when `stageId`
is nullable.

The domain invariant is:

```text
one Club
+
one canonical table scope
=
one Standing
```

The Prisma schema must preserve that invariant as strongly as practical
without introducing Bundesliga-specific persistence rules.

------------------------------------------------------------------------

## 42. Summary

Standing is Kurvenfunk's canonical representation of one Club's row in a
football table.

The model is:

```text
Standing
├── Competition
├── Season
├── optional Stage
├── Club
├── position
├── played / won / drawn / lost
├── goals for / against / difference
├── points
└── optional table-order metadata
```

It supports simple league tables as well as Stage-specific tables such
as the Austrian Bundesliga regular phase, Championship Group, and
Qualification Group.

Provider-specific identities and raw payloads remain in the Import
domain.

Task 068 defines the domain contract only. The concrete Prisma
implementation is completed in Task 081.
