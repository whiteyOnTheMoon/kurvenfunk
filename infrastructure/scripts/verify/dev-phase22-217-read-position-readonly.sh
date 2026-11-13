#!/usr/bin/env bash
# 22.217: tokenless, untrusted loopback write guard only. Never mutate DEV.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested develop SHA required}"
cd "$PROJECT_DIR"
[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: PHASE22_217_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE22_217_COMMIT_MISMATCH'; exit 1;
}
status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
  -X PUT 'http://127.0.0.1:3101/api/v1/forums/by-slug/phase22-absent-forum/threads/phase22-absent-thread/read-position')"
[[ "$status" == 503 ]] || {
  echo "ERROR: PHASE22_217_UNTRUSTED_READ_POSITION_GUARD; observed=$status"; exit 1;
}
echo 'DEV_PHASE22_217_UNTRUSTED_PUT_HTTP=503_FAIL_CLOSED'
echo 'DEV_PHASE22_217_READONLY_RESULT=PASS'
