# Forum Domain Model

**Project:** Kurvenfunk
**Task:** 073 – Forum Model
**Status:** Domain model defined
**Target:** `docs/database/forum-model.md`

---

## 1. Purpose

This document defines the domain model for the Kurvenfunk forum.

The forum is a core community area and must support:

- forum categories
- general forums
- club-specific forums
- threads
- posts and replies
- thread subscriptions
- unread tracking
- last-read position
- thread pinning
- thread locking
- thread moving
- thread merging
- moderation integration
- future search indexing
- future notifications
- article/forum integration

This document defines the domain semantics and relationships only.

It does **not** yet define:

- the final Prisma schema
- database migrations
- NestJS modules
- REST endpoints
- UI components
- Meilisearch documents
- notification delivery
- moderation report tables
- audit log tables

Those are implemented in later project tasks.

---

## 2. Scope

Task 073 defines the following entities:

1. `ForumCategory`
2. `Forum`
3. `Thread`
4. `Post`
5. `ThreadSubscription`
6. `ThreadReadState`

The model must be sufficient for the later forum feature tasks:

- 209 – Forum Categories
- 210 – Club Forums
- 211 – Threads
- 212 – Posts
- 213 – Replies
- 214 – Thread Pagination
- 215 – Thread Subscriptions
- 216 – Unread Tracking
- 217 – Last Read Position
- 218 – Thread Pinning
- 219 – Thread Locking
- 220 – Thread Moving
- 221 – Thread Merging
- 222 – Forum Reports
- 223 – Article / Forum Integration

---

## 3. Domain Goals

The forum model should satisfy the following goals.

### 3.1 Clear hierarchy

The forum hierarchy is:

```text
ForumCategory
    ↓
Forum
    ↓
Thread
    ↓
Post
```

A category organizes forums.

A forum contains threads.

A thread contains posts.

A post may optionally reply to another post in the same thread.

---

### 3.2 Club integration

A forum may optionally belong to a club.

Examples:

```text
Category: Vereine
    Forum: SK Rapid Wien
    Forum: FK Austria Wien
    Forum: SK Sturm Graz
```

The `Forum` entity therefore supports an optional relation to `Club`.

A general forum has no `clubId`.

---

### 3.3 Efficient chronological discussion

Posts inside a thread require a stable, deterministic order.

Each post receives a thread-local sequence number:

```text
1
2
3
4
...
```

This enables:

- cursor pagination
- page calculations if needed
- unread tracking
- last-read position
- direct links to a post
- reliable chronological navigation

The sequence number is immutable after creation.

---

### 3.4 Separate read state

Read state is user-specific and must not be stored on the thread itself.

Each user can have at most one `ThreadReadState` per thread.

This allows Kurvenfunk to determine:

- whether a thread is unread
- how many new posts approximately exist
- where to continue reading
- which post was last seen

---

### 3.5 Separate subscriptions

Thread subscriptions are independent from read state.

A user may:

- read a thread without subscribing
- subscribe without currently having unread content
- unsubscribe without losing read position

Therefore `ThreadSubscription` and `ThreadReadState` are separate entities.

---

### 3.6 Moderation-ready

Forum content must integrate with the later moderation model.

The forum model therefore preserves:

- authorship
- creation timestamps
- edit timestamps
- soft deletion state
- lock state
- pin state
- merge state
- original thread relationships

Reports, sanctions, cards and audit logs are separate domain models.

---

## 4. Core Rules

### Rule 1 – Role and account status remain separate

The forum model does not encode permissions into forum records.

Authorization is evaluated separately using:

- user role
- account status
- explicit permissions
- forum/thread state

For example:

```text
ACTIVE
LIMITED
BANNED
```

remain account states, not forum roles.

---

### Rule 2 – LIMITED users may read but may not write

The platform-wide moderation rules apply to the forum.

A `LIMITED` user may:

- read categories
- read forums
- read threads
- read posts
- search forum content
- react where reactions are allowed

A `LIMITED` user may not:

- create threads
- create posts
- reply to posts

The exact permission implementation belongs to the later permission system.

---

### Rule 3 – BANNED users cannot perform authenticated forum actions

A banned account must not be able to:

- create threads
- create posts
- subscribe
- change read state through authenticated application actions
- perform other authenticated community actions

Public read access may still be possible depending on the final product policy.

---

### Rule 4 – Forum structure is independent from user permissions

A forum does not store role names such as:

```text
MODERATOR
ADMIN
TRUSTED_USER
```

Permission checks must not be hard-coded into the forum data model.

If Kurvenfunk later restricts thread creation to trusted users, that policy belongs to the permission layer rather than the `Forum` table.

---

### Rule 5 – PostgreSQL is the source of truth

Forum state must be reconstructable from PostgreSQL.

Redis and Meilisearch may cache or index forum data but are not authoritative.

---

### Rule 6 – Soft deletion preserves discussion structure

Deleting a post should normally not physically remove it immediately.

A deleted post may remain structurally present so that:

- replies do not lose their parent context
- moderation history remains understandable
- thread ordering remains stable
- sequence numbers remain stable

The public UI may render deleted content as:

```text
This post was deleted.
```

or an equivalent presentation.

---

### Rule 7 – Post sequence numbers never change

Once a post receives a sequence number inside a thread, the number is immutable.

Deleting earlier posts must not renumber later posts.

---

### Rule 8 – A reply stays inside its thread

If `Post.parentPostId` is set, the parent post must belong to the same thread.

Cross-thread replies are invalid.

---

### Rule 9 – Thread merge must leave a canonical destination

When a thread is merged, the source thread must reference the destination thread.

The source thread should not silently disappear.

This allows:

- old URLs to redirect
- moderation history to remain understandable
- search results to resolve correctly
- external links to continue working

---

### Rule 10 – Thread movement changes forum context, not thread identity

Moving a thread to another forum changes `forumId`.

The thread `id` and public thread identity remain stable.

---

## 5. Entity Overview

```text
ForumCategory
    │
    └──< Forum
            │
            ├── optional Club
            │
            └──< Thread
                    │
                    ├──< Post
                    │      └── optional parent Post
                    │
                    ├──< ThreadSubscription
                    │
                    └──< ThreadReadState
```

User relationships:

```text
User
 ├──< Thread.author
 ├──< Post.author
 ├──< ThreadSubscription
 └──< ThreadReadState
```

---

# 6. ForumCategory

## 6.1 Purpose

`ForumCategory` is a top-level organizational container for forums.

Examples:

```text
Bundesliga
Vereine
Nationalteam
International
Off Topic
```

A category itself does not contain posts or threads directly.

It exists to organize navigation and administration.

---

## 6.2 Suggested fields

```text
ForumCategory
-------------
id
name
slug
description
sortOrder
active
createdAt
updatedAt
```

---

## 6.3 Field definitions

### `id`

Stable internal identifier.

Recommended domain type:

```text
UUID
```

Requirements:

- immutable
- unique
- generated by the application/database
- never derived from the category name

---

### `name`

Human-readable category name.

Examples:

```text
Bundesliga
Vereine
International
Off Topic
```

Requirements:

- required
- trimmed
- not empty
- administratively editable

---

### `slug`

URL-safe stable category identifier.

Example:

```text
vereine
international
off-topic
```

Potential route:

```text
/forum/kategorie/vereine
```

Requirements:

- required
- unique
- lowercase canonical form
- URL-safe

Slug history/redirect behavior may be added later if SEO requirements justify it.

---

### `description`

Optional category description.

Example:

```text
Foren zu Vereinen der österreichischen Bundesliga.
```

Requirements:

- optional
- plain text or tightly controlled rich text
- must be sanitized before rendering if rich text is ever supported

For the MVP, plain text is sufficient.

---

### `sortOrder`

Administrative ordering value.

Example:

```text
10
20
30
40
```

Using spaced values allows categories to be inserted without renumbering everything.

Requirements:

- required
- integer
- ascending order

---

### `active`

Controls whether the category is currently available in normal forum navigation.

```text
true
false
```

Inactive does not necessarily mean deleted.

An inactive category can remain in the database for:

- historical threads
- moderation
- future reactivation
- redirects

---

### `createdAt`

Timestamp when the category was created.

---

### `updatedAt`

Timestamp of the most recent category metadata change.

---

## 6.4 Relationships

```text
ForumCategory 1 ─── N Forum
```

A category:

- may contain zero forums
- may contain many forums

A forum belongs to exactly one category.

---

## 6.5 Constraints

Recommended logical constraints:

```text
UNIQUE(slug)
```

Sort order does not need to be unique.

Two categories may temporarily share the same `sortOrder`; secondary sorting can use name or ID.

---

## 6.6 Deletion behavior

Hard deletion should be avoided when forums already exist.

Preferred administrative behavior:

```text
active = false
```

A category with existing forums should not be physically deleted casually.

---

# 7. Forum

## 7.1 Purpose

`Forum` represents an individual discussion area inside a category.

Examples:

```text
Allgemeine Bundesliga
SK Rapid Wien
FK Austria Wien
SK Sturm Graz
Nationalteam
Transfers
Off Topic
```

---

## 7.2 Suggested fields

```text
Forum
-----
id
categoryId
clubId?
name
slug
description
sortOrder
active
threadCreationEnabled
createdAt
updatedAt
```

---

## 7.3 Field definitions

### `id`

Stable internal forum identifier.

Recommended:

```text
UUID
```

---

### `categoryId`

Required relation to `ForumCategory`.

A forum always belongs to exactly one category.

---

### `clubId`

Optional relation to `Club`.

Semantics:

```text
clubId = NULL
→ general/non-club forum

clubId = <club>
→ forum is associated with that club
```

This enables club-specific forum integration.

Examples:

```text
Forum "SK Rapid Wien"
clubId = rapidClubId

Forum "Allgemeine Bundesliga"
clubId = NULL
```

---

### `name`

Human-readable forum name.

Examples:

```text
SK Rapid Wien
Allgemeine Bundesliga
Transfers & Gerüchte
```

---

### `slug`

URL-safe forum identifier.

Example:

```text
sk-rapid-wien
allgemeine-bundesliga
```

Possible route:

```text
/forum/sk-rapid-wien
```

The slug should normally be globally unique within the forum namespace.

This is preferable to category-scoped uniqueness because:

- routes remain simpler
- moving a forum between categories does not change its URL
- external links remain stable

---

### `description`

Optional explanatory text.

Example:

```text
Diskussionen rund um den SK Rapid Wien.
```

---

### `sortOrder`

Ordering inside the category.

Example:

```text
10
20
30
```

---

### `active`

Controls normal visibility/availability.

Inactive forums may remain stored for historical reasons.

---

### `threadCreationEnabled`

Administrative switch that can prevent new thread creation without deactivating the entire forum.

```text
true
false
```

Use cases:

- archived competition forum
- temporary moderation lockdown
- read-only historical area
- forum restructuring

This field is not a replacement for user permission checks.

A user must satisfy both:

```text
forum.threadCreationEnabled == true
AND
permission(thread.create) == true
```

---

### `createdAt`

Creation timestamp.

---

### `updatedAt`

Last metadata update timestamp.

---

## 7.4 Relationships

```text
ForumCategory 1 ─── N Forum
Club          1 ─── N Forum   (optional on Forum)
Forum         1 ─── N Thread
```

---

## 7.5 Club forum rules

A club may technically have more than one forum in the future.

For example:

```text
SK Rapid Wien
Rapid Nachwuchs
Rapid Transfers
```

Therefore the base domain model should **not** enforce:

```text
UNIQUE(clubId)
```

If the MVP decides to have exactly one primary forum per club, that can be expressed through application rules or a later forum type field.

---

## 7.6 Optional future forum classification

The initial entity does not require a type enum.

If later needed, a field such as:

```text
ForumType
---------
GENERAL
CLUB
COMPETITION
NATIONAL_TEAM
OFF_TOPIC
ARCHIVE
```

could be introduced.

For Task 073, `clubId` plus category organization is sufficient.

---

## 7.7 Constraints

Recommended:

```text
UNIQUE(slug)
INDEX(categoryId, sortOrder)
INDEX(clubId)
INDEX(active)
```

Exact indexes belong to Task 081 / database implementation.

---

## 7.8 Deletion behavior

Forums containing threads should normally not be hard-deleted.

Preferred behavior:

```text
active = false
```

If a forum is merged or replaced administratively, existing threads can be moved to another forum.

---

# 8. Thread

## 8.1 Purpose

`Thread` represents one discussion topic inside a forum.

Examples:

```text
Sommertransferfenster 2026
Rapid – Sturm: Matchthread
Trainerdiskussion
Bundesliga Saison 2026/27
```

---

## 8.2 Suggested fields

```text
Thread
------
id
forumId
authorId
title
slug
status
pinnedAt?
pinnedByUserId?
lockedAt?
lockedByUserId?
lockReason?
mergedIntoThreadId?
postCount
lastPostAt?
lastPostId?
createdAt
updatedAt
```

---

## 8.3 Thread status

Recommended enum:

```text
ThreadStatus
------------
OPEN
LOCKED
MERGED
ARCHIVED
```

### `OPEN`

Normal thread.

Users with permission may post.

---

### `LOCKED`

Thread remains readable but new posts are blocked.

---

### `MERGED`

Thread has been merged into another canonical thread.

The source thread should redirect to `mergedIntoThreadId`.

---

### `ARCHIVED`

Historical thread kept for reading.

New posts are normally not allowed.

This state is useful for:

- completed seasons
- old transfer windows
- retired organizational areas

---

## 8.4 `id`

Stable thread identifier.

Recommended:

```text
UUID
```

Must remain stable when:

- moving the thread
- renaming the thread
- pinning/unpinning
- locking/unlocking

---

## 8.5 `forumId`

Current forum containing the thread.

Moving a thread changes this field.

---

## 8.6 `authorId`

User who originally created the thread.

This should not change if:

- the user later changes nickname
- the user is limited
- the user is banned
- the thread is moved
- the thread is locked

If the account is later deleted, anonymization rules from the privacy model may apply.

---

## 8.7 `title`

Thread title.

Requirements:

- required
- trimmed
- length-limited
- sanitized
- not empty

Exact minimum/maximum length belongs to validation requirements.

---

## 8.8 `slug`

URL-readable representation of the thread title.

Example:

```text
sommertransferfenster-2026
```

A route should preferably include the immutable thread ID so that title changes do not break URLs.

Example:

```text
/forum/thread/2f4.../sommertransferfenster-2026
```

In this structure the slug is primarily decorative/SEO-oriented.

Therefore global slug uniqueness is not required.

---

## 8.9 `status`

Current lifecycle state.

```text
OPEN
LOCKED
MERGED
ARCHIVED
```

The status is authoritative for whether normal posting is allowed.

---

## 8.10 `pinnedAt`

Timestamp indicating that the thread is pinned.

```text
NULL
→ not pinned

timestamp
→ pinned
```

A timestamp is preferable to a simple boolean because it also records when the current pin state began.

---

## 8.11 `pinnedByUserId`

Optional moderator/admin user who pinned the thread.

This is operational metadata, not a replacement for a full audit log.

When unpinned, the application may clear both:

```text
pinnedAt
pinnedByUserId
```

The audit log should preserve historical actions later.

---

## 8.12 `lockedAt`

Timestamp when the current lock was applied.

This may be null for open threads.

---

## 8.13 `lockedByUserId`

User who applied the current lock.

Typically a moderator/admin.

---

## 8.14 `lockReason`

Optional current lock explanation.

Examples:

```text
Duplicate discussion
Temporary moderation lock
Match thread closed after event
```

This can be displayed publicly or treated as moderator text depending on later policy.

Internal moderation notes belong elsewhere.

---

## 8.15 `mergedIntoThreadId`

Optional self-reference to another `Thread`.

Semantics:

```text
status = MERGED
mergedIntoThreadId = canonical destination
```

Example:

```text
Thread A
    ↓ merged into
Thread B
```

Rules:

- cannot reference itself
- destination must exist
- source and destination must be different
- merge cycles are forbidden
- destination should not itself resolve back to the source

The service layer must prevent cycles.

---

## 8.16 `postCount`

Denormalized number of currently counted posts.

Purpose:

- efficient thread lists
- pagination metadata
- forum overview

The count may exclude soft-deleted posts depending on final UI semantics.

Recommended MVP semantics:

```text
postCount = number of posts that occupy a visible discussion position,
including soft-deleted placeholders
```

This keeps pagination and sequence positions stable.

If Kurvenfunk later wants separate statistics, add:

```text
visiblePostCount
deletedPostCount
```

rather than overloading one field.

---

## 8.17 `lastPostAt`

Timestamp of the most recent post relevant to thread ordering.

Used for:

- "latest activity"
- forum thread sorting
- unread calculations
- recent discussions

When no post exists yet, this may be null.

In practice a newly created thread should normally have an initial post, so the application can create both transactionally.

---

## 8.18 `lastPostId`

Optional reference to the most recent post.

Useful for:

- "go to latest post"
- displaying latest author
- minimizing expensive lookups

This is denormalized and must remain transactionally consistent.

---

## 8.19 `createdAt`

Timestamp when the thread was created.

---

## 8.20 `updatedAt`

Timestamp when thread metadata changed.

Important:

Editing a post should not necessarily update `Thread.updatedAt`.

Thread list activity should use `lastPostAt`, not `updatedAt`.

Otherwise administrative title edits could incorrectly bump threads.

---

## 8.21 Thread creation transaction

Recommended application behavior:

Creating a thread should create:

1. `Thread`
2. initial `Post`

inside one database transaction.

Conceptually:

```text
BEGIN

create Thread
create Post(sequenceNumber = 1)
update Thread:
    postCount = 1
    lastPostId = firstPost.id
    lastPostAt = firstPost.createdAt

COMMIT
```

A normal user-facing thread without an initial post should not exist.

---

## 8.22 Thread sorting

Default forum thread ordering should conceptually be:

```text
pinned threads first
then lastPostAt DESC
```

Possible stable secondary sort:

```text
createdAt DESC
id DESC
```

The exact query belongs to later implementation.

---

# 9. Post

## 9.1 Purpose

`Post` represents a forum message inside a thread.

A post can be:

- the initial post of a thread
- a normal reply
- a reply to another post

---

## 9.2 Suggested fields

```text
Post
----
id
threadId
authorId
parentPostId?
sequenceNumber
content
deletedAt?
deletedByUserId?
editedAt?
createdAt
updatedAt
```

---

## 9.3 `id`

Stable post identifier.

Recommended:

```text
UUID
```

Used for:

- direct links
- reports
- moderation references
- read state
- quote/reply references
- notification references

---

## 9.4 `threadId`

Required parent thread.

A post always belongs to exactly one thread.

---

## 9.5 `authorId`

Original author.

A post is never anonymous at creation time.

Privacy-related anonymization after account deletion is handled separately.

---

## 9.6 `parentPostId`

Optional self-reference.

```text
NULL
→ normal top-level chronological post

postId
→ explicit reply to another post
```

This relation is primarily semantic.

The forum remains chronological rather than becoming an infinitely nested tree in the UI.

---

## 9.7 Reply rules

When `parentPostId` is present:

```text
parent.threadId == post.threadId
```

must always be true.

A post may reply to a soft-deleted post.

The UI can still show:

```text
Reply to deleted post
```

without breaking structure.

---

## 9.8 `sequenceNumber`

Thread-local immutable integer.

Example:

```text
Thread 123

Post A → 1
Post B → 2
Post C → 3
Post D → 4
```

Requirements:

- starts at 1
- strictly increasing within a thread
- unique within a thread
- immutable
- never reused
- never renumbered after deletion

Recommended logical constraint:

```text
UNIQUE(threadId, sequenceNumber)
```

---

## 9.9 Why sequence numbers are important

A timestamp alone is insufficient because multiple posts can share effectively identical timestamps.

A UUID alone does not represent order.

A thread-local sequence number gives deterministic navigation.

It enables URLs or UI anchors such as:

```text
#post-42
```

and logic such as:

```text
lastReadSequenceNumber = 120
latestSequenceNumber = 127
→ 7 newer positions
```

---

## 9.10 Sequence allocation

Sequence allocation must be concurrency-safe.

Two users posting simultaneously must never receive the same number.

The final Prisma/database implementation should use an atomic transaction strategy.

Possible implementation approaches include:

- locked thread counter
- atomic database increment
- dedicated next-sequence field
- transaction with row-level locking

The domain requirement is simply:

```text
exactly one unique sequenceNumber per post within a thread
```

---

## 9.11 `content`

User-authored post body.

MVP recommendations:

- stored in a canonical text format
- sanitized on output/input as appropriate
- length-limited
- XSS-safe
- no arbitrary raw HTML

Possible future formats:

```text
plain text
Markdown subset
structured editor JSON
```

The exact editor format is not decided by Task 073.

---

## 9.12 `deletedAt`

Soft deletion timestamp.

```text
NULL
→ active post

timestamp
→ deleted
```

The row remains available for:

- discussion structure
- moderation
- reports
- reply relationships
- audit/reference integrity

---

## 9.13 `deletedByUserId`

Optional user responsible for the current deletion state.

This may be:

- original author
- moderator
- admin

A future audit log remains the authoritative historical record.

---

## 9.14 `editedAt`

Timestamp of the latest content edit.

```text
NULL
→ never edited

timestamp
→ edited at least once
```

A later revision/history model may store prior versions.

For Task 073, only the latest edit marker is required.

---

## 9.15 `createdAt`

Original creation timestamp.

Immutable.

---

## 9.16 `updatedAt`

Technical latest row update timestamp.

Do not use this field to display the original posting time.

---

## 9.17 Soft deletion behavior

Recommended public behavior:

```text
author metadata → optionally preserved/anonymized per policy
content → hidden
placeholder → rendered
replies → preserved
sequenceNumber → preserved
```

Example:

```text
#14
This post was deleted.
```

---

## 9.18 Hard deletion

Hard deletion should be exceptional.

Possible cases:

- illegal content requiring complete removal
- privacy/legal requirement
- corrupt test data before launch

Even if content must be destroyed, preserving a tombstone record may be preferable where legally appropriate.

---

# 10. ThreadSubscription

## 10.1 Purpose

`ThreadSubscription` records that a user wants to follow a thread.

Subscription state is separate from read state.

---

## 10.2 Suggested fields

```text
ThreadSubscription
------------------
id
threadId
userId
createdAt
updatedAt
```

For the MVP, existence of the row means:

```text
subscribed = true
```

Unsubscribing deletes the subscription row.

---

## 10.3 `id`

Stable internal identifier.

Recommended:

```text
UUID
```

A composite primary key would also be technically possible, but a standalone ID keeps the entity consistent with the rest of the domain and easier to reference if needed.

---

## 10.4 `threadId`

Subscribed thread.

---

## 10.5 `userId`

Subscriber.

---

## 10.6 `createdAt`

Time subscription began.

---

## 10.7 `updatedAt`

Reserved for future subscription preference changes.

At MVP this may equal `createdAt` unless the row is updated.

---

## 10.8 Unique constraint

A user may subscribe to a thread only once.

Required logical constraint:

```text
UNIQUE(userId, threadId)
```

---

## 10.9 Future notification options

The MVP does not need notification levels in this entity.

A future extension could add:

```text
ThreadSubscriptionMode
----------------------
ALL_ACTIVITY
MENTIONS_ONLY
MUTED
```

However, platform-wide notification preferences may already cover much of this.

Avoid adding speculative complexity before notification requirements are defined.

---

## 10.10 Subscription and thread lifecycle

### Locked thread

Subscription remains.

The user may still want to know if the thread is unlocked or receives moderator activity later.

---

### Merged thread

Preferred behavior:

- subscription should migrate to the canonical destination
- duplicate subscription must be avoided
- source subscription can then be removed

This should happen transactionally during merge handling.

---

### Archived thread

Subscription may remain for historical state.

Notification delivery can simply stop if no new posts are possible.

---

# 11. ThreadReadState

## 11.1 Purpose

`ThreadReadState` stores a user's personal reading position in a thread.

It supports:

- unread thread markers
- "continue reading"
- "go to first unread"
- approximate unread count
- last-read post
- last-read sequence

---

## 11.2 Suggested fields

```text
ThreadReadState
---------------
id
threadId
userId
lastReadPostId?
lastReadSequenceNumber
lastReadAt
createdAt
updatedAt
```

---

## 11.3 `id`

Stable internal identifier.

Recommended:

```text
UUID
```

---

## 11.4 `threadId`

Thread whose read state is tracked.

---

## 11.5 `userId`

User owning the read state.

---

## 11.6 `lastReadPostId`

Optional reference to the most recently confirmed read post.

Useful for:

- direct navigation
- data integrity
- debugging
- future UI behavior

This may be null if a read state is initialized without a specific post.

---

## 11.7 `lastReadSequenceNumber`

Highest thread-local post sequence the user has confirmed as read.

Example:

```text
lastReadSequenceNumber = 53
```

If the latest post sequence is:

```text
58
```

then the user has unread positions after `53`.

---

## 11.8 Monotonic rule

Within normal reading behavior, `lastReadSequenceNumber` must be monotonic.

It should not decrease accidentally.

Example:

```text
stored = 53
incoming = 49
→ keep 53
```

This prevents stale browser tabs from moving the user's read position backwards.

---

## 11.9 `lastReadAt`

Timestamp when the server accepted the latest read-state advancement.

Useful for:

- diagnostics
- cleanup policies
- cross-device synchronization

---

## 11.10 `createdAt`

Time the read-state row was first created.

---

## 11.11 `updatedAt`

Latest technical update.

---

## 11.12 Unique constraint

Each user has at most one read-state row per thread.

Required:

```text
UNIQUE(userId, threadId)
```

---

## 11.13 Read-state semantics

A missing `ThreadReadState` means:

```text
user has no recorded reading position
```

It does not automatically mean the user has never opened the thread in every possible historical sense.

For product behavior, a thread with no read state can be considered unread for authenticated users.

---

## 11.14 Marking a thread as read

When a user reaches the latest post:

```text
lastReadSequenceNumber = latest sequence number
lastReadPostId = latest post ID
lastReadAt = now
```

The thread is then considered read until a newer post appears.

---

## 11.15 First unread post

Given:

```text
lastReadSequenceNumber = 24
```

the first unread post is the first post satisfying:

```text
sequenceNumber > 24
```

Normally:

```text
sequenceNumber = 25
```

unless unusual data repair has created a gap.

Therefore application queries should use:

```text
> lastReadSequenceNumber
```

rather than assuming exact continuity.

---

## 11.16 Unread calculation

Conceptually:

```text
thread latest sequence > user's lastReadSequenceNumber
→ unread
```

The thread may expose the latest sequence efficiently through `lastPostId` or a denormalized field.

If performance later requires it, `Thread` may add:

```text
lastPostSequenceNumber
```

This is a valid implementation optimization.

For the domain model it can already be recommended.

---

# 12. Recommended Thread Counter Extension

To support safe sequence allocation and efficient unread checks, the final database schema should strongly consider adding:

```text
Thread
------
nextPostSequence
lastPostSequenceNumber
```

or a single counter with clearly defined semantics.

Recommended semantics:

```text
lastPostSequenceNumber
```

stores the highest sequence number ever assigned.

New post transaction:

```text
newSequence = lastPostSequenceNumber + 1
```

Then update thread state atomically.

This allows:

- unique numbering
- cheap unread comparison
- efficient latest-position lookup

A physically deleted post does not decrease the value.

---

# 13. Thread Pagination

## 13.1 Pagination basis

Thread posts should use cursor-style pagination.

The natural cursor is:

```text
sequenceNumber
```

Examples:

```text
GET posts after sequence 100
GET posts before sequence 100
```

Advantages:

- stable ordering
- no expensive deep OFFSET
- deletion does not shift cursors
- new posts do not reorder previous pages

---

## 13.2 Default order

Posts are displayed:

```text
sequenceNumber ASC
```

Chronological order is authoritative.

---

## 13.3 Page numbers

The UI may still display page numbers if desired.

However, the backend should not depend on page-number/OFFSET pagination for large threads.

A page can be derived conceptually from a sequence position.

---

## 13.4 Direct post navigation

A direct link to a post should use immutable identity.

Example:

```text
/forum/thread/{threadId}/{slug}?post={postId}
```

The API can resolve the post's sequence number and load the surrounding page/window.

---

# 14. Replies

## 14.1 Reply model

Replies use:

```text
Post.parentPostId
```

No separate `ForumReply` entity is required.

---

## 14.2 Chronological presentation

Even with reply relationships, posts remain in thread chronology.

Example:

```text
#10 User A
#11 User B replies to #4
#12 User C
#13 User D replies to #11
```

The UI can display a reply reference above the post.

---

## 14.3 Avoid deep nested rendering

The data model may technically permit chains:

```text
A
└── B
    └── C
        └── D
```

but the UI should not render unlimited nested indentation.

Kurvenfunk should remain readable on mobile.

The `parentPostId` is a semantic reference, not a requirement for tree-style rendering.

---

# 15. Thread Pinning

## 15.1 Purpose

Moderators can pin important threads.

Examples:

- forum rules
- season overview
- matchday megathread
- transfer window thread

---

## 15.2 Data

Pin state uses:

```text
pinnedAt
pinnedByUserId
```

---

## 15.3 Ordering

Pinned threads should sort before normal threads.

Within pinned threads, a later product decision can choose between:

- pin timestamp
- last activity
- manual pin order

Task 073 does not require manual pin ordering.

---

## 15.4 Audit

Pin/unpin actions should later be recorded by the Audit Log model.

The `pinnedByUserId` field represents current state metadata only.

---

# 16. Thread Locking

## 16.1 Purpose

A locked thread remains readable but normally blocks new posts.

---

## 16.2 Data

```text
status = LOCKED
lockedAt
lockedByUserId
lockReason
```

---

## 16.3 Permission behavior

Normal users:

```text
post.create → denied
```

Moderators may later receive a separate capability to post in locked threads if product requirements demand it.

That policy belongs to the permission layer.

---

## 16.4 Unlock

Unlocking returns:

```text
status = OPEN
```

Current lock-state fields may be cleared.

Historical lock events belong in the audit log.

---

# 17. Thread Moving

## 17.1 Purpose

Moderators can move a thread to another forum.

---

## 17.2 Data behavior

Movement changes:

```text
Thread.forumId
```

It does not change:

```text
Thread.id
Post.threadId
Post.sequenceNumber
Thread.authorId
Thread.createdAt
```

---

## 17.3 URL stability

Because the route should contain the immutable thread ID, moving a thread should not break external URLs.

---

## 17.4 Club context change

Moving between club and non-club forums changes the thread's contextual club association indirectly.

Example:

```text
Rapid forum
→ General Bundesliga forum
```

No club ID is duplicated on `Thread`.

The current forum determines the thread's forum context.

---

## 17.5 Audit requirement

Thread moves are moderation actions and should later create an audit event.

Suggested event:

```text
forum.thread.moved
```

with:

```text
threadId
fromForumId
toForumId
actorUserId
timestamp
reason?
```

The audit entity itself belongs to Task 078.

---

# 18. Thread Merging

## 18.1 Purpose

Moderators can combine duplicate discussions.

Example:

```text
Thread A: Rapid transfer rumours
Thread B: Rapid summer transfers 2026
```

Thread A may be merged into Thread B.

---

## 18.2 Canonical model

Source:

```text
status = MERGED
mergedIntoThreadId = destination.id
```

Destination remains:

```text
OPEN
LOCKED
or ARCHIVED
```

depending on its state.

---

## 18.3 Post handling strategy

Recommended final implementation:

Move source posts into the destination thread inside a controlled transaction and assign new destination sequence numbers while preserving:

- post IDs
- author IDs
- original createdAt
- reply relationships where possible
- moderation references

This avoids maintaining two active post collections for one canonical discussion.

However, the merge process must be carefully implemented because sequence numbers are thread-local.

---

## 18.4 Merge ordering

When importing source posts into destination, chronological order should be deterministic.

Recommended ordering key:

```text
createdAt ASC
id ASC
```

New destination sequence numbers are then allocated according to the chosen merge strategy.

Existing destination post sequence numbers should ideally remain stable.

A simple safe strategy is:

```text
append source posts to destination
```

while preserving original timestamps.

This avoids renumbering destination posts.

The UI may therefore display merged historical posts after existing posts even if their original timestamp is older.

If strict historical chronology is required, a more complex model would be necessary.

For MVP stability, preserving existing destination sequence numbers is more important than perfect chronological reconstruction.

---

## 18.5 Reply relations during merge

If both parent and child posts are moved together, their IDs remain valid and `parentPostId` remains unchanged.

If a post references a parent that is not moved, the service must decide whether to:

- preserve the reference if cross-thread parent references become possible, or
- clear the reference

The preferred model invariant is:

```text
parent post must remain in same thread
```

Therefore merge logic should move relevant linked posts together or clear invalid parent references.

---

## 18.6 Subscription merge

Users subscribed to the source should become subscribed to the destination.

If already subscribed to destination:

```text
do not create duplicate
```

---

## 18.7 Read-state merge

Read state cannot be copied blindly because sequence numbers change.

Preferred behavior:

- preserve destination read state if it exists
- source read state may be retired
- after merge, the destination can be considered to contain potentially unread merged content

Exact UX can be decided in Task 216/217.

---

## 18.8 Redirect behavior

Requests for a merged source thread should resolve to the canonical destination.

Conceptually:

```text
Thread A
status = MERGED
mergedIntoThreadId = B

GET /thread/A
→ redirect /thread/B
```

---

## 18.9 Merge cycle protection

Invalid:

```text
A → B
B → A
```

Invalid:

```text
A → B
B → C
C → A
```

Service logic must ensure the destination resolves to a canonical thread and cannot create cycles.

---

# 19. Article / Forum Integration

## 19.1 Goal

Kurvenfunk should avoid creating disconnected community silos.

The product plan defines the desired conceptual flow:

```text
Article
   ↓
Discussion
   ↓
Forum context
```

Task 073 does not yet define a permanent article-to-thread mapping entity.

---

## 19.2 Recommended direction

The forum model should support future integration without embedding article-specific fields into every thread.

Possible future approaches:

### Option A – Article references a discussion thread

```text
Article.discussionThreadId?
```

### Option B – Generic content/thread relation

```text
DiscussionContext
-----------------
threadId
articleId?
matchId?
clubId?
```

### Option C – Dedicated article discussion remains comments

Article comments remain a separate system, while forum threads can be linked editorially.

---

## 19.3 Task 073 decision

Do **not** add `articleId` to `Thread` yet.

Reason:

- Article Model already has its own comment discussion model
- Task 223 explicitly addresses integration later
- premature coupling would make the forum less reusable

The forum model remains independent.

---

# 20. Reports and Moderation Integration

## 20.1 Forum reports

Task 074 defines the moderation report model.

Reports must later be able to reference forum posts.

Therefore `Post.id` must be stable and permanent enough for moderation references.

---

## 20.2 Report target

The primary reportable forum content should be:

```text
Post
```

A thread can also be reportable through its initial post or through future generic report-target support.

Task 073 does not create report fields on `Post`.

---

## 20.3 Do not add report counters as source of truth

Fields such as:

```text
reportCount
```

may later be useful as denormalized statistics but must not replace report records.

---

## 20.4 Moderation actions

Future moderation may:

- soft-delete a post
- lock a thread
- move a thread
- merge a thread
- sanction a user
- issue cards
- apply forum blocks

These belong to separate moderation/permission domains.

---

# 21. Search Integration

## 21.1 Search targets

The project plan expects Meilisearch to index forum threads and possibly posts later.

Potential search documents:

```text
Thread
Post
Forum
```

---

## 21.2 Source of truth

Search documents must always be reconstructable from PostgreSQL.

No search-only state should be required to rebuild forum behavior.

---

## 21.3 Thread search fields

Potential indexed fields:

```text
threadId
title
forumId
forumName
clubId
authorId
createdAt
lastPostAt
status
pinned
```

---

## 21.4 Post search

Post indexing can be added later.

Soft-deleted content should be removed from the public search index.

---

# 22. Notification Integration

## 22.1 Subscription notifications

`ThreadSubscription` provides the domain relationship required for future thread-reply notifications.

Possible flow:

```text
new Post
    ↓
find ThreadSubscription records
    ↓
apply notification preferences
    ↓
enqueue notification jobs
```

---

## 22.2 Avoid synchronous notification delivery

Creating a post must not synchronously send email.

The application should:

1. commit post
2. enqueue notification work
3. worker processes notifications

This follows the Kurvenfunk worker architecture.

---

## 22.3 Author exclusion

A user should normally not receive a "new post" notification for their own post.

---

## 22.4 Duplicate suppression

If many posts arrive quickly, notification logic may later aggregate events.

This belongs to the notification system, not the forum data model.

---

# 23. Counters and Denormalization

## 23.1 Why counters are useful

Forum pages require frequent statistics:

- number of threads
- number of posts
- latest activity
- latest post
- unread state

Computing all values from raw rows on every request can become expensive.

---

## 23.2 Recommended denormalized fields

### `Forum`

Potential later fields:

```text
threadCount
postCount
lastPostAt
lastPostId
```

### `Thread`

Recommended:

```text
postCount
lastPostAt
lastPostId
lastPostSequenceNumber
```

---

## 23.3 Source-of-truth principle

Denormalized counters are derived data.

They must be repairable from canonical records.

For example:

```text
Thread.postCount
```

can be recalculated from `Post`.

---

## 23.4 Transactional consistency

When creating a post, update thread metadata in the same transaction where feasible.

Conceptually:

```text
create Post
update Thread.postCount
update Thread.lastPostAt
update Thread.lastPostId
update Thread.lastPostSequenceNumber
```

---

# 24. Creation and Update Flows

## 24.1 Create forum category

```text
Admin request
    ↓
validate name/slug
    ↓
check permission
    ↓
create ForumCategory
    ↓
audit later
```

---

## 24.2 Create forum

```text
Admin request
    ↓
validate category
    ↓
validate optional club
    ↓
validate slug
    ↓
create Forum
```

---

## 24.3 Create thread

```text
Authenticated user
    ↓
AccountStatus check
    ↓
permission(thread.create)
    ↓
Forum active?
    ↓
threadCreationEnabled?
    ↓
validate title
    ↓
validate initial post
    ↓
transaction:
    create Thread
    create first Post sequence 1
    update thread counters
    ↓
enqueue search indexing
```

---

## 24.4 Create post

```text
Authenticated user
    ↓
AccountStatus check
    ↓
permission(thread.reply)
    ↓
Thread exists?
    ↓
Thread status OPEN?
    ↓
validate content
    ↓
validate optional parent post
    ↓
allocate sequence number atomically
    ↓
create Post
    ↓
update Thread counters/activity
    ↓
advance author's read state to own post
    ↓
enqueue notifications
    ↓
enqueue search index update
```

---

## 24.5 Reply to post

Additional validation:

```text
parentPost.threadId == thread.id
```

Then create a normal `Post` with:

```text
parentPostId = parent.id
```

---

## 24.6 Subscribe

```text
Authenticated user
    ↓
Thread exists?
    ↓
upsert ThreadSubscription(userId, threadId)
```

---

## 24.7 Unsubscribe

```text
delete ThreadSubscription
```

Read state remains intact.

---

## 24.8 Mark read

```text
Authenticated user
    ↓
Thread exists?
    ↓
validate requested sequence belongs to thread range
    ↓
upsert ThreadReadState
    ↓
only advance sequence, never decrease
```

---

# 25. Account Status Behavior

## 25.1 ACTIVE

Forum behavior depends on permissions.

Typical allowed actions:

```text
read
subscribe
mark read
create thread
create post
reply
```

subject to role/permission and thread/forum state.

---

## 25.2 LIMITED

Allowed:

```text
read categories
read forums
read threads
read posts
search
react where permitted
```

Blocked:

```text
thread.create
post.create
post.reply
```

Subscription behavior can remain allowed because it is not content creation.

The final permission matrix can decide whether changing subscriptions is permitted.

---

## 25.3 BANNED

Authenticated forum actions are blocked.

The forum domain does not itself revoke sessions; that belongs to the account/moderation system.

---

# 26. Role and Permission Considerations

The forum model must work with the later permission system.

Relevant planned permissions include:

```text
thread.create
thread.reply
thread.lock
```

The full forum permission set will likely need:

```text
forum.read
forum.manage

thread.create
thread.edit
thread.delete
thread.pin
thread.lock
thread.move
thread.merge

post.create
post.edit.own
post.delete.own
post.moderate
```

These are permission names, not database fields in Task 073.

---

# 27. Data Integrity Rules

The final schema/service layer must enforce the following invariants.

## 27.1 Forum hierarchy

```text
Forum.categoryId
→ existing ForumCategory
```

---

## 27.2 Club relation

```text
Forum.clubId
→ existing Club or NULL
```

---

## 27.3 Thread relation

```text
Thread.forumId
→ existing Forum
```

---

## 27.4 Thread author

```text
Thread.authorId
→ existing User
```

---

## 27.5 Post relation

```text
Post.threadId
→ existing Thread
```

---

## 27.6 Post author

```text
Post.authorId
→ existing User
```

---

## 27.7 Parent post

If:

```text
Post.parentPostId != NULL
```

then:

```text
parentPost exists
parentPost.threadId == Post.threadId
parentPost.id != Post.id
```

---

## 27.8 Sequence uniqueness

```text
UNIQUE(Post.threadId, Post.sequenceNumber)
```

---

## 27.9 Subscription uniqueness

```text
UNIQUE(ThreadSubscription.userId, ThreadSubscription.threadId)
```

---

## 27.10 Read-state uniqueness

```text
UNIQUE(ThreadReadState.userId, ThreadReadState.threadId)
```

---

## 27.11 Merge validity

If:

```text
Thread.status == MERGED
```

then:

```text
mergedIntoThreadId != NULL
```

If:

```text
mergedIntoThreadId != NULL
```

then source and destination must differ and cycles must not exist.

---

# 28. Delete and Referential Behavior

## 28.1 ForumCategory

Preferred:

```text
restrict hard delete if forums exist
```

Use `active = false`.

---

## 28.2 Forum

Preferred:

```text
restrict hard delete if threads exist
```

Use `active = false` or move threads first.

---

## 28.3 Thread

Normal user deletion should not physically delete a thread.

Potential later thread deletion state can be introduced if required.

For now moderation can:

- lock
- archive
- merge

If deletion is required later, add explicit lifecycle semantics rather than cascading post destruction.

---

## 28.4 Post

Soft delete.

Do not cascade normal user deletion into replies.

---

## 28.5 User

User deletion must not cascade-delete forum history automatically.

Later privacy handling can anonymize authorship while preserving discussion integrity where legally appropriate.

---

## 28.6 Club

Deleting a club should not silently delete its forum.

Club archival should be handled independently.

---

# 29. Timestamp Semantics

Use timezone-aware timestamps in the database.

Recommended canonical storage:

```text
UTC
```

Fields include:

```text
createdAt
updatedAt
editedAt
deletedAt
pinnedAt
lockedAt
lastPostAt
lastReadAt
```

Frontend converts to the user's locale.

---

# 30. Slug Semantics

## 30.1 Category slug

Recommended globally unique:

```text
ForumCategory.slug
```

---

## 30.2 Forum slug

Recommended globally unique:

```text
Forum.slug
```

---

## 30.3 Thread slug

Not required to be unique if thread ID is part of the URL.

This avoids unnecessary slug collision logic.

---

## 30.4 Slug changes

Thread title changes may regenerate slug.

Old URLs remain valid because the thread ID is canonical.

Forum/category slug changes may require redirect history later.

That is outside Task 073.

---

# 31. Initial Post Semantics

The first post is a normal `Post`.

Do not store a duplicate thread body directly on `Thread`.

Bad model:

```text
Thread.title
Thread.body
Post.content
```

because the first message would have two representations.

Preferred:

```text
Thread.title
Post(sequenceNumber = 1).content
```

Benefits:

- one editing model
- one moderation model
- one reporting model
- one search model
- one reply model

---

# 32. Thread Author vs First Post Author

Normally:

```text
Thread.authorId == firstPost.authorId
```

This should be required by the thread creation service.

If moderators later split/move content into a new thread, the new thread may have special provenance.

That operation should be explicitly modeled if introduced.

For normal creation, authors must match.

---

# 33. Editing

## 33.1 Thread title editing

Thread title can be editable subject to permissions and time rules.

Track:

```text
Thread.updatedAt
```

A full thread-title revision history can be added later if required.

---

## 33.2 Post editing

Post content editing sets:

```text
Post.editedAt
Post.updatedAt
```

---

## 33.3 Revision history

Task 073 does not add `PostRevision`.

If later required, a separate entity is preferable:

```text
PostRevision
------------
id
postId
editorId
content
createdAt
```

This keeps current content queries efficient.

---

# 34. Anti-Spam Compatibility

The model supports later spam protection.

Possible checks before post creation:

- rate limit
- duplicate content
- repeated links
- posting frequency
- account age
- trust level
- forum-specific restrictions

These checks belong to application services.

Do not add transient anti-spam state to `Post`.

---

# 35. Club Forum Provisioning

Task 210 requires club forums to be automatically associated with clubs.

Recommended provisioning flow:

```text
Club becomes eligible for forum
    ↓
find "Vereine" category
    ↓
create Forum
        clubId = club.id
        name = club.name
        slug = club.slug or derived forum slug
        active = true
```

Provisioning must be idempotent.

The application should avoid accidentally creating duplicate primary club forums.

This can be enforced by provisioning logic even though the core model allows multiple club-linked forums.

---

# 36. Forum Category Examples

Possible initial data:

```text
ForumCategory: Bundesliga
sortOrder: 10

ForumCategory: Vereine
sortOrder: 20

ForumCategory: Nationalteam
sortOrder: 30

ForumCategory: International
sortOrder: 40

ForumCategory: Off Topic
sortOrder: 50
```

These are product examples, not hard-coded enum values.

Categories are data, not code enums.

---

# 37. Example Domain Data

## 37.1 Category

```text
id: cat_clubs
name: Vereine
slug: vereine
sortOrder: 20
active: true
```

---

## 37.2 Club forum

```text
id: forum_rapid
categoryId: cat_clubs
clubId: club_rapid
name: SK Rapid Wien
slug: sk-rapid-wien
description: Diskussionen rund um den SK Rapid Wien.
sortOrder: 10
active: true
threadCreationEnabled: true
```

---

## 37.3 Thread

```text
id: thread_transfers_2026
forumId: forum_rapid
authorId: user_123
title: Sommertransferfenster 2026
slug: sommertransferfenster-2026
status: OPEN
pinnedAt: null
lockedAt: null
mergedIntoThreadId: null
postCount: 3
lastPostSequenceNumber: 3
```

---

## 37.4 Posts

```text
Post 1
threadId: thread_transfers_2026
authorId: user_123
parentPostId: null
sequenceNumber: 1
content: Welche Transfers erwartet ihr diesen Sommer?
```

```text
Post 2
threadId: thread_transfers_2026
authorId: user_456
parentPostId: 1
sequenceNumber: 2
content: Im Sturm wäre Verstärkung wichtig.
```

```text
Post 3
threadId: thread_transfers_2026
authorId: user_789
parentPostId: 2
sequenceNumber: 3
content: Sehe ich ähnlich.
```

---

## 37.5 Subscription

```text
userId: user_456
threadId: thread_transfers_2026
```

---

## 37.6 Read state

```text
userId: user_456
threadId: thread_transfers_2026
lastReadPostId: post_2
lastReadSequenceNumber: 2
lastReadAt: 2026-08-14T01:00:00Z
```

Latest sequence:

```text
3
```

Result:

```text
thread is unread for user_456
first unread position = sequence > 2
```

---

# 38. Entity Relationship Summary

```text
ForumCategory
    id
    name
    slug
    description?
    sortOrder
    active
    createdAt
    updatedAt

        1
        │
        │
        N

Forum
    id
    categoryId
    clubId?
    name
    slug
    description?
    sortOrder
    active
    threadCreationEnabled
    createdAt
    updatedAt

        1
        │
        │
        N

Thread
    id
    forumId
    authorId
    title
    slug
    status
    pinnedAt?
    pinnedByUserId?
    lockedAt?
    lockedByUserId?
    lockReason?
    mergedIntoThreadId?
    postCount
    lastPostAt?
    lastPostId?
    lastPostSequenceNumber
    createdAt
    updatedAt

        1
        │
        ├───────────────┬────────────────────┐
        │               │                    │
        N               N                    N
        │               │                    │

Post              ThreadSubscription    ThreadReadState
    id                id                    id
    threadId          threadId              threadId
    authorId          userId                userId
    parentPostId?     createdAt             lastReadPostId?
    sequenceNumber    updatedAt             lastReadSequenceNumber
    content                                 lastReadAt
    deletedAt?                              createdAt
    deletedByUserId?                        updatedAt
    editedAt?
    createdAt
    updatedAt
```

---

# 39. Recommended Enums

## 39.1 ThreadStatus

```text
OPEN
LOCKED
MERGED
ARCHIVED
```

No forum/category enum is required.

Forum categories are database entities.

---

# 40. Suggested Logical Indexes

Exact database indexes are finalized during Prisma schema work.

The domain strongly suggests the following access patterns.

## ForumCategory

```text
UNIQUE(slug)
INDEX(active, sortOrder)
```

---

## Forum

```text
UNIQUE(slug)
INDEX(categoryId, active, sortOrder)
INDEX(clubId)
```

---

## Thread

```text
INDEX(forumId, status, lastPostAt)
INDEX(forumId, pinnedAt, lastPostAt)
INDEX(authorId, createdAt)
INDEX(mergedIntoThreadId)
```

---

## Post

```text
UNIQUE(threadId, sequenceNumber)
INDEX(threadId, sequenceNumber)
INDEX(authorId, createdAt)
INDEX(parentPostId)
INDEX(deletedAt)
```

---

## ThreadSubscription

```text
UNIQUE(userId, threadId)
INDEX(threadId)
```

---

## ThreadReadState

```text
UNIQUE(userId, threadId)
INDEX(threadId)
INDEX(userId, updatedAt)
```

---

# 41. Concurrency Requirements

## 41.1 Simultaneous posts

The application must handle multiple posts arriving at the same time.

Required result:

```text
Post A → sequence 101
Post B → sequence 102
```

Never:

```text
Post A → sequence 101
Post B → sequence 101
```

---

## 41.2 Thread counters

`postCount`, `lastPostId`, `lastPostAt` and `lastPostSequenceNumber` must be updated atomically enough to avoid lost updates.

---

## 41.3 Read state

Read-state updates should use maximum semantics.

Conceptually:

```text
storedSequence = max(storedSequence, incomingSequence)
```

---

## 41.4 Subscription

Subscribe should be idempotent.

Concurrent duplicate subscribe requests must not create multiple rows.

The unique constraint provides the final protection.

---

# 42. Transaction Boundaries

Recommended transaction boundaries:

## Create thread

```text
Thread + initial Post + thread counters
```

---

## Create post

```text
sequence allocation
+ Post
+ Thread counters
```

---

## Merge thread

```text
destination resolution
+ post reassignment if used
+ subscription migration
+ source status
+ merge reference
```

This may require careful batching for very large threads.

---

## Move thread

Changing `forumId` itself is simple, but the later audit record should be created consistently.

---

# 43. Error Conditions

The later service/API layer should define stable error codes.

Potential domain errors:

```text
FORUM_CATEGORY_NOT_FOUND
FORUM_NOT_FOUND
FORUM_INACTIVE
FORUM_THREAD_CREATION_DISABLED

THREAD_NOT_FOUND
THREAD_LOCKED
THREAD_ARCHIVED
THREAD_MERGED
THREAD_MERGE_CYCLE
THREAD_INVALID_MERGE_TARGET

POST_NOT_FOUND
POST_PARENT_THREAD_MISMATCH
POST_SEQUENCE_CONFLICT

THREAD_SUBSCRIPTION_NOT_FOUND

THREAD_READ_POSITION_INVALID
```

These names are illustrative domain-level candidates.

---

# 44. Security Considerations

Forum content is untrusted user input.

Requirements for later implementation:

- server-side validation
- HTML sanitization
- XSS prevention
- rate limiting
- link restrictions
- spam protection
- authorization checks
- account-status checks
- report integration
- audit logging for moderator actions

Never trust frontend-only validation.

---

# 45. Privacy Considerations

Forum activity is public or semi-public community data depending on final visibility settings.

Potential personal data includes:

- user identity relationship
- authored content
- timestamps
- subscriptions
- read state

`ThreadReadState` is behavioral data and should not be exposed publicly.

`ThreadSubscription` should also be private by default unless a future product feature explicitly exposes follows.

---

# 46. Retention Considerations

## Public content

Threads and posts may need long-term retention for discussion continuity.

---

## Read state

Read state can potentially be cleaned after long periods of inactivity if required for data minimization.

A retention policy can be defined later.

---

## Subscriptions

Subscriptions should remain until:

- user unsubscribes
- account deletion/privacy cleanup
- canonical migration during merge

---

# 47. Account Deletion Compatibility

The later account-deletion process must handle forum data without destroying community structure.

Possible behavior:

```text
User removed/anonymized
Thread.author → anonymized identity representation
Post.author → anonymized identity representation
subscriptions → delete
read states → delete
```

Exact legal/privacy behavior belongs to the privacy tasks.

The forum model must not use cascading user deletion that destroys posts.

---

# 48. Moderation Card and Sanction Compatibility

Later entities may reference users because of forum content.

Example:

```text
Post
    ↓ report
ModerationReport
    ↓ moderator decision
ModerationCard / Sanction
```

The forum model only provides stable content IDs.

Do not duplicate card/sanction state on `Post`.

---

# 49. Audit Compatibility

Actions that should later create audit records include:

- category create/update/deactivate
- forum create/update/deactivate
- thread pin
- thread unpin
- thread lock
- thread unlock
- thread move
- thread merge
- moderator post deletion
- moderator post restoration if supported

Task 078 defines the audit model.

---

# 50. Notification Compatibility

Potential later events emitted from forum actions:

```text
thread.created
post.created
post.replied
thread.subscribed
thread.unsubscribed
thread.locked
thread.unlocked
thread.merged
```

These are event concepts, not fields.

---

# 51. Search Event Compatibility

Potential indexing events:

```text
thread.created
thread.updated
thread.moved
thread.merged
thread.archived

post.created
post.updated
post.deleted
```

Worker-based search indexing should process them asynchronously.

---

# 52. Future Extensibility

The model intentionally allows later additions without redesigning the foundation.

Possible future features:

- mentions
- bookmarks
- user following
- thread tags
- polls
- attachments
- quoted posts
- moderator notes
- forum-specific permissions
- private forums
- supporter-only forums
- per-thread notification modes
- post revisions
- thread split operation
- thread templates
- announcement threads

None are required for MVP Task 073.

---

# 53. Explicitly Not Included

The following are intentionally outside Task 073:

```text
ModerationReport
ModerationCard
Sanction
IpBlock
AuditLog
Notification
Reaction
PostRevision
ThreadTag
Bookmark
Mention
Poll
Attachment
```

Some may be introduced by later planned tasks.

---

# 54. Domain Decision – No Separate Reply Entity

Decision:

```text
Reply = Post with parentPostId
```

Reason:

- replies and posts share content semantics
- same moderation behavior
- same pagination
- same sequence ordering
- same author relation
- same soft-delete behavior
- simpler API
- simpler indexing

---

# 55. Domain Decision – No Body on Thread

Decision:

```text
Thread has title
First Post contains body
```

Reason:

Avoid duplicate discussion content models.

---

# 56. Domain Decision – Subscription Separate from Read State

Decision:

```text
ThreadSubscription
!=
ThreadReadState
```

Reason:

Following a thread and reading a thread are independent behaviors.

---

# 57. Domain Decision – Forum Category Is Data

Decision:

Do not define categories as an enum.

Reason:

Administrators may later:

- add categories
- rename categories
- reorder categories
- deactivate categories

without deploying code.

---

# 58. Domain Decision – Club Relation Lives on Forum

Decision:

```text
Forum.clubId?
```

rather than:

```text
Thread.clubId
Post.clubId
```

Reason:

Club context belongs to the forum container.

This prevents duplicated and potentially inconsistent club relations.

---

# 59. Domain Decision – Sequence Number Per Thread

Decision:

Every post receives:

```text
sequenceNumber
```

unique within its thread.

Reason:

This is foundational for:

- unread state
- stable ordering
- pagination
- direct navigation
- concurrency-safe discussion position

---

# 60. Domain Decision – Merged Threads Remain Addressable

Decision:

A merged source thread remains as a record with:

```text
status = MERGED
mergedIntoThreadId = destination
```

Reason:

- stable old links
- redirect support
- moderation history
- search cleanup
- no silent disappearance

---

# 61. Domain Decision – Moving Does Not Duplicate Context

Decision:

Thread movement changes:

```text
forumId
```

No separate "originalForumId" is required in the current thread entity.

Historical movement belongs to the audit log.

---

# 62. Domain Decision – Lock State on Thread

Decision:

Current lock state belongs directly to the thread.

Reason:

Every post-creation request must be able to check it efficiently.

Historical lock actions belong to audit.

---

# 63. Domain Decision – Pin State on Thread

Decision:

Current pin state belongs directly to the thread.

Reason:

Forum listings need to sort/filter pinned threads efficiently.

---

# 64. Domain Decision – Soft Delete Posts

Decision:

Forum posts use soft deletion.

Reason:

- preserve reply structure
- preserve sequence numbering
- preserve moderation references
- avoid broken thread navigation

---

# 65. Domain Decision – No Cascading Community Deletion

Decision:

Deleting or deactivating structural entities must not casually cascade into forum content.

Reason:

Forum content is interconnected and may have:

- replies
- reports
- sanctions
- audit events
- subscriptions
- external URLs

---

# 66. MVP Field Summary

## ForumCategory

Required:

```text
id
name
slug
sortOrder
active
createdAt
updatedAt
```

Optional:

```text
description
```

---

## Forum

Required:

```text
id
categoryId
name
slug
sortOrder
active
threadCreationEnabled
createdAt
updatedAt
```

Optional:

```text
clubId
description
```

---

## Thread

Required:

```text
id
forumId
authorId
title
slug
status
postCount
lastPostSequenceNumber
createdAt
updatedAt
```

Optional/current-state metadata:

```text
pinnedAt
pinnedByUserId
lockedAt
lockedByUserId
lockReason
mergedIntoThreadId
lastPostAt
lastPostId
```

---

## Post

Required:

```text
id
threadId
authorId
sequenceNumber
content
createdAt
updatedAt
```

Optional:

```text
parentPostId
deletedAt
deletedByUserId
editedAt
```

---

## ThreadSubscription

Required:

```text
id
threadId
userId
createdAt
updatedAt
```

---

## ThreadReadState

Required:

```text
id
threadId
userId
lastReadSequenceNumber
lastReadAt
createdAt
updatedAt
```

Optional:

```text
lastReadPostId
```

---

# 67. Required Unique Constraints

The later database schema should enforce at least:

```text
ForumCategory.slug
Forum.slug

(Post.threadId, Post.sequenceNumber)

(ThreadSubscription.userId, ThreadSubscription.threadId)

(ThreadReadState.userId, ThreadReadState.threadId)
```

---

# 68. Required Service-Level Invariants

Some rules cannot be expressed cleanly with simple database constraints and must be enforced by services.

These include:

```text
parentPost.threadId == childPost.threadId

mergedIntoThreadId != thread.id

merge graph contains no cycles

thread creation creates an initial post

thread.authorId == initialPost.authorId for normal creation

read sequence never moves backwards

new posts cannot be created in LOCKED/MERGED/ARCHIVED threads
unless a privileged explicit workflow allows it
```

---

# 69. Recommended Prisma Preparation Notes

Task 081 will translate this domain into Prisma.

Likely relation considerations:

- named self-relations for `Post.parentPost`
- named self-relation for `Thread.mergedIntoThread`
- multiple `User` relations from Thread/Post moderator metadata
- unique composite keys for subscriptions/read states
- composite unique key for post sequence numbers
- indexes for forum/thread listing
- explicit delete behavior

Prisma implementation must avoid ambiguous relation names.

---

# 70. Recommended Migration Preparation Notes

The initial migration should create the domain in dependency order.

Conceptually:

```text
ForumCategory
    ↓
Forum
    ↓
Thread
    ↓
Post
    ↓
ThreadSubscription
ThreadReadState
```

Self-relations and foreign keys must be added carefully.

The exact migration belongs to Task 082.

---

# 71. Recommended Seed Preparation

Task 083 can seed forum structure such as:

```text
Bundesliga
Vereine
Nationalteam
International
Off Topic
```

and create club forums for seeded Bundesliga clubs.

Example:

```text
Vereine
 ├── SK Rapid Wien
 ├── FK Austria Wien
 ├── SK Sturm Graz
 └── ...
```

Test threads should include:

- open thread
- locked thread
- pinned thread
- replies
- subscription
- unread state

---

# 72. Acceptance Checklist

Task 073 is considered domain-complete when all required entities and core relationships are defined.

## Required entities

- [x] `ForumCategory`
- [x] `Forum`
- [x] `Thread`
- [x] `Post`
- [x] `ThreadSubscription`
- [x] `ThreadReadState`

---

## Required forum capabilities

- [x] category organization
- [x] club-specific forums
- [x] general forums
- [x] thread creation model
- [x] post creation model
- [x] replies
- [x] stable post ordering
- [x] cursor-friendly pagination
- [x] subscriptions
- [x] unread tracking
- [x] last-read position
- [x] pinning
- [x] locking
- [x] moving
- [x] merging
- [x] soft deletion
- [x] moderation references
- [x] future notification compatibility
- [x] future search compatibility
- [x] future article/forum integration compatibility

---

## Cross-domain rules

- [x] role and status remain separate
- [x] LIMITED write restrictions can be enforced
- [x] BANNED restrictions can be enforced
- [x] PostgreSQL remains source of truth
- [x] forum data does not duplicate club context unnecessarily
- [x] moderation/report models remain separate
- [x] audit history remains separate
- [x] notifications remain separate

---

# 73. Final Domain Model

The final Task 073 domain is:

```text
ForumCategory
    │
    └── Forum
         │
         ├── optional Club
         │
         └── Thread
              │
              ├── author User
              ├── optional merged destination Thread
              │
              ├── Post
              │    ├── author User
              │    └── optional parent Post
              │
              ├── ThreadSubscription
              │    └── User
              │
              └── ThreadReadState
                   └── User
```

Core forum behavior is built on the following principles:

```text
Category
→ Forum
→ Thread
→ chronological Posts

Post sequence numbers
→ stable pagination
→ unread tracking
→ last-read navigation

ThreadSubscription
→ follow discussion

ThreadReadState
→ personal read position

Forum.clubId
→ club forum integration

Thread status/current-state metadata
→ lock
→ archive
→ merge

Thread.forumId
→ movement

Soft-deleted Post
→ preserved discussion structure
```

This model provides the required foundation for the later implementation of Kurvenfunk forum tasks 209–223 while remaining compatible with the existing User, Club, Moderation, Notification, Search and Audit domains.

---

## 74. Task Result

**Task 073 – Forum Model: DOMAIN MODEL COMPLETE**

Defined:

```text
ForumCategory
Forum
Thread
Post
ThreadSubscription
ThreadReadState
```

Prepared for:

```text
Task 074 – Moderation Report Model
...
Task 081 – Prisma Schema
Task 082 – Initial Migration
...
Task 209–223 – Forum implementation
```

No Prisma schema or migration is created as part of Task 073.
