# Comment Domain Model

**Project:** Kurvenfunk
**Task:** 071 – Comment Model
**Status:** Domain model defined
**Target:** `docs/database/comment-model.md`

## 1. Purpose

The Comment domain represents article discussions in Kurvenfunk.

Comments are community content attached to Articles. The domain must
support article references, authors, replies, soft deletion, edit
history, and moderation while preserving discussion structure and
historical integrity.

The concrete Prisma schema is intentionally deferred to Task 081. The
initial migration is intentionally deferred to Task 082.

## 2. Goals

The model must:

-   attach every comment to exactly one Article
-   associate comments with their Kurvenfunk author while the account
    exists
-   preserve comments when an account is deleted where legally and
    product-wise appropriate
-   support replies through a parent relation
-   preserve a stable discussion tree
-   allow presentation depth to be limited independently of technical
    reply relationships
-   support user edits without losing previous versions
-   support soft deletion without destroying reply context
-   distinguish user deletion from moderation actions
-   support moderation without coupling Comment to the later Report,
    Card, Sanction, or Audit implementations
-   prepare efficient cursor pagination and sorting
-   remain compatible with later Reaction and Moderation Report models
-   keep PostgreSQL as the source of truth

## 3. Non-Goals

Task 071 does not implement:

-   Prisma models or migrations
-   comment API endpoints
-   permission guards
-   rate limiting or spam detection
-   reactions
-   moderation reports
-   cards or sanctions
-   audit log storage
-   notifications
-   frontend rendering
-   Meilisearch indexing

Those concerns belong to their designated later tasks.

## 4. Core Entities

The Comment domain contains two canonical entities:

```text
Comment
CommentRevision
```

`Comment` stores the current canonical state.

`CommentRevision` stores immutable historical content created by edits.

This separation prevents the canonical Comment row from becoming an
append-only history container while still preserving an edit trail.

## 5. Comment Entity

### Comment

  --------------------------------------------------------------------------------
  Field            Type                          Required Meaning
  ---------------- ---------------- --------------------- ------------------------
  `id`             UUID                               yes Immutable internal
                                                          Comment identifier

  `articleId`      UUID                               yes Article to which the
                                                          Comment belongs

  `authorId`       UUID                       conditional Authoring User; may
                                                          become null after
                                                          account
                                                          anonymization/deletion

  `parentId`       UUID                                no Direct parent Comment
                                                          for a reply

  `body`           Text                 yes while visible Current canonical
                                                          comment body

  `depth`          Integer                            yes Persisted technical
                                                          depth of the reply
                                                          within its Article tree

  `status`         CommentStatus                      yes Current
                                                          lifecycle/visibility
                                                          state

  `editedAt`       DateTime                            no Timestamp of the most
                                                          recent successful edit

  `deletedAt`      DateTime                            no Timestamp of user/system
                                                          soft deletion where
                                                          applicable

  `moderatedAt`    DateTime                            no Timestamp of the latest
                                                          moderation removal
                                                          action where applicable

  `createdAt`      DateTime                           yes Creation timestamp

  `updatedAt`      DateTime                           yes Latest persisted state
                                                          change
  --------------------------------------------------------------------------------

The exact Prisma names may be refined in Task 081, but the semantics
defined here are authoritative.

## 6. Comment Identity

`Comment.id` is the stable internal identity of a comment.

It must not depend on:

-   Article slug
-   author nickname
-   display position
-   parent position
-   reaction count
-   external provider data

A Comment ID remains stable across:

-   edits
-   soft deletion
-   moderation
-   nickname changes
-   Article slug changes
-   sorting changes

UUID is the intended identifier type.

## 7. Article Relation

Every Comment belongs to exactly one canonical Article.

```text
Article 1 ──────── * Comment
```

Rules:

1.  `articleId` is required.
2.  A Comment cannot exist without Article context.
3.  Replies remain attached to the same Article as their ancestors.
4.  Moving an individual Comment to another Article is not a normal
    domain operation.
5.  Deleting or archiving an Article must not accidentally orphan
    Comment rows.
6.  Article discussion availability is a product/API concern and does
    not change the Comment ownership relation.

The Article model already establishes Comments as separate entities that
reference Article.

## 8. Author Relation

A newly created Comment has exactly one authenticated Kurvenfunk User as
its author.

```text
User 1 ──────── * Comment
```

At creation:

```text
authorId = authenticated User.id
```

Anonymous guest comments are not part of the initial model.

The author relation may later become nullable as part of account
deletion/anonymization. This allows community discussions to remain
structurally intact without retaining an unnecessary direct account
reference.

The public representation of an anonymized author should use a neutral
label such as:

```text
Deleted user
```

The literal frontend wording is not stored as canonical Comment data.

## 9. Author Snapshot Policy

The Comment does not store a duplicated nickname as canonical author
identity.

The normal display name is resolved from the current User/Profile
domain.

This means nickname changes may be reflected on historical comments.

If future legal, moderation, or historical requirements require an
immutable author snapshot, that must be introduced explicitly rather
than duplicating identity data prematurely.

## 10. Replies

Replies use a self-referencing parent relation.

```text
Comment
   │
   ├── parentId = null
   │      ↓
   │   root comment
   │
   └── parentId = Comment.id
          ↓
       reply
```

A root Comment has:

```text
parentId = null
depth = 0
```

A direct reply to a root Comment has:

```text
depth = 1
```

Further replies increment technical depth.

## 11. Parent Integrity

A parent Comment must satisfy all of the following:

-   exist
-   belong to the same Article
-   not be the Comment itself
-   not create a cycle
-   represent a valid ancestor relationship

Invalid:

```text
Comment A → parent Comment B
Comment B → parent Comment A
```

Invalid:

```text
Article A / Comment X
        ↓ reply
Article B / Comment Y
```

The application/database implementation must preserve same-Article
hierarchy integrity.

## 12. Root Comment

A root Comment is defined by:

```text
parentId = null
```

No separate root-comment entity is required.

The tree root can be derived by traversing parent relations.

A future implementation may introduce a denormalized `rootId` if
measurements show a real query/performance benefit, but Task 071 does
not require it.

## 13. Comment Depth

The technical model supports nested replies.

The UI must not be forced to visually indent every technical level.

Example:

```text
Comment A
└── Comment B
    └── Comment C
        └── Comment D
            └── Comment E
```

Kurvenfunk may render deeper replies at a capped visual indentation
while preserving the true parent relation.

Therefore:

```text
technical reply depth != visual indentation depth
```

This prepares Task 164.

## 14. Persisted Depth

`depth` is stored as a denormalized integer to simplify:

-   validation
-   rendering decisions
-   query behavior
-   moderation context
-   protection against pathological nesting

It must always agree with the parent hierarchy.

For a root:

```text
depth = 0
```

For a reply:

```text
depth = parent.depth + 1
```

The exact maximum allowed technical depth is a later application rule
and should be configurable rather than embedded in the conceptual model.

## 15. Comment Body

`body` contains the current canonical user-visible comment content.

The initial Comment domain should assume plain user-generated textual
content with controlled formatting handled by the application.

The body must never be treated as trusted HTML.

Later input handling must provide:

-   validation
-   normalization
-   length limits
-   XSS-safe rendering
-   link rules
-   spam protection

These are implementation concerns, but the domain assumes that persisted
content has passed server-side validation.

## 16. Content Format

Task 071 does not require a rich-text document model.

The initial Comment body should remain simple.

If future formatting is supported, it should use an explicitly defined
safe representation rather than arbitrary stored HTML.

Article editor content and Comment content are separate concerns.

## 17. Comment Status

A Comment requires an explicit lifecycle/visibility state.

Initial conceptual enum:

```text
VISIBLE
DELETED
MODERATED
```

### VISIBLE

Normal comment.

The body may be displayed according to permissions and product rules.

### DELETED

The author or an authorized system operation soft-deleted the Comment.

The row remains stored.

### MODERATED

The Comment was removed from normal public visibility through
moderation.

The row remains stored for moderation, audit, report, and structural
purposes.

## 18. Why Status Is Explicit

A single nullable `deletedAt` is insufficient because Kurvenfunk must
distinguish:

-   normal visible content
-   author deletion
-   moderator removal

Those states have different:

-   permissions
-   audit requirements
-   user messaging
-   retention implications
-   moderation implications

Therefore deletion and moderation are not represented as one ambiguous
boolean.

## 19. Soft Delete

Comment deletion is soft deletion.

A deleted Comment row is not immediately physically removed.

Example:

```text
Comment A
└── Comment B
    └── Comment C
```

If Comment B is deleted, Comment C must not disappear merely because its
parent was deleted.

The discussion can instead render:

```text
Comment A
└── [deleted]
    └── Comment C
```

This is one of the main reasons hard deletion is inappropriate for
normal comment deletion.

## 20. User-Initiated Deletion

When an author deletes their own Comment under the later defined rules:

```text
status = DELETED
deletedAt = now
```

The canonical row remains.

Public output should no longer expose the deleted body.

Whether the original body is retained for a limited period, moved into
revision/history storage, or erased immediately is a privacy/retention
decision to be finalized with Tasks 246--251.

The domain must not rely on deleted content remaining publicly
available.

## 21. Deleted Placeholder

Placeholder text such as:

```text
This comment was deleted.
```

is presentation data.

It should not replace the canonical body with a translated UI string.

The API/frontend derives the appropriate placeholder from Comment state.

## 22. Moderator Removal

Moderator removal is different from author deletion.

A moderation action sets the Comment to the moderation state:

```text
status = MODERATED
moderatedAt = now
```

The actual moderator identity, reason, report, sanction, and audit event
do not belong as loosely duplicated fields on Comment.

They are represented by the dedicated moderation/report/audit domains
defined in later tasks.

## 23. Moderated Placeholder

A moderated Comment may be rendered as a neutral placeholder while
retaining replies.

For example:

```text
Comment A
└── [removed by moderation]
    └── Comment C
```

The exact public wording belongs to the frontend/product layer.

## 24. Moderation Does Not Destroy Structure

Moderation must not destroy discussion hierarchy.

A removed parent can still be necessary to preserve:

-   reply relationships
-   context
-   report evidence
-   moderation history
-   pagination stability

Therefore moderation is primarily a visibility/lifecycle transition, not
physical deletion.

## 25. Restoration

The domain should permit an authorized restoration operation where
policy allows it.

Possible transitions include:

```text
VISIBLE → DELETED
VISIBLE → MODERATED
MODERATED → VISIBLE
```

Restoring user-deleted content may have different privacy implications
and should not automatically be allowed merely because moderator
restoration exists.

Transition permissions are defined later.

## 26. Edit Support

A visible Comment may be edited according to later product and
permission rules.

Editing changes the current canonical `body`.

After a successful edit:

```text
editedAt = now
updatedAt = now
```

The public UI can derive:

```text
edited = editedAt != null
```

A redundant permanent `isEdited` boolean is therefore not required.

## 27. Edit History

Every accepted content edit must preserve the previous canonical content
in a separate immutable revision.

```text
Comment
   │
   └── CommentRevision
       CommentRevision
       CommentRevision
```

This supports:

-   moderation review
-   abuse investigation
-   edit transparency
-   debugging
-   future policy requirements

## 28. CommentRevision Entity

### CommentRevision

  ------------------------------------------------------------------------
  Field            Type                          Required Meaning
  ---------------- ---------------- --------------------- ----------------
  `id`             UUID                               yes Immutable
                                                          revision
                                                          identifier

  `commentId`      UUID                               yes Comment whose
                                                          previous state
                                                          is recorded

  `body`           Text                               yes Historical body
                                                          content

  `createdAt`      DateTime                           yes Timestamp when
                                                          the revision was
                                                          captured
  ------------------------------------------------------------------------

The revision represents a previous body state.

It is not independently publishable community content.

## 29. Revision Creation Rule

The intended edit transaction is conceptually:

```text
BEGIN

read current Comment.body

create CommentRevision(
  commentId,
  old body
)

update Comment.body = new body
update Comment.editedAt

COMMIT
```

The revision and canonical update must succeed atomically.

An edit must not produce a revision without the corresponding Comment
update, or update the Comment without preserving the previous version.

## 30. Immutable Revisions

A CommentRevision is immutable after creation.

Normal application flows must not:

-   edit a revision
-   reassign it to another Comment
-   use it as the canonical current Comment
-   expose it as if it were a normal reply

Retention/privacy operations may eventually remove historical content
where required by policy or law.

## 31. Initial Version

The initial Comment body does not need a separate revision row at
creation.

The current Comment row represents the current version.

A revision is created when the current version is replaced by an edit.

Example:

```text
Create:
Comment.body = Version 1
no revision

Edit:
Revision.body = Version 1
Comment.body = Version 2

Edit:
Revision.body = Version 2
Comment.body = Version 3
```

This avoids unnecessary duplication.

## 32. No-Op Edits

An edit that produces no meaningful content change should not create a
revision.

Normalization rules can be applied before comparing old and new content.

The exact normalization algorithm belongs to the later Comment service.

## 33. Edit Permissions Boundary

Task 071 defines that editing exists, not who may edit under every
circumstance.

Task 165 later defines the operational rules.

Expected baseline:

-   users edit only their own eligible Comments
-   LIMITED users cannot create new community content; exact handling of
    editing existing content must be explicitly decided by the
    permission layer
-   BANNED users cannot perform authenticated community actions
-   moderators should use moderation operations rather than
    impersonating author edits

Role and account status remain separate concepts.

## 34. Comment Creation and Account Status

The later permission layer must enforce the project-wide status rules.

Expected behavior from the project plan:

```text
ACTIVE  → comment creation allowed when permission is granted
LIMITED → comment creation prohibited
BANNED  → comment creation prohibited
```

Task 071 does not implement this guard.

It defines the Comment domain so Task 162 can apply the rule centrally.

## 35. Reply Creation and Account Status

Replies are Comments and follow the same creation permission principle.

Expected behavior:

```text
ACTIVE  → replies allowed when permission is granted
LIMITED → replies prohibited
BANNED  → replies prohibited
```

No separate Reply entity is required.

## 36. Reply Is a Comment

Kurvenfunk does not model a reply as a different content type.

A reply is simply:

```text
Comment.parentId != null
```

This keeps:

-   editing
-   deletion
-   moderation
-   reactions
-   reports
-   pagination metadata

consistent across root comments and replies.

## 37. Reactions Boundary

Reactions do not belong directly inside the Comment row.

Task 072 defines the Reaction model.

Conceptually:

```text
Comment 1 ──────── * Reaction
User    1 ──────── * Reaction
```

The Comment model must not store authoritative arrays of users who liked
a Comment.

Reaction counts may later be derived or denormalized for performance,
but PostgreSQL Reaction records remain authoritative.

## 38. LIMITED Voting

The project-wide rule explicitly allows LIMITED users to vote/react.

Therefore Comment visibility and Comment creation permissions must not
be conflated with Reaction permissions.

Expected later behavior:

```text
ACTIVE  → vote allowed
LIMITED → vote allowed
BANNED  → vote prohibited
```

This is implemented in Task 167 and the central permission system.

## 39. Reports Boundary

Reports are modeled separately in Task 074.

A Moderation Report must be able to reference a Comment without
embedding report lifecycle fields into Comment.

Conceptually:

```text
Comment 1 ──────── * ModerationReport
```

Comment must not contain fields such as:

```text
reportReason
reportedBy
reportStatus
```

Those belong to the Report domain.

## 40. Moderation Cards Boundary

Yellow and red cards target users and may reference offending content.

They are not Comment lifecycle fields.

Task 075 defines `ModerationCard`.

A Comment may later be referenced as related moderation content, but
Comment must not contain card counters or sanction state.

## 41. Sanction Boundary

Sanctions such as:

```text
LIMITED
COMMENT_BLOCK
FORUM_BLOCK
ACCOUNT_BAN
IP_BLOCK
```

belong to Task 076.

Comment does not store a user's sanction state.

The permission layer evaluates the User and active sanctions before
allowing Comment operations.

## 42. Audit Boundary

Critical moderation operations must later create Audit Log events.

Comment stores its current domain state.

Audit records store who performed sensitive administrative/moderation
actions and relevant metadata.

Do not overload Comment with a generic mutable audit blob.

Task 078 defines the Audit Log model.

## 43. Notifications Boundary

A reply may later trigger a notification.

For example:

```text
comment_reply
```

Notification delivery and state belong to Task 079 and the later
notification implementation.

Comment creation must not depend on successful synchronous notification
delivery.

Notifications should be handled asynchronously where appropriate.

## 44. Account Deletion

Account deletion must not automatically hard-delete all Comments because
doing so could destroy community discussions and reply trees.

The planned strategy is anonymization where legally and product-wise
appropriate.

Conceptually:

```text
User deleted
     ↓
Comment remains
     ↓
authorId becomes null / anonymized relation
     ↓
public author becomes "Deleted user"
```

The final privacy workflow is defined in Task 251.

## 45. Anonymized Comments

An anonymized Comment must not expose deleted account identity through
copied fields.

Therefore the Comment model should avoid unnecessary permanent
duplication of:

-   nickname
-   email
-   Keycloak subject
-   IP address
-   profile data

Moderation/security data has separate retention rules.

## 46. IP Data

Comment does not require a permanent raw IP address field.

IP-based protection belongs to the security/moderation infrastructure.

Where IP-derived information is needed, the project intends to use keyed
HMAC pseudonymization where possible.

IP retention is defined separately.

Comment content should not become a repository of network-identifying
data.

## 47. Created Timestamp

`createdAt` records when the Comment was created.

It is immutable.

Editing must not change `createdAt`.

Sorting by newest/oldest uses creation order rather than edit time.

## 48. Updated Timestamp

`updatedAt` records the latest persisted Comment state change.

It may change because of:

-   content edit
-   deletion
-   restoration
-   moderation state transition

Public chronological sorting should generally use `createdAt`, not
`updatedAt`.

## 49. Edited Timestamp

`editedAt` specifically identifies the most recent successful body edit.

This is different from `updatedAt`.

Example:

```text
createdAt   = 10:00
editedAt    = 10:10
updatedAt   = 10:30
moderatedAt = 10:30
```

The moderation action changed the row but did not constitute a content
edit.

## 50. Deleted Timestamp

`deletedAt` is set when the Comment enters the user/system soft-deleted
state.

It is not a replacement for the explicit status.

Both together provide:

-   state
-   transition timing

## 51. Moderated Timestamp

`moderatedAt` records the relevant moderation removal time.

It does not identify the moderator or explain the reason.

Those facts belong to moderation/audit entities.

## 52. Status Transitions

Expected conceptual transitions:

```text
create
  ↓
VISIBLE
  ├── edit ─────────────→ VISIBLE
  ├── user delete ──────→ DELETED
  └── moderator remove ─→ MODERATED

MODERATED
  └── authorized restore → VISIBLE
```

Additional policy-specific transitions may be defined later.

Transition authorization must be centralized.

## 53. Hard Deletion

Hard deletion is not a normal user-facing Comment operation.

Physical deletion may eventually occur for:

-   legal requirements
-   privacy retention cleanup
-   test data cleanup
-   administrative maintenance
-   data integrity remediation

Such deletion must account for descendants, revisions, reactions,
reports, and audit requirements.

## 54. Parent Deletion

Deleting a parent Comment must not cascade-delete its children.

This is a critical invariant.

Conceptually:

```text
Parent Comment soft deleted
        ↓
Children remain
        ↓
Tree remains navigable
```

The eventual database relation must not use destructive cascading
behavior for normal Comment deletion.

## 55. Article Deletion

Article lifecycle behavior is controlled by the Article domain.

Normal Article archive/soft-delete behavior should preserve Comments.

If an Article is physically purged as part of a deliberate retention
operation, dependent Comment handling must be explicitly coordinated.

No accidental database cascade should define product retention policy.

## 56. Revision Deletion

Normal Comment soft deletion does not automatically imply immediate
physical deletion of all CommentRevision records.

However, revision retention can contain historical user-generated
content and therefore requires an explicit privacy retention policy.

Task 249/251 and related privacy work must finalize this.

## 57. Sorting

Task 168 requires:

```text
Newest
Oldest
Popular
```

The domain must support all three.

### Newest

Primarily ordered by:

```text
createdAt DESC
id DESC
```

### Oldest

Primarily ordered by:

```text
createdAt ASC
id ASC
```

### Popular

Popularity depends on Reaction data from Task 072.

The exact ranking algorithm is intentionally not defined here.

## 58. Stable Ordering

Sorting requires deterministic tie-breaking.

Timestamp alone is insufficient because multiple Comments may share the
same timestamp precision.

A stable secondary key such as immutable Comment ID must be used.

This is especially important for cursor pagination.

## 59. Pagination

Task 169 requires cursor-based pagination.

Offset pagination should not be the default for large active discussions
because new Comments can shift result positions.

Expected cursor components depend on sort mode.

Examples:

```text
Newest:
(createdAt, id)

Oldest:
(createdAt, id)
```

Popularity cursors will depend on the later popularity ranking
definition.

## 60. Threaded Pagination

Threaded comments make pagination more complex than a flat list.

The initial recommended boundary is:

-   paginate root Comments
-   load/render replies in the context of their root thread
-   preserve deterministic reply ordering

This prevents a page boundary from arbitrarily separating top-level
discussions.

The exact API query strategy belongs to Tasks 168--169.

## 61. Reply Ordering

Replies should have deterministic ordering.

Chronological ascending order is the safest initial behavior within a
reply branch:

```text
createdAt ASC
id ASC
```

Popularity sorting of root Comments does not require independently
reordering every nested reply.

## 62. Counts

Article pages may need:

-   total visible comment count
-   reply count
-   reaction count

The canonical model should not prematurely make mutable counters
authoritative.

Counts can initially be queried from canonical rows.

If performance later requires denormalized counters, they must be
treated as derived values with clear consistency rules.

## 63. Deleted and Moderated Counts

Product analytics may distinguish:

-   visible Comments
-   deleted Comments
-   moderated Comments

Public `commentCount` should have a clearly defined meaning.

It should not silently alternate between all stored rows and publicly
visible discussion entries.

The exact public counting rule is an API/product decision.

## 64. Index Requirements

The eventual Prisma/database implementation should support indexes for
common access patterns.

At minimum, evaluate indexes equivalent to:

```text
Comment(articleId, createdAt, id)
Comment(parentId, createdAt, id)
Comment(authorId, createdAt)
Comment(articleId, status, createdAt, id)
Comment(status)
CommentRevision(commentId, createdAt)
```

The final index definitions belong to Task 081 and database performance
work.

## 65. Article Discussion Query

The dominant read path is expected to begin with:

```text
articleId
```

Therefore `Comment.articleId` must be indexed.

The project plan explicitly identifies `Comment.articleId` and
`Comment.createdAt` as important database index targets.

## 66. Parent Query

Fetching replies requires efficient lookup by:

```text
parentId
```

Therefore the parent relation must be indexed.

## 67. Author Query

Profile/community activity may later show a User's Comment activity.

Therefore `authorId` should support efficient lookup.

Nullable anonymized author relations must be handled correctly.

## 68. Revision Query

Moderation/history inspection requires efficient retrieval of revisions
for one Comment.

Expected ordering:

```text
createdAt ASC
```

or descending depending on the UI.

`commentId` must be indexed.

## 69. Concurrency

Comment edits and moderation can occur concurrently.

The implementation must prevent silent loss of state.

Examples:

-   user edits while moderator removes Comment
-   two edit requests arrive nearly simultaneously
-   deletion races with edit
-   restoration races with moderation

Task 071 does not mandate a specific locking mechanism, but the
service/database layer must use transactional and/or optimistic
concurrency techniques where needed.

## 70. Atomic Editing

Revision creation and current-body replacement must be atomic.

This is a hard domain requirement.

A failed edit must leave either:

```text
old Comment + no new revision
```

or:

```text
new Comment + corresponding revision
```

Never an inconsistent half-state.

## 71. Atomic Reply Creation

Creating a reply must validate the parent and derive its depth from the
same valid parent state.

The application must not trust a client-supplied `articleId`/`depth`
combination without server-side verification.

## 72. Client-Controlled Fields

Clients must not be allowed to arbitrarily set:

-   `authorId`
-   `status`
-   `depth`
-   `editedAt`
-   `deletedAt`
-   `moderatedAt`
-   `createdAt`
-   `updatedAt`

These values are determined by authenticated context and domain logic.

Clients may provide eligible user input such as:

```text
body
parentId
```

The Article context comes from the endpoint/domain operation and must be
validated.

## 73. Validation Expectations

Later Comment validation should define:

-   minimum content length
-   maximum content length
-   whitespace normalization
-   empty-content rejection
-   supported links
-   prohibited payload patterns where appropriate
-   safe Unicode handling

Exact limits should be configurable/product-defined rather than invented
in Task 071.

## 74. Spam Protection Boundary

Task 171 handles spam protection.

Expected mechanisms include:

-   rate limiting
-   duplicate-spam detection
-   link limits
-   posting-frequency limits

These are not persisted as ad hoc Comment flags unless a later
requirement demonstrates a need.

Spam decisions with moderation significance should integrate with
moderation/audit domains.

## 75. Search Boundary

The initial project plan indexes Articles, Clubs, Threads, and
potentially Forum Posts in Meilisearch.

Comment search is not currently a required search index.

PostgreSQL remains authoritative regardless of future Comment indexing.

## 76. Cache Boundary

Redis may cache derived Comment views or counts later.

Redis must never become the source of truth for:

-   Comment body
-   hierarchy
-   edit history
-   deletion state
-   moderation state

All authoritative state remains reconstructable from PostgreSQL.

## 77. Forum Boundary

Article Comments and Forum Posts are separate entities.

```text
Article discussion → Comment
Forum thread       → Post
```

They may share:

-   permission concepts
-   reactions
-   reports
-   moderation infrastructure
-   UI patterns

They should not be collapsed into one polymorphic content table solely
to avoid duplication.

Their lifecycle and query patterns are sufficiently distinct.

## 78. Article / Forum Integration

The product goal is for article discussions and forum context to feel
connected.

That product integration does not require Comments to become Forum
Posts.

Task 223 may connect the experiences at the application level while
preserving clear domain entities.

## 79. Moderation Context

Moderators need enough context to review a Comment.

The canonical Comment provides:

-   current content
-   author relation where available
-   Article relation
-   parent relation
-   timestamps
-   lifecycle state

Dedicated related domains provide:

-   reports
-   cards
-   sanctions
-   audit history
-   moderator notes

This keeps responsibilities separated.

## 80. Historical Context

Soft-deleted or moderated Comments may remain necessary for
understanding descendant replies.

The model therefore prioritizes structural continuity.

Example:

```text
Visible root
└── Moderated reply
    └── Visible reply
```

The descendant remains valid.

## 81. Content Exposure

Persisting content does not imply that every caller may read it.

For `DELETED` or `MODERATED` Comments, public APIs should normally
return state/placeholder information rather than hidden historical body
content.

Moderator access to retained content requires explicit permissions.

## 82. Revision Exposure

Comment revisions are not part of the normal public Comment payload.

They are primarily moderation/history data.

If Kurvenfunk later chooses to expose edit history publicly, that must
be an explicit product decision with privacy review.

## 83. Permission Model Integration

Task 172 later introduces central permissions such as:

```text
comment.create
comment.vote
comment.delete
comment.moderate
```

The Comment model must not encode role comparisons such as:

```text
if role == MODERATOR
```

inside persistence semantics.

Permissions and domain state are evaluated by the application layer.

## 84. Role and Status Separation

The project-wide rule remains:

```text
role != account status
```

For example, a User may have a moderator role while account status is
independently evaluated.

Comment operations must ultimately consider both:

-   permission/role
-   account status/sanctions

Task 071 does not merge these concepts.

## 85. LIMITED Rule

The project-wide invariant is:

```text
LIMITED:
READ    yes
SEARCH  yes
VOTE    yes

COMMENT no
REPLY   no
THREAD  no
POST    no
```

The Comment model is designed so creation/reply permission can be denied
without affecting the ability to read or react to existing eligible
Comments.

## 86. BANNED Rule

BANNED users cannot perform authenticated community actions.

Their existing Comments are not automatically physically deleted because
account status and content lifecycle are separate concerns.

Moderators/privacy workflows decide what happens to existing content.

## 87. No Provider Ownership

Comments are native Kurvenfunk community content.

They are not part of the News Import provider model.

The Comment entity therefore does not require:

-   provider ID
-   provider payload
-   external source URL
-   import confidence

## 88. No Media Relation in Initial Comment Model

Task 071 does not require media attachments on Comments.

The initial community scope is textual comments.

If Comment media is added later, it should use the canonical Media
domain rather than storing object-storage fields directly on Comment.

## 89. No Direct Club Relation

A Comment does not need a direct `clubId`.

Club context can be derived from its Article where relevant.

Adding redundant direct Club relations would create consistency
problems.

If future community functionality needs explicit Comment-level Club
targeting, that should be introduced as a separate requirement.

## 90. No Direct Competition Relation

A Comment does not require `competitionId`.

Competition context is available through the associated Article where
applicable.

## 91. No Direct Match Relation

A Comment does not require `matchId`.

If a Comment belongs to an Article associated with a Match, the Match
context is derived through Article.

A future dedicated match discussion feature can be modeled explicitly
rather than overloading article comments.

## 92. No Stored Tree Path Initially

The initial model does not require:

-   materialized path
-   nested-set left/right values
-   PostgreSQL `ltree`
-   ancestor arrays

The adjacency-list relation using `parentId` plus persisted `depth` is
sufficient for the initial domain.

More complex tree representations should only be introduced after real
query measurements justify them.

## 93. No Generic Polymorphic Parent

The initial Comment model should not use generic fields such as:

```text
targetType
targetId
```

to attach Comments to arbitrary domain objects.

Task 071 specifically defines article comments.

Explicit relations provide stronger integrity.

Future match discussions or other commentable resources should be
designed intentionally.

## 94. Referential Integrity

The eventual database model must preserve:

-   valid Article references
-   valid parent references
-   valid author references while present
-   valid revision ownership

Application invariants additionally enforce:

-   parent and child belong to the same Article
-   no cycles
-   correct depth
-   valid lifecycle transitions

## 95. Deactivation Semantics

Comments do not have an `active` flag.

Visibility/lifecycle is represented explicitly through `CommentStatus`.

An `active` boolean would be ambiguous between:

-   deleted
-   moderated
-   hidden
-   archived
-   disabled discussion

Explicit states are preferable.

## 96. Discussion Closure

Whether an Article accepts new Comments is not a property of an
individual Comment.

If Kurvenfunk later supports closing an Article discussion, that state
belongs to Article discussion configuration or a dedicated
discussion-level concept.

Existing Comments remain valid.

## 97. Potential Future Discussion Entity

Task 071 does not require an `ArticleDiscussion` entity.

The direct relation:

```text
Article → Comment
```

is sufficient for the current requirements.

A separate discussion aggregate should only be introduced if future
features require independent discussion lifecycle/configuration beyond
Article.

## 98. Potential Future Pinning

Pinned/highlighted Comments are not required by the current project
plan.

No pinning fields are added prematurely.

If later introduced, moderation/editorial ownership and ordering
semantics must be defined explicitly.

## 99. Potential Future Mentions

Mentions are listed as a possible post-1.0 feature.

Task 071 does not model mentions.

Future mention extraction should not require changing Comment identity
or hierarchy.

## 100. Potential Future Bookmarks

Bookmarks are not part of Task 071.

They should be modeled as a User-to-content relation if introduced, not
as arrays inside Comment.

## 101. Potential Future Reputation

Comment does not store author reputation, trust score, or moderation
score.

Such values belong to User/community systems and may change
independently of historical Comments.

## 102. Potential Future Ranking

Popularity/ranking may later use:

-   reactions
-   age
-   reply activity
-   moderation state

The ranking algorithm is derived application behavior.

It must not redefine canonical Comment identity or hierarchy.

## 103. PostgreSQL Source of Truth

All authoritative Comment data resides in PostgreSQL.

This includes:

-   current content
-   Article relation
-   author relation
-   reply hierarchy
-   lifecycle state
-   edit timestamps
-   revision history

Any cache or search representation must be rebuildable.

## 104. Expected Prisma Mapping

The exact Prisma schema belongs to Task 081.

Expected conceptual mapping:

```text
model Comment {
  id
  articleId
  authorId?
  parentId?
  body
  depth
  status
  editedAt?
  deletedAt?
  moderatedAt?
  createdAt
  updatedAt

  article
  author?
  parent?
  replies[]
  revisions[]
}
```

and:

```text
model CommentRevision {
  id
  commentId
  body
  createdAt

  comment
}
```

This is illustrative domain mapping, not the final Prisma
implementation.

## 105. Expected CommentStatus Mapping

Conceptual enum:

```text
enum CommentStatus {
  VISIBLE
  DELETED
  MODERATED
}
```

Task 081 will determine exact Prisma syntax.

Additional states must not be added without a concrete lifecycle
requirement.

## 106. Delete Behavior Expectations

The eventual relation behavior must be chosen deliberately.

Expected principles:

### Article → Comment

Normal Article lifecycle must not accidentally destroy Comments.

### User → Comment

Account deletion/anonymization must be possible without destroying
Comments.

### Comment parent → replies

Parent removal must not cascade-delete replies.

### Comment → CommentRevision

Revisions belong exclusively to their Comment, but physical purge
behavior must respect retention/privacy policy.

## 107. Transaction Boundaries

Operations requiring transactions include at least:

-   edit + revision creation
-   lifecycle transitions where related moderation/audit state must
    remain consistent
-   reply creation where hierarchy invariants are established

Cross-domain transaction/outbox decisions are finalized during
implementation.

## 108. Audit-Relevant Operations

At minimum, later audit design should consider:

-   moderator removes Comment
-   moderator restores Comment
-   privileged hard deletion
-   privileged access to hidden historical content where required

Normal user edits need revision history but do not necessarily require
the same administrative Audit Log treatment.

## 109. Privacy Considerations

Comment content is user-generated data.

The implementation must consider:

-   account deletion
-   anonymization
-   revision retention
-   moderation evidence retention
-   data export
-   deletion requests
-   minimum necessary author data
-   absence of unnecessary raw IP storage

Task 071 establishes compatible structure but does not set legal
retention periods.

## 110. Security Considerations

Later implementation must protect against:

-   XSS
-   malicious links
-   oversized payloads
-   automated spam
-   duplicate spam
-   abusive posting frequency
-   unauthorized editing
-   unauthorized deletion
-   unauthorized moderation
-   IDOR-style access mistakes

All authorization is server-side.

## 111. API Representation Boundary

The database entity and public API representation do not need to be
identical.

For example, a public deleted Comment may return:

```text
id
parentId
status
createdAt
placeholder state
replies
```

without returning retained hidden body content.

The API layer is responsible for safe projection.

## 112. Moderation Representation Boundary

A moderator representation may contain more context than the public
representation, subject to permission and retention rules.

This distinction should be explicit rather than accidentally exposing
database rows directly.

## 113. Domain Invariants

The Comment domain must preserve the following invariants:

1.  Every Comment has one immutable internal ID.
2.  Every Comment belongs to exactly one Article.
3.  Every newly created Comment has one authenticated author.
4.  Author relation may later be removed/anonymized during account
    deletion without deleting the Comment.
5.  Anonymous guest Comment creation is not part of the initial model.
6.  Root Comments have no parent.
7.  Replies reference exactly one direct parent.
8.  Parent and child always belong to the same Article.
9.  A Comment cannot be its own parent.
10. Comment parent relations must never contain cycles.
11. Root Comment depth is zero.
12. Reply depth equals parent depth plus one.
13. Technical depth and visual indentation are separate concepts.
14. A reply is a Comment, not a separate Reply entity.
15. Current body is stored on Comment.
16. Historical edited bodies are stored as immutable CommentRevision
    records.
17. Revision creation and canonical edit are atomic.
18. The initial body does not require a duplicate revision row.
19. No-op edits do not require revisions.
20. `editedAt` represents content editing, not every row update.
21. `createdAt` never changes because of an edit.
22. User deletion is soft deletion.
23. Moderator removal is distinct from user deletion.
24. Soft deletion must preserve child replies.
25. Moderation removal must preserve child replies.
26. Comment status is explicit and not replaced by a generic `active`
    boolean.
27. Public placeholders are presentation data, not canonical stored
    comment text.
28. Moderator identity and moderation reason belong to moderation/audit
    domains rather than duplicated Comment fields.
29. Reports belong to the Moderation Report domain.
30. Cards belong to the Moderation Card domain.
31. Sanctions belong to the Sanction domain.
32. Reactions belong to the Reaction domain.
33. Comment does not store authoritative reaction-user arrays.
34. LIMITED creation/reply restrictions are enforced by the permission
    layer.
35. LIMITED voting remains independently possible.
36. BANNED users cannot perform authenticated community actions.
37. Existing Comments are not automatically hard-deleted when a User
    becomes BANNED.
38. Account deletion must be compatible with Comment anonymization.
39. Comment does not duplicate email, Keycloak subject, or unnecessary
    identity data.
40. Comment does not require permanent raw IP storage.
41. Comment does not directly duplicate Club, Competition, Match, or
    Provider context.
42. Article context remains canonical through `articleId`.
43. Comment is separate from Forum Post.
44. PostgreSQL is the source of truth.
45. Redis is never authoritative Comment storage.
46. Any future search index must be reconstructable from PostgreSQL.
47. Root Comment pagination should be cursor-based for large
    discussions.
48. Ordering must use deterministic tie-breakers.
49. Parent/reply queries must be indexed.
50. Article Comment queries must be indexed.
51. Revision queries must be indexed.
52. Client input must not control author, lifecycle, or server
    timestamps.
53. Hidden/deleted historical body content must not automatically appear
    in public API responses.
54. Hard deletion is an exceptional retention/legal/maintenance
    operation.
55. The exact Prisma schema is deferred to Task 081.
56. No migration is created as part of Task 071.

## 114. Relationship Overview

```text
Article
   │
   │ 1
   │
   │ *
Comment ───────────── User
   │                    *
   │                    │
   │                    │ author
   │
   ├── parent Comment
   │       │
   │       └── replies
   │
   └── CommentRevision
           *
```

Later domains extend this conceptually:

```text
Comment
├── Reactions
├── Moderation Reports
└── moderation/audit references
```

without making those concerns part of the core Comment row.

## 115. Lifecycle Example

### Creation

```text
User
  ↓
permission/status check
  ↓
Article
  ↓
Comment
status = VISIBLE
```

### Reply

```text
Parent Comment
  ↓ validate same Article
  ↓ validate hierarchy
  ↓
Reply Comment
parentId = parent.id
depth = parent.depth + 1
```

### Edit

```text
Current Comment
      ↓
CommentRevision(old body)
      ↓
Comment(new body)
      ↓
editedAt updated
```

### User Delete

```text
VISIBLE
   ↓
DELETED
   ↓
row/tree preserved
```

### Moderation

```text
VISIBLE
   ↓
MODERATED
   ↓
row/tree preserved
   ↓
moderation/audit domains retain action context
```

## 116. Example Discussion

```text
Article: "Bundesliga season opener"

Comment A
Author: User 1
Status: VISIBLE
Depth: 0

└── Comment B
    Author: User 2
    Status: DELETED
    Depth: 1

    └── Comment C
        Author: User 3
        Status: VISIBLE
        Depth: 2
```

Public rendering can preserve:

```text
User 1:
Great match.

  Deleted user/comment:
  [This comment was deleted.]

    User 3:
    I was replying to the point above.
```

The exact wording and visual indentation are frontend decisions.

## 117. Task Integration

This model prepares the following later tasks:

### Task 081 -- Prisma Schema

Maps Comment, CommentRevision, relations, indexes, and enum into Prisma.

### Task 082 -- Initial Migration

Creates the actual database structures.

### Task 162 -- Comment Creation

Implements creation and ACTIVE/LIMITED/BANNED checks.

### Task 163 -- Replies

Uses `parentId` and hierarchy validation.

### Task 164 -- Comment Depth

Uses technical depth while allowing limited visual nesting.

### Task 165 -- Comment Editing

Uses `CommentRevision` and `editedAt`.

### Task 166 -- Comment Deletion

Uses soft-delete lifecycle semantics.

### Task 167 -- Voting / Reactions

Uses the separate Reaction domain.

### Task 168 -- Comment Sorting

Uses deterministic creation ordering and later popularity ranking.

### Task 169 -- Pagination

Uses cursor-based pagination.

### Task 170 -- Reports

References Comment through the Moderation Report domain.

### Task 171 -- Spam Protection

Applies rate limits and anti-spam logic around Comment creation.

### Tasks 172--191 -- Moderation

Use Comment as moderated content without embedding the entire moderation
system into Comment.

## 118. Acceptance Checklist

Task 071 is complete when the domain definition establishes:

-   [x] canonical Comment entity
-   [x] Article relation
-   [x] author relation
-   [x] reply/self relation
-   [x] root Comment semantics
-   [x] technical depth semantics
-   [x] cycle prevention requirement
-   [x] same-Article parent requirement
-   [x] soft deletion
-   [x] preservation of reply trees
-   [x] separate moderation removal state
-   [x] edit timestamp
-   [x] immutable edit history
-   [x] CommentRevision entity
-   [x] atomic edit/revision requirement
-   [x] account deletion/anonymization compatibility
-   [x] Reaction boundary
-   [x] Report boundary
-   [x] Card/Sanction boundary
-   [x] Audit boundary
-   [x] ACTIVE/LIMITED/BANNED integration boundary
-   [x] cursor-pagination preparation
-   [x] deterministic sorting
-   [x] expected indexes
-   [x] PostgreSQL source-of-truth rule
-   [x] Prisma implementation deferred to Task 081
-   [x] migration deferred to Task 082

## 119. Result

Kurvenfunk now has a defined Comment domain architecture.

The central structure is:

```text
Article
   ↓
Comment
   ├── Author
   ├── Parent / Replies
   ├── Current Body
   ├── Lifecycle State
   └── Revision History
```

The central lifecycle principle is:

```text
community action
      ↓
preserve identity and hierarchy
      ↓
change visibility/state instead of destroying structure
```

Edits preserve history:

```text
current body
    ↓ edit
old body → CommentRevision
new body → Comment.body
```

Deletion and moderation remain distinct:

```text
User deletion → DELETED
Moderation    → MODERATED
```

Replies survive both states.

Task 071 defines the domain model only. The concrete Prisma schema
follows in Task 081, the initial migration in Task 082, and the
operational Comment functionality in Tasks 162–171.
