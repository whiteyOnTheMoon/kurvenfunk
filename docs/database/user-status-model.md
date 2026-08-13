# User Status Model

## Status

Task: 060 – User Status Model

State: Domain model defined

Implementation status: Documentation only. Prisma enum and migration are deferred to Tasks 081 and 082.

## Purpose

The user status model represents the current account-level access state of a Kurvenfunk user.

Account status and authorization roles are separate concepts.

A role answers:

> What is this user generally allowed to do?

A status answers:

> Is this account currently allowed to exercise those permissions?

A user may therefore have a role such as `USER`, `MODERATOR` or `ADMIN` while independently having the status `ACTIVE`, `LIMITED` or `BANNED`.

Role and status must never be treated as the same concept.

## UserStatus

Kurvenfunk defines exactly three initial account statuses:

| Status | Meaning |
| --- | --- |
| `ACTIVE` | Normal account state |
| `LIMITED` | Restricted account; reading, searching and reactions remain possible, while community content creation is blocked |
| `BANNED` | Account is blocked from authenticated Kurvenfunk activity |

Planned Prisma representation:

```prisma
enum UserStatus {
  ACTIVE
  LIMITED
  BANNED
}
```

A newly created Kurvenfunk user defaults to `ACTIVE`.

## ACTIVE

`ACTIVE` is the normal account state.

An ACTIVE user may exercise every permission granted by their roles and other applicable authorization rules.

ACTIVE itself does not grant permissions.

Examples of actions that may be available when otherwise permitted:

- read content
- search
- view football data
- react or vote
- create comments
- reply to comments
- create threads
- create forum posts
- use role-specific moderation, editorial or administrative functions

## LIMITED

`LIMITED` is an account-level restriction.

A LIMITED user remains authenticated and may continue using read-oriented functionality.

### Allowed

A LIMITED user may:

- read public content
- read news
- view clubs
- view competitions
- view matches
- view standings
- read article discussions
- read forums
- search
- react or vote where otherwise permitted

### Blocked

A LIMITED user may not:

- create comments
- reply to comments
- create threads
- create forum posts
- create other community content covered by the limitation

A role must not implicitly bypass LIMITED.

For example, a role may normally grant `comment.create`, but that action is still denied while the account is LIMITED.

## BANNED

`BANNED` means that the Kurvenfunk account is blocked.

A banned account must not be allowed to perform authenticated Kurvenfunk actions.

This includes:

- creating comments or replies
- reacting or voting
- creating threads or forum posts
- profile or account mutations
- moderation actions
- editorial actions
- administrative actions

Public pages may remain readable without authentication because public access is not an account permission.

A privileged role does not override BANNED.

## Status and Roles

Roles and status are independent dimensions.

Examples:

| Role | Status | Result |
| --- | --- | --- |
| `USER` | `ACTIVE` | Normal user permissions |
| `USER` | `LIMITED` | Read/search/vote allowed; community content creation blocked |
| `USER` | `BANNED` | Authenticated actions blocked |
| `MODERATOR` | `ACTIVE` | Moderator permissions available |
| `MODERATOR` | `LIMITED` | LIMITED restrictions still apply; no automatic bypass |
| `ADMIN` | `BANNED` | Authenticated access blocked despite privileged role |

Task 061 defines the role model.

## Status and Permissions

Permissions must never be evaluated from role alone.

Authorization should conceptually consider at least:

1. authenticated user
2. account status
3. role-derived permission
4. resource-specific rules
5. active sanctions or other restrictions

A simplified decision is:

```text
authenticated
    +
status permits action
    +
role grants permission
    +
resource rules permit action
    =
allowed
```

## Permission Baseline

| Capability | ACTIVE | LIMITED | BANNED |
| --- | --- | --- | --- |
| Read public content | yes | yes | public access only |
| Search | yes | yes | public access only |
| View football data | yes | yes | public access only |
| React / vote | yes | yes | no |
| Create comment | yes* | no | no |
| Reply to comment | yes* | no | no |
| Create thread | yes* | no | no |
| Create forum post | yes* | no | no |
| Authenticated profile mutations | yes* | limited by policy | no |
| Role-specific privileged actions | yes* | explicit policy required | no |

`yes*` means the action is still subject to roles, permissions and resource-specific authorization.

This matrix defines status behavior only. It does not grant permissions by itself.

## BANNED and Sessions

When an account changes to `BANNED`, active authentication sessions must be revoked.

The intended flow is:

1. set the Kurvenfunk user status to `BANNED`
2. persist the change
3. revoke active Keycloak sessions
4. block authenticated application access
5. create the required audit event
6. create the required user notification where applicable

A valid Keycloak token must not bypass the Kurvenfunk account status.

Session revocation is enforcement behavior and not part of the enum itself.

## Status Transitions

The domain supports the following conceptual transitions:

```text
ACTIVE  -> LIMITED
LIMITED -> ACTIVE
ACTIVE  -> BANNED
LIMITED -> BANNED
BANNED  -> ACTIVE
BANNED  -> LIMITED
```

Not every transition must be exposed to every moderator or administrator.

Permissions, moderation rules, sanctions and audit requirements determine who may perform a transition.

## Temporary LIMITED

`LIMITED` may represent a temporary restriction.

Examples from the product model include:

- 24 hours
- 3 days
- 7 days
- 30 days

The `User.status` field itself does not store an expiration timestamp.

Restriction duration, reason and history belong to the sanction model defined in Task 076.

When a temporary sanction expires, later sanction-expiration logic may restore or recalculate the effective account status.

This keeps current account state separate from sanction metadata and history.

## BANNED Duration

The status enum does not distinguish temporary and permanent bans.

Duration, reason, origin and moderation history belong to sanctions, moderation cards and audit records.

`User.status` represents only the current effective account-level state.

## Status and Moderation Cards

Moderation cards and account status are related but separate concepts.

A yellow card does not inherently change the account status.

The planned default rule is:

```text
1 yellow card -> warning
2 yellow cards -> stronger warning
3 relevant yellow cards -> red card -> BANNED
```

A sufficiently serious violation may also produce a direct red card and `BANNED` status.

The detailed card model is defined in Task 075.

## Status and Sanctions

The status enum does not replace the sanction model.

Later sanctions may include:

- `LIMITED`
- `COMMENT_BLOCK`
- `FORUM_BLOCK`
- `ACCOUNT_BAN`
- `IP_BLOCK`

A sanction records why a restriction exists, who created it, when it started, when it expires and whether it remains active.

`User.status` stores only the current account-level state.

Later domain logic is responsible for keeping account status consistent with relevant active sanctions.

## Status Changes

Status changes are security- and moderation-relevant operations.

Normal application behavior must not rely on untracked direct database mutations.

Later services must provide controlled operations for actions such as:

- activate user
- limit user
- ban user
- restore user

## Audit Requirements

Transitions involving `LIMITED` or `BANNED` must be auditable.

The audit trail should eventually identify:

- affected user
- previous status
- new status
- actor
- reason or context
- timestamp

The concrete audit model is defined in Task 078.

## Source of Truth

PostgreSQL is the source of truth for the current Kurvenfunk user status.

Account status must not depend solely on:

- Redis
- frontend state
- cached session state
- Keycloak role mappings
- Meilisearch

Cached authorization information may exist later, but it must not become authoritative.

## API Enforcement

The frontend is not responsible for enforcing account status.

Frontend behavior may hide or disable unavailable actions, but the API must independently reject prohibited operations.

Examples:

- a LIMITED user sends a handcrafted comment request -> API rejects it
- a BANNED user presents a still-valid access token -> API rejects authenticated platform access

Status enforcement is therefore a backend security boundary.

## Central Enforcement

Status checks must be centralized.

Controllers and services must not independently invent different interpretations of `ACTIVE`, `LIMITED` and `BANNED`.

Task 173 introduces the central account status guard.

The permission system from Task 172 must use the same domain semantics.

## Privacy

Account status is internal account and moderation-related information.

Raw `UserStatus` must not be exposed as public profile data by default.

Public users do not need to know whether another account is `LIMITED` or `BANNED` unless a later product requirement explicitly defines a public representation.

## Invariants

1. Every persisted Kurvenfunk user has exactly one current `UserStatus`.
2. Valid initial statuses are only `ACTIVE`, `LIMITED` and `BANNED`.
3. New users default to `ACTIVE` unless explicitly defined otherwise.
4. Role and status are separate concepts.
5. ACTIVE grants no permission by itself.
6. LIMITED blocks community content creation.
7. LIMITED retains reading, searching and voting/reaction capability.
8. BANNED blocks authenticated Kurvenfunk actions.
9. Privileged roles do not automatically bypass account status.
10. A valid Keycloak token does not bypass account status.
11. Status enforcement is performed server-side.
12. Status checks are centralized.
13. Temporary restriction duration belongs to sanctions, not `User.status`.
14. Moderation history is not encoded in the enum.
15. PostgreSQL is the source of truth for current account status.
16. BANNED requires session revocation as part of the later enforcement flow.
17. Security-relevant status transitions must be auditable.
18. Raw account status is not public profile data by default.

## Related Tasks

- Task 058 – User Model: stores `status: UserStatus`
- Task 059 – Profile Model: keeps public profile data separate from account status
- Task 061 – User Roles Model: defines roles independently from status
- Task 075 – Yellow Card Model: defines moderation cards
- Task 076 – Sanction Model: defines duration, scope and reason of restrictions
- Task 078 – Audit Log Model: records critical status transitions
- Task 172 – Permission System: combines role permissions with status restrictions
- Task 173 – Account Status Guard: central runtime enforcement
- Task 176 – Automatic Red Card: may transition user to `BANNED`
- Task 178 – LIMITED Sanction: applies temporary LIMITED restrictions
- Task 186 – Session Revoke: revokes Keycloak sessions for banned accounts
- Task 191 – Sanction Expiration Worker: processes expired temporary sanctions

## Prisma Direction

Expected later mapping:

```prisma
enum UserStatus {
  ACTIVE
  LIMITED
  BANNED
}

model User {
  // ...
  status UserStatus @default(ACTIVE)
  // ...
}
```

Task 060 does not create a Prisma migration.

## Decisions

1. Kurvenfunk initially has exactly three account statuses: `ACTIVE`, `LIMITED`, `BANNED`.
2. User status and authorization roles are stored and evaluated separately.
3. ACTIVE is the default account state.
4. LIMITED preserves read/search/vote functionality while blocking community content creation.
5. BANNED blocks authenticated platform use.
6. BANNED later triggers active Keycloak session revocation.
7. Privileged roles never implicitly override account status.
8. Temporary restriction metadata belongs to sanctions rather than the status enum.
9. Moderation cards, sanctions, audit records and account status remain separate domain concepts.
10. PostgreSQL is authoritative for current user status.
11. API-side centralized enforcement is mandatory.
12. Raw account status is not public profile information.
13. Prisma implementation and migration are deferred to Tasks 081 and 082.
