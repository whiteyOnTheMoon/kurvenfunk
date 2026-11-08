# Task 20.182 – controlled completion evidence

Scope from the master plan: IP Rate Limits on Login, Register, Reset,
Comments, Forum and Reports. OAuth token POST is protected as an additional
authentication endpoint.

## Isolated CI outage / recovery acceptance

The PR-only job runs the **compiled actual auth-gateway** on a disposable
Docker network (mock Keycloak upstream, disposable Redis, synthetic cloudflared
TCP peer). It verifies:

- the 10/min login, 3/10min registration, 3/10min reset and 30/min
  token request quotas yield 429 on the first over-limit POST;
- verified peer/Host enforcement rejects header spoofing with 503;
- loss of the isolated Redis makes protected POSTs return 503 while GET
  continues working;
- after the isolated Redis is restarted, the running gateway automatically
  reconnects; no incoming writes are queued while it is disconnected;
- after an auth-gateway restart, existing Redis quota keys remain enforced.

**Never stop or fault-inject the shared DEV Redis service.** The API write
limiter's Redis retry/fail-closed behavior is covered by its unit tests; a
fully isolated API HTTP test is separate from the gateway integration.

## One-shot public DEV quota acceptance

An opt-in post-DEV workflow job gated by `[phase20-182-final-dev]` checks
the real Cloudflare Tunnel and active API IP limit from an ephemeral GitHub
runner with **no cookies, JWT, accounts or passwords**. Max requests by type:

- login 11, registration 4, reset 4 (Keycloak form paths);
- comments 31, reports 11 (nonexistent content identifiers and empty bodies).

All requests are noninteractive and contain no valid sessions or data.
The expected responses are an error/redirect up to the allowed threshold and
then the limiter's own 429. GET health/discovery must remain available.
The token quota (30/60s) and forged client IP already have a real DEV
public-edge acceptance recorded separately (#27; workflow #42418019064).

Run the public suite only once from a clean GitHub runner IP. It will
temporarily exhaust its own IP quota and must never be pointed at STAGING/PROD.
Avoid running this suite near user acceptance checks.

## Status boundary

- CI isolated tests + public synthetic HTTP acceptance are technical proofs
  of limiter behavior, **not** tests with a live authenticated comment
  author or full forum endpoints.
- Key rotation for API IP bans is covered by dedicated HMAC unit tests; do
  not rotate active DEV secrets without a separate change/rollback procedure.
- A new gateway might require redeployment for a code change, so after merge
  confirm that DEV containers are actually running the exact tested commit.
- Record evidence in GitHub issue #27 and mark 20.182 DONE only when all
  documented acceptance criteria have actually passed.
