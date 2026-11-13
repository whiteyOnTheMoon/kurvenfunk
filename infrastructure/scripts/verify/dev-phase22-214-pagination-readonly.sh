#!/usr/bin/env bash
# Phase 22.214: read-only negative cursor/page smoke on DEV, no seeding.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested develop SHA required}"
cd "$PROJECT_DIR"

[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: PHASE22_214_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE22_214_COMMIT_MISMATCH'; exit 1;
}

# On an unknown forum/thread the API may not expose any paginated data.
# Query cursors must not bypass visibility checks.
thread_list_status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
  'http://127.0.0.1:3101/api/v1/forums/by-slug/phase22-absent-forum/threads?cursor=e30')"
[[ "$thread_list_status" == 404 ]] || {
  echo "ERROR: PHASE22_214_HIDDEN_FORUM_LEAK; observed=$thread_list_status"; exit 1;
}
echo 'DEV_PHASE22_214_UNKNOWN_FORUM_CURSOR_HTTP=404'

post_page_status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
  'http://127.0.0.1:3101/api/v1/forums/by-slug/phase22-absent-forum/threads/phase22-absent-thread?cursor=e30')"
[[ "$post_page_status" == 404 ]] || {
  echo "ERROR: PHASE22_214_HIDDEN_THREAD_LEAK; observed=$post_page_status"; exit 1;
}
echo 'DEV_PHASE22_214_UNKNOWN_THREAD_CURSOR_HTTP=404'
echo 'DEV_PHASE22_214_READONLY_RESULT=PASS'
