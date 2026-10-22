# Club Model

## Status

Task: 062 – Club Model

Status: Defined

## Purpose

This document defines the football club domain model used by Kurvenfunk.

A Club represents a canonical football club known to the Kurvenfunk domain.

Club data is reused across multiple parts of the platform, including:

- user personalization
- public club pages
- club branding
- article assignment
- news matching
- sports data
- matches
- standings
- forums
- search
- provider imports

The Club entity is provider-independent.

External APIs, news providers and sports-data providers must map their club
identifiers and names to the canonical Kurvenfunk Club entity instead of
turning provider-specific records into the primary domain model.

## Entity

### Club

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | yes | Internal immutable Kurvenfunk club identifier |
| `name` | String | yes | Canonical full club name |
| `shortName` | String | no | Short display name used where space is limited |
| `slug` | String | yes | Stable URL-safe club identifier |
| `logoMediaId` | UUID | no | Optional reference to the Media entity defined in Task 070 |
| `primaryColor` | String | no | Primary club branding color |
| `secondaryColor` | String | no | Secondary club branding color |
| `accentColor` | String | no | Optional accent color for club theming |
| `website` | String | no | Official club website |
| `active` | Boolean | yes | Whether the club is currently active for normal platform use |
| `createdAt` | DateTime | yes | Creation timestamp |
| `updatedAt` | DateTime | yes | Last update timestamp |

## Identity

`id` is the immutable internal identity of a Club.

It must not depend on:

- the club name
- the club slug
- a provider identifier
- a league membership
- a season
- a website
- a historical branding value

A club may change names, branding, websites or competition membership without
changing its internal Kurvenfunk identity.

Provider identifiers must never be used as the primary Club identity.

## Canonical Name

`name` stores the canonical full club name used by Kurvenfunk.

Examples may include names such as:

- SK Rapid Wien
- SK Sturm Graz
- FK Austria Wien

The exact seeded club data is introduced later.

The canonical name is presentation data and may change when a club officially
changes its name.

Changing `name` must not create a new Club entity by itself.

## Short Name

`shortName` is an optional compact display name.

It may be used in UI contexts such as:

- match cards
- standings
- navigation
- mobile layouts
- compact widgets

`shortName` is not a club identifier.

It does not need to be globally unique.

Matching external data must not rely solely on `shortName`.

Club matching and alternate names are handled by the Club Alias domain in Task
063.

## Slug

`slug` is the canonical URL-safe identifier used for public club URLs.

Conceptually:

`/clubs/{slug}`

The slug must be unique within Kurvenfunk.

Examples may include:

- `sk-rapid-wien`
- `sk-sturm-graz`
- `fk-austria-wien`

The slug is application-controlled.

Provider values must not directly overwrite the canonical slug.

A slug should remain stable where reasonably possible because changing it may
affect:

- public URLs
- search engine indexing
- bookmarks
- external links

If a club changes its official name, Kurvenfunk does not automatically need to
change the existing slug.

Redirect and historical-slug behavior may be introduced later if required.

## Club Logo

Club logos belong to the shared Media domain.

The Club entity therefore does not store:

- raw image binaries
- object-storage keys
- storage provider details
- arbitrary permanent external image URLs

The intended Club reference is:

`logoMediaId`

The shared Media entity is defined in Task 070.

Until that model is introduced, `logoMediaId` remains a domain-level planned
relation.

A missing logo must not make the Club entity invalid.

The presentation layer must support an appropriate fallback.

## Club Colors

Kurvenfunk supports up to three club branding colors:

- `primaryColor`
- `secondaryColor`
- `accentColor`

These values are metadata used by the later club theme system.

They are not arbitrary frontend CSS.

The application must validate the accepted color representation before values
are persisted.

The exact technical representation may be defined during Prisma and validation
implementation.

A likely initial representation is a normalized hexadecimal color value.

For example:

`#000000`

The Club domain must not assume that every club provides all three colors.

Therefore club colors are optional.

## Theme Safety

Club colors are branding metadata, not direct authorization to render every UI
element using those colors without further validation.

The theme system introduced later must account for:

- text contrast
- background contrast
- readability
- accessibility
- unsafe color combinations
- missing colors

Kurvenfunk must remain visually identifiable even when club branding is active.

Task 109 defines the Club Theme System.

Task 282 defines accessibility requirements for club branding.

## Website

`website` stores the club's official website when known.

It is optional.

The value must represent an absolute valid URL when present.

The website is informational metadata.

It is not part of club identity and must not be used for provider matching as a
sole identifier.

## Active State

`active` controls whether a club is available for normal current platform use.

Typical active clubs may appear in:

- onboarding club selection
- club navigation
- current competition administration
- personalization choices
- normal search discovery

An inactive club remains a valid historical domain entity.

Setting:

`active = false`

does not mean:

- delete the club
- delete historical matches
- remove old article relations
- remove forum history
- invalidate historical standings
- rewrite existing references

This distinction is important because clubs may:

- leave supported competitions
- become temporarily irrelevant to the current product scope
- dissolve
- merge
- be renamed
- remain referenced by historical data

Historical references must remain intact unless a separate explicit migration
or domain decision requires otherwise.

## Deletion

Club records should generally not be physically deleted once referenced by
historical or user-facing data.

Deactivation should normally be preferred.

This protects relations from:

- historical matches
- standings
- articles
- forum content
- user preferences
- imported records

Administrative deletion rules may be defined later, but destructive deletion
must not be treated as the normal way to remove a club from current platform
selection.

## Neutral Preference

Neutral is not a Club.

Kurvenfunk must not create a synthetic Club record such as:

- Neutral
- No Club
- None

to represent a user's lack of club preference.

Task 064 defines the explicit fan preference states:

- `CLUB`
- `NEUTRAL`
- `UNSET`

A user selecting `NEUTRAL` therefore does not reference a special Club entity.

## User Relation

Task 058 reserves:

`User.favoriteClubId`

as the optional reference to the canonical Club entity.

The Club domain is the target of that relation.

A null `favoriteClubId` alone must still not be interpreted as neutral.

Task 064 defines the fan preference state needed to distinguish:

- club selected
- neutral
- not selected yet

The User domain remains the source of the user's canonical favorite-club
relation.

Profile must not duplicate that relation.

## Profile Composition

Task 059 defines public profile composition.

A public profile may combine:

User

+

Profile

+

Fan Preference

+

Club

The Club contribution may include public metadata such as:

- name
- short name
- logo
- colors

This does not make Club data part of the Profile entity.

## Club Aliases

Aliases are not stored directly as repeated fields on Club.

Task 063 introduces the Club Alias domain.

Examples may include:

- SK Rapid
- Rapid Wien
- Rapid
- SCR

Aliases are primarily required for:

- news matching
- sports-data matching
- imports
- search normalization
- provider interoperability

The canonical Club record must remain independent from the number of aliases
known for that club.

## Provider Independence

The Club model must not contain provider-specific fields such as:

- `apiFootballId`
- `sportsProviderId`
- `newsProviderClubId`
- provider-specific raw names

A club may be known by multiple external providers simultaneously.

Provider mappings therefore belong to the import/provider matching domain
introduced later.

This keeps the core Club model independent from any particular external API.

## Competition Membership

A Club is not permanently owned by a Competition.

Club membership changes between competitions and seasons.

Therefore the Club entity must not contain a single permanent field such as:

`competitionId`

for its domain identity.

Competition, season and participation relationships are modeled by their
respective sports-data domains.

Tasks 065 and 066 define Competition and Season.

Later sports-domain modeling determines the exact representation of seasonal
club participation.

## Matches

Matches reference canonical Club entities for their participants.

Task 067 defines the Match model.

Conceptually a match will reference:

- home Club
- away Club

The Club model itself does not store match history.

Match history is derived through Match relations.

## Standings

Standings reference Clubs within the context of a competition and season.

Task 068 defines the Standing model.

Standing data must not be stored directly on Club because standings vary by:

- competition
- season
- competition phase
- matchday or calculation point

## Articles

Articles may reference one or more Clubs.

Task 069 defines the Article model and the corresponding article-to-club
relationship.

Club must not store an embedded list of article IDs.

Relations are modeled from the corresponding content domain.

## Forums

Club-specific forums may later reference a Club.

The Club entity itself does not contain forum content.

Forum relations are defined by the forum domain.

## Search

Clubs are intended to be searchable.

Searchable club information may include:

- canonical name
- short name
- aliases
- slug

PostgreSQL remains the source of truth.

Meilisearch may index Club data later, but the complete Club search index must
be reconstructable from PostgreSQL.

## Import Matching

Imported data must resolve external club representations to canonical Club
entities.

Matching may use:

- provider mappings
- canonical names
- aliases
- normalized names
- additional provider metadata

Matching must not create duplicate Club records merely because different
providers use different names.

Task 063 defines aliases.

Task 080 defines import models.

Tasks 152 and 202 introduce club matching for news and sports imports.

## Data Ownership

PostgreSQL is the authoritative source of truth for canonical Kurvenfunk Club
records.

External providers may supply or update candidate data, but provider payloads
are not themselves authoritative Club entities.

Administrative correction must remain possible when provider data is:

- incorrect
- outdated
- ambiguous
- conflicting

## Public Data

Core Club metadata is intended to be public.

Typical public fields include:

- `id` where appropriate
- `name`
- `shortName`
- `slug`
- logo
- colors
- website
- active/current availability where relevant

Provider mapping metadata and import internals are separate concerns and need
not be publicly exposed.

## Validation Direction

Later implementation must validate at minimum:

### Name

- required
- trimmed
- non-empty
- sensible maximum length

### Short Name

- optional
- trimmed
- non-empty when present
- sensible maximum length

### Slug

- required
- normalized
- URL-safe
- unique
- application-controlled

### Colors

- optional
- normalized representation
- rejected when malformed

### Website

- optional
- valid absolute URL

### Active

- explicit boolean
- expected default determined during persistence implementation

Exact validation limits are intentionally deferred to implementation tasks.

## Invariants

The Club domain must preserve the following invariants:

1. Every Club has exactly one immutable internal Kurvenfunk ID.
2. Club identity does not depend on a provider identifier.
3. Every Club has a canonical non-empty name.
4. Every Club has one unique canonical slug.
5. `shortName` is presentation data and is not required to be unique.
6. Club aliases are modeled separately in Task 063.
7. External provider mappings are not embedded directly into the core Club
   model.
8. Club logos are delegated to the Media domain.
9. Club colors are optional branding metadata.
10. Theme rendering must not assume that raw club colors are automatically
    accessible.
11. Neutral fan preference is not represented by a synthetic Club.
12. A missing favorite Club does not automatically mean neutral.
13. Competition membership is not a permanent property of Club identity.
14. Match history is not stored directly on Club.
15. Standing data is not stored directly on Club.
16. Article relations are not stored as embedded identifiers on Club.
17. Inactive Clubs remain valid historical entities.
18. Deactivation does not remove historical relations.
19. Physical deletion is not the normal lifecycle operation for referenced
    Clubs.
20. PostgreSQL is authoritative for canonical Club data.
21. Search indexes must remain reconstructable from PostgreSQL.
22. Provider imports must resolve to canonical Club entities rather than
    creating provider-specific Club domains.

## Related Tasks

- Task 058 – User Model: optional favorite Club relation
- Task 059 – Profile Model: public profile composition
- Task 063 – Club Alias Model: alternate club names and matching
- Task 064 – Neutral Preference: `CLUB`, `NEUTRAL`, `UNSET`
- Task 065 – Competition Model
- Task 066 – Season Model
- Task 067 – Match Model
- Task 068 – Standing Model
- Task 069 – Article Model
- Task 070 – Media Model: Club logo relation
- Task 080 – Import Models: provider mappings and entity matching
- Task 081 – Prisma Schema: persistence implementation
- Task 083 – Seed System: initial club data
- Task 105 – Club Selection: onboarding presentation
- Task 109 – Club Theme System
- Task 111 – Personalized Club Theme
- Task 121 – Club Page
- Task 136 – Club Assignment: article relations
- Task 152 – News Import Club Matching
- Task 194 – Club Management
- Task 202 – Sports Import Club Matching
- Task 231 – Club Search Index
- Task 282 – Club Branding Accessibility
- Task 304 – Real Club Import

## Prisma Direction

Task 062 defines domain semantics only.

The complete Prisma implementation belongs to Task 081.

The expected Club mapping will approximately require:

- UUID primary key for `id`
- required `name`
- nullable `shortName`
- unique `slug`
- nullable Media relation through `logoMediaId` after Task 070
- nullable `primaryColor`
- nullable `secondaryColor`
- nullable `accentColor`
- nullable `website`
- required `active`
- automatic creation timestamp
- automatic update timestamp
- reverse relations from dependent domains where appropriate

The final schema must also account for relations introduced by later domain
tasks.

No migration is created as part of Task 062.

## Decisions

1. Club is a canonical provider-independent Kurvenfunk domain entity.
2. Club uses an immutable internal UUID as its identity.
3. `name` stores the canonical full club name.
4. `shortName` is optional presentation data and is not globally unique.
5. `slug` is unique and controlled by Kurvenfunk.
6. Slugs should remain stable where reasonably possible.
7. Club logos use the shared Media domain through the planned `logoMediaId`
   relation.
8. Club does not store storage-provider-specific logo information.
9. `primaryColor`, `secondaryColor` and `accentColor` are optional branding
   metadata.
10. Club colors must be validated before persistence.
11. The later theme system is responsible for accessibility-safe rendering.
12. `website` is optional informational metadata.
13. `active` determines availability for normal current platform use.
14. Inactive Clubs remain valid historical entities.
15. Deactivation is preferred over destructive deletion for referenced Clubs.
16. Neutral preference is not represented by a synthetic Club.
17. `User.favoriteClubId` references the canonical Club entity.
18. Fan preference semantics remain defined separately in Task 064.
19. Club aliases are modeled separately in Task 063.
20. Provider-specific identifiers are not fields of the core Club entity.
21. Competition membership is not stored as one permanent `competitionId` on
    Club.
22. Matches, standings, articles and forums reference Club from their own
    domains.
23. PostgreSQL is the source of truth for canonical Club records.
24. Meilisearch Club indexes must be reconstructable from PostgreSQL.
25. The final Prisma representation is deferred to Task 081.
