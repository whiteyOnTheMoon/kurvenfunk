# Moderation Card Domain Model

**Project:** Kurvenfunk
**Task:** 075 – Yellow Card Model
**Status:** Domain model defined
**Target:** `docs/database/moderation-card-model.md`

## 1. Purpose

The moderation card model defines Kurvenfunk's formal card-based moderation history.

Kurvenfunk uses a football-inspired card system with three card types:

- `YELLOW` – formal warning
- `BLUE` – serious violation with a temporary exclusion from all community interaction
- `RED` – severe violation resulting in an indefinite account ban

Cards document moderation decisions.

Cards are not themselves the technical enforcement mechanism for temporary or granular restrictions. Technical restrictions are modeled separately through the sanction domain defined in task 076.

This separation is intentional:

```text
Moderation decision
        |
        v
ModerationCard
        |
        +----> YELLOW
        |
        +----> BLUE ----> temporary Sanction
        |
        +----> RED  ----> account ban / related enforcement
```

The model must support:

- formal moderation history
- three-yellow-card escalation
- yellow-card expiration
- temporary blue-card exclusions
- direct red cards
- automatically generated red cards
- references to affected content
- moderator accountability
- user-visible explanations
- private moderator notes
- card revocation without deleting history
- later audit-log integration
- later notification integration
- later sanction integration

---

## 2. Core Domain Rule

A moderation card represents a moderation decision.

A sanction represents an enforcement action.

These concepts must remain separate.

Examples:

```text
YELLOW card
-> warning only
-> no sanction required

BLUE card
-> serious violation
-> temporary community exclusion
-> separate Sanction record enforces restriction

RED card
-> severe violation
-> account becomes BANNED
-> sessions are revoked
-> related enforcement is handled outside the card record
```

This separation prevents the card model from becoming coupled to permission implementation details.

---

## 3. Entity

The central entity is:

```text
ModerationCard
```

Recommended conceptual fields:

```text
ModerationCard
- id
- userId
- moderatorId
- type
- reasonCode
- userMessage
- moderatorNote
- sourceType
- sourceId
- issuedAt
- expiresAt
- status
- revokedAt
- revokedById
- revocationReason
- escalationSource
- createdAt
- updatedAt
```

The exact Prisma representation is defined later in task 081.

---

## 4. Card Types

Enum:

```text
ModerationCardType

YELLOW
BLUE
RED
```

---

## 5. Yellow Card

A yellow card is a formal warning.

It is appropriate for violations serious enough to become part of the user's moderation history, but not serious enough to justify immediate temporary exclusion or an account ban.

Examples may include:

- repeated insults
- repeated disruptive behavior
- deliberate rule violations
- harassment below the threshold for a blue or red card
- repeated spam after previous informal warnings
- inappropriate community conduct

The exact moderation thresholds are defined later in the internal moderation guidelines.

### 5.1 Yellow-card escalation

Kurvenfunk uses the standard rule:

```text
1 active YELLOW
-> formal warning

2 active YELLOW cards
-> escalated warning

3 active YELLOW cards
-> automatic RED card
```

Only relevant active yellow cards count toward this rule.

---

## 6. Yellow Card Expiration

Each yellow card expires individually after 12 months by default.

Recommended rule:

```text
expiresAt = issuedAt + 12 months
```

A yellow card that has expired:

- remains permanently visible in moderation history subject to retention policy
- no longer counts toward the three-yellow-card escalation
- is not deleted
- is not treated as revoked
- may still be considered by a moderator as historical context

Example:

```text
Yellow A
issued: 2026-01-10
expires: 2027-01-10

Yellow B
issued: 2026-06-01
expires: 2027-06-01

Yellow C
issued: 2027-02-01
```

At the time Yellow C is issued, Yellow A has already expired.

Therefore only Yellow B and Yellow C count.

No automatic red card is created.

### 6.1 Expiration is independent per card

The expiration of one yellow card must not change the expiration date of other yellow cards.

Issuing another card does not reset the 12-month period.

This creates a rolling moderation window rather than a global reset date.

---

## 7. Blue Card

A blue card represents a serious violation that requires a temporary exclusion from community interaction.

Blue cards are expected to be used rarely.

The concept is inspired by temporary exclusion systems in youth football, but Kurvenfunk defines its own moderation semantics.

### 7.1 Blue-card effect

While the related blue-card sanction is active, the user may continue consuming public content but cannot participate in community interactions.

The user may:

```text
READ       yes
SEARCH     yes
VIEW NEWS  yes
VIEW MATCH yes
VIEW FORUM yes
```

The user may not:

```text
COMMENT       no
REPLY         no
VOTE          no
REACT         no
CREATE THREAD no
CREATE POST   no
REPORT        no
SUBSCRIBE     no
OTHER COMMUNITY INTERACTION no
```

The central semantic rule is:

```text
BLUE = temporary read-only community state
```

### 7.2 Blue-card duration

There is no fixed default duration.

The moderator chooses the duration individually based on the violation.

Examples may include:

```text
24 hours
3 days
7 days
14 days
30 days
```

Longer durations may be allowed if moderation policy permits them.

The actual duration of enforcement belongs to the associated sanction record.

The card may store an `expiresAt` value for domain visibility, but the sanction remains the source of truth for technical enforcement duration.

### 7.3 Blue cards and yellow-card counter

A blue card does not count as a yellow card.

It does not increment the yellow-card counter.

It does not reset the yellow-card counter.

Example:

```text
YELLOW
BLUE
YELLOW
```

Result:

```text
active yellow count = 2
```

Not 3.

### 7.4 Blue-card history

A blue card remains part of the user's moderation history after the temporary exclusion ends.

An expired blue card may still be considered as historical context in later moderation decisions.

It must never silently disappear.

---

## 8. Red Card

A red card represents the most severe moderation outcome.

A red card normally results in:

```text
User.status = BANNED
```

The ban is indefinite until explicitly lifted.

Kurvenfunk should not model red cards as permanently irreversible because:

- moderation decisions can be incorrect
- appeals may succeed
- policies can change
- administrators require a controlled recovery path

Therefore:

```text
RED = indefinite until revoked
```

rather than:

```text
RED = technically irreversible forever
```

---

## 9. Red Card Sources

A red card can be created in two ways.

### 9.1 Automatic red card

An automatic red card is generated when a third relevant active yellow card is issued.

Conceptual flow:

```text
new YELLOW card
      |
      v
count relevant active YELLOW cards
      |
      +---- count < 3 ----> done
      |
      +---- count >= 3
                 |
                 v
          create RED card
                 |
                 v
          set user BANNED
                 |
                 v
          revoke sessions
                 |
                 v
          create audit event
                 |
                 v
          notify user
```

The exact business operation is implemented later.

### 9.2 Direct red card

A moderator with the required permission may issue a red card directly for a severe violation.

Possible examples include:

- serious threats
- severe targeted harassment
- doxxing or deliberate publication of private information
- automated spam or bot attacks
- deliberate ban evasion
- other severe violations defined in moderation policy

A direct red card must require:

- structured reason
- user-visible explanation
- internal moderator note where appropriate
- responsible moderator
- timestamp
- audit event later
- optional affected-content reference

---

## 10. Escalation Source

The model should distinguish why a red card exists.

Recommended enum:

```text
ModerationCardEscalationSource

MANUAL
THREE_YELLOW_CARDS
```

Possible semantics:

```text
YELLOW
-> MANUAL

BLUE
-> MANUAL

direct RED
-> MANUAL

automatic RED
-> THREE_YELLOW_CARDS
```

This allows the moderation interface and audit history to clearly show whether a red card was manually imposed or automatically generated.

---

## 11. Card Status

Cards must never be physically deleted as the normal correction mechanism.

Recommended enum:

```text
ModerationCardStatus

ACTIVE
EXPIRED
REVOKED
```

Semantics:

### `ACTIVE`

The card is currently valid.

### `EXPIRED`

The card naturally reached its expiration date.

Primarily relevant for:

- yellow cards
- blue cards with a domain-level expiration date

### `REVOKED`

The card was explicitly withdrawn by an authorized moderator or administrator.

Typical reasons:

- card issued in error
- successful appeal
- evidence changed
- duplicate moderation action
- administrative correction

---

## 12. Revocation

A moderation card must be revocable.

Revocation must not delete the original record.

Recommended fields:

```text
revokedAt
revokedById
revocationReason
```

A revoked card:

- remains visible in moderation history
- does not count toward yellow-card escalation
- must not trigger current enforcement
- clearly shows who revoked it
- clearly shows when it was revoked
- records why it was revoked

Example:

```text
YELLOW
status = REVOKED
revokedAt = ...
revokedById = ...
revocationReason = "Card issued for the wrong comment."
```

---

## 13. Expired vs. Revoked

Expiration and revocation are different domain states.

Expiration means:

```text
The card was valid and naturally reached the end of its defined period.
```

Revocation means:

```text
An authorized moderator explicitly invalidated the card.
```

These states must not be conflated.

---

## 14. User Reference

Every moderation card belongs to exactly one affected user.

Required relation:

```text
ModerationCard.userId -> User.id
```

A card without an affected user is invalid.

A user's moderation history may contain many cards.

Conceptually:

```text
User 1 ---- * ModerationCard
```

---

## 15. Moderator Reference

Every manually issued card must reference the moderator responsible for the decision.

Recommended relation:

```text
ModerationCard.moderatorId -> User.id
```

The referenced account must possess the appropriate moderation permission at issuance time.

The card should preserve the moderator reference even if that moderator later:

- loses the moderator role
- leaves the platform
- becomes inactive

Historical accountability must remain intact.

### 15.1 System-generated cards

Automatic red cards created because of three active yellow cards need a clear system origin.

Two viable implementation patterns are possible later:

```text
A. moderatorId nullable + escalationSource = THREE_YELLOW_CARDS
```

or:

```text
B. dedicated system actor
```

For the domain model, the required semantic rule is:

An automatically generated card must be unambiguously distinguishable from a manually issued card.

The final database representation is chosen in task 081.

---

## 16. Moderation Reason

A card should use a structured reason code.

Conceptually:

```text
reasonCode
```

Reason codes should be stable machine-readable identifiers.

Possible future examples:

```text
INSULT
HARASSMENT
THREAT
SPAM
HATEFUL_CONDUCT
PRIVACY_VIOLATION
BAN_EVASION
OFF_TOPIC_ABUSE
OTHER
```

The definitive set belongs to later moderation-policy work.

Reason codes allow:

- consistent analytics
- moderation reporting
- filtering
- policy mapping
- future localization
- statistics without parsing free text

---

## 17. User-Visible Message

The explanation shown to the affected user must be separate from internal moderator notes.

Recommended field:

```text
userMessage
```

This text explains:

- what happened
- why the card was issued
- what the card means
- where appropriate, how long restrictions last

The field must never contain confidential moderation-only information.

---

## 18. Internal Moderator Note

Recommended field:

```text
moderatorNote
```

This is an internal field.

It may contain information useful to moderation staff, such as:

- decision context
- prior behavior
- supporting details
- why a specific severity was chosen
- notes relevant to an appeal

It must never automatically be exposed to the affected user.

Access should later require an appropriate moderation permission.

---

## 19. Content Reference

A moderation card may optionally reference the content that caused the moderation action.

Supported conceptual targets should include at least:

```text
COMMENT
FORUM_POST
THREAD
ARTICLE
USER
NONE
```

Recommended conceptual enum:

```text
ModerationCardSourceType

COMMENT
FORUM_POST
THREAD
ARTICLE
USER
NONE
```

Associated conceptual field:

```text
sourceId
```

Examples:

```text
sourceType = COMMENT
sourceId = <comment-id>
```

```text
sourceType = FORUM_POST
sourceId = <post-id>
```

```text
sourceType = USER
sourceId = <user-id>
```

```text
sourceType = NONE
sourceId = null
```

---

## 20. Content Reference Rules

The following invariants apply:

```text
sourceType = NONE
-> sourceId must be null
```

```text
sourceType != NONE
-> sourceId should be present
```

The affected user and the referenced content owner do not necessarily have to be identical in every future administrative scenario, but normal moderation flows should ensure the content is relevant to the affected user.

---

## 21. Polymorphic Reference Considerations

Prisma does not provide a native relational polymorphic foreign key.

Therefore the final Prisma model should not blindly implement an unsafe generic foreign key without validation.

Possible implementation strategies for task 081 include:

1. separate nullable relation fields
2. generic `sourceType + sourceId` with application-level validation
3. a dedicated moderation-subject/reference table

The final choice belongs to the Prisma modeling task.

For task 075, the domain requirement is only:

A card can refer to multiple kinds of moderation subjects without duplicating the entire card model.

---

## 22. Timestamps

Recommended timestamps:

```text
issuedAt
expiresAt
revokedAt
createdAt
updatedAt
```

### `issuedAt`

The effective time the moderation card was issued.

### `expiresAt`

Optional expiration timestamp.

Expected defaults:

```text
YELLOW
-> issuedAt + 12 months

BLUE
-> individually selected duration

RED
-> null
```

### `revokedAt`

Present only when explicitly revoked.

### `createdAt`

Database record creation timestamp.

### `updatedAt`

Last technical update timestamp.

`issuedAt` and `createdAt` should remain distinct because historical or imported moderation actions may later require different values.

---

## 23. Expiration Semantics by Card Type

### Yellow

```text
expiresAt required by normal business flow
default = issuedAt + 12 months
```

After expiration:

```text
does not count toward three-yellow rule
```

### Blue

```text
expiresAt expected
duration chosen individually
```

However, technical access restrictions are governed by the associated sanction.

### Red

```text
expiresAt = null
```

A red card remains active until explicitly revoked.

---

## 24. Yellow-Card Counter

The yellow-card counter must not be stored as the authoritative value on `User`.

The source of truth is the set of moderation-card records.

Conceptually:

```text
activeYellowCount =
count cards where
    userId = target user
    type = YELLOW
    status = ACTIVE
    expiresAt > now
```

A cached or derived count may later be introduced for performance, but it must always be reconstructible from PostgreSQL.

---

## 25. Relevant Yellow Cards

A yellow card counts toward automatic red-card escalation only if all following conditions are true:

```text
type = YELLOW
status = ACTIVE
not revoked
not expired
belongs to same user
```

Blue cards never count.

Red cards never count.

Historical expired yellow cards never count.

Revoked yellow cards never count.

---

## 26. Three-Yellow Transaction Boundary

Issuing the third yellow card and creating the resulting red card must eventually be handled atomically.

The intended operation is conceptually:

```text
BEGIN

create YELLOW

lock / safely evaluate user's relevant yellow cards

if count >= 3:
    create automatic RED
    trigger ban enforcement

COMMIT
```

This avoids race conditions where two moderators issue cards at nearly the same time.

The exact transactional implementation belongs to later application and database tasks.

---

## 27. Duplicate Automatic Red Prevention

The system must prevent multiple automatic red cards from being created for the same escalation event.

Example risk:

```text
Moderator A issues yellow
Moderator B issues yellow concurrently
both processes see count >= 3
both create RED
```

The later implementation must include appropriate transaction, locking, idempotency, or uniqueness protection.

Task 075 establishes this as a domain requirement.

---

## 28. Blue Card and Sanction Relationship

A blue card requires a temporary enforcement action.

Conceptually:

```text
BLUE ModerationCard
      |
      v
Sanction
```

The exact relation is defined in task 076.

The sanction should enforce the temporary community exclusion.

The blue card records why the decision exists.

The sanction records what is technically blocked and for how long.

---

## 29. Blue Card Permission Effect

The intended business effect of a blue card is stricter than the current standard `LIMITED` behavior from the master plan.

Standard `LIMITED` currently allows voting.

Blue-card exclusion does not.

Therefore blue-card enforcement must not be represented merely by assuming the existing generic LIMITED permission matrix.

The sanction model must be capable of representing:

```text
comment.create  denied
comment.reply   denied
comment.vote    denied
reaction.create denied
thread.create   denied
thread.reply    denied
post.create     denied
report.create   denied
community interaction denied
```

while public read access remains available.

This requirement must be carried forward into task 076.

---

## 30. Card and Account Status

Card type and account status are separate concepts.

Examples:

```text
YELLOW
-> User may remain ACTIVE
```

```text
BLUE
-> User may retain underlying account identity
-> temporary sanction controls interaction
```

```text
RED
-> User becomes BANNED
```

This preserves the existing Kurvenfunk rule:

```text
ROLE != STATUS
```

and extends it with:

```text
CARD != SANCTION
```

---

## 31. Red Card Revocation

When a red card is revoked, the card record becomes:

```text
status = REVOKED
```

This does not automatically imply that the user's account can always be restored to `ACTIVE`.

Before unbanning, the system must check for:

- another active red card
- another active account-ban sanction
- administrative blocks
- other reasons the account must remain banned

Therefore:

```text
revoke RED card
!=
blindly set user ACTIVE
```

The later moderation service must recompute effective enforcement state safely.

---

## 32. Yellow Card Revocation and Automatic Red Cards

A special case exists when one of the yellow cards that caused an automatic red card is later revoked.

The domain must preserve the causal relationship.

Recommended later design:

An automatically generated red card should be traceable to the yellow cards that triggered it.

If one of the triggering yellow cards is revoked because it was invalid, the automatic red card must be reviewed or automatically re-evaluated according to moderation policy.

Task 075 does not require implementation, but the data model should not prevent this traceability.

---

## 33. Suggested Escalation References

For automatic red cards, later Prisma modeling should allow the triggering yellow cards to be identified.

Conceptually:

```text
RED Card
escalationSource = THREE_YELLOW_CARDS

triggeredBy:
- Yellow Card A
- Yellow Card B
- Yellow Card C
```

This may later be represented through:

- a join table
- an escalation event entity
- audit metadata

The exact implementation is deferred.

---

## 34. Card Mutability

Moderation cards should be mostly immutable after issuance.

Fields that should normally never be silently rewritten:

```text
userId
type
issuedAt
moderatorId
reasonCode
```

Corrections should usually be represented through:

```text
revocation
+
new corrected card if necessary
```

This preserves moderation history.

Administrative metadata such as internal notes may be editable only if changes are audit logged.

---

## 35. Deletion Policy

Normal application logic must not hard-delete moderation cards.

Reasons:

- accountability
- appeal handling
- moderation history
- security review
- auditing
- abuse investigations

Deletion or anonymization required by legal/privacy policy must be handled separately under the later retention and privacy tasks.

---

## 36. User Deletion

If an account is deleted, moderation history may still need to be retained for a defined period.

The exact retention policy is defined later.

The model should therefore avoid assuming that every historical moderation record must be physically deleted together with the public profile.

Where legally appropriate, user references may later be anonymized or pseudonymized while preserving necessary moderation history.

---

## 37. Notifications

Card issuance should later produce a user notification.

Expected notification types:

```text
yellow_card
blue_card
red_card
```

The existing notification task list should therefore be extended to include `blue_card`.

The notification must use user-visible moderation information only.

Internal moderator notes must never be included automatically.

---

## 38. Audit Logging

The following events should later generate audit-log entries:

```text
moderation_card.created
moderation_card.revoked
moderation_card.expired
moderation_card.auto_red_created
```

Potentially also:

```text
moderation_card.note_updated
```

Audit logging is formally modeled in task 078.

---

## 39. Permissions

Suggested future permissions:

```text
user.warn
user.blue_card
user.ban
moderation.card.view
moderation.card.revoke
moderation.card.history.view
```

Exact permission naming is finalized in the permission-system task.

A moderator authorized to issue yellow cards does not necessarily need permission to issue blue or red cards.

This allows stricter authorization for more severe moderation actions.

---

## 40. Validation Rules

At minimum, future input validation should enforce:

### Common

```text
userId required
type required
reasonCode required
userMessage required
issuedAt required
```

### Yellow

```text
type = YELLOW
expiresAt normally required
expiresAt > issuedAt
default duration = 12 months
```

### Blue

```text
type = BLUE
expiresAt required
expiresAt > issuedAt
temporary enforcement duration required
```

### Red

```text
type = RED
expiresAt must be null
```

### Revocation

```text
status = REVOKED
-> revokedAt required
-> revokedById required
-> revocationReason required
```

### Content reference

```text
sourceType = NONE
-> sourceId = null

sourceType != NONE
-> sourceId required
```

---

## 41. Recommended Indexes

Final index design belongs to task 081, but the domain suggests indexes for:

```text
(userId, type)
(userId, status)
(userId, type, status, expiresAt)
(moderatorId, issuedAt)
(sourceType, sourceId)
(issuedAt)
(expiresAt)
```

The most important moderation query is expected to be:

```text
find active non-expired yellow cards for user
```

---

## 42. Example: First Yellow Card

```text
type: YELLOW
user: User A
moderator: Moderator M
reasonCode: INSULT
userMessage: Formal warning for insulting another user.
issuedAt: 2026-08-14
expiresAt: 2027-08-14
status: ACTIVE
```

Effect:

```text
active yellow count = 1
account remains ACTIVE
```

---

## 43. Example: Second Yellow Card

```text
type: YELLOW
issuedAt: 2026-10-01
expiresAt: 2027-10-01
status: ACTIVE
```

Effect:

```text
active yellow count = 2
account remains ACTIVE
```

The user receives a stronger warning.

---

## 44. Example: Third Yellow Card

A third relevant yellow card is issued while the previous two are still active.

Result:

```text
create third YELLOW
active yellow count = 3
create RED automatically
set account BANNED
revoke active sessions
create audit event
create notification
```

The red card records:

```text
escalationSource = THREE_YELLOW_CARDS
```

---

## 45. Example: Expired Yellow Card

Cards:

```text
Yellow A
issued 2026-01-01
expired 2027-01-01

Yellow B
issued 2026-08-01
expires 2027-08-01

Yellow C
issued 2027-02-01
expires 2028-02-01
```

At issuance of Yellow C:

```text
Yellow A = expired
Yellow B = active
Yellow C = active

active yellow count = 2
```

No red card is created.

---

## 46. Example: Blue Card

A user commits a serious violation that does not justify an indefinite ban.

Moderator chooses:

```text
BLUE
duration = 7 days
```

Result:

```text
BLUE card created
temporary sanction created

User can:
- read
- search
- view news
- view matches
- view forum

User cannot:
- comment
- reply
- vote
- react
- post
- create threads
- report
- perform other community interactions
```

After seven days:

```text
sanction expires
community access is restored if no other sanction blocks it
BLUE card remains in moderation history
```

---

## 47. Example: Blue Card with Existing Yellow Cards

History:

```text
Yellow A = active
Blue B = active
Yellow C = active
```

Yellow counter:

```text
2
```

The blue card does not count toward automatic red escalation.

---

## 48. Example: Direct Red Card

A moderator handles a severe privacy violation.

Result:

```text
RED card
escalationSource = MANUAL
expiresAt = null

User.status = BANNED
sessions revoked
audit event created
notification created
```

The red card remains active until explicitly revoked.

---

## 49. Example: Revoked Yellow Card

A moderator determines that a yellow card was issued against the wrong user.

Instead of deleting:

```text
status = REVOKED
revokedAt = ...
revokedById = ...
revocationReason = "Incorrect user attribution."
```

The card remains visible but no longer counts.

---

## 50. Example: Revoked Red Card

An appeal succeeds.

The red card becomes:

```text
status = REVOKED
```

The moderation service then recalculates whether any other active enforcement requires the user to remain banned.

Only if no other active account-ban reason exists may the account become usable again.

---

## 51. Queries the Domain Must Support

The eventual persistence model should efficiently support:

```text
get all cards for user
get active cards for user
get active yellow cards for user
count relevant yellow cards
get active blue card / blue-card history
get active red cards
get cards issued by moderator
get cards related to a content item
get expired cards
get revoked cards
get automatically generated red cards
```

---

## 52. Moderation History Presentation

A moderator-facing history should clearly display:

```text
date
card type
status
reason
moderator
source content
expiration
revocation
escalation origin
linked sanction
```

Example timeline:

```text
2026-02-10  YELLOW  EXPIRED
2026-08-14  YELLOW  ACTIVE
2026-10-02  BLUE    EXPIRED
2027-01-20  YELLOW  ACTIVE
```

Historical cards should never be hidden merely because they no longer affect current permissions.

---

## 53. Public User Privacy

Moderation cards are not public profile content.

Other ordinary users must not be able to inspect another user's moderation history.

Access is limited to:

- affected user where appropriate
- authorized moderators
- authorized administrators
- internal services requiring the data

The user-facing view may contain a reduced representation that excludes internal fields.

---

## 54. API Representation Considerations

Later APIs should use separate representations for:

### User-facing card

May expose:

```text
type
reason
userMessage
issuedAt
expiresAt
status
```

### Moderator-facing card

May additionally expose:

```text
moderator
moderatorNote
source
revocation information
escalation information
linked sanction
```

This separation prevents accidental disclosure of internal moderation information.

---

## 55. Sanction Compatibility

Task 076 must be able to represent at least the enforcement needed by this card model.

Especially:

```text
BLUE
-> temporary complete community interaction block
```

The existing planned sanction examples are:

```text
LIMITED
COMMENT_BLOCK
FORUM_BLOCK
ACCOUNT_BAN
IP_BLOCK
```

Because the blue card forbids voting and all other community interaction, task 076 must ensure that the resulting sanction representation can express that policy exactly.

This may require either:

- a dedicated community-wide temporary block
- a sufficiently expressive sanction permission scope
- multiple coordinated sanctions

The final design is intentionally deferred to task 076.

---

## 56. Interaction with Reports

A card may originate from a moderation report, but a report and a card are not the same entity.

Conceptually:

```text
ModerationReport
      |
      v
moderation decision
      |
      +---- no action
      +---- YELLOW
      +---- BLUE
      +---- RED
      +---- other sanction
```

A future relation may connect a card to the report that initiated the review.

The moderation-card model must not require a report because moderators may issue a card without a user report.

---

## 57. Interaction with Appeals

A future appeal may target:

- a card
- a sanction
- a ban decision

The card model supports this by:

- preserving immutable history
- supporting revocation
- recording revocation reason
- separating public and internal explanations

The full appeal model is defined later.

---

## 58. Worker Responsibilities

Expiration should eventually be handled consistently.

Possible worker responsibilities include:

```text
mark expired cards where appropriate
expire related sanctions
trigger recalculation of effective moderation state
emit audit events
```

However, permission checks must not rely solely on a scheduled worker having already updated a status field.

A timestamp-based rule must remain safe even if a worker runs late.

For yellow-card counting:

```text
expiresAt <= now
```

must always mean the card no longer counts, regardless of whether a background job has already changed `status` to `EXPIRED`.

---

## 59. Time Handling

All timestamps must be stored in a timezone-safe format.

Application logic should compare absolute timestamps.

Human-readable presentation may use the user's locale/timezone.

The 12-month yellow-card expiration should be defined as a calendar duration rather than an approximate fixed number of seconds.

---

## 60. Concurrency

Moderation actions are security-relevant writes.

Future implementation must account for concurrent actions such as:

- two moderators issuing yellow cards simultaneously
- a card being revoked while another escalation is processed
- a blue sanction expiring while another sanction is active
- a red card being revoked while another active red card exists

Effective permissions must be calculated from current authoritative records rather than assumptions based on the last action alone.

---

## 61. Idempotency

Automatic moderation operations should be idempotent where possible.

Examples:

- retrying automatic red creation must not create duplicate red cards
- retrying session revocation is acceptable but must not corrupt state
- retrying notification dispatch must follow notification idempotency rules

---

## 62. Domain Invariants

The following invariants summarize the model:

```text
Every card belongs to exactly one user.

YELLOW expires individually after 12 months by default.

Only active, non-expired, non-revoked YELLOW cards count toward 3x Yellow.

BLUE never counts toward the yellow-card counter.

BLUE produces a temporary read-only community state.

BLUE duration is chosen individually.

RED is indefinite until explicitly revoked.

Three relevant YELLOW cards create an automatic RED.

A severe violation may create a direct RED.

Cards are not sanctions.

Cards are not hard-deleted during normal moderation.

Internal moderator notes are never automatically user-visible.

Revoked cards remain in history.

Expired cards remain in history.
```

---

## 63. Relationship Overview

Conceptually:

```text
User
 |
 | 1
 |
 * ModerationCard
      |
      +-- type: YELLOW
      |
      +-- type: BLUE
      |      |
      |      +----> Sanction (task 076)
      |
      +-- type: RED
             |
             +----> ban enforcement

Moderator/User
 |
 +---- issues / revokes ModerationCard

ModerationReport
 |
 +---- may lead to ModerationCard

Comment / ForumPost / Thread / Article / User
 |
 +---- may be referenced as moderation source

ModerationCard
 |
 +---- later AuditLog
 |
 +---- later Notification
 |
 +---- later Appeal
```

---

## 64. Recommended Conceptual Enums

```text
ModerationCardType
- YELLOW
- BLUE
- RED
```

```text
ModerationCardStatus
- ACTIVE
- EXPIRED
- REVOKED
```

```text
ModerationCardEscalationSource
- MANUAL
- THREE_YELLOW_CARDS
```

```text
ModerationCardSourceType
- COMMENT
- FORUM_POST
- THREAD
- ARTICLE
- USER
- NONE
```

Reason codes are intentionally left for later moderation-policy definition.

---

## 65. Recommended Conceptual Model

```text
ModerationCard

id
userId
moderatorId nullable for system-generated action
type
status
reasonCode
userMessage
moderatorNote nullable
sourceType
sourceId nullable
issuedAt
expiresAt nullable
escalationSource
revokedAt nullable
revokedById nullable
revocationReason nullable
createdAt
updatedAt
```

Possible later relationships:

```text
originatingReport
linkedSanctions
triggeringYellowCards
auditEvents
appeals
```

These should only be added where the later domain models require them.

---

## 66. Decisions Made in Task 075

The following decisions are final for this domain model:

### Card types

```text
YELLOW
BLUE
RED
```

### Yellow duration

Each yellow card normally counts for 12 months from its own issuance date.

After that it expires from the three-yellow-card counter.

### Three-yellow rule

Three simultaneously relevant yellow cards result in an automatic red card.

### Blue semantics

Blue is a rare serious-violation card.

Its duration is selected individually by the moderator.

During the associated temporary exclusion the user may read but cannot perform any community interaction, including voting.

### Blue counter behavior

Blue cards do not count as yellow cards.

### Red semantics

Red is indefinite until explicitly revoked.

### Content reference

Cards can optionally reference:

```text
comment
forum post
thread
article
user
or no concrete content
```

### Explanation separation

User-visible explanation and internal moderator notes are separate fields.

### Revocation

Cards may be revoked but are not deleted.

Revocation records:

```text
who
when
why
```

---

## 67. Follow-Up Requirements for Task 076

The sanction model must account for the decisions made here.

In particular it must support:

- individually timed blue-card exclusion
- no commenting
- no replying
- no voting
- no reactions
- no thread creation
- no posting
- no reports
- no other community interaction
- continued public read access
- independent expiration
- coexistence with other sanctions
- safe effective-permission calculation

---

## 68. Follow-Up Requirements for Task 078

Audit logging must later cover:

- card issuance
- card revocation
- automatic red escalation
- manual red card
- blue-card enforcement creation
- significant moderator-note changes if editing is permitted

---

## 69. Follow-Up Requirements for Task 079

The notification model must include:

```text
yellow_card
blue_card
red_card
```

Moderation notifications must not be fully suppressible by normal notification preferences.

---

## 70. Follow-Up Requirements for Task 081

The Prisma schema must later resolve:

- moderator relation for system-generated cards
- safe content-reference strategy
- card-to-sanction relationship
- automatic-red trigger traceability
- indexes for active-yellow counting
- concurrency protection strategy
- suitable enums
- constraints for expiration and revocation semantics where enforceable

---

## 71. Acceptance Criteria

Task 075 is complete when the domain model defines:

- [x] central `ModerationCard` entity
- [x] `YELLOW` card type
- [x] `BLUE` card type
- [x] `RED` card type
- [x] yellow-card expiration after 12 months
- [x] independent rolling yellow-card expiration
- [x] three-yellow-card automatic red escalation
- [x] direct red cards
- [x] individually timed blue cards
- [x] blue-card read-only community semantics
- [x] blue cards excluded from yellow-card counter
- [x] indefinite red-card semantics
- [x] moderator relation
- [x] affected-user relation
- [x] structured moderation reason
- [x] separate user-visible explanation
- [x] separate internal moderator note
- [x] optional affected-content reference
- [x] card expiration semantics
- [x] card revocation
- [x] no normal hard deletion
- [x] sanction separation
- [x] notification compatibility
- [x] audit compatibility
- [x] Prisma follow-up requirements
- [x] concurrency and idempotency requirements

---

## 72. Final Domain Summary

Kurvenfunk uses one moderation-card domain with three levels:

```text
YELLOW
formal warning
counts for 12 months
3 active YELLOW -> RED
```

```text
BLUE
rare serious violation
temporary exclusion
duration chosen individually
read access remains
all community interaction blocked
does not count as YELLOW
```

```text
RED
severe violation
account ban
indefinite until revoked
can be direct or generated by 3x YELLOW
```

The fundamental architecture remains:

```text
ModerationCard = documented moderation decision

Sanction = technical enforcement

AuditLog = immutable trace of critical actions

Notification = communication to affected user
```

This separation keeps moderation policy, enforcement, auditability, and future platform evolution independently manageable.
