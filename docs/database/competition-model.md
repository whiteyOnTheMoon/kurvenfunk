# Competition Model

## Status

Task: 065 – Competition Model

Status: Defined

## Purpose

This document defines the Competition domain model used by Kurvenfunk.

A Competition represents a canonical football competition independently of any
specific season.

A Competition is a long-lived domain entity. Individual Seasons belong to a
Competition and contain the season-specific sporting structure.

The model must support the initial Austrian competitions:

- Austrian Bundesliga
- Austrian 2. Liga
- ÖFB Cup

The model must also remain generic enough to support additional domestic and
international competitions later.

---

## Core Principle

A Competition is not a Season.

The Competition identifies the enduring competition.

A Season identifies one specific edition of that Competition.

```text
Competition
    |
    +-- Season
    +-- Season
    +-- Season
```

For example:

```text
Austrian Bundesliga
    |
    +-- 2024/25
    +-- 2025/26
    +-- 2026/27
```

---

## Initial Competitions

The initial Kurvenfunk domain contains three first-class Competitions.

### Austrian Bundesliga

```text
name: Austrian Bundesliga
shortName: Bundesliga
slug: austrian-bundesliga
type: LEAGUE
countryCode: AT
```

The official display name may contain a current sponsor name.

A sponsor-dependent display name must not become the stable identity of the
Competition.

### Austrian 2. Liga

```text
name: Austrian 2. Liga
shortName: 2. Liga
slug: austrian-2-liga
type: LEAGUE
countryCode: AT
```

The Austrian 2. Liga is a first-class Competition and is not modeled as a
special case or level of the Austrian Bundesliga.

### ÖFB Cup

```text
name: ÖFB Cup
shortName: ÖFB Cup
slug: oefb-cup
type: CUP
countryCode: AT
```

The ÖFB Cup is a first-class Competition.

It uses the same Competition domain model but may have a fundamentally
different season and match structure from league competitions.

---

## Entity

The conceptual Competition entity contains:

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | UUID | yes | Stable internal identifier |
| `name` | string | yes | Canonical Competition name |
| `shortName` | string | no | Optional shorter display name |
| `slug` | string | yes | Stable canonical slug |
| `type` | enum | yes | Competition type |
| `countryCode` | string | no | ISO country code for domestic competitions |
| `active` | boolean | yes | Whether the Competition is currently active |
| `createdAt` | timestamp | yes | Creation timestamp |
| `updatedAt` | timestamp | yes | Last update timestamp |

No provider-specific identifiers are part of this entity.

---

## Identity

### Internal ID

`id` is the immutable internal identity of a Competition.

It must not change when:

- the display name changes
- a sponsor changes
- the Competition is temporarily inactive
- a new Season begins
- the Competition format changes

### Canonical Slug

Every Competition has one unique canonical `slug`.

Examples:

```text
austrian-bundesliga
austrian-2-liga
oefb-cup
```

The slug is intended to provide a stable domain and URL identity.

The slug must not contain temporary sponsor names.

For example:

```text
austrian-bundesliga
```

is preferred over:

```text
admiral-bundesliga
```

The exact public naming strategy may later be extended for SEO, but the domain
identity must remain stable.

### Name

`name` represents the canonical Competition name used by the Kurvenfunk
domain.

The name may be changed if the canonical naming convention changes.

Changing the display name does not create a new Competition.

### Short Name

`shortName` is optional.

It may be used where the full Competition name does not fit.

`shortName` is not the Competition identity.

---

## Competition Type

The initial Competition type enum is:

```text
LEAGUE
CUP
```

### LEAGUE

`LEAGUE` represents a league competition.

Examples:

- Austrian Bundesliga
- Austrian 2. Liga

### CUP

`CUP` represents a cup competition.

Example:

- ÖFB Cup

The type describes the broad Competition category.

It must not contain detailed season-format rules.

---

## Country Context

`countryCode` stores the ISO 3166-1 alpha-2 country code when the Competition
has a single national context.

Initial examples:

```text
Austrian Bundesliga -> AT
Austrian 2. Liga    -> AT
ÖFB Cup             -> AT
```

The field is nullable because not every future Competition must belong to one
country.

For example, an international competition could have no single
`countryCode`.

Country context must not be confused with the nationality of participating
Clubs.

---

## Active Status

`active` indicates whether a Competition is currently active for normal
application use.

`active = true` means the Competition is currently relevant to the
operational system.

`active = false` means the Competition is no longer active for normal current
use.

An inactive Competition is not deleted.

Historical data must remain queryable.

`active` therefore does not mean:

- whether the Competition historically existed
- whether a Season is currently running
- whether Matches are currently scheduled
- whether the Competition has participating Clubs

Those are separate concerns.

---

## Competition and Season

A Competition may have many Seasons.

A Season belongs to exactly one Competition.

Examples:

```text
Austrian Bundesliga
    |
    +-- 2025/26
    +-- 2026/27

Austrian 2. Liga
    |
    +-- 2025/26
    +-- 2026/27

ÖFB Cup
    |
    +-- 2025/26
    +-- 2026/27
```

The detailed Season model is defined in Task 066.

---

## Season Format Must Not Be Stored on Competition

Competition must not contain fields such as:

```text
roundCount
hasSplit
groupCount
pointsHalving
numberOfTeams
playoffFormat
promotionRule
relegationRule
```

These values can change between Seasons.

A Competition can therefore remain the same while its sporting format changes.

This is particularly important for the Austrian Bundesliga.

---

## Austrian Bundesliga Format

The Austrian Bundesliga is a required reference case for the domain model.

A Bundesliga Season may contain a regular phase followed by season-specific
groups or phases.

Conceptually:

```text
Austrian Bundesliga
    |
    +-- Season 2025/26
           |
           +-- Regular phase
           |
           +-- Championship Group
           |
           +-- Qualification Group
```

The historical and current format must not be encoded directly into
`Competition`.

For example, the Competition must not contain:

```text
hasChampionshipGroup
hasQualificationGroup
splitAfterRound
pointsHalving
```

Such properties belong to the season-specific competition structure.

This allows different Bundesliga Seasons to represent different sporting
rules while still belonging to the same Competition.

---

## Competition Phases

A Competition itself does not represent a phase.

Examples of possible season-specific phases include:

- Regular Season
- Championship Group
- Qualification Group
- Knockout Round
- Quarterfinal
- Semifinal
- Final

These are not separate Competitions.

The exact domain representation of season phases is intentionally left to the
Season / Match / Standing domain design.

Task 065 does not introduce a permanent Bundesliga-specific phase model.

---

## Austrian Bundesliga Group Split

The Bundesliga must be modeled in a way that supports a split after the regular
phase.

For the relevant Seasons, the structure may be:

```text
Austrian Bundesliga
    |
    +-- Season
           |
           +-- Regular phase
           |
           +-- Championship Group
           |
           +-- Qualification Group
```

The groups are part of the specific Season structure.

They are not:

```text
Competition = Championship Group
Competition = Qualification Group
```

This distinction is mandatory.

The exact split round and points rules are Season-specific and must not be
stored as permanent Competition properties.

---

## Season Format Changes

The Competition model must support changes in sporting regulations without
creating a new Competition.

For example, if the Bundesliga changes:

- points calculation
- group structure
- number of rounds
- qualification rules
- promotion/relegation rules
- scheduling format

the Competition remains:

```text
Austrian Bundesliga
```

Only the relevant Season-specific model changes.

This prevents historical Seasons from being reinterpreted using current rules.

---

## Austrian 2. Liga

The Austrian 2. Liga is modeled independently from the Bundesliga.

It must not be represented as:

```text
Austrian Bundesliga.level = 2
```

or as a special property of the Bundesliga.

Instead:

```text
Competition
    |
    +-- Austrian Bundesliga
    |
    +-- Austrian 2. Liga
```

Both are independent Competition records.

This allows each Competition to have its own Seasons, participating Clubs,
Matches and standings.

---

## ÖFB Cup

The ÖFB Cup is also an independent Competition.

It must not be modeled as a League with a special flag.

Instead:

```text
Competition
    |
    +-- ÖFB Cup
          type = CUP
```

Its Season can have a knockout-oriented structure that differs fundamentally
from league competitions.

Competition type therefore provides the broad distinction, while the detailed
format remains Season-specific.

---

## Club Relationship

Competition does not own Clubs directly.

A Club is a canonical entity independent of any Competition.

A Club may participate in different Competitions across different Seasons.

Conceptually:

```text
Club
    |
    +-- Season participation
             |
             +-- Competition
```

This prevents a permanent:

```text
Club.competitionId
```

relationship.

For example, a Club can participate in the Austrian Bundesliga in one Season
and the Austrian 2. Liga in another Season without changing its canonical Club
identity.

---

## Competition Membership

The fact that a Club participates in a Competition is season-dependent.

Therefore participation should ultimately be represented through the
season-specific sports model rather than through a permanent Competition
foreign key on Club.

The exact participation entity and constraints are outside the scope of this
Task and must be resolved together with the Season and Standing models.

---

## Match Relationship

Matches belong to a specific sporting context.

A Match must ultimately be associated with a Season and Competition context.

Competition alone is insufficient to identify a Match because the same
Competition contains multiple Seasons.

Conceptually:

```text
Competition
    |
    +-- Season
          |
          +-- Match
```

The detailed Match model is defined in Task 067.

---

## Standing Relationship

Standings are also season-specific.

The same Competition may have different standings for different Seasons.

Therefore:

```text
Competition
    |
    +-- Season
          |
          +-- Standing
```

A Competition must not directly store the current table.

The Standing model is defined in Task 068.

---

## Articles and Competition

Articles may reference a Competition.

For example:

```text
Article
    |
    +-- Competition -> Austrian Bundesliga
```

This allows Competition-based news filtering and personalization.

The Article model itself is defined in Task 069.

Competition references from Articles must refer to the canonical Competition
entity rather than provider-specific IDs.

---

## Provider Independence

Competition is a provider-independent Kurvenfunk domain entity.

External sports providers may identify competitions using their own identifiers.

Those identifiers must not become the canonical Competition identity.

Example:

```text
Provider A:
competitionId = 123

Provider B:
leagueId = 4567
```

Both may refer to:

```text
Austrian Bundesliga
```

The provider identifiers belong to the provider/import layer.

---

## Provider Matching

External provider data may be matched to a canonical Competition using:

- provider-specific identifiers
- provider configuration
- normalized names
- country context
- competition type
- manual mappings
- other provider-specific matching data

The matching process must resolve to the canonical Competition.

It must not modify the Competition identity based on an external provider.

---

## Provider-Specific Competition Names

Provider names must not automatically replace the canonical Competition name.

For example, a provider may return:

```text
Admiral Bundesliga
```

while another provider returns:

```text
Austrian Bundesliga
```

These values may be useful for matching and provider metadata but do not
create separate Competitions.

---

## Sponsor Names

Sponsor names are not part of the stable Competition identity.

The domain must tolerate changes such as:

```text
ADMIRAL Bundesliga
```

becoming another official sponsor-dependent name.

The same principle applies to the Austrian 2. Liga and other competitions.

A sponsor rename must not result in:

- a new Competition
- duplicated Seasons
- duplicated Matches
- duplicated Clubs
- broken historical references

---

## Historical Competitions

Historical Competition records must be retained.

If a Competition becomes inactive:

```text
active = false
```

historical Seasons and related sporting data remain available.

Deletion of a Competition must therefore not be used as a normal way to retire
a Competition.

Historical integrity takes precedence over physical deletion.

---

## Slug Uniqueness

`slug` must be unique within the Competition domain.

Two Competition records must not have the same canonical slug.

Examples:

```text
austrian-bundesliga
austrian-2-liga
oefb-cup
```

are distinct.

The uniqueness is independent of display names.

---

## Name Uniqueness

The canonical `name` should normally be unique among active Competitions, but
name must not be treated as the immutable identity.

Historical or renamed Competition records may require more flexible handling.

The canonical identity remains `id`, and the stable public/domain identifier is
`slug`.

---

## Slug Changes

Changing a slug should be considered a controlled domain operation.

A slug should normally remain stable after creation.

If a slug must change, the application must preserve historical references and
handle existing public URLs appropriately.

A slug change must never create a second Competition representing the same
canonical competition.

---

## Active Competition Rules

An active Competition may be used for:

- new Season creation
- normal administration
- current sports data imports
- current news matching
- public Competition navigation

An inactive Competition may still be used for:

- historical Seasons
- historical Matches
- historical Standings
- historical Articles
- archive pages
- data analysis

The exact API permissions for activating/deactivating Competitions belong to
the administration layer.

---

## Deletion Policy

Competition records should not normally be hard-deleted once referenced by
Seasons or other domain entities.

Historical sports data depends on stable Competition identity.

If a Competition is no longer used, it should normally be marked:

```text
active = false
```

rather than deleted.

---

## Example Domain Records

### Austrian Bundesliga

```text
name: Austrian Bundesliga
shortName: Bundesliga
slug: austrian-bundesliga
type: LEAGUE
countryCode: AT
active: true
```

### Austrian 2. Liga

```text
name: Austrian 2. Liga
shortName: 2. Liga
slug: austrian-2-liga
type: LEAGUE
countryCode: AT
active: true
```

### ÖFB Cup

```text
name: ÖFB Cup
shortName: ÖFB Cup
slug: oefb-cup
type: CUP
countryCode: AT
active: true
```

---

## Non-Examples

The following must not become Competition records:

```text
Bundesliga 2025/26
```

This is a Season.

```text
Bundesliga Championship Group
```

This is a season-specific phase/group.

```text
Bundesliga Qualification Group
```

This is a season-specific phase/group.

```text
Bundesliga Matchday 17
```

This is a Match/round concept.

```text
ADMIRAL Bundesliga
```

This may be the current display name of the canonical Austrian Bundesliga,
but sponsor naming must not define the Competition identity.

```text
Provider Bundesliga ID 123
```

This is provider-specific data, not the canonical Competition identity.

---

## Scope

Task 065 defines:

- Competition identity
- Competition naming
- Competition slug
- Competition type
- country context
- active state
- Competition/Season separation
- Competition/Club separation
- provider independence
- initial Austrian Competitions
- boundaries for season-specific formats

Task 065 does not define:

- Season
- Season phases
- Competition stages
- Club participation records
- Match
- Standing
- promotion/relegation rules
- detailed league format rules
- provider mapping persistence
- Prisma migration
- API endpoints
- frontend pages

These are handled by later tasks.

---

## Relationship Overview

The intended domain direction is:

```text
Competition
    |
    +-- Season
          |
          +-- season-specific structure
          |
          +-- participating Clubs
          +-- Matches
          +-- Standings
```

Additional references may exist from:

```text
Article ------> Competition
Match --------> Competition / Season context
Standing -----> Competition / Season context
Import -------> canonical Competition
```

The exact foreign-key structure is intentionally deferred to the respective
domain models.

---

## Important Invariants

The following rules are normative.

1. Every Competition has a stable internal UUID.
2. Every Competition has one canonical slug.
3. Competition slugs are unique.
4. Competition is independent of Season.
5. Competition is independent of Club membership.
6. Competition is provider-independent.
7. Provider-specific competition IDs do not define Competition identity.
8. Sponsor names do not define Competition identity.
9. Competition type is `LEAGUE` or `CUP` for the initial model.
10. `countryCode` is optional.
11. Austrian Bundesliga is a `LEAGUE`.
12. Austrian 2. Liga is a `LEAGUE`.
13. ÖFB Cup is a `CUP`.
14. The Austrian Bundesliga is not modeled as multiple Competitions for its
    season phases.
15. Championship Group and Qualification Group are not Competitions.
16. Season-specific format rules do not belong on Competition.
17. A Competition may have many Seasons.
18. A Season belongs to one Competition.
19. Historical Competitions must remain referenceable.
20. Inactive Competitions must not be treated as deleted.
21. Club membership must not be stored as a permanent `competitionId` on Club.
22. Match and Standing data must be season-aware.
23. Competition names may change without creating a new Competition.
24. Competition slugs should remain stable.
25. The canonical Competition must remain independent from external providers.
26. PostgreSQL remains the source of truth for canonical Competition records.
27. No Prisma migration is created as part of Task 065.

---

## Decisions

The following decisions are final for Task 065:

1. Competition is a first-class domain entity.
2. Competition is independent of Season.
3. The initial model includes Austrian Bundesliga, Austrian 2. Liga and ÖFB
   Cup.
4. League and Cup are represented through a Competition type.
5. The initial Competition types are `LEAGUE` and `CUP`.
6. Competition has a stable canonical slug.
7. Sponsor-dependent names are not used as stable Competition identity.
8. `countryCode` is supported.
9. `active` represents operational status, not historical existence.
10. Historical Competitions remain stored.
11. Competition is provider-independent.
12. Provider IDs belong to provider/import mapping logic.
13. Clubs do not receive a permanent `competitionId`.
14. Club participation is season-dependent.
15. Competition does not contain detailed season-format rules.
16. Bundesliga phase/group structure is not modeled as separate Competitions.
17. Bundesliga format changes must be representable between Seasons.
18. Austrian 2. Liga is a first-class Competition, not a Bundesliga level flag.
19. ÖFB Cup is a first-class Competition, not a special league variant.
20. Competition names can change without creating duplicate Competitions.
21. Slugs are unique within the Competition domain.
22. No hard deletion is intended for referenced historical Competitions.
23. No Prisma migration is created as part of Task 065.

---

## Future Considerations

The following may be required by later domain models:

- Competition stages/phases
- season-specific format configuration
- group definitions
- round definitions
- competition participation
- promotion/relegation relationships
- provider-specific Competition mappings
- competition aliases
- historical naming
- localized Competition names

These concerns must not be prematurely embedded into the Competition entity if
they are season-specific or provider-specific.

---

## Dependency on Task 066

Task 066 – Season Model must build on this definition.

In particular, Season must answer:

- which Competition it belongs to
- which season period it represents
- whether it is active/current
- how its season-specific format is represented
- how the Austrian Bundesliga split is represented
- how the Austrian 2. Liga season structure is represented
- how the ÖFB Cup season structure is represented

The Season model must preserve the distinction between:

```text
Competition identity
```

and:

```text
Season format
```

---

## Dependency on Task 067

Task 067 – Match Model must support Matches that belong to a specific
Competition and Season context.

The Match model must be able to represent both league and cup Matches without
making Competition itself responsible for Match format.

---

## Dependency on Task 068

Task 068 – Standing Model must support season-specific standings.

The model must be capable of representing the Austrian Bundesliga's
season-specific group structure without changing the canonical Competition
record.

---

## Dependency on Task 080

Task 080 – Import Models must provide the appropriate abstraction for external
Competition identifiers and provider mappings.

Those identifiers must not be added to the canonical Competition entity merely
for import convenience.

---

## Prisma Boundary

Task 065 defines the domain contract only.

No Prisma schema or migration is created as part of this task.

The later Prisma implementation must preserve the invariants defined here.

The final persistence model should include appropriate database constraints,
including at minimum:

- primary key for `id`
- unique constraint for `slug`
- required fields according to this specification
- appropriate indexes for expected lookup patterns

The exact Prisma implementation belongs to Task 081.

---

## Summary

Competition represents a stable, provider-independent football competition.

The initial Kurvenfunk Competitions are:

```text
Austrian Bundesliga
Austrian 2. Liga
ÖFB Cup
```

They are modeled as:

```text
Competition
    |
    +-- Season
          |
          +-- season-specific format
          |
          +-- Clubs
          +-- Matches
          +-- Standings
```

The Austrian Bundesliga's split after the regular phase is explicitly a
season-specific concern and must not be encoded as permanent Competition
properties.

This allows Kurvenfunk to represent historical and future Competition formats
without changing the canonical identity of the underlying Competition.
