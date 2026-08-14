# Article Model

## Status

Task: **069 – Article Model**

Status: Domain model defined.

This document defines the canonical Kurvenfunk Article domain model.

It does not create or modify the Prisma schema.

The Prisma implementation belongs to Task 081.

The initial migration belongs to Task 082.

---

## Purpose

Article is the central editorial content entity in Kurvenfunk.

An Article may represent:

- an editorially written Kurvenfunk article
- an imported football news article
- a match report
- a competition-related article
- a club-related article
- general football news

Articles form the editorial connection between:

```text
News
│
├── Clubs
├── Competitions
├── Matches
│
└── Discussions
```

The Article domain must support both:

```text
Kurvenfunk editorial content
```

and:

```text
externally sourced news
```

without making the canonical Article entity dependent on any specific external news provider.

---

## Core Requirements

Task 069 requires Articles to be associated with:

- Categories
- Tags
- Clubs
- Competition
- Match
- Source
- Author

The model must additionally provide enough lifecycle information for later tasks including:

- Article CRUD
- publication workflow
- scheduled publishing
- news imports
- personalization
- search
- SEO
- revisions
- discussions

without implementing those features as part of Task 069.

---

## Domain Boundary

The Article domain owns:

- Article identity
- Article title
- Article lead
- Article body
- canonical Article slug
- editorial lifecycle status
- publication timestamps
- Article-to-Club relationships
- Article-to-Category relationships
- Article-to-Tag relationships
- optional Competition context
- optional Match context
- editorial source relationship
- internal author relationship
- external byline information where required

The Article domain does not own:

- Club identity
- Competition identity
- Match identity
- User identity
- uploaded media binary data
- comments
- reactions
- raw provider payloads
- provider credentials
- import jobs
- import matching records
- search index state
- Article revision history

Those concerns belong to their respective domains.

---

# Entities

## Article

Article is the canonical Kurvenfunk representation of one editorial/news item.

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | UUID | yes | Internal immutable Kurvenfunk Article identifier |
| `title` | String | yes | Public Article headline |
| `slug` | String | yes | Stable canonical URL-safe identifier |
| `lead` | String | no | Optional introductory summary or teaser |
| `content` | ArticleContent | yes | Canonical Article body |
| `status` | ArticleStatus | yes | Editorial publication lifecycle state |
| `authorId` | UUID | no | Optional reference to internal Kurvenfunk User acting as Article author |
| `externalAuthorName` | String | no | Optional external author/byline for externally sourced content |
| `sourceId` | UUID | no | Optional reference to ArticleSource |
| `originalUrl` | String | no | Optional canonical URL of the original externally published Article |
| `competitionId` | UUID | no | Optional canonical Competition context |
| `matchId` | UUID | no | Optional canonical Match context |
| `leadMediaId` | UUID | no | Optional reference to Media defined in Task 070 |
| `scheduledAt` | DateTime | no | Planned publication timestamp |
| `publishedAt` | DateTime | no | Canonical first publication timestamp |
| `archivedAt` | DateTime | no | Timestamp when Article entered archived state |
| `deletedAt` | DateTime | no | Soft-delete timestamp |
| `createdAt` | DateTime | yes | Creation timestamp |
| `updatedAt` | DateTime | yes | Last persisted modification timestamp |

---

## ArticleContent

`ArticleContent` represents the canonical body of an Article.

The Article domain requires support for structured editorial content including later:

- paragraphs
- headings
- links
- lists
- quotes
- images

The exact persistence representation is intentionally not fixed in Task 069.

Possible implementations may include:

```text
structured JSON
```

or another canonical structured format selected during implementation of:

```text
Task 081 – Prisma Schema
Task 133 – Article Editor
```

The domain requirement is that the stored representation can be validated, sanitized, rendered consistently and revised.

Raw provider HTML must not automatically become trusted canonical Article content.

---

# Article Status

## ArticleStatus

Initial Article lifecycle states:

```text
DRAFT
REVIEW
SCHEDULED
PUBLISHED
ARCHIVED
```

---

## DRAFT

Article exists but is not publicly visible.

Typical uses:

- newly created editorial Article
- incomplete Article
- imported Article awaiting processing
- manually edited draft

A Draft normally has:

```text
publishedAt = NULL
```

and:

```text
scheduledAt = NULL
```

unless a scheduling workflow is being prepared.

---

## REVIEW

Article is awaiting editorial review.

It is not publicly visible.

Typical transition:

```text
DRAFT
  ↓
REVIEW
```

Review permissions and approval workflows belong to later editorial tasks.

---

## SCHEDULED

Article is approved for future publication.

A Scheduled Article requires:

```text
scheduledAt != NULL
```

and:

```text
scheduledAt > current publication processing time
```

The scheduled publishing worker introduced later will transition:

```text
SCHEDULED
    ↓
PUBLISHED
```

at the appropriate time.

---

## PUBLISHED

Article is publicly available.

A Published Article requires:

```text
publishedAt != NULL
```

The Article may remain editable after publication.

Subsequent editorial changes do not create a new Article identity.

Revision history belongs to Task 142.

---

## ARCHIVED

Article remains stored but is no longer treated as normal active editorial content.

Archived content may still remain publicly accessible depending on later editorial policy.

An archived Article normally has:

```text
archivedAt != NULL
```

Archiving is not equivalent to deletion.

---

# Article Lifecycle

The canonical publication lifecycle is:

```text
DRAFT
  │
  ▼
REVIEW
  │
  ├─────────────→ DRAFT
  │
  ▼
SCHEDULED
  │
  ▼
PUBLISHED
  │
  ▼
ARCHIVED
```

Direct transitions may be permitted by users with appropriate editorial permissions.

For example:

```text
DRAFT → PUBLISHED
```

may be allowed for an Editor/Admin workflow.

The exact permission matrix belongs to later editorial and permission tasks.

---

# Deletion

Article deletion uses soft deletion.

A soft-deleted Article has:

```text
deletedAt != NULL
```

Soft deletion is separate from:

```text
status = ARCHIVED
```

The distinction is important.

### Archived

Means:

```text
editorially inactive/historical
```

### Deleted

Means:

```text
removed through Article deletion workflow
```

Task 131 later defines:

- Delete
- Restore

Restoring an Article clears the soft-delete state according to the applicable workflow.

---

# Slug

Every Article has one canonical slug.

Example:

```text
sturm-gewinnt-gegen-rapid
```

The slug is used for human-readable Article URLs.

Conceptual route:

```text
/artikel/sturm-gewinnt-gegen-rapid
```

The exact frontend route remains a frontend concern.

---

## Slug Uniqueness

Article slugs must be unique within the canonical Article namespace.

Comparison should use normalized slug values.

Examples that must not become separate canonical slugs:

```text
Sturm-Graz
sturm-graz
```

after normalization.

---

## Slug Stability

Once an Article has been published, its canonical slug should normally remain stable.

Changing the Article title must not automatically change the slug.

This protects:

- external links
- search engine indexing
- shared URLs
- discussion references

Redirect handling for intentionally changed slugs may be added later.

---

# Title

`title` is required.

The title represents the canonical public headline.

The domain should enforce reasonable minimum and maximum lengths during validation.

Exact limits belong to the validation/editorial implementation.

A title must not consist only of whitespace.

---

# Lead

`lead` is optional.

It represents:

- introductory text
- Article teaser
- short summary

It must not be used as a replacement for the Article body.

Imported provider summaries may be normalized into the lead if appropriate.

---

# Article Author

An Article may reference an internal Kurvenfunk User:

```text
authorId → User
```

This represents the internal editorial author responsible for the Article.

The author relation is optional because externally imported Articles may not have a Kurvenfunk User as their original author.

---

## Internal Author

Example:

```text
Article
authorId → User(Editor)
```

The User domain owns:

- User ID
- nickname
- roles
- account identity

Article stores only the reference.

---

## Author Role

The Article model does not require the referenced User to permanently retain the `EDITOR` role.

Authorization is checked when editorial actions occur.

Historical Article authorship must remain valid if:

- the User later loses editorial permissions
- the User changes role
- the User account becomes inactive

The Article therefore records authorship independently from the User's current permission state.

---

## External Author

Imported or syndicated content may contain a provider-supplied author name.

This may be stored as:

```text
externalAuthorName
```

This value is informational.

It does not create a Kurvenfunk User.

---

## Internal and External Author Together

Both may exist.

Example:

```text
externalAuthorName = "APA"
authorId = Kurvenfunk Editor
```

This can represent:

- original external attribution
- internal Kurvenfunk editorial responsibility

The UI must distinguish those concepts where necessary.

---

# Article Source

Articles may be associated with an editorial source.

The source is distinct from the technical news Provider.

---

## ArticleSource Entity

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | UUID | yes | Internal immutable source identifier |
| `name` | String | yes | Canonical source/publication name |
| `website` | String | no | Canonical source website |
| `active` | Boolean | yes | Whether the source may normally be assigned to new Articles |
| `createdAt` | DateTime | yes | Creation timestamp |
| `updatedAt` | DateTime | yes | Last persisted change |

Examples:

```text
Kurvenfunk
APA
ORF Sport
SK Sturm Graz
Bundesliga
```

depending on editorial sourcing policy.

---

## Article Source Relationship

Conceptually:

```text
Article
   │
   └── sourceId → ArticleSource
```

A source is optional.

An internally written Kurvenfunk Article may either:

- reference the Kurvenfunk source
- or have no external source

The final editorial convention can be defined during Article CRUD implementation.

---

# Source vs Provider

This distinction is mandatory.

## ArticleSource

Represents:

```text
the editorial/publication source shown or attributed to an Article
```

## Provider

Represents:

```text
the technical external integration that delivered data
```

These may be different.

The Article must not store the technical provider as its canonical editorial source unless both concepts genuinely represent the same entity.

---

# Original Source URL

Externally sourced Articles commonly require the original publication URL.

The canonical Article model therefore includes optional:

```text
originalUrl
```

This represents the canonical URL of the original Article at the editorial source, not the URL used to call an import API.

It may later participate in duplicate detection.

---

# Categories

Articles may belong to zero or more Categories.

This is a many-to-many relationship.

```text
Article
  │
  └── ArticleCategory
          │
          └── Category
```

---

## Category Entity

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | UUID | yes | Internal immutable Category identifier |
| `name` | String | yes | Public Category name |
| `slug` | String | yes | Stable canonical Category slug |
| `active` | Boolean | yes | Whether Category is available for normal assignment |
| `createdAt` | DateTime | yes | Creation timestamp |
| `updatedAt` | DateTime | yes | Last update timestamp |

The actual initial Category taxonomy belongs to Task 134.

---

## ArticleCategory

Explicit conceptual join entity:

| Field | Type | Required | Description |
|---|---|---:|---|
| `articleId` | UUID | yes | Article reference |
| `categoryId` | UUID | yes | Category reference |
| `createdAt` | DateTime | yes | Assignment timestamp |

The pair:

```text
articleId + categoryId
```

must be unique.

---

# Tags

Articles may have zero or more Tags.

This is a many-to-many relationship.

```text
Article
  │
  └── ArticleTag
          │
          └── Tag
```

---

## Tag Entity

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | UUID | yes | Internal immutable Tag identifier |
| `name` | String | yes | Canonical Tag display name |
| `slug` | String | yes | Stable canonical Tag slug |
| `active` | Boolean | yes | Whether Tag may normally be assigned |
| `createdAt` | DateTime | yes | Creation timestamp |
| `updatedAt` | DateTime | yes | Last update timestamp |

The actual Tag management workflow belongs to Task 135.

---

## ArticleTag

Explicit conceptual join entity:

| Field | Type | Required | Description |
|---|---|---:|---|
| `articleId` | UUID | yes | Article reference |
| `tagId` | UUID | yes | Tag reference |
| `createdAt` | DateTime | yes | Assignment timestamp |

The pair:

```text
articleId + tagId
```

must be unique.

---

# Categories vs Tags

Categories and Tags represent different concepts.

A Category is broad editorial classification.

A Tag is more flexible descriptive metadata.

A Tag must not replace a Category hierarchy.

A Category must not be abused as unrestricted tagging metadata.

---

# Article and Club

An Article may reference zero or more Clubs.

This is one of the most important Article relationships in Kurvenfunk.

It enables:

- personalized news ranking
- Club news pages
- favorite Club prioritization
- Club filters
- related content
- Club discussions
- search relevance

---

## ArticleClub

Conceptual join entity:

| Field | Type | Required | Description |
|---|---|---:|---|
| `articleId` | UUID | yes | Article reference |
| `clubId` | UUID | yes | Canonical Club reference |
| `createdAt` | DateTime | yes | Assignment timestamp |

The pair:

```text
articleId + clubId
```

must be unique.

---

## Multiple Clubs

An Article may relate to multiple Clubs.

This is explicitly required for later personalization.

---

## Historical Club Relationships

An Article relation to a Club remains valid even if:

```text
Club.active = false
```

Historical Articles must not lose their canonical Club association when a Club becomes inactive.

---

# Article and Competition

An Article may optionally reference one canonical Competition.

Conceptually:

```text
Article
   │
   └── competitionId → Competition
```

Competition assignment must reference the canonical Kurvenfunk Competition.

Provider-specific Competition names must be normalized before assignment.

---

# Article and Match

An Article may optionally reference one canonical Match.

Conceptually:

```text
Article
   │
   └── matchId → Match
```

Examples:

- match preview
- match report
- post-match analysis
- lineup news
- postponement news

If `matchId` exists, Article Competition context must be consistent with the Match.

Preferred canonical state:

```text
Article.matchId = Match.id
Article.competitionId = Match.competitionId
```

Article must not duplicate canonical Match score, kickoff or status merely for convenience.

---

# Article and Season

Task 069 does not require a direct Article-to-Season relation.

Season context can be derived where appropriate through:

```text
Match → Season
```

No `seasonId` is required on Article in the initial model.

---

# Lead Media

An Article may optionally reference one primary visual asset:

```text
leadMediaId → Media
```

Media itself is defined in Task 070.

The Article does not own media storage metadata.

---

# Inline Media

Images embedded inside the Article body may later reference Media entities through the structured Article content representation.

Task 069 does not define the exact editor document format.

---

# Publication Timestamps

`createdAt` records creation.

`updatedAt` records the last persisted modification.

`scheduledAt` records intended publication time.

`publishedAt` records canonical first publication time.

`archivedAt` records when the Article entered archived state.

`deletedAt` records soft deletion.

Editing a published Article must not automatically reset `publishedAt`.

---

# Scheduled Publishing

Scheduled publishing belongs operationally to Task 143.

The Article domain provides:

```text
status = SCHEDULED
scheduledAt = timestamp
```

The worker later transitions due Articles to `PUBLISHED`.

Scheduling logic must be idempotent.

---

# Imported Articles

Imported Articles are normalized into the same canonical Article entity.

There is no separate public `ImportedArticle` entity.

This ensures editorial and imported Articles behave consistently in:

- feeds
- Club pages
- Competition pages
- Match pages
- search
- discussions
- personalization

---

# Import Domain Separation

Technical import information belongs to Task 080.

Examples:

```text
Provider
ImportJob
ImportRecord
RawPayload
EntityMatch
```

These must not be embedded into Article merely because the Article originated from an external provider.

External provider IDs do not define Article identity.

Raw provider payloads must not be stored in canonical Article fields.

---

# Duplicate Detection

Duplicate detection belongs primarily to Task 151.

Useful Article values include:

- `originalUrl`
- `title`
- `sourceId`
- `publishedAt`
- related Clubs
- Competition
- Match

Duplicate detection must not rely on Article title alone.

---

# Imported Article Matching

Typical import flow:

```text
External Provider
      │
      ▼
Raw Payload
      │
      ▼
Normalization
      │
      ▼
Validation
      │
      ▼
Duplicate Detection
      │
      ▼
Entity Matching
├── Source
├── Clubs
├── Competition
└── Match
      │
      ▼
Canonical Article
```

---

# Public Article Representation

A public Article representation may expose:

- ID
- title
- slug
- lead
- content
- author display information
- source
- original source URL where appropriate
- publication timestamp
- lead media
- Categories
- Tags
- Clubs
- Competition
- Match
- discussion metadata

Technical import/provider metadata must not leak into the normal public Article representation.

---

# Discussions

Articles will later have discussions/comments.

The Article does not store comments inside the Article entity.

Conceptually:

```text
Article
   │
   └── Comment.articleId
```

The Comment model belongs to Task 071.

---

# Search

Articles will be indexed in Meilisearch in Task 230.

The Article model therefore provides searchable canonical data such as:

- title
- lead
- content
- Categories
- Tags
- Clubs
- Competition
- publication timestamp

Meilisearch remains a derived index.

PostgreSQL remains the source of truth.

---

# Personalization

Article-to-Club relationships are central to personalized news ranking.

Personal ranking values are not stored on Article.

Ranking is calculated by the personalization/feed layer.

---

# Sorting

Common public ordering:

```text
publishedAt DESC
```

Administrative views may use:

```text
createdAt DESC
updatedAt DESC
scheduledAt ASC
```

The API layer defines the final sorting contract.

---

# Filtering

The future API should be able to filter Articles by:

- status
- Category
- Tag
- Club
- Competition
- Match
- Source
- Author
- publication time
- creation time

---

# Recommended Indexes

The eventual database implementation should strongly consider indexes for:

```text
Article.slug
Article.status
Article.publishedAt
Article.scheduledAt
Article.authorId
Article.sourceId
Article.competitionId
Article.matchId

ArticleClub.clubId
ArticleClub.articleId

ArticleCategory.categoryId
ArticleCategory.articleId

ArticleTag.tagId
ArticleTag.articleId
```

Composite indexes may be useful for common feed queries such as:

```text
status + publishedAt
```

Exact indexes belong to Task 081 and Task 260.

---

# Nullability

Required Article fields:

- `id`
- `title`
- `slug`
- `content`
- `status`
- `createdAt`
- `updatedAt`

Optional Article fields:

- `lead`
- `authorId`
- `externalAuthorName`
- `sourceId`
- `originalUrl`
- `competitionId`
- `matchId`
- `leadMediaId`
- `scheduledAt`
- `publishedAt`
- `archivedAt`
- `deletedAt`

---

# Validation Rules

The canonical Article domain must enforce at least:

1. `id` is required.
2. `title` is required.
3. `title` must not be blank.
4. `slug` is required.
5. `slug` must be normalized and unique.
6. `content` is required.
7. `status` is required.
8. `status = SCHEDULED` requires `scheduledAt`.
9. `status = PUBLISHED` requires `publishedAt`.
10. `status = ARCHIVED` should normally require `archivedAt`.
11. `originalUrl`, when present, must be a valid absolute URL.
12. `authorId`, when present, references canonical User.
13. `sourceId`, when present, references canonical ArticleSource.
14. `competitionId`, when present, references canonical Competition.
15. `matchId`, when present, references canonical Match.
16. If `matchId` exists, Competition context must match the Match's Competition.
17. A Club may be assigned only once to the same Article.
18. A Category may be assigned only once to the same Article.
19. A Tag may be assigned only once to the same Article.
20. Provider identifiers do not define Article identity.
21. Raw provider payload must not be stored in canonical Article fields.
22. Soft deletion is distinct from archival.
23. Editing a published Article does not create a new Article identity.
24. Editing a published Article does not automatically reset `publishedAt`.
25. Inactive related entities do not invalidate historical Article relationships.

---

# Domain Invariants

1. Every Article has exactly one canonical internal ID.
2. Every Article has one title.
3. Every Article has one canonical slug.
4. Every Article has one canonical body representation.
5. Every Article has exactly one current ArticleStatus.
6. An Article may have zero or one internal author.
7. An Article may preserve an external author/byline independently from the internal author.
8. An Article may have zero or one editorial source.
9. An Article may relate to zero or more Clubs.
10. An Article may relate to zero or more Categories.
11. An Article may relate to zero or more Tags.
12. An Article may relate to zero or one Competition.
13. An Article may relate to zero or one Match.
14. A Match-linked Article must not contradict the Match's Competition.
15. Article relationships always use canonical Kurvenfunk domain entities.
16. External provider IDs do not define canonical Article identity.
17. Raw provider payload is not canonical Article data.
18. Published Articles have a publication timestamp.
19. Scheduled Articles have a scheduling timestamp.
20. Soft deletion and archival are separate states.
21. Historical relationships remain valid when related entities become inactive.
22. PostgreSQL is the source of truth for canonical Article data.

---

# Relationship Summary

```text
User
  │
  └── Article.authorId
            │
            ├── ArticleSource
            ├── Competition
            ├── Match
            ├── Media
            ├── ArticleClub ───────→ Club
            ├── ArticleCategory ────→ Category
            └── ArticleTag ─────────→ Tag
```

---

# Conceptual Model

```text
Article
│
├── id
├── title
├── slug
├── lead
├── content
├── status
│
├── authorId ───────────────→ User
├── externalAuthorName
│
├── sourceId ───────────────→ ArticleSource
├── originalUrl
│
├── competitionId ──────────→ Competition
├── matchId ────────────────→ Match
├── leadMediaId ────────────→ Media
│
├── scheduledAt
├── publishedAt
├── archivedAt
├── deletedAt
│
├── createdAt
└── updatedAt

Article
│
├── ArticleClub ────────────→ Club
├── ArticleCategory ────────→ Category
└── ArticleTag ─────────────→ Tag
```

---

# Canonical Data Ownership

| Data | Owner |
|---|---|
| Article identity | Article |
| Article title | Article |
| Article slug | Article |
| Article lead | Article |
| Article body | Article |
| Article lifecycle status | Article |
| publication timestamps | Article |
| Article author reference | Article |
| external author/byline | Article |
| Article source relationship | Article |
| source identity | ArticleSource |
| Category identity | Category |
| Tag identity | Tag |
| Article ↔ Category assignment | ArticleCategory |
| Article ↔ Tag assignment | ArticleTag |
| Article ↔ Club assignment | ArticleClub |
| Club identity | Club |
| Competition identity | Competition |
| Match identity | Match |
| Media metadata | Media |
| comments | Comment domain |
| raw provider payload | Import domain |
| provider identifier | Import/provider domain |
| duplicate matching | Import domain |
| revisions | Revision/editorial domain |
| search index | Meilisearch derived state |

---

# Prisma Implications

The eventual Prisma schema is expected to contain concepts equivalent to:

```text
Article
ArticleSource
Category
Tag
ArticleClub
ArticleCategory
ArticleTag
ArticleStatus
```

with relations conceptually equivalent to:

```text
Article.author
Article.source
Article.competition
Article.match
Article.leadMedia
Article.clubs
Article.categories
Article.tags
```

The exact Prisma model syntax and relation names are deferred to Task 081.

---

# Database Constraints

The eventual database implementation should enforce where practical:

- required Article identity fields
- unique Article slug
- foreign keys
- unique Category slug
- unique Tag slug
- unique ArticleClub pair
- unique ArticleCategory pair
- unique ArticleTag pair
- valid nullable relationships

Cross-entity semantic consistency such as Match Competition equality may require application/domain validation.

The final enforcement strategy belongs to Task 081.

---

# Migration

No migration is created as part of Task 069.

The Article domain model is documented first.

The Prisma schema will be created later as part of Task 081.

The initial migration will be created in Task 082 after the required domain models have been reviewed.

---

# Future Extensions

The following may be added later without changing the fundamental Article concept:

- Article revision entity
- Article slug redirects
- multiple Competition assignments
- multiple Match assignments
- source aliases
- editorial approval records
- Article translations
- localization
- Article series
- related Articles
- bookmarks
- Article-level reactions
- Article metrics
- paywall state
- featured/pinned state
- embargo support
- advanced canonical URL handling
- structured SEO metadata

---

# Design Principles

## Canonical

Article represents Kurvenfunk's canonical normalized editorial/news content.

## Provider-independent

External provider implementation details remain outside the Article entity.

## Relational

Articles connect explicitly to canonical Clubs, Competitions, Matches, Categories, Tags, Sources and Authors.

## Personalization-ready

Club relationships provide the foundation for personalized news ranking.

## Editorial-ready

The Article lifecycle supports Draft, Review, Scheduled, Published and Archived states.

## Import-ready

Imported news normalizes into the same canonical Article model without contaminating it with raw provider data.

## Historical

Published Articles and their relationships remain stable historical records.

## Reconstructable

PostgreSQL remains authoritative; caches and search indexes are derived.

## Extensible

Media, revisions, comments, search and import metadata can be attached through separate domain models.

---

# Final Decisions

1. Article is the canonical Kurvenfunk editorial/news entity.
2. Article identity is generated internally and is provider-independent.
3. Article has a required title.
4. Article has a required stable canonical slug.
5. Article has an optional lead.
6. Article has required canonical body content.
7. The exact persistence format of structured Article content is deferred to Task 081/133.
8. Article lifecycle is represented explicitly through ArticleStatus.
9. Initial statuses are `DRAFT`, `REVIEW`, `SCHEDULED`, `PUBLISHED`, and `ARCHIVED`.
10. Soft deletion is represented separately through `deletedAt`.
11. Archiving and deletion are not the same operation.
12. Scheduled Articles require `scheduledAt`.
13. Published Articles require `publishedAt`.
14. Published timestamp is not reset merely because Article content is edited.
15. Article may reference zero or one internal Kurvenfunk User as author.
16. External author/byline may be stored separately from the internal author.
17. Historical Article authorship remains valid even if User roles/status later change.
18. Article may reference zero or one canonical ArticleSource.
19. ArticleSource represents editorial attribution, not the technical import Provider.
20. Original source URL may be stored independently from Provider API information.
21. Provider IDs belong to the Import/provider domain.
22. Raw provider payload belongs to the Import domain.
23. Imported and editorial Articles use the same canonical Article entity.
24. Article may belong to zero or more Categories.
25. Category assignment uses an explicit many-to-many relationship.
26. Article may have zero or more Tags.
27. Tag assignment uses an explicit many-to-many relationship.
28. Category and Tag are separate concepts.
29. Article may relate to zero or more Clubs.
30. Club assignment uses an explicit many-to-many relationship.
31. Multiple Clubs per Article are supported and are important for personalization.
32. ArticleClub stores only canonical Club references.
33. Article may reference zero or one Competition.
34. Competition assignment uses the canonical Competition entity.
35. Article may reference zero or one Match.
36. Match assignment uses the canonical Match entity.
37. A Match-linked Article must have Competition context consistent with the Match.
38. Article does not duplicate Match score, kickoff or status as canonical metadata.
39. No direct Season relation is required for the initial Article model.
40. Article may reference optional lead Media defined in Task 070.
41. Media metadata and binary storage do not belong to Article.
42. Inline media representation is deferred to Article Editor implementation.
43. Article revisions are separate from the canonical current Article state.
44. Revision history belongs to Task 142.
45. Comments are separate entities and will reference Article.
46. Article does not own comments or reactions.
47. Article-to-Club relationships provide the basis for personalized news ranking.
48. Personal ranking values are not stored on Article.
49. Article search indexes are derived from PostgreSQL.
50. Meilisearch is not the Article source of truth.
51. Redis may cache Article data but is not authoritative.
52. Historical Article relations survive deactivation of Clubs, Categories, Tags, Sources and Competitions.
53. Article timestamps are stored as absolute timestamps.
54. Article model must support future international expansion.
55. Public Article representations must not expose technical Provider/import metadata.
56. The eventual Prisma implementation belongs to Task 081.
57. No migration is created as part of Task 069.
