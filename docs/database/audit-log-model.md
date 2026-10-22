# Audit Log Domain Model

**Project:** Kurvenfunk
**Task:** 078 – Audit Log Model
**Status:** Domain model defined
**Target:** `docs/database/audit-log-model.md`

## 1. Purpose

Kurvenfunk requires an immutable audit history for security-relevant, privileged, administrative, editorial, and moderation actions.

The audit log answers questions such as:

- who performed an action,
- what action was performed,
- when it happened,
- which domain object was affected,
- which user was affected,
- whether the action was performed by a human, the system, or a worker,
- what relevant state changed,
- which request or background operation caused the action,
- and which moderation entities provide the business context.

The audit log is not a replacement for domain entities such as `ModerationReport`, `ModerationCard`, `Sanction`, or `IPBlock`.

Those entities represent business state.

`AuditLog` represents the immutable historical trace of critical actions.

```text
Domain state
    |
    +--> ModerationReport
    +--> ModerationCard
    +--> Sanction
    +--> IPBlock
    +--> User / Role / Status
    +--> Forum / Comment / Editorial entities

Critical transition
    |
    +--> AuditLog
            |
            +--> actor
            +--> action
            +--> target
            +--> context
            +--> timestamp
            +--> safe metadata
```

## 2. Core Domain Rule

Audit records are append-only historical events.

After an audit record has been committed successfully:

- it must not be edited as ordinary business data,
- it must not be silently rewritten,
- it must not be deleted through normal administration,
- later corrections must be represented by additional audit events where necessary.

The audit log records what Kurvenfunk accepted as having happened at that point in time.

It is not a mutable representation of current state.

## 3. Goals

The model must support:

- moderation accountability,
- privileged role-change auditing,
- account-status transition auditing,
- card lifecycle auditing,
- sanction lifecycle auditing,
- IP-block lifecycle auditing,
- sensitive content moderation auditing,
- forum moderation auditing,
- sensitive editorial/admin operations,
- security investigation,
- incident reconstruction,
- correlation with application requests and worker jobs,
- user moderation history,
- admin audit viewer queries,
- future retention policies,
- privacy-conscious storage.

## 4. Non-Goals

The audit log is not:

- general application logging,
- request logging,
- performance telemetry,
- analytics,
- a replacement for structured logs,
- a replacement for moderation history entities,
- a replacement for import history,
- a raw security-event firehose,
- a place to store arbitrary request payloads,
- a place to store secrets or credentials,
- a place to store raw IP addresses.

High-volume operational events should normally remain in structured logs, monitoring, rate-limit telemetry, or dedicated security systems unless they represent a meaningful privileged state transition.

## 5. Entity

Conceptual entity:

```text
AuditLog

id
occurredAt

actorType
actorUserId?
actorLabel?

action
category

targetType
targetId?
targetUserId?

requestId?
correlationId?

moderationReportId?
moderationCardId?
sanctionId?
ipBlockId?

reason?
metadata?

createdAt
```

The final Prisma representation is defined in Task 081.

## 6. Identity

### 6.1 `id`

Every audit record receives a globally unique immutable identifier.

Recommended direction:

- UUID, CUID2, or another project-standard opaque identifier.

The ID must not encode business information.

## 7. Event Time

### 7.1 `occurredAt`

`occurredAt` records when the audited action occurred.

It is the authoritative business timestamp for ordering audit events.

### 7.2 `createdAt`

`createdAt` records when the audit row was persisted.

Normally:

```text
occurredAt ≈ createdAt
```

They may differ slightly for:

- worker processing,
- transactional event persistence,
- recovery/reconciliation,
- imported administrative history if ever supported.

Audit ordering should primarily use:

```text
occurredAt
id
```

or another deterministic tie-breaker.

## 8. Actor Model

Audit events must identify who or what performed the action.

Use an explicit actor type rather than assuming every event has a `User`.

Conceptual enum:

```text
AuditActorType

USER
SYSTEM
WORKER
SECURITY_AUTOMATION
```

## 9. `USER` Actor

A human Kurvenfunk user performing a privileged action uses:

```text
actorType = USER
actorUserId = <user>
```

Typical actors:

- MODERATOR,
- EDITOR,
- ADMIN,
- SUPERADMIN.

The audit system must not infer authorization merely from the actor recorded in the event.

Authorization is checked before the operation.

Audit records document the accepted action afterward.

## 10. `SYSTEM` Actor

Use `SYSTEM` when Kurvenfunk itself performs a deterministic domain transition without a directly acting human.

Examples:

- third active yellow card triggers an automatic red card,
- sanction-derived account status changes,
- automatic state reconciliation.

Example:

```text
actorType = SYSTEM
actorUserId = null
```

## 11. `WORKER` Actor

Use `WORKER` for background jobs that perform audit-relevant state transitions.

Examples:

- sanction expiration,
- IP-block expiration,
- scheduled administrative maintenance if security relevant.

Ordinary background processing does not automatically require audit logging.

## 12. `SECURITY_AUTOMATION` Actor

Use `SECURITY_AUTOMATION` for automated security decisions when the action is sufficiently important to enter immutable audit history.

Examples:

- automated temporary IP block,
- automated abuse protection escalation.

Routine rate-limit hits should not create audit records.

## 13. Actor User Deletion

Audit history must remain understandable if the actor account is later deleted or anonymized.

Therefore actor references must not require cascading deletion of audit records.

Task 081 should use deletion semantics compatible with audit retention.

A minimal historical actor label may optionally be preserved where legally and operationally justified.

It must not become an uncontrolled duplicate of profile data.

## 14. `actorLabel`

Optional `actorLabel` can preserve limited historical display context when useful.

Possible examples:

```text
moderator nickname
"System"
"Sanction expiration worker"
"Security automation"
```

Rules:

- it is informational,
- it does not replace `actorUserId`,
- it must not contain email addresses by default,
- it must not contain sensitive credentials,
- it must be minimized.

Whether this field is required should be finalized during Prisma design and privacy review.

## 15. Action

`action` identifies the concrete event.

Use stable machine-readable values.

Examples:

```text
USER_ROLE_GRANTED
USER_ROLE_REVOKED

USER_STATUS_CHANGED

MODERATION_REPORT_ASSIGNED
MODERATION_REPORT_RESOLVED
MODERATION_REPORT_DISMISSED

MODERATION_CARD_CREATED
MODERATION_CARD_REVOKED
MODERATION_CARD_EXPIRED
MODERATION_CARD_NOTE_CHANGED

SANCTION_CREATED
SANCTION_EXTENDED
SANCTION_REVOKED
SANCTION_EXPIRED

IP_BLOCK_CREATED
IP_BLOCK_EXTENDED
IP_BLOCK_DEACTIVATED
IP_BLOCK_EXPIRED
IP_BLOCK_REACTIVATED

COMMENT_MODERATED
COMMENT_DELETED_BY_MODERATOR
COMMENT_RESTORED_BY_MODERATOR

THREAD_PINNED
THREAD_UNPINNED
THREAD_LOCKED
THREAD_UNLOCKED
THREAD_MOVED
THREAD_MERGED

POST_MODERATED
POST_DELETED_BY_MODERATOR
POST_RESTORED_BY_MODERATOR

ARTICLE_PUBLISHED
ARTICLE_UNPUBLISHED
ARTICLE_ARCHIVED

ADMIN_CORRECTION
```

The exact enum may be refined in Task 081, but action names must remain explicit.

Avoid vague actions such as:

```text
UPDATED
CHANGED
MODIFIED
```

without domain context.

## 16. Action Naming Convention

Recommended convention:

```text
<DOMAIN>_<PAST_TENSE_ACTION>
```

Examples:

```text
SANCTION_CREATED
SANCTION_REVOKED
THREAD_LOCKED
USER_ROLE_GRANTED
IP_BLOCK_DEACTIVATED
```

Stable action names make:

- filtering,
- reporting,
- monitoring,
- testing,
- retention rules,
- and future security analysis

much easier.

## 17. Category

A broader category supports grouping without parsing action strings.

Conceptual enum:

```text
AuditCategory

AUTHORIZATION
ACCOUNT
MODERATION
SANCTION
IP_PROTECTION
CONTENT
FORUM
EDITORIAL
SECURITY
SYSTEM
```

`action` remains the precise event.

`category` is the coarse grouping.

## 18. Target Model

Every audit event should identify the primary affected resource where possible.

Conceptual:

```text
targetType
targetId
```

Possible target types include:

```text
USER
MODERATION_REPORT
MODERATION_CARD
SANCTION
IP_BLOCK
COMMENT
FORUM
THREAD
FORUM_POST
ARTICLE
MEDIA
CLUB
MATCH
SYSTEM
```

## 19. Primary Target

An event has one primary target.

Example:

```text
action = SANCTION_REVOKED
targetType = SANCTION
targetId = sanction.id
```

The affected user can additionally be referenced by `targetUserId`.

This avoids treating one event as if it had several equal primary targets.

## 20. `targetUserId`

`targetUserId` identifies the user affected by an action when applicable.

Examples:

```text
USER_ROLE_GRANTED
USER_STATUS_CHANGED
MODERATION_CARD_CREATED
SANCTION_CREATED
ACCOUNT_BAN
```

For moderation history queries this field is valuable even if the primary target is another entity.

Example:

```text
targetType = SANCTION
targetId = sanction.id
targetUserId = sanctionedUser.id
```

## 21. Generic Target References

`targetType + targetId` is a logical polymorphic reference.

Prisma cannot provide a conventional foreign key from one column to arbitrary tables.

Therefore this generic reference is primarily an audit locator.

Critical first-class domain relationships may additionally receive explicit nullable foreign keys.

## 22. Explicit Moderation References

Because moderation history is central to Kurvenfunk, the audit model should support explicit nullable references where valuable:

```text
moderationReportId?
moderationCardId?
sanctionId?
ipBlockId?
```

These references provide:

- referential context,
- efficient moderation-history queries,
- easier admin navigation,
- stronger integrity than metadata-only IDs.

They do not replace the primary `targetType + targetId` locator.

## 23. Exactly-One-Primary-Target Rule

An audit event should normally identify at most one primary target.

Some events may be system-wide and legitimately have:

```text
targetType = SYSTEM
targetId = null
```

or another explicitly defined representation.

Do not encode multiple target IDs into a string or JSON array merely to avoid defining event semantics.

## 24. Request Correlation

### 24.1 `requestId`

For actions originating from an HTTP request, preserve the Kurvenfunk request ID.

The project already propagates request IDs through:

```text
Web
→ API
→ Queue
→ Worker
```

Audit events should participate in the same correlation model.

Example:

```text
requestId = "..."
```

This allows an administrator or developer to correlate:

```text
AuditLog
↔ API structured log
↔ queue job
↔ worker log
```

without copying those logs into PostgreSQL.

## 25. `correlationId`

An optional `correlationId` can group multiple audit events belonging to one higher-level domain operation.

Example:

```text
third yellow card
    |
    +--> MODERATION_CARD_CREATED (yellow)
    +--> MODERATION_CARD_CREATED (automatic red)
    +--> SANCTION_CREATED (account ban)
    +--> USER_STATUS_CHANGED (BANNED)
    +--> session revocation operation
```

These events may share one correlation ID.

This is especially useful when one transaction or workflow creates several domain changes.

## 26. Request ID vs. Correlation ID

They serve different purposes.

```text
requestId
= technical request/job trace

correlationId
= logical multi-event operation
```

A single request may generate several correlated events.

A background workflow may also continue a correlation after the original HTTP request has ended.

## 27. Reason

`reason` may contain a concise audit-safe explanation where the action requires one.

Examples:

```text
"Repeated harassment"
"Moderator correction"
"Ban evasion protection"
```

The field must not become a duplicate dump of all domain notes.

Where a structured domain entity already owns the reason, the audit record should primarily reference that entity.

## 28. Internal Notes

Full mutable moderator notes should generally remain on the appropriate domain entity.

Audit records may preserve a safe snapshot only when necessary to explain the historical action.

Sensitive notes must not automatically be copied into every audit event.

## 29. Metadata

Some actions require additional structured historical context.

Use a constrained JSON metadata field where appropriate.

Example:

```json
{
  "fromStatus": "ACTIVE",
  "toStatus": "BANNED"
}
```

or:

```json
{
  "role": "MODERATOR"
}
```

Metadata is supplemental.

It must not become an untyped dumping ground.

## 30. Metadata Rules

Audit metadata must:

- be intentionally constructed server-side,
- contain only fields needed for historical reconstruction,
- use stable keys,
- avoid entire request bodies,
- avoid access tokens,
- avoid refresh tokens,
- avoid passwords,
- avoid cookies,
- avoid authorization headers,
- avoid raw IP addresses,
- avoid unnecessary personal data,
- avoid arbitrary headers,
- avoid unrestricted exception objects.

Client-provided JSON must never be copied directly into audit metadata.

## 31. Before/After State

For meaningful transitions, metadata may contain selected before/after values.

Example:

```json
{
  "before": {
    "status": "ACTIVE"
  },
  "after": {
    "status": "BANNED"
  }
}
```

Do not snapshot complete database rows by default.

Only audit-relevant fields should be preserved.

## 32. Immutable Event Semantics

An audit event describes a completed action.

Example:

```text
SANCTION_REVOKED
```

means the sanction revocation was successfully committed.

Do not create success-style audit records before the business operation is guaranteed to succeed.

Failed attempts belong to security/application logs unless a dedicated security audit event is explicitly required.

## 33. Transaction Boundary

Where an audit event is required for a critical database transition, the domain change and audit record should normally be committed atomically.

Conceptual:

```text
BEGIN

change domain state
insert AuditLog

COMMIT
```

If either fails:

```text
ROLLBACK
```

This prevents:

```text
critical state changed
but
audit event missing
```

## 34. External Side Effects

Some operations also require external effects.

Example:

```text
ACCOUNT_BAN
→ database sanction
→ User.status = BANNED
→ audit event
→ Keycloak session revoke
```

The PostgreSQL transaction cannot atomically commit Keycloak changes.

Therefore the audit model must distinguish the authoritative domain transition from external operational success where necessary.

The exact reliable side-effect mechanism can be defined during implementation.

## 35. Idempotency

Retryable workflows must not create misleading duplicate audit events.

Example:

```text
worker retries SANCTION_EXPIRED
```

should not generate five identical expiration events if only one actual state transition occurred.

Idempotency should follow the underlying domain transition.

If the transition is already complete, no new success event should normally be created.

## 36. Audit Event Creation Responsibility

Audit creation belongs in the application/domain service layer responsible for the privileged transition.

Controllers should not manually duplicate audit logic for every endpoint.

Preferred direction:

```text
Controller
    |
    v
Domain/Application Service
    |
    +--> authorization
    +--> validation
    +--> transaction
            |
            +--> domain change
            +--> audit event
```

## 37. Audit Service

A dedicated audit service may provide safe event construction.

Responsibilities may include:

- validating action/category combinations,
- validating actor information,
- validating target information,
- applying metadata allowlists,
- attaching request IDs,
- generating correlation IDs,
- persisting events,
- preventing unsafe fields.

It must not become the owner of unrelated domain business logic.

## 38. Moderation Report Auditing

Critical report operations should create audit events.

At minimum consider:

```text
MODERATION_REPORT_ASSIGNED
MODERATION_REPORT_RESOLVED
MODERATION_REPORT_DISMISSED
```

Exceptional administrative deletion or correction must also be auditable.

Ordinary user report creation is not necessarily a privileged audit event.

The `ModerationReport` row represents workflow state.

`AuditLog` represents historical privileged actions against that workflow.

## 39. Moderation Card Auditing

At minimum audit:

```text
MODERATION_CARD_CREATED
MODERATION_CARD_REVOKED
MODERATION_CARD_EXPIRED
```

Also audit security-relevant changes to editable internal metadata if such editing is allowed.

Audit context should reference `moderationCardId`.

For automatic red cards:

```text
actorType = SYSTEM
```

The audit history must make manual and automatic escalation distinguishable.

## 40. Sanction Auditing

At minimum audit:

```text
SANCTION_CREATED
SANCTION_EXTENDED
SANCTION_REVOKED
SANCTION_EXPIRED
```

Audit context should reference:

```text
sanctionId
targetUserId
source card/report where applicable
```

Account-status transitions caused by sanctions must also be auditable.

## 41. IP Block Auditing

At minimum audit:

```text
IP_BLOCK_CREATED
IP_BLOCK_EXTENDED
IP_BLOCK_DEACTIVATED
IP_BLOCK_EXPIRED
IP_BLOCK_REACTIVATED
```

Reactivation is only relevant if Kurvenfunk later supports it.

Audit records must never contain the raw IP address.

An audit event may reference:

```text
ipBlockId
sanctionId
targetUserId
```

when those relations exist.

## 42. Raw IP Prohibition

Audit logs must not store:

```text
192.0.2.1
2001:db8::1
```

or any other raw client IP as audit metadata.

If investigation requires the pseudonymous IP identity, the audit event should reference the `IPBlock` or another approved pseudonymous identifier.

Do not duplicate `ipHash` unnecessarily into audit metadata when an `ipBlockId` reference is sufficient.

## 43. User Status Auditing

Transitions involving:

```text
LIMITED
BANNED
```

must be auditable.

Example:

```text
action = USER_STATUS_CHANGED

metadata:
{
  "fromStatus": "ACTIVE",
  "toStatus": "LIMITED"
}
```

The event should identify:

- affected user,
- actor,
- reason/context,
- related sanction where applicable.

Do not treat `User.status` as the complete moderation history.

## 44. User Role Auditing

Privileged role changes are security-sensitive.

Audit at minimum:

```text
USER_ROLE_GRANTED
USER_ROLE_REVOKED
```

Metadata should identify the changed role.

Example:

```json
{
  "role": "MODERATOR"
}
```

The audit event must identify:

- acting administrator,
- affected user,
- role,
- time,
- request/correlation context.

## 45. Ordinary User Changes

Not every user-profile edit requires immutable audit history.

Examples that normally do not require moderation-style audit records:

- changing display name,
- changing bio,
- selecting favorite club,
- changing notification preferences.

Security-sensitive account operations may require separate audit treatment later.

## 46. Comment Moderation Auditing

Critical moderator actions should be auditable.

At minimum consider:

```text
COMMENT_DELETED_BY_MODERATOR
COMMENT_RESTORED_BY_MODERATOR
COMMENT_MODERATED
```

Ordinary author edits and normal user soft deletion do not automatically require privileged audit events.

The Comment model remains responsible for content state.

The audit log records the privileged transition.

## 47. Forum Auditing

Forum moderation actions that should be auditable include:

```text
THREAD_PINNED
THREAD_UNPINNED
THREAD_LOCKED
THREAD_UNLOCKED
THREAD_MOVED
THREAD_MERGED

POST_DELETED_BY_MODERATOR
POST_RESTORED_BY_MODERATOR
POST_MODERATED
```

For thread movement, metadata may preserve:

```json
{
  "fromForumId": "...",
  "toForumId": "..."
}
```

Do not rely on current `thread.forumId` to reconstruct historical movement.

## 48. Thread Merge Auditing

A merge involves more than one logical resource.

The surviving thread should normally be the primary target.

Metadata or explicit future relationships may identify the merged source thread.

Example:

```text
targetType = THREAD
targetId = survivingThreadId

metadata:
{
  "mergedThreadId": "..."
}
```

If merge requirements become more complex, a dedicated merge-history entity may be preferable.

## 49. Editorial Auditing

Not every editorial edit requires immutable security-style auditing.

Audit should focus on sensitive publication/admin operations.

Examples:

```text
ARTICLE_PUBLISHED
ARTICLE_UNPUBLISHED
ARTICLE_ARCHIVED
```

Potential future audited actions:

- destructive media replacement,
- administrative hard deletion,
- sensitive correction of published content.

Article revision history remains separate from the general audit log.

## 50. Sports Data Corrections

Automated provider updates do not need one audit record per field change.

Manual administrative corrections to important sports data may create:

```text
ADMIN_CORRECTION
```

with:

```text
targetType = MATCH
```

or another relevant target.

The import subsystem remains responsible for provider/import provenance.

## 51. Reaction Auditing

Ordinary:

```text
LIKE created
LIKE removed
```

must not create audit records.

If administrators later receive tools to manipulate reaction data, those privileged actions may require audit logging.

## 52. Authentication Events

The Task 078 audit model is primarily for privileged business/admin/moderation actions.

Routine authentication events such as every successful login should not automatically enter this table.

Authentication/security telemetry may use dedicated logs or security event storage.

Critical administrative security actions may later be included if required.

## 53. Failed Authorization Attempts

Ordinary 403 responses should not flood the immutable audit table.

Repeated or suspicious attempts belong primarily to security telemetry.

A high-severity security incident may create a dedicated audit/security event if policy requires it.

## 54. Session Revocation

A ban may require Keycloak session revocation.

The authoritative audit trail should at least record the ban/status/sanction transition that required revocation.

If Kurvenfunk later needs explicit session-management auditing, define stable actions such as:

```text
USER_SESSIONS_REVOKED
```

Do not store session tokens or session secrets.

## 55. Card → Sanction → Status Example

Automatic escalation:

```text
third relevant yellow card
        |
        v
automatic RED ModerationCard
        |
        v
ACCOUNT_BAN Sanction
        |
        v
User.status = BANNED
        |
        v
sessions revoked
```

Audit events may be:

```text
MODERATION_CARD_CREATED
MODERATION_CARD_CREATED
SANCTION_CREATED
USER_STATUS_CHANGED
```

All can share:

```text
correlationId
```

The first card event may be human-initiated while the later automatic events use `SYSTEM`.

## 56. Direct Red Card Example

```text
Moderator
    |
    v
direct RED card
    |
    +--> ACCOUNT_BAN
    +--> BANNED
    +--> session revoke
```

Audit context should preserve:

- moderator actor,
- affected user,
- red card ID,
- sanction ID,
- reason/context,
- request ID,
- shared correlation ID.

## 57. IP Protection Example

```text
Moderator creates temporary IP protection
        |
        +--> Sanction context if applicable
        |
        +--> IPBlock
        |
        +--> AuditLog(IP_BLOCK_CREATED)
```

The audit record references the block.

It does not copy the raw IP.

## 58. Worker Expiration Example

```text
Sanction expiration worker
        |
        v
ACTIVE sanction reaches expiresAt
        |
        v
status becomes EXPIRED
        |
        v
AuditLog(SANCTION_EXPIRED)
```

Actor:

```text
WORKER
```

If the user's effective account status changes as a result, that transition may produce an additional correlated audit event.

## 59. Manual Correction Example

If an administrator corrects a historical mistake:

```text
do not silently rewrite audit history
```

Instead:

1. perform an explicitly authorized correction to the relevant domain state,
2. create a new audit event describing the correction,
3. reference the affected entity,
4. preserve the earlier audit event unchanged.

## 60. Audit Log vs. Application Log

These systems have different purposes.

### Audit Log

Persistent business/security history:

```text
who changed what
which privileged transition occurred
which resource was affected
```

### Structured Application Log

Operational diagnostics:

```text
request received
query failed
queue job started
provider timeout
stack trace
```

A structured log entry may be deleted according to operational retention without changing the authoritative audit history.

## 61. Audit Log vs. Moderation History

The moderation UI may aggregate:

```text
Reports
Cards
Sanctions
IP Blocks
Audit Events
```

These are not one entity.

Each retains its own domain meaning.

`AuditLog` supplies the chronological privileged-action layer.

## 62. Audit Log vs. Revision History

Content revision history answers:

```text
what versions of the content existed?
```

Audit history answers:

```text
who performed the privileged action and when?
```

They may reference the same article or content item but must not be conflated.

## 63. Audit Log vs. Import History

Import history answers:

```text
which provider payload/job produced this data?
```

Audit history answers:

```text
which privileged administrative action changed or corrected the data?
```

Routine provider imports should not flood the audit table.

## 64. Append-Only Policy

Normal application code must not expose:

```text
UPDATE AuditLog
DELETE AuditLog
```

as ordinary domain operations.

There should be no generic admin CRUD interface for audit rows.

Admin users may read audit records according to permissions.

## 65. Database Enforcement Direction

Application-level immutability is required.

Production may additionally enforce stronger database restrictions later, for example:

- restricted DB roles,
- no update/delete privileges for application paths,
- database triggers preventing mutation,
- partition/archival strategies.

Exact infrastructure enforcement is outside Task 078.

## 66. Deletion Policy

Audit records must not be cascade-deleted merely because:

- actor user is deleted,
- target user is deleted,
- target content is deleted,
- a sanction is revoked,
- an IP block expires.

Relations must be designed to preserve audit history.

## 67. Target Deletion

If the target entity is later deleted, the audit record should remain.

The generic:

```text
targetType
targetId
```

can preserve the historical locator even when a relational target no longer exists.

Explicit optional foreign keys may become null depending on deletion policy.

The event itself remains.

## 68. User Account Deletion

Account deletion and GDPR/privacy workflows require careful separation between:

- keeping necessary security/moderation history,
- removing unnecessary personal data,
- anonymizing user-facing/profile data,
- complying with retention policy.

Task 249 defines moderation retention policy.

Task 251 defines account deletion.

Task 296 performs privacy audit.

Task 078 must not assume indefinite retention of all personal information.

## 69. Retention

Audit retention must be policy-driven.

Different categories may eventually have different retention requirements.

Examples:

- moderation enforcement,
- security administration,
- editorial actions,
- routine admin changes.

Task 249 will define concrete moderation retention.

Until then:

- do not implement arbitrary automatic deletion,
- preserve enough structure for future category-based retention,
- minimize stored personal data from the start.

## 70. Privacy Classification

Audit records may contain security-sensitive and personal data.

They are internal administrative data.

They must not be publicly exposed.

Access must be permission-controlled and logged appropriately where required.

## 71. Data Minimization

Store only what is needed to reconstruct the privileged action.

Prefer:

```text
actorUserId
action
targetType
targetId
targetUserId
related domain IDs
selected before/after values
timestamp
request/correlation IDs
```

over:

```text
full user object
full request body
full content body
all headers
raw IP
complete profile snapshot
```

## 72. Sensitive Data Prohibition

Never store in audit metadata:

- passwords,
- password reset tokens,
- access tokens,
- refresh tokens,
- API keys,
- Keycloak secrets,
- Redis passwords,
- database passwords,
- Cloudflare tokens,
- session cookies,
- authorization headers,
- raw IP addresses.

## 73. Content Snapshots

Do not copy full comment/post/article bodies into the general audit log by default.

If moderation evidence snapshots are needed later, define them deliberately in the appropriate moderation/evidence domain.

Audit records can reference the affected content.

## 74. Audit Viewer

Task 244 will provide an Audit Viewer.

The model should support filters such as:

- time range,
- actor,
- affected user,
- action,
- category,
- target type,
- target ID,
- report,
- card,
- sanction,
- IP block,
- request ID,
- correlation ID.

## 75. User Moderation History

Task 188 requires a moderator-facing user moderation history.

A useful timeline may combine:

```text
Reports
Cards
Sanctions
IP Blocks
AuditLog
```

`targetUserId` is therefore an important query field.

## 76. Recommended Indexes

Likely indexes:

```text
(occurredAt)
(actorUserId, occurredAt)
(targetUserId, occurredAt)
(action, occurredAt)
(category, occurredAt)
(targetType, targetId, occurredAt)

(moderationReportId, occurredAt)
(moderationCardId, occurredAt)
(sanctionId, occurredAt)
(ipBlockId, occurredAt)

(requestId)
(correlationId)
```

Final indexes should be based on real query patterns and PostgreSQL plans.

## 77. High-Volume Considerations

Audit history can grow continuously.

Do not add an index for every imaginable filter.

Potential future measures:

- time-based partitioning,
- archival,
- category-specific retention,
- cold storage for old audit records.

These are not required for MVP.

## 78. Pagination

Audit viewer APIs should use cursor-based pagination.

Recommended stable ordering:

```text
occurredAt DESC
id DESC
```

The cursor must include enough information to handle identical timestamps deterministically.

## 79. API Exposure

Audit records are internal.

They must not be exposed through public APIs.

A moderator/admin endpoint should return only fields permitted for that viewer.

Metadata may require additional filtering.

## 80. Permission Requirements

Potential permissions:

```text
audit.read
audit.read_sensitive
```

Task 172 defines the central permission system.

Possible policy:

- MODERATOR: moderation-relevant audit history,
- ADMIN: broader administrative audit history,
- SUPERADMIN: security-sensitive audit history.

Exact role-to-permission mapping belongs to the permission model, not `AuditLog`.

## 81. Audit of Audit Access

For highly sensitive audit data, Kurvenfunk may later audit access/export operations themselves.

Examples:

```text
AUDIT_EXPORT_CREATED
AUDIT_SENSITIVE_VIEW_ACCESSED
```

This is optional for MVP but the design should not prevent it.

Avoid generating recursive noise for every ordinary audit viewer page load unless policy requires it.

## 82. Export

Bulk audit export should be a privileged operation.

If implemented later:

- permission check,
- reason where appropriate,
- rate limiting,
- safe export fields,
- no secret metadata,
- possible audit event for the export itself.

## 83. Concurrency

Audit insertion must remain safe under concurrent moderation actions.

The event table is naturally append-oriented.

Concurrency correctness primarily belongs to the affected domain transition.

Example:

Two moderators attempt to revoke the same sanction.

Only the transaction that actually performs the state transition should create:

```text
SANCTION_REVOKED
```

## 84. Duplicate Events

Audit rows should not be deduplicated merely because they share:

```text
action
targetId
actorUserId
```

Two legitimate actions may look similar.

Duplicate prevention should come from:

- transactional domain state,
- idempotency keys where appropriate,
- workflow/job uniqueness.

## 85. Event Versioning

Audit metadata schemas may evolve.

Recommended conceptual field:

```text
schemaVersion
```

or an equivalent strategy.

This allows future readers to interpret historical metadata correctly.

For MVP, a simple integer starting at:

```text
1
```

is sufficient if included.

## 86. Recommended Addition: `schemaVersion`

Updated conceptual entity:

```text
AuditLog

id
occurredAt

actorType
actorUserId?
actorLabel?

action
category

targetType
targetId?
targetUserId?

requestId?
correlationId?

moderationReportId?
moderationCardId?
sanctionId?
ipBlockId?

reason?
metadata?
schemaVersion

createdAt
```

## 87. Source

It may be useful to distinguish the technical origin of the event.

Conceptual optional enum:

```text
AuditSource

API
WORKER
SYSTEM
ADMIN_UI
```

However, this may overlap with actor type and request correlation.

Recommendation for MVP:

Do not add `source` unless implementation needs it.

Actor type plus request/correlation context is sufficient initially.

## 88. Success/Failure Status

The core audit table records committed successful domain actions.

Recommendation:

Do not add a generic:

```text
SUCCESS
FAILED
```

field for MVP.

Failed attempts belong primarily to operational/security logging.

If Kurvenfunk later requires security-attempt auditing, model those events explicitly rather than mixing them with committed state transitions.

## 89. Severity

A generic severity field is not required for domain audit correctness.

Security monitoring may derive severity from:

```text
action
category
```

If future incident tooling needs explicit severity, it can be added deliberately.

## 90. Human-Readable Message

Do not make a localized human-readable sentence the authoritative audit representation.

Store structured fields.

The UI can render:

```text
Moderator Alice revoked a forum block for user Bob.
```

from:

```text
action
actor
target
metadata
```

This keeps audit records stable across language changes.

## 91. Localization

Audit action identifiers and metadata keys are English machine-facing identifiers.

User/admin UI translations happen at presentation level.

Do not persist translated event names such as:

```text
"Benutzer gesperrt"
```

as the canonical action.

## 92. Validation Rules

Every audit event must satisfy:

1. `id` exists.
2. `occurredAt` exists.
3. `actorType` exists.
4. `action` exists.
5. `category` exists.
6. `targetType` exists.
7. `schemaVersion` is valid.
8. `actorType = USER` requires `actorUserId`.
9. non-user actors must not require `actorUserId`.
10. metadata passes the safe metadata policy.
11. raw IPs are prohibited.
12. secrets are prohibited.
13. explicit domain references must match the event context when supplied.
14. `targetUserId` must represent the affected user, not automatically the actor.
15. action/category combinations must be recognized.

## 93. Actor Validation

### `USER`

Requires:

```text
actorUserId != null
```

### `SYSTEM`

Normally:

```text
actorUserId = null
```

### `WORKER`

Normally:

```text
actorUserId = null
```

### `SECURITY_AUTOMATION`

Normally:

```text
actorUserId = null
```

Do not invent fake system users merely to satisfy a relational model.

## 94. Target Validation

Examples:

```text
action = SANCTION_REVOKED
→ sanctionId should exist
→ targetType should normally be SANCTION
→ targetId should match sanctionId
```

```text
action = IP_BLOCK_CREATED
→ ipBlockId should exist
→ targetType should normally be IP_BLOCK
→ targetId should match ipBlockId
```

```text
action = USER_ROLE_GRANTED
→ targetType = USER
→ targetUserId should identify the affected user
```

Validation should be implemented through safe event builders/domain services rather than one enormous generic client payload.

## 95. Metadata Validation

Prefer action-specific metadata types.

Conceptual examples:

```text
UserStatusChangedMetadata
RoleChangedMetadata
ThreadMovedMetadata
SanctionExtendedMetadata
```

rather than:

```text
Record<string, unknown>
```

throughout application code.

The database may still store JSON, while TypeScript construction remains typed.

## 96. Metadata Examples

### User status

```json
{
  "fromStatus": "ACTIVE",
  "toStatus": "LIMITED"
}
```

### Role grant

```json
{
  "role": "MODERATOR"
}
```

### Thread move

```json
{
  "fromForumId": "forum-a",
  "toForumId": "forum-b"
}
```

### Sanction extension

```json
{
  "previousExpiresAt": "2026-08-15T12:00:00Z",
  "newExpiresAt": "2026-08-18T12:00:00Z"
}
```

### IP block extension

```json
{
  "previousExpiresAt": "2026-08-15T12:00:00Z",
  "newExpiresAt": "2026-08-16T12:00:00Z"
}
```

No raw IP is included.

## 97. Conceptual Enums

### `AuditActorType`

```text
USER
SYSTEM
WORKER
SECURITY_AUTOMATION
```

### `AuditCategory`

```text
AUTHORIZATION
ACCOUNT
MODERATION
SANCTION
IP_PROTECTION
CONTENT
FORUM
EDITORIAL
SECURITY
SYSTEM
```

### `AuditTargetType`

```text
USER
MODERATION_REPORT
MODERATION_CARD
SANCTION
IP_BLOCK
COMMENT
FORUM
THREAD
FORUM_POST
ARTICLE
MEDIA
CLUB
MATCH
SYSTEM
```

### `AuditAction`

Initial direction:

```text
USER_ROLE_GRANTED
USER_ROLE_REVOKED

USER_STATUS_CHANGED

MODERATION_REPORT_ASSIGNED
MODERATION_REPORT_RESOLVED
MODERATION_REPORT_DISMISSED

MODERATION_CARD_CREATED
MODERATION_CARD_REVOKED
MODERATION_CARD_EXPIRED
MODERATION_CARD_NOTE_CHANGED

SANCTION_CREATED
SANCTION_EXTENDED
SANCTION_REVOKED
SANCTION_EXPIRED

IP_BLOCK_CREATED
IP_BLOCK_EXTENDED
IP_BLOCK_DEACTIVATED
IP_BLOCK_EXPIRED
IP_BLOCK_REACTIVATED

COMMENT_MODERATED
COMMENT_DELETED_BY_MODERATOR
COMMENT_RESTORED_BY_MODERATOR

THREAD_PINNED
THREAD_UNPINNED
THREAD_LOCKED
THREAD_UNLOCKED
THREAD_MOVED
THREAD_MERGED

POST_MODERATED
POST_DELETED_BY_MODERATOR
POST_RESTORED_BY_MODERATOR

ARTICLE_PUBLISHED
ARTICLE_UNPUBLISHED
ARTICLE_ARCHIVED

ADMIN_CORRECTION
```

Task 081 may refine this enum as all domain models are translated into Prisma.

## 98. Conceptual Prisma Direction

Task 081 may produce a model similar to:

```text
AuditLog
├── id
├── occurredAt
├── actorType
├── actorUserId?
├── actorLabel?
├── action
├── category
├── targetType
├── targetId?
├── targetUserId?
├── requestId?
├── correlationId?
├── moderationReportId?
├── moderationCardId?
├── sanctionId?
├── ipBlockId?
├── reason?
├── metadata?
├── schemaVersion
└── createdAt
```

Potential relations:

```text
AuditLog.actorUser
AuditLog.targetUser
AuditLog.moderationReport
AuditLog.moderationCard
AuditLog.sanction
AuditLog.ipBlock
```

Delete behavior must preserve audit history.

## 99. No `updatedAt`

Recommendation:

Do not give `AuditLog` an ordinary mutable `updatedAt`.

The event is append-only.

A changing `updatedAt` would imply normal mutation is expected.

If infrastructure later performs archival/migration bookkeeping, that should not alter the historical event semantics.

## 100. No Soft Delete

Do not add:

```text
deletedAt
isDeleted
```

as ordinary audit lifecycle fields.

Audit retention deletion, if legally/policy required, is an administrative data-retention process rather than user-facing soft deletion.

## 101. No `active`

Audit events are historical facts.

They are not active/inactive.

If a prior action is later reversed:

```text
SANCTION_CREATED
SANCTION_REVOKED
```

both events remain.

Do not set the first event to:

```text
active = false
```

## 102. No Mutable Resolution

An audit event does not become resolved.

If a moderation decision is appealed or reversed, create the relevant new domain transition and corresponding new audit event.

## 103. Relationship to Task 074

`ModerationReport` is current report workflow state.

Task 078 provides immutable history for privileged report transitions.

Examples:

```text
assignment
resolution
dismissal
exceptional administrative correction
```

## 104. Relationship to Task 075

`ModerationCard` is the disciplinary card entity.

Task 078 records card lifecycle actions.

Examples:

```text
creation
automatic creation
revocation
expiration
sensitive note changes
```

## 105. Relationship to Task 076

`Sanction` is the technical enforcement entity.

Task 078 records sanction lifecycle and related account-state changes.

Examples:

```text
creation
extension
revocation
expiration
```

## 106. Relationship to Task 077

`IPBlock` stores pseudonymous IP protection state.

Task 078 records critical block lifecycle transitions.

Audit payloads must not contain raw IP addresses.

## 107. Relationship to Task 079

Notifications are user-facing messages.

Audit events are internal historical records.

One action may create both.

Example:

```text
yellow card
    |
    +--> ModerationCard
    +--> AuditLog
    +--> Notification
```

Notification delivery state must not be stored in `AuditLog`.

## 108. Relationship to Task 080

Import models store provider/import provenance.

Routine imports should not generate general audit events for every imported record.

Manual corrections and privileged overrides may be audited.

## 109. Relationship to Task 081

Task 081 translates this conceptual model into Prisma.

It must decide:

- concrete ID type,
- enum names,
- JSON representation,
- foreign-key delete behavior,
- relation names,
- indexes,
- constraints,
- whether `actorLabel` is retained,
- exact metadata typing strategy at application level.

## 110. Relationship to Task 172

Task 172 defines centralized permissions.

Audit logging must occur after successful authorization and as part of the protected domain operation.

Possible permissions:

```text
audit.read
audit.read_sensitive
```

Audit creation itself should generally not be exposed as a generic permission/API action.

## 111. Relationship to Task 176

Automatic third-yellow escalation should produce correlated audit history for the resulting red card, account ban, and status transition.

The actor for automatic transitions is `SYSTEM`.

## 112. Relationship to Task 177

Direct red cards require a human actor with the appropriate permission.

The audit trail must preserve:

- moderator,
- affected user,
- card,
- resulting sanction,
- request/correlation context.

## 113. Relationship to Task 184

Manual IP bans are audit-required.

The event must reference the IP block but never store raw IP.

## 114. Relationship to Task 188

User Moderation History should aggregate audit records using `targetUserId` and explicit moderation references.

## 115. Relationship to Task 190

If a four-eyes approval model is introduced, approval actions must become explicit audit events.

Possible future actions:

```text
MODERATION_ACTION_APPROVED
MODERATION_ACTION_REJECTED
```

Do not silently overwrite the original proposal/decision.

## 116. Relationship to Task 191

Sanction and IP-block expiration workers should create audit events only when they actually perform a lifecycle transition.

Retries must remain idempotent.

## 117. Relationship to Task 239

User Detail can show audit history relevant to the selected user.

It must not expose unrelated sensitive system audit data merely because the viewer can access a user page.

## 118. Relationship to Task 244

Audit Viewer is the primary administrative interface for querying `AuditLog`.

The viewer should be read-only.

No edit/delete buttons should exist for ordinary audit records.

## 119. Relationship to Task 249

Task 249 defines concrete moderation retention.

Audit categories and timestamps must support those policies.

## 120. Relationship to Task 250

User data export must consider whether and which audit information constitutes exportable personal data.

The audit model itself does not decide legal export scope.

## 121. Relationship to Task 251

Account deletion must not automatically destroy security/moderation audit history.

Personal identifiers must nevertheless follow the future deletion/anonymization and retention policy.

## 122. Relationship to Task 296

Privacy audit must specifically inspect:

- actor identifiers,
- target user identifiers,
- reason text,
- metadata,
- retention,
- raw-IP prohibition,
- access controls,
- audit export.

## 123. Security Requirements

1. Audit creation is server-side only.
2. Clients cannot choose arbitrary actor IDs.
3. Clients cannot choose arbitrary audit actions.
4. Clients cannot inject unrestricted metadata.
5. Audit records are append-only.
6. Public APIs cannot read audit history.
7. Raw IP addresses are prohibited.
8. Secrets and authentication material are prohibited.
9. Sensitive reads require permission checks.
10. Critical domain transitions and required audit events should share a database transaction.
11. Actor identity comes from trusted authentication/application context.
12. Request IDs come from the trusted request context.
13. Worker/system actor identity comes from trusted application code.

## 124. Privacy Requirements

1. Store the minimum historical information necessary.
2. Do not duplicate profile information unnecessarily.
3. Do not store raw IP addresses.
4. Do not store full request bodies.
5. Do not store authentication secrets.
6. Do not store full content snapshots by default.
7. Support future retention policies.
8. Preserve audit integrity without assuming infinite retention.
9. Keep audit data internal and permission-controlled.

## 125. Domain Invariants

1. Audit events are append-only.
2. Audit events describe completed accepted actions.
3. Every event has a stable action.
4. Every event has a category.
5. Every event has an actor type.
6. Human actors reference the acting user.
7. System/worker actors do not require fake user accounts.
8. Every event has a primary target type.
9. Affected users are separately queryable through `targetUserId`.
10. Critical moderation entities can be explicitly referenced.
11. Raw IP addresses never enter audit data.
12. Secrets never enter audit data.
13. Metadata is server-constructed and minimized.
14. Required audit events are transactionally coupled to PostgreSQL domain changes where possible.
15. Reversal creates a new event; it does not mutate the old event.
16. Audit records do not use `active`, soft-delete, or ordinary mutable `updatedAt`.
17. Routine high-volume operational telemetry does not belong in the audit table.
18. User deletion must not cascade-delete audit history.
19. Request and correlation identifiers support cross-system reconstruction.
20. PostgreSQL remains the source of truth for audit history.

## 126. Decisions Made in Task 078

### Audit semantics

`AuditLog` is an immutable append-only event history for critical privileged actions.

### Actor model

Actors are explicitly typed:

```text
USER
SYSTEM
WORKER
SECURITY_AUTOMATION
```

No fake system user is required.

### Target model

Every event has one primary target type and optional target ID.

Affected users can additionally be referenced with `targetUserId`.

### Moderation relations

The model should support explicit references to:

```text
ModerationReport
ModerationCard
Sanction
IPBlock
```

where applicable.

### Correlation

Audit events may carry:

```text
requestId
correlationId
```

for technical and logical reconstruction.

### Metadata

Metadata is structured, minimized, server-generated, and action-specific.

It is not a request dump.

### IP privacy

Raw IP addresses are strictly prohibited in audit records.

### Mutation

Existing audit events are never edited to represent later reversals.

Later actions create additional events.

### Transactionality

Critical PostgreSQL state transitions and their required audit records should normally commit atomically.

### Scope

Routine application logs, analytics, rate-limit hits, ordinary reactions, and routine provider imports are excluded from the immutable audit history.

### Retention

Concrete retention periods are deferred to Task 249, but the model is designed for category/time-based retention and privacy review.

## 127. Acceptance Checklist

- [x] Critical admin/moderation actions can be reconstructed.
- [x] Human and automated actors are distinguishable.
- [x] Role changes are auditable.
- [x] LIMITED/BANNED status transitions are auditable.
- [x] Moderation report transitions are auditable.
- [x] Moderation card lifecycle is auditable.
- [x] Sanction lifecycle is auditable.
- [x] IP-block lifecycle is auditable.
- [x] Forum moderation actions are auditable.
- [x] Sensitive content moderation actions are auditable.
- [x] Request correlation is supported.
- [x] Multi-event workflows can share a correlation ID.
- [x] Audit history remains separate from domain state.
- [x] Audit history remains separate from application logs.
- [x] Audit history remains separate from revision/import history.
- [x] Raw IP addresses are prohibited.
- [x] Secrets are prohibited.
- [x] Metadata is minimized.
- [x] Append-only semantics are defined.
- [x] Normal edit/delete operations are prohibited.
- [x] User deletion does not imply audit deletion.
- [x] Retention can be defined later.
- [x] Admin viewer query requirements are supported.
- [x] Prisma implementation is intentionally deferred to Task 081.

## 128. Result

Task 078 defines `AuditLog` as Kurvenfunk's immutable historical record for critical privileged actions.

The model provides a consistent audit foundation across:

```text
Users
Roles
Account status
Moderation reports
Moderation cards
Sanctions
IP protection
Comments
Forum moderation
Editorial administration
Manual data corrections
System and worker transitions
```

while deliberately keeping audit history separate from operational logs, mutable domain state, content revisions, import provenance, notifications, and high-volume security telemetry.

This gives Task 081 a clear Prisma direction and provides the foundation required by later moderation, administration, security, privacy, and Audit Viewer tasks.
