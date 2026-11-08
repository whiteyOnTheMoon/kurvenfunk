# Phase 20.184 – Manueller IP Ban (DEV)

## Authorization and security boundary

Manual network restrictions are a **high-privilege security action**, not a user
account sanction. The existing `user.ipban` permission is assigned to
`SUPERADMIN` only; `ADMIN`, `MODERATOR`, `EDITOR`, `USER`, `LIMITED` and
`BANNED` callers cannot use these APIs. The route uses the existing Keycloak
JWT validation, account-status guard and server-side permission matrix;
user-supplied actor IDs and record source values are rejected.

- `POST /api/v1/moderation/ip-blocks`
- `POST /api/v1/moderation/ip-blocks/:id/revoke`

Both are under the regular `/api/v1` prefix. The first requires an exact
IPv4/IPv6 address, a **bounded** duration of `24H`, `3D`, `7D` or `30D`,
a reason code (`A-Z0-9_`) and a private moderator note. The revoke route
requires a UUIDv4, reason code and private note. Strict schemas reject
unrecognized properties. Permanent bans and automatic source selection are
not available through these endpoints.

Neither endpoint returns the IP address, HMAC hash, private note, HMAC
key, or secrets. Both return only block/sanction IDs, active status and the
relevant timestamps. HTTP logs must not contain request bodies.

## Persistence, audit and undo

The raw IPv4/IPv6 address is **never persisted**. The API normalizes it,
creates the active versioned HMAC-SHA-256 pseudonym from Task 181, and checks
the active and retained old key versions for duplicates. An active duplicate
returns HTTP 409, including cross-version matches.

Creating a manual ban is a single serializable PostgreSQL transaction
creating an `IPBlock`, a linked `Sanction(IP_BLOCK)` and the separate
`IP_BLOCK_CREATED` / `SANCTION_CREATED` audit records. Private evidence is
kept in the restricted IPBlock/Sanction `internalNote` fields, **not** in a
public response or general creation audit metadata. Creating an IP ban does
not change a user account status or revoke sessions.

Revocation performs a serializable compare-and-update of *manual*, active,
unexpired records only. It deactivates the block, revokes its sanction, records
the acting SUPERADMIN and reason, and creates exactly one
`IP_BLOCK_DEACTIVATED` plus one `SANCTION_REVOKED` audit record. Private
revocation evidence is stored only in restricted audit metadata. Repeating a
revocation, targeting an automatic block or racing the expiration worker
cannot create duplicate history. Already expired and inactive bans cannot
be revoked; the expiry worker handles expiration and preserves its separate
audits.

## Rollout boundaries

This PR adds the **API and isolated tests**, not an enabled production ban.
The global `IP_TEMP_BLOCK_ENABLED` feature from Task 183 is still **OFF by
default**. Until a separately approved DEV activation and its trusted proxy
tests, a newly stored manual ban will not be enforced against community
writes in DEV. No STAGING or PROD change is authorized by this task.

The enforcement scope is community writes only (comments, votes, reports
and future forums), *not* login, account recovery, public reading, appeals
or moderation routes. A shared IP address is not proof of user identity;
the administrator must assess false positives before applying a block.

Isolated JWT/JWKS + real ephemeral PostgreSQL/Redis HTTP tests must prove
all roles (including BANNED and LIMITED), strict input validation,
HMAC-only persistence, audit, duplicate handling, revocation, and expiry
worker interactions. A DEV non-mutating runtime smoke is a separate gate
before declaring the entire task accepted. Dashboard/list management belongs
to Task 187, and Red Card–IP association belongs to Task 185.
