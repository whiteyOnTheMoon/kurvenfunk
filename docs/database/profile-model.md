# Profile Model

## Status

Domain model definition for Phase 10 / Task 059.

This document defines the Kurvenfunk `Profile` entity and its separation from
the core `User` account model.

The Prisma implementation is intentionally deferred until Task 081, after the
remaining domain models have been defined.

## Purpose

The `Profile` entity contains optional public profile information belonging to
a Kurvenfunk user.

It is deliberately separated from the core `User` entity.

The `User` entity represents the application account and contains data required
for account lifecycle, onboarding and authorization-related state.

The `Profile` entity contains information that exists primarily for public
presentation within the Kurvenfunk community.

Examples include:

- display name
- biography
- avatar

Authentication credentials, account status, roles and fan preference do not
belong to the Profile entity.

## Entity

### Profile

| Field | Type | Required | Constraints / Meaning |
|---|---|---:|---|
| `id` | UUID | yes | Internal immutable profile identifier |
| `userId` | UUID | yes | Reference to exactly one Kurvenfunk User; unique |
| `displayName` | String | no | Optional public display name |
| `bio` | String | no | Optional public biography / profile description |
| `avatarMediaId` | UUID | no | Optional reference to Media entity defined in Task 070 |
| `createdAt` | DateTime | yes | Timestamp when the Profile record was created |
| `updatedAt` | DateTime | yes | Timestamp of the latest persisted Profile change |

## User Relation

Every Profile belongs to exactly one User.

The intended relationship is:

User 1 -> 0..1 Profile

A User may initially exist without a Profile.

A Profile must never exist without its associated User.

`userId` must therefore be:

- required
- unique
- a foreign key to User
- protected from referring to more than one Profile per User

The Profile is not a second account identity.

The canonical Kurvenfunk account identifier remains `User.id`.

## Optional Profile Creation

Creating a Kurvenfunk User does not require creating a Profile immediately.

This is intentional.

A new account may follow this lifecycle:

1. Keycloak authentication succeeds.
2. Kurvenfunk User is created or synchronized.
3. Mandatory onboarding is completed.
4. Optional Profile data may be added immediately or later.

The application may create an empty Profile automatically in the future if
that simplifies implementation, but the domain model must not rely on its
existence for authentication or account validity.

A User without a Profile remains a valid Kurvenfunk account.

## Nickname vs Display Name

`User.nickname` and `Profile.displayName` serve different purposes.

### Nickname

The nickname is the canonical Kurvenfunk community name.

It is:

- selected during mandatory onboarding
- intended to be unique
- used to identify the user in community interactions
- part of the core User model

Examples of places where the nickname may be used:

- comments
- forum posts
- mentions
- moderation interfaces
- user links

### Display Name

The display name is optional profile presentation data.

It:

- does not replace the nickname
- does not need to be unique
- must not be used as an authorization or identity key
- may be shown on the user's profile where appropriate

Example:

Nickname:

`SturmFan1909`

Display name:

`Alex`

Community content may still identify the author as `SturmFan1909`.

A future product decision may decide whether the display name is shown
alongside the nickname on profile pages.

## Biography

`bio` contains an optional short public description written by the user.

It is user-generated content.

Therefore later implementation must include appropriate:

- maximum length validation
- input validation
- output escaping / safe rendering
- moderation handling where necessary

The exact length and content rules are deferred until profile editing is
implemented.

The Profile model stores the content only and does not define moderation
policy.

## Avatar

The Profile may have one optional avatar.

The intended relation is:

Profile 0..1 -> Media

The Profile must not directly depend on a particular object storage provider.

Therefore it should not store storage-specific data such as:

- MinIO bucket information
- Cloudflare R2 credentials
- provider-specific object URLs
- local filesystem paths

The shared Media entity is defined later in Task 070.

The intended Profile reference is:

`avatarMediaId`

Until the Media model is defined, this remains a domain-level planned relation.

A missing avatar means that Kurvenfunk should display a default avatar or
generated fallback in the presentation layer.

## Favorite Club

Favorite club information does not belong to Profile.

Although a favorite club is visible on a public profile, its source of truth is
the user's fan preference domain.

Task 058 already reserves `favoriteClubId` at User level.

Task 064 defines the explicit distinction between:

- club selected
- neutral
- not selected yet

Therefore Profile must not introduce another `favoriteClubId` or Club relation.

When rendering a public profile, the application may combine data from:

User

+

Profile

+

Fan Preference

+

Club

This keeps presentation concerns separate without duplicating domain state.

## Public Profile Composition

A public user profile is not represented by the Profile table alone.

Conceptually it may be assembled from multiple domain entities.

For example:

User

- id
- nickname

Profile

- displayName
- bio
- avatar

Fan Preference

- preference state
- favorite club where applicable

Club

- name
- logo
- colors

Community activity

- comments
- forum posts
- other public activity

This composition belongs to the application/API layer.

It must not result in duplicate persistence of the same information across
multiple entities.

## Account Data Separation

The following information must not be stored in Profile.

### Authentication

Examples:

- Keycloak subject
- password
- authentication tokens
- sessions
- identity provider credentials

### Account State

Examples:

- account status
- onboarding completion
- roles

### Moderation State

Examples:

- yellow cards
- red cards
- sanctions
- bans
- IP blocks
- internal moderator notes

### Fan Preference State

Examples:

- CLUB / NEUTRAL / UNSET
- canonical favorite club relation

These concepts have their own domain models.

## Privacy

Profile fields are intended to be public or potentially public within
Kurvenfunk.

This has several consequences for later implementation:

- optional fields should default to absent rather than requiring personal data
- users should not be encouraged to provide unnecessary personal information
- profile editing must clearly communicate what information is public
- account deletion must handle Profile data
- Profile data must be included in applicable personal-data exports

Detailed privacy and retention rules are defined later in the dedicated privacy
tasks.

## Deletion

A Profile depends on its User.

When a User account is permanently deleted, its Profile must not remain as an
orphaned record.

The intended database behavior is to remove the associated Profile together
with the User.

The exact deletion/anonymization workflow is defined later in Task 251.

Community content such as comments or forum posts is not part of Profile and
may follow separate anonymization rules.

## Timestamps

### createdAt

Set once when the Profile record is created.

It does not need to equal `User.createdAt`, because the Profile may be created
later.

### updatedAt

Updated whenever persisted Profile information changes.

Profile updates must not unnecessarily modify account-level data in User.

## Invariants

The Profile domain must preserve the following invariants:

1. A Profile belongs to exactly one User.
2. A User has at most one Profile.
3. A Profile cannot exist without a User.
4. A User can exist without a Profile.
5. The Profile is not an authentication or authorization entity.
6. `User.nickname` remains the canonical community nickname.
7. `Profile.displayName` is optional and non-unique.
8. Favorite club information is not duplicated in Profile.
9. Avatar storage details are delegated to the Media domain.
10. Profile fields are optional unless a future product requirement explicitly
    makes one mandatory.
11. Public Profile information must remain separate from private moderation and
    authentication data.

## Intended Prisma Mapping

The exact Prisma schema is deferred until Task 081.

The expected mapping will approximately require:

- UUID primary key for `id`
- required and unique `userId`
- one-to-one relation from Profile to User
- nullable `displayName`
- nullable `bio`
- nullable Media relation through `avatarMediaId` after Task 070
- automatic creation timestamp
- automatic update timestamp
- deletion behavior preventing orphaned Profiles

No migration is created as part of Task 059.
