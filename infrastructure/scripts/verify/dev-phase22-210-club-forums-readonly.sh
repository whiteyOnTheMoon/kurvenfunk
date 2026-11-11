#!/usr/bin/env bash
# Phase 22.210 – DEV-only, read-only HTTP checks after deployment.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested develop SHA required}"
cd "$PROJECT_DIR"
[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: PHASE22_210_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE22_210_COMMIT_MISMATCH'; exit 1;
}
compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
"${compose[@]}" config --quiet

# 404 for non-existent club, without creating any clubs, categories or forums.
club_status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
  http://127.0.0.1:3101/api/v1/forums/clubs/phase22-nonexistent-club)"
[[ "$club_status" == 404 ]] || {
  echo 'ERROR: PHASE22_210_NONEXISTENT_CLUB_VISIBLE'; exit 1;
}
echo 'DEV_PHASE22_210_ABSENT_CLUB_HTTP=404'

# The administrative ensure endpoint must deny anonymous callers.
ensure_status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
  -X POST http://127.0.0.1:3101/api/v1/forums/clubs/11111111-1111-4111-8111-111111111111/ensure)"
# A direct loopback POST intentionally fails *before* the auth guard:
# IP_RATE_LIMIT_ENABLED requires a verified Cloudflare Tunnel socket peer.
# Do not spoof CF-Connecting-IP or bypass the fail-closed 503 protection.
# A valid trusted-peer 401 and role denials are covered by isolated HTTP E2E.
[[ "$ensure_status" == 503 ]] || {
  echo "ERROR: PHASE22_210_LOOPBACK_WRITE_GUARD_MISMATCH; observed=$ensure_status"; exit 1;
}
echo 'DEV_PHASE22_210_UNTRUSTED_WRITE_HTTP=503_FAIL_CLOSED'

# Web route renders a safe, truthful no-club state.
page_status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
  http://127.0.0.1:3100/forum/verein/phase22-nonexistent-club)"
[[ "$page_status" == 200 ]] || {
  echo 'ERROR: PHASE22_210_WEB_ROUTE_UNAVAILABLE'; exit 1;
}
echo 'DEV_PHASE22_210_WEB_HTTP=200'
echo 'DEV_PHASE22_210_READONLY_RESULT=PASS'
