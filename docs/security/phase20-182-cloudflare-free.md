# Task 20.182 – Cloudflare Free / DEV Keycloak Gateway

## State and safety

The gateway implementation is opt-in and is NOT LIVE. Merging its PR does not
change Cloudflare Tunnel, enable the NestJS API IP limits, or affect STAGING/PROD.
The Business/Enterprise WAF path remains unavailable on the confirmed Free plan.

## Required external tunnel routing

The existing DEV public hostname auth-dev.kurvenfunk.at currently forwards to
Keycloak. The gateway does not enforce limits until the managed Cloudflare Tunnel
public hostname route is changed from http://keycloak:8080 to
http://auth-gateway:8080. That public hostname route is managed outside
this repository; changing the Docker Compose service alone does NOT protect
public Keycloak endpoints. Never change the route before testing the gateway.
Keep a documented rollback to the old route.

## Implementation

- Verify Docker TCP peer matches live cloudflared DNS address before accepting
  any CF-Connecting-IP header. Never trust client-supplied Forwarded headers.
  Independently prove Cloudflare overwrites injected CF headers in DEV.
- Fixed-window Redis Lua atomic counters with HMAC-SHA-256 keys, no raw IP
  stored in Redis. Persistent random secret (32+ bytes base64url) required.
- POST quotas: login 10 per 60 seconds, registration/reset 3 per 600 seconds,
  OIDC token 30 per 60 seconds. Other Keycloak paths are proxied normally.
- Fail-closed HTTP 503 for untrusted origin, missing/invalid credentials or
  Redis errors; 429 for requests exceeding the relevant quota.
- Rebuild Host and X-Forwarded headers before proxying to Keycloak.
- DEV only, no published gateway port.

## Controlled DEV rollout checklist

1. Confirm intended tunnel routing and Docker network, not just source code.
2. Confirm Keycloak KC_PROXY_HEADERS=xforwarded and local host-loopback
   127.0.0.1:3102 is not publicly accessible. Internal backend services can
   reach Keycloak directly and must be treated as trusted infrastructure.
3. Configure IP_HASH_HMAC_SECRET in the permission-restricted DEV .env.dev
   before running any overlay. Never paste secrets into GitHub/chat/logs.
4. Include compose.yml, compose.dev.yml and compose.dev.auth-gateway.yml
   in a Docker Compose config --quiet verification. Start only auth-gateway
   after Redis and Keycloak are healthy, with up -d --no-deps auth-gateway.
5. Test synthetic proxy/PKCE/registration/reset and forged-header behavior
   BEFORE changing the tunnel route. Record an immediate rollback procedure.
6. DEV deployment uses the overlay ONLY when .env.dev explicitly contains
   AUTH_GATEWAY_ENABLED=true, preserving the gateway during up --remove-orphans.
   Without that setting, the gateway remains opt-in and is not managed by the
   normal deployment. Set this flag only after the pre-cutover acceptance.
   A standalone compose command using fewer compose files can still remove an
   enabled gateway; always use the full overlay-aware compose file set.

## Acceptance before Task 182 DONE

- Real DEV synthetic Keycloak Authorization Code + PKCE, login, registration,
  reset and logout complete without broken cookies or redirects.
- Untrusted TCP peer + forged CF headers denied. Confirm real tunnel overwrites
  externally supplied CF headers. Direct origin bypass assessed.
- Controlled synthetic 429 after each protected quota; unrelated GET unaffected.
- Redis outage produces 503; recovery works. No real-user traffic stress tests.
- Mobile/desktop browser flows, restart behavior and key rotation reviewed.
- API IP_RATE_LIMIT_ENABLED activated only with persistent HMAC key and proven
  real tunnel trust; 429/503/community actions tested separately.
- DEV deployment retains running gateway. STAGING/PROD untouched.

Until these are verified, Task 20.182 remains PARTIAL, not DONE.
Issue #27 tracks acceptance.
