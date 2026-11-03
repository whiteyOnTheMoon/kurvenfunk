#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
BRANCH="develop"
COMPOSE_PROJECT="kurvenfunk-dev"
EXPECTED_COMMIT="${EXPECTED_COMMIT:-}"
LOCK_FILE="/tmp/kurvenfunk-dev-deploy.lock"

cd "$PROJECT_DIR"

exec 9>"$LOCK_FILE"

if ! flock -n 9; then
  echo "ERROR: Another DEV deployment is already running."
  exit 1
fi

echo "=== Kurvenfunk DEV Deployment ==="
echo "Directory: $PROJECT_DIR"
echo "Branch:    $BRANCH"
echo

if [[ ! -f ".env.dev" ]]; then
  echo "ERROR: .env.dev not found."
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
docker compose \
  -p "$COMPOSE_PROJECT" \
  --env-file .env.dev \
  -f compose.yml \
  -f compose.dev.yml \
  config --quiet

echo
echo "=== Build application images ==="
docker compose \
  -p "$COMPOSE_PROJECT" \
  --env-file .env.dev \
  -f compose.yml \
  -f compose.dev.yml \
  build \
  web api worker

echo
echo "=== Update DEV environment ==="
if ! docker compose \
  -p "$COMPOSE_PROJECT" \
  --env-file .env.dev \
  -f compose.yml \
  -f compose.dev.yml \
  up -d --remove-orphans; then
  echo "ERROR: Docker Compose failed while starting DEV services."
  echo "=== Recent API container logs ==="
  docker compose \
    -p "$COMPOSE_PROJECT" \
    --env-file .env.dev \
    -f compose.yml \
    -f compose.dev.yml \
    logs --tail=100 api || true
  exit 1
fi

echo
echo "=== Wait for application healthchecks ==="

wait_for_health() {
  local service="$1"
  local max_attempts=30
  local attempt=1

  while (( attempt <= max_attempts )); do
    container_id="$(
      docker compose \
        -p "$COMPOSE_PROJECT" \
        --env-file .env.dev \
        -f compose.yml \
        -f compose.dev.yml \
        ps -q "$service"
    )"

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
      docker compose \
        -p "$COMPOSE_PROJECT" \
        --env-file .env.dev \
        -f compose.yml \
        -f compose.dev.yml \
        logs --tail=100 "$service"
      return 1
    fi

    sleep 5
    ((attempt++))
  done

  echo "ERROR: Timed out waiting for '$service' to become healthy."
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
echo "=== Internal smoke tests ==="
curl --fail --silent --show-error \
  http://127.0.0.1:3100/health >/dev/null

curl --fail --silent --show-error \
  http://127.0.0.1:3101/api/v1/health >/dev/null

echo "Web health: OK"
echo "API health: OK"

echo
echo "=== DEV Services ==="
docker compose \
  -p "$COMPOSE_PROJECT" \
  --env-file .env.dev \
  -f compose.yml \
  -f compose.dev.yml \
  ps

echo
echo "=== Deployment complete ==="
git log -1 --oneline
