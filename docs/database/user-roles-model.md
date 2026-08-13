# User Roles Model

## Status

Task: 061 – User Roles Model

Status: Defined

## Purpose

This document defines the authorization role model for Kurvenfunk users.

Roles describe which application capabilities a user may receive.

Roles and account status are separate concepts.

A role answers:

> What is this user generally allowed to do?

Account status answers:

> Is this account currently allowed to exercise those permissions?

Task 060 defines the account status model.

## Roles

Kurvenfunk defines these roles:

- `USER`
- `TRUSTED_USER`
- `MODERATOR`
- `EDITOR`
- `ADMIN`
- `SUPERADMIN`

## Core Model

A user may hold multiple roles simultaneously.

Roles are not a strict hierarchy.

For example, a user may be both `EDITOR` and `MODERATOR` without becoming
`ADMIN`.

Typical assignments:

- normal user: `USER`
- trusted user: `USER`, `TRUSTED_USER`
- moderator: `USER`, `MODERATOR`
- editor: `USER`, `EDITOR`
- editor and moderator: `USER`, `EDITOR`, `MODERATOR`
- administrator: `USER`, `ADMIN`

New normal users receive `USER` by default.

Privileged roles are never assigned automatically.

## USER

`USER` is the standard role for a registered Kurvenfunk user.

It represents normal authenticated platform membership.

Typical capabilities may include:

- manage allowed own profile data
- create comments when account status permits
- reply to comments when account status permits
- react or vote
- participate in ordinary community functionality

`USER` does not grant moderation, editorial or administrative authority.

The exact permission set is defined later in Task 172.

## TRUSTED_USER

`TRUSTED_USER` represents a user who has earned additional community trust.

It is not a moderation role.

Potential capabilities may include:

- creating forum threads where thread creation is restricted
- receiving less restrictive community rate limits
- accessing trusted-community features introduced later

`TRUSTED_USER` must not automatically grant moderation, editorial or
administrative authority.

Trust is independent from account status.

A trusted user may therefore independently have status:

- `ACTIVE`
- `LIMITED`
- `BANNED`

## MODERATOR

`MODERATOR` represents community moderation responsibility.

Typical capabilities may include:

- review reports
- moderate comments
- moderate forum posts
- lock or move threads when authorized
- issue warnings
- create moderation cards
- apply permitted sanctions
- inspect moderation history when authorized

Not every moderation action must automatically be available to every
moderator.

Sensitive actions such as account bans or IP bans may require separate
permissions.

## EDITOR

`EDITOR` represents editorial responsibility.

Typical capabilities may include:

- create articles
- edit articles
- manage article metadata
- manage categories and tags
- manage media
- participate in publication workflows
- publish or schedule content when explicitly permitted

Editorial authority does not imply moderation authority.

A user requiring both responsibilities receives both `EDITOR` and
`MODERATOR`.

## ADMIN

`ADMIN` represents broad platform administration responsibility.

Typical capabilities may include:

- user administration
- editorial administration
- moderation administration
- administrative dashboards
- privileged management operations

`ADMIN` is not an unconditional authorization bypass.

Administrative actions remain subject to explicit permissions, account status,
resource-specific authorization and audit requirements.

## SUPERADMIN

`SUPERADMIN` is the highest application-level administrative role.

It is intended for exceptional technical and full administrative
responsibilities.

Typical capabilities may include:

- highly privileged platform administration
- role and permission administration
- critical application configuration
- emergency administrative operations

`SUPERADMIN` must be assigned very sparingly.

It must not automatically bypass account status restrictions.

## Roles Are Not a Strict Hierarchy

Role names describe responsibility areas.

They must not be implemented as a numeric privilege ladder.

Authorization must not use comparisons such as "role >= MODERATOR".

Likewise, `ADMIN` must not automatically mean every possible permission.

Roles instead map to explicit permissions.

Examples:

- `MODERATOR` may grant `comment.moderate`, `thread.lock` and `user.warn`
- `EDITOR` may grant `article.create`, `article.edit` and `article.publish`
- `ADMIN` may grant selected administrative permissions

The concrete role-to-permission mapping is defined in Task 172.

## Multiple Role Composition

Because users may hold multiple roles, role-derived permissions are combined.

The effective role permission set is the union of permissions granted by all
roles assigned to the user.

For example, a user with `USER`, `EDITOR` and `MODERATOR` may receive both
editorial and moderation permissions.

The resulting permission set remains subject to account status, sanctions,
resource ownership, contextual authorization and security policy.

## Role and Status

Roles and account status are independent authorization dimensions.

Examples:

| Roles | Status | Result |
|---|---|---|
| `USER` | `ACTIVE` | Normal user permissions |
| `USER`, `TRUSTED_USER` | `ACTIVE` | Trusted-user permissions available |
| `USER`, `MODERATOR` | `ACTIVE` | Moderator permissions available |
| `USER`, `MODERATOR` | `LIMITED` | LIMITED restrictions still apply |
| `USER`, `EDITOR` | `BANNED` | Authenticated access blocked |
| `USER`, `ADMIN` | `BANNED` | Authenticated access blocked |
| `USER`, `SUPERADMIN` | `BANNED` | Authenticated access blocked |

A privileged role must never implicitly override account status.

Task 060 defines the exact semantics of `ACTIVE`, `LIMITED` and `BANNED`.

## Roles and Permissions

Roles are inputs into authorization.

They are not themselves the final authorization decision.

The intended authorization flow is:

authenticated identity
-> Kurvenfunk user
-> assigned roles
-> role-derived permissions
-> account status restrictions
-> sanctions and contextual checks
-> authorization decision

Controllers and services must not independently invent role semantics.

For example, code should not check for `ADMIN` when the actual business
requirement is a permission such as `article.publish`, `thread.lock`,
`user.warn` or `user.ban`.

Task 172 introduces the central permission system.

## Permission Baseline

The following matrix describes responsibility areas only.

It does not define the final permission mapping.

| Capability area | USER | TRUSTED_USER | MODERATOR | EDITOR | ADMIN | SUPERADMIN |
|---|---:|---:|---:|---:|---:|---:|
| Normal user functionality | yes | yes | yes | yes | yes | yes |
| Trusted community functionality | no | yes | optional | optional | optional | optional |
| Community moderation | no | no | yes | no | administrative | administrative |
| Editorial management | no | no | no | yes | administrative | administrative |
| Platform administration | no | no | no | no | yes | yes |
| Critical system administration | no | no | no | no | limited | yes |

Terms such as `optional`, `administrative` and `limited` deliberately avoid
granting exact permissions.

Task 172 defines those explicitly.

## Default Role

A newly created normal Kurvenfunk user receives `USER`.

No privileged role is granted automatically during registration or user sync.

Additional roles require an authorized administrative process.

## USER as Baseline Role

Privileged users should normally retain `USER` together with their additional
roles.

Examples include:

- `USER`, `MODERATOR`
- `USER`, `EDITOR`
- `USER`, `EDITOR`, `MODERATOR`
- `USER`, `ADMIN`

This keeps normal platform membership explicit.

The permission system must evaluate the roles actually stored for the user
instead of relying on implicit role inheritance.

## Role Assignment

Role assignment and removal are security-sensitive operations.

They must not be available through ordinary profile editing.

Future role management must require explicit authorization.

Possible permissions include:

- `role.view`
- `role.assign`
- `role.remove`

More sensitive roles may require stronger assignment rules.

Assigning `SUPERADMIN`, for example, should require stricter authorization than
assigning `TRUSTED_USER`.

The concrete policy belongs to the permission and administration systems.

## Self-Assignment

Users must never be able to assign themselves privileged roles.

A normal user cannot promote themselves to `TRUSTED_USER`, `MODERATOR`,
`EDITOR`, `ADMIN` or `SUPERADMIN` through frontend manipulation, direct API
requests or modified client state.

The API is the security boundary.

Frontend hiding or disabling controls is not authorization.

## Role Changes

Role changes must be explicit backend operations.

Granting or removing a role must not silently modify unrelated account data.

Changing roles does not automatically change:

- account status
- sanctions
- moderation cards
- profile data
- fan preference

Likewise, changing account status does not automatically remove roles.

For example, a banned moderator may still have the stored roles `USER` and
`MODERATOR` while their account status is `BANNED`.

This preserves authorization history and supports reversible account-state
changes.

## Audit Requirements

Privileged role changes are security-relevant and must be auditable.

Future audit records should identify at least:

- affected user
- role granted or removed
- actor performing the change
- timestamp
- action type
- optional reason or administrative context

Task 078 defines the concrete audit log model.

## PostgreSQL Source of Truth

Kurvenfunk application roles are application-domain authorization data.

PostgreSQL is the source of truth for assigned Kurvenfunk roles.

Role authorization must not depend on frontend state or Redis as an
authoritative source.

## Keycloak Boundary

Keycloak is responsible for authentication and identity sessions.

Kurvenfunk is responsible for application authorization.

Conceptually:

Keycloak
-> authenticated subject

Kurvenfunk PostgreSQL
-> User
-> roles
-> status
-> permissions

A valid Keycloak token does not prove that the user currently has any
particular Kurvenfunk application role.

Kurvenfunk application roles must not rely on Keycloak role mappings as their
authoritative store.

The API must evaluate the current backend authorization state.

## Stale Authorization Data

Role changes must take effect according to authoritative backend state.

The application must not rely indefinitely on stale frontend state or old
client-side role information.

A user whose privileged role has been removed must not retain the associated
authorization merely because an existing page still displays that role.

Task 172 defines the runtime permission evaluation mechanism.

## Privacy

Raw internal role assignments are not public profile data by default.

Some roles may later receive an intentional public representation, such as a
moderator or editorial badge.

Such presentation must be an explicit product decision.

Public presentation and internal authorization remain separate concepts.

## Invariants

The user role domain must preserve the following invariants:

1. Roles and account status are separate concepts.
2. A user may hold multiple roles simultaneously.
3. Every normal newly created user receives `USER`.
4. Privileged roles are never assigned automatically to normal new users.
5. Roles grant potential permissions but do not override status restrictions.
6. `LIMITED` restrictions still apply to privileged roles unless a later
   explicit policy defines a narrowly scoped exception.
7. `BANNED` blocks authenticated platform access regardless of role.
8. Roles are not implemented as a numeric privilege hierarchy.
9. Authorization checks should target permissions instead of role names.
10. Users cannot self-assign privileged roles.
11. Role assignment and removal are backend-controlled operations.
12. Privileged role changes are audit-relevant.
13. PostgreSQL is authoritative for Kurvenfunk application role assignments.
14. Keycloak authentication roles are not the authoritative source for
    Kurvenfunk application authorization.
15. Account-status changes do not implicitly destroy role assignments.
16. Public role presentation is separate from internal authorization data.

## Related Tasks

- Task 058 – User Model: core Kurvenfunk user entity
- Task 059 – Profile Model: public profile data
- Task 060 – User Status Model: `ACTIVE`, `LIMITED`, `BANNED`
- Task 078 – Audit Log Model: critical role-change auditing
- Task 081 – Prisma Schema: persistence of roles
- Task 094 – User Sync: default `USER` assignment
- Task 172 – Permission System: role-to-permission mapping
- Task 173 – Account Status Guard: status restrictions
- Task 237 – Admin Dashboard: administration entry point
- Task 239 – User Detail: internal role administration view

## Prisma Direction

Task 061 defines domain semantics only.

The complete Prisma implementation belongs to Task 081.

The persistence model must support multiple role assignments per user.

The initial direction is a `UserRole` enum containing:

- `USER`
- `TRUSTED_USER`
- `MODERATOR`
- `EDITOR`
- `ADMIN`
- `SUPERADMIN`

The final Prisma representation may use either an enum collection on the user
or an explicit role-assignment relation.

An explicit assignment model may be preferable if later requirements need
metadata such as:

- who granted the role
- when it was granted
- an optional expiration
- assignment-specific administrative metadata

That persistence decision is intentionally deferred to Task 081.

## Decisions

1. Kurvenfunk defines six application roles: `USER`, `TRUSTED_USER`,
   `MODERATOR`, `EDITOR`, `ADMIN` and `SUPERADMIN`.
2. Users may hold multiple roles simultaneously.
3. `USER` is the default and baseline role.
4. Roles are not modeled as a strict hierarchy.
5. Multiple responsibilities are represented with multiple assigned roles.
6. Role-derived authorization is evaluated through explicit permissions.
7. Task 172 defines the concrete role-to-permission mapping.
8. Account status restrictions apply independently from roles.
9. Privileged roles never implicitly bypass `LIMITED` or `BANNED`.
10. Users cannot self-assign privileged roles.
11. PostgreSQL is the source of truth for Kurvenfunk application roles.
12. Keycloak remains the authentication system, not the authoritative
    application-role store.
13. Role changes are security-sensitive and audit-relevant.
14. Internal role assignments are not public profile data by default.
15. The final Prisma persistence representation is deferred to Task 081.
