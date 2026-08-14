# Season Model

## Status

Task: 066 -- Season Model

Status: Defined

## Purpose

This document defines the Season domain model used by Kurvenfunk.

A Season represents one specific edition of a canonical Competition.

A Competition is a long-lived identity. A Season is a time-bound
sporting edition of that Competition and contains the season-specific
competition structure required to represent the sporting format of that
edition.

The model must support the initial Austrian competitions:

-   Austrian Bundesliga
-   Austrian 2. Liga
-   ÖFB Cup

The model must remain generic enough to support future domestic and
international competitions and competition-format changes.

------------------------------------------------------------------------

## Core Principle

A Season is not a Competition.

A Competition identifies the enduring competition.

A Season identifies one concrete edition of that Competition.

``` text
Competition
    |
    +-- Season
    +-- Season
    +-- Season
```

Example:

``` text
Austrian Bundesliga
    |
    +-- 2024/25
    +-- 2025/26
    +-- 2026/27
```

Every Season belongs to exactly one Competition.

------------------------------------------------------------------------

## Season Identity

A Season has its own stable internal identity.

The Season identity must remain stable even when:

-   its sporting status changes
-   its public display name changes
-   its stage structure is populated or updated
-   external provider data is imported
-   related Clubs change
-   Matches are imported
-   Standings are recalculated

The canonical internal identity is:

``` text
Season.id
```

`Season.id` is an immutable UUID.

A new edition of a Competition creates a new Season rather than
modifying an existing historical Season into the new edition.

For example:

``` text
Austrian Bundesliga 2025/26
```

and:

``` text
Austrian Bundesliga 2026/27
```

are different Seasons belonging to the same Competition.

------------------------------------------------------------------------

## Competition Relationship

A Season belongs to exactly one Competition.

Conceptually:

``` text
Competition
    |
    +-- Season
```

The relationship is mandatory.

A Season without a Competition is not a valid canonical domain record.

The Competition remains responsible for the long-lived identity.

The Season is responsible for the concrete edition.

The Season must therefore not duplicate Competition identity fields as
an alternative canonical identity.

For example, the following is not valid as a separate Season identity:

``` text
competitionName = "Austrian Bundesliga"
seasonName = "Bundesliga"
```

The canonical relationship is:

``` text
Season.competitionId -> Competition.id
```

The exact persistence implementation is deferred to the database task.

------------------------------------------------------------------------

## Initial Season Entity

The conceptual Season entity contains:

  -------------------------------------------------------------------------
  Field             Type                          Required Description
  ----------------- ---------------- --------------------- ----------------
  `id`              UUID                               yes Stable internal
                                                           Season
                                                           identifier

  `competitionId`   UUID                               yes Reference to the
                                                           canonical
                                                           Competition

  `name`            string                             yes Human-readable
                                                           Season name

  `slug`            string                             yes Stable canonical
                                                           Season slug

  `startDate`       date                               yes Planned or
                                                           canonical Season
                                                           start date

  `endDate`         date                               yes Planned or
                                                           canonical Season
                                                           end date

  `status`          enum                               yes Season lifecycle
                                                           status

  `active`          boolean                            yes Whether the
                                                           Season is
                                                           currently active
                                                           for normal use

  `createdAt`       timestamp                          yes Creation
                                                           timestamp

  `updatedAt`       timestamp                          yes Last update
                                                           timestamp
  -------------------------------------------------------------------------

These fields define Season identity and lifecycle.

Detailed sporting rules do not belong directly in these fields.

------------------------------------------------------------------------

## Season Name

`name` is the canonical human-readable name of the Season.

Typical examples:

``` text
2025/26
2026/27
```

The name may be displayed together with the Competition:

``` text
Austrian Bundesliga 2026/27
```

but the Competition name is not part of the Season identity.

A Season name must not contain sponsor-dependent Competition naming.

For example, the Season should not need to become:

``` text
ADMIRAL Bundesliga 2026/27
```

to represent a sponsor change.

The canonical Competition remains responsible for the competition
identity.

------------------------------------------------------------------------

## Season Slug

Every Season has one canonical slug.

Examples:

``` text
2025-26
2026-27
```

The exact public URL composition may later combine Competition and
Season slugs.

For example:

``` text
austrian-bundesliga/2026-27
```

The Season slug is not a substitute for the internal UUID.

A slug should normally remain stable after creation.

If a slug must change, existing references and public URLs must be
handled by the application layer.

A slug change must not create a second Season representing the same
edition.

------------------------------------------------------------------------

## Season Uniqueness

Two Seasons belonging to the same Competition must not represent the
same canonical edition.

The intended domain uniqueness is based on:

``` text
competition + canonical season identity
```

For conventional season naming this can be represented by:

``` text
competitionId + slug
```

A globally unique Season slug is not required by the domain.

For example, these are valid:

``` text
Austrian Bundesliga / 2026-27
Austrian 2. Liga       / 2026-27
ÖFB Cup                / 2026-27
```

because they belong to different Competitions.

------------------------------------------------------------------------

## Season Dates

`startDate` and `endDate` define the canonical temporal boundaries of a
Season.

They describe the Season as a whole.

They must not be confused with:

-   Match kickoff times
-   individual Stage dates
-   Matchday dates
-   registration deadlines
-   transfer windows
-   administrative deadlines

A Season may contain Stages whose actual sporting activity occurs within
the Season period.

The exact handling of uncertain or provider-derived dates belongs to the
import and administration layers.

The canonical Season dates remain Kurvenfunk domain data.

------------------------------------------------------------------------

## Season Date Invariants

The following rules apply:

1.  `startDate` must not be later than `endDate`.
2.  A historical Season remains associated with its original dates.
3.  Changing the current Season does not rewrite historical Seasons.
4.  Stage dates may be more granular than Season dates.
5.  Match dates are independent Match-level data.

The domain must not infer a Season solely from a Match date.

The Season is an explicit canonical context.

------------------------------------------------------------------------

## Season Lifecycle

A Season has a lifecycle independent of the Competition's `active` flag.

The initial Season status enum is:

``` text
PLANNED
ACTIVE
COMPLETED
CANCELLED
```

### PLANNED

The Season exists as a future or prepared edition.

Examples:

``` text
2026/27
```

before its sporting activity begins.

A planned Season may already contain:

-   basic metadata
-   Competition relationship
-   planned dates
-   known Stages
-   known participating Clubs
-   imported schedule metadata

It is not yet the current active sporting edition.

### ACTIVE

The Season is currently in progress or is the operational current
edition.

A Competition may have at most one normal current Season in a given
Competition context.

The exact administration rules for activating Seasons belong to the
application/administration layer.

### COMPLETED

The Season has finished.

Completed Seasons remain queryable.

Historical Matches, Standings, Articles and other domain references must
remain usable.

A completed Season must not be deleted merely because it is no longer
active.

### CANCELLED

The Season was created but will not be completed as a normal sporting
edition.

Cancellation is a historical state and must not be used as a substitute
for deletion.

A cancelled Season remains referenceable if domain data was created for
it.

------------------------------------------------------------------------

## Active Flag

`active` describes whether the Season is currently relevant for normal
application use.

It is intentionally separate from `status`.

Examples:

``` text
status = ACTIVE
active = true
```

is the normal current Season.

A historical Season may be:

``` text
status = COMPLETED
active = false
```

A cancelled Season will normally be:

``` text
status = CANCELLED
active = false
```

The `active` flag must not be interpreted as:

-   whether Matches are currently being played
-   whether the Season has already started
-   whether the Competition itself is active
-   whether a Stage is active
-   whether Clubs are registered

Those are separate concerns.

------------------------------------------------------------------------

## Competition Active vs Season Active

The Competition `active` field and the Season `active` field have
different meanings.

Example:

``` text
Competition
    Austrian Bundesliga
    active = true

Season
    2025/26
    active = false
    status = COMPLETED

Season
    2026/27
    active = true
    status = ACTIVE
```

The historical Season remains valid even though it is not active.

A Competition can also become inactive while its historical Seasons
remain queryable.

------------------------------------------------------------------------

## Current Season

The domain must support identifying the current operational Season of a
Competition.

This must not require modifying the Competition identity.

The current Season is determined through Season lifecycle data and
administration rules.

The domain must not permanently store a mutable:

`text Competition.currentSeasonId`

as the only source of truth.

The canonical relationship remains:

`text Competition     |     +-- Seasons`

and the current operational Season is resolved from the Season state.

If application requirements later need a denormalized current-season
reference, it must remain derived or consistency-managed data rather
than replacing the canonical Season relationship.

------------------------------------------------------------------------

## Historical Seasons

Historical Seasons are first-class domain records.

A completed Season must remain available for:

-   historical Match data
-   historical Standings
-   historical Articles
-   Club participation history
-   statistics
-   archive pages
-   provider reconciliation
-   data analysis

Historical Seasons must not be rewritten to match current Competition
rules.

For example, if the Bundesliga changes format in 2027/28, the 2026/27
Season must retain its own historical structure.

------------------------------------------------------------------------

# Season-Specific Structure

## Why a Stage Abstraction Is Required

A Season may contain one or more season-specific sporting Stages.

This is necessary because the initial Austrian Competitions do not all
use the same format.

A Bundesliga Season may contain:

``` text
Regular Phase
Championship Group
Qualification Group
```

An ÖFB Cup Season may contain:

``` text
Round 1
Round 2
Round of 16
Quarterfinal
Semifinal
Final
```

A 2. Liga Season may have a league structure without the Bundesliga
split.

The Season model therefore must not assume one fixed Stage structure.

------------------------------------------------------------------------

## Season and Stage

Conceptually:

``` text
Season
    |
    +-- Stage
    +-- Stage
    +-- Stage
```

A Stage is a season-specific structural component.

A Stage always belongs to exactly one Season.

A Stage must not become a separate Competition.

Examples:

``` text
Bundesliga 2026/27
    |
    +-- Regular Phase
    +-- Championship Group
    +-- Qualification Group
```

The Competition remains:

``` text
Austrian Bundesliga
```

------------------------------------------------------------------------

## Stage Identity

A Stage has its own stable internal identity.

The conceptual Stage entity contains:

  Field             Type          Required Description
  ----------------- ----------- ---------- ----------------------------------------
  `id`              UUID               yes Stable internal Stage identifier
  `seasonId`        UUID               yes Reference to the Season
  `parentStageId`   UUID                no Optional parent Stage
  `name`            string             yes Human-readable Stage name
  `slug`            string             yes Canonical Stage slug within the Season
  `type`            enum               yes Broad Stage category
  `sequence`        integer            yes Ordering within the Season
  `createdAt`       timestamp          yes Creation timestamp
  `updatedAt`       timestamp          yes Last update timestamp

This is a conceptual domain definition.

The persistence implementation and exact foreign-key constraints are
deferred to the database task.

------------------------------------------------------------------------

## Stage Types

The initial Stage type abstraction is:

``` text
REGULAR
GROUP
KNOCKOUT
```

### REGULAR

`REGULAR` represents a normal league or initial competition phase.

Example:

``` text
Regular Phase
```

### GROUP

`GROUP` represents a season-specific grouped phase.

Examples:

``` text
Championship Group
Qualification Group
```

The type does not define the number of Clubs, points rules or
qualification rules.

### KNOCKOUT

`KNOCKOUT` represents a knockout-oriented stage.

Examples:

``` text
Round of 16
Quarterfinal
Semifinal
Final
```

The type does not itself define bracket rules, aggregate scoring or
extra-time rules.

Those details belong to the relevant sporting models.

------------------------------------------------------------------------

## Stage Type Is Not a Format Rule

Stage type is a broad structural classification.

It must not become a container for detailed competition rules.

For example, the following must not be hard-coded as Stage properties
merely because the Bundesliga uses them:

``` text
pointsHalving
splitAfterRound
promotionCount
relegationCount
numberOfTeams
```

These are format-specific sporting rules and require a separate model if
they become necessary.

------------------------------------------------------------------------

## Stage Ordering

Every Stage has a `sequence`.

The sequence defines the intended ordering within a Season.

Example:

``` text
1 Regular Phase
2 Championship Group
3 Qualification Group
```

or:

``` text
1 Round 1
2 Round 2
3 Round of 16
4 Quarterfinal
5 Semifinal
6 Final
```

The sequence is a structural ordering value.

It does not itself determine:

-   Match scheduling
-   advancement rules
-   qualification
-   standings calculation
-   points calculation

------------------------------------------------------------------------

## Parent Stages

A Stage may optionally reference another Stage as its parent.

This supports structures such as:

``` text
Season
    |
    +-- Regular Phase
          |
          +-- Championship Group
          +-- Qualification Group
```

The exact interpretation of parent/child relationships must remain
generic.

A parent Stage does not automatically imply any particular sporting
rule.

The parent relationship is useful when one stage creates or leads into
multiple subsequent stages.

For a flat knockout structure, parent relationships may remain unused:

``` text
Round 1
Round 2
Round of 16
Quarterfinal
Semifinal
Final
```

------------------------------------------------------------------------

## Stage Hierarchy

Stage hierarchies must not be assumed to be deeper than necessary.

The domain should support:

``` text
Season
└── Stage
    ├── Stage
    └── Stage
```

without requiring arbitrary recursive structures for every competition.

The application should only create hierarchy where the sporting format
actually requires it.

------------------------------------------------------------------------

# Austrian Bundesliga

## Bundesliga as Competition

The Austrian Bundesliga remains one canonical Competition:

``` text
Austrian Bundesliga
```

The Bundesliga split must not create:

``` text
Championship Group Competition
Qualification Group Competition
```

Those are Stages of a Season.

------------------------------------------------------------------------

## Bundesliga Season Example

A relevant Bundesliga Season may be represented conceptually as:

``` text
Austrian Bundesliga
└── Season 2026/27
    ├── Regular Phase
    ├── Championship Group
    └── Qualification Group
```

Possible Stage records:

``` text
name: Regular Phase
type: REGULAR
sequence: 1
```

``` text
name: Championship Group
type: GROUP
sequence: 2
parentStage: Regular Phase
```

``` text
name: Qualification Group
type: GROUP
sequence: 3
parentStage: Regular Phase
```

These examples describe structure only.

They do not define the exact Bundesliga rules.

------------------------------------------------------------------------

## Bundesliga Split

The model must support a split after an initial phase.

The split is represented through the Season's Stage structure.

The Season itself does not need fields such as:

``` text
hasSplit
splitAfterRound
championshipGroupCount
qualificationGroupCount
```

The Stage structure expresses the existence of the relevant phases.

------------------------------------------------------------------------

## Points and Split Rules

The Season Model must not hard-code Bundesliga points rules.

For example, if a Season uses a points-halving rule, that rule must be
associated with the appropriate sporting-format model rather than
inferred merely from:

``` text
Stage.type = GROUP
```

Likewise, the existence of a Championship Group does not itself define:

-   how points are carried over
-   how many Clubs qualify
-   how fixtures are generated
-   how ranking is calculated
-   how European qualification is determined
-   how relegation is determined

Those concerns belong to later sports-domain models.

------------------------------------------------------------------------

## Historical Bundesliga Formats

Different Bundesliga Seasons may have different structures.

For example:

``` text
Bundesliga 2025/26
    |
    +-- Regular Phase
    +-- Championship Group
    +-- Qualification Group
```

must be able to coexist with a future format such as:

``` text
Bundesliga 2030/31
    |
    +-- Regular Phase
    +-- different season-specific structure
```

without creating a new canonical Competition.

Historical Seasons retain their own Stage structure.

------------------------------------------------------------------------

# Austrian 2. Liga

## Independent Competition

The Austrian 2. Liga is a separate Competition:

``` text
Austrian 2. Liga
```

It is not represented as:

``` text
Austrian Bundesliga.level = 2
```

and it is not a special Stage of the Bundesliga.

It has its own Seasons:

``` text
Austrian 2. Liga
    |
    +-- 2025/26
    +-- 2026/27
```

------------------------------------------------------------------------

## 2. Liga Season

A 2. Liga Season may use a regular league Stage.

Conceptually:

``` text
Austrian 2. Liga
└── Season 2026/27
    └── League Phase
```

A different naming convention may be used if the canonical data source
uses a different official name.

The model does not require the 2. Liga to have the same Stage structure
as the Bundesliga.

------------------------------------------------------------------------

## Promotion and Relegation

Promotion and relegation are Season-specific sporting outcomes.

The Season Model must not encode permanent fields such as:

``` text
promotionCount
relegationCount
promotedClubId
relegatedClubId
```

A Season may provide the context in which those outcomes are later
represented.

The actual rules and results belong to the relevant competition,
standings, match or promotion/relegation domain models.

------------------------------------------------------------------------

# ÖFB Cup

## Independent Competition

The ÖFB Cup is a first-class Competition:

``` text
ÖFB Cup
type = CUP
```

It is not a League with a special flag.

Each edition is represented as a Season:

``` text
ÖFB Cup
    |
    +-- 2025/26
    +-- 2026/27
```

------------------------------------------------------------------------

## Cup Season Structure

A Cup Season may use knockout-oriented Stages:

``` text
ÖFB Cup
└── Season 2026/27
    ├── Round 1
    ├── Round 2
    ├── Round of 16
    ├── Quarterfinal
    ├── Semifinal
    └── Final
```

Possible Stage examples:

``` text
Round 1
type = KNOCKOUT
sequence = 1
```

``` text
Round of 16
type = KNOCKOUT
sequence = 3
```

``` text
Final
type = KNOCKOUT
sequence = 6
```

These values describe structural organization only.

The Season Model does not define:

-   draw procedures
-   home/away draw rules
-   extra time
-   penalty shootouts
-   aggregate scoring
-   away-goal rules
-   qualification rules
-   participant eligibility

Those belong to later sporting models or competition-rule configuration.

------------------------------------------------------------------------

# Club Participation

## Season-Dependent Participation

A Club's participation in a Competition is Season-specific.

The Club model explicitly avoids a permanent:

``` text
Club.competitionId
```

relationship.

Instead, participation belongs to the seasonal sports model.

Conceptually:

``` text
Club
    |
    +-- Season participation
             |
             +-- Season
             +-- Competition
```

------------------------------------------------------------------------

## Participation Scope

The exact participation entity is not fully implemented by the Season
Model.

However, 066 establishes the required domain boundary:

-   Clubs are canonical entities.
-   Competition membership is not permanent Club identity.
-   Participation is associated with a Season.
-   Stage-specific participation may be required.
-   A Club may participate in multiple Competitions during the same
    overall football season.

For example:

``` text
Club A
    |
    +-- Bundesliga 2026/27
    +-- ÖFB Cup 2026/27
```

This is valid.

------------------------------------------------------------------------

## Stage Participation

Some competitions require Stage-specific participation.

For example, in the Bundesliga:

``` text
Club A
    |
    +-- Regular Phase
    |
    +-- Championship Group
```

A Club may move from one Stage to another as the Season progresses.

The Stage relationship must therefore not be represented by permanently
changing the Club's canonical identity.

The detailed participation entity is outside the narrow scope of this
Season Model and must be resolved together with the Match and Standing
models.

------------------------------------------------------------------------

# Match Relationship

Matches belong to a specific Season context.

Conceptually:

``` text
Competition
    |
    +-- Season
          |
          +-- Stage
                |
                +-- Match
```

A Match must ultimately be able to identify:

-   Competition
-   Season
-   Stage where applicable

Task 067 defines the Match model.

The Season Model establishes the required seasonal context but does not
define Match fields.

------------------------------------------------------------------------

# Standing Relationship

Standings are Season-specific and may also be Stage-specific.

Conceptually:

``` text
Season
    |
    +-- Stage
          |
          +-- Standing
```

This is especially important for the Bundesliga:

``` text
Regular Phase standings
Championship Group standings
Qualification Group standings
```

The Standing Model is defined in Task 068.

The Season Model must therefore permit a Stage structure without
embedding standing calculations into Season.

------------------------------------------------------------------------

# Articles and Season

Articles may reference a Competition and may later require Season
context.

Examples:

``` text
Article
    |
    +-- Competition -> Austrian Bundesliga
```

and, where historically or contextually relevant:

``` text
Article
    |
    +-- Competition -> Austrian Bundesliga
    +-- Season -> 2026/27
```

The Article Model is defined in Task 069.

Season references must remain canonical and provider-independent.

------------------------------------------------------------------------

# Provider Independence

Season is a provider-independent Kurvenfunk domain entity.

External providers may identify a Season using:

-   provider-specific Season IDs
-   league-season IDs
-   tournament IDs
-   competition-year identifiers
-   textual season labels

These values must not become the canonical Season identity.

For example:

``` text
Provider A:
seasonId = 123

Provider B:
leagueSeasonId = 4567
```

may both map to:

``` text
Austrian Bundesliga / 2026/27
```

The provider mapping belongs to the provider/import layer.

------------------------------------------------------------------------

## Provider Season Names

Providers may return different labels:

``` text
2026
2026/27
2026-2027
Austrian Bundesliga 2026/27
```

These values may be useful for matching.

They do not automatically define the canonical Season name or identity.

Provider-specific matching must resolve to the canonical Season.

------------------------------------------------------------------------

## Provider Matching

A provider Season may be matched using:

-   canonical Competition mapping
-   provider-specific identifiers
-   normalized season labels
-   start and end dates
-   provider configuration
-   manual mappings
-   other provider-specific metadata

Ambiguous matching must fail safely.

The import layer must not create duplicate canonical Seasons merely
because two providers use different labels for the same edition.

------------------------------------------------------------------------

# Season Format Changes

## Format Belongs to the Season Structure

Competition format can change from one Season to another.

The canonical Competition remains unchanged.

For example:

``` text
Austrian Bundesliga
    |
    +-- Season 2025/26
    |      +-- Regular Phase
    |      +-- Championship Group
    |      +-- Qualification Group
    |
    +-- Season 2026/27
           +-- season-specific structure
```

The second Season must not inherit the first Season's Stage structure
merely because both belong to the same Competition.

Each Season owns its own structural representation.

------------------------------------------------------------------------

## No Current-Format Reinterpretation

Historical Seasons must not be interpreted using current format
assumptions.

For example, if the Bundesliga changes its split structure in a future
Season, queries for a historical Season must continue to use the
historical Stage structure associated with that Season.

This is essential for:

-   historical standings
-   historical Matches
-   historical statistics
-   archive pages
-   provider reconciliation

------------------------------------------------------------------------

# Season Status Rules

## Valid Status Transitions

The intended lifecycle is:

``` text
PLANNED
   |
   v
ACTIVE
   |
   v
COMPLETED
```

A planned Season may also become:

``` text
PLANNED
   |
   v
CANCELLED
```

A cancelled Season must not later be silently reused as a different
edition.

A completed Season must not be reopened merely to represent a later
edition.

A new edition creates a new Season.

------------------------------------------------------------------------

## Status and Dates

Status and dates represent different concepts.

For example:

``` text
status = PLANNED
startDate = 2026-07-01
endDate = 2027-06-30
```

is valid.

A Season can be planned before its start date.

Similarly, administrative corrections to dates must not be interpreted
as status transitions.

------------------------------------------------------------------------

# Deletion Policy

Season records should not normally be hard-deleted once referenced by:

-   Matches
-   Standings
-   Articles
-   Club participation
-   Stages
-   imports
-   other historical domain records

Historical integrity takes precedence over physical deletion.

A Season that is no longer operational should normally use an
appropriate lifecycle status rather than deletion.

------------------------------------------------------------------------

# Scope

Task 066 defines:

-   Season identity
-   Competition relationship
-   Season naming
-   Season slug
-   Season dates
-   Season lifecycle
-   active state
-   historical Season behavior
-   Season-specific structural model
-   generic Stage abstraction
-   Stage identity
-   Stage ordering
-   optional Stage hierarchy
-   initial Stage types
-   Austrian Bundesliga split representation
-   Austrian 2. Liga Season representation
-   ÖFB Cup Season representation
-   boundaries for Club participation
-   boundaries for Match and Standing relationships
-   provider independence
-   provider matching boundaries
-   format-change behavior
-   historical integrity

Task 066 does not define:

-   Match
-   Standing
-   detailed Club participation persistence
-   detailed promotion/relegation rules
-   detailed points calculation
-   detailed Bundesliga points-halving rules
-   draw procedures
-   knockout scoring rules
-   provider mapping persistence
-   API endpoints
-   frontend pages
-   Prisma migration

These are handled by later tasks.

------------------------------------------------------------------------

# Non-Goals

The following are explicitly not Season fields:

``` text
hasChampionshipGroup
hasQualificationGroup
splitAfterRound
pointsHalving
numberOfTeams
promotionCount
relegationCount
roundCount
currentStandings
currentMatchday
currentChampion
promotedClubId
relegatedClubId
```

These values are either:

-   Stage structure
-   competition rules
-   Match data
-   Standing data
-   participation/outcome data
-   administration state

and must not be collapsed into the Season identity.

------------------------------------------------------------------------

# Relationship Overview

The intended domain direction is:

``` text
Competition
    |
    +-- Season
          |
          +-- Stage
          |     |
          |     +-- Stage
          |
          +-- season participation
          |
          +-- Match
          |
          +-- Standing
```

Additional references may exist from:

``` text
Article ------> Competition / Season
Import -------> canonical Competition / Season
Club ---------> season-specific participation
Match ---------> Competition / Season / Stage
Standing ------> Competition / Season / Stage
```

The exact foreign-key structure is intentionally resolved by the
respective domain models and database tasks.

------------------------------------------------------------------------

# Example Domain Structures

## Austrian Bundesliga 2026/27

``` text
Competition
    Austrian Bundesliga
        |
        +-- Season
              name: 2026/27
              |
              +-- Stage
              |     name: Regular Phase
              |     type: REGULAR
              |     sequence: 1
              |
              +-- Stage
              |     name: Championship Group
              |     type: GROUP
              |     sequence: 2
              |     parent: Regular Phase
              |
              +-- Stage
                    name: Qualification Group
                    type: GROUP
                    sequence: 3
                    parent: Regular Phase
```

The example intentionally does not define point-halving or exact
participant counts.

------------------------------------------------------------------------

## Austrian 2. Liga 2026/27

``` text
Competition
    Austrian 2. Liga
        |
        +-- Season
              name: 2026/27
              |
              +-- Stage
                    name: League Phase
                    type: REGULAR
                    sequence: 1
```

The exact league format remains a sporting-rule concern.

------------------------------------------------------------------------

## ÖFB Cup 2026/27

``` text
Competition
    ÖFB Cup
        |
        +-- Season
              name: 2026/27
              |
              +-- Stage
              |     name: Round 1
              |     type: KNOCKOUT
              |     sequence: 1
              |
              +-- Stage
              |     name: Round 2
              |     type: KNOCKOUT
              |     sequence: 2
              |
              +-- Stage
              |     name: Round of 16
              |     type: KNOCKOUT
              |     sequence: 3
              |
              +-- Stage
              |     name: Quarterfinal
              |     type: KNOCKOUT
              |     sequence: 4
              |
              +-- Stage
              |     name: Semifinal
              |     type: KNOCKOUT
              |     sequence: 5
              |
              +-- Stage
                    name: Final
                    type: KNOCKOUT
                    sequence: 6
```

------------------------------------------------------------------------

# Non-Examples

The following must not become separate Competition records:

``` text
Bundesliga 2026/27
```

This is a Season.

``` text
Bundesliga Championship Group
```

This is a Stage.

``` text
Bundesliga Qualification Group
```

This is a Stage.

``` text
ÖFB Cup Quarterfinal
```

This is a Stage of an ÖFB Cup Season.

``` text
Provider Season ID 123
```

This is provider-specific data.

``` text
ADMIRAL Bundesliga 2026/27
```

This may be a provider or official display label, but sponsor naming
does not define the canonical Competition or Season identity.

------------------------------------------------------------------------

# Important Invariants

The following rules are normative.

1.  Every Season has a stable internal UUID.
2.  Every Season belongs to exactly one Competition.
3.  A Competition may have many Seasons.
4.  A Season represents one concrete edition of a Competition.
5.  A new edition must create a new Season.
6.  Historical Seasons remain referenceable.
7.  Season identity is independent of external provider identifiers.
8.  Provider-specific Season IDs do not define canonical Season
    identity.
9.  Season dates describe the Season as a whole.
10. `startDate` must not be later than `endDate`.
11. Season lifecycle is independent of Competition lifecycle.
12. The initial Season statuses are `PLANNED`, `ACTIVE`, `COMPLETED`,
    and `CANCELLED`.
13. `active` does not mean that Matches are currently being played.
14. A completed Season must not be deleted as normal lifecycle handling.
15. A cancelled Season remains historical if domain data exists.
16. A Season may contain multiple season-specific Stages.
17. Every Stage belongs to exactly one Season.
18. A Stage is not a Competition.
19. Bundesliga Championship Group is a Stage, not a Competition.
20. Bundesliga Qualification Group is a Stage, not a Competition.
21. ÖFB Cup knockout rounds are Stages, not Competitions.
22. Stage ordering is represented by `sequence`.
23. Stage hierarchy may be represented through an optional parent Stage.
24. Stage types are broad structural classifications.
25. Stage types do not define detailed sporting rules.
26. Season format must not be encoded as a fixed set of
    Bundesliga-specific boolean fields.
27. Historical Season structure must remain independent from later
    format changes.
28. Club participation is Season-specific.
29. A Club must not have a permanent Competition membership through
    `competitionId`.
30. Match data must be Season-aware.
31. Standing data must be Season-aware.
32. Competition remains the canonical long-lived identity.
33. PostgreSQL remains the source of truth for canonical Season records.
34. No Prisma migration is created as part of Task 066.

------------------------------------------------------------------------

# Decisions

The following decisions are final for Task 066:

1.  Season is a first-class domain entity.
2.  Season is distinct from Competition.
3.  Every Season belongs to exactly one Competition.
4.  A Competition may have many Seasons.
5.  Season identity is represented by a stable UUID.
6.  Season has canonical name and slug fields.
7.  Season identity is not based on provider-specific IDs.
8.  Season has explicit start and end dates.
9.  Season has an explicit lifecycle status.
10. The initial lifecycle statuses are `PLANNED`, `ACTIVE`, `COMPLETED`,
    and `CANCELLED`.
11. Season has an `active` flag separate from lifecycle status.
12. Historical Seasons remain queryable.
13. A new edition creates a new Season.
14. Season-specific sporting structure belongs to the Season, not
    Competition.
15. Season supports a generic Stage abstraction.
16. Stage belongs to exactly one Season.
17. Stage has a generic type rather than a Bundesliga-specific entity
    type.
18. Initial Stage types are `REGULAR`, `GROUP`, and `KNOCKOUT`.
19. Stage ordering is represented by `sequence`.
20. Stage hierarchy may use an optional `parentStageId`.
21. Bundesliga Regular Phase is represented as a Stage.
22. Bundesliga Championship Group is represented as a Stage.
23. Bundesliga Qualification Group is represented as a Stage.
24. Bundesliga groups are not Competitions.
25. Austrian 2. Liga is represented through its own Competition and
    Seasons.
26. ÖFB Cup is represented through its own Competition and Seasons.
27. ÖFB Cup knockout rounds are represented as Stages.
28. Detailed promotion and relegation rules are not Season fields.
29. Detailed points rules are not Season fields.
30. Detailed Match rules are not Season fields.
31. Detailed Standing calculations are not Season fields.
32. Club participation is season-specific.
33. Provider-specific Season identifiers remain in the provider/import
    layer.
34. Season format changes between editions must be representable.
35. Historical Seasons must not be reinterpreted using current format
    rules.
36. Competition remains provider-independent.
37. PostgreSQL remains the canonical source of truth.
38. No Prisma migration is created as part of Task 066.

------------------------------------------------------------------------

# Task Boundaries

Task 066 establishes the Season domain contract required by subsequent
sports-domain tasks.

Task 067 -- Match Model must build on:

``` text
Competition
    |
    +-- Season
          |
          +-- Stage
                |
                +-- Match
```

Task 068 -- Standing Model must build on:

``` text
Competition
    |
    +-- Season
          |
          +-- Stage
                |
                +-- Standing
```

Future Club participation modeling must build on:

``` text
Club
    |
    +-- Season participation
          |
          +-- Stage participation
```

The Season Model deliberately leaves those downstream entities
responsible for their own detailed rules.

------------------------------------------------------------------------

# Final Domain Summary

The resulting model is:

``` text
Competition
    |
    +-- Season
          |
          +-- Stage
          |     |
          |     +-- Stage
          |
          +-- Participation
          |
          +-- Match
          |
          +-- Standing
```

For the initial Austrian domain:

``` text
Austrian Bundesliga
└── Season
    ├── Regular Phase
    ├── Championship Group
    └── Qualification Group
```

``` text
Austrian 2. Liga
└── Season
    └── season-specific league structure
```

``` text
ÖFB Cup
└── Season
    ├── Round 1
    ├── Round 2
    ├── Round of 16
    ├── Quarterfinal
    ├── Semifinal
    └── Final
```

This preserves the required separation:

``` text
Competition = enduring competition identity
Season      = one concrete competition edition
Stage       = season-specific sporting structure
Match       = individual sporting event
Standing    = season/stage-specific ranking state
```

No Prisma migration is created as part of Task 066.
