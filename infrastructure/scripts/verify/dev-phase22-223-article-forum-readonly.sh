#!/usr/bin/env bash
# Phase 22.223: public article/forum read-only contract. No DEV writes, no seed.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested develop SHA required}"
cd "$PROJECT_DIR"

[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: PHASE22_223_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE22_223_COMMIT_MISMATCH'; exit 1;
}

assert_http_status() {
  local label="$1" endpoint="$2" expected="$3" observed
  observed="$(curl --silent --show-error --max-time 20 -o /dev/null -w '%{http_code}' "$endpoint")"
  [[ "$observed" == "$expected" ]] || {
    echo "ERROR: PHASE22_223_${label}; expected=$expected observed=$observed"; return 1;
  }
  echo "DEV_PHASE22_223_${label}_HTTP=${observed}"
}

# No data provisioning, only existing public API and SSR route checks.
assert_http_status FORUM_ARTICLE_DIRECTORY 'http://127.0.0.1:3100/forum/artikel' 200
assert_http_status PUBLIC_PUBLISHED_ARTICLES 'http://127.0.0.1:3101/api/v1/articles?limit=3' 200
assert_http_status ABSENT_ARTICLE_API 'http://127.0.0.1:3101/api/v1/articles/by-slug/phase22-223-absent' 404
assert_http_status ABSENT_FORUM_DISCUSSION 'http://127.0.0.1:3100/forum/artikel/phase22-223-absent' 404
echo 'DEV_PHASE22_223_READONLY_RESULT=PASS'
