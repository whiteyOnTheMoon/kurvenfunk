#!/usr/bin/env bash
# Phase 22.216: only a tokenless, untrusted loopback write guard. Never mutate DEV data.
set -Eeuo pipefail
set +x
PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested develop SHA required}"
cd "$PROJECT_DIR"
[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: PHASE22_216_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE22_216_COMMIT_MISMATCH'; exit 1;
}
status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
  -X PUT 'http://127.0.0.1:3101/api/v1/forums/by-slug/phase22-absent-forum/threads/phase22-absent-thread/unread')"
[[ "$status" == 503 ]] || {
  echo "ERROR: PHASE22_216_UNTRUSTED_READ_STATE_GUARD; observed=$status"; exit 1;
}
echo 'DEV_PHASE22_216_UNTRUSTED_PUT_HTTP=503_FAIL_CLOSED'
echo 'DEV_PHASE22_216_READONLY_RESULT=PASS'
