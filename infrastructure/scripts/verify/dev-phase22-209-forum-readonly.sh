#!/usr/bin/env bash
# DEV-only read-only HTTP verification for Forum category task 22.209.
set -Eeuo pipefail
set +x
PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested commit required}"
cd "$PROJECT_DIR"
[[ -f .env.dev && ! -L .env.dev && "$(git branch --show-current)" == develop ]] || {
  echo 'ERROR: PHASE22_FORUM_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE22_FORUM_COMMIT_MISMATCH'; exit 1;
}
compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
"${compose[@]}" config --quiet
tmp="$(mktemp)"
trap 'rm -f -- "$tmp"' EXIT

# Actual HTTP must work even if all forum tables are empty after the reset.
curl --fail --silent --show-error --max-time 15 \
  -H 'Accept: application/json' \
  http://127.0.0.1:3101/api/v1/forums/categories > "$tmp"
python3 - "$tmp" <<'PY'
import json,sys
with open(sys.argv[1],encoding='utf-8') as handle:
    body=json.load(handle)
items=body.get('data') if isinstance(body,dict) else None
if not isinstance(items,list):
    raise SystemExit('ERROR: PHASE22_FORUM_PUBLIC_RESPONSE_INVALID')
for category in items:
    if not isinstance(category,dict) or not all(
        isinstance(category.get(k),str) for k in ('id','name','slug')
    ) or not isinstance(category.get('forums'),list):
        raise SystemExit('ERROR: PHASE22_FORUM_CATEGORY_SHAPE_INVALID')
    for forum in category['forums']:
        if not isinstance(forum,dict) or not all(
            isinstance(forum.get(k),str) for k in ('id','name','slug')
        ):
            raise SystemExit('ERROR: PHASE22_FORUM_CHILD_SHAPE_INVALID')
print('DEV_PHASE22_FORUM_CATEGORIES_HTTP=200')
print('DEV_PHASE22_FORUM_CATEGORY_COUNT='+str(len(items)))
PY

admin_status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
  http://127.0.0.1:3101/api/v1/forums/categories/admin/all)"
[[ "$admin_status" == 401 ]] || {
  echo 'ERROR: PHASE22_FORUM_ADMIN_ACCESS_EXPOSED'; exit 1;
}
echo 'DEV_PHASE22_FORUM_ANON_ADMIN=401'
web_status="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
  http://127.0.0.1:3100/forum)"
[[ "$web_status" == 200 ]] || {
  echo 'ERROR: PHASE22_FORUM_WEB_ROUTE_UNAVAILABLE'; exit 1;
}
echo 'DEV_PHASE22_FORUM_WEB_HTTP=200'
echo 'DEV_PHASE22_FORUM_READONLY_RESULT=PASS'
