#!/usr/bin/env bash
# Read-only DEV HTTP acceptance of the public homepage after a zero-content reset.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?An exact tested develop SHA is required}"
cd "$PROJECT_DIR"

[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: DEV_STARTPAGE_INVALID_CHECKOUT'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: DEV_STARTPAGE_COMMIT_MISMATCH'; exit 1;
}
compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
"${compose[@]}" config --quiet
[[ -n "$("${compose[@]}" ps -q api)" ]] || {
  echo 'ERROR: DEV_STARTPAGE_API_NOT_RUNNING'; exit 1;
}

# Check the deployed, unauthenticated HTTP route. No direct database writes,
# fixture creation, login credentials or external API access.
tmp="$(mktemp)"
trap 'rm -f -- "$tmp"' EXIT
curl --fail --silent --show-error --max-time 15 \
  --header 'Accept: application/json' \
  http://127.0.0.1:3101/api/v1/articles/startpage/neutral > "$tmp"

python3 - "$tmp" <<'PY'
import json
import sys

with open(sys.argv[1], encoding='utf-8') as source:
    response = json.load(source)

data = response.get('data') if isinstance(response, dict) else None
if not isinstance(data, dict):
    raise SystemExit('ERROR: DEV_STARTPAGE_RESPONSE_INVALID')
if data.get('variant') != 'NEUTRAL' or data.get('favoriteClub') is not None:
    raise SystemExit('ERROR: DEV_STARTPAGE_NEUTRAL_SHAPE_INVALID')
if not isinstance(data.get('articles'), list):
    raise SystemExit('ERROR: DEV_STARTPAGE_ARTICLES_INVALID')
competition = data.get('competition')
if competition is not None and not (
    isinstance(competition, dict)
    and all(isinstance(competition.get(key), str) for key in ('id', 'name', 'slug'))
):
    raise SystemExit('ERROR: DEV_STARTPAGE_COMPETITION_INVALID')
print('DEV_STARTPAGE_HTTP=200')
print('DEV_STARTPAGE_COMPETITION=' + ('PRESENT' if competition else 'NOT_YET_IMPORTED'))
print('DEV_STARTPAGE_ARTICLE_COUNT=' + str(len(data['articles'])))
print('DEV_STARTPAGE_READONLY_RESULT=PASS')
PY
