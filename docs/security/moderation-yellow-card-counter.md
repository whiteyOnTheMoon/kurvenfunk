# Task 175 — Yellow Card Counter

The moderator-only `POST /api/v1/moderation/yellow-cards` endpoint automatically
counts relevant yellow cards **after** creating a new yellow card.

## Relevance

A card is counted only when all conditions apply:

- It belongs to the warned user.
- Its type is `YELLOW`.
- Its status is `ACTIVE`.
- It has not been revoked (`revokedAt IS NULL`).
- Its `expiresAt` is absent or later than the evaluation timestamp.

Expired and revoked cards do not contribute to the escalation threshold.
The newly issued card is included if it is still relevant.

## Counter result

The API response adds the following fields to the issued card:

| Relevant cards | `counterStage` | `redCardRequired` |
| --- | --- | --- |
| 0 | `NONE` | `false` |
| 1 | `YELLOW` | `false` |
| 2 | `SECOND_YELLOW` | `false` |
| 3 or more | `RED_CARD_REQUIRED` | `true` |

The second yellow card produces a stronger notification. Reaching the
threshold is recorded in the moderation audit metadata and identified in
the notification without revealing private moderator notes.

**Boundary:** Task 175 detects the threshold, but does not yet issue a
`RED` moderation card, set `User.status = BANNED`, or revoke sessions.
Those are the responsibilities of Task 176 (automatic red card). Therefore,
`redCardRequired` is a signal for the subsequent escalation workflow, not
evidence that the ban has already been applied.

## Consistency

Issuance and counting happen in one PostgreSQL transaction using
`ReadCommitted` isolation. The transaction locks the target `User` row with
`SELECT ... FOR UPDATE` before creating the card. This serializes concurrent
yellow-card creation for the same account and ensures each count sees
previously committed warnings.

If counting, auditing, or notification creation fails, the issuance
transaction is aborted rather than reporting an unverified count.

No database schema change or migration is required for Task 175.
