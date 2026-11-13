#!/usr/bin/env bash
# Phase 22.212: DEV read-only smoke. Does not create or modify forum data.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested develop SHA required}"
cd "$PROJECT_DIR"

[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: PHASE22_212_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE22_212_COMMIT_MISMATCH'; exit 1;
}

# An unknown forum/thread must never reveal existing discussion data.
thread_status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' 'http://127.0.0.1:3101/api/v1/forums/by-slug/phase22-absent-forum/threads/phase22-absent-thread')"
[[ "$thread_status" == 404 ]] || {
  echo "ERROR: PHASE22_212_ABSENT_THREAD_VISIBLE; observed=$thread_status"; exit 1;
}
echo 'DEV_PHASE22_212_ABSENT_THREAD_HTTP=404'

# The Next.js route should be installed; its client shows a safe empty state.
page_status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' 'http://127.0.0.1:3100/forum/verein/phase22-absent-club/thema/phase22-absent-thread')"
[[ "$page_status" == 200 ]] || {
  echo "ERROR: PHASE22_212_THREAD_PAGE_UNAVAILABLE; observed=$page_status"; exit 1;
}
echo 'DEV_PHASE22_212_THREAD_PAGE_HTTP=200'
echo 'DEV_PHASE22_212_READONLY_RESULT=PASS'
