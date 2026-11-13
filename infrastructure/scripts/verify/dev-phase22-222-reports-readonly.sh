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

# Report creation uses the same explicit AuthGuard as comment reporting: 401
# is a valid fail-closed outcome. Other protected POST routes may be denied
# by the untrusted-peer/IP guard first (503). Neither result mutates DEV.
# Do not accept 404 (missing route) or a successful/redirect response.
check_denied_post() {
  local name="$1" endpoint="$2" status
  status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
    -X POST -H 'Content-Type: application/json' --data '{}' "$endpoint")"
  case "$status" in
    401|503) echo "DEV_PHASE22_222_${name}_HTTP=${status}_FAIL_CLOSED" ;;
    *) echo "ERROR: PHASE22_222_UNTRUSTED_${name}_GUARD; observed=$status"; return 1 ;;
  esac
}

check_denied_post REPORT_POST "$report_url"
check_denied_post MODERATION_POST "$remove_url"
echo 'DEV_PHASE22_222_READONLY_RESULT=PASS'
