#!/usr/bin/env bash
# Phase 22.222: untrusted tokenless write guards. No DEV mutation.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested develop SHA required}"
cd "$PROJECT_DIR"

[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: PHASE22_222_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE22_222_COMMIT_MISMATCH'; exit 1;
}

prefix='http://127.0.0.1:3101/api/v1'
post='00000000-0000-4000-8000-000000000000'
report_url="$prefix/forums/by-slug/phase22-absent-forum/threads/phase22-absent-thread/posts/$post/reports"
remove_url="$prefix/moderation/forum-posts/$post/remove"

for endpoint in "$report_url" "$remove_url"; do
  status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
    -X POST -H 'Content-Type: application/json' --data '{}' "$endpoint")"
  [[ "$status" == 503 ]] || {
    echo "ERROR: PHASE22_222_UNTRUSTED_POST_GUARD; observed=$status"; exit 1;
  }
done

echo 'DEV_PHASE22_222_UNTRUSTED_REPORT_POST_HTTP=503_FAIL_CLOSED'
echo 'DEV_PHASE22_222_UNTRUSTED_MODERATION_POST_HTTP=503_FAIL_CLOSED'
echo 'DEV_PHASE22_222_READONLY_RESULT=PASS'
