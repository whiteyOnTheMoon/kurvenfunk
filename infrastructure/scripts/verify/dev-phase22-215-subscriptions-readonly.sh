#!/usr/bin/env bash
# Phase 22.215: DEV read-only fail-closed guard check. No token, no payload, no DB writes.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested develop SHA required}"
cd "$PROJECT_DIR"

[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: PHASE22_215_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE22_215_COMMIT_MISMATCH'; exit 1;
}

# Untrusted local writes are rejected by the existing fail-closed IP gate
# before authorization or database code. Never send real user tokens.
for method in PUT DELETE; do
  status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
    -X "$method" \
    'http://127.0.0.1:3101/api/v1/forums/by-slug/phase22-absent-forum/threads/phase22-absent-thread/subscription')"
  [[ "$status" == 503 ]] || {
    echo "ERROR: PHASE22_215_UNTRUSTED_SUBSCRIPTION_GUARD; method=$method observed=$status"; exit 1;
  }
  echo "DEV_PHASE22_215_UNTRUSTED_${method}_HTTP=503_FAIL_CLOSED"
done
echo 'DEV_PHASE22_215_READONLY_RESULT=PASS'
