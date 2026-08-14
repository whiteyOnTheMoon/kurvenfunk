# Media Domain Model

**Project:** Kurvenfunk
**Task:** 070 – Media Model
**Status:** Domain model defined
**Target:** `docs/database/media-model.md`

## 1. Purpose

The Media domain represents reusable media assets and their metadata throughout Kurvenfunk. It provides a stable domain abstraction between application features and the underlying object storage.

Development and staging use MinIO, while production is planned to use Cloudflare R2. Domain logic must not depend on either provider.

Media is required especially for:

- article hero images
- article inline images
- OpenGraph images
- profile avatars
- club logos and other club assets
- competition assets
- future editorial and community media

The Media entity stores authoritative metadata in PostgreSQL. Binary objects live in object storage.

## 2. Goals

The model must:

- store a stable reference to internally managed files
- support externally referenced media when necessary
- preserve MIME type and file size
- preserve accessibility metadata
- preserve copyright and source information
- allow one asset to be reused in multiple places
- remain independent of MinIO/R2 implementation details
- support safe lifecycle and deletion decisions
- prepare the later Media Upload and Media Library features
- remain extensible for future media processing and variants

## 3. Non-Goals

Task 070 does not implement:

- Prisma models
- migrations
- storage adapters
- upload endpoints
- image processing
- virus/malware scanning
- MIME validation
- Media Library UI
- authorization rules for uploads
- CDN configuration
- signed URL generation

These belong to later implementation tasks.

## 4. Media as a First-Class Entity

Media must not be represented only by arbitrary URL strings on Article, Profile, Club, or other entities.

A media asset receives its own stable internal identity and can be referenced by other domains.

Conceptually:

```text
Media
  ├── Article usage
  ├── Profile usage
  ├── Club usage
  ├── Competition usage
  └── future usages
```

This avoids duplicated metadata and allows the Media Library to understand where an asset is used.

## 5. Core Entity

### Media

Recommended domain fields:

```text
Media

id
storageType
storageKey
externalUrl
originalFileName
mimeType
sizeBytes
width
height
altText
copyright
source
sourceUrl
status
createdAt
updatedAt
```

The exact Prisma representation is intentionally deferred to Task 081.

## 6. Field Semantics

### id

Stable internal identifier of the media record.

Other Kurvenfunk entities should reference this identifier rather than depending on storage URLs.

### storageType

Describes whether the media binary is managed by Kurvenfunk or referenced externally.

Recommended conceptual values:

```text
INTERNAL
EXTERNAL
```

`INTERNAL` means Kurvenfunk controls the object in its configured storage abstraction.

`EXTERNAL` means Kurvenfunk stores metadata and a reference to an externally hosted asset.

The enum name and final Prisma representation are decided in Task 081.

### storageKey

Stable object key used by the storage abstraction for internally managed media.

Example:

```text
articles/2026/08/550e8400-e29b-41d4-a716-446655440000.jpg
```

`storageKey` must not contain environment-specific public hostnames.

It identifies the object inside the configured storage system.

For externally referenced media, `storageKey` can be absent.

### externalUrl

Canonical external location when the binary is not stored by Kurvenfunk.

It should only be used for externally managed media.

External URLs must not replace `storageKey` for internally managed objects.

### originalFileName

Original filename supplied during upload or obtained from a trusted import source.

This is metadata only and must never be used directly as a storage key without sanitization and normalization.

### mimeType

Validated MIME type of the media object.

Examples:

```text
image/jpeg
image/png
image/webp
image/avif
```

The model stores the determined MIME type. Upload validation and permitted MIME types are defined later under upload security.

### sizeBytes

Binary object size in bytes.

The field is useful for:

- upload limits
- administration
- storage monitoring
- processing decisions
- diagnostics

The domain uses bytes as the canonical unit.

### width

Pixel width for raster images when known.

May be absent for media where dimensions do not apply or have not yet been determined.

### height

Pixel height for raster images when known.

Together with `width`, this allows clients to reserve layout space and avoid unnecessary layout shifts.

### altText

Accessibility description of the media asset.

The field is part of the media metadata, but context-specific presentation may require a different alt text at usage level in the future.

An empty alt text can be valid for deliberately decorative images. Missing metadata and intentionally empty alt text must not automatically be treated as the same editorial state by future tooling.

### copyright

Human-readable copyright or rights attribution.

Examples:

```text
© Kurvenfunk
© SK Sturm Graz
© Max Mustermann / Example Agency
```

This field does not itself constitute a complete rights-management system.

### source

Human-readable source or origin of the media.

Examples:

```text
Kurvenfunk editorial team
SK Sturm Graz
APA
Provider import
User upload
```

`source` is distinct from `copyright`.

### sourceUrl

Optional URL documenting the original source of the asset.

This can be useful for imported editorial media and rights verification.

It is metadata and must not be treated as the delivery URL for internally stored media.

### status

Represents the lifecycle state of the media record.

Recommended conceptual states:

```text
ACTIVE
ARCHIVED
DELETED
```

`ACTIVE` means the asset can normally be used.

`ARCHIVED` means it is retained but should not normally be selected for new usages.

`DELETED` represents a logically deleted media record when retention or usage constraints prevent immediate physical removal.

Exact lifecycle implementation is deferred to Prisma and Media Library design.

### createdAt

Timestamp when the Media record was created.

### updatedAt

Timestamp of the latest metadata change.

## 7. URL Handling

The master project plan lists `url` as Media data. In the concrete domain design, a single permanently stored public URL should not be the canonical identifier for internally stored media.

For internal media:

```text
Media.storageKey
        ↓
Storage abstraction
        ↓
MinIO / R2
        ↓
public URL, CDN URL, or signed URL
```

The resulting delivery URL can vary by:

- environment
- storage provider
- domain
- CDN configuration
- access policy
- transformation service

Therefore the stable domain value is `storageKey`.

For external media, `externalUrl` is the external delivery reference because Kurvenfunk does not control the underlying object.

## 8. Storage Abstraction

Media must not contain MinIO- or R2-specific business logic.

Conceptually:

```text
Media domain
     ↓
Storage interface
     ↓
┌─────────────┬─────────────┐
│ MinIO       │ Cloudflare  │
│ DEV/STAGING │ R2 PROD     │
└─────────────┴─────────────┘
```

Typical storage operations later include:

```text
put
get
exists
delete
resolveUrl
```

Provider-specific bucket names, endpoints, credentials, and URL formats belong to infrastructure configuration.

## 9. Internal Media

Internally managed media is preferred when Kurvenfunk needs reliable long-term control of the binary.

An internal media record should normally have:

```text
storageType = INTERNAL
storageKey = present
externalUrl = absent
```

Its public URL is resolved through the storage layer.

The database remains authoritative for metadata, while object storage remains authoritative for the binary itself.

## 10. External Media

Some providers may supply externally hosted images that Kurvenfunk cannot or should not immediately copy into its own storage.

An external media record can conceptually use:

```text
storageType = EXTERNAL
storageKey = absent
externalUrl = present
```

External media has additional operational risks:

- remote deletion
- URL expiration
- hotlink restrictions
- changed content
- availability problems
- licensing restrictions

The News Import design must later decide whether specific providers permit copying media into Kurvenfunk storage or require external references.

## 11. Media Type

The initial product primarily needs images.

The domain should nevertheless avoid architecture that makes future expansion unnecessarily difficult.

Potential future types include:

- IMAGE
- VIDEO
- AUDIO
- DOCUMENT

A dedicated media-type enum is not mandatory for Task 070 because MIME type already describes the technical format.

If later business behavior depends strongly on broad media categories, a derived or persisted type can be introduced deliberately.

## 12. Image Metadata

For images, Kurvenfunk should preserve at least:

```text
mimeType
sizeBytes
width
height
```

Future processing may additionally create:

- thumbnails
- responsive sizes
- WebP variants
- AVIF variants
- crops
- optimized versions

These variants should not require changing the identity of the original Media entity.

## 13. Original and Derived Assets

The initial model treats the uploaded/imported media as the primary asset.

Future image processing may introduce derived assets.

Conceptually:

```text
Original Media
   ├── thumbnail
   ├── small
   ├── medium
   ├── large
   ├── WebP
   └── AVIF
```

Whether variants become child Media records or a dedicated variant model should be decided when image processing requirements are implemented.

Task 070 intentionally does not over-model this before those requirements exist.

## 14. Reuse

A Media record can be referenced from more than one place.

Example:

```text
Media A
 ├── Article 1 hero image
 ├── Article 2 inline image
 └── Article 3 OpenGraph image
```

Reusing the same asset must not require duplicate binary objects or duplicate Media records.

This is especially important for:

- editorial libraries
- club logos
- competition logos
- frequently reused photography

## 15. Media Usage

The Media entity describes the asset itself.

The context in which an asset is used belongs to the referencing domain or a future usage relation.

Examples of usage roles:

```text
ARTICLE_HERO
ARTICLE_CONTENT
ARTICLE_OG
PROFILE_AVATAR
CLUB_LOGO
COMPETITION_LOGO
```

The distinction between asset and usage is important.

A single image may have one copyright/source identity while being used in several different contexts.

Task 070 does not require one universal polymorphic `MediaUsage` table. Concrete relations should be introduced where required by the corresponding domain models and finalized in Task 081.

## 16. Article Integration

Article is expected to use Media for several purposes.

Conceptually:

```text
Article
 ├── heroMedia
 ├── ogMedia
 └── content media
```

An Article must reference Media records instead of storing arbitrary internal storage URLs.

Inline editor content requires special care because media references embedded in rich content must remain traceable for usage and deletion checks.

The exact editor representation is defined with the Article Editor implementation.

## 17. Profile Integration

Profile avatars should eventually reference Media.

Conceptually:

```text
Profile.avatarMediaId -> Media.id
```

The Profile domain must not need to know whether the avatar lives in MinIO, R2, or another future storage backend.

## 18. Club Integration

Club logos should use the same storage abstraction and Media domain where practical.

Conceptually:

```text
Club.logoMediaId -> Media.id
```

This is preferable to coupling Club directly to a provider-specific URL.

The final Prisma relation is decided when all domain models are consolidated in Task 081.

## 19. Competition Integration

Competition logos or visual assets can use Media in the same manner as clubs.

No separate storage concept is required.

## 20. Alt Text and Accessibility

Accessibility is a first-class concern.

Media Library and editorial workflows should make alt text visible and editable.

Rules:

- informative images should have meaningful alt text
- decorative images may intentionally use empty alt text
- filenames are not acceptable automatic alt text
- copyright text must not be substituted for alt text
- source information must not be substituted for alt text

Context-specific alt text may later override generic Media metadata if editorial requirements demand it.

## 21. Copyright and Rights Metadata

Kurvenfunk must preserve enough information to understand where editorial media came from and how it should be attributed.

At minimum:

```text
copyright
source
sourceUrl
```

These fields serve different purposes.

Example:

```text
source:
SK Sturm Graz press area

sourceUrl:
https://example.invalid/original-image

copyright:
© SK Sturm Graz
```

Rights metadata must survive reuse of the asset.

Deleting an Article must not automatically delete the rights metadata of a Media asset that is still retained or used elsewhere.

## 22. Imported News Media

News providers may provide:

- image URLs
- copyright strings
- photographer names
- agency names
- captions
- image identifiers

Normalization should map relevant provider data into the Media domain without making provider-specific fields part of the core Media entity unless genuinely needed.

Raw provider payloads remain available through the Import domain for reproducibility.

Provider-specific media IDs can later be stored through import mapping rather than polluting the core Media model.

## 23. Ownership and Uploader Information

The Media entity may eventually need information about who created or uploaded a record.

Potential concepts include:

```text
createdByUserId
origin
```

However, Task 070 should not assume that every asset has a Kurvenfunk user as uploader because media can also originate from:

- imports
- seeds
- administration
- automated processing
- system migration

If uploader attribution is needed operationally, it should therefore be optional and modeled separately from copyright ownership.

Uploader and copyright holder are not the same concept.

## 24. Lifecycle

Media lifecycle must distinguish database metadata from the physical object.

Conceptually:

```text
created
   ↓
ACTIVE
   ↓
ARCHIVED
   ↓
DELETED
```

Physical deletion from object storage must not happen merely because one usage disappears.

Before deleting a binary, Kurvenfunk must determine whether the asset is still referenced.

## 25. Deletion Rules

The following rule is mandatory:

> A media binary must not be physically deleted while an active domain reference still requires it.

Example:

```text
Media A
 ├── Article 1
 └── Article 2
```

Deleting Article 1 must not delete Media A while Article 2 still references it.

Possible future deletion process:

```text
Delete requested
      ↓
Check references
      ↓
Referenced? ── yes ──> reject/archive/detach as appropriate
      │
      no
      ↓
mark/delete metadata
      ↓
delete storage object
```

The exact transactional and cleanup mechanism belongs to later implementation work.

## 26. Orphan Detection

Media Library should eventually be able to identify media with no active usages.

An orphan is not automatically safe to delete.

Reasons to retain an unused asset can include:

- editorial reuse
- scheduled content
- legal retention
- audit requirements
- temporary processing state

Therefore orphan detection and deletion are separate operations.

## 27. Soft Delete

A logical deletion state is recommended for Media metadata.

Benefits include:

- safer editorial recovery
- delayed physical cleanup
- reference verification
- auditability

Physical storage cleanup can later be handled asynchronously by a worker.

The precise retention period is a later privacy/storage-policy decision.

## 28. Storage Object Naming

Storage keys should be generated by Kurvenfunk and must not depend directly on user filenames.

Recommended characteristics:

- unique
- deterministic enough for operations
- safe for object storage
- no sensitive user data
- no dependency on display names

Example structure:

```text
media/2026/08/<uuid>.jpg
```

or domain-oriented prefixes when useful:

```text
articles/2026/08/<uuid>.jpg
avatars/<uuid>.webp
clubs/<uuid>.svg
```

The exact convention belongs to the storage implementation.

## 29. Environment Separation

DEV, STAGING, and PRODUCTION must never share media storage unintentionally.

Conceptually:

```text
DEV
Media metadata -> DEV PostgreSQL
Binary         -> DEV MinIO

STAGING
Media metadata -> STAGING PostgreSQL
Binary         -> STAGING MinIO

PRODUCTION
Media metadata -> PROD PostgreSQL
Binary         -> Cloudflare R2
```

A `storageKey` can have the same structural format across environments without pointing to the same physical storage.

## 30. PostgreSQL as Source of Truth

PostgreSQL is authoritative for:

- Media identity
- storage reference
- MIME metadata
- dimensions
- alt text
- copyright
- source
- lifecycle state
- domain relationships

Object storage is authoritative for the binary object itself.

A storage bucket listing must not replace the Media database model.

## 31. Storage Consistency

The system must later be able to detect inconsistencies such as:

```text
Media record exists, object missing

object exists, Media record missing
```

These conditions should be observable and repairable.

The Media model makes such checks possible because every managed binary has a database identity and storage key.

## 32. Upload Security Boundary

The existence of a Media record does not imply that an uploaded file is safe.

Task 256 – Upload Security must define validation for at least:

- allowed MIME types
- detected MIME versus claimed MIME
- maximum file size
- file extensions
- dangerous formats
- image decoding
- malicious content
- potentially unsafe metadata

Files must not become normal active Media assets before required validation succeeds.

The detailed upload state machine is intentionally deferred until upload implementation.

## 33. SVG Considerations

SVG can contain active or unsafe content depending on how it is processed and served.

SVG support must therefore not be assumed to be equivalent to ordinary raster image upload.

If SVG is accepted later, it requires explicit sanitization and serving rules.

This is particularly relevant for club and competition logos.

## 34. Metadata Extraction

Technical metadata should preferably be determined by the server or trusted processing pipeline rather than accepted blindly from clients.

Examples:

```text
mimeType
sizeBytes
width
height
```

Client-provided values can be treated as hints but not authoritative security information.

## 35. Media Library Requirements

Task 140 – Media Library should be able to build on this model and expose at least:

- preview
- filename
- MIME type
- dimensions
- file size
- alt text
- copyright
- source
- creation date
- lifecycle state
- usage information

Potential filters later include:

- media type
- source
- copyright
- used/unused
- creation date
- status

## 36. Media Search

Media Library search does not initially require Meilisearch.

Database filtering is likely sufficient for the first implementation.

If the Media Library becomes large, indexing can be introduced later without changing the core Media identity.

## 37. Audit Considerations

Ordinary metadata edits do not necessarily require full moderation-style audit logging.

However, sensitive editorial actions may later warrant audit events, for example:

- physical deletion
- rights metadata changes
- replacement of published media
- administrative restoration

The general Audit domain should be reused rather than creating a separate Media audit system unless necessary.

## 38. Permissions

Task 070 does not define the complete permission matrix.

Likely future permissions include concepts such as:

```text
media.read
media.upload
media.edit
media.delete
media.manage
```

Editorial roles such as EDITOR and administrative roles will later receive the appropriate permissions through the centralized permission system.

Role checks must not be hardcoded throughout Media controllers.

## 39. User Account Status

Media administration is primarily an editorial/admin capability rather than a normal community posting capability.

The global Kurvenfunk rule still applies:

```text
Role != Account Status
```

If normal users later receive avatar upload capability, ACTIVE/LIMITED/BANNED behavior must be explicitly defined for that operation.

Task 070 does not invent those permission rules prematurely.

## 40. Validation Invariants

The eventual implementation should enforce domain invariants equivalent to the following.

### Internal media

```text
storageType = INTERNAL
storageKey must exist
externalUrl should not be the canonical location
```

### External media

```text
storageType = EXTERNAL
externalUrl must exist
storageKey is normally absent
```

### Size

```text
sizeBytes >= 0
```

### Dimensions

When present:

```text
width > 0
height > 0
```

### MIME

A Media asset must have a valid normalized MIME type once technical validation is complete.

## 41. Database Index Considerations

Exact indexes belong to Task 081 and Task 260.

Likely useful access paths include:

```text
storageKey
status
createdAt
mimeType
```

`storageKey` for internally managed media should normally be unique within the logical storage namespace.

External URLs should not automatically be assumed globally unique because the same remote asset may legitimately be represented differently depending on import provenance and rights metadata.

## 42. Duplicate Media

Binary duplicate detection is useful but not required for the initial Media domain.

Potential future techniques include:

- content hash
- provider media ID
- normalized source URL
- perceptual image hash

A content hash may later provide both integrity checking and exact duplicate detection.

It should be introduced when upload/import requirements justify it rather than being mandatory solely for Task 070.

## 43. Captions

A caption is generally contextual editorial content rather than intrinsic technical metadata.

The same image can be used with different captions in different articles.

Therefore captions should normally belong to the usage/editor content rather than the base Media entity.

This differs from:

```text
altText
copyright
source
```

which describe the asset or its accessibility/rights metadata more generally.

## 44. Replacement

Replacing a published media binary in place can create caching, auditing, and editorial problems.

Preferred principle:

> Materially different binary content should normally receive a new Media identity or storage object rather than silently replacing the meaning of an existing asset.

Metadata corrections such as alt text or copyright corrections can update the existing Media record.

## 45. Caching and CDN

Caching and CDN behavior are infrastructure concerns.

The Media domain must remain valid whether delivery later uses:

- direct MinIO URLs
- R2 public delivery
- Cloudflare CDN
- signed URLs
- image transformation services

No CDN hostname belongs in the fundamental identity of an internally managed Media record.

## 46. Backup Considerations

A usable backup strategy must consider both parts of the Media domain:

```text
PostgreSQL metadata
+
object storage binaries
```

Restoring only PostgreSQL without the corresponding required media objects can leave broken references.

Task 055 – Object Storage Backup Strategy must define the production policy.

## 47. Privacy Considerations

Media can contain personal data even when the Media table itself contains little personal information.

Examples include:

- profile photos
- photographs containing identifiable persons
- embedded image metadata

Upload and retention policies must therefore consider privacy requirements.

Unnecessary EXIF or similar metadata should not automatically be preserved in publicly served derivatives unless required.

## 48. Future Processing Pipeline

The model supports a future asynchronous pipeline such as:

```text
Upload
  ↓
Validation
  ↓
Store original
  ↓
Create Media record
  ↓
Queue processing
  ↓
Metadata extraction
  ↓
Optimization / variants
  ↓
Media available
```

Long-running processing belongs in the Worker according to the Kurvenfunk architecture rules.

The exact sequence can be refined during Task 139 – Media Upload.

## 49. Failure Handling

Later implementation must account for partial failures.

Examples:

```text
storage upload succeeds but database write fails

database record exists but processing fails

delete metadata succeeds but object deletion fails
```

Cleanup/reconciliation jobs should make these states recoverable.

Distributed storage/database operations must not pretend to be a single PostgreSQL transaction.

## 50. Relationship to Import Domain

Media itself must not become responsible for provider synchronization.

Provider-specific concerns belong to the Import domain.

Conceptually:

```text
Provider
   ↓
RawPayload
   ↓
Normalization
   ↓
Media
```

The normalized Media entity should remain usable even if the original provider is later removed.

## 51. Relationship to Article Domain

Article references Media but does not own the underlying asset exclusively.

Deleting or archiving an Article must therefore not automatically delete its referenced Media.

Article-specific presentation information belongs to Article or its media usage context.

## 52. Relationship to Profile Domain

Profile can reference Media for avatars.

Account deletion must later define whether avatar media is:

- physically deleted
- anonymized/detached
- retained temporarily for operational reasons

That behavior belongs to Task 251 – Account Deletion and the privacy policy.

## 53. Relationship to Club Domain

Club media is generally long-lived reference data.

Deleting or deactivating a Club must not automatically destroy historical logo assets needed by archived articles or historical competition data.

## 54. API Considerations

Future Media API responses should expose a resolved delivery representation without making clients construct storage-provider URLs themselves.

Conceptually, an API representation may contain:

```text
id
url
mimeType
width
height
altText
copyright
source
```

Here `url` is an API delivery value resolved from the storage layer, not necessarily a permanently stored database column.

This preserves the simple consumer-facing `url` concept from the master plan while keeping storage architecture clean.

## 55. Naming Conventions

Code-facing names should use clear English terminology.

Recommended names:

```text
Media
storageKey
externalUrl
originalFileName
mimeType
sizeBytes
width
height
altText
copyright
source
sourceUrl
status
createdAt
updatedAt
```

Avoid ambiguous names such as:

```text
path
file
link
imageUrl
```

when they do not make ownership or storage semantics clear.

## 56. Proposed Conceptual Model

```text
┌──────────────────────────────────────┐
│ Media                                │
├──────────────────────────────────────┤
│ id                                   │
│ storageType                          │
│ storageKey?                          │
│ externalUrl?                         │
│ originalFileName?                    │
│ mimeType                             │
│ sizeBytes                            │
│ width?                               │
│ height?                              │
│ altText?                             │
│ copyright?                           │
│ source?                              │
│ sourceUrl?                           │
│ status                               │
│ createdAt                            │
│ updatedAt                            │
└──────────────────────────────────────┘
                  │
                  │ referenced by
                  ▼
     ┌────────────┼─────────────┐
     │            │             │
  Article      Profile        Club
     │                          │
  hero/OG/                   logo
  content
```

The final relation cardinalities and foreign keys are consolidated in Task 081 – Prisma Schema.

## 57. Recommended Initial Domain Decisions

For Kurvenfunk, the initial design should use these decisions:

1. Media is a standalone entity.
2. Internally stored media uses `storageKey` as its stable storage reference.
3. Public internal URLs are resolved through the storage abstraction.
4. External assets use an explicit external URL rather than pretending to be internally stored.
5. MIME type and size are mandatory after validation.
6. Image dimensions are stored when available.
7. Alt text, copyright, source, and source URL are supported.
8. Media can be reused by multiple entities.
9. Article deletion does not imply Media deletion.
10. Physical deletion requires reference checks.
11. Soft deletion/archiving is supported conceptually.
12. Storage-provider details remain infrastructure concerns.
13. Captions belong to usage context, not necessarily the base asset.
14. Derived image variants are deferred until processing requirements are implemented.
15. Provider-specific metadata remains in the Import domain unless normalized fields have general domain value.

## 58. Preparation for Task 081 – Prisma Schema

When all domain models are consolidated into Prisma, Task 081 should decide the concrete representation of:

- Media primary key
- storage type enum
- lifecycle status enum
- nullable internal/external location fields
- unique storage-key constraints
- Article media relations
- Profile avatar relation
- Club logo relation
- Competition media relation if required
- delete behavior
- indexes
- timestamps

Task 081 must validate Media relations against all previously defined domain models before generating the initial migration.

## 59. Preparation for Task 139 – Media Upload

Media Upload must later define:

- accepted file types
- maximum sizes
- MIME verification
- object key generation
- storage upload
- metadata extraction
- image dimensions
- failure cleanup
- authorization
- rate limits
- processing jobs
- API response

The upload flow must create Media records according to the invariants defined here.

## 60. Preparation for Task 140 – Media Library

Media Library must later provide management for:

- media preview
- metadata
- alt text
- copyright
- source
- usage
- lifecycle
- filtering
- safe deletion

The library should make it difficult to accidentally delete assets still used by published content.

## 61. Preparation for Task 256 – Upload Security

Upload Security must later establish the trust boundary between untrusted input and an active Media asset.

At minimum it must address:

- MIME spoofing
- extension spoofing
- oversized files
- malformed images
- unsafe SVG
- dangerous embedded content
- metadata handling
- rate limiting

The Media model must not be used as evidence that an uploaded binary has passed these checks unless the upload pipeline explicitly guarantees it.

## 62. Acceptance Criteria

Task 070 – Media Model is considered defined when the following statements are true:

- Media exists as an independent domain concept.
- The model supports the master-plan fields `storageKey`, URL delivery, MIME type, size, copyright, source, and alt text.
- Internal and external media can be distinguished.
- Internal storage does not depend on permanent provider-specific URLs.
- MinIO and Cloudflare R2 can use the same domain model.
- Image dimensions are supported.
- Media can be reused.
- Article, Profile, Club, and future domains can reference Media.
- Copyright and source are distinct concepts.
- Alt text is explicitly supported.
- Media lifecycle and safe deletion rules are defined.
- Physical deletion cannot blindly follow deletion of a single usage.
- Upload security remains a separate later concern.
- Prisma implementation is intentionally deferred to Task 081.
- Media Upload implementation is intentionally deferred to Task 139.
- Media Library implementation is intentionally deferred to Task 140.

## 63. Result

The Kurvenfunk Media domain now has a defined architecture for internally stored and externally referenced media.

The central rule is:

```text
Domain identity
      ↓
Media.id
      ↓
Media.storageKey
      ↓
Storage abstraction
      ↓
MinIO / Cloudflare R2
      ↓
Resolved delivery URL
```

For externally hosted assets:

```text
Domain identity
      ↓
Media.id
      ↓
Media.externalUrl
```

This keeps media metadata stable, makes assets reusable, preserves accessibility and rights information, and prevents the editorial domain from becoming coupled to a specific storage provider.

Task 070 defines the model only. The concrete Prisma schema, migration, upload implementation, processing pipeline, and Media Library follow in their designated project-plan tasks.
