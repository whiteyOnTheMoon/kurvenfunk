# User Model

## Status

Domain model definition for Phase 10 / Task 058.

This document defines the core Kurvenfunk `User` entity.

The Prisma implementation is intentionally deferred until Task 081, after the
remaining domain models have been defined.

## Purpose

The `User` entity represents the Kurvenfunk application account.

Authentication credentials and passwords are not stored by Kurvenfunk.
Authentication is handled by Keycloak.

A Kurvenfunk user is linked to exactly one Keycloak identity through the
Keycloak subject (`sub`).

The User entity contains account-level application data only.

Public profile data, roles, detailed fan preference handling and moderation
entities are modeled separately.

## Entity

### User

| Field | Type | Required | Constraints / Meaning |
|---|---|---:|---|
| `id` | UUID | yes | Internal immutable Kurvenfunk user identifier |
| `keycloakSubject` | String | yes | Immutable Keycloak `sub`; globally unique within Kurvenfunk |
| `nickname` | String | no | Public community nickname; null until selected during onboarding |
| `status` | UserStatus | yes | Account status; defined separately in Task 060 |
| `favoriteClubId` | UUID | no | Optional reference to favorite club; relation defined with Club model |
| `onboardingCompleted` | Boolean | yes | Indicates whether mandatory Kurvenfunk onboarding has been completed |
| `createdAt` | DateTime | yes | Timestamp when the Kurvenfunk user was created |
| `updatedAt` | DateTime | yes | Timestamp of the latest persisted user change |

## Identity

Kurvenfunk uses two different identifiers for a user.

### Internal ID

`id` is the internal Kurvenfunk identifier.

It must not depend on Keycloak or another external identity provider.

The intended database representation is a UUID.

### Keycloak Subject

`keycloakSubject` stores the `sub` claim of the authenticated Keycloak identity.

Requirements:

- required
- unique
- treated as immutable
- not exposed as the primary public user identifier
- no passwords or authentication secrets are stored in the User entity

This allows Kurvenfunk domain data to remain independent from Keycloak's
internal database identifiers while still maintaining a stable identity link.

## Nickname

`nickname` is nullable at User creation time.

Reason:

The authentication flow creates or synchronizes the Kurvenfunk User after the
first successful Keycloak login. At that point onboarding may not yet have
taken place.

Expected lifecycle:

1. Keycloak login succeeds.
2. Kurvenfunk User is created if necessary.
3. `nickname = null`
4. `onboardingCompleted = false`
5. User enters onboarding.
6. User chooses a valid and available nickname.
7. Nickname is persisted.
8. Remaining onboarding choices are completed.
9. `onboardingCompleted = true`

Nickname validation, reserved names and case-insensitive uniqueness are defined
later as part of the onboarding implementation.

## Account Status

`status` represents the account state and is deliberately independent from
roles.

The concrete `UserStatus` model is defined in Task 060.

Planned values:

- `ACTIVE`
- `LIMITED`
- `BANNED`

Role and status must never be treated as the same concept.

For example, a moderator may have a moderation role while still having an
account status of ACTIVE.

## Favorite Club

`favoriteClubId` is an optional relation to the Club domain.

The actual Club entity and database relation are defined later.

A null `favoriteClubId` alone must not be interpreted as "neutral".

Before onboarding is completed it may mean that no preference has been chosen
yet.

Task 064 introduces the explicit fan preference states needed to distinguish:

- club selected
- neutral
- not selected yet

Therefore application logic must not infer the complete fan preference solely
from `favoriteClubId`.

## Onboarding

`onboardingCompleted` explicitly tracks whether the mandatory Kurvenfunk
onboarding has been completed.

Initial value:

`false`

It may only become `true` once all mandatory onboarding requirements have been
successfully persisted.

At minimum those requirements are intended to include:

- valid nickname
- explicit club or neutral preference

Authentication success alone does not imply completed onboarding.

## Timestamps

### createdAt

Set once when the Kurvenfunk User record is created.

### updatedAt

Updated whenever persisted User data changes.

These timestamps belong to the Kurvenfunk application entity and are
independent from Keycloak account timestamps.

## Separation From Other Domain Models

The following data deliberately does not belong directly to the core User
model in Task 058.

### Profile

Public and optional profile information is defined in Task 059.

Examples:

- display name
- bio
- avatar

### User Status

The concrete status enum and its semantics are defined in Task 060.

### Roles

Authorization roles are defined separately in Task 061.

Planned roles include:

- USER
- TRUSTED_USER
- MODERATOR
- EDITOR
- ADMIN
- SUPERADMIN

Roles and account status remain separate concepts.

### Club

The Club entity and its metadata are defined in Task 062.

### Fan Preference

The distinction between club fan, neutral user and not-yet-selected preference
is defined in Task 064.

## Invariants

The User domain must preserve the following invariants:

1. Every Kurvenfunk User has exactly one internal immutable ID.
2. Every Kurvenfunk User maps to exactly one unique Keycloak subject.
3. Kurvenfunk stores no authentication password.
4. A newly synchronized User may exist without a nickname.
5. A newly synchronized User starts with incomplete onboarding.
6. Role and account status are separate concepts.
7. A missing favorite club does not automatically mean neutral.
8. Public profile information is kept separate from core account data.

## Intended Prisma Mapping

The exact Prisma schema is deferred until Task 081.

The expected mapping will approximately require:

- UUID primary key for `id`
- unique constraint for `keycloakSubject`
- nullable `nickname`
- `UserStatus` relation/enum from Task 060
- nullable Club relation after Task 062
- explicit fan preference after Task 064
- default `false` for `onboardingCompleted`
- automatic creation timestamp
- automatic update timestamp

No migration is created as part of Task 058.
