# Task 176 — Automatic Red Card

## Rules

When a moderator issues a yellow card, the API counts active, unrevoked and
unexpired yellow cards (Task 175). At the third relevant yellow card it
automatically:

1. Creates a `RED` moderation card with
   `escalationSource = THREE_YELLOW_CARDS`.
2. Sets `User.status = BANNED`.
3. Writes `MODERATION_CARD_CREATED` and `USER_STATUS_CHANGED` audit events,
   attributed to `SECURITY_AUTOMATION`.
4. Notifies the affected user with a `RED_CARD` notification.
5. Revokes the user's sessions through the Keycloak Admin REST API.

The yellow card, red card, ban, audit events and notifications are written in
one PostgreSQL transaction. The existing user-row lock serializes concurrent
warnings for the same account. If a database operation fails, the transaction
rolls back. A banned account cannot receive additional yellow cards through
this endpoint. An existing active red card prevents duplicate escalation.

## Keycloak revocation and retry

Keycloak logout is an external effect and cannot participate in a PostgreSQL
transaction. Therefore, the red-card notification is created with durable
`metadata.sessionRevocation = "PENDING"` inside the transaction.

**After database commit**, the API attempts
`POST /admin/realms/{realm}/users/{user-id}/logout` with a dedicated service
account. When Keycloak returns HTTP 204, notification metadata is updated to
`"REVOKED"`. If Keycloak is unavailable, the credentials are absent or the
operation fails, the marker stays `"PENDING"` and the API retries the pending
revocations approximately once per minute, including after API restarts.

The account is already `BANNED` during this retry period. The existing
`AccountStatusGuard` blocks authenticated Kurvenfunk API operations. A pending
revocation **must not** be reported as completed or assumed to invalidate an
existing Keycloak browser session.

## Required Keycloak configuration

Use a **separate confidential service-account client for each environment**,
rather than giving the API the Keycloak bootstrap/admin password.

1. In the Kurvenfunk realm, create a confidential OIDC client, for example
   `kurvenfunk-session-revoker`, with **Client authentication** and
   **Service accounts roles** enabled.
2. Under the client service account's roles, assign only the
   `realm-management` client role `manage-users` needed for user logout.
3. Put the client secret in that environment's noncommitted `.env.*` file.
4. Restart the environment's API container with the new Compose environment.
5. Validate an actual three-yellow test scenario on a **dedicated DEV account**:
   assert RED card, BANNED account, audit events, red notification and removal
   of that account's Keycloak sessions.
6. Confirm the notification's sessionRevocation marker changed from
   `PENDING` to `REVOKED`.

Settings (real secrets must never be committed):

```dotenv
KEYCLOAK_ADMIN_INTERNAL_URL=http://keycloak:8080
KEYCLOAK_REVOKER_REALM=kurvenfunk
KEYCLOAK_REVOKER_CLIENT_ID=kurvenfunk-session-revoker
KEYCLOAK_REVOKER_CLIENT_SECRET=<secret-only-in-.env>
```

The API uses the private Compose backend network to access Keycloak. Its
request timeout is five seconds per Keycloak operation.

## Known deployment gate

The existing DEV environment must be provisioned with the dedicated client
and secret before Task 176 can be signed off end-to-end. Tests and builds alone
do not verify real Keycloak session revocation.

No database migration is required: the existing `ModerationCard`, `User`,
`AuditLog` and `Notification` models are reused.
