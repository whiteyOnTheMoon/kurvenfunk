# Task 20.182 – IP rate limits and Keycloak edge verification

## Two separate enforcement boundaries

The NestJS API can rate-limit comment, forum and report writes. Login, registration
and password reset are hosted directly by Keycloak and bypass NestJS entirely.
**API-only acceptance does not establish full Task 182 completion.**

## API write quotas

| Category | Methods / routes | Quota |
| --- | --- | --- |
| Comments, replies, edits, deletes, votes | API comments and vote endpoints | 30 / 60 s |
| Forum, threads, posts | API paths reserved for later forum implementation | 30 / 60 s |
| Comment reports | POST create report | 10 / 60 s |

The API guard is disabled by default (IP_RATE_LIMIT_ENABLED=false). On enablement
it counts with Redis atomic INCR and PEXPIRE using the versioned HMAC, never raw
addresses. Above the limit: HTTP 429. Redis error, missing/invalid HMAC config,
or unverified socket peer: HTTP 503 for protected writes. Public GET is unaffected.
No permanent IP storage or sanctions are created by this task.

## Peer authentication, do not trust arbitrary headers

The only trusted origin for CF-Connecting-IP is a TCP connection from the
Docker-internal cloudflared service, verified against its current DNS address.
A direct request to the loopback-published API port or from any other Docker
container must not be allowed to forge the client network identity. Never
trust X-Forwarded-For. A missing/forged header fails closed if the feature is
enabled. Verify the Cloudflare Tunnel overwrites client-supplied CF headers.

Do not activate without verifying this proxy boundary on DEV. Run safe
test requests from the local loopback (forged header should fail closed)
and through the verified tunnel (should count by test client IP), in addition
to Redis-error and real-browser checks. The absence of a verified peer must
not silently fall back to the Docker gateway IP.

## Keycloak edge requirements, not covered by NestJS

Keycloak paths on the auth-dev hostname for the kurvenfunk realm:

- Login form: POST /realms/kurvenfunk/login-actions/authenticate
- Registration: POST /realms/kurvenfunk/login-actions/registration
- Reset credentials: POST /realms/kurvenfunk/login-actions/reset-credentials
- PKCE token exchange: POST /realms/kurvenfunk/protocol/openid-connect/token

Cloudflare edge rules must target that hostname, IP and exact route. Proposed
initial quotas, subject to the available Cloudflare WAF plan and testing:

| Flow | Per-IP DEV starting threshold |
| --- | --- |
| Login form | 10 requests per minute |
| Registration | 3 requests per 10 minutes |
| Reset | 3 requests per 10 minutes |
| OIDC token exchange | 30 requests per minute |

These are **not yet deployed WAF rules**. Confirm the actual Cloudflare
subscription supports the required method/host/period matching before
activation. Configure noninteractive rate limiting, avoiding CAPTCHAs
inside the OIDC login/PKCE callback. Verify that real normal registration,
reset and login work before declaring the task done.

Also verify Keycloak realm brute force protection for passwords. That is
an account-centric backstop, not a substitute for IP rate limiting.

## Security acceptance / separation

Task 182 requires live DEV evidence of Cloudflare rules and endpoint
behavior, including synthetic accounts and rejection after the quota,
while normal PKCE, signup and reset remain usable. Do not run aggressive
traffic tests against real users or the production site. Persist no raw IP
in new logs. Verify Redis outage behavior and spoofed origin headers.

Draft PR #28 spans tasks 181–185, is not merge-ready, and trusts a
config-enabled Cloudflare header without authenticating the TCP peer. It
must not be merged unchanged. IP blocks and manual IP bans (183–185)
remain independent.

See also docs/security/phase20-ip-hashing.md for key version rotation and
infrastructure/scripts/maintenance/prune-merged-branches.mjs for guarded
branch cleanup.
