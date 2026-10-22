# Notification Domain Model

**Project:** Kurvenfunk
**Task:** 079 – Notification Model
**Status:** Domain model defined
**Target:** `docs/database/notification-model.md`

## 1. Purpose

Kurvenfunk stores user-facing notifications as a dedicated domain.

Notifications inform users about relevant platform events such as:

- replies to their comments
- activity in subscribed forum threads
- moderation cards
- sanctions and account restrictions
- appeals
- important system messages

Notifications are separate from:

- source domain state
- audit logs
- queue jobs
- email delivery records
- application logs

A notification represents the user-facing message and its in-app state.

Conceptually:

```text
domain event
    |
    +--> source entity state
    |
    +--> AuditLog when required
    |
    +--> Notification
            |
            +--> in-app state
            +--> optional delivery work
                    |
                    +--> notifications queue
                    +--> worker
                    +--> email where policy allows
```

The source operation must not depend on successful synchronous notification delivery.

---

## 2. Scope of Task 079

Task 079 defines the persistence model and domain semantics for notifications.

It defines:

- the `Notification` entity
- notification types
- recipient ownership
- read / unread state
- safe user-visible payload metadata
- source references
- deduplication support
- expiration support
- delivery policy metadata
- notification preferences
- mandatory moderation/security notifications
- asynchronous processing boundaries
- retention and deletion semantics

Task 079 does not yet implement:

- NestJS notification endpoints
- worker processors
- email provider integration
- frontend notification center
- real-time WebSocket delivery
- push notifications
- complete Prisma schema and migrations

Those follow in later tasks.

---

## 3. Core Principles

### 3.1 Notification is user-facing state

A `Notification` exists for one recipient.

It stores what that recipient should see and whether they have read it.

### 3.2 Source entities remain source of truth

A notification does not replace the source entity.

Examples:

```text
ModerationCard
-> is the moderation record

Notification
-> tells the affected user about it
```

```text
Sanction
-> is the enforceable restriction

Notification
-> communicates the restriction
```

### 3.3 Audit and notification are separate

Audit records are internal historical records.

Notifications are user-facing messages.

One action may create both.

```text
yellow card
    |
    +--> ModerationCard
    +--> AuditLog
    +--> Notification
```

Notification delivery state must never be stored in `AuditLog`.

### 3.4 Notification delivery must be asynchronous where appropriate

Creating a comment, forum post, moderation card, sanction or other source entity must not wait for email delivery.

Preferred flow:

```text
commit source operation
    ↓
create or enqueue notification work
    ↓
worker processes delivery
```

### 3.5 PostgreSQL remains source of truth

Persisted notification state belongs in PostgreSQL.

Redis/BullMQ may transport notification jobs but must not become the only record of a notification.

---

## 4. Main Entity

The primary entity is:

```text
Notification
```

Recommended conceptual fields:

```text
Notification

id
userId
type
title
body
url
sourceType
sourceId
actorUserId
metadata
readAt
createdAt
updatedAt
expiresAt
```

Additional optional operational fields may be added during Task 081 if required by the final Prisma design.

---

## 5. Recipient

Every notification belongs to exactly one Kurvenfunk user.

```text
Notification.userId
-> User.id
```

The recipient is the user who sees the notification.

Examples:

```text
comment reply
-> original comment author
```

```text
thread reply
-> subscribed user
```

```text
yellow card
-> sanctioned user
```

```text
account ban
-> affected account
```

A notification without a recipient is not valid as a normal persisted user notification.

Broadcast system messages should fan out into per-user notifications or use a separate broadcast mechanism later.

---

## 6. Notification Type

Kurvenfunk should use an explicit enum for notification types.

Initial required types:

```text
COMMENT_REPLY
THREAD_REPLY
YELLOW_CARD
BLUE_CARD
RED_CARD
LIMITED
BAN
APPEAL
SYSTEM
```

These correspond to the project plan and follow-up requirements already established by earlier domain tasks.

### 6.1 COMMENT_REPLY

Used when another user replies to one of the recipient's comments.

### 6.2 THREAD_REPLY

Used for relevant activity in a subscribed forum thread.

The exact triggering policy may later distinguish direct replies from general subscription activity.

### 6.3 YELLOW_CARD

Used when the recipient receives a yellow moderation card.

### 6.4 BLUE_CARD

Used when the recipient receives a blue moderation card.

This type is required because the ModerationCard model explicitly introduced blue-card compatibility.

### 6.5 RED_CARD

Used when the recipient receives a red moderation card, whether manually or through automatic escalation.

### 6.6 LIMITED

Used when the recipient receives an effective LIMITED restriction.

### 6.7 BAN

Used when the recipient is banned or receives an account-ban sanction.

### 6.8 APPEAL

Used for user-visible appeal lifecycle messages where appropriate.

Exact appeal subtypes may later be introduced if Task 189 requires more granularity.

### 6.9 SYSTEM

Used for important platform messages that do not belong to a narrower type.

`SYSTEM` must not become a generic dumping ground for all notification behavior.

---

## 7. Future Notification Types

The enum may later be extended for product requirements such as:

```text
MENTION
THREAD_SUBSCRIPTION
APPEAL_RESOLVED
COMMENT_BLOCK
FORUM_BLOCK
ACCOUNT_UNBANNED
SECURITY_ALERT
```

Do not add speculative types before the product requires them.

The MVP should remain small and explicit.

---

## 8. Title and Body

Notifications should store user-visible text or stable user-visible rendering data.

Recommended fields:

```text
title
body
```

These values must contain only information safe for the recipient.

Internal moderation notes must never be copied automatically into notifications.

For moderation cards, only user-visible moderation information may be used.

---

## 9. Rendering Strategy

Two common strategies exist:

1. store fully rendered text
2. store a template key plus structured variables

For Kurvenfunk, the domain model should permit either implementation without coupling source entities to a frontend renderer.

A practical initial design can store:

```text
type

title
body

metadata
```

`type` provides stable semantics.

`title` and `body` provide immediate displayability.

`metadata` may contain safe structured values for links or future rendering support.

Task 081 decides the final Prisma representation.

---

## 10. Metadata

Notifications may need small structured metadata.

Examples:

```json
{
  "threadId": "...",
  "postId": "..."
}
```

or:

```json
{
  "moderationCardId": "..."
}
```

or:

```json
{
  "sanctionId": "...",
  "expiresAt": "..."
}
```

Metadata must be:

- minimal
- user-safe
- non-secret
- free of internal moderator notes
- free of raw IP addresses
- free of tokens or credentials

Do not duplicate entire source entities into notification metadata.

---

## 11. Source Reference

A notification should be able to identify the source domain object that caused it.

Possible conceptual fields:

```text
sourceType
sourceId
```

Examples:

```text
sourceType = COMMENT
sourceId = <comment id>
```

```text
sourceType = POST
sourceId = <post id>
```

```text
sourceType = MODERATION_CARD
sourceId = <card id>
```

```text
sourceType = SANCTION
sourceId = <sanction id>
```

The exact source-reference strategy should align with the safe content-reference strategy selected in Task 081.

---

## 12. Source Type

A conceptual enum may include:

```text
COMMENT
POST
THREAD
MODERATION_CARD
SANCTION
APPEAL
SYSTEM
```

The final enum should include only source categories actually required by persisted notifications.

A notification does not need a source reference when none exists, for example some system notifications.

---

## 13. Actor User

Some notifications may have a user actor.

Examples:

```text
User B replies to User A
-> recipient = User A
-> actorUserId = User B
```

Actor relation should therefore be optional:

```text
actorUserId nullable
```

System-generated moderation or automated platform notifications may have no user actor.

Do not overload `actorUserId` with moderator identity when that identity should not be exposed to the recipient.

---

## 14. URL / Navigation Target

Notifications should support a safe navigation target.

Recommended field:

```text
url
```

Examples:

```text
/articles/<slug>#comment-<id>
```

```text
/forum/thread/<slug>#post-<id>
```

```text
/settings/moderation
```

or another appropriate user-facing moderation page.

The URL must be an internal Kurvenfunk navigation target or otherwise validated before use.

Do not allow arbitrary untrusted external URLs in notification records.

---

## 15. Read / Unread State

The model must support read and unread notifications.

Recommended field:

```text
readAt nullable
```

Semantics:

```text
readAt = NULL
-> unread

readAt != NULL
-> read
```

A separate mutable boolean is unnecessary if `readAt` is authoritative.

`readAt` also records when the notification was acknowledged.

---

## 16. Marking as Read

Marking a notification as read should:

```text
verify recipient owns notification
    ↓
set readAt if currently NULL
```

The operation should be idempotent.

Repeated requests must not create new domain side effects.

---

## 17. Marking as Unread

The project plan requires read/unread support but does not explicitly require that users can revert notifications to unread.

Task 079 should keep the data model compatible with this by allowing:

```text
readAt = NULL
```

Whether the API exposes "mark unread" is a later product decision.

---

## 18. Notification Preferences

Kurvenfunk later allows users to configure notification behavior per type.

The project plan requires choices such as:

```text
In App
E-Mail
Aus
```

The model should therefore define a separate preference entity instead of placing preference fields on every notification.

Recommended entity:

```text
NotificationPreference
```

Conceptual fields:

```text
id
userId
type
inAppEnabled
emailEnabled
createdAt
updatedAt
```

Unique constraint conceptually:

```text
(userId, type)
```

---

## 19. Preference Defaults

A missing preference record should resolve to platform defaults.

Do not require pre-creating one row for every user and every notification type.

Conceptually:

```text
no explicit preference
-> use default policy for notification type
```

This reduces unnecessary data and makes introduction of new notification types easier.

---

## 20. Mandatory Notifications

Security and moderation notifications must not be fully suppressible by ordinary user preferences.

At minimum, this applies to important moderation/security types such as:

```text
YELLOW_CARD
BLUE_CARD
RED_CARD
LIMITED
BAN
```

Potentially also certain:

```text
SYSTEM
SECURITY_ALERT
```

messages depending on future requirements.

A user may later be allowed to disable optional email delivery for some mandatory messages only if legal/product requirements permit it, but the platform must retain a mandatory user-visible delivery path where required.

For MVP design:

```text
mandatory moderation/security notification
-> in-app notification cannot be disabled
```

Ban handling additionally requires an external communication strategy because the user may no longer be able to access authenticated pages.

---

## 21. Ban Notification Special Case

A banned user may lose normal authenticated access immediately.

Therefore:

```text
ACCOUNT_BAN
-> persist Notification
-> revoke sessions / enforce ban
-> email delivery may still be required by policy
```

The persisted notification remains useful for history and future account-state views, but it must not be the only communication channel assumed for bans.

Exact email requirements are defined in later notification implementation and moderation policy tasks.

---

## 22. Notification Channel Policy

Task 079 distinguishes notification persistence from delivery channels.

Channels may include:

```text
IN_APP
EMAIL
```

Push notifications may be added later.

The source domain should not decide delivery infrastructure directly.

Instead:

```text
domain event
-> notification policy
-> persisted Notification
-> delivery jobs according to preferences and mandatory rules
```

---

## 23. In-App Notifications

In-app notifications are represented by persisted `Notification` records.

The notification center can query:

```text
Notification
WHERE userId = currentUser
ORDER BY createdAt DESC
```

Unread count can query:

```text
userId = currentUser
AND readAt IS NULL
```

Appropriate indexes are required later.

---

## 24. Email Notifications

Email delivery is asynchronous.

Conceptual flow:

```text
Notification created
    ↓
policy says EMAIL
    ↓
notifications queue
    ↓
worker
    ↓
mail provider
```

Email sending failure must not roll back the source domain operation.

Retries belong to the queue/worker delivery implementation.

---

## 25. Email Delivery State

The core `Notification` entity should not become a full email delivery ledger.

If delivery tracking becomes necessary later, introduce a dedicated entity such as:

```text
NotificationDelivery
```

rather than adding many transport-specific fields directly to `Notification`.

Possible future fields:

```text
notificationId
channel
status
attemptCount
lastAttemptAt
deliveredAt
failureCode
```

This is not required for Task 079 MVP persistence.

---

## 26. Queue Boundary

The notifications queue already exists in the shared queue infrastructure.

Queue name:

```text
notifications
```

Queue jobs are transport/work records.

They are not the notification source of truth.

A failed or deleted BullMQ job must not erase persisted notification history.

---

## 27. Comment Reply Notifications

The Comment model established that replies may trigger:

```text
COMMENT_REPLY
```

Expected logic:

```text
User B replies to comment from User A
    ↓
if User A != User B
    ↓
apply notification policy
    ↓
create Notification for User A
    ↓
optional email job
```

The reply operation must succeed even if notification delivery later fails.

---

## 28. Self-Notification Exclusion

Users should normally not receive notifications for their own actions.

Examples:

```text
reply to own comment
-> no COMMENT_REPLY notification
```

```text
post in subscribed thread
-> normally no THREAD_REPLY notification to author for that same post
```

Exceptions must be explicitly defined by future product requirements.

---

## 29. Forum Thread Notifications

`ThreadSubscription` provides the forum-domain relation used to determine recipients.

Conceptual flow:

```text
new Post
    ↓
find ThreadSubscription records
    ↓
exclude author where appropriate
    ↓
apply notification preferences
    ↓
create THREAD_REPLY notifications
    ↓
enqueue optional delivery
```

The Notification domain owns duplicate suppression and aggregation policy where required.

---

## 30. Duplicate Suppression

Notification fan-out can produce duplicates through retries or repeated processing.

The model should support idempotent creation.

Recommended conceptual field:

```text
dedupeKey nullable
```

Example:

```text
comment-reply:<replyCommentId>:<recipientUserId>
```

or:

```text
moderation-card:<cardId>:<recipientUserId>
```

A unique constraint on a non-null dedupe key may be used in the final schema if compatible with Prisma/PostgreSQL design.

Exact implementation belongs to Task 081.

---

## 31. Idempotency

Notification generation must tolerate retries.

Example:

```text
worker crashes after Notification insert
    ↓
job retries
    ↓
same logical notification must not be duplicated
```

This is especially important for moderation and sanction notifications.

---

## 32. Aggregation

High-volume forum activity may later be aggregated.

Example future behavior:

```text
5 new posts in subscribed thread
-> one aggregated notification
```

Task 079 should not require aggregation for MVP.

The model should avoid assumptions that make later aggregation impossible.

---

## 33. Moderation Card Notifications

Moderation card issuance should create a notification for the affected user.

Required mappings:

```text
ModerationCard.YELLOW
-> YELLOW_CARD

ModerationCard.BLUE
-> BLUE_CARD

ModerationCard.RED
-> RED_CARD
```

Automatic red escalation and manual red-card issuance both produce `RED_CARD` notification semantics.

Internal moderator notes must never be copied automatically into notification content.

---

## 34. Card Revocation and Expiration

The existing ModerationCard model requires notifications for issuance and defines audit events for revocation/expiration.

Task 079 does not automatically require a separate notification type for every lifecycle event.

If product requirements later require user-visible revocation/expiration messages, additional notification types may be added.

Do not overload `SYSTEM` without an explicit product decision.

---

## 35. Sanction Notifications

Relevant sanctions may create notifications.

Current anticipated mappings include:

```text
LIMITED
-> LIMITED

ACCOUNT_BAN
-> BAN
```

Granular sanctions such as:

```text
COMMENT_BLOCK
FORUM_BLOCK
```

may later receive dedicated notification types if product requirements require them.

For now they may be communicated through an appropriate moderation notification policy without prematurely expanding the enum.

---

## 36. Sanction Independence

Sanction persistence and enforcement must remain independent of notification success.

Correct order conceptually:

```text
create/enforce sanction
    ↓
commit
    ↓
create notification / enqueue delivery
```

Incorrect design:

```text
email fails
-> rollback sanction
```

Enforcement must never depend on successful communication delivery.

---

## 37. IP Block Notifications

Creating an `IPBlock` does not automatically require a notification.

Many IP blocks are protective or infrastructure-level actions without a direct user-recipient relationship.

If an IP block is connected to a formal user sanction, the sanction may generate the user notification.

`IPBlock` itself must not own notification state.

---

## 38. Audit Log Boundary

Notification and audit state must remain separate.

Examples:

```text
moderator gives yellow card
    |
    +--> ModerationCard
    +--> AuditLog
    +--> Notification
```

```text
admin changes notification preference
    |
    +--> NotificationPreference
    +--> AuditLog when policy requires
```

`AuditLog` must not store read state, email delivery state or user notification content as mutable notification state.

---

## 39. System Notifications

`SYSTEM` is reserved for important Kurvenfunk platform messages.

Examples may include:

- account-relevant service messages
- platform policy changes requiring user attention
- operational notices relevant to the specific user

Routine background operations must not create system notifications.

Examples that should not create `SYSTEM` notifications:

```text
search reindex completed
backup completed
provider import completed
queue retry occurred
```

Those belong to operational monitoring or admin tooling.

---

## 40. Appeals

Appeal workflows may create user notifications.

Initial type:

```text
APPEAL
```

This can cover initial MVP communication for appeal state changes.

If Task 189 later needs distinct semantics, the enum may evolve into types such as:

```text
APPEAL_RECEIVED
APPEAL_ACCEPTED
APPEAL_REJECTED
```

Do not predefine them unless required.

---

## 41. Notification Lifecycle

Basic lifecycle:

```text
created
    ↓
unread
    ↓
read
    ↓
retained until cleanup/retention policy
```

Optional expiration:

```text
created
    ↓
expiresAt reached
    ↓
hidden/removed according to cleanup policy
```

Moderation/security notifications may require longer retention than ordinary community notifications.

---

## 42. Expiration

Recommended optional field:

```text
expiresAt nullable
```

Most important moderation notifications should normally not expire quickly.

Possible low-value system/community notifications may later use expiration.

Expiration is different from read state.

```text
read
!=
expired
```

---

## 43. Deletion

User-facing deletion behavior should be conservative.

Users may later be allowed to dismiss or hide notifications, but that does not necessarily require hard deletion.

Possible future field:

```text
dismissedAt
```

Task 079 does not require it.

Retention/cleanup policy should control physical deletion.

---

## 44. Account Deletion

When a user account is deleted, notification handling must align with the broader account-deletion and retention policy.

Ordinary personal notifications may usually be deleted with the account.

Moderation-related history must not be relied upon exclusively through Notification records because authoritative moderation history lives in:

- ModerationCard
- Sanction
- AuditLog

Therefore deleting user notifications must never destroy required moderation history.

---

## 45. Privacy

Notifications can contain personal and moderation-related information.

Therefore:

- expose notifications only to their recipient and authorized administrators where justified
- never expose raw IP values
- never expose IP hashes to ordinary users
- never include internal moderator notes automatically
- never include secrets or tokens
- minimize metadata
- apply retention rules

---

## 46. Authorization

A user may read only notifications where:

```text
Notification.userId = currentUser.id
```

Normal users must not fetch arbitrary notifications by ID belonging to another user.

Administrative access, if introduced later, requires explicit permissions and audit consideration.

---

## 47. Account Status Interaction

Notifications are primarily read-side functionality.

Conceptual access policy:

```text
ACTIVE
-> can read own notifications

LIMITED
-> can read own notifications

BANNED
-> authenticated access may be blocked according to ban handling
```

A LIMITED user should not lose access to moderation communication merely because posting permissions are restricted.

For BANNED users, external communication such as email may be necessary.

---

## 48. Role Interaction

Notification ownership does not depend on role.

Users with roles such as:

```text
USER
TRUSTED_USER
MODERATOR
EDITOR
ADMIN
SUPERADMIN
```

may all receive notifications.

Roles may influence admin tooling or which system events can target them, but they do not change the basic recipient model.

---

## 49. Notification Preferences and Mandatory Policy Resolution

Conceptual resolution:

```text
notification event
    ↓
load explicit user preference if present
    ↓
resolve platform default
    ↓
apply mandatory policy override
    ↓
decide IN_APP
    ↓
decide EMAIL
```

Mandatory policy always wins over user opt-out where the notification must remain deliverable.

---

## 50. Preference Example

Example ordinary community preference:

```text
THREAD_REPLY

inAppEnabled = true
emailEnabled = false
```

Example opt-out:

```text
COMMENT_REPLY

inAppEnabled = false
emailEnabled = false
```

if product policy permits full opt-out for this type.

Example moderation type:

```text
RED_CARD

user preference attempts:
inAppEnabled = false
emailEnabled = false

resolved policy:
inAppEnabled = true
emailEnabled = policy-defined
```

---

## 51. Preference Entity

Recommended conceptual entity:

```text
NotificationPreference
```

Fields:

```text
id
userId
type
inAppEnabled
emailEnabled
createdAt
updatedAt
```

Constraints:

```text
UNIQUE(userId, type)
```

This entity stores explicit user overrides only.

Platform defaults remain application policy.

---

## 52. Preference Validation

The API must reject invalid attempts to fully disable mandatory notification types.

Do not rely only on frontend controls.

Server-side logic must enforce mandatory policy.

---

## 53. Notification Creation API Boundary

Normal users must not be allowed to create arbitrary notifications directly.

Notifications are normally created by trusted application services in response to domain events.

Possible internal service interface:

```text
createNotification(...)
```

or:

```text
publishNotificationEvent(...)
```

Exact service architecture is defined later.

---

## 54. Domain Event Boundary

Source domains should provide enough information to create notifications without storing notification-specific state themselves.

Examples:

```text
Comment created as reply
-> comment service emits/enqueues reply notification intent
```

```text
ModerationCard created
-> moderation service emits/enqueues card notification intent
```

```text
Sanction created
-> sanction service emits/enqueues sanction notification intent
```

Do not add fields like:

```text
notificationSent
notificationRead
```

to Comment, Post, ModerationCard or Sanction.

---

## 55. Transaction Boundary

The architecture should avoid a state where a source domain operation commits but its notification intent is silently lost.

Task 079 recognizes this requirement but does not mandate a specific implementation.

Possible later strategies include:

- create Notification in the same database transaction
- transactional outbox
- reliable post-commit event processing

Task 081 and later application tasks should choose the implementation consistent with Kurvenfunk's modular monolith architecture.

---

## 56. Outbox Compatibility

The Notification model should remain compatible with a future transactional outbox.

If outbox records are introduced later, they are transport/integration records and must remain separate from the persisted user `Notification` entity.

---

## 57. Ordering

Notifications should display primarily by:

```text
createdAt DESC
```

Do not depend on queue execution order as the source of user-visible ordering.

The persisted notification timestamp is authoritative for notification-center ordering.

---

## 58. Pagination

Notification lists can grow large.

Use cursor pagination in later API implementation.

Likely cursor basis:

```text
(createdAt, id)
```

This provides stable ordering when multiple notifications have the same timestamp.

---

## 59. Unread Count

The unread count is derived state.

Conceptually:

```text
COUNT Notification
WHERE userId = ?
AND readAt IS NULL
```

Do not make a mutable unread counter the only source of truth.

Redis caching may later optimize this count, but PostgreSQL remains reconstructable source of truth.

---

## 60. Indexes

Task 260 already identifies:

```text
Notification.userId
```

as an important index target.

Recommended indexes for Task 081 consideration:

```text
(userId, createdAt DESC)
(userId, readAt)
(type)
(sourceType, sourceId)
(actorUserId)
(expiresAt)
```

Potential unique index:

```text
dedupeKey
```

if used.

Exact indexes should reflect real query patterns and PostgreSQL capabilities.

---

## 61. Referential Actions

Foreign-key deletion behavior requires careful selection.

### Recipient user

A notification cannot serve its normal purpose without a recipient.

Ordinary notifications may be deleted when the recipient account is physically removed, subject to retention policy.

### Actor user

Actor deletion must not necessarily destroy the recipient's notification history.

Possible strategy:

```text
actorUserId -> SET NULL
```

### Source entity

Source deletion or anonymization must not necessarily delete a notification immediately.

For example, a deleted comment may leave a historical notification record until cleanup.

Exact referential actions are selected in Task 081.

---

## 62. Soft-Deleted Source Content

If a source comment or post is soft-deleted:

- the Notification may remain
- its navigation target may no longer resolve to visible content
- UI should handle unavailable targets gracefully

Do not require notification deletion as part of content soft deletion.

---

## 63. Notification Content Stability

A notification should remain understandable even if the source content later changes.

Therefore storing a short user-visible title/body at creation time is useful.

Do not rely exclusively on re-rendering from mutable source entities.

---

## 64. Security Against Stored XSS

Notification `title`, `body` and metadata may contain values derived from user-generated content such as nicknames or excerpts.

All output must be escaped/rendered safely.

Do not store or render arbitrary trusted HTML in notification content for MVP.

Prefer plain text plus safe structured links.

---

## 65. Content Excerpts

If notification text includes an excerpt of a comment or post:

- limit length
- treat as plain text
- sanitize/escape on rendering
- avoid storing unnecessary full content copies

The source entity remains authoritative.

---

## 66. Notification Priority

Task 079 does not require a priority enum.

Important moderation messages can be distinguished by `type` and policy.

Add explicit priority only if later UI or delivery scheduling requires it.

---

## 67. Real-Time Delivery

Real-time notification delivery is not required by Task 079.

Possible later mechanisms:

- polling
- Server-Sent Events
- WebSockets
- push notifications

The persistence model should remain independent of the chosen real-time transport.

---

## 68. Push Notifications

Push notifications are a possible Version 1.1 feature.

Do not add browser/device push subscription fields to the core `Notification` entity.

Push subscriptions, if implemented, belong in dedicated entities.

---

## 69. Notification Preference Categories

The initial model should use per-type preferences rather than broad category-only settings.

Reason:

```text
COMMENT_REPLY
THREAD_REPLY
YELLOW_CARD
...
```

have materially different semantics and mandatory rules.

A frontend may group them visually into categories later.

---

## 70. Defaults by Type

Recommended conceptual defaults:

```text
COMMENT_REPLY
IN_APP = on
EMAIL = product-defined

THREAD_REPLY
IN_APP = on
EMAIL = product-defined

YELLOW_CARD
IN_APP = mandatory on
EMAIL = policy-defined

BLUE_CARD
IN_APP = mandatory on
EMAIL = policy-defined

RED_CARD
IN_APP = mandatory on
EMAIL = policy-defined

LIMITED
IN_APP = mandatory on
EMAIL = policy-defined

BAN
IN_APP = mandatory on
EMAIL = likely required by policy because authenticated access may be unavailable

APPEAL
IN_APP = on
EMAIL = product-defined

SYSTEM
IN_APP = policy-defined
EMAIL = policy-defined
```

Exact defaults are application policy and may be adjusted later without changing the database model.

---

## 71. Moderation Confidentiality

Notifications related to moderation must distinguish:

```text
user-visible reason
```

from:

```text
internal moderator note
```

Only user-visible data may be included in the notification.

This requirement applies to:

- yellow cards
- blue cards
- red cards
- sanctions
- bans
- appeal outcomes

---

## 72. Moderator Identity

Do not automatically expose the moderator's identity through `actorUserId` or notification text.

Whether a moderator name is visible is a product/moderation-policy decision.

System-generated moderation notifications should normally have:

```text
actorUserId = NULL
```

unless explicit user-visible actor semantics are required.

---

## 73. Notification and Session Revoke

For bans/red-card enforcement:

```text
persist moderation state
    ↓
persist/queue required notification
    ↓
revoke sessions
```

Exact transaction ordering must guarantee that enforcement is not weakened by notification failure.

The notification is communication, not enforcement.

---

## 74. Failure Handling

Failures must be separated by layer.

### Source operation failure

No notification should represent an operation that never committed.

### Notification persistence failure

Should be retryable/recoverable without rolling back already-valid enforcement unless the transaction strategy explicitly keeps both atomic.

### Email delivery failure

Must not delete or invalidate the persisted in-app notification.

### Queue failure

Must be observable and retryable.

---

## 75. Logging

Notification processing should use structured logs.

Useful fields may include:

```text
service
requestId
userId
notificationId
notificationType
event
```

Do not log:

- full sensitive moderation bodies unnecessarily
- tokens
- credentials
- raw IP addresses
- private internal notes

---

## 76. Audit Logging

Normal read/unread actions do not require audit logging.

Potentially auditable notification-related actions include:

- privileged manual notification creation
- changing mandatory notification policy
- administrative changes to another user's preferences

Routine user preference updates usually belong to normal domain logging unless security/policy requirements later classify them as audit-worthy.

The existing AuditLog model already anticipates notification preference changes as a possible audited action.

---

## 77. User Preference Changes

Normal flow:

```text
user opens notification settings
    ↓
changes COMMENT_REPLY email preference
    ↓
upsert NotificationPreference
```

Server-side validation must apply mandatory rules.

---

## 78. Preference Deletion

Deleting an explicit `NotificationPreference` should restore the platform default.

Conceptually:

```text
explicit preference deleted
-> default policy applies again
```

This is cleaner than persisting every default value forever.

---

## 79. Notification Event Examples

### Comment reply

```text
User A creates Comment C1
User B creates reply C2 to C1

-> Notification
   userId = A
   type = COMMENT_REPLY
   actorUserId = B
   sourceType = COMMENT
   sourceId = C2
```

### Forum thread activity

```text
User A subscribes to Thread T
User B creates Post P in T

-> Notification
   userId = A
   type = THREAD_REPLY
   actorUserId = B
   sourceType = POST
   sourceId = P
```

### Yellow card

```text
Moderator creates yellow ModerationCard M

-> Notification
   userId = affectedUser
   type = YELLOW_CARD
   sourceType = MODERATION_CARD
   sourceId = M
```

### LIMITED sanction

```text
Moderator creates LIMITED Sanction S

-> Notification
   userId = affectedUser
   type = LIMITED
   sourceType = SANCTION
   sourceId = S
```

### Ban

```text
Moderator creates ACCOUNT_BAN Sanction S

-> Notification
   userId = affectedUser
   type = BAN
   sourceType = SANCTION
   sourceId = S
```

---

## 80. Possible Duplicate Moderation Communication

A single moderation action may create both a card and a sanction.

Example:

```text
red card
    |
    +--> ModerationCard RED
    +--> ACCOUNT_BAN Sanction
```

The notification policy must avoid confusing duplicate messages such as:

```text
"You received a red card"
AND
"Your account was banned"
```

when both are two technical consequences of one moderation decision.

Possible policy:

- one primary user-facing moderation notification
- additional technical notification only when it conveys distinct necessary information

The source models remain separate even if communication is consolidated.

---

## 81. Notification Cause / Correlation

To help deduplicate multi-entity moderation flows, the final design may use a correlation or dedupe key.

Example:

```text
moderation-decision:<decision id>:<user id>
```

No generic moderation-decision entity currently exists, so Task 079 should not invent one.

Use available source IDs and idempotency keys until a broader domain requirement emerges.

---

## 82. Thread Subscription Semantics

`ThreadSubscription` determines subscription membership.

`NotificationPreference` determines platform-wide channel behavior.

These concerns must remain separate.

```text
ThreadSubscription
-> should this user receive thread activity at all?

NotificationPreference
-> through which allowed channels should THREAD_REPLY be delivered?
```

Future per-thread notification modes may extend `ThreadSubscription`, not `NotificationPreference`.

---

## 83. Read State Does Not Affect Source State

Reading a notification must not:

- mark a forum thread as read
- change `ThreadReadState`
- acknowledge a sanction
- revoke a card
- close an appeal

Those are separate domain concepts.

---

## 84. Forum Read State Boundary

Forum `ThreadReadState` tracks whether the user has read forum content.

Notification `readAt` tracks whether the notification message itself was read.

They may be updated together by UI workflows later, but they are not the same data.

---

## 85. Notification Preferences vs Thread Subscription

A user may be subscribed to a thread but disable `THREAD_REPLY` email.

Example:

```text
ThreadSubscription exists
NotificationPreference THREAD_REPLY:
  inAppEnabled = true
  emailEnabled = false
```

The subscription remains valid.

---

## 86. Notification Preference vs Moderation Rules

A user cannot avoid moderation communication by setting:

```text
YELLOW_CARD = OFF
RED_CARD = OFF
BAN = OFF
```

Mandatory policy overrides such requests.

The UI should not present misleading controls for non-disableable channels.

---

## 87. Notification Record Immutability

Most notification content should be treated as append-mostly historical user communication.

Mutable fields should be limited primarily to user state such as:

```text
readAt
```

and possibly future dismissal state.

Do not routinely rewrite historical moderation notification bodies when source data changes.

---

## 88. Updating Notifications

If a source object changes after notification creation, the existing notification normally remains unchanged.

Examples:

```text
comment edited
-> existing COMMENT_REPLY text is not necessarily rewritten
```

```text
moderation note edited
-> must never rewrite user notification with internal content
```

If a correction must be communicated, create a new notification or explicit lifecycle message according to product rules.

---

## 89. Retention

Exact notification retention belongs to later privacy/retention tasks.

General guidance:

- ordinary community notifications may have shorter retention
- moderation/security notifications may require longer retention
- notifications must not be the only retention location for authoritative moderation history

Retention jobs may remove old records after policy allows it.

---

## 90. Cleanup Worker

Notification cleanup may later run through the existing cleanup infrastructure.

Possible responsibilities:

- delete expired low-value notifications
- delete notifications beyond retention period
- preserve protected moderation history according to policy

Do not perform large synchronous cleanup during user requests.

---

## 91. Database Size Considerations

Notifications are high-volume compared with many moderation entities.

The model should therefore avoid:

- huge JSON payloads
- duplicated source content
- unnecessary rows for default preferences
- transport logs inside the main Notification row

Indexes should support recipient-centric queries efficiently.

---

## 92. Data Integrity Rules

Conceptual integrity requirements:

```text
userId must exist

type must be valid

title/body must satisfy application limits

readAt >= createdAt when present

expiresAt > createdAt when present

sourceType/sourceId consistency must be validated
```

Some cross-field constraints may be enforced at application level if Prisma cannot express them cleanly.

---

## 93. Suggested Text Limits

To prevent abuse and oversized rows, Task 081 should consider explicit limits.

Conceptual examples:

```text
title <= 200 characters
body <= 2000 characters
url <= 2048 characters
```

Exact values may be adjusted before Prisma implementation.

Metadata must also be bounded.

---

## 94. Notification Source Validation

If `sourceType` is present, `sourceId` should normally also be present.

If no source entity exists:

```text
sourceType = SYSTEM
sourceId = NULL
```

or both may be null depending on the final modeling choice.

Task 081 should choose one consistent representation.

---

## 95. Notification URLs and Source IDs

Do not derive authorization from notification URLs.

Clicking a notification must still pass the normal authorization and visibility checks of the destination resource.

A notification does not grant access to otherwise restricted content.

---

## 96. Deleted or Restricted Destination

A destination may later become unavailable.

Examples:

- comment deleted
- thread hidden
- post moderated
- appeal closed

UI should show a graceful unavailable state rather than leaking restricted content.

---

## 97. Notification Creation Permissions

Only trusted backend modules should create notifications.

Potential creators:

- comments module
- forum module
- moderation module
- sanctions module
- appeals module
- system/admin module

No public `POST /notifications` endpoint should allow arbitrary users to generate messages for others.

---

## 98. Admin-Generated System Notifications

If Kurvenfunk later permits administrators to send targeted system notifications:

- require explicit permission
- validate recipient scope
- audit the action
- prevent HTML/script injection
- support dedupe/idempotency

This is not required for MVP Task 079.

---

## 99. Bulk Notifications

Large fan-out should never insert/send thousands of notifications synchronously in an HTTP request.

Possible future flow:

```text
admin/system event
-> queue fan-out job
-> batch recipient processing
-> persisted notifications
```

Task 079 only needs the per-user persistence model.

---

## 100. Notification Preference Initialization

New users do not need rows for every type.

Recommended behavior:

```text
new User
-> zero NotificationPreference rows initially
-> application defaults apply
```

When the user changes a setting:

```text
upsert explicit preference row
```

---

## 101. Adding New Notification Types

When introducing a new notification type later:

1. add enum value
2. define default channel policy
3. define whether it is mandatory
4. define source trigger
5. define safe user-visible content
6. define dedupe semantics
7. update preference UI if configurable
8. add tests

Existing users automatically receive the default policy until they create an explicit preference.

---

## 102. Testing Requirements

Later implementation should include tests for at least:

```text
COMMENT_REPLY creation
THREAD_REPLY creation
self-notification exclusion
YELLOW_CARD notification
BLUE_CARD notification
RED_CARD notification
LIMITED notification
BAN notification
mandatory preference override
read notification
unread count
recipient authorization
dedupe retry behavior
email failure does not remove in-app notification
source operation does not depend on email success
```

---

## 103. Integration Test Scenarios

### Comment reply

```text
create parent comment
create reply as another user
verify notification for parent author
```

### Self reply

```text
create parent comment
reply as same author
verify no duplicate/self notification
```

### Forum subscription

```text
subscribe user to thread
create post as different user
verify THREAD_REPLY notification
```

### Moderation card

```text
issue yellow card
verify YELLOW_CARD notification
verify internal note absent
```

### Mandatory preference

```text
attempt to disable RED_CARD in-app
verify effective policy remains enabled
```

### Ban

```text
create account-ban sanction
verify BAN notification persisted
verify sanction remains effective even if email worker fails
```

---

## 104. Concurrency

Concurrent retries or duplicate domain events must not create duplicate logical notifications.

Dedupe/idempotency logic should operate safely under concurrency.

Database uniqueness is preferred over application-only "check then insert" where practical.

---

## 105. Transaction Strategy

For local synchronous domain operations, creating the persisted Notification in the same PostgreSQL transaction as the source operation may provide strong guarantees.

However email delivery must remain outside that transaction.

Alternative reliable patterns such as transactional outbox remain acceptable.

Task 081 should choose a consistent strategy based on implementation constraints.

---

## 106. Request ID Propagation

Notification jobs should preserve the existing request-context design where applicable.

Conceptually:

```text
HTTP request
-> requestId
-> source operation
-> notifications queue job
-> worker log
```

System/scheduled events without an originating HTTP request may generate their own correlation identifier.

---

## 107. Worker Payload

Queue payloads should contain identifiers and minimal safe data rather than entire domain entities.

Example:

```json
{
  "notificationId": "...",
  "context": {
    "requestId": "..."
  }
}
```

The worker can load the persisted notification as needed.

This avoids stale duplicated payloads and keeps PostgreSQL authoritative.

---

## 108. Queue Retry Safety

A retrying queue job must not:

- create a second logical notification
- resend mandatory emails indefinitely without retry limits
- expose internal error details to users

Delivery retries require bounded retry/backoff policy later.

---

## 109. Email Template Boundary

Email templates are presentation/infrastructure concerns.

The Notification domain stores semantics and user-visible notification state.

Mail infrastructure chooses the appropriate email template based on notification type/policy.

Do not store full email HTML in `Notification`.

---

## 110. Localization

Kurvenfunk may later support multiple languages.

The MVP domain model should avoid preventing localization.

Storing rendered German title/body is acceptable for the initial Austrian market, but `type` and metadata must remain stable enough to support later template-based localization.

Do not encode domain logic solely in free-text message strings.

---

## 111. Notification Type Naming

Database enum values should use English uppercase identifiers consistent with the existing codebase convention:

```text
COMMENT_REPLY
THREAD_REPLY
YELLOW_CARD
BLUE_CARD
RED_CARD
LIMITED
BAN
APPEAL
SYSTEM
```

API representations may later choose lowercase strings if a standardized serialization convention requires it, but the domain terminology must remain consistent.

---

## 112. Relationship Summary

```text
User
 |
 | 1
 |----< Notification
 |          |
 |          +-- type
 |          +-- readAt
 |          +-- optional actor User
 |          +-- optional source reference
 |          +-- safe metadata
 |
 |----< NotificationPreference
            |
            +-- type
            +-- inAppEnabled
            +-- emailEnabled
```

Source domains may include:

```text
Comment
Post
Thread
ModerationCard
Sanction
Appeal
```

but they do not own notification state.

---

## 113. Suggested Prisma Shape

Task 079 does not modify Prisma yet, but the conceptual target is approximately:

```text
model Notification {
  id
  userId
  type
  title
  body
  url?
  sourceType?
  sourceId?
  actorUserId?
  metadata?
  dedupeKey?
  readAt?
  expiresAt?
  createdAt
  updatedAt
}

model NotificationPreference {
  id
  userId
  type
  inAppEnabled
  emailEnabled
  createdAt
  updatedAt
}
```

Exact scalar types, relation names, indexes, constraints and referential actions are deferred to Task 081.

---

## 114. Why Not One Boolean `read`

A boolean supports only state:

```text
true / false
```

`readAt` supports both state and timestamp:

```text
NULL
-> unread

2026-...
-> read at known time
```

Therefore `readAt` is preferred.

---

## 115. Why Preferences Are Separate

Putting fields such as:

```text
emailEnabled
inAppEnabled
```

on each Notification would represent delivery decisions per record but would not model reusable user preferences.

A separate `NotificationPreference` provides:

- one setting per user/type
- default fallback
- future channels
- easy settings UI
- no duplicated preference state per notification

---

## 116. Why Delivery Is Separate

A notification may exist even when:

- email is disabled
- email fails
- no email provider is configured
- only in-app delivery is required

Therefore:

```text
Notification existence
!=
email delivery success
```

---

## 117. Why Source State Is Separate

Notification rows must not become secondary authoritative copies of moderation/community state.

For example:

```text
Notification.type = BAN
```

must never be used to decide whether the user is currently banned.

Ban enforcement must query the authoritative user/sanction state.

Similarly:

```text
Notification.type = RED_CARD
```

is not the authoritative moderation-card record.

---

## 118. Why Audit State Is Separate

Notifications are mutable user-facing records because read state changes.

AuditLog is append-only internal history.

Combining them would create conflicting requirements around:

- visibility
- retention
- mutability
- confidentiality
- indexing
- access control

They must stay separate.

---

## 119. Why Thread Subscription Is Separate

A subscription says:

```text
I follow this thread
```

A notification preference says:

```text
how should this notification type reach me?
```

These are independent concepts and must not be collapsed.

---

## 120. Why Ban Needs Special Communication

The normal notification center assumes authenticated access.

A banned account may have sessions revoked immediately.

Therefore a persisted BAN notification alone cannot guarantee that the user sees the ban message.

Later moderation implementation must ensure an accessible ban explanation and, where policy requires, external delivery such as email.

---

## 121. API Requirements for Later Tasks

Likely later endpoints include:

```text
GET /api/v1/notifications
GET /api/v1/notifications/unread-count
PATCH /api/v1/notifications/:id/read
PATCH /api/v1/notifications/read-all
GET /api/v1/notification-preferences
PUT /api/v1/notification-preferences/:type
```

These are implementation guidance only; Task 079 does not create them.

---

## 122. Read-All Semantics

A future "mark all as read" operation should update only the current user's notifications.

Conceptually:

```text
UPDATE Notification
SET readAt = now
WHERE userId = currentUser.id
AND readAt IS NULL
```

It must not affect another user's rows.

---

## 123. Unread Count Performance

At expected MVP scale, PostgreSQL can derive unread counts efficiently with the correct index.

Do not introduce Redis counters prematurely.

If cached later:

```text
PostgreSQL
-> source of truth

Redis unread count
-> reconstructable optimization
```

---

## 124. Notification Center Query

Typical query requirements:

- recipient filter
- newest first
- cursor pagination
- optionally unread only
- optionally type filter

Suggested query pattern:

```text
WHERE userId = ?
ORDER BY createdAt DESC, id DESC
LIMIT ?
```

---

## 125. Preference Query

Settings UI should combine:

```text
known notification types
+
platform defaults
+
explicit NotificationPreference overrides
+
mandatory-policy flags
```

The absence of a database row must not look like an unknown setting.

---

## 126. Mandatory Policy Representation

Mandatory behavior should generally live in application policy/configuration rather than mutable user records.

Example conceptual policy:

```text
YELLOW_CARD:
  mandatoryInApp = true

RED_CARD:
  mandatoryInApp = true

BAN:
  mandatoryInApp = true
```

Do not let a compromised or malformed preference row override required communication.

---

## 127. Type-Specific Creation Rules

Each type needs a well-defined source trigger.

```text
COMMENT_REPLY
-> reply comment committed

THREAD_REPLY
-> qualifying post committed in subscribed thread

YELLOW_CARD
-> yellow ModerationCard committed

BLUE_CARD
-> blue ModerationCard committed

RED_CARD
-> red ModerationCard committed

LIMITED
-> effective LIMITED sanction committed

BAN
-> effective ACCOUNT_BAN sanction committed

APPEAL
-> qualifying appeal lifecycle event

SYSTEM
-> explicit platform event
```

---

## 128. Avoiding Double Creation

Notification generation should be owned by one application boundary per event.

Example:

```text
Moderation service creates card
-> moderation service owns card notification intent
```

Do not independently create the same notification from:

- controller
- service
- audit listener
- worker

without idempotency/correlation.

---

## 129. Notification Ownership in Modular Monolith

Recommended module boundary later:

```text
notifications module
```

Responsibilities:

- persistence
- preference resolution
- mandatory policy
- read state
- dedupe
- delivery orchestration

Source modules call the notification module through explicit application interfaces/events.

---

## 130. Cross-Module Coupling

Source modules should not know email-provider details.

Incorrect:

```text
comments module
-> SMTP client
```

Correct:

```text
comments module
-> notification intent
-> notifications module
-> worker/mail infrastructure
```

---

## 131. Notification Storage vs Event Storage

A Notification is not a general event bus record.

Do not persist every application event as a notification.

Only events that create meaningful user-facing communication belong here.

---

## 132. Notification Storage vs Activity Feed

A notification center is not automatically a full user activity feed.

Kurvenfunk may later add activity/history views, but those should not overload Notification unless requirements truly match.

---

## 133. Notification Storage vs Inbox

Notifications are lightweight system-generated messages.

They are not private user-to-user messaging.

Do not add sender inbox/outbox, message threads, attachments or reply semantics unless a future messaging feature is intentionally designed.

---

## 134. Abuse Prevention

Because notifications can be triggered by user actions, the system must prevent notification spam.

Relevant protections include:

- existing comment/forum rate limits
- self-notification exclusion
- subscription controls
- duplicate suppression
- future aggregation
- possible per-user fan-out limits for abusive activity

Do not solve source-domain spam solely inside Notification.

---

## 135. Blocking / Privacy Future Compatibility

If Kurvenfunk later adds user blocking or privacy relationships, notification generation must check those policies where applicable.

Task 079 does not define user blocking.

The model remains compatible because notification creation policy is separate from persistence.

---

## 136. Source User Deletion

If the actor account is deleted:

```text
actorUserId may become NULL
```

but the notification can remain with text such as a historical user-visible message.

Do not require hard deletion of all recipient notifications because another user's account was deleted.

---

## 137. Source Moderation Deletion

Moderation records generally should not be casually hard-deleted.

If retention later removes a source record, the Notification must not become authoritative moderation history.

This reinforces separation from ModerationCard, Sanction and AuditLog.

---

## 138. Migration Considerations

Task 081 should consider:

- enum creation order
- relation names to User
- multiple User relations (`recipient`, `actor`)
- optional source-reference strategy
- JSON metadata type
- text limits
- indexes
- unique preference constraint
- dedupe unique strategy
- nullable timestamp indexes

---

## 139. Prisma User Relations

The future User model may conceptually need relations such as:

```text
notificationsReceived
notificationActions
notificationPreferences
```

Relation naming should be explicit because Notification may reference User twice:

```text
userId
actorUserId
```

Task 081 must avoid ambiguous Prisma relations.

---

## 140. Enum Compatibility

Task 081 should align NotificationType with existing enum naming conventions and avoid lowercase database enum values unless there is a deliberate project-wide convention.

Recommended:

```text
enum NotificationType {
  COMMENT_REPLY
  THREAD_REPLY
  YELLOW_CARD
  BLUE_CARD
  RED_CARD
  LIMITED
  BAN
  APPEAL
  SYSTEM
}
```

---

## 141. Source Reference Alternatives

Task 081 may choose between:

### Generic source reference

```text
sourceType
sourceId
```

Advantages:

- flexible
- avoids many nullable foreign keys

Tradeoff:

- database cannot enforce every source relation

### Explicit nullable foreign keys

```text
commentId?
postId?
moderationCardId?
sanctionId?
appealId?
```

Advantages:

- referential integrity

Tradeoff:

- many nullable columns
- harder to extend

Task 079 does not force either strategy.

The final choice should align with similar safe content-reference decisions in ModerationReport, ModerationCard and AuditLog.

---

## 142. Recommended Source Strategy

Given Kurvenfunk's varied notification sources and the desire to avoid a large number of nullable relations, a generic:

```text
sourceType
sourceId
```

strategy is a reasonable default candidate.

However, Task 081 should decide only after reviewing how generic references were resolved across the other domain models.

The Notification model must not create inconsistent reference patterns without that review.

---

## 143. Metadata Versioning

If metadata structure becomes complex later, introduce an explicit version only when necessary.

MVP metadata should remain simple enough that versioning is unnecessary.

---

## 144. Notification Snapshot vs Live Data

Recommended hybrid approach:

```text
title/body
-> creation-time user-visible snapshot

source reference
-> optional live navigation/context
```

This allows the notification to remain understandable while still linking to current content.

---

## 145. User-visible Moderation Reason

Moderation notifications should reference a dedicated user-visible reason/description from the source moderation domain when available.

Never infer notification text from unrestricted internal JSON or notes.

---

## 146. Moderation Escalation Example

```text
third yellow card created
    ↓
automatic red card created
    ↓
account ban sanction created
```

Potential communication policy:

```text
one RED_CARD/BAN user-facing notification bundle
```

or separate notifications if each conveys materially distinct information.

Task 079 defines the need for dedupe/correlation but leaves the exact UX to later moderation implementation.

---

## 147. Notification Creation Timing

The persisted notification should normally reflect when the user-facing event occurred, not when an email provider finally delivered it.

Therefore:

```text
createdAt
-> notification creation/event time
```

Email delivery timestamps belong to delivery tracking if implemented later.

---

## 148. Timestamp Semantics

Recommended timestamps:

```text
createdAt
updatedAt
readAt?
expiresAt?
```

Possible future timestamps:

```text
dismissedAt?
```

Transport-specific timestamps belong outside core Notification.

---

## 149. UpdatedAt Semantics

`updatedAt` may change primarily when read state or other mutable user state changes.

Do not use `updatedAt` as a substitute for `readAt`.

---

## 150. Read State Concurrency

Two clients may mark the same notification read simultaneously.

This must be harmless.

Preferred behavior:

```text
first update sets readAt
second update leaves existing readAt unchanged or idempotently accepts the state
```

Exact timestamp preservation policy can be implemented later.

---

## 151. Read-All Concurrency

New notifications created during a mark-all-as-read operation may remain unread depending on transaction timing.

This is acceptable if the API semantics are documented as:

```text
mark all notifications currently visible/eligible as read
```

Do not overcomplicate MVP with global synchronization locks.

---

## 152. Notification Preference Concurrency

Preference updates should use upsert semantics under the unique `(userId, type)` constraint.

This prevents duplicate preference rows.

---

## 153. Data Export

User data export should later include relevant notification preferences and, depending on privacy policy, notification history.

Sensitive internal moderation information must not leak through exported notification metadata because it should never have been stored there in the first place.

---

## 154. Account Deletion and Preferences

`NotificationPreference` records are user-owned settings and should normally be deleted with the account.

They do not constitute required moderation history.

---

## 155. Retention and Legal Policy

Exact retention durations must be defined in later tasks:

- Task 249 – Moderation Retention
- privacy/legal work before production

Task 079 only ensures the model can support cleanup and differentiated retention.

---

## 156. Monitoring

Later monitoring may track aggregate operational metrics such as:

```text
notifications_created_total
notification_jobs_failed
email_delivery_failures
notification_queue_depth
```

Do not expose sensitive per-user content in monitoring metrics.

---

## 157. Admin Tooling

Future admin tooling may need visibility into notification failures or policy, but normal administrators should not casually browse private user notification content without a justified permission model.

Operational delivery diagnostics should preferably expose metadata/status rather than full message bodies where possible.

---

## 158. Search Boundary

Notifications should not be indexed in Meilisearch for MVP.

They are private recipient-specific data and can be queried efficiently from PostgreSQL.

---

## 159. Cache Boundary

Notification lists and unread counts may later be cached, but caching is optional.

PostgreSQL remains authoritative.

Do not make Redis required for preserving read/unread state.

---

## 160. Storage Boundary

Notification content does not require object storage.

Attachments are not part of the Notification MVP.

If a notification links to media, it should reference the destination domain indirectly through a safe URL/source relation.

---

## 161. Keycloak Boundary

Keycloak manages authentication and sessions.

Kurvenfunk Notification records belong to the application User entity, not directly to Keycloak user storage.

`Notification.userId` references Kurvenfunk `User.id`.

---

## 162. Email Identity

Email destinations come from the authenticated/account identity system and must not be duplicated into Notification records unless a later delivery ledger explicitly needs a historical delivery address for compliance/diagnostics.

Do not store recipient email in every Notification row for MVP.

---

## 163. Notification Content Example – Comment Reply

```text
Type: COMMENT_REPLY
Title: New reply to your comment
Body: <nickname> replied to your comment.
URL: /article/...#comment-...
```

Optional short content excerpts may be added later.

---

## 164. Notification Content Example – Yellow Card

```text
Type: YELLOW_CARD
Title: You received a yellow card
Body: A moderation warning was issued for your account.
URL: /settings/moderation
```

The actual user-visible reason may be included safely.

Internal moderator notes must not be included.

---

## 165. Notification Content Example – Blue Card

```text
Type: BLUE_CARD
Title: Your account has been temporarily restricted
Body: A moderation restriction was applied to your account.
URL: /settings/moderation
```

Exact terminology must remain consistent with the final blue-card product semantics.

---

## 166. Notification Content Example – Red Card

```text
Type: RED_CARD
Title: You received a red card
Body: A serious moderation action was issued for your account.
URL: /account/status
```

If the red card results in a ban, the communication policy must explain the effective account status clearly.

---

## 167. Notification Content Example – LIMITED

```text
Type: LIMITED
Title: Your account is temporarily limited
Body: Some community actions are unavailable until <date>.
URL: /account/status
```

Expiration may be displayed from safe sanction data.

---

## 168. Notification Content Example – BAN

```text
Type: BAN
Title: Your account has been banned
Body: Your Kurvenfunk account is currently banned.
URL: /account/status
```

The actual ban screen/email must provide the user-visible reason and appeal information where required.

---

## 169. Notification Content Example – Appeal

```text
Type: APPEAL
Title: Update to your appeal
Body: The status of your appeal has changed.
URL: /account/appeals/<id>
```

Do not expose internal moderation review notes.

---

## 170. Notification Content Example – System

```text
Type: SYSTEM
Title: Important Kurvenfunk notice
Body: <safe user-facing text>
URL: <optional internal route>
```

System notifications should be exceptional, not routine operational logging.

---

## 171. Field Summary

Recommended `Notification` fields:

```text
id
userId
type
title
body
url?
sourceType?
sourceId?
actorUserId?
metadata?
dedupeKey?
readAt?
expiresAt?
createdAt
updatedAt
```

Recommended `NotificationPreference` fields:

```text
id
userId
type
inAppEnabled
emailEnabled
createdAt
updatedAt
```

---

## 172. Required Constraints Summary

Conceptual constraints:

```text
Notification.userId NOT NULL
Notification.type NOT NULL
Notification.title NOT NULL
Notification.body NOT NULL

NotificationPreference.userId NOT NULL
NotificationPreference.type NOT NULL

UNIQUE(NotificationPreference.userId, NotificationPreference.type)
```

Potential:

```text
UNIQUE(Notification.dedupeKey)
```

when `dedupeKey` is non-null and final PostgreSQL/Prisma semantics are selected.

---

## 173. Required Index Summary

Task 081 should strongly consider:

```text
Notification(userId, createdAt)
Notification(userId, readAt)
Notification(sourceType, sourceId)
Notification(actorUserId)
Notification(expiresAt)
NotificationPreference(userId)
```

The key high-volume path is recipient notification retrieval.

---

## 174. Source Domains Supported

Task 079 is compatible with:

- User
- Comment
- Forum / Thread / Post / ThreadSubscription
- ModerationReport where future appeal/report messages require it
- ModerationCard
- Sanction
- IPBlock indirectly through Sanction
- AuditLog as a separate concern
- future Appeal domain

---

## 175. Existing Domain Commitments Incorporated

This model incorporates requirements already established by prior Kurvenfunk domain tasks:

```text
Comment
-> replies may trigger notification
-> delivery asynchronous

Forum
-> ThreadSubscription drives thread notifications
-> author exclusion
-> duplicate suppression belongs to Notification

ModerationCard
-> YELLOW_CARD
-> BLUE_CARD
-> RED_CARD
-> user-visible information only
-> moderation notifications cannot be fully suppressed

Sanction
-> LIMITED
-> BAN
-> notification failure must not affect enforcement

IPBlock
-> does not own notification state

AuditLog
-> user-facing notifications remain separate from audit history
```

---

## 176. Relationship to Task 224

Task 224 defines concrete notification types for the application implementation.

Task 079 already establishes the initial domain enum:

```text
COMMENT_REPLY
THREAD_REPLY
YELLOW_CARD
BLUE_CARD
RED_CARD
LIMITED
BAN
APPEAL
SYSTEM
```

Task 224 should use this model and adjust only if later product requirements explicitly require changes.

---

## 177. Relationship to Task 225

Task 225 implements the notification queue.

The queue already exists in the shared queue constants as:

```text
notifications
```

Task 225 should define actual job payloads/processors without moving source-of-truth notification state into Redis.

---

## 178. Relationship to Task 226

Task 226 implements in-app notifications.

It should use persisted `Notification` rows and the read/unread model defined here.

---

## 179. Relationship to Task 227

Task 227 implements Read / Unread.

It should use:

```text
readAt nullable
```

rather than adding a conflicting boolean unless there is a compelling implementation reason.

---

## 180. Relationship to Task 228

Task 228 implements email notifications asynchronously through the worker.

It should respect:

- user preferences
- mandatory moderation/security policy
- queue retry logic
- source operation independence

---

## 181. Relationship to Task 229

Task 229 implements notification preferences.

It should use `NotificationPreference` with per-type channel settings and mandatory policy overrides.

Security/moderation messages must not be completely disabled by normal user preferences.

---

## 182. Relationship to Task 260

Task 260 defines database indexes.

Notification indexes are particularly important for:

```text
userId
createdAt
readAt
```

because notification lists and unread counts are frequent per-user queries.

---

## 183. Relationship to Task 271

The E2E moderation flow includes:

```text
Comment
-> Report
-> Moderator
-> Yellow Card
-> Notification
-> further violations
-> third Yellow
-> Red
-> Session Revoke
```

The model here provides the Notification persistence needed for that flow.

---

## 184. Relationship to Privacy Tasks

Later privacy work must define:

- retention period
- deletion behavior
- export behavior
- moderation notification retention

Task 079 ensures notifications contain only minimal user-safe data and do not become authoritative audit/moderation storage.

---

## 185. Anti-Patterns

Do not implement:

```text
Comment.notificationSent
```

Do not implement:

```text
Sanction.emailSent
```

Do not implement:

```text
AuditLog.readAt
```

Do not implement:

```text
Notification.isBanned
```

Do not implement notification state only in Redis/BullMQ.

Do not copy internal moderator notes into notification bodies.

Do not allow user preferences to suppress mandatory moderation communication.

Do not use Notification rows to determine current sanction/account status.

---

## 186. MVP Decisions

For the Kurvenfunk MVP, Task 079 establishes:

```text
1 Notification row per recipient-facing notification

read state via readAt

per-type preferences in separate entity

channels initially IN_APP + EMAIL

mandatory moderation/security policy overrides user opt-out

asynchronous email delivery

source operation independent from delivery success

safe title/body snapshot

optional generic source reference

optional actor relation

dedupe support
```

---

## 187. Deferred Decisions

Deferred to later tasks:

- final Prisma scalar types
- generic versus explicit source relations
- exact email defaults
- email delivery ledger
- aggregation rules
- push notifications
- WebSocket/SSE delivery
- dismissal/archive state
- exact retention periods
- notification localization strategy
- per-thread notification levels
- detailed appeal notification subtype enum

---

## 188. Acceptance Criteria

Task 079 is complete when the domain model clearly defines:

- [x] per-user notifications
- [x] explicit notification types
- [x] comment reply compatibility
- [x] forum subscription compatibility
- [x] yellow-card notifications
- [x] blue-card notifications
- [x] red-card notifications
- [x] LIMITED notifications
- [x] ban notifications
- [x] appeal/system notifications
- [x] safe user-facing moderation content
- [x] separation from audit state
- [x] separation from sanction state
- [x] separation from queue/delivery state
- [x] read/unread semantics
- [x] preference model
- [x] mandatory moderation/security behavior
- [x] asynchronous email boundary
- [x] deduplication/idempotency compatibility
- [x] indexes/query guidance
- [x] privacy and retention compatibility
- [x] Task 081 Prisma follow-up requirements

---

## 189. Final Domain Summary

Kurvenfunk uses a dedicated `Notification` entity as the persisted, recipient-specific record of user-facing platform messages.

Each notification belongs to one user and has an explicit semantic type such as:

```text
COMMENT_REPLY
THREAD_REPLY
YELLOW_CARD
BLUE_CARD
RED_CARD
LIMITED
BAN
APPEAL
SYSTEM
```

Read state is represented by:

```text
readAt
```

Notification preferences are stored separately per user and notification type through `NotificationPreference`.

Normal community notifications may be configurable or suppressible according to product policy.

Important moderation and security notifications must retain a mandatory delivery path and cannot be completely disabled through ordinary user preferences.

Notifications may reference source entities and optional actors, but source domains remain authoritative for their own state.

`ModerationCard`, `Sanction`, `Comment`, `Post`, `ThreadSubscription`, `IPBlock` and `AuditLog` do not store notification read or delivery state.

Email delivery is asynchronous through the notification queue and worker. Delivery failure must not invalidate committed comments, posts, moderation actions or sanctions.

PostgreSQL is the source of truth for persisted notification state; Redis/BullMQ is only delivery infrastructure.

This model provides the domain foundation required for Task 081 Prisma mapping and later notification Tasks 224–229 without coupling user-facing communication to moderation enforcement, audit history, queue jobs or transport-specific delivery state.
