#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk-staging}"
BRANCH="main"
COMPOSE_PROJECT="kurvenfunk-staging"
EXPECTED_COMMIT="${EXPECTED_COMMIT:-}"
LOCK_FILE="/tmp/kurvenfunk-staging-deploy.lock"

COMPOSE=(
  docker compose
  -p "$COMPOSE_PROJECT"
  --env-file .env.staging
  -f compose.yml
  -f compose.staging.yml
)

cd "$PROJECT_DIR"

exec 9>"$LOCK_FILE"

if ! flock -n 9; then
  echo "ERROR: Another STAGING deployment is already running."
  exit 1
fi

echo "=== Kurvenfunk STAGING Deployment ==="
echo "Directory: $PROJECT_DIR"
echo "Branch:    $BRANCH"
echo

if [[ ! -f ".env.staging" ]]; then
  echo "ERROR: .env.staging not found."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: Working tree is not clean."
  git status --short
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"

if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  echo "ERROR: Expected branch '$BRANCH', currently on '$CURRENT_BRANCH'."
  exit 1
fi

echo "=== Fetch repository ==="
git fetch origin "$BRANCH"

LOCAL_COMMIT="$(git rev-parse HEAD)"
REMOTE_COMMIT="$(git rev-parse "origin/$BRANCH")"

echo "Local:    $LOCAL_COMMIT"
echo "Remote:   $REMOTE_COMMIT"

if [[ -n "$EXPECTED_COMMIT" ]]; then
  echo "Expected: $EXPECTED_COMMIT"

  if [[ "$REMOTE_COMMIT" != "$EXPECTED_COMMIT" ]]; then
    echo
    echo "SKIP: origin/$BRANCH no longer points to the CI-tested commit."
    echo "A newer commit is already present on $BRANCH."
    exit 0
  fi
fi

if [[ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]]; then
  echo
  echo "=== Update repository ==="
  git pull --ff-only origin "$BRANCH"
else
  echo "Repository is already up to date."
fi

DEPLOYED_COMMIT="$(git rev-parse HEAD)"

if [[ -n "$EXPECTED_COMMIT" && "$DEPLOYED_COMMIT" != "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: Checked out commit does not match expected CI commit."
  echo "Expected: $EXPECTED_COMMIT"
  echo "Actual:   $DEPLOYED_COMMIT"
  exit 1
fi

echo
echo "=== Validate Compose configuration ==="
"${COMPOSE[@]}" config --quiet

echo
echo "=== Build release images ==="
"${COMPOSE[@]}" \
  --profile deployment \
  build web api worker migrate

echo
echo "=== Ensure STAGING infrastructure is running ==="
"${COMPOSE[@]}" \
  up -d postgres redis keycloak meilisearch minio

echo
echo "=== Apply database migrations ==="
"${COMPOSE[@]}" \
  --profile deployment \
  run --rm migrate

echo
echo "=== Deploy STAGING application ==="
"${COMPOSE[@]}" \
  up -d --remove-orphans

echo
echo "=== Wait for healthchecks ==="

wait_for_health() {
  local service="$1"
  local max_attempts=36
  local attempt=1
  local container_id
  local status

  while (( attempt <= max_attempts )); do
    container_id="$("${COMPOSE[@]}" ps -q "$service")"

    if [[ -z "$container_id" ]]; then
      echo "ERROR: No container found for service '$service'."
      return 1
    fi

    status="$(
      docker inspect \
        --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
        "$container_id"
    )"

    echo "$service: $status"

    if [[ "$status" == "healthy" ]]; then
      return 0
    fi

    if [[ "$status" == "unhealthy" || "$status" == "exited" || "$status" == "dead" ]]; then
      echo "ERROR: Service '$service' failed."
      "${COMPOSE[@]}" logs --tail=100 "$service"
      return 1
    fi

    sleep 5
    ((attempt++))
  done

  echo "ERROR: Timed out waiting for '$service' to become healthy."
  "${COMPOSE[@]}" logs --tail=100 "$service"
  return 1
}

wait_for_health postgres
wait_for_health redis
wait_for_health keycloak
wait_for_health meilisearch
wait_for_health minio
wait_for_health api
wait_for_health worker
wait_for_health web

echo
echo "=== Public STAGING smoke tests ==="

curl \
  --fail \
  --silent \
  --show-error \
  --retry 6 \
  --retry-delay 5 \
  --retry-all-errors \
  https://staging.kurvenfunk.at/health \
  >/dev/null

curl \
  --fail \
  --silent \
  --show-error \
  --retry 6 \
  --retry-delay 5 \
  --retry-all-errors \
  https://api-staging.kurvenfunk.at/api/v1/health \
  >/dev/null

echo "Web health: OK"
echo "API health: OK"

echo
echo "=== STAGING E2E ==="
WEB_URL="https://staging.kurvenfunk.at" \
API_URL="https://api-staging.kurvenfunk.at" \
AUTH_URL="https://auth-staging.kurvenfunk.at" \
./tests/e2e/staging.sh

echo
echo "=== STAGING Services ==="
"${COMPOSE[@]}" ps

echo
echo "=== Deployment complete ==="
git log -1 --oneline
