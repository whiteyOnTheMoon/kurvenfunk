# Sanction Domain Model

**Project:** Kurvenfunk
**Task:** 076 – Sanction Model
**Status:** Domain model defined
**Target:** `docs/database/sanction-model.md`

## 1. Purpose

Kurvenfunk stores sanctions separately from moderation cards.

A moderation card documents a moderation decision or disciplinary event.

A sanction represents the concrete restriction that is technically enforced against a user, account, community capability, or IP identity.

This separation is intentional.

```text
Moderation decision
        |
        +----> ModerationCard
        |       |
        |       +----> warning / escalation history
        |
        +----> Sanction
                |
                +----> technical enforcement
```

Examples:

```text
YELLOW card
-> formal warning
-> no sanction required

BLUE card
-> moderation event
-> one or more temporary sanctions enforce the restriction

RED card
-> severe moderation event
-> ACCOUNT_BAN sanction
-> User.status = BANNED
-> sessions revoked

manual moderation action
-> may create a sanction without creating a card
```

The sanction model therefore owns:

- restriction type
- restriction scope
- affected target
- start time
- expiration time
- current sanction state
- moderation reason
- user-visible explanation
- internal moderator note
- originating card or report when applicable
- creator or system origin
- revocation metadata
- enforcement semantics
- history required for later audit integration

The sanction model does not replace:

- `User.status`
- `ModerationCard`
- `ModerationReport`
- the future `IPBlock` entity
- audit logging
- permission definitions
- Keycloak session state

These domains work together but remain separate.

---

## 2. Core Domain Rule

The central rule is:

```text
Card != Sanction
```

A card explains the disciplinary decision.

A sanction explains the technical restriction.

Therefore Kurvenfunk must never depend on the presence of a card alone when deciding whether an action is currently allowed.

Permission enforcement must consider active sanctions.

Example:

```text
ModerationCard
type = BLUE

Sanction
type = COMMENT_BLOCK
status = ACTIVE
startsAt = 2026-08-14T10:00:00Z
expiresAt = 2026-08-15T10:00:00Z
```

The card is moderation history.

The sanction is the source of truth for whether the comment restriction is currently enforced.

---

## 3. Entity

Primary entity:

```text
Sanction
```

Conceptual fields:

```text
Sanction

id
type
status

userId

createdById
sourceCardId
sourceReportId

reasonCode
userMessage
internalNote

startsAt
expiresAt

revokedAt
revokedById
revocationReason

ipBlockId

createdAt
updatedAt
```

Not every field is required for every sanction type.

Detailed validation rules are defined later in this document.

---

## 4. Sanction Types

Kurvenfunk initially supports the following conceptual sanction types:

```text
SanctionType

LIMITED
COMMENT_BLOCK
FORUM_BLOCK
ACCOUNT_BAN
IP_BLOCK
```

The enum describes what is restricted.

It does not describe why the restriction exists.

The reason belongs to structured moderation reason data and explanatory fields.

---

## 5. `LIMITED`

`LIMITED` represents the account-level restriction defined by the Kurvenfunk user-status model.

While at least one effective `LIMITED` sanction is active, and no stronger account ban is active:

```text
User.status = LIMITED
```

A LIMITED user may continue to:

- read public content
- browse news
- search
- view matches
- view standings
- read comments
- read forum content
- vote/react where otherwise permitted

A LIMITED user may not:

- create comments
- reply to comments
- create threads
- create forum posts

The user-status model remains the authoritative current account-state projection stored on `User`.

The sanction record stores why the status exists and for how long.

Example:

```text
Sanction
type = LIMITED
status = ACTIVE
userId = user_123
startsAt = 2026-08-14T10:00:00Z
expiresAt = 2026-08-17T10:00:00Z
```

Result:

```text
User.status = LIMITED
```

When the sanction expires, Kurvenfunk must recalculate the effective account status instead of blindly setting the user to `ACTIVE`.

---

## 6. `COMMENT_BLOCK`

`COMMENT_BLOCK` prevents comment creation.

It is more granular than `LIMITED`.

An active comment block normally denies:

```text
comment.create
comment.reply
```

It does not automatically deny:

```text
comment.read
comment.vote
thread.create
thread.reply
post.create
search
```

Those actions remain subject to:

- role permissions
- account status
- other sanctions
- resource-specific rules
- rate limits
- moderation rules

Example:

```text
User.status = ACTIVE

Sanction
type = COMMENT_BLOCK
status = ACTIVE
```

The user can remain generally active while being unable to post comments.

This is a primary reason sanctions must not be represented only through `User.status`.

---

## 7. `FORUM_BLOCK`

`FORUM_BLOCK` prevents active forum participation.

An active forum block normally denies:

```text
thread.create
thread.reply
post.create
```

Depending on the final permission naming introduced in Task 172, equivalent forum-write permissions must be covered by the same enforcement semantics.

A forum block does not automatically deny:

```text
forum.read
comment.create
comment.reply
comment.vote
search
```

unless another sanction or account status does so.

Example:

```text
User.status = ACTIVE

Sanction
type = FORUM_BLOCK
status = ACTIVE
expiresAt = 2026-08-21T10:00:00Z
```

The user may still comment on articles while being unable to participate in the forum.

---

## 8. `ACCOUNT_BAN`

`ACCOUNT_BAN` is the enforcement record for a banned account.

While an effective account-ban sanction exists:

```text
User.status = BANNED
```

A banned account must not perform authenticated Kurvenfunk actions.

Creating an account ban requires later enforcement logic to:

1. create or activate the sanction
2. set or recalculate `User.status = BANNED`
3. revoke active Keycloak sessions
4. deny authenticated platform actions
5. create an audit event
6. send the required moderation notification

The sanction and the red card remain separate records.

Example:

```text
ModerationCard
type = RED
status = ACTIVE

Sanction
type = ACCOUNT_BAN
status = ACTIVE
sourceCardId = <red card>
expiresAt = null
```

By default, red-card account bans are indefinite until explicitly revoked.

This means:

```text
expiresAt = null
```

does not mean that no enforcement exists.

It means that no automatic expiration is scheduled.

---

## 9. `IP_BLOCK`

`IP_BLOCK` represents the sanction-domain view of an IP-based restriction.

Detailed IP protection data belongs to Task 077 and the dedicated `IPBlock` entity.

The sanction model must not duplicate:

- `ipHash`
- IP hashing implementation
- IP retention rules
- IP-specific matching logic
- IP-block activation details owned by Task 077

Instead, the expected relationship is:

```text
Sanction
type = IP_BLOCK
        |
        v
IPBlock
```

Conceptually:

```text
Sanction.ipBlockId -> IPBlock.id
```

The `IP_BLOCK` sanction therefore provides moderation/enforcement context while `IPBlock` owns the technical IP target.

This allows future flows such as:

```text
RED card
-> ACCOUNT_BAN sanction
-> optional IP_BLOCK sanction
-> IPBlock record
```

An IP block must not be automatically created for every red card.

Shared IPs, mobile networks, VPNs, carrier-grade NAT and other network conditions make automatic permanent IP banning unsafe.

---

## 10. Sanction Status

Kurvenfunk should use an explicit sanction status.

Recommended conceptual enum:

```text
SanctionStatus

ACTIVE
EXPIRED
REVOKED
```

These values describe lifecycle state.

They are separate from `SanctionType`.

---

## 11. `ACTIVE`

An `ACTIVE` sanction is currently eligible for enforcement.

For a sanction to be effective at time `now`, all relevant conditions must be true:

```text
status = ACTIVE
startsAt <= now
expiresAt IS NULL OR expiresAt > now
```

If future scheduled sanctions are later required, they may remain `ACTIVE` with `startsAt > now` but must not yet be considered effective.

No separate `SCHEDULED` status is required for the MVP domain model.

This keeps lifecycle state simple while allowing future start times.

---

## 12. `EXPIRED`

`EXPIRED` means the sanction ended because its configured duration elapsed.

An expired sanction:

- is no longer enforced
- remains in moderation history
- is not deleted
- must not be treated as revoked
- can still be shown to authorized moderators
- may contribute historical context to later moderation decisions

Expiration is time-driven.

Example:

```text
status = EXPIRED
expiresAt = 2026-08-17T10:00:00Z
```

The sanction-expiration worker introduced by Task 191 may update eligible sanctions to this state.

---

## 13. `REVOKED`

`REVOKED` means an authorized moderator, administrator, system process or later appeal flow explicitly cancelled the sanction before or independently of natural expiration.

A revoked sanction:

- is no longer enforced
- remains in moderation history
- records when it was revoked
- records who revoked it where applicable
- records why it was revoked
- is distinguishable from normal expiration

Required revocation metadata:

```text
revokedAt
revokedById
revocationReason
```

`revokedById` may be nullable for clearly system-generated revocation flows.

---

## 14. Expired vs. Revoked

Expiration and revocation must never be treated as synonyms.

```text
EXPIRED
-> restriction reached its configured end

REVOKED
-> restriction was explicitly cancelled
```

This distinction is important for:

- appeals
- moderator accountability
- sanction history
- analytics
- audit trails
- future policy evaluation

---

## 15. User Reference

User-targeted sanctions require a reference to the affected Kurvenfunk user.

Conceptually:

```text
Sanction.userId -> User.id
```

Relationship:

```text
User 1 ---- * Sanction
```

A user can have:

- no sanctions
- one active sanction
- multiple active sanctions
- multiple historical sanctions

Sanctions must not be collapsed into a single mutable row per user.

Each independently imposed restriction should normally be represented by its own sanction record.

---

## 16. IP-Only Sanctions and Nullable `userId`

An `IP_BLOCK` may exist without a directly known user.

Therefore the conceptual model should allow:

```text
userId = null
```

only for sanction types where a user target is not required.

Initial rule:

```text
LIMITED       -> userId required
COMMENT_BLOCK -> userId required
FORUM_BLOCK   -> userId required
ACCOUNT_BAN   -> userId required
IP_BLOCK      -> userId optional
```

If an IP block is associated with a known banned user, both references may exist:

```text
userId = user_123
ipBlockId = ipblock_456
```

---

## 17. Creator Reference

A manually imposed sanction should identify the moderator or administrator responsible for creating it.

Conceptually:

```text
Sanction.createdById -> User.id
```

For system-generated sanctions, `createdById` may be nullable if system origin is otherwise unambiguous.

Examples of system-generated flows:

- automatic account ban following automatic third-yellow red card
- worker-generated expiration transition
- future automated anti-abuse enforcement

The domain must never invent a fake moderator user solely to satisfy a non-null foreign key.

---

## 18. System Origin

The model must distinguish human-created sanctions from system-created sanctions.

This can be represented through one or both of:

- nullable `createdById`
- structured origin metadata
- source-card relationship
- later audit-event metadata

A future explicit enum such as `SanctionOrigin` may be introduced if implementation needs it.

Possible values could include:

```text
MANUAL
CARD
AUTOMATIC_ESCALATION
SYSTEM
APPEAL
```

Task 076 does not require committing this enum to Prisma yet.

The important domain invariant is that origin must remain explainable.

---

## 19. Moderation Reason

A sanction requires a structured reason.

Recommended conceptual field:

```text
reasonCode
```

Examples may later include:

```text
SPAM
HARASSMENT
THREATS
HATEFUL_CONDUCT
PERSONAL_DATA_EXPOSURE
BAN_EVASION
AUTOMATION_ABUSE
REPEATED_VIOLATIONS
OTHER
```

The exact shared moderation-reason enum should be coordinated with the moderation-card and moderation-report domains before Task 081.

Do not use free text as the only reason source.

Structured reason codes enable:

- filtering
- analytics
- policy reporting
- consistent moderator workflows
- localization
- audit review

---

## 20. User-Visible Message

A sanction may store a user-facing explanation separately from the structured reason.

Recommended field:

```text
userMessage
```

This field is intended for wording that may be shown to the sanctioned user.

It must not contain:

- internal moderator discussion
- private reporter information
- security-sensitive detection details
- unnecessary personal data
- IP hashes
- internal anti-abuse heuristics

---

## 21. Internal Moderator Note

A sanction may store an internal moderation note:

```text
internalNote
```

This field is visible only to authorized moderation/admin tooling.

It may provide contextual detail that is inappropriate for public or user-facing APIs.

Access to internal notes must be permission-controlled and later audit-aware.

---

## 22. Source Card Reference

A sanction may originate from a moderation card.

Conceptual relation:

```text
Sanction.sourceCardId -> ModerationCard.id
```

Examples:

```text
BLUE card
-> temporary restriction sanction

RED card
-> ACCOUNT_BAN sanction
```

A sanction created without a card uses:

```text
sourceCardId = null
```

This is valid.

Cards and sanctions must not have a mandatory one-to-one relationship.

Possible cardinality:

```text
ModerationCard 1 ---- 0..* Sanction
```

This allows one moderation event to create multiple technical restrictions when necessary.

---

## 23. Source Report Reference

A sanction may optionally reference the moderation report that triggered or contributed to the action.

Conceptually:

```text
Sanction.sourceReportId -> ModerationReport.id
```

This relationship is optional because:

- not every sanction begins with a report
- moderators may act proactively
- automated systems may create enforcement
- one report may result in no sanction
- multiple reports may contribute to one decision

If later requirements need many-to-many report relationships, Task 081 may introduce a join model.

For the initial domain model, a single optional primary source report is sufficient as a conceptual direction.

---

## 24. Sanctions Without Cards

Kurvenfunk explicitly supports sanctions without moderation cards.

Examples:

```text
temporary COMMENT_BLOCK
temporary FORUM_BLOCK
manual LIMITED
temporary IP_BLOCK
```

This permits moderation to apply the minimum necessary enforcement without artificially issuing a disciplinary card.

Example:

```text
Moderator action
-> COMMENT_BLOCK for 24 hours
-> no card
```

The sanction still requires:

- reason
- creator or system origin
- timestamps
- later auditability

---

## 25. Cards Without Sanctions

Kurvenfunk also supports cards without sanctions.

The primary example is a yellow card.

```text
YELLOW card
-> formal warning
-> no technical restriction required
```

Therefore:

```text
ModerationCard
```

must never imply:

```text
Sanction exists
```

unless business logic for that card type explicitly requires one.

---

## 26. Blue Card Compatibility

Task 075 defines a blue card as a temporary exclusion-style moderation event whose technical enforcement belongs to the sanction domain.

The sanction model must therefore support blue-card restrictions without encoding the restriction directly into `ModerationCard`.

Conceptual flow:

```text
BLUE card
-> create required temporary Sanction record(s)
-> sanction duration is source of truth for enforcement
```

The exact sanction combination used for blue-card policy can be finalized when moderation permissions are implemented.

Possible implementation patterns include:

```text
BLUE
-> LIMITED
```

or, if the policy requires a more specific community restriction:

```text
BLUE
-> COMMENT_BLOCK
-> FORUM_BLOCK
```

The chosen enforcement mapping must match the final Task 075 blue-card policy and the permission matrix introduced in Task 172.

The important Task 076 rule is:

```text
ModerationCard does not directly enforce access.
Sanction does.
```

---

## 27. Red Card Compatibility

An active red card normally corresponds to an indefinite account-ban sanction.

Conceptual flow:

```text
RED card
        |
        v
ACCOUNT_BAN sanction
        |
        +----> User.status = BANNED
        |
        +----> Keycloak session revoke
```

For automatic third-yellow escalation:

```text
third relevant YELLOW
-> automatic RED card
-> ACCOUNT_BAN sanction
-> User.status = BANNED
-> sessions revoked
-> audit event
-> notification
```

For direct red:

```text
moderator issues RED
-> ACCOUNT_BAN sanction
-> User.status = BANNED
-> sessions revoked
-> audit event
-> notification
```

The red card records disciplinary history.

The account-ban sanction records enforcement.

---

## 28. Red Card Revocation

If a red card is revoked, Kurvenfunk must not blindly set the user to `ACTIVE`.

The linked account-ban sanction must be revoked or otherwise reconciled according to the moderation flow.

After that, effective account status must be recalculated from all remaining active sanctions.

Example:

```text
RED card A
-> ACCOUNT_BAN sanction A

separate ACCOUNT_BAN sanction B
-> still active
```

Revoking red card A must not restore the account while sanction B still requires `BANNED`.

---

## 29. Start Time

Recommended field:

```text
startsAt
```

`startsAt` defines when enforcement begins.

Normal manual sanctions start immediately:

```text
startsAt = now
```

Future scheduling can be supported without redesign:

```text
startsAt > now
```

A future-dated sanction is stored but is not yet effective.

---

## 30. Expiration Time

Recommended field:

```text
expiresAt
```

Temporary sanctions require an expiration time in normal moderation flows.

Examples:

```text
24 hours
3 days
7 days
30 days
```

Indefinite sanctions use:

```text
expiresAt = null
```

Initial expectations:

```text
LIMITED       -> normally temporary, nullable allowed for exceptional policy
COMMENT_BLOCK -> normally temporary
FORUM_BLOCK   -> normally temporary
ACCOUNT_BAN   -> often indefinite
IP_BLOCK      -> duration governed together with Task 077 policy
```

Application logic must not interpret null as inactive.

---

## 31. Duration

Duration should not be stored as the source of truth if `startsAt` and `expiresAt` are available.

The authoritative time interval is:

```text
startsAt
expiresAt
```

The UI may derive:

```text
24 hours
3 days
7 days
30 days
```

from those timestamps.

This avoids conflicting state such as:

```text
duration = 7 days
expiresAt = startsAt + 3 days
```

---

## 32. Time Handling

All persisted sanction timestamps should use UTC.

Presentation layers convert timestamps to the appropriate user or moderator timezone.

Time comparisons must use a consistent server-side clock.

Do not rely on browser time for enforcement.

---

## 33. Effective Sanction

An effective sanction at time `now` satisfies:

```text
status = ACTIVE
AND startsAt <= now
AND (
    expiresAt IS NULL
    OR expiresAt > now
)
```

A sanction with:

```text
status = REVOKED
```

is never effective.

A sanction with:

```text
status = EXPIRED
```

is never effective.

---

## 34. Multiple Simultaneous Sanctions

A user may have multiple active sanctions.

Example:

```text
COMMENT_BLOCK
expiresAt = day 3

FORUM_BLOCK
expiresAt = day 7
```

The restrictions combine.

Effective access is the intersection of all applicable permissions after sanctions are applied.

Conceptually:

```text
base permissions
- account-status restrictions
- active sanctions
- resource restrictions
= effective permissions
```

A shorter sanction ending must not remove a longer overlapping restriction.

---

## 35. Duplicate Sanctions

Kurvenfunk should avoid accidentally creating duplicate sanctions for the same moderation event.

Example of an invalid accidental duplicate:

```text
RED card 123
-> ACCOUNT_BAN sanction A

retry runs

RED card 123
-> ACCOUNT_BAN sanction B
```

Task 076 should therefore require idempotent sanction creation in automated flows.

Possible implementation mechanisms during later tasks:

- transaction boundary
- unique source-card/type constraint where appropriate
- idempotency key
- explicit lookup before create

The exact database constraint belongs to Task 081.

---

## 36. Overlapping Sanctions of the Same Type

Multiple sanctions of the same type may legitimately coexist.

Example:

```text
COMMENT_BLOCK A
source = moderation case A
expiresAt = day 3

COMMENT_BLOCK B
source = moderation case B
expiresAt = day 7
```

Effective restriction remains until no applicable comment block remains active.

Expiration of sanction A must not remove enforcement caused by sanction B.

Therefore enforcement must query all relevant active sanctions rather than storing a single `commentBlockedUntil` value on `User`.

---

## 37. Sanction Precedence

Sanction types have different scopes.

For account-state projection, initial precedence is:

```text
ACCOUNT_BAN
    >
LIMITED
    >
no account-level sanction
```

Meaning:

```text
active ACCOUNT_BAN
-> BANNED

else active LIMITED
-> LIMITED

else
-> ACTIVE
```

Granular sanctions such as:

```text
COMMENT_BLOCK
FORUM_BLOCK
IP_BLOCK
```

do not independently change `User.status`.

They affect their own enforcement scope.

---

## 38. Effective User Status

Current `User.status` remains persisted because it is a security-relevant, frequently checked account state.

However, sanctions explain and drive restricted states.

Recommended recalculation:

```text
if effective ACCOUNT_BAN exists:
    User.status = BANNED

else if effective LIMITED exists:
    User.status = LIMITED

else:
    User.status = ACTIVE
```

This recalculation is required after relevant sanction:

- creation
- activation
- expiration
- revocation
- administrative correction

The exact service implementation belongs to later tasks.

---

## 39. Never Blindly Restore `ACTIVE`

A critical invariant is:

```text
sanction ends
!=
set User.status = ACTIVE
```

Instead:

```text
sanction ends
-> query remaining effective account-level sanctions
-> recalculate status
```

Example:

```text
LIMITED A expires

ACCOUNT_BAN B remains active
```

Result:

```text
User.status remains BANNED
```

Another example:

```text
ACCOUNT_BAN A revoked

LIMITED B remains active
```

Result:

```text
User.status = LIMITED
```

---

## 40. Account Ban and Sessions

When a new effective account ban transitions a user to `BANNED`, active Keycloak sessions must be revoked.

This is required by the user-status model and later Task 186.

The sanction record itself does not store Keycloak session state.

Conceptual flow:

```text
ACCOUNT_BAN created
-> status recalculated to BANNED
-> session revoke requested
-> audit event
```

Retries must be safe and idempotent.

---

## 41. Granular Permission Enforcement

Granular sanctions must be enforced centrally.

Controllers must not independently implement ad-hoc sanction checks.

Example target architecture:

```text
request
-> authentication
-> role/permission resolution
-> account status guard
-> active sanction evaluation
-> resource-specific authorization
-> controller/service
```

Task 172 will define the central permission system.

Task 076 defines the sanction semantics that system must consume.

---

## 42. Permission Effects

Initial conceptual mapping:

| Sanction | Primary effect |
|---|---|
| `LIMITED` | Blocks community content creation according to LIMITED matrix |
| `COMMENT_BLOCK` | Blocks comment creation/replies |
| `FORUM_BLOCK` | Blocks thread/post creation |
| `ACCOUNT_BAN` | Blocks authenticated Kurvenfunk actions |
| `IP_BLOCK` | Blocks applicable requests from the referenced IP identity |

Exact permission identifiers are finalized in Task 172.

---

## 43. Role Independence

Roles and sanctions are independent.

A privileged role does not automatically bypass a sanction.

Example:

```text
role = MODERATOR
sanction = COMMENT_BLOCK
```

The moderator may still have moderation permissions but must not automatically be allowed to create comments if the sanction applies.

Likewise:

```text
role = ADMIN
status = BANNED
```

must not imply an automatic bypass.

Any exceptional override mechanism would need explicit future policy and audit requirements.

---

## 44. Sanction Creation

Manual sanction creation requires:

- authorized creator
- sanction type
- valid target
- structured reason
- start time
- valid duration or explicit indefinite choice
- optional user-facing message
- optional internal note
- optional source card
- optional source report

The service must validate type-specific requirements before persistence.

---

## 45. Sanction Revocation

Revoking a sanction requires:

- sanction exists
- sanction is revocable
- caller has required permission
- sanction is not already revoked
- revocation reason
- revocation timestamp
- revoking moderator or clear system origin

After revocation:

- enforcement stops
- effective account status is recalculated when relevant
- later audit event is created
- linked card state is not silently changed unless the moderation workflow explicitly requires it

---

## 46. Sanction Expiration

Expiration occurs when:

```text
expiresAt <= now
```

and the sanction has not already been revoked.

The Task 191 worker should process expiration.

Recommended flow:

```text
find eligible ACTIVE sanctions
-> mark EXPIRED
-> recalculate affected user status where needed
-> emit required audit/notification events
```

The worker must be idempotent.

Running the same expiration job twice must not produce inconsistent state.

---

## 47. Expiration Worker Scope

Task 191 explicitly requires expiration handling for:

- `LIMITED`
- comment blocks
- forum blocks
- IP blocks

`ACCOUNT_BAN` may also support expiration if future policy allows temporary account bans.

The model must therefore not hard-code account bans as impossible to expire.

Default red-card policy remains indefinite until revoked.

---

## 48. Worker Race Conditions

Expiration may race with:

- moderator revocation
- sanction extension
- new sanction creation
- appeal resolution
- account-ban escalation

Later implementation should use transaction-safe updates.

Example safe condition:

```text
update sanction
where
    id = ...
    status = ACTIVE
    expiresAt <= now
```

If zero rows are changed, another process may already have modified it.

---

## 49. Extending a Sanction

Changing `expiresAt` on an active sanction may be allowed only through an explicit moderation action.

Extension must be auditable.

The application must not silently extend sanctions.

A future policy may instead require:

```text
revoke old sanction
-> create new sanction
```

Task 076 does not force one implementation.

However, historical explainability is mandatory.

---

## 50. Sanction Mutability

Fields describing historical origin should be treated as effectively immutable after creation:

- `type`
- `userId`
- `sourceCardId`
- `sourceReportId`
- original creator
- original start time

Fields that may change through controlled workflows include:

- `expiresAt`
- `status`
- revocation metadata
- certain explanatory fields if policy permits correction

Any security-relevant mutation must later be audit logged.

---

## 51. Deletion Policy

Sanctions must not normally be hard-deleted.

Reasons:

- moderation accountability
- appeal processing
- security history
- abuse investigation
- legal/privacy retention policy
- audit reconstruction

Normal lifecycle states are:

```text
ACTIVE
EXPIRED
REVOKED
```

not deletion.

Actual retention and eventual deletion/anonymization are defined later in Task 249.

---

## 52. User Deletion

User account deletion must not automatically destroy all sanction history.

Later privacy policy must define whether moderation history is:

- retained
- pseudonymized
- anonymized
- deleted after a retention period

The sanction model should support preserving necessary historical records without exposing deleted-user personal data.

Foreign-key behavior must be selected carefully in Task 081.

---

## 53. IP Privacy

The sanction entity must not store raw IP addresses.

Task 077 defines IP-block storage.

The project plan requires keyed HMAC-based pseudonymization where possible.

Therefore:

```text
Sanction
-> may reference IPBlock
-> does not duplicate raw IP
```

Public or ordinary moderator APIs must not expose IP hash values unless explicitly authorized.

---

## 54. Notifications

Relevant sanctions may trigger user notifications.

Examples:

```text
LIMITED
ACCOUNT_BAN
COMMENT_BLOCK
FORUM_BLOCK
```

Moderation/security notifications must follow the later notification model.

The sanction entity does not itself need to store delivery state.

Conceptual flow:

```text
sanction created
-> notification job
-> in-app / email according to policy
```

For bans, delivery design must account for the user potentially being unable to access authenticated pages.

---

## 55. Audit Logging

Sanction operations are moderation- and security-sensitive.

Task 078 must later record critical actions such as:

- sanction created
- sanction revoked
- sanction duration changed
- sanction expired where policy requires
- account status changed because of sanction
- account ban imposed
- account ban removed
- IP block imposed
- IP block removed

The sanction row is domain state.

The audit log is the immutable event history.

Neither replaces the other.

---

## 56. Appeals

Task 189 introduces appeals.

The sanction model must support future appeal workflows without rewriting sanction history.

Possible outcomes:

```text
appeal rejected
-> sanction remains unchanged

appeal accepted
-> sanction revoked
-> revocation reason references appeal outcome

appeal partially accepted
-> sanction shortened or replaced according to policy
```

The appeal entity itself should remain separate.

---

## 57. Moderation Reports

A report may lead to:

- no action
- card only
- sanction only
- card plus sanction
- multiple sanctions

Therefore report and sanction relationships must remain flexible.

Example:

```text
Report
-> moderator review
-> COMMENT_BLOCK
```

Another:

```text
Report
-> RED card
-> ACCOUNT_BAN
```

---

## 58. Sanction History

Moderator-facing user history should show sanctions chronologically.

Recommended display fields:

- type
- status
- reason
- start
- expiration
- creator
- source card
- source report
- revocation state
- internal note where permitted

Historical entries must remain distinguishable from currently effective restrictions.

---

## 59. Public Privacy

Other public users do not need to know detailed sanction state.

Public profile APIs should not expose:

- sanction reason
- internal notes
- source reports
- moderator identity
- IP-block references
- appeal details

A later product requirement may define limited public labels, but Task 076 does not.

---

## 60. User-Facing API Representation

A user-facing sanction response may include:

```text
id
type
status
userMessage
startsAt
expiresAt
```

It should not automatically include:

```text
internalNote
sourceReportId
createdById
revokedById
ipBlockId
internal reason metadata
```

unless product policy explicitly allows it.

---

## 61. Moderator-Facing API Representation

Authorized moderation tooling may additionally require:

```text
reasonCode
internalNote
createdBy
sourceCard
sourceReport
revocation metadata
effective state
```

Sensitive IP details remain governed by separate permissions.

---

## 62. Recommended Indexes

Likely useful indexes for the later Prisma schema:

```text
Sanction(userId)
Sanction(userId, status)
Sanction(userId, type, status)
Sanction(type, status)
Sanction(status, expiresAt)
Sanction(sourceCardId)
Sanction(sourceReportId)
Sanction(ipBlockId)
Sanction(createdById)
Sanction(createdAt)
```

A partial or compound index supporting the expiration worker may be particularly important:

```text
status = ACTIVE
expiresAt <= now
```

PostgreSQL-specific index choices should be finalized during Task 081 after real query patterns are known.

---

## 63. Query: Effective Sanctions for a User

The domain must efficiently support:

```text
find effective sanctions for user
```

Conceptually:

```text
WHERE userId = :userId
  AND status = ACTIVE
  AND startsAt <= :now
  AND (
      expiresAt IS NULL
      OR expiresAt > :now
  )
```

This query is central to authorization.

---

## 64. Query: Effective Sanction by Type

The domain must support:

```text
does user have effective COMMENT_BLOCK?
does user have effective FORUM_BLOCK?
does user have effective ACCOUNT_BAN?
does user have effective LIMITED?
```

These checks should be centralized rather than duplicated in individual controllers.

---

## 65. Query: Expiring Sanctions

The worker must support:

```text
find ACTIVE sanctions
where expiresAt IS NOT NULL
and expiresAt <= now
```

Processing should use bounded batches.

Large expiration backlogs must not require loading all records into memory.

---

## 66. Query: Moderation History

Moderator tooling must support:

```text
all sanctions for user
ordered by createdAt desc
```

with optional filters:

```text
type
status
reasonCode
date range
creator
```

Cursor pagination should be used for large histories.

---

## 67. Query: Sanctions by Source Card

The domain must support:

```text
find sanctions created from moderation card
```

This is especially important for:

- blue-card enforcement
- red-card bans
- red-card revocation
- moderation history

---

## 68. Query: Active Account Restriction

The domain must support determining the effective account-level restriction.

Conceptually:

```text
if ACCOUNT_BAN effective:
    BANNED
else if LIMITED effective:
    LIMITED
else:
    ACTIVE
```

This logic should exist in one domain/service location.

---

## 69. Example: Manual LIMITED for 24 Hours

```text
User
status = ACTIVE

Moderator creates:

Sanction
type = LIMITED
status = ACTIVE
startsAt = 2026-08-14T10:00:00Z
expiresAt = 2026-08-15T10:00:00Z
reasonCode = REPEATED_VIOLATIONS
```

Result:

```text
User.status = LIMITED
```

After expiration:

```text
Sanction.status = EXPIRED
```

Then status is recalculated.

If no other account-level sanction exists:

```text
User.status = ACTIVE
```

---

## 70. Example: Comment Block Without LIMITED

```text
User.status = ACTIVE

Sanction
type = COMMENT_BLOCK
status = ACTIVE
expiresAt = 2026-08-17T10:00:00Z
```

Result:

```text
comment.create -> denied
comment.reply  -> denied
thread.create  -> otherwise allowed
vote           -> otherwise allowed
User.status    -> ACTIVE
```

This demonstrates why granular sanctions are separate from account status.

---

## 71. Example: Forum Block Without Comment Block

```text
User.status = ACTIVE

Sanction
type = FORUM_BLOCK
status = ACTIVE
```

Result:

```text
thread.create -> denied
forum post    -> denied
comment.create -> otherwise allowed
```

---

## 72. Example: Direct Red Card

```text
ModerationCard
type = RED
status = ACTIVE
escalationSource = DIRECT
```

Creates:

```text
Sanction
type = ACCOUNT_BAN
status = ACTIVE
sourceCardId = <red card>
startsAt = now
expiresAt = null
```

Result:

```text
User.status = BANNED
Keycloak sessions revoked
audit event created
notification created
```

---

## 73. Example: Automatic Red Card

```text
third relevant active YELLOW card
-> automatic RED card
```

Then:

```text
Sanction
type = ACCOUNT_BAN
status = ACTIVE
sourceCardId = <automatic red card>
expiresAt = null
```

The operation should be handled transactionally or with equivalent consistency guarantees so that repeated workers or retries do not create duplicate bans.

---

## 74. Example: Red Card Plus Temporary IP Protection

For a severe ban-evasion or abuse case:

```text
RED card
-> ACCOUNT_BAN
-> optional IP_BLOCK
```

Possible records:

```text
Sanction A
type = ACCOUNT_BAN
userId = user_123

Sanction B
type = IP_BLOCK
userId = user_123
ipBlockId = ipblock_456
```

The IP block may expire independently of the account ban.

Revoking or expiring the IP block must not remove the account ban.

---

## 75. Example: Overlapping LIMITED Sanctions

```text
Sanction A
type = LIMITED
expiresAt = day 3

Sanction B
type = LIMITED
expiresAt = day 7
```

On day 3:

```text
A -> EXPIRED
B -> ACTIVE
```

Result:

```text
User.status remains LIMITED
```

Only when no effective `LIMITED` or `ACCOUNT_BAN` sanction remains can the account return to `ACTIVE`.

---

## 76. Example: Ban Revoked but LIMITED Remains

Initial state:

```text
ACCOUNT_BAN A = ACTIVE
LIMITED B = ACTIVE
User.status = BANNED
```

Moderator revokes A.

Recalculation:

```text
ACCOUNT_BAN effective? no
LIMITED effective? yes
```

Result:

```text
User.status = LIMITED
```

Not:

```text
ACTIVE
```

---

## 77. Example: Expired Comment Block With Active Forum Block

Initial state:

```text
COMMENT_BLOCK A
expiresAt = day 1

FORUM_BLOCK B
expiresAt = day 7
```

On day 1:

```text
COMMENT_BLOCK A -> EXPIRED
FORUM_BLOCK B -> ACTIVE
```

Result:

```text
comments -> allowed if all other rules permit
forum write -> still denied
```

---

## 78. Example: Revoked Sanction

```text
Sanction
type = COMMENT_BLOCK
status = ACTIVE
```

Moderator revokes it:

```text
status = REVOKED
revokedAt = now
revokedById = moderator_123
revocationReason = "Sanction issued in error"
```

The restriction stops immediately.

Historical record remains.

---

## 79. Concurrency

Sanction creation, revocation, expiration and account-status recalculation are concurrency-sensitive.

Potential race:

```text
worker expires LIMITED A
at same time
moderator creates LIMITED B
```

A naive implementation could incorrectly set:

```text
User.status = ACTIVE
```

Therefore later implementation must recalculate status from authoritative active sanctions inside an appropriate transaction or consistency boundary.

---

## 80. Transaction Boundaries

Operations that should be atomic or strongly coordinated include:

### Account ban creation

```text
create ACCOUNT_BAN
set/recalculate User.status
enqueue/trigger session revocation
create audit intent/event
```

### LIMITED creation

```text
create LIMITED
recalculate User.status
```

### Expiration

```text
mark sanction EXPIRED
recalculate User.status when account-level
```

### Revocation

```text
mark sanction REVOKED
recalculate User.status when account-level
```

External Keycloak session revocation cannot participate in the PostgreSQL transaction directly, so retry-safe orchestration is required.

---

## 81. Idempotency

Automated moderation and worker flows must be idempotent.

Repeated execution must not:

- create duplicate account bans
- revoke sessions indefinitely as a failing loop without state tracking
- create duplicate notifications
- create duplicate audit entries
- incorrectly overwrite newer sanction state

Source-card-based sanctions are good candidates for deterministic idempotency.

---

## 82. Validation Rules

Common validation:

1. `type` must be a supported sanction type.
2. `status` must be a supported sanction status.
3. `startsAt` is required.
4. If `expiresAt` exists, it must be after `startsAt`.
5. `reasonCode` is required for moderation-created sanctions.
6. User-facing text and internal notes must be stored separately.
7. Revoked sanctions require `revokedAt`.
8. Revoked sanctions require a revocation reason.
9. `revokedById` is required for human revocations.
10. Expired sanctions must not be enforced.

Target validation:

```text
LIMITED       -> userId required
COMMENT_BLOCK -> userId required
FORUM_BLOCK   -> userId required
ACCOUNT_BAN   -> userId required
IP_BLOCK      -> ipBlockId required once Task 077 exists
```

For IP blocks before Task 077 is implemented, Task 081 must not invent a placeholder raw-IP field in `Sanction`.

---

## 83. Type-Specific Validation

### `LIMITED`

Normal flow should require:

```text
userId
startsAt
expiresAt
reasonCode
```

An indefinite LIMITED sanction should require explicit privileged policy if supported.

### `COMMENT_BLOCK`

Require:

```text
userId
startsAt
reasonCode
```

Temporary duration is strongly preferred.

### `FORUM_BLOCK`

Require:

```text
userId
startsAt
reasonCode
```

Temporary duration is strongly preferred.

### `ACCOUNT_BAN`

Require:

```text
userId
startsAt
reasonCode
```

`expiresAt` may be null.

If created from a red card:

```text
sourceCardId
```

should be present.

### `IP_BLOCK`

Once Task 077 exists:

```text
ipBlockId
```

is required.

`userId` remains optional.

---

## 84. Status Transition Rules

Allowed conceptual lifecycle transitions:

```text
ACTIVE -> EXPIRED
ACTIVE -> REVOKED
```

Normally not allowed:

```text
EXPIRED -> ACTIVE
REVOKED -> ACTIVE
EXPIRED -> REVOKED
REVOKED -> EXPIRED
```

If a historical mistake must be corrected, use an explicit administrative correction flow with audit logging rather than silently changing lifecycle semantics.

---

## 85. Sanction Extension and Status

If an active sanction is extended before expiration:

```text
ACTIVE
-> ACTIVE
```

with a changed `expiresAt`.

If an already expired restriction must be reimposed, create a new sanction rather than changing the historical expired record back to active.

---

## 86. Source Relationships Are Context, Not Enforcement

References such as:

```text
sourceCardId
sourceReportId
```

help explain why the sanction exists.

They are not themselves enforcement conditions.

Example:

If a source report is later archived, the sanction remains active until its own lifecycle changes.

Likewise, deleting or hiding the offending comment does not automatically expire the sanction.

---

## 87. Relationship Overview

Conceptually:

```text
User
 |
 | 1
 |
 * Sanction
     |
     +---- optional createdById ----> User
     |
     +---- optional revokedById ----> User
     |
     +---- optional sourceCardId ---> ModerationCard
     |
     +---- optional sourceReportId -> ModerationReport
     |
     +---- optional ipBlockId ------> IPBlock
```

Card relationship:

```text
ModerationCard 1 ---- 0..* Sanction
```

Report relationship:

```text
ModerationReport 1 ---- 0..* Sanction
```

The exact reverse relation names are deferred to Task 081.

---

## 88. Conceptual Prisma Direction

Task 076 does not modify Prisma yet.

A later schema may conceptually resemble:

```prisma
enum SanctionType {
  LIMITED
  COMMENT_BLOCK
  FORUM_BLOCK
  ACCOUNT_BAN
  IP_BLOCK
}

enum SanctionStatus {
  ACTIVE
  EXPIRED
  REVOKED
}

model Sanction {
  id               String         @id @default(uuid())
  type             SanctionType
  status           SanctionStatus @default(ACTIVE)

  userId           String?
  createdById      String?
  revokedById      String?

  sourceCardId     String?
  sourceReportId   String?
  ipBlockId        String?

  reasonCode       String
  userMessage      String?
  internalNote     String?

  startsAt         DateTime
  expiresAt        DateTime?

  revokedAt        DateTime?
  revocationReason String?

  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}
```

This is conceptual only.

Task 081 must reconcile:

- exact IDs
- shared moderation reason enums
- relation names
- deletion behavior
- database constraints
- indexes
- Task 077 IPBlock model
- Task 078 AuditLog model
- Task 079 Notification model

No Prisma schema should be changed during Task 076.

---

## 89. Recommended Domain Service Responsibilities

Later sanction-domain logic should centralize:

```text
createSanction()
revokeSanction()
expireSanction()
getEffectiveSanctions()
hasEffectiveSanction()
recalculateUserStatus()
```

Controllers should not directly manipulate sanction state.

Worker code should reuse the same domain/service rules rather than implementing separate interpretations.

---

## 90. Recommended Permission Names

Task 172 will finalize permissions.

The sanction model expects capabilities equivalent to:

```text
user.limit
user.ban
user.unban
user.sanction.create
user.sanction.revoke
user.sanction.view
user.sanction.viewInternal
user.ipban
```

Exact names may change.

The important rule is that sanction creation and revocation are privileged operations.

---

## 91. Security Requirements

Sanctions affect authorization and therefore are security-sensitive records.

Requirements:

- enforcement occurs server-side
- frontend state is never authoritative
- cached sanction data must not outlive safe invalidation rules
- BANNED checks cannot rely only on Keycloak session validity
- manual API calls must be rejected even if the UI hides the action
- expired/revoked restrictions must stop enforcement predictably
- active restrictions must not disappear because one overlapping sanction ended

---

## 92. Caching

Authorization-critical sanctions should initially favor correctness over aggressive caching.

If Redis caching is introduced later:

- PostgreSQL remains source of truth
- cache invalidation is required on sanction creation
- cache invalidation is required on revocation
- cache invalidation is required on expiration
- account bans must propagate immediately enough for security requirements
- stale cache must not accidentally grant prohibited access

Task 076 does not require caching.

---

## 93. Logging

Application logs may include non-sensitive identifiers such as:

```text
sanctionId
userId
sanctionType
event
requestId
```

Logs should not unnecessarily include:

- internal notes
- user-facing message text
- raw IP addresses
- IP hashes
- sensitive report content
- authentication tokens

Audit logs, application logs and sanction records have different purposes.

---

## 94. Retention

Sanction retention is deferred to Task 249.

The domain must support historical retention without requiring indefinite storage of unnecessary personal data.

Retention policy should later consider:

- active sanctions
- expired sanctions
- revoked sanctions
- serious account bans
- IP-related restrictions
- appeals
- legal obligations
- platform safety needs

---

## 95. Monitoring

Later moderation monitoring may track:

- active sanctions by type
- sanctions created per period
- average temporary sanction duration
- expiration backlog
- revoked sanctions
- appeal overturn rate
- repeat offenders
- IP-block false positives

Monitoring must avoid exposing unnecessary personal data.

---

## 96. Metrics Are Not Source of Truth

Aggregated metrics must never replace sanction records.

Do not store authoritative values such as:

```text
activeSanctionCount
commentBlockedUntil
forumBlockedUntil
```

on `User` as substitutes for querying sanction state.

Derived optimization fields may be introduced later only with clear consistency rules.

---

## 97. Interaction With `User.status`

`User.status` is a current-state projection.

`Sanction` stores restriction history and scope.

Relationship:

```text
effective ACCOUNT_BAN
-> BANNED

effective LIMITED
-> LIMITED

no account-level sanction
-> ACTIVE
```

Granular sanctions do not require new account-status enum values.

This preserves the core project rule:

```text
ACTIVE
LIMITED
BANNED
```

remain the only initial account statuses.

---

## 98. Interaction With Permission System

Later permission evaluation should conceptually follow:

```text
1. authenticated identity
2. role permissions
3. account status
4. active sanctions
5. resource-specific policy
6. rate limits / abuse protection
```

A sanction may remove an otherwise granted capability.

A sanction does not grant permissions.

---

## 99. Interaction With IP Block Model

Task 077 must define:

- `IPBlock`
- `ipHash`
- reason
- creator
- activation state
- expiration
- HMAC policy
- retention-related fields

Task 076 defines only how IP-based enforcement participates in the broader sanction domain.

Task 077 must not force raw IP storage into `Sanction`.

---

## 100. Interaction With Audit Log Model

Task 078 should reference sanction actions where appropriate.

Possible audit events:

```text
SANCTION_CREATED
SANCTION_REVOKED
SANCTION_EXPIRED
SANCTION_EXTENDED
ACCOUNT_STATUS_CHANGED
ACCOUNT_BANNED
ACCOUNT_UNBANNED
IP_BLOCK_CREATED
IP_BLOCK_REVOKED
```

Exact event names are deferred.

---

## 101. Interaction With Notification Model

Task 079 should support sanction-related notifications.

Possible notification types already anticipated by the project include:

```text
limited
ban
red_card
yellow_card
system
```

Granular block notifications may later be added if product requirements require them.

Sanctions must remain usable even if notification delivery fails.

---

## 102. Interaction With Task 178

Task 178 implements the LIMITED sanction.

It must use this domain model rather than storing restriction duration directly on `User`.

Expected flow:

```text
create LIMITED sanction
-> recalculate User.status
-> notify user
-> audit
```

---

## 103. Interaction With Task 179

Task 179 defines the LIMITED permission matrix.

Task 076 requires that the permission system uses the active sanction/status result consistently.

The sanction entity itself should not store an arbitrary copied permission list for standard LIMITED behavior.

---

## 104. Interaction With Task 180

Task 180 implements BANNED handling.

It should derive enforcement from:

- current `User.status`
- effective account-ban sanction
- authentication/session state

The API must reject banned users even if they present a still-valid token.

---

## 105. Interaction With Task 185

Task 185 permits red-card cases to add IP protection.

The required separation is:

```text
RED card
-> ACCOUNT_BAN always according to ban policy
-> IP_BLOCK only when justified
```

Do not couple every account ban to an IP block.

---

## 106. Interaction With Task 186

Task 186 revokes active Keycloak sessions for banned accounts.

The account-ban sanction triggers the need for this workflow.

The sanction record itself does not store or manage Keycloak session identifiers.

---

## 107. Interaction With Task 189

Appeals may lead to sanction revocation or adjustment.

The original sanction should remain historically visible.

An accepted appeal should not delete the sanction record.

---

## 108. Interaction With Task 191

The sanction-expiration worker consumes this model.

It must:

- find eligible sanctions
- process them in bounded batches
- update lifecycle safely
- recalculate user status when needed
- handle overlapping sanctions
- remain idempotent
- coordinate IP blocks with Task 077
- create appropriate audit events later

---

## 109. Domain Invariants

The sanction domain must enforce the following invariants:

1. Cards and sanctions are separate concepts.
2. A sanction represents technical or account-level enforcement.
3. `LIMITED`, `COMMENT_BLOCK`, `FORUM_BLOCK`, `ACCOUNT_BAN`, and `IP_BLOCK` are initial sanction types.
4. Sanctions use lifecycle states `ACTIVE`, `EXPIRED`, and `REVOKED`.
5. Expired and revoked are different meanings.
6. User-targeted sanctions reference the affected user.
7. IP-only sanctions may exist without a user.
8. Raw IP addresses are never stored in `Sanction`.
9. IP technical data belongs to Task 077.
10. A sanction requires a structured reason.
11. User-facing explanation and internal moderator notes are separate.
12. Sanctions may reference a source card.
13. Sanctions may reference a source report.
14. A card may exist without a sanction.
15. A sanction may exist without a card.
16. One card may result in multiple sanctions.
17. Yellow cards do not require a sanction.
18. Blue-card enforcement is implemented through sanction records.
19. Red-card enforcement uses an account-ban sanction.
20. Active account-ban sanctions project to `User.status = BANNED`.
21. Active LIMITED sanctions project to `User.status = LIMITED` when no account ban applies.
22. Granular comment/forum sanctions do not require new user statuses.
23. Multiple sanctions may overlap.
24. Expiring one sanction must not remove another active restriction.
25. User status must be recalculated, not blindly restored to ACTIVE.
26. ACCOUNT_BAN takes precedence over LIMITED.
27. BANNED requires later Keycloak session revocation.
28. Sanctions are enforced server-side.
29. Sanctions must not normally be hard-deleted.
30. Revocation records actor, time and reason.
31. Expiration is processed independently from revocation.
32. Automated flows must be idempotent.
33. Account-status transitions caused by sanctions must be auditable.
34. PostgreSQL remains the source of truth.
35. Redis or frontend state must not become authoritative for sanctions.
36. Sanction timestamps are stored consistently in UTC.
37. `expiresAt = null` means indefinite, not inactive.
38. Future `startsAt` values do not yet enforce the sanction.
39. An expired sanction remains historical moderation data.
40. A revoked sanction remains historical moderation data.

---

## 110. Decisions Made in Task 076

### Separation

Sanctions are stored independently from moderation cards.

### Initial types

```text
LIMITED
COMMENT_BLOCK
FORUM_BLOCK
ACCOUNT_BAN
IP_BLOCK
```

### Lifecycle

```text
ACTIVE
EXPIRED
REVOKED
```

### Account status projection

```text
ACCOUNT_BAN -> BANNED
LIMITED     -> LIMITED
otherwise   -> ACTIVE
```

with account-ban precedence.

### Granular restrictions

`COMMENT_BLOCK` and `FORUM_BLOCK` do not require additional `UserStatus` enum values.

### Expiration

Temporary duration belongs to sanctions, not `User.status`.

### Revocation

Revocation remains distinct from expiration and requires explicit metadata.

### Card linkage

`sourceCardId` is optional.

Cards and sanctions are not one-to-one.

### Report linkage

A sanction may optionally reference a primary source report.

### IP blocks

`IP_BLOCK` exists in the sanction taxonomy, while technical IP target data is delegated to Task 077.

### Session handling

`ACCOUNT_BAN` requires later session revocation orchestration but does not store Keycloak session state itself.

### Deletion

Sanctions are historical moderation records and should not normally be hard-deleted.

---

## 111. Follow-Up Requirements for Task 077

Task 077 must define the dedicated IP block model.

It must decide:

- `IPBlock` fields
- HMAC/hash representation
- secret/key rotation considerations
- exact relation to `Sanction`
- expiration ownership
- active-state semantics
- manual vs automatic IP block source
- indexing
- retention
- privacy exposure
- network-level vs application-level enforcement

The model should remain compatible with:

```text
Sanction.type = IP_BLOCK
Sanction.ipBlockId -> IPBlock.id
```

---

## 112. Follow-Up Requirements for Task 078

Audit logging must cover:

- sanction creation
- sanction revocation
- sanction extension
- account status changes caused by sanctions
- account bans
- unbans
- IP-block actions
- critical automatic expiration events where required

Audit events should reference `sanctionId` when applicable.

---

## 113. Follow-Up Requirements for Task 079

Notification modeling should support sanctions that require user communication.

Notifications must be decoupled from sanction persistence so delivery failure does not roll back enforcement incorrectly.

---

## 114. Follow-Up Requirements for Task 081

Task 081 must map this domain into Prisma.

It must reconcile all domain models before creating final relations.

Specific sanction decisions to implement:

- `SanctionType`
- `SanctionStatus`
- `Sanction`
- target-user relation
- creator relation
- revoker relation
- moderation-card relation
- moderation-report relation
- IP-block relation
- reason representation
- timestamp constraints
- indexes
- deletion behavior
- uniqueness/idempotency constraints
- relation names

Task 081 must also verify that the schema remains compatible with:

- User model
- User Status model
- Moderation Report model
- Moderation Card model
- IP Block model
- Audit Log model
- Notification model

---

## 115. Acceptance Criteria

Task 076 is complete when the domain model clearly defines:

- [x] sanctions as separate from cards
- [x] `LIMITED`
- [x] `COMMENT_BLOCK`
- [x] `FORUM_BLOCK`
- [x] `ACCOUNT_BAN`
- [x] `IP_BLOCK`
- [x] sanction lifecycle
- [x] expiration semantics
- [x] revocation semantics
- [x] user relation
- [x] moderator/creator relation
- [x] source-card relation
- [x] source-report relation
- [x] reason data
- [x] user-visible explanation
- [x] internal moderator note
- [x] start and expiration timestamps
- [x] overlapping sanctions
- [x] effective-sanction rules
- [x] user-status projection
- [x] LIMITED interaction
- [x] BANNED interaction
- [x] red-card interaction
- [x] blue-card compatibility
- [x] session-revoke requirement
- [x] IP-block separation
- [x] worker expiration requirements
- [x] concurrency requirements
- [x] idempotency requirements
- [x] audit requirements
- [x] privacy requirements
- [x] conceptual Prisma direction
- [x] Task 077 follow-up
- [x] Task 078 follow-up
- [x] Task 079 follow-up
- [x] Task 081 follow-up

No Prisma schema change or migration is part of Task 076.

---

## 116. Final Domain Summary

Kurvenfunk models moderation decisions and technical restrictions as separate domain concepts.

```text
ModerationCard
-> disciplinary history

Sanction
-> technical enforcement
```

The initial sanction taxonomy is:

```text
LIMITED
COMMENT_BLOCK
FORUM_BLOCK
ACCOUNT_BAN
IP_BLOCK
```

Sanctions have their own lifecycle:

```text
ACTIVE
EXPIRED
REVOKED
```

Account-level sanctions influence current user status:

```text
effective ACCOUNT_BAN
-> User.status = BANNED

else effective LIMITED
-> User.status = LIMITED

else
-> User.status = ACTIVE
```

Granular sanctions such as comment and forum blocks remain independent of the three-value account-status model.

Multiple sanctions may coexist and combine.

Ending one sanction must never accidentally remove another active restriction.

Yellow cards may exist without sanctions.

Blue-card restrictions are enforced through sanctions.

Red cards normally create an indefinite account-ban sanction and require session revocation.

IP blocking participates in the sanction domain but stores technical IP identity data in the separate Task 077 model.

PostgreSQL remains the source of truth.

Sanction state is enforced server-side and is designed to support later permission checks, expiration workers, audit logging, notifications, appeals and moderation tooling without collapsing these concerns into a single record.
