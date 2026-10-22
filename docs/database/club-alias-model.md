# Club Alias Model

## Status

Task: 063 – Club Alias Model

Status: Defined

## Purpose

This document defines the Club Alias domain model used by Kurvenfunk.

A ClubAlias represents an alternative textual name by which a canonical Club
may be known.

Examples include:

- SK Rapid
- Rapid Wien
- Rapid
- SCR

Club aliases are primarily used to resolve external textual club references to
canonical Kurvenfunk Club entities.

Typical use cases include:

- news import matching
- sports-data import matching
- provider normalization
- search normalization
- administrative import correction
- entity matching

The canonical Club model remains defined separately in Task 062.

## Core Principle

A ClubAlias is not a Club.

It is an alternate textual representation of one canonical Club.

The relationship is:

Club

→ has zero or more ClubAlias records

A ClubAlias must always belong to exactly one canonical Club.

Aliases must never create an independent provider-specific Club identity.

## Entity

The ClubAlias domain approximately contains:

| Field | Type | Required | Purpose |
| --- | --- | --- | --- |
| `id` | UUID | yes | Internal immutable Kurvenfunk identifier |
| `clubId` | UUID | yes | Canonical Club referenced by the alias |
| `alias` | String | yes | Human-readable alias value |
| `normalizedAlias` | String | yes | Deterministic normalized value used for matching |
| `type` | ClubAliasType | yes | Semantic classification of the alias |
| `active` | Boolean | yes | Whether the alias may normally participate in matching |
| `createdAt` | DateTime | yes | Creation timestamp |
| `updatedAt` | DateTime | yes | Last update timestamp |

The exact persistence representation is deferred to Task 081.

## Identity

Every ClubAlias receives its own immutable internal Kurvenfunk UUID.

The alias text itself is not the entity identity.

This allows:

- alias text to be corrected
- aliases to be disabled
- metadata to evolve
- references to remain stable

The ClubAlias ID must not be derived from:

- alias text
- normalized alias text
- Club ID
- provider identifiers

## Club Relation

Every ClubAlias belongs to exactly one canonical Club.

Conceptually:

`ClubAlias.clubId -> Club.id`

A Club may have:

- no aliases
- one alias
- many aliases

Deleting or changing an alias must not change the identity of the Club.

Aliases are dependent domain data and do not replace the canonical Club name.

## Alias

`alias` stores the human-readable alternate club name.

Examples:

`SK Rapid`

`Rapid Wien`

`Rapid`

`SCR`

Other possible examples may include:

- historical naming variants
- abbreviations
- commonly used short forms
- spelling variants
- provider-observed textual variants where appropriate

The stored alias should preserve the meaningful human-readable representation.

It must not be replaced by the normalized value.

## Canonical Club Name

The canonical club name remains:

`Club.name`

An alias must not silently overwrite `Club.name`.

For example:

Canonical Club:

`Sportklub Rapid Wien`

Possible aliases:

- `SK Rapid Wien`
- `SK Rapid`
- `Rapid Wien`
- `Rapid`
- `SCR`

Changing or adding aliases therefore does not redefine the canonical Club
record.

## Short Name

`Club.shortName` remains presentation data.

It is not automatically equivalent to a ClubAlias.

A short name may also be stored as an alias when it should participate in
matching, but this is an explicit domain decision.

Matching must not assume that every `Club.shortName` is globally unique or
sufficient to identify a Club.

## Alias Types

Club aliases are classified using `ClubAliasType`.

Expected initial values:

- `OFFICIAL_VARIANT`
- `SHORT_NAME`
- `ABBREVIATION`
- `ALTERNATIVE`
- `HISTORICAL`

### OFFICIAL_VARIANT

Represents another official or formal textual representation of the Club.

Example:

Canonical:

`Sportklub Rapid Wien`

Alias:

`SK Rapid Wien`

### SHORT_NAME

Represents a commonly used shortened club name.

Examples:

- `Rapid Wien`
- `Rapid`

The type does not imply global uniqueness.

### ABBREVIATION

Represents an abbreviation or acronym.

Example:

`SCR`

Abbreviations must be treated carefully because short textual values have a
higher risk of collisions.

### ALTERNATIVE

Represents another legitimate textual form that does not fit a more specific
classification.

This may include:

- spelling variants
- alternate spacing
- frequently observed naming variants

### HISTORICAL

Represents a previous or historical club name that may still occur in archived
content or external data.

A historical alias does not mean the Club itself is inactive.

Historical naming and Club lifecycle are separate concepts.

## Provider Independence

ClubAlias remains provider-independent.

The alias entity must not contain provider-specific identity fields such as:

- `providerId`
- `providerClubId`
- `apiFootballId`
- `newsProviderId`
- `sportsProviderId`

Provider mappings belong to the import/provider domain introduced in Task 080.

This distinction is important.

For example:

A provider may identify Rapid using:

Provider ID:

`12345`

Provider name:

`Rapid Vienna`

The provider ID mapping belongs to the provider/import domain.

If `Rapid Vienna` is considered a useful textual alias independent of that
single provider, it may additionally exist as a ClubAlias.

Provider observations must not automatically become permanent canonical
aliases without validation.

## Alias Source

The core ClubAlias model does not require a provider-specific `source` field.

An alias is canonical Kurvenfunk domain data once accepted.

Information about which provider supplied or observed a raw value belongs to
the import domain.

This prevents the ClubAlias table from becoming a storage location for
provider-specific raw payload data.

Administrative provenance or audit requirements may be added through the
appropriate import or audit domains later.

## Normalized Alias

`normalizedAlias` is the deterministic matching representation derived from
`alias`.

It exists so equivalent textual forms can be compared consistently.

For example:

`  Rapid   Wien `

may normalize to:

`rapid wien`

The exact implementation belongs to later matching tasks, but normalization
must be deterministic and reproducible.

The normalized value must be reconstructable from the original alias according
to the active normalization rules.

## Normalization Goals

Normalization should handle safe textual differences such as:

- leading whitespace
- trailing whitespace
- repeated internal whitespace
- case differences
- selected punctuation differences where semantically safe

For example:

`Rapid Wien`

and:

` rapid   wien `

should normally produce the same normalized representation.

Normalization must not aggressively remove meaningful words.

## Conservative Normalization

Normalization must remain conservative.

It must not blindly remove words such as:

- city names
- regional names
- club designators
- numbers
- meaningful abbreviations

For example, transforming multiple distinct clubs into the same value merely
to improve matching would create unsafe automatic matches.

Normalization is a comparison aid, not a fuzzy matching engine.

## Diacritics

Diacritic handling must be explicit and deterministic.

The later matching implementation may derive additional comparison forms when
useful.

The original `alias` must always preserve the accepted human-readable spelling.

Normalization must not destroy the original stored alias.

## Punctuation

Punctuation differences may be normalized where they are clearly
non-semantic.

However, punctuation must not be removed indiscriminately if doing so could
change meaning or increase collisions.

Exact normalization behavior is deferred to implementation and matching tasks.

## Case Sensitivity

Club alias matching is expected to be case-insensitive after normalization.

For example:

`SCR`

and:

`scr`

may produce the same normalized comparison value.

The original casing remains stored in `alias`.

## Whitespace

Aliases must be trimmed before persistence.

Empty or whitespace-only aliases are invalid.

Repeated whitespace may be collapsed in the normalized representation.

The display alias should retain a clean human-readable form.

## Duplicate Aliases for the Same Club

The same effective normalized alias should normally not be stored more than
once for the same Club.

For example, the following records for the same Club would normally be
redundant:

- `Rapid Wien`
- ` rapid wien `
- `RAPID WIEN`

if all normalize to the same value.

The persistence model should prevent or reject equivalent duplicate aliases
within one Club where practical.

A likely uniqueness direction is:

`clubId + normalizedAlias`

The final database constraint belongs to Task 081.

## Global Alias Uniqueness

`normalizedAlias` must not be assumed to be globally unique.

Different Clubs may legitimately share an alias or normalized alias.

This is especially possible with:

- abbreviations
- short names
- generic club names
- historical names
- clubs from different countries
- clubs from different regions

Therefore Kurvenfunk must not enforce a global invariant that every alias maps
to exactly one Club.

## Ambiguous Aliases

An alias that resolves to multiple Clubs is ambiguous.

Ambiguity must be represented by matching behavior rather than solved by
silently choosing one Club.

Example:

Input:

`United`

If multiple Clubs have a matching alias, an import must not automatically
select one merely because it appears first in a database query.

Possible later outcomes include:

- use provider mapping
- use competition context
- use country context
- use match context
- use other provider metadata
- lower the confidence score
- require manual review

The ClubAlias domain itself does not choose between ambiguous Clubs.

## Exact Alias Matching

An exact normalized alias match is useful evidence but is not always sufficient
for automatic entity resolution.

Conceptually:

external name

→ normalize

→ find matching ClubAlias records

Possible result counts:

0 matches

→ alias does not resolve the Club

1 match

→ strong candidate

multiple matches

→ ambiguous candidate set

Later matching tasks determine whether additional context makes the result safe
to accept.

## Canonical Name Matching

Club matching may use both:

- `Club.name`
- ClubAlias records

The existence of aliases does not require duplication of the canonical
`Club.name` as a ClubAlias.

Matching services may normalize and compare the canonical Club name separately.

This avoids unnecessary duplicate domain data.

## Slug Matching

`Club.slug` is a canonical Kurvenfunk URL identifier.

It is not a ClubAlias.

External imports must not assume that provider names are valid Kurvenfunk
slugs.

Slug matching may be available in controlled internal contexts but should not
replace alias matching for arbitrary external names.

## Matching Pipeline Direction

A later matching pipeline may approximately use:

external provider record

→ provider mapping lookup

→ canonical name comparison

→ alias comparison

→ normalized comparison

→ contextual metadata

→ confidence assessment

→ canonical Club

The exact ordering and scoring belong to Tasks 152 and 202.

ClubAlias only supplies one important source of matching evidence.

## Provider Mapping Priority

When a trusted explicit provider mapping exists, it is normally stronger
evidence than matching a textual alias.

For example:

provider club ID

→ known canonical Club ID

is safer than repeatedly inferring identity from:

provider club name

→ ClubAlias

Aliases remain essential when:

- a provider mapping does not yet exist
- news text contains club names
- raw textual data must be normalized
- provider mappings need initial discovery
- search needs alternate names

## News Matching

News content may mention clubs using forms that differ from canonical database
names.

Examples may include:

- full names
- short names
- abbreviations
- colloquial names

Task 152 introduces the actual news club matching process.

ClubAlias provides structured alternate names for that process.

A text occurrence alone must not automatically prove article relevance where
the alias is short or ambiguous.

For example, a very short abbreviation may require stronger context.

## Sports-Data Matching

Sports providers may return different textual names for the same Club.

Task 202 introduces sports-data Club matching.

Where provider mappings are unavailable, aliases may help identify candidates.

Once a stable provider entity identifier has been mapped, that provider
mapping should generally be preferred over repeatedly resolving the textual
name.

## Search

Club aliases may later be included in the Club search index.

This allows users to find a Club using alternate names.

For example, searching for:

`SCR`

may return the canonical Rapid Club page.

Meilisearch remains a derived index.

PostgreSQL remains the source of truth for ClubAlias records.

The complete search index must be reconstructable from PostgreSQL.

## Active

`active` determines whether an alias should normally participate in current
matching and search behavior.

An inactive alias remains stored for historical or administrative purposes.

Setting:

`active = false`

does not delete the canonical Club.

It only disables normal use of that alias.

Possible reasons include:

- alias entered incorrectly
- alias became misleading
- ambiguity became unacceptable
- alias is no longer suitable for automatic matching

Historical aliases may remain active when they are intentionally useful for
historical content matching.

Alias type and active state are separate concepts.

## Deletion

Physical deletion should not be the default operation for established aliases
that may have influenced imports or administrative decisions.

Deactivation is generally preferred where historical traceability matters.

Exact audit and deletion policies belong to later administration and audit
tasks.

## Club Lifecycle

An inactive Club may still have aliases.

Deactivating a Club does not automatically require deleting or deactivating all
of its aliases.

Historical content and imports may still need to resolve old names to the
inactive canonical Club.

Current application behavior must consider both:

- Club lifecycle
- alias lifecycle

where relevant.

## Manual Management

Administrative Club management introduced later should support reviewing and
maintaining aliases.

Expected operations may include:

- add alias
- edit alias
- change type
- activate alias
- deactivate alias
- inspect collisions
- inspect ambiguous normalized aliases

Administration must not silently convert imported raw names into trusted
aliases without validation.

## Import Suggestions

External imports may discover previously unknown textual variants.

Such values may be treated as alias candidates.

A candidate is not automatically a trusted ClubAlias.

Later import workflows may support:

external value

→ candidate match

→ confidence evaluation

→ automatic acceptance when sufficiently safe

or:

→ manual review

→ alias creation if appropriate

Raw provider payload storage remains part of Task 080.

## Confidence

ClubAlias itself does not store a permanent matching confidence score.

Confidence describes a particular matching decision and its context.

For example, the same alias may produce:

- high confidence in one competition
- low confidence without competition context
- ambiguous results in global matching

Confidence therefore belongs to the entity matching/import process rather than
the alias definition.

Task 155 introduces confidence scoring for news imports.

## Matching Safety

Automatic matching must fail safely.

The system must prefer:

unknown

or:

ambiguous

over assigning data to the wrong Club.

Incorrect Club assignment may affect:

- news personalization
- club pages
- search
- sports data
- match data
- article relations
- forum context

Therefore aliases are matching evidence, not permission to guess.

## Validation Direction

Later implementation must validate at minimum:

### Alias

- required
- trimmed
- non-empty after trimming

### Normalized Alias

- required
- deterministically generated
- non-empty
- not trusted directly from arbitrary client input

### Club

- referenced Club must exist

### Type

- must be a valid `ClubAliasType`

### Active

- explicit boolean
- expected default determined during persistence implementation

Exact string-length limits and normalization implementation details are deferred
to implementation tasks.

## API Direction

Public Club responses may expose aliases where useful for search or club
information, but aliases do not need to be included in every Club response.

Import-specific metadata must not be exposed merely because an alias exists.

Administrative endpoints may later provide full alias management.

The exact API shape belongs to later API and Club Management tasks.

## Security

Club aliases are not sensitive personal data.

Nevertheless, alias modification is domain administration and must be
permission-controlled once write APIs are introduced.

Untrusted users must not be able to create aliases that manipulate import
matching or search results.

## Audit Direction

Administrative changes to aliases may affect entity resolution.

Important alias changes should therefore become auditable when the Audit Log
domain from Task 078 is implemented.

Potential audited actions include:

- alias created
- alias modified
- alias activated
- alias deactivated
- alias reassigned to another Club

Exact audit event definitions are deferred.

## Index Direction

The persistence implementation should support efficient lookup by:

- `clubId`
- `normalizedAlias`
- `active`

Likely useful index directions include:

`normalizedAlias`

and:

`clubId`

A composite uniqueness rule for:

`clubId + normalizedAlias`

should be considered to prevent duplicate effective aliases for the same Club.

Global uniqueness of `normalizedAlias` must not be enforced.

Final indexes belong to Task 081 and Task 260.

## Invariants

The Club Alias domain must preserve the following invariants:

1. Every ClubAlias has one immutable internal Kurvenfunk ID.
2. Every ClubAlias belongs to exactly one canonical Club.
3. A Club may have zero or more aliases.
4. `alias` stores the human-readable alternate name.
5. `normalizedAlias` is derived deterministically from `alias`.
6. The original human-readable alias is preserved.
7. Empty aliases are invalid.
8. Alias matching is case-insensitive through normalization.
9. Equivalent aliases for the same Club should not be stored repeatedly.
10. `normalizedAlias` is not globally unique.
11. The same normalized alias may refer to more than one Club.
12. Ambiguous aliases must not silently resolve to an arbitrary Club.
13. ClubAlias is provider-independent.
14. Provider identifiers are not stored on ClubAlias.
15. Provider mappings belong to the import/provider domain.
16. Raw provider names do not automatically become trusted aliases.
17. `Club.name` remains the canonical Club name.
18. `Club.shortName` remains presentation data.
19. `Club.slug` remains the canonical Kurvenfunk URL identifier.
20. Canonical Club names do not need to be duplicated as aliases.
21. Alias type describes the semantic form of the alias.
22. Alias type does not guarantee uniqueness or matching safety.
23. Inactive aliases remain valid stored domain records.
24. Deactivation is preferred to destructive deletion where traceability matters.
25. Club deactivation does not automatically delete its aliases.
26. ClubAlias does not store context-specific confidence scores.
27. Matching must prefer unknown or ambiguous over an unsafe automatic match.
28. PostgreSQL is the source of truth for ClubAlias records.
29. Search indexes containing aliases must be reconstructable from PostgreSQL.
30. Final persistence implementation is deferred to Task 081.

## Related Tasks

- Task 062 – Club Model: canonical Club domain
- Task 080 – Import Models: providers, raw payloads and entity matching
- Task 081 – Prisma Schema: persistence implementation
- Task 083 – Seed System: initial Club aliases
- Task 144 – News Provider Interface
- Task 148 – News Raw Payload
- Task 149 – News Normalization
- Task 152 – News Import Club Matching
- Task 155 – News Import Confidence Score
- Task 159 – News Import Review Workflow
- Task 194 – Club Management
- Task 199 – Sports Provider Interface
- Task 202 – Sports Club Matching
- Task 205 – Sports Correction Interface
- Task 231 – Club Search Index
- Task 260 – Database Indexes
- Task 304 – Real Club Import

## Prisma Direction

Task 063 defines domain semantics only.

The complete Prisma implementation belongs to Task 081.

The expected ClubAlias mapping will approximately require:

- UUID primary key for `id`
- required relation to `Club` through `clubId`
- required `alias`
- required `normalizedAlias`
- required `ClubAliasType`
- required `active`
- automatic creation timestamp
- automatic update timestamp
- index on `clubId`
- index on `normalizedAlias`
- likely composite uniqueness for `clubId + normalizedAlias`

The final schema must account for the exact normalization and relation strategy
chosen during persistence implementation.

No migration is created as part of Task 063.

## Decisions

1. ClubAlias represents an alternate textual name for one canonical Club.
2. ClubAlias uses an immutable internal UUID.
3. Every alias belongs to exactly one Club.
4. A Club may have zero or more aliases.
5. The human-readable alias is stored separately from its normalized matching
   representation.
6. `normalizedAlias` is deterministically derived from `alias`.
7. Normalization must be conservative.
8. Alias matching is expected to be case-insensitive.
9. Meaningful human-readable spelling remains preserved in `alias`.
10. Equivalent normalized aliases should not be duplicated for the same Club.
11. `normalizedAlias` is deliberately not globally unique.
12. Multiple Clubs may share the same normalized alias.
13. Ambiguous aliases must not automatically resolve to an arbitrary Club.
14. Initial alias types are `OFFICIAL_VARIANT`, `SHORT_NAME`,
    `ABBREVIATION`, `ALTERNATIVE` and `HISTORICAL`.
15. Alias type does not imply global uniqueness.
16. ClubAlias remains provider-independent.
17. Provider-specific IDs belong to Task 080 rather than ClubAlias.
18. Provider-specific raw payload data does not belong to ClubAlias.
19. A provider-observed name becomes a ClubAlias only when accepted as useful
    canonical matching data.
20. `Club.name` remains the canonical club name.
21. `Club.shortName` remains presentation data and is not automatically an
    alias.
22. `Club.slug` is not an alias.
23. Canonical names do not need to be duplicated as ClubAlias records.
24. Explicit provider mappings should generally outrank textual alias matching.
25. ClubAlias does not store permanent confidence scores.
26. Confidence belongs to individual matching decisions.
27. Matching must fail safely when no unique reliable resolution exists.
28. `active` controls normal matching/search availability of an alias.
29. Inactive aliases may remain stored for history and traceability.
30. Club deactivation does not automatically remove aliases.
31. PostgreSQL is authoritative for ClubAlias records.
32. Meilisearch may index aliases but remains reconstructable from PostgreSQL.
33. Likely persistence uniqueness is `clubId + normalizedAlias`, not global
    `normalizedAlias`.
34. Final Prisma schema and indexes are deferred to Task 081.
35. No migration is created as part of Task 063.
