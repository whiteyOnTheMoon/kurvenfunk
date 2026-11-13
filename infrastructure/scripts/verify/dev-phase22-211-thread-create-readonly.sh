#!/usr/bin/env bash
# Phase 22.211: negative, tokenless DEV-only thread-creation guard.
# NEVER create a thread or change a live database in this read-only gate.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested develop SHA required}"
cd "$PROJECT_DIR"

[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: PHASE22_211_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE22_211_COMMIT_MISMATCH'; exit 1;
}

# This nonexistent forum must not be visible even without authentication.
forum_url='http://127.0.0.1:3101/api/v1/forums/by-slug/phase22-211-absent-forum/threads'
get_status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' "$forum_url")"
[[ "$get_status" == 404 ]] || {
  echo "ERROR: PHASE22_211_ABSENT_FORUM_VISIBLE; observed=$get_status"; exit 1;
}
echo 'DEV_PHASE22_211_ABSENT_FORUM_HTTP=404'

# Deliberately send NO token or Cloudflare/IP headers. The active DEV guard
# must reject the POST before any thread/first-post mutation is possible.
post_status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
  -X POST -H 'Content-Type: application/json' --data '{}' "$forum_url")"
[[ "$post_status" == 503 ]] || {
  echo "ERROR: PHASE22_211_UNTRUSTED_THREAD_CREATE_GUARD; observed=$post_status"; exit 1;
}
echo 'DEV_PHASE22_211_UNTRUSTED_POST_HTTP=503_FAIL_CLOSED'
echo 'DEV_PHASE22_211_READONLY_RESULT=PASS'
