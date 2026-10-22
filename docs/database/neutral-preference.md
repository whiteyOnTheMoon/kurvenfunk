# Neutral Preference

## Status

Task: 064 – Neutral Preference

Status: Defined

## Purpose

This document defines how Kurvenfunk represents a user's football club
preference when the user either selects a canonical Club, explicitly chooses
to remain neutral, or has not made a choice yet.

The model must distinguish these states without introducing a synthetic Club
record for neutral users.

## Domain Context

Task 058 reserves the optional relation:

`User.favoriteClubId`

Task 062 defines Club as the canonical football club entity and explicitly
states that Neutral is not a Club.

Task 059 defines Profile as presentation-oriented profile data and explicitly
excludes fan preference state from Profile.

Therefore fan preference remains part of the User domain.

## Fan Preference States

Kurvenfunk defines three explicit fan preference states:

- `UNSET`
- `CLUB`
- `NEUTRAL`

These states must not be inferred solely from `favoriteClubId`.

## UNSET

`UNSET` means that the user has not yet made an explicit fan preference choice.

Expected state:

`fanPreference = UNSET`

`favoriteClubId = null`

This is the default state for a newly created User.

`UNSET` is not equivalent to `NEUTRAL`.

It represents missing user intent rather than an explicit decision.

A user whose fan preference is `UNSET` has not yet satisfied the mandatory
club-or-neutral onboarding choice.

## CLUB

`CLUB` means that the user explicitly selected a canonical Club as their
favorite club.

Expected state:

`fanPreference = CLUB`

`favoriteClubId != null`

The referenced value must identify an existing canonical Club.

A `CLUB` preference without a valid `favoriteClubId` is invalid domain state.

The Club relation remains:

`User.favoriteClubId -> Club.id`

No duplicate favorite-club relation is stored in Profile or another preference
entity.

## NEUTRAL

`NEUTRAL` means that the user explicitly chose not to associate with a favorite
Club.

Expected state:

`fanPreference = NEUTRAL`

`favoriteClubId = null`

Neutral is a deliberate user preference.

It must not be represented by:

- a synthetic Club record
- a special UUID
- a sentinel string stored in `favoriteClubId`
- implicit interpretation of `favoriteClubId = null`

Examples of forbidden synthetic clubs include:

- Neutral
- No Club
- None

## Why Null Is Not Enough

`favoriteClubId` is nullable for more than one reason.

For example:

### New User

`fanPreference = UNSET`

`favoriteClubId = null`

The user has not made a choice yet.

### Neutral User

`fanPreference = NEUTRAL`

`favoriteClubId = null`

The user explicitly chose to remain neutral.

These states carry different domain meaning even though the Club relation is
null in both cases.

Therefore application logic must always evaluate the explicit fan preference
state when the distinction matters.

## Canonical State Matrix

| fanPreference | favoriteClubId | Valid | Meaning |
| --- | --- | --- | --- |
| `UNSET` | `null` | yes | No preference selected yet |
| `NEUTRAL` | `null` | yes | Explicit neutral preference |
| `CLUB` | Club ID | yes | Explicit canonical Club preference |
| `CLUB` | `null` | no | Club preference without Club |
| `NEUTRAL` | Club ID | no | Neutral preference with Club relation |
| `UNSET` | Club ID | no | Unselected preference with Club relation |

## User Model

The intended User fields are conceptually:

`fanPreference`

and:

`favoriteClubId`

The preferred enum name is:

`FanPreference`

with values:

- `UNSET`
- `CLUB`
- `NEUTRAL`

A possible Prisma representation is conceptually:

```prisma
enum FanPreference {
  UNSET
  CLUB
  NEUTRAL
}

model User {
  fanPreference  FanPreference @default(UNSET)
  favoriteClubId String?
}
```

The final Prisma model must additionally define the canonical Club relation
introduced by Task 062.

Task 064 defines the domain semantics and invariants. It does not create the
persistence migration.

## Default State

A newly synchronized or newly created Kurvenfunk User starts with:

`fanPreference = UNSET`

and:

`favoriteClubId = null`

Authentication success does not imply a fan preference choice.

The user must explicitly select either:

- a Club
- Neutral

during mandatory onboarding.

## Onboarding Semantics

Task 058 defines mandatory onboarding.

The fan preference requirement is satisfied only when:

`fanPreference = CLUB`

with a valid Club relation,

or:

`fanPreference = NEUTRAL`

with no Club relation.

`fanPreference = UNSET`

does not satisfy the requirement.

Therefore `onboardingCompleted` must not become true while the mandatory fan
preference remains `UNSET`.

Task 064 defines only the fan preference requirement. The complete onboarding
workflow is implemented separately.

## Changing Preference

A user may later change their fan preference.

### UNSET to CLUB

Set:

`favoriteClubId = selected Club`

and:

`fanPreference = CLUB`

### UNSET to NEUTRAL

Ensure:

`favoriteClubId = null`

and set:

`fanPreference = NEUTRAL`

### CLUB to NEUTRAL

Clear:

`favoriteClubId`

and set:

`fanPreference = NEUTRAL`

### NEUTRAL to CLUB

Set:

`favoriteClubId = selected Club`

and:

`fanPreference = CLUB`

### CLUB to CLUB

Replace `favoriteClubId` with the newly selected canonical Club.

The preference remains:

`fanPreference = CLUB`

### NEUTRAL to NEUTRAL

No domain change is required.

### Resetting to UNSET

`UNSET` represents absence of an explicit choice.

Normal post-onboarding preference editing should therefore not use `UNSET`
as a user-facing equivalent of Neutral.

If a later administrative or account-lifecycle workflow needs to reset a
preference to `UNSET`, that workflow must explicitly define why the user's
previous intent is being removed.

## Atomicity

Preference changes that modify both `fanPreference` and `favoriteClubId` form
one logical domain operation.

Application code must not intentionally persist an invalid combination between
the two fields.

Where multiple persistence operations would otherwise be required, the change
must be performed transactionally.

For example, changing from:

`CLUB`

to:

`NEUTRAL`

must result atomically in:

`fanPreference = NEUTRAL`

and:

`favoriteClubId = null`

The application must not expose an intermediate persisted state where
`fanPreference = NEUTRAL` still references a Club.

## Validation

Application-level validation must reject inconsistent combinations.

The following states are invalid:

- `CLUB` with `favoriteClubId = null`
- `NEUTRAL` with a non-null `favoriteClubId`
- `UNSET` with a non-null `favoriteClubId`
- `CLUB` referencing a non-existing Club

A selected Club may additionally be subject to later business rules governing
whether users are currently allowed to select that Club.

Those selection rules are separate from the fundamental relation validity.

## Database Constraints

The database should enforce as much of the state model as practical.

A future migration may use a check constraint logically equivalent to:

```text

(
  fanPreference = 'CLUB'
  AND favoriteClubId IS NOT NULL
)
OR(
(
  fanPreference IN ('UNSET', 'NEUTRAL')
  AND favoriteClubId IS NULL
)
```

The Club foreign key independently protects the canonical Club relation.

Prisma schema capabilities and migration implementation details are handled when
persistence for these models is introduced.

No migration is created as part of Task 064.

## API Semantics

APIs exposing fan preference should not force clients to infer the state from the
Club relation.

A preference response should conceptually expose both:

 - preference state
 - favorite Club where applicable

For example:

```json
{
  "fanPreference": "CLUB",
  "favoriteClub": {"id": "..."}
}
```

or:

```json
{
  "fanPreference": "NEUTRAL",
  "favoriteClub": null
}
```

or:

```json
{
  "fanPreference": "UNSET",
  "favoriteClub": null
}
```

The exact API DTOs are defined by later implementation tasks.

## Public Profile Composition

Task 059 allows a public profile to combine user information with fan preference data.

For example, presentation code may display:

- Club name and branding for `CLUB`
- a neutral marker or neutral presentation for `NEUTRAL`
- no preference presentation for `UNSET`

This does not move fan preference persistence into Profile.

The fact that favorite Club information may be visible on a public profile does not change its source of truth.

## Club Lifecycle

The canonical Club reference must not be implicitly converted to `NEUTRAL` or `UNSET` during Club lifecycle changes.

If an existing favorite Club becomes inactive, the user preference should remain distinguishable from an explicit neutral preference.

The exact presentation and selection rules for inactive Clubs are defined by later application tasks.

## External Providers

External sports and news providers must not directly decide a user's fan preference.

The fan preference represents explicit Kurvenfunk user intent.

Provider-specific Club identifiers are not stored as the user's favorite Club relation.

This relation always points to the canonical Kurvenfunk Club entity.

## Source of Truth

Fan preference is the source of truth for the user's fan club preference.

Specifically:

 - `fanPreference` stores the explicit preference state
 - `favoriteClubId` stores the canonical Club relation where applicable

Profile does not duplicate either value.

Club does not store reverse preference ownership as authoritative domain state.

## Domain Invariants

1. Fan preference has exactly three states: `UNSET`, `CLUB`, and `NEUTRAL`.
2. `UNSET` means that no explicit preference has been selected yet.
3. `NEUTRAL` means that the user explicitly chose no favorite Club.
4. `CLUB` means that the user explicitly selected a canonical Club.
5. Neutral is not represented by a Club entity.
6. `favoriteClubId = null` alone does not identify the preference state.
7. `UNSET` requires `favoriteClubId = null`.
8. `NEUTRAL` requires `favoriteClubId = null`.
9. `CLUB` requires a non-null `favoriteClubId`.
10. A `CLUB` preference must reference an existing canonical Club.
11. New users default to `UNSET`.
12. `UNSET` does not satisfy the mandatory fan preference onboarding choice.
13. `CLUB` and `NEUTRAL` satisfy the fan preference onboarding choice when
    their respective invariants are valid.
14. Fan preference state is stored in the User domain.
15. Profile does not duplicate fan preference state.
16. Profile does not duplicate `favoriteClubId`.
17. Preference changes must preserve the canonical state matrix.
18. Changes affecting both state and Club relation are one logical operation.
19. External providers do not determine user fan preference.
20. Provider-specific Club IDs are not stored in fan preference.
21. An inactive Club does not automatically convert a preference to `NEUTRAL`.
22. An inactive Club does not automatically convert a preference to `UNSET`.
23. Neutral always represents explicit user intent.
24. Missing preference always remains distinguishable from explicit neutrality.

## Persistence Direction

When the User persistence model is extended, the likely implementation is:

- enum `FanPreference`
- non-null `User.fanPreference`
- default `UNSET`
- nullable `User.favoriteClubId`
- foreign key from `favoriteClubId` to `Club.id`
- validation or database check constraint enforcing the canonical state matrix

No migration is created as part of Task 064.

## Related Tasks

- Task 058 – User Model
- Task 059 – Profile Model
- Task 062 – Club Model
- Task 063 – Club Alias Model
- later onboarding implementation
- later Prisma persistence migration
- later public profile API composition

## Summary

Kurvenfunk represents fan preference explicitly.

The valid states are:

`UNSET`

No choice has been made and `favoriteClubId` is null.

`NEUTRAL`

The user deliberately selected no favorite Club and `favoriteClubId` is null.

`CLUB`

The user deliberately selected a canonical Club and `favoriteClubId` references
that Club.

Neutral is not a synthetic Club.

A null Club relation alone never defines whether the user is neutral or has not
made a choice.

The User domain is the single source of truth for both the explicit preference
state and the canonical favorite Club relation.

No migration is created as part of Task 064.
