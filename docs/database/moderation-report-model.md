# Moderation Report Domain Model

**Project:** Kurvenfunk
**Task:** 074 – Moderation Report Model
**Status:** Domain model defined
**Target:** `docs/database/moderation-report-model.md`

---

## 1. Purpose

The Moderation Report domain represents user-submitted reports about
community content or other users.

Kurvenfunk uses one shared report system for:

- article comments
- forum posts
- users

Reports are moderation input. They are not themselves sanctions, cards,
content lifecycle state, account status, or audit records.

The concrete Prisma schema is intentionally deferred to Task 081. The
initial migration is intentionally deferred to Task 082.

## 2. Goals

The model must:

- allow an authenticated user to report a Comment
- allow an authenticated user to report a forum Post
- allow an authenticated user to report another User
- represent exactly one primary target per Report
- preserve stable references for moderation review
- support a clear moderation workflow
- support assignment to a moderator
- support resolution and dismissal
- distinguish reporter, target user, and moderator
- support duplicate/spam detection
- remain useful when content is later soft-deleted or moderated
- integrate with future moderation dashboards
- remain separate from ModerationCard, Sanction, IPBlock, and AuditLog
- support privacy and retention policies
- remain suitable for later Prisma implementation

## 3. Non-Goals

Task 074 does not define:

- yellow cards
- red cards
- LIMITED sanctions
- account bans
- comment blocks
- forum blocks
- IP blocks
- session revocation
- audit log storage
- appeals
- moderation permissions
- notification delivery
- content deletion mechanics
- account status transitions

Those concerns belong to later domain models and implementation tasks.

## 4. Core Entity

The central entity is `ModerationReport`.

Conceptually:

```text
ModerationReport
├── id
├── reporterId
├── targetType
├── commentId?
├── postId?
├── reportedUserId?
├── reason
├── details?
├── status
├── assignedModeratorId?
├── resolution?
├── moderatorNote?
├── createdAt
├── updatedAt
├── assignedAt?
└── resolvedAt?
```

The exact Prisma representation is deferred to Task 081.

## 5. Report Identity

### 5.1 `id`

Every Moderation Report has an immutable internal identifier.

Intended representation:

```text
UUID
```

The ID must remain stable for moderation dashboards, audit references,
administrative tools, later notifications, investigation history, and
support workflows.

A Report ID must never be reused.

## 6. Reporter

### 6.1 `reporterId`

`reporterId` references the Kurvenfunk User who submitted the Report.

```text
reporterId → User.id
```

The reporter is not necessarily the author or owner of the reported
content.

Example:

```text
User A writes Comment C.
User B reports Comment C.

reporterId = User B
commentId = Comment C
```

### 6.2 Authentication

Normal user-generated Reports require an authenticated Kurvenfunk User.

Anonymous reporting is not part of the initial model.

This provides abuse resistance, rate limiting, duplicate detection,
moderation context, and accountability.

### 6.3 Reporter account deletion

A later account deletion or anonymization must not automatically destroy
the historical Report.

The privacy implementation may anonymize or remove the direct reporter
relation where legally required.

Report retention must not depend on the continued existence of an active
Keycloak identity.

## 7. Report Target

Every Report has exactly one primary target.

Supported initial target types:

```text
COMMENT
FORUM_POST
USER
```

Represented conceptually by `ReportTargetType`.

## 8. `ReportTargetType`

Expected domain values:

```text
COMMENT
FORUM_POST
USER
```

These values describe the primary object being reported. They do not
describe the type of violation.

Violation classification belongs to `ReportReason`.

## 9. Target References

The Report contains nullable target references:

```text
commentId?
postId?
reportedUserId?
```

Their meaning depends on `targetType`.

### COMMENT

```text
targetType = COMMENT
commentId != null
postId = null
reportedUserId = null
```

### FORUM_POST

```text
targetType = FORUM_POST
commentId = null
postId != null
reportedUserId = null
```

### USER

```text
targetType = USER
commentId = null
postId = null
reportedUserId != null
```

## 10. Exactly-One-Target Invariant

A Moderation Report must reference exactly one primary target.

Invalid:

```text
commentId = null
postId = null
reportedUserId = null
```

Invalid:

```text
commentId = X
postId = Y
```

Valid:

```text
targetType = COMMENT
commentId = X
```

Valid:

```text
targetType = FORUM_POST
postId = Y
```

Valid:

```text
targetType = USER
reportedUserId = Z
```

This invariant must eventually be enforced through application
validation and, where practical, database constraints.

## 11. Why Explicit Target Columns

Kurvenfunk should not use only a generic pair such as:

```text
targetType
targetId
```

without database relations.

A generic polymorphic ID would make referential integrity difficult and
weaken the relational model.

Explicit nullable foreign keys allow real database relations,
referential integrity, efficient joins, clear Prisma relations, and
predictable moderation queries.

`targetType` remains useful as the explicit semantic discriminator.

## 12. Comment Reports

A Comment Report references:

```text
ModerationReport.commentId → Comment.id
```

The Comment domain already treats Reports as a separate concern.

A Comment must not receive fields such as:

```text
reportReason
reportedBy
reportStatus
```

The Report owns those values.

Relationship:

```text
Comment 1 ──────── * ModerationReport
```

## 13. Forum Post Reports

A forum Post Report references:

```text
ModerationReport.postId → Post.id
```

`Post.id` is the stable forum-content identifier.

A forum Report should normally target the specific offending Post rather
than the complete Thread.

## 14. Thread Reports

The initial report target model does not require a separate `THREAD`
target.

If a user wants to report the content of a Thread, the initial Post can
normally be reported.

A future migration may add `THREAD` if moderation requirements justify
it.

## 15. User Reports

A User Report references:

```text
reportedUserId → User.id
```

A User Report is appropriate for behavior or account-level concerns that
are not adequately represented by one specific Comment or forum Post.

Examples include repeated harassment across multiple areas, suspicious
account behavior, impersonation, profile-related abuse, and coordinated
spam behavior.

A User Report does not itself change the User's account status.

## 16. Reporter vs Reported User

These concepts must never be confused.

`reporterId` means: Who submitted the Report?

`reportedUserId` means: Which User is the primary target?

For content Reports, `reportedUserId` is not required merely because the
reported Comment/Post has an author. The target author can be resolved
through the content relation.

This avoids redundant and potentially inconsistent data.

## 17. Target Author

For a Comment Report:

```text
Report → Comment → authorId → User
```

For a forum Post Report:

```text
Report → Post → authorId → User
```

The Report should not duplicate that author relation as another required
field.

If later moderation analytics require a denormalized subject User ID,
that must be introduced deliberately with clearly defined consistency
rules.

## 18. Self-Reports

A user should not normally be able to report themselves as a User
target:

```text
targetType = USER
reporterId != reportedUserId
```

Reporting one's own Comment or forum Post should also normally be
rejected because the user already has content-management mechanisms for
their own content.

The service layer should enforce these rules.

Moderator/admin internal workflows should use moderation actions rather
than manufacturing user Reports.

## 19. Report Reason

Every Report requires a structured reason.

Conceptually:

```text
ReportReason
```

Recommended initial values:

```text
SPAM
HARASSMENT
HATE_OR_ABUSE
THREAT_OR_VIOLENCE
PRIVACY
IMPERSONATION
ILLEGAL_CONTENT
OFF_TOPIC
MISINFORMATION
OTHER
```

These are report classifications, not automatic moderation verdicts.

## 20. Reason Semantics

### SPAM

Unwanted repetitive, promotional, automated, or disruptive content.

### HARASSMENT

Targeted harassment, bullying, or persistent hostile behavior.

### HATE_OR_ABUSE

Hateful, discriminatory, or severely abusive content.

### THREAT_OR_VIOLENCE

Threats, encouragement of violence, or severe violent abuse.

### PRIVACY

Potential disclosure of private or personally identifying information.

### IMPERSONATION

A User appears to be falsely presenting themselves as another person or
entity.

### ILLEGAL_CONTENT

Content the reporter believes may violate applicable law. This reason
must not imply that Kurvenfunk has already legally classified the
content.

### OFF_TOPIC

Material significantly unrelated to the discussion or forum context.

### MISINFORMATION

Content reported as materially false or misleading. The Report is an
allegation requiring review, not a factual determination.

### OTHER

A concern not adequately represented by another reason. `details` should
normally be required for `OTHER`.

## 21. Report Details

A Report may contain user-provided explanatory text:

```text
details?
```

The field must have a defined maximum length during implementation. It
is untrusted user input and must be validated and safely rendered.

## 22. Report Is an Allegation

Creating a Report does not establish that a violation occurred.

`Report.reason` means the reason alleged by the reporter, not a
moderator-confirmed violation.

Moderation decisions must be represented separately through resolution
data and later moderation entities.

## 23. Report Status

Every Report has an explicit workflow status.

Recommended initial values:

```text
OPEN
IN_REVIEW
RESOLVED
DISMISSED
```

## 24. `OPEN`

`OPEN` means the Report has been submitted, no final decision exists,
and it is waiting for moderation review.

Default status:

```text
OPEN
```

## 25. `IN_REVIEW`

`IN_REVIEW` means moderation review has started and no final decision
exists yet.

A Report may be assigned to a moderator before or during this state.

## 26. `RESOLVED`

`RESOLVED` means moderation review is complete and the Report was
actionable or otherwise handled.

It does not imply a specific sanction.

## 27. `DISMISSED`

`DISMISSED` means moderation review is complete and no new moderation
action is required from this Report.

Possible cases include no violation, insufficient evidence, duplicate
Report, mistaken target, abusive reporting, or an issue already handled.

## 28. Report Resolution

Finalized Reports should have a structured resolution.

Recommended values:

```text
ACTION_TAKEN
NO_VIOLATION
INSUFFICIENT_EVIDENCE
DUPLICATE
ALREADY_HANDLED
INVALID_REPORT
OTHER
```

## 29. Resolution Mapping

Typical mappings:

```text
RESOLVED + ACTION_TAKEN
RESOLVED + ALREADY_HANDLED

DISMISSED + NO_VIOLATION
DISMISSED + INSUFFICIENT_EVIDENCE
DISMISSED + DUPLICATE
DISMISSED + INVALID_REPORT
```

The service layer must reject nonsensical combinations.

## 30. Moderator Assignment

A Report may be assigned to a moderator:

```text
assignedModeratorId?
```

Relation:

```text
assignedModeratorId → User.id
```

This relation identifies the current moderator responsible for handling
the Report.

It is workflow state, not a permanent audit history.

## 31. Assignment Timestamp

When a Report is assigned:

```text
assignedAt = now
```

If reassignment is supported later, the current Report row may contain
only the current assignment. Historical assignment changes belong in
AuditLog or a dedicated history model if needed.

## 32. Moderator Note

A moderator may store an internal note:

```text
moderatorNote?
```

This field is not public and must never be exposed through normal
user-facing Report APIs.

It may contain review context, but it must not replace structured audit
events, sanctions, or card reasons.

## 33. Resolution Timestamp

When a Report reaches a final state:

```text
resolvedAt = now
```

Final states are:

```text
RESOLVED
DISMISSED
```

For non-final states:

```text
resolvedAt = null
```

## 34. Status Transitions

Normal workflow:

```text
OPEN
  ↓
IN_REVIEW
  ├──→ RESOLVED
  └──→ DISMISSED
```

Direct handling may allow:

```text
OPEN → RESOLVED
OPEN → DISMISSED
```

Reopening a finalized Report should be a deliberate privileged action if
later supported and must be audited.

## 35. Timestamps

The model requires:

```text
createdAt
updatedAt
```

and optionally:

```text
assignedAt
resolvedAt
```

`createdAt` is immutable.

`updatedAt` reflects meaningful Report-row changes.

## 36. Target Content Deletion

A Report must remain understandable if its Comment or Post is later
soft-deleted or moderated.

The existing Comment and Forum domains preserve their rows for
moderation/history purposes in normal soft-delete/moderation flows.

Therefore a Report can continue to reference the target row.

Soft deletion must not cascade-delete Reports.

## 37. Hard Deletion

Physical deletion of reported content is exceptional.

Retention, privacy, or legal cleanup may eventually require hard
deletion or anonymization.

The system must not accidentally destroy moderation history through
uncontrolled database cascades.

The final foreign-key deletion behavior must be chosen explicitly during
Task 081.

## 38. Evidence Snapshot Boundary

Task 074 does not require copying the complete reported Comment/Post
body into every Report.

The canonical content remains in the content domain while retained.

However, future legal, moderation, or retention requirements may justify
an immutable evidence snapshot.

If introduced, it should be explicit and carefully governed because
snapshots duplicate user-generated content and affect privacy retention.

## 39. Duplicate Reports

Multiple users may legitimately report the same target.

Therefore this must be allowed:

```text
User A → Report → Comment X
User B → Report → Comment X
User C → Report → Comment X
```

A target may have many Reports.

## 40. Same Reporter Duplicate Protection

A single reporter should not normally create unlimited identical Reports
for the same target.

The application should detect recent/open duplicate submissions using at
least:

```text
reporterId
targetType
target reference
```

A practical rule is to reject or reuse an existing non-final Report by
the same reporter for the same target.

The exact user-facing behavior belongs to Task 170.

## 41. Duplicate Reason Changes

A user does not need multiple simultaneous Reports against the same
target merely to select several reasons.

The initial model uses one primary `reason` plus optional `details`.

If multi-reason reporting becomes necessary later, it can be introduced
deliberately.

## 42. Report Spam Protection

Reports are a user-generated write action and require abuse controls.

Later implementation should support:

- per-user rate limits
- per-IP rate limits
- duplicate suppression
- abnormal-volume detection
- account-status checks
- audit/monitoring for abusive reporters

IP data does not belong directly on the ModerationReport row by default.

IP protection belongs to the security/moderation infrastructure.

## 43. Account Status

Report submission must respect Kurvenfunk account status rules.

At minimum:

```text
ACTIVE  → may report
BANNED  → may not perform authenticated actions
```

Whether `LIMITED` users may submit Reports should be decided by the
permission system.

The recommended policy is that LIMITED users may still report abuse
because reporting is a protective function, subject to rate limits.

The final permission is enforced by Task 172/173.

## 44. Roles and Status

Role and account status remain separate.

A User can have:

```text
role = MODERATOR
status = ACTIVE
```

or another valid combination.

Report workflow permissions must use the centralized permission system
rather than hard-coded role comparisons throughout controllers.

## 45. Public Reporter Privacy

The identity of the reporter must not be exposed to the reported User
through normal public/user-facing APIs.

A reported User should not receive:

```text
reporterId
reporter nickname
reporter profile
moderatorNote
internal resolution context
```

Moderators with appropriate permissions may access reporter identity
when necessary.

## 46. Reporter Confidentiality Is Not Absolute Anonymity

Kurvenfunk may need the reporter identity internally for:

- abuse prevention
- investigation
- duplicate detection
- legal obligations
- moderator context

Therefore the reporter is confidential from normal users, not anonymous
to the platform.

## 47. Moderation Dashboard Queries

The model must efficiently support queries such as:

```text
all OPEN Reports
all IN_REVIEW Reports
Reports assigned to moderator X
Reports for Comment X
Reports for Post X
Reports about User X
Reports submitted by User X
Reports by reason
Reports created in a time range
oldest unresolved Reports
```

## 48. Recommended Indexes

Likely indexes include:

```text
ModerationReport(status, createdAt)
ModerationReport(assignedModeratorId, status, createdAt)
ModerationReport(reporterId, createdAt)
ModerationReport(commentId)
ModerationReport(postId)
ModerationReport(reportedUserId)
ModerationReport(reason, createdAt)
```

Exact indexes are finalized during Prisma/database implementation based
on real query patterns.

## 49. Report Counts

A Comment, Post, or User does not require a report counter as source of
truth.

Source of truth:

```text
ModerationReport rows
```

A denormalized count may later be introduced for performance but must be
reconstructable.

## 50. Moderation Priority

Task 074 does not require a persistent priority field.

The dashboard may initially derive urgency from:

- reason
- number of Reports for the target
- age of Report
- target context
- reporter history

If operational experience requires manual priority, it can be added
later.

## 51. Cards Boundary

Task 075 defines `ModerationCard`.

A Report may lead to a yellow or red card, but the Report must not
contain card state such as:

```text
yellowCard
redCard
cardExpiresAt
```

Conceptual flow:

```text
Report
→ moderator review
→ optional ModerationCard
```

## 52. Sanction Boundary

Task 076 defines `Sanction`.

A Report may lead to:

```text
LIMITED
COMMENT_BLOCK
FORUM_BLOCK
ACCOUNT_BAN
IP_BLOCK
```

but these are not fields on ModerationReport.

Conceptual flow:

```text
Report
→ review
→ optional Sanction
```

## 53. IP Block Boundary

Task 077 defines IP Block storage.

ModerationReport should not become the storage location for IP hashes or
IP-ban state.

A Report can provide context for a later IP-related moderation action
through audit/domain references.

## 54. Audit Boundary

Task 078 defines AuditLog.

Critical Report operations should later generate audit events,
including:

- assignment
- reassignment
- resolution
- dismissal
- reopening
- moderation action triggered from a Report

The Report row represents current workflow state. AuditLog represents
historical administrative actions.

## 55. Notifications Boundary

The Notification domain is defined later.

Possible events include:

```text
report received
moderation outcome
yellow card
red card
limited
ban
```

ModerationReport itself does not store notification delivery state.

## 56. Report-to-Action Relationship

Task 074 does not require direct foreign keys from Report to every
possible action entity.

The initial architecture can use audit records and action entities with
contextual references once those models are defined.

This avoids prematurely coupling Task 074 to models that do not yet
exist.

## 57. Multiple Reports, One Moderation Action

Several Reports may concern the same target and result in one moderation
action.

Example:

```text
Report A ─┐
Report B ─┼─→ moderator review → one content removal
Report C ─┘
```

Therefore Reports and moderation actions are not necessarily one-to-one.

## 58. One Report, Multiple Actions

One severe Report may result in several actions:

```text
Report
├── content moderation
├── ModerationCard
├── Sanction
└── AuditLog events
```

The Report model must not assume exactly one consequence.

## 59. User Moderation History

Later moderation history views may aggregate:

```text
Reports about User
Reports concerning content authored by User
ModerationCards
Sanctions
IP Blocks
Audit events
```

ModerationReport is one source in that aggregate, not the complete
moderation history model.

## 60. Content Author Account Deletion

If the author of a reported Comment/Post deletes their account, the
content domain's anonymization policy applies.

The Report should remain attached to the content while that content
remains retained.

Moderator tooling must not rely solely on a currently active User
relation to understand the Report.

## 61. Report Retention

Reports are moderation/security records and may require different
retention from ordinary public content.

Task 074 defines the requirement that retention be explicit.

The exact duration is deferred to the privacy/retention tasks,
especially:

```text
Task 249 – Moderation Retention
```

Reports must not be retained indefinitely merely because no cleanup
policy was implemented.

## 62. Personal Data

Potential personal data in Reports includes:

- reporter identity
- reported User identity
- free-text details
- moderator notes
- references to user-generated content

These fields require controlled access and retention.

## 63. Data Minimization

Do not copy unnecessary data into ModerationReport.

In particular, avoid duplicating:

- reporter nickname
- target author nickname
- email addresses
- Keycloak subject
- raw IP address
- full profile data
- full content body

Use stable domain references where possible.

## 64. API Exposure

Public/user-facing APIs should expose only the minimum necessary Report
information.

Moderator APIs may expose more context based on permission checks.

Internal-only fields include at least:

```text
assignedModeratorId
moderatorNote
internal workflow metadata
reporter identity where not necessary for the reporter's own view
```

## 65. Reporter View

If Kurvenfunk later provides a "my reports" view, the reporter may see a
simplified status.

Internal moderator workflow details do not need to map one-to-one to
public wording.

For example, internal `DISMISSED` may be presented neutrally as "review
completed".

Product wording is deferred.

## 66. Target User View

The reported User does not automatically receive access to the Report
record.

Moderation outcomes may be communicated through separate notifications,
cards, sanctions, or account-status messages.

This protects reporter confidentiality and internal moderation
information.

## 67. Concurrency

Two moderators may attempt to handle the same Report concurrently.

The implementation must avoid silent overwrites of final decisions.

Possible implementation strategies include:

- transactional conditional updates
- optimistic concurrency
- status preconditions

The exact mechanism is deferred to implementation.

## 68. Assignment Is Not a Lock

`assignedModeratorId` represents responsibility, not a database lock.

The application must still protect state transitions against concurrent
updates.

## 69. Validation

Report creation must validate:

- authenticated reporter exists
- target type is supported
- exactly one target reference is present
- target exists
- target reference matches target type
- reporter is not reporting themselves/their own content where
    prohibited
- reason is valid
- details length is valid
- details is present when required
- account/permission checks pass
- rate limits pass
- duplicate rules pass

## 70. Moderator Validation

Moderator workflow operations must validate:

- actor has required permission
- Report exists
- requested transition is valid
- assigned moderator exists where applicable
- final status has a valid resolution
- final status receives `resolvedAt`
- non-final status does not retain inconsistent final-state fields
- sensitive actions are audited later

## 71. Deletion Rules

Normal users must not be able to delete Report records after submission.

Allowing deletion would weaken moderation integrity and abuse
investigation.

Privacy rights must instead be handled through explicit
retention/anonymization processes.

Administrative physical deletion should be exceptional and audited.

## 72. Editing Reports

The initial model should treat submitted Reports as immutable user
allegations except for moderation workflow fields.

A reporter should not silently rewrite `reason` or `details` after
moderator review begins.

If correction functionality is later required, it should preserve
history.

## 73. Report Creation Flow

Conceptual flow:

```text
authenticated request
↓
account/permission check
↓
rate-limit check
↓
validate target
↓
validate self-report rule
↓
duplicate check
↓
validate reason/details
↓
create ModerationReport(status = OPEN)
↓
queue/notify moderation system if required
```

## 74. Moderation Review Flow

Conceptual flow:

```text
OPEN Report
↓
moderator claims/opens
↓
IN_REVIEW
↓
inspect target + context
↓
decision
├── no action → DISMISSED
└── action    → RESOLVED
                ↓
                optional content moderation
                optional ModerationCard
                optional Sanction
                optional notification
                audit events
```

## 75. Comment Moderation Integration

When a Report leads to Comment removal:

```text
ModerationReport
↓
moderator decision
↓
Comment.status = MODERATED
```

The actual action context belongs to moderation/audit domains.

The Report remains as the incoming moderation signal.

## 76. Forum Moderation Integration

When a Report leads to Post removal, the Post remains structurally
available according to the Forum domain's soft-delete/moderation policy.

The Report continues to reference the stable `Post.id`.

Replies and thread sequence structure must not be destroyed merely
because a Report was actioned.

## 77. User Moderation Integration

A User Report may lead to later actions such as:

```text
ModerationCard
Sanction
AccountStatus change
Session revoke
IP protection
```

None of those occur merely because the Report was created.

A moderator/system decision is required.

## 78. Reporting Moderated Content

A Comment/Post already in a moderated or deleted state may no longer be
reportable through the normal public UI.

Existing Reports remain valid.

Moderator tools may still access retained target context according to
permissions and retention policy.

## 79. Reporting Nonexistent Targets

The API must reject creation if the requested target does not exist or
is not reportable.

It must not create dangling Reports intentionally.

The final API should avoid leaking sensitive existence information where
authorization rules require concealment.

## 80. Future Target Types

Possible future targets may include:

```text
THREAD
PROFILE
ARTICLE
MEDIA
PRIVATE_MESSAGE
```

They are intentionally excluded until product requirements exist.

Adding a target type requires:

- domain definition
- target relation
- validation
- exactly-one-target update
- indexes
- API changes
- permission rules
- tests

## 81. Expected Prisma Shape

Task 081 may use a shape conceptually similar to:

```text
model ModerationReport {
  id                  String
  reporterId          String
  targetType          ReportTargetType
  commentId           String?
  postId              String?
  reportedUserId      String?
  reason              ReportReason
  details             String?
  status              ReportStatus
  assignedModeratorId String?
  resolution          ReportResolution?
  moderatorNote       String?
  createdAt           DateTime
  updatedAt           DateTime
  assignedAt          DateTime?
  resolvedAt          DateTime?
}
```

This is a domain-level sketch, not the final Prisma schema.

Relations, names, database types, referential actions, constraints, and
indexes are finalized in Task 081.

## 82. Expected Enums

Conceptual enums:

```text
enum ReportTargetType {
  COMMENT
  FORUM_POST
  USER
}
```

```text
enum ReportReason {
  SPAM
  HARASSMENT
  HATE_OR_ABUSE
  THREAT_OR_VIOLENCE
  PRIVACY
  IMPERSONATION
  ILLEGAL_CONTENT
  OFF_TOPIC
  MISINFORMATION
  OTHER
}
```

```text
enum ReportStatus {
  OPEN
  IN_REVIEW
  RESOLVED
  DISMISSED
}
```

```text
enum ReportResolution {
  ACTION_TAKEN
  NO_VIOLATION
  INSUFFICIENT_EVIDENCE
  DUPLICATE
  ALREADY_HANDLED
  INVALID_REPORT
  OTHER
}
```

These remain subject to final schema review in Task 081.

## 83. Relations Summary

```text
User (reporter)
  1
  │
  └────< ModerationReport

User (reported target)
  1
  │
  └────< ModerationReport

User (assigned moderator)
  1
  │
  └────< ModerationReport

Comment
  1
  │
  └────< ModerationReport

Post
  1
  │
  └────< ModerationReport
```

Each Report uses only one primary target relation.

## 84. Domain Invariants

1.  Every Report has one immutable ID.
2.  Every user-submitted Report has a reporter.
3.  Every Report has exactly one primary target.
4.  Initial target types are COMMENT, FORUM_POST, and USER.
5.  `targetType` must match the populated target foreign key.
6.  A Report must never have multiple primary target foreign keys
    populated.
7.  A User cannot normally report themselves.
8.  A User cannot normally report their own Comment/Post.
9.  Every Report has one structured reason.
10. `OTHER` should normally require explanatory details.
11. Creating a Report does not prove a violation.
12. Every Report has an explicit workflow status.
13. New Reports default to OPEN.
14. Final states are RESOLVED and DISMISSED.
15. Final Reports require a semantically valid resolution.
16. Final Reports record `resolvedAt`.
17. Reports are not cards.
18. Reports are not sanctions.
19. Reports are not account-status records.
20. Reports are not audit logs.
21. Soft-deleting/moderating target content must not automatically
    delete Reports.
22. Multiple users may report the same target.
23. Duplicate Reports from the same reporter should be controlled.
24. Reporter identity is confidential from ordinary reported users.
25. Moderator notes are internal.
26. Reports are not user-deletable after submission.
27. Report retention must be explicitly governed.
28. IP data is not stored directly on the Report by default.
29. PostgreSQL remains the source of truth.
30. Report counters, if introduced, are derived data.

## 85. Required Queries

The final schema must support efficient retrieval for:

```text
OPEN reports ordered by age
IN_REVIEW reports
reports assigned to moderator
reports by target
reports by reporter
reports about user
reports by reason
finalized reports by time range
unassigned reports
```

These queries should guide Task 081 index design.

## 86. Security Considerations

Report endpoints are abuse-sensitive.

Required protections include:

- authentication
- authorization
- account-status checks
- rate limiting
- safe text validation
- output filtering
- reporter confidentiality
- moderator-only internal fields
- concurrency-safe resolution
- audit logging for privileged changes

## 87. Privacy Considerations

Moderation Reports can contain sensitive allegations and user-generated
text.

Therefore:

- collect only necessary information
- restrict moderator access
- avoid raw IP storage on Reports
- avoid unnecessary identity duplication
- define retention
- support account deletion/anonymization policy
- avoid exposing reporter identity to reported users
- treat free-text details and notes as potentially sensitive

## 88. Task Boundaries

### Task 075 -- Yellow Card Model

Defines ModerationCard and YELLOW/RED card semantics.

### Task 076 -- Sanction Model

Defines technical/account restrictions independently from cards.

### Task 077 -- IP Block Model

Defines IP-based protection records.

### Task 078 -- Audit Log Model

Defines immutable/append-oriented administrative and moderation action
history.

### Task 170 -- Reports

Implements report creation and product-facing reason behavior using this
model.

### Tasks 172--191 -- Moderation & Cards

Consume Reports as moderation input and create the appropriate
moderation actions.

### Task 187 -- Moderation Dashboard

Queries Report workflow state.

### Task 188 -- User Moderation History

Aggregates Reports with cards, sanctions, blocks, and audit history.

### Task 222 -- Forum Reports

Uses the same ModerationReport domain for forum Posts.

### Task 249 -- Moderation Retention

Defines concrete retention periods and cleanup/anonymization behavior.

## 89. Example -- Comment Report

```text
ModerationReport
  id: R1
  reporterId: U2
  targetType: COMMENT
  commentId: C10
  postId: null
  reportedUserId: null
  reason: HARASSMENT
  status: OPEN
```

## 90. Example -- Forum Post Report

```text
ModerationReport
  id: R2
  reporterId: U7
  targetType: FORUM_POST
  commentId: null
  postId: P44
  reportedUserId: null
  reason: SPAM
  status: OPEN
```

## 91. Example -- User Report

```text
ModerationReport
  id: R3
  reporterId: U10
  targetType: USER
  commentId: null
  postId: null
  reportedUserId: U20
  reason: IMPERSONATION
  status: OPEN
```

## 92. Example -- Resolved Report

```text
ModerationReport
  id: R4
  reporterId: U3
  targetType: COMMENT
  commentId: C90
  reason: THREAT_OR_VIOLENCE
  status: RESOLVED
  assignedModeratorId: M1
  resolution: ACTION_TAKEN
  assignedAt: ...
  resolvedAt: ...
```

The resulting card, sanction, content state change, and audit events are
stored in their respective domains.

## 93. Example -- Dismissed Duplicate

```text
ModerationReport
  id: R5
  reporterId: U11
  targetType: FORUM_POST
  postId: P70
  reason: SPAM
  status: DISMISSED
  assignedModeratorId: M2
  resolution: DUPLICATE
  resolvedAt: ...
```

The original related Report does not need to be embedded into this row
in the initial model.

## 94. Implementation Checklist for Task 081

When translating this model into Prisma:

- define `ModerationReport`
- define `ReportTargetType`
- define `ReportReason`
- define `ReportStatus`
- define `ReportResolution`
- add reporter relation
- add optional Comment relation
- add optional Post relation
- add optional reported User relation
- add optional assigned moderator relation
- choose explicit referential actions
- implement exactly-one-target protection
- add moderation queue indexes
- add reporter/target indexes
- review account-deletion behavior
- review content hard-delete behavior
- verify relation names for multiple User relations
- keep cards/sanctions/audit separate

## 95. Acceptance Criteria

Task 074 is complete when the domain definition clearly establishes
that:

- Reports can target Comments
- Reports can target forum Posts
- Reports can target Users
- exactly one target is allowed per Report
- reporter identity is distinct from target identity
- reasons are structured
- Report status is explicit
- moderator assignment is supported
- final resolution is supported
- content soft deletion does not destroy Reports
- duplicate/spam behavior is defined
- reporter confidentiality is defined
- privacy/retention boundaries are documented
- cards, sanctions, IP blocks, and audit logs remain separate
- Task 081 can translate the model into Prisma without inventing core
    semantics

## 96. Final Domain Summary

Kurvenfunk uses one shared `ModerationReport` entity for community
reporting.

```text
User
  │
  │ reports
  ▼
ModerationReport
  │
  ├── Comment
  ├── Forum Post
  └── User
```

Exactly one target is present per Report.

The Report records:

```text
who reported
what was reported
why it was reported
current review state
current moderator assignment
final resolution
relevant timestamps
```

It deliberately does not own:

```text
cards
sanctions
account status
IP blocks
audit history
notifications
content lifecycle
```

This separation allows the later moderation system to combine multiple
Reports with appropriate actions while keeping reporting, enforcement,
account state, and audit history independently understandable.
