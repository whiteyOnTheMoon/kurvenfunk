# Reaction Domain Model

**Project:** Kurvenfunk
**Task:** 072 – Reaction Model
**Status:** Domain model defined
**Target:** `docs/database/reaction-model.md`

## 1. Purpose

The Reaction domain models lightweight user feedback on community content.

For the MVP, Kurvenfunk supports exactly one reaction type:

- `LIKE`

The model must guarantee that a user can react to a supported target at most once, allow a reaction to be removed again, and remain extensible for additional reaction types and target types without redesigning the core domain.

Reaction permissions are evaluated by the application permission system. The persistence model records reactions; it does not encode account-status rules itself.

## 2. Scope

Task 072 defines the domain model only.

Included:

- reaction identity
- reaction type
- reacting user
- reaction target
- uniqueness and integrity rules
- lifecycle semantics
- deletion behavior
- counting semantics
- permission expectations
- extensibility requirements
- indexing requirements
- interaction with moderation and deleted content

Not included yet:

- Prisma implementation
- migrations
- REST endpoints
- controllers
- frontend controls
- caching
- rate limiting
- reaction notifications
- analytics pipelines

Those are implemented in later tasks.

## 3. Product Rules

The master project plan defines these MVP rules:

- MVP reaction: `LIKE`
- `ACTIVE` users may react.
- `LIMITED` users may react.
- `BANNED` users may not react.
- Reactions are part of article discussions/community voting.

The relevant permission should be expressed centrally, for example:

`comment.vote`

The permission layer must combine role/permission checks with account status. Reaction code must not independently invent alternative `ACTIVE` / `LIMITED` / `BANNED` behavior.

## 4. Core Entity

### 4.1 Reaction

A `Reaction` represents one user's reaction to one supported content target.

Recommended conceptual fields:

| Field | Meaning |
| --- | --- |
| `id` | Stable internal reaction identifier |
| `userId` | User who created the reaction |
| `type` | Reaction type, MVP: `LIKE` |
| `targetType` | Domain type of the reacted-to content |
| `targetId` | Identifier of the reacted-to content |
| `createdAt` | Time the reaction was created |
| `updatedAt` | Time the reaction was last changed |

Conceptually:

```text
Reaction
├── id
├── userId
├── type
├── targetType
├── targetId
├── createdAt
└── updatedAt
```

## 5. Reaction Type

### 5.1 Enum

Define a domain enum:

```text
ReactionType
└── LIKE
```

Only `LIKE` is enabled for the MVP.

The enum is intentionally explicit instead of representing a like as a boolean. This allows the model to evolve later without replacing the entity.

Potential future reaction types must not be enabled merely because the schema can represent them. Adding another type is a product decision requiring its own behavior, UI, moderation, ranking, and migration review.

Examples that could be evaluated later:

```text
DISLIKE
LOVE
FUNNY
INSIGHTFUL
```

They are not part of Task 072.

## 6. Reaction Targets

### 6.1 MVP target

The immediate community use case is reacting to comments.

Therefore the MVP must support:

```text
COMMENT
```

as a reaction target.

### 6.2 Extensibility

Forum functionality follows later in the project plan. Reactions should therefore be designed so that additional target types can be introduced without creating unrelated reaction systems.

Conceptual enum:

```text
ReactionTargetType
├── COMMENT
└── future target types
```

Potential future targets include:

```text
POST
ARTICLE
```

They are not automatically enabled by this model.

### 6.3 Target reference

A generic domain reference can be expressed as:

```text
targetType
targetId
```

This avoids creating a separate reaction table for every future reactable entity.

However, generic references cannot normally be protected by a conventional database foreign key to multiple target tables. Task 081 must therefore choose the concrete Prisma/PostgreSQL representation carefully.

The domain requirement is:

> A Reaction must always refer to an existing supported target when it is created.

Application/database-layer validation must enforce this invariant.

## 7. Alternative Relational Representation

When Task 081 maps this model to Prisma, a relational alternative may be preferable for stronger database integrity.

For the MVP, that could mean a nullable concrete relation such as:

```text
commentId
```

and later additional target relations such as:

```text
postId
```

with a constraint that exactly one target is populated.

The final Prisma representation should optimize for:

1. referential integrity,
2. simple queries,
3. uniqueness guarantees,
4. future forum integration,
5. maintainability.

Task 072 does not require prematurely selecting a polymorphic database technique. It defines the domain contract that the later Prisma schema must satisfy.

## 8. User Relation

Every reaction belongs to exactly one Kurvenfunk user.

Conceptually:

```text
User 1 ─── * Reaction
```

Requirements:

- anonymous reactions are not supported;
- the reacting user must exist;
- the user is identified by Kurvenfunk's internal `User.id`;
- Keycloak subject identifiers must not be copied into every reaction;
- authorization uses the current authenticated user, not a client-provided arbitrary `userId`.

## 9. Target Relation

For the MVP:

```text
Comment 1 ─── * Reaction
```

A comment can have zero or many reactions.

A reaction belongs to exactly one target.

A user may react to many different comments.

## 10. Uniqueness

The central invariant is:

> One user may have at most one reaction of a given type on a given target.

Conceptually:

```text
UNIQUE(userId, targetType, targetId, type)
```

For a concrete MVP `commentId` representation:

```text
UNIQUE(userId, commentId, type)
```

Because the MVP contains only `LIKE`, this effectively means:

> A user can like a comment at most once.

The uniqueness rule must be enforced at database level in Task 081, not only by an API pre-check.

This protects against:

- double clicks,
- concurrent requests,
- retries,
- multiple browser tabs,
- race conditions.

## 11. Toggle Semantics

The user-facing LIKE interaction behaves as a toggle.

### No existing LIKE

```text
LIKE action
→ create Reaction
```

### Existing LIKE

```text
LIKE action
→ remove Reaction
```

The API implementation may expose explicit create/delete operations or a toggle endpoint. That is an API design decision for later tasks.

The domain result remains the same: the presence of a Reaction represents the active LIKE.

## 12. No Soft Delete for Normal Reaction Removal

Normal reaction removal should physically delete the reaction row.

A removed LIKE has no current domain meaning and does not need the same restoration semantics as community content.

Therefore Task 072 does not require:

```text
deletedAt
```

on `Reaction`.

If Kurvenfunk later requires historical reaction analytics or abuse evidence, that should be handled through an appropriate event/audit/analytics mechanism rather than turning every ordinary reaction toggle into soft-deleted business data.

## 13. Timestamps

### `createdAt`

Required.

Represents when the active reaction was created.

### `updatedAt`

Recommended for consistency and future extensibility.

With only `LIKE`, it will rarely change because unliking removes the row. It becomes useful if future reaction types can be changed in place.

No reaction-specific edit history is required.

## 14. Account Status Rules

Reaction permission follows the project's core status rules.

| Account status | Read | React / Vote |
| --- | ---: | ---: |
| `ACTIVE` | Yes | Yes |
| `LIMITED` | Yes | Yes |
| `BANNED` | No authenticated community access | No |

Important:

`LIMITED` explicitly retains voting/reaction rights.

This differs from content creation:

```text
LIMITED
├── comment.create  ✗
├── comment.reply   ✗
├── thread.create   ✗
├── post.create     ✗
└── comment.vote    ✓
```

The Reaction model must not treat `LIMITED` as equivalent to `BANNED`.

## 15. Role vs. Status

Reaction authorization must respect the project's rule:

```text
ROLE != STATUS
```

A role describes capabilities.

An account status constrains whether those capabilities can currently be exercised.

For normal reactions, ordinary authenticated users do not require a privileged role.

Example:

```text
USER + ACTIVE
→ may LIKE

USER + LIMITED
→ may LIKE

MODERATOR + LIMITED
→ may LIKE

ADMIN + BANNED
→ may not LIKE
```

A privileged role must not bypass a `BANNED` account status merely because it normally has broader permissions.

## 16. Permission Model

The reaction feature should use the central permission system introduced later rather than checking role names in reaction controllers.

Recommended permission:

```text
comment.vote
```

For future generic reaction targets, permissions can remain target-aware rather than creating one unrestricted global reaction permission.

Examples:

```text
comment.vote
post.vote
```

The exact permission naming can be finalized in Task 172.

## 17. Deleted Comments

The Comment model supports soft deletion.

A soft-deleted comment may remain structurally present because replies can depend on it.

Reaction behavior should be:

- existing reactions may remain stored;
- deleted comments should not expose an interactive LIKE control;
- new reactions to deleted comments are rejected;
- reaction counts on a deleted placeholder do not need to be displayed publicly;
- restoring a comment does not require rebuilding its existing reactions.

This preserves historical integrity without allowing interaction with unavailable content.

## 18. Moderated Comments

When moderation hides or removes a comment, the same principle applies:

```text
not interactable
→ no new Reaction
```

Existing reactions do not need to be individually deleted as part of the moderation action.

This keeps moderation of content separate from reaction storage.

If the content is permanently hard-deleted under a future retention process, related reactions must also be removed safely.

## 19. User Deletion

Account deletion and anonymization are defined later in the privacy tasks.

Reaction data does not need to survive as authored community content in the same way comments may.

Recommended behavior when a user is permanently deleted:

```text
User hard deletion
→ delete user's reactions
```

This can be implemented with relational cascade behavior if compatible with the final User deletion strategy.

If Kurvenfunk instead keeps an anonymized User record, reaction retention can follow that account-lifecycle design.

Task 251 makes the final privacy decision.

## 20. Target Hard Deletion

If a reaction target is permanently hard-deleted, its reactions must not become orphaned.

Required invariant:

```text
hard-delete target
→ delete associated Reactions
```

For concrete foreign-key relations, database cascading is preferred where safe.

For a generic polymorphic target reference, the application/database layer must explicitly guarantee cleanup.

No orphaned reaction records are allowed.

## 21. Reaction Counts

A displayed like count is derived data.

Canonical value:

```text
COUNT(active Reaction WHERE target = X AND type = LIKE)
```

The Reaction rows in PostgreSQL are the source of truth.

Do not require a mutable `likeCount` column on `Reaction`.

A target entity may later receive a denormalized counter for performance, but such a counter must be reconstructable from Reaction records.

This follows the project rule:

> PostgreSQL is the source of truth.

## 22. User Reaction State

For rendering a comment, the application commonly needs both:

```text
likeCount
viewerHasLiked
```

`viewerHasLiked` is derived by checking whether a matching Reaction exists for the authenticated user.

Conceptually:

```text
EXISTS Reaction
WHERE
  userId = viewer.id
  AND target = comment
  AND type = LIKE
```

For guests:

```text
viewerHasLiked = false
```

Guests can see public counts but cannot create reactions.

## 23. Sorting by Popularity

Task 168 requires comment sorting by:

- newest,
- oldest,
- popular.

Reaction data can contribute to `popular`.

Task 072 does not define the final popularity algorithm.

A simple future implementation could use LIKE count, but ranking may later incorporate age, replies, moderation state, or other signals.

Therefore:

> Reaction storage must provide reliable counts, but Reaction does not define popularity itself.

## 24. Concurrency

Reaction creation must be safe under concurrent requests.

Example:

```text
Request A → LIKE
Request B → LIKE
```

Both may observe no existing reaction before insertion.

The database uniqueness constraint is the final integrity boundary.

The application must handle a uniqueness conflict deterministically rather than producing duplicate reactions.

Likewise, repeated DELETE/unlike operations should be safely handled.

## 25. Idempotency Expectations

From the user's perspective, reaction state should be stable under retries.

Desired state-oriented behavior:

```text
LIKE requested repeatedly
→ one active LIKE

UNLIKE requested repeatedly
→ no active LIKE
```

Even if the later API uses toggle semantics, internal service operations should preferably expose explicit desired-state operations where useful:

```text
addLike(...)
removeLike(...)
```

This reduces ambiguity for retries and distributed clients.

## 26. Rate Limiting

Reaction rate limits are explicitly planned later under security.

The Reaction domain should assume that rapid voting can be abused.

Potential protections include:

- per-user rate limits,
- per-IP rate limits,
- burst limits,
- suspicious behavior monitoring.

These controls do not belong as fields on the Reaction entity.

## 27. Moderation and Abuse

Ordinary reactions are not moderation actions.

Creating or removing a LIKE does not require an AuditLog entry.

However, abnormal reaction behavior may later contribute to abuse detection.

Examples:

- automated mass liking,
- coordinated manipulation,
- extreme request frequency.

Such detection belongs to security/moderation systems rather than changing the semantic meaning of `Reaction`.

## 28. Audit Logging

No audit record is required for ordinary:

```text
LIKE
UNLIKE
```

Administrative manipulation of reaction data, if such functionality is introduced later, should be audit logged.

Example:

```text
admin removes fraudulent reactions
→ AuditLog
```

## 29. Notifications

Task 072 does not require notifications for likes.

The current notification plan includes comment replies and moderation/system events but does not define reaction notifications.

Therefore LIKE creation must not implicitly require a notification model dependency.

Reaction notifications can be introduced later as a separate product decision.

## 30. Privacy

A reaction links a user to an interaction and is therefore user-associated application data.

Principles:

- store only the internal `userId`;
- do not store IP addresses on Reaction;
- do not duplicate nickname/profile information;
- do not copy authentication tokens or Keycloak claims;
- do not store user-agent data on Reaction;
- use separate security systems for rate limiting and abuse prevention.

This keeps the entity minimal.

## 31. Data Ownership

Reaction is community-domain data.

Conceptually:

```text
User
  ↓
Reaction
  ↓
Comment
```

The Reaction domain depends on User identity and a reactable target but does not own either entity.

It owns only the relationship expressing:

```text
User X likes Target Y
```

## 32. Suggested Indexes

The final Prisma/PostgreSQL schema should support efficient:

- target reaction counts,
- viewer reaction checks,
- user reaction lookup,
- uniqueness enforcement.

For a generic representation, useful indexes include:

```text
UNIQUE (userId, targetType, targetId, type)

INDEX (targetType, targetId, type)

INDEX (userId, createdAt)
```

For a concrete comment relation:

```text
UNIQUE (userId, commentId, type)

INDEX (commentId, type)

INDEX (userId, createdAt)
```

Exact index names are deferred to Task 081.

## 33. Cardinality

MVP conceptual relationships:

```text
User
  1
  │
  │ creates
  *
Reaction
  *
  │
  │ belongs to
  1
Comment
```

A user can create many reactions.

A comment can receive many reactions.

Each individual Reaction has exactly one user and one target.

The uniqueness rule prevents the same user from creating duplicate LIKE reactions for the same target.

## 34. Domain Invariants

The following invariants must hold:

1. Every Reaction has a valid user.
2. Every Reaction has a valid supported target.
3. Every Reaction has a valid `ReactionType`.
4. MVP accepts only `LIKE`.
5. A user cannot create duplicate reactions of the same type on the same target.
6. Anonymous users cannot create reactions.
7. `ACTIVE` users may react.
8. `LIMITED` users may react.
9. `BANNED` users may not react.
10. Deleted or non-interactable targets cannot receive new reactions.
11. Hard-deleted targets must not leave orphaned reactions.
12. Normal unlike removes the active Reaction.
13. Reaction counts are derived from Reaction data.
14. PostgreSQL remains the source of truth.
15. Authorization must not trust a client-provided user identity.

## 35. Validation Rules

At reaction creation, the service must eventually validate:

```text
authenticated user exists
AND user may vote
AND reaction type is supported
AND target type is supported
AND target exists
AND target is interactable
AND no equivalent reaction already exists
```

At reaction removal:

```text
authenticated user exists
AND target/reaction identity is valid
AND reaction belongs to authenticated user
```

A user must never be able to remove another user's reaction through manipulated identifiers.

## 36. API-Oriented Domain Operations

Task 072 does not define routes, but the domain naturally exposes operations similar to:

```text
addReaction(user, target, type)
removeReaction(user, target, type)
getReactionSummary(target, viewer?)
```

For the MVP these can specialize to:

```text
addLike(user, comment)
removeLike(user, comment)
getCommentReactionSummary(comment, viewer?)
```

This keeps HTTP concerns outside the domain model.

## 37. Reaction Summary

A useful read model for the MVP is:

```text
ReactionSummary
├── likeCount
└── viewerHasLiked
```

Example:

```text
likeCount: 42
viewerHasLiked: true
```

This is not necessarily a persisted database entity.

It is a query/read-model shape derived from Reaction records.

## 38. Future Forum Integration

Task 073 introduces:

- ForumCategory
- Forum
- Thread
- Post
- ThreadSubscription
- ThreadReadState

The Reaction model should not define these entities ahead of Task 073.

It should only ensure that reaction targeting can later accommodate forum posts without creating an incompatible second voting system.

Desired future relationship:

```text
User
  ↓
Reaction
  ├── Comment
  └── Post
```

Whether this is implemented through generic targets or explicit relational columns is decided during Prisma modeling.

## 39. Future Reaction Types

If Kurvenfunk later adds more than LIKE, several product questions must be answered first:

- Can a user select only one reaction per target or several?
- Does changing type update an existing row or replace it?
- Are all reaction types positive?
- How are totals displayed?
- Which types influence popularity?
- Do LIMITED users retain all reaction types?
- Are reaction types available on every target?
- Are notifications generated?

Therefore the current uniqueness invariant deliberately includes `type`, while the MVP application exposes only `LIKE`.

If future product rules require exactly one reaction regardless of type, the uniqueness constraint may need to become:

```text
UNIQUE(userId, targetType, targetId)
```

That decision is intentionally deferred.

## 40. Error Cases

Later service/API implementation should distinguish at least:

```text
UNAUTHENTICATED
REACTION_NOT_ALLOWED
TARGET_NOT_FOUND
TARGET_NOT_INTERACTABLE
REACTION_TYPE_NOT_SUPPORTED
REACTION_ALREADY_EXISTS
REACTION_NOT_FOUND
```

A `BANNED` user must be rejected by centralized status/permission handling.

A `LIMITED` user must not receive `REACTION_NOT_ALLOWED` merely because the account is LIMITED.

## 41. Security Boundaries

Never trust the client for:

```text
userId
reaction ownership
account status
permission result
target existence
reaction count
viewerHasLiked
```

All must be derived or validated server-side.

The client may request:

```text
target
reaction type
desired action
```

The authenticated identity comes from the validated server-side authentication context.

## 42. Source of Truth and Caching

PostgreSQL Reaction records are authoritative.

Redis may later cache:

- reaction counts,
- viewer state where appropriate,
- popularity-related data.

Any cache must be disposable and reconstructable.

Meilisearch is not the source of truth for reactions.

## 43. MVP Recommendation

For Kurvenfunk's MVP, keep the behavior deliberately simple:

```text
ReactionType = LIKE

User clicks Like
→ create Reaction

User clicks active Like
→ delete Reaction

ACTIVE
→ allowed

LIMITED
→ allowed

BANNED
→ denied
```

Do not add dislikes, emoji reactions, reaction history, anonymous voting, notification fan-out, or complex scoring during Task 072.

## 44. Prisma Mapping Requirements for Task 081

When the full Prisma schema is created, the Reaction mapping must provide:

- primary key;
- relation to User;
- relation/reference to supported target;
- `ReactionType`;
- creation timestamp;
- optional/update timestamp according to final convention;
- database-level uniqueness;
- efficient count index;
- safe hard-delete behavior;
- no orphaned reactions.

Task 081 must reconcile Reaction with the final Comment and Forum/Post representations.

## 45. Acceptance Criteria

Task 072 is complete when the domain model clearly defines:

- [x] Reaction entity
- [x] MVP `LIKE`
- [x] reacting User relation
- [x] Comment as MVP reaction target
- [x] future target extensibility
- [x] uniqueness semantics
- [x] LIKE/unlike lifecycle
- [x] no normal soft-delete requirement
- [x] reaction counting semantics
- [x] `ACTIVE` permission behavior
- [x] `LIMITED` permission behavior
- [x] `BANNED` permission behavior
- [x] deleted/moderated target behavior
- [x] user/target hard-delete behavior
- [x] concurrency requirements
- [x] index requirements
- [x] privacy boundaries
- [x] moderation/audit boundaries
- [x] future forum compatibility
- [x] Prisma mapping requirements

## 46. Result

The Reaction domain is defined around one minimal fact:

```text
a user has an active LIKE on a supported target
```

For the MVP, that target is a comment.

The model preserves the project's important moderation rule that `LIMITED` users may continue voting while `BANNED` users may not.

The domain is intentionally small, database-safe, and extensible enough for the later forum system without introducing unnecessary MVP complexity.

The concrete Prisma representation, migration, services, endpoints, permission guards, rate limits, frontend controls, and tests are implemented in their respective later tasks.
