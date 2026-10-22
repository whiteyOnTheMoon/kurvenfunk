# IP Block Domain Model

**Project:** Kurvenfunk
**Task:** 077 – IP Block Model
**Status:** Domain model defined
**Target:** `docs/database/ip-block-model.md`

## 1. Purpose

Kurvenfunk uses IP blocks as an additional technical protection mechanism against abuse, spam, automated attacks, and sanction evasion.

IP blocks do not replace account sanctions, authentication controls, rate limits, or session revocation.

They provide an additional enforcement layer based on a pseudonymized network identity.

The core separation is:

```text
Moderation / security decision
        |
        v
Sanction
type = IP_BLOCK
        |
        | ipBlockId
        v
IPBlock
        |
        +----> pseudonymized IP identity
        +----> technical matching information
        +----> lifecycle / expiration
```

`Sanction` owns the moderation and enforcement context.

`IPBlock` owns the technical IP target.

Raw IP addresses must not be stored permanently in the IP block domain.

---

## 2. Core Domain Rule

An IP address is not a reliable person identifier.

A single public IP may represent:

- multiple household members
- an office
- a university
- a public Wi-Fi network
- a mobile carrier
- carrier-grade NAT
- a VPN exit node
- a proxy
- a hosting provider

Therefore an IP block must be treated as a technical protection measure, not as proof of user identity.

The system must never assume:

```text
same IP
=
same person
```

Likewise:

```text
different IP
!=
different person
```

IP blocking supplements other controls.

It does not replace them.

---

## 3. Entity

The dedicated entity is:

```text
IPBlock
```

Conceptual fields:

```text
id

ipHash
hashKeyVersion

reasonCode
internalNote

source

createdById

active

startsAt
expiresAt

deactivatedAt
deactivatedById
deactivationReason

createdAt
updatedAt
```

The minimal project-plan requirements:

```text
ipHash
reason
createdAt
expiresAt
createdBy
active
```

are preserved while the domain model adds metadata required for safe lifecycle handling, HMAC key rotation, automation, auditing, and later Prisma implementation.

---

## 4. IP Identity

`IPBlock` targets one normalized IP identity.

The application must normalize the IP address before pseudonymization.

Conceptually:

```text
request IP
    |
    v
normalize
    |
    v
canonical IP representation
    |
    v
keyed HMAC
    |
    v
ipHash
```

The same canonical IP processed with the same HMAC key must produce the same `ipHash`.

This allows equality matching without permanently storing the original IP address.

---

## 5. Raw IP Storage

The `IPBlock` entity must not contain a permanent raw-IP field.

Do not model:

```text
ipAddress
rawIp
originalIp
```

inside the persistent IP block record.

The persistent target is:

```text
ipHash
```

Temporary handling of a raw request IP must remain limited to the request or enforcement boundary required to normalize and pseudonymize it.

Raw IP addresses must not be copied into:

- sanction reasons
- internal notes
- audit messages
- application logs
- notification payloads

unless a separately approved security policy explicitly requires such processing.

---

## 6. HMAC Instead of Plain Hashing

A plain unsalted hash is not sufficient.

Do not use:

```text
SHA256(ip)
```

as the persistent identity mechanism.

The address space is sufficiently constrained that plain hashes can be brute-forced.

Kurvenfunk should use a keyed HMAC.

Conceptually:

```text
HMAC(secret, canonicalIp)
```

A suitable implementation may use:

```text
HMAC-SHA-256
```

The exact cryptographic implementation is finalized during Task 181.

Task 077 establishes the domain requirement that the persistent identifier must be keyed.

---

## 7. `ipHash`

`ipHash` stores the encoded HMAC result.

Properties:

- required
- generated server-side
- never accepted directly from ordinary clients
- deterministic for the same canonical IP and HMAC key
- treated as sensitive pseudonymous data
- not publicly exposed

Conceptually:

```text
ipHash = HMAC(activeKey, canonicalIp)
```

The application security layer owns normalization and HMAC calculation.

---

## 8. Hash Key Version

The HMAC key itself must never be stored in PostgreSQL.

The IP block record should store only a non-secret key identifier:

```text
hashKeyVersion
```

Example:

```text
v1
v2
```

This supports controlled key rotation without putting the secret into domain data.

Conceptually:

```text
hashKeyVersion = "v2"
ipHash = HMAC(key_v2, canonicalIp)
```

---

## 9. HMAC Key Rotation

Key rotation creates an important matching problem.

A hash created with one key cannot be reproduced with another key.

Therefore enforcement during a rotation period may need to compute hashes using multiple accepted key versions.

Example:

```text
active keys:
v2
v1
```

Request matching:

```text
canonicalIp
   |
   +--> HMAC(v2) --> compare active v2 blocks
   |
   +--> HMAC(v1) --> compare active v1 blocks
```

Old keys should only remain available for the minimum migration or retention period required by policy.

Task 181 must define the exact operational key-rotation procedure.

---

## 10. IP Normalization

Normalization must be deterministic.

The same logical IP identity must always produce the same canonical representation before HMAC calculation.

Task 181 must define exact normalization rules for:

- IPv4
- IPv6
- IPv4-mapped IPv6 addresses
- canonical textual representation
- trusted reverse-proxy headers

Do not calculate hashes from arbitrary unvalidated header strings.

The enforcement layer must obtain the client IP from a trusted network boundary.

---

## 11. Trusted Proxy Boundary

Kurvenfunk may run behind Cloudflare and reverse proxies.

Therefore request IP extraction must not blindly trust:

```text
X-Forwarded-For
```

or equivalent client-controlled headers.

Only proxy metadata from explicitly trusted infrastructure may be used.

The exact extraction rules belong to the later security implementation.

Task 077 establishes that `IPBlock` matches a trusted canonical client IP identity, not an arbitrary request header.

---

## 12. Reason

Every IP block requires a reason.

Use a stable internal reason code rather than only free text.

Conceptually:

```text
reasonCode
```

Possible examples:

```text
BAN_EVASION
AUTOMATED_SPAM
BRUTE_FORCE
REGISTRATION_ABUSE
REPORT_ABUSE
MALICIOUS_AUTOMATION
MANUAL_SECURITY_ACTION
OTHER
```

The final shared moderation/security reason taxonomy should be coordinated with Task 078 and Task 081.

---

## 13. Internal Note

Optional field:

```text
internalNote
```

Purpose:

- moderator context
- security context
- operational explanation

It must not contain the raw IP address.

It must not be exposed to ordinary users.

---

## 14. Block Source

IP blocks may originate from different workflows.

Conceptual enum:

```text
IPBlockSource
```

Initial values:

```text
MANUAL
SANCTION
AUTOMATED_SECURITY
RATE_LIMIT_ESCALATION
```

Meaning:

### `MANUAL`

Explicit action by an authorized moderator or administrator.

### `SANCTION`

Created as part of a moderation flow such as severe ban evasion.

### `AUTOMATED_SECURITY`

Created by a trusted security rule or abuse-detection mechanism.

### `RATE_LIMIT_ESCALATION`

Created after predefined rate-limit or abuse thresholds are exceeded.

The exact automation policies are not defined by Task 077.

---

## 15. Creator

Conceptual field:

```text
createdById
```

A manually created IP block should reference the responsible Kurvenfunk user.

Automated blocks may have:

```text
createdById = null
```

when their origin is represented by:

```text
source = AUTOMATED_SECURITY
```

or another system source.

Do not create fake system users solely to satisfy the relation.

---

## 16. Activation State

The project plan requires:

```text
active
```

`active` is stored as explicit operational state.

However, effective enforcement must also respect time.

A block is effective only if:

```text
active = true
AND
startsAt <= now
AND
(expiresAt IS NULL OR expiresAt > now)
```

Therefore `active = true` alone does not necessarily mean the block is currently effective.

---

## 17. `startsAt`

Conceptual field:

```text
startsAt
```

Normally:

```text
startsAt = createdAt
```

Supporting a separate start time keeps the model compatible with scheduled enforcement without requiring redesign.

For MVP, creation-time activation is expected.

---

## 18. `expiresAt`

`expiresAt` is optional.

Meaning:

```text
expiresAt = timestamp
```

means the block stops being effective at that time.

```text
expiresAt = null
```

means no automatic expiration has been scheduled.

Null does not mean inactive.

Permanent or indefinite IP blocking should be used cautiously.

---

## 19. Temporary IP Blocks

Temporary blocks are preferred for most IP-based enforcement.

Examples:

```text
15 minutes
1 hour
24 hours
3 days
7 days
30 days
```

The exact allowed presets are a policy concern for Task 183 and Task 184.

The domain model supports any valid future expiration timestamp.

---

## 20. Manual IP Ban

Task 184 introduces manual IP bans.

A manual IP ban is represented by:

```text
IPBlock.source = MANUAL
createdById = moderator/admin
active = true
expiresAt = optional
```

A manual block requires appropriate permission and later audit logging.

The model does not create a second `IPBan` entity.

---

## 21. Automated IP Block

Automated security controls may create an `IPBlock` when predefined policy permits it.

Example:

```text
source = AUTOMATED_SECURITY
createdById = null
```

Automated creation must be conservative because of shared IPs, carrier NAT, VPNs, and proxies.

The domain model permits automation but does not define detection thresholds.

---

## 22. Relation to `Sanction`

Task 076 established:

```text
Sanction.type = IP_BLOCK
Sanction.ipBlockId -> IPBlock.id
```

This remains the authoritative relationship.

Responsibilities are separated:

```text
Sanction
- moderation/enforcement context
- affected user when known
- source card
- source report
- sanction lifecycle
- user-facing moderation message
- appeal context

IPBlock
- pseudonymized IP target
- HMAC key version
- IP-specific activation
- IP-specific expiration
- technical block source
```

The models must not duplicate each other's responsibilities unnecessarily.

---

## 23. Sanction Requirement

An IP block used as a formal moderation sanction should have an associated:

```text
Sanction(type = IP_BLOCK)
```

Purely technical automated security blocks may exist without a user-facing disciplinary sanction when they are part of abuse protection rather than moderation.

Therefore the relationship should conceptually support:

```text
IPBlock
0..1 <-> 0..1 Sanction
```

with application validation determining when a sanction is mandatory.

---

## 24. Relation Direction

Task 076 already reserves:

```text
Sanction.ipBlockId
```

Therefore Task 081 should not add a second mandatory foreign key such as:

```text
IPBlock.sanctionId
```

unless Prisma relation mechanics require a non-owning relation field.

Conceptually, the foreign key owner remains:

```text
Sanction.ipBlockId
```

This avoids duplicate relationship state.

---

## 25. One Block, One Sanction Context

A formal `IP_BLOCK` sanction should reference exactly one `IPBlock`.

Conversely, one technical `IPBlock` should not normally be shared by multiple sanctions.

Preferred invariant:

```text
Sanction.ipBlockId
```

is unique for sanctions of type:

```text
IP_BLOCK
```

This creates an effective one-to-one relationship for formal sanction-backed IP blocks.

---

## 26. User Association

The `IPBlock` itself does not require a `userId`.

User context belongs primarily to the sanction.

Example:

```text
Sanction
type = IP_BLOCK
userId = user_123
ipBlockId = ipblock_456
```

For unknown abuse:

```text
Sanction
type = IP_BLOCK
userId = null
ipBlockId = ipblock_456
```

The technical block remains usable without asserting identity.

---

## 27. Red Card Integration

A red card must not automatically create an IP block.

Correct separation:

```text
RED card
   |
   +--> ACCOUNT_BAN
   |
   +--> optional IP_BLOCK when justified
```

Possible severe case:

```text
ModerationCard(type = RED)
        |
        +--> Sanction(type = ACCOUNT_BAN)
        |
        +--> Sanction(type = IP_BLOCK)
                  |
                  v
               IPBlock
```

IP protection is an optional additional measure.

---

## 28. Ban Evasion

IP blocking may be appropriate for repeated or severe sanction evasion.

However:

```text
matching ipHash
```

is only a signal that requests came from the same pseudonymized network identity.

It is not proof that the same natural person is responsible.

Security and moderation tooling must preserve this distinction.

---

## 29. Rate Limits vs. IP Blocks

Rate limits and IP blocks are different concepts.

Rate limit:

```text
temporary request-frequency control
```

IP block:

```text
persistent PostgreSQL-backed enforcement record
```

A rate-limit event may escalate into an IP block, but ordinary rate-limit counters belong in Redis or another temporary mechanism.

Do not store every rate-limit hit as an `IPBlock`.

---

## 30. Enforcement Scope

An IP block may apply to one or more application capabilities.

The initial project plan identifies IP-based protection for:

- registration
- login
- password reset
- comments
- forum posts
- reports
- ban evasion
- bots
- spam

Task 077 does not require separate scope fields yet.

The initial model assumes an application-level block policy determined by the enforcement service.

If future requirements need granular IP-block scopes, Task 081 or a later migration may introduce them explicitly.

---

## 31. Application-Level Enforcement

The initial IP block model is for Kurvenfunk application enforcement.

Conceptually:

```text
HTTP request
   |
   v
trusted IP extraction
   |
   v
normalization
   |
   v
HMAC candidates
   |
   v
effective IPBlock lookup
   |
   +--> no match -> continue
   |
   +--> match -> enforce policy
```

This is separate from infrastructure firewall rules.

---

## 32. Network-Level Blocking

`IPBlock` must not be assumed to represent:

- Cloudflare firewall rules
- VPS firewall entries
- operating-system firewall rules
- provider-level network ACLs

Those are separate infrastructure concerns.

If Kurvenfunk later synchronizes domain blocks to Cloudflare or another network layer, that synchronization must remain derived from PostgreSQL domain state.

PostgreSQL remains the source of truth.

---

## 33. Effective Block

An IP block is effective when:

```text
active = true
AND
startsAt <= now
AND
(expiresAt IS NULL OR expiresAt > now)
```

Additionally, the stored `ipHash` must match one of the HMAC candidates computed using accepted key versions.

A deactivated or expired block must not reject requests.

---

## 34. Expiration

Expiration is time-based loss of effectiveness.

At:

```text
now >= expiresAt
```

the block is no longer effective.

The later Task 191 worker may update persisted state for operational clarity.

However, request-time enforcement must never rely solely on a worker having executed exactly on time.

Time comparison remains authoritative for effectiveness.

---

## 35. Deactivation

A block may be explicitly deactivated before its scheduled expiration.

Conceptual fields:

```text
active = false
deactivatedAt
deactivatedById
deactivationReason
```

This is distinct from natural expiration.

Example:

```text
manual false positive
-> deactivate block
```

Do not rewrite:

```text
expiresAt
```

to fake a manual revocation.

---

## 36. Reactivation

Reactivating an old deactivated IP block should generally be avoided.

Preferred approach:

```text
old IPBlock remains historical
new IPBlock is created
```

This preserves a clearer audit history.

If reactivation is ever allowed, it must be explicitly audited.

For MVP, treat deactivation as terminal.

---

## 37. Deletion Policy

IP blocks are security and moderation records.

They should not normally be hard-deleted during ordinary workflows.

Preferred lifecycle:

```text
active
-> expired
or
-> deactivated
-> retained according to policy
-> deleted/anonymized according to retention rules
```

Administrative deletion must not be used as the normal unblock mechanism.

---

## 38. Retention

IP-related pseudonymous data requires a dedicated retention policy.

Task 248 must define:

- how long active blocks are stored
- how long expired blocks are retained
- how long deactivated blocks are retained
- when old HMAC key versions may be removed
- when records are deleted or irreversibly anonymized

Task 077 does not establish legal retention periods.

It establishes that retention must be finite and policy-driven where possible.

---

## 39. Privacy Classification

`ipHash` is pseudonymous security data.

It must not be treated as anonymous merely because the raw IP is absent.

Access must be restricted.

It must not be exposed in:

- public APIs
- user profiles
- ordinary frontend payloads
- notifications
- public moderation history

Moderator/admin visibility should be limited to what is operationally necessary.

---

## 40. Display in Moderation UI

Moderation interfaces should not display the full `ipHash` by default.

Possible safe representation:

```text
IP identity: 7f3a…91c2
```

or an internal opaque block ID.

Even authorized staff generally do not need the complete HMAC value for routine moderation.

---

## 41. Logging

Application logs must not contain:

```text
raw IP
full ipHash
HMAC secret
```

unless a separately approved security logging policy explicitly permits it.

Preferred structured fields:

```text
event = IP_BLOCK_MATCHED
ipBlockId = ...
requestId = ...
```

The record ID is normally enough for correlation.

---

## 42. Audit Logging

Task 078 must audit critical IP-block actions.

Expected events include:

```text
IP_BLOCK_CREATED
IP_BLOCK_DEACTIVATED
IP_BLOCK_EXPIRED
```

Potential future events:

```text
IP_BLOCK_EXTENDED
IP_BLOCK_MATCHED
```

Routine match events may belong in operational security telemetry instead of immutable audit history, depending on volume.

---

## 43. Notifications

Creating an IP block does not necessarily create a user notification.

For anonymous automated abuse:

```text
no known user
-> no notification
```

For a known user's formal moderation sanction:

```text
Sanction(type = IP_BLOCK)
-> notification policy may apply
```

Task 079 and later moderation tasks define exact notification behavior.

---

## 44. Appeals

If an IP block is part of a formal user sanction, appeals should operate through the sanction/moderation domain.

The appeal should not require exposing:

```text
ipHash
```

to the affected user.

Technical IP data remains internal.

---

## 45. Duplicate Active Blocks

The system should avoid unnecessary duplicate effective blocks for the same:

```text
ipHash
hashKeyVersion
```

Before creating a block, the service should check whether an equivalent effective block already exists.

However, database uniqueness must not prevent legitimate historical records after previous blocks expire or are deactivated.

Therefore a simple permanent unique constraint on:

```text
(ipHash, hashKeyVersion)
```

is not appropriate.

---

## 46. Overlapping Blocks

Overlapping blocks for the same IP identity may occur because of concurrent actions or different workflows.

Effective enforcement is boolean:

```text
at least one effective matching block
-> blocked according to policy
```

Removing one matching block must not override another still-effective block.

This is analogous to overlapping sanctions.

---

## 47. Extension

A temporary block may need to be extended.

Preferred operation:

```text
expiresAt = later timestamp
updatedAt = now
```

Extension must be authorized and auditable.

It must not create an artificial deactivate/create sequence unless policy specifically requires immutable block instances.

Task 078 should capture the extension event if implemented.

---

## 48. Concurrency

Block creation may occur concurrently from:

- moderators
- automated security controls
- sanction workflows
- rate-limit escalation

Services must handle duplicate creation attempts safely.

Exact transaction and idempotency strategies are defined during implementation.

The domain requirement is:

```text
concurrent creation must not create contradictory enforcement state
```

---

## 49. Expiration Worker

Task 191 includes IP-block expiration.

The worker should:

- find blocks whose `expiresAt <= now`
- process them in bounded batches
- update persisted operational state if required
- remain idempotent
- tolerate retries
- not accidentally reactivate or extend records

Request-time effectiveness must still check timestamps independently.

---

## 50. `active` and Expiration Worker

Because the project plan explicitly requires `active`, the persisted state may be changed after expiration:

```text
active = true
expiresAt <= now
```

becomes:

```text
active = false
```

through the expiration worker.

However, the interim state must already be treated as ineffective before the worker runs.

Therefore:

```text
active
```

is an operational state flag, not the only source of effective-state truth.

---

## 51. Reason Ownership

`IPBlock.reasonCode` explains the technical reason for the network-identity block.

A linked sanction may separately contain moderation-facing context.

Example:

```text
Sanction.reasonCode = BAN_EVASION
IPBlock.reasonCode = BAN_EVASION
```

The values may align, but they serve separate entities.

Task 081 should avoid unnecessary duplicated free-text explanations.

---

## 52. Security-Origin Blocks Without Sanction

Example automated protection:

```text
repeated malicious registration automation
        |
        v
IPBlock
source = AUTOMATED_SECURITY
createdById = null
expiresAt = +1 hour
```

No moderation card is required.

A formal user sanction is also not required when no user is targeted.

---

## 53. Manual Moderation Block With Sanction

Example:

```text
known banned user
+ repeated ban evasion
        |
        v
Sanction
type = IP_BLOCK
userId = user_123
        |
        v
IPBlock
source = SANCTION
expiresAt = +7 days
```

This preserves both moderation context and the technical network target.

---

## 54. Red Card Plus Temporary IP Protection

Example:

```text
RED card
   |
   +--> ACCOUNT_BAN sanction
   |
   +--> optional IP_BLOCK sanction
               |
               v
            IPBlock
            active = true
            expiresAt = +7 days
```

The account ban and IP block expire or are revoked independently.

Removing the IP block must not unban the account.

Removing the account ban must not automatically remove a still-effective security block unless explicit workflow policy says so.

---

## 55. Anonymous Abuse Example

```text
anonymous request flood
        |
        v
trusted IP extraction
        |
        v
HMAC
        |
        v
IPBlock
source = AUTOMATED_SECURITY
expiresAt = +1 hour
```

No user reference is required.

---

## 56. Shared IP False Positive Example

Consider:

```text
User A abuses Kurvenfunk
User B shares the same public IP
```

An IP block may affect both users.

Therefore:

- blocks should often be temporary
- permanent automatic bans should be avoided
- account identity should remain the primary moderation target when known
- moderator tools must communicate that an IP match is not person-level proof

---

## 57. VPN Example

A VPN exit address may be shared by many unrelated users.

Blocking such an IP can create broad collateral impact.

The system must not automatically infer:

```text
VPN IP used by banned account
-> permanently ban VPN IP
```

Risk-based policy belongs to later moderation and security implementation.

---

## 58. IPv6 Considerations

IPv6 creates additional design considerations.

Task 181 must determine whether blocking targets:

- exact IPv6 addresses only
- normalized prefixes in specific high-risk scenarios
- or another explicitly defined identity strategy

Task 077 does not introduce prefix blocks.

The initial entity represents one normalized IP identity.

Any future subnet or prefix blocking should be modeled explicitly rather than overloading `ipHash`.

---

## 59. No CIDR Overloading

Do not place values such as:

```text
192.0.2.0/24
2001:db8::/64
```

into the same `ipHash` field semantics.

Exact-IP identity and network-prefix identity are different domain concepts.

If CIDR/prefix blocking becomes necessary, introduce a dedicated model or explicit target type later.

---

## 60. Query: Effective Block Match

Conceptual lookup:

```text
for each accepted HMAC key version:
    candidateHash = HMAC(key, canonicalIp)

find IPBlock where:
    ipHash = candidateHash
    hashKeyVersion = correspondingVersion
    active = true
    startsAt <= now
    and (
        expiresAt is null
        or expiresAt > now
    )
```

Enforcement stops as soon as policy has sufficient matching evidence.

---

## 61. Query: Expiring Blocks

Task 191 needs:

```text
active = true
expiresAt IS NOT NULL
expiresAt <= now
```

Recommended support index:

```text
IPBlock(active, expiresAt)
```

---

## 62. Query: Moderation History

Moderation/admin tooling may query:

```text
createdAt
source
reasonCode
createdById
active
expiresAt
```

It should normally reference the block by:

```text
IPBlock.id
```

rather than displaying the full `ipHash`.

---

## 63. Recommended Indexes

Conceptual indexes:

```text
IPBlock(ipHash, hashKeyVersion)
IPBlock(active, expiresAt)
IPBlock(createdAt)
IPBlock(createdById)
IPBlock(source)
IPBlock(reasonCode)
```

The most important enforcement lookup is:

```text
(ipHash, hashKeyVersion)
```

The most important expiration lookup is:

```text
(active, expiresAt)
```

Exact Prisma/PostgreSQL indexes are finalized in Task 081.

---

## 64. No Permanent Unique Hash Constraint

Do not define:

```text
UNIQUE(ipHash, hashKeyVersion)
```

for the entire table.

Kurvenfunk may legitimately need historical records:

```text
block 1 -> expired
block 2 -> later created for same IP identity
```

Uniqueness should be enforced at the active workflow level if necessary, not by preventing all historical reuse.

---

## 65. Conceptual Prisma Direction

Task 077 does not modify Prisma.

Task 081 may conceptually introduce:

```prisma
enum IPBlockSource {
  MANUAL
  SANCTION
  AUTOMATED_SECURITY
  RATE_LIMIT_ESCALATION
}

model IPBlock {
  id                   String   @id
  ipHash               String
  hashKeyVersion       String

  reasonCode           String
  internalNote         String?

  source               IPBlockSource
  createdById          String?

  active               Boolean
  startsAt             DateTime
  expiresAt            DateTime?

  deactivatedAt        DateTime?
  deactivatedById      String?
  deactivationReason   String?

  createdAt            DateTime
  updatedAt            DateTime
}
```

This is directional only.

Task 081 must resolve:

- ID strategy
- User relations
- Sanction relation
- relation names
- delete behavior
- shared reason enums
- timestamp defaults
- indexes
- database constraints

No Prisma schema should be changed during Task 077.

---

## 66. Relation to User Model

Potential user relations:

```text
createdById
deactivatedById
```

reference Kurvenfunk users acting in authorized moderation/admin roles.

These are actor references.

They do not identify the person behind the blocked IP.

---

## 67. Deletion Behavior for Actor Users

If an administrator or moderator account is later deleted or anonymized, historical IP-block records must not silently disappear.

Task 081 should therefore use relation/delete behavior compatible with retention and audit requirements.

The exact Prisma behavior is deferred.

---

## 68. Relation to Audit Log Model

Task 078 should support IP-block event history without duplicating domain state.

Expected relationship:

```text
IPBlock
-> current technical state

AuditLog
-> immutable history of critical changes
```

Audit log must not store raw IPs.

Prefer references such as:

```text
targetType = IP_BLOCK
targetId = ipblock_123
```

---

## 69. Relation to Notification Model

Task 079 may generate notifications from a formal linked sanction.

`IPBlock` itself should not own notification state.

This keeps the technical security entity independent from user communication.

---

## 70. Relation to Task 181

Task 181 must implement the HMAC policy defined here.

It must finalize:

- trusted client-IP extraction
- normalization
- HMAC algorithm
- secret storage
- key version identifiers
- rotation
- multiple-key matching
- test vectors
- logging restrictions

Task 181 must not fall back to plain hashing.

---

## 71. Relation to Task 182

Task 182 implements IP rate limits.

Rate-limit counters should remain short-lived technical state.

They may use Redis.

Only escalated durable blocks belong in PostgreSQL as `IPBlock`.

---

## 72. Relation to Task 183

Task 183 implements temporary IP blocks.

It should use:

```text
active = true
startsAt = now
expiresAt = future timestamp
```

and one of the defined block sources.

---

## 73. Relation to Task 184

Task 184 implements manual IP bans.

Requirements include:

- appropriate permission
- server-side HMAC generation
- reason
- creator
- optional expiration
- audit event
- protection against accidental duplicate active blocks

---

## 74. Relation to Task 185

Task 185 combines red-card enforcement with optional IP protection.

Required rule:

```text
red card
does not automatically imply
IP block
```

The workflow must require explicit policy justification.

---

## 75. Relation to Task 191

Task 191 handles expiration.

The worker must understand:

```text
expiresAt
active
```

and deactivate expired records safely and idempotently.

Request enforcement must still independently evaluate the expiration timestamp.

---

## 76. Permission Requirements

Later Task 172 should include permissions such as:

```text
user.ipban
ipblock.create
ipblock.deactivate
ipblock.read
```

Exact permission names are deferred.

Ordinary users must never be able to create, deactivate, or enumerate IP blocks.

---

## 77. API Exposure

Public API representation should never contain:

```text
ipHash
hashKeyVersion
internalNote
createdById
deactivatedById
```

Ordinary affected users may instead receive a generic enforcement response according to security policy.

Do not disclose enough information to help attackers test whether a specific IP identity is blocked.

---

## 78. Moderator API Exposure

Authorized moderation tooling may receive:

```text
id
reasonCode
source
active
startsAt
expiresAt
createdAt
createdBy
deactivatedAt
deactivationReason
```

The full `ipHash` should only be exposed when strictly required by a specialized security permission.

---

## 79. Enumeration Protection

There must be no endpoint allowing ordinary clients to submit an IP address and ask:

```text
is this IP blocked?
```

Such an endpoint would enable block enumeration and abuse.

Enforcement decisions should happen internally.

---

## 80. Validation Rules

At creation:

```text
ipHash
```

must be generated by trusted server code.

Required:

```text
ipHash
hashKeyVersion
reasonCode
source
active
startsAt
createdAt
```

If:

```text
source = MANUAL
```

then normally:

```text
createdById != null
```

If:

```text
expiresAt != null
```

then:

```text
expiresAt > startsAt
```

If:

```text
active = false
```

because of manual deactivation, then normally:

```text
deactivatedAt != null
```

---

## 81. Deactivation Validation

Manual deactivation should require:

```text
deactivatedById
deactivationReason
deactivatedAt
```

Automated expiration may use:

```text
deactivatedById = null
```

if expiration is represented by changing `active`.

The later audit model must preserve who or what performed the transition.

---

## 82. Source Validation

Recommended invariants:

```text
MANUAL
-> createdById required

SANCTION
-> linked IP_BLOCK sanction expected

AUTOMATED_SECURITY
-> createdById optional

RATE_LIMIT_ESCALATION
-> createdById optional
```

These are domain-level validations and may not all be expressible as simple database constraints.

---

## 83. Security Requirements

The IP-block implementation must:

- use keyed HMAC
- store secrets outside PostgreSQL
- never expose HMAC secrets
- avoid persistent raw IP storage
- use trusted proxy/IP extraction
- normalize before hashing
- support key versioning
- avoid raw IP logging
- restrict hash visibility
- enforce blocks server-side
- remain conservative with automatic blocks

---

## 84. Privacy Requirements

The model must support:

- data minimization
- access restriction
- retention
- deletion/anonymization policy
- pseudonymous classification
- user data export decisions
- privacy auditability

Task 248 and Task 296 must revisit these requirements before production.

---

## 85. Monitoring

Useful operational metrics may include:

```text
active_ip_blocks
ip_blocks_created_total
ip_blocks_expired_total
ip_blocks_deactivated_total
ip_block_matches_total
ip_blocks_by_source
```

Metrics must not include:

```text
raw IP
full ipHash
```

as labels.

High-cardinality personal identifiers must not be metric labels.

---

## 86. False Positive Monitoring

Task 331 explicitly requires reviewing IP-block effectiveness.

Useful signals:

- frequency of manual reversals
- block duration
- number of blocked requests
- support/appeal incidents
- blocks associated with VPN/shared infrastructure
- repeated abuse after expiration

The purpose is to tune policy, not to establish identity from IP data.

---

## 87. PostgreSQL as Source of Truth

Durable IP blocks live in PostgreSQL.

Caches may accelerate matching, but they must be reconstructable.

Conceptually:

```text
PostgreSQL IPBlock
        |
        +--> optional cache
        |
        +--> enforcement
```

Redis must not become the only source of durable block state.

---

## 88. Cache Strategy

A later implementation may cache effective block identifiers.

Any cache must:

- derive from PostgreSQL
- have bounded lifetime
- be invalidated on creation/deactivation where necessary
- tolerate cache loss
- not store unnecessary raw IP data

Cache design is outside Task 077.

---

## 89. Failure Behavior

Security enforcement must define behavior for dependency failures.

For example:

```text
database temporarily unavailable
```

must not cause inconsistent ad-hoc decisions in individual controllers.

Exact fail-open/fail-closed policy depends on endpoint sensitivity and is deferred to implementation.

Task 077 requires centralized enforcement rather than duplicated controller logic.

---

## 90. Domain Service Responsibilities

A future IP-block domain/security service should own:

```text
normalize trusted client IP
calculate HMAC candidates
create block
find effective matching block
extend block
deactivate block
evaluate expiration
prevent unnecessary duplicates
provide safe moderator projections
```

Controllers should not implement HMAC or block matching independently.

---

## 91. No Client-Controlled Hash

Clients must never submit:

```text
ipHash
hashKeyVersion
```

as trusted creation data.

For manual blocking, an authorized backend workflow may receive a raw candidate IP in a protected request, but the server must independently normalize and HMAC it before persistence.

The raw value must not be persisted in the resulting entity.

---

## 92. Manual Entry Safety

If administrative tooling later allows entering an IP address manually, the UI/API must:

- validate IP syntax
- normalize server-side
- hash server-side
- avoid echoing or logging the raw value unnecessarily
- require permission
- require a reason
- support temporary expiration
- create an audit event

---

## 93. Import and External Sources

External abuse/security providers must not write `IPBlock` rows directly.

They should go through an application service that applies:

- validation
- normalization
- HMAC
- policy
- source classification
- audit requirements

This preserves domain invariants.

---

## 94. Domain Invariants

The IP-block domain must enforce the following invariants:

1. `IPBlock` is the dedicated technical IP-target entity.
2. `Sanction` and `IPBlock` remain separate concepts.
3. Formal IP sanctions use `Sanction.type = IP_BLOCK`.
4. `Sanction.ipBlockId` references the technical block.
5. Raw IP addresses are not permanently stored in `IPBlock`.
6. Persistent IP identities use keyed HMAC, not plain hashing.
7. HMAC secrets are not stored in PostgreSQL.
8. `hashKeyVersion` identifies the non-secret key version used.
9. IP extraction must come from a trusted network boundary.
10. IP addresses are normalized before HMAC calculation.
11. An IP address is not treated as proof of person identity.
12. IP blocks may exist without a known user.
13. Red cards do not automatically create IP blocks.
14. Temporary IP blocking is preferred where appropriate.
15. `expiresAt = null` means no automatic expiration, not inactivity.
16. Effective state considers `active`, `startsAt`, and `expiresAt`.
17. Expired blocks must be ineffective even before the worker updates `active`.
18. Manual deactivation and natural expiration remain distinguishable.
19. Historical rows should not normally be hard-deleted during enforcement workflows.
20. Multiple historical blocks for the same IP identity are allowed.
21. Ordinary rate-limit counters are not `IPBlock` records.
22. PostgreSQL is the source of truth for durable IP blocks.
23. Public APIs never expose `ipHash`.
24. Logs and metrics do not contain raw IPs or full IP hashes.
25. Retention must be explicitly defined before production.

---

## 95. Decisions Made in Task 077

### Dedicated entity

The technical entity is:

```text
IPBlock
```

### Sanction relation

Formal moderation enforcement uses:

```text
Sanction.type = IP_BLOCK
Sanction.ipBlockId -> IPBlock.id
```

### Persistent IP identity

Store:

```text
ipHash
```

generated with keyed HMAC.

### Raw IP

Do not permanently store raw IP addresses in the entity.

### Key rotation

Store:

```text
hashKeyVersion
```

but never the HMAC secret.

### Activation

Persist:

```text
active
```

while effective state also depends on start and expiration timestamps.

### Expiration

Use:

```text
expiresAt
```

with null meaning no automatic expiration.

### Source

Distinguish:

```text
MANUAL
SANCTION
AUTOMATED_SECURITY
RATE_LIMIT_ESCALATION
```

### Identity meaning

An IP match is a network-identity signal, not proof of a natural person.

### Red cards

Red cards may receive additional IP protection when justified, but never automatically by domain rule.

### Prisma

No Prisma schema is modified during Task 077.

---

## 96. Follow-Up Requirements for Task 078

Task 078 must define audit events for:

```text
IP_BLOCK_CREATED
IP_BLOCK_DEACTIVATED
IP_BLOCK_EXPIRED
```

and potentially:

```text
IP_BLOCK_EXTENDED
```

Audit payloads must not contain raw IP addresses.

---

## 97. Follow-Up Requirements for Task 081

Task 081 must finalize:

- `IPBlock` Prisma model
- `IPBlockSource`
- `Sanction.ipBlockId` relation
- one-to-one relation semantics
- User actor relations
- nullability
- defaults
- timestamp behavior
- deletion behavior
- indexes
- database constraints
- reason taxonomy reuse

The Prisma schema should remain consistent with Task 076.

---

## 98. Follow-Up Requirements for Task 181

Task 181 must implement and document:

- trusted client-IP extraction
- IPv4 normalization
- IPv6 normalization
- HMAC-SHA-256 or approved equivalent
- secret storage
- key versioning
- rotation procedure
- multi-key matching
- unit-test vectors
- secure logging rules

---

## 99. Follow-Up Requirements for Task 183

Temporary IP blocking must create records with:

```text
active = true
startsAt = now
expiresAt > now
```

and must define allowed automatic/manual durations.

---

## 100. Follow-Up Requirements for Task 184

Manual IP bans require:

- explicit permission
- reason
- creator
- server-side hashing
- audit logging
- safe default duration policy
- duplicate detection

Indefinite blocks should require stronger justification than short temporary blocks.

---

## 101. Follow-Up Requirements for Task 185

Red-card integration must preserve:

```text
ACCOUNT_BAN
```

and:

```text
IP_BLOCK
```

as independent sanctions.

The IP block is optional additional protection.

---

## 102. Follow-Up Requirements for Task 191

The expiration worker must:

- find expired active IP blocks
- deactivate them idempotently
- work in bounded batches
- tolerate retry
- avoid overriding manual changes
- produce audit events where required

---

## 103. Acceptance Criteria

Task 077 is complete when the domain documentation defines:

- [x] dedicated `IPBlock` entity
- [x] `ipHash`
- [x] keyed HMAC requirement
- [x] raw-IP non-storage rule
- [x] normalization requirement
- [x] trusted proxy/IP extraction requirement
- [x] `hashKeyVersion`
- [x] key-rotation compatibility
- [x] reason
- [x] creator
- [x] block source
- [x] `active`
- [x] `startsAt`
- [x] `expiresAt`
- [x] deactivation semantics
- [x] relation to `Sanction`
- [x] formal vs technical-only blocks
- [x] red-card interaction
- [x] shared-IP/VPN/CGNAT considerations
- [x] rate-limit separation
- [x] application-level enforcement
- [x] retention direction
- [x] privacy exposure rules
- [x] logging rules
- [x] indexing direction
- [x] expiration-worker compatibility
- [x] Task 081 Prisma direction
- [x] Task 181 implementation requirements

---

## 104. Final Domain Summary

Kurvenfunk models IP protection through a dedicated:

```text
IPBlock
```

entity.

The persistent technical target is a pseudonymized network identity:

```text
ipHash
```

generated using a keyed HMAC over a normalized trusted client IP.

Raw IP addresses are not permanently stored in the IP-block entity.

The model stores a non-secret:

```text
hashKeyVersion
```

so HMAC keys can be rotated safely.

Formal moderation IP sanctions remain represented by:

```text
Sanction.type = IP_BLOCK
```

with:

```text
Sanction.ipBlockId -> IPBlock.id
```

This preserves the separation between moderation context and technical network identity.

An IP block may also exist independently for automated security protection when no user-facing sanction is appropriate.

Effective blocking requires:

```text
active = true
AND
startsAt <= now
AND
(expiresAt IS NULL OR expiresAt > now)
```

Expiration is therefore enforced correctly even if the background expiration worker has not yet updated the persisted `active` flag.

IP addresses are never treated as reliable proof of person identity.

Shared networks, carrier-grade NAT, mobile providers, VPNs, proxies, and public networks make automatic permanent IP bans unsafe.

For that reason, Kurvenfunk treats IP blocking as an additional, carefully scoped protection mechanism rather than the primary identity or moderation system.

PostgreSQL remains the source of truth for durable IP-block state.

Task 077 changes documentation only.

The actual Prisma representation is deferred to Task 081 and the cryptographic implementation to Task 181.
