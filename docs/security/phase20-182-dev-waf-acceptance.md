# Phase 20.182 – DEV Cloudflare WAF operational acceptance

This is a one-time operational trigger record, not proof of successful acceptance.

- Scope: only `auth-dev.kurvenfunk.at` on the `kurvenfunk.at` Cloudflare zone.
- Prerequisites: GitHub Actions secrets `CLOUDFLARE_WAF_API_TOKEN` and `CLOUDFLARE_ZONE_ID` are configured by the operator. Their values must never be committed, logged, or pasted in an issue.
- The deployment job is gated by the exact merge-commit marker `[phase20-182-cf-finalize]` and a successful `develop` DEV deployment.
- The deployment script checks zone ownership and eligible plan, refuses unexpected rule drift and capacity conflicts, and performs read-back audit. No STAGING or PROD application deployment is requested.
- Merge only after PR CI success. Verify that the Cloudflare job passed, then carry out limited synthetic DEV Keycloak login/registration/reset/PKCE and API guard tests. Mark Task 182 DONE only after those tests and safe API feature activation.
- If Cloudflare plan is not eligible, credentials are missing or the workflow fails, stop and leave Task 182 PARTIAL. Do not widen the scope to all hostnames.

Tracking: #27; implementing PRs #83, #84.
