#!/usr/bin/env bash
# Phase 23.226: anonymous fail-closed API + public SSR shell; READ ONLY.
# No credentials, DEV fixture insertion or notification state changes.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested develop SHA required}"
cd "$PROJECT_DIR"
[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: PHASE23_226_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE23_226_COMMIT_MISMATCH'; exit 1;
}

assert_status() {
  local label="$1" endpoint="$2" expected="$3" observed
  observed="$(curl --silent --show-error --max-time 20 -o /dev/null -w '%{http_code}' "$endpoint")"
  [[ "$observed" == "$expected" ]] || {
    echo "ERROR: PHASE23_226_${label}; expected=$expected observed=$observed"; return 1;
  }
  echo "DEV_PHASE23_226_${label}_HTTP=${observed}"
}

# The public Next.js shell contains no notification data; identity is fetched
# only in the browser with a valid Keycloak bearer token.
assert_status INBOX_SHELL 'http://127.0.0.1:3100/benachrichtigungen' 200

# The two private APIs MUST reject unauthenticated GETs, including attempts
# that supply a recipient identifier. A 404 here means the endpoint is absent.
assert_status ANONYMOUS_INBOX 'http://127.0.0.1:3101/api/v1/notifications' 401
assert_status ANONYMOUS_UNREAD_COUNT 'http://127.0.0.1:3101/api/v1/notifications/unread-count' 401
assert_status ANONYMOUS_FORGED_USER 'http://127.0.0.1:3101/api/v1/notifications?userId=00000000-0000-4000-8000-000000000000' 401
echo 'DEV_PHASE23_226_READONLY_RESULT=PASS'
