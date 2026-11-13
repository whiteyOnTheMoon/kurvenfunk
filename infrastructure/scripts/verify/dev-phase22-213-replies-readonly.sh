#!/usr/bin/env bash
# Phase 22.213 – DEV read-only negative HTTP checks. No bearer or body, no DB mutations.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested develop SHA required}"
cd "$PROJECT_DIR"

[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: PHASE22_213_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE22_213_COMMIT_MISMATCH'; exit 1;
}

# Direct loopback writes must be rejected by the trusted Cloudflare peer gate,
# before AuthGuard and before any route handler. No spoofed headers or tokens.
status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
  -X POST 'http://127.0.0.1:3101/api/v1/forums/by-slug/phase22-absent-forum/threads/phase22-absent-thread/posts')"
[[ "$status" == 503 ]] || {
  echo "ERROR: PHASE22_213_UNTRUSTED_REPLY_GUARD; observed=$status"; exit 1;
}
echo 'DEV_PHASE22_213_UNTRUSTED_REPLY_HTTP=503_FAIL_CLOSED'
echo 'DEV_PHASE22_213_READONLY_RESULT=PASS'
