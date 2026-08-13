#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk-production}"
COMPOSE_PROJECT="kurvenfunk-prod"
LOCK_FILE="/tmp/kurvenfunk-prod-deploy.lock"
RELEASE_DIR="/srv/kurvenfunk/prod/releases"
CURRENT_RELEASE_FILE="$RELEASE_DIR/current"
PREVIOUS_RELEASE_FILE="$RELEASE_DIR/previous"

COMPOSE=(
  docker compose
  -p "$COMPOSE_PROJECT"
  --env-file .env.prod
  -f compose.yml
  -f compose.prod.yml
)

cd "$PROJECT_DIR"

exec 9>"$LOCK_FILE"

if ! flock -n 9; then
  echo "ERROR: Another PRODUCTION deployment or rollback is already running."
  exit 1
fi

echo "=== Kurvenfunk PRODUCTION Rollback ==="
echo "Directory: $PROJECT_DIR"
echo

if [[ ! -f ".env.prod" ]]; then
  echo "ERROR: .env.prod not found."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: Working tree is not clean."
  git status --short
  exit 1
fi

if [[ ! -f "$CURRENT_RELEASE_FILE" ]]; then
  echo "ERROR: Current release state not found."
  exit 1
fi

if [[ ! -f "$PREVIOUS_RELEASE_FILE" ]]; then
  echo "ERROR: Previous release state not found."
  echo "No rollback target is currently available."
  exit 1
fi

CURRENT_COMMIT="$(<"$CURRENT_RELEASE_FILE")"
ROLLBACK_COMMIT="$(<"$PREVIOUS_RELEASE_FILE")"

echo "Current release:  $CURRENT_COMMIT"
echo "Rollback target:  $ROLLBACK_COMMIT"
echo

if [[ "$CURRENT_COMMIT" == "$ROLLBACK_COMMIT" ]]; then
  echo "ERROR: Current and previous release are identical."
  exit 1
fi

echo "=== Fetch repository ==="
git fetch origin

if ! git cat-file -e "${ROLLBACK_COMMIT}^{commit}" 2>/dev/null; then
  echo "ERROR: Rollback commit does not exist."
  exit 1
fi

echo
echo "=== Checkout rollback commit ==="
git checkout --detach "$ROLLBACK_COMMIT"

DEPLOYED_COMMIT="$(git rev-parse HEAD)"

if [[ "$DEPLOYED_COMMIT" != "$ROLLBACK_COMMIT" ]]; then
  echo "ERROR: Checked out commit does not match rollback target."
  exit 1
fi

echo
echo "=== Validate Compose configuration ==="
"${COMPOSE[@]}" config --quiet

echo
echo "=== Build rollback release images ==="
"${COMPOSE[@]}" \
  --profile deployment \
  build web api worker

echo
echo "=== Deploy rollback release ==="
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
wait_for_health api
wait_for_health worker
wait_for_health web

echo
echo "=== Public PRODUCTION smoke tests ==="

curl \
  --fail \
  --silent \
  --show-error \
  --retry 6 \
  --retry-delay 5 \
  --retry-all-errors \
  https://kurvenfunk.at/health \
  >/dev/null

curl \
  --fail \
  --silent \
  --show-error \
  --retry 6 \
  --retry-delay 5 \
  --retry-all-errors \
  https://api.kurvenfunk.at/api/v1/health \
  >/dev/null

curl \
  --fail \
  --silent \
  --show-error \
  --retry 6 \
  --retry-delay 5 \
  --retry-all-errors \
  https://api.kurvenfunk.at/api/v1/health/ready \
  >/dev/null

curl \
  --fail \
  --silent \
  --show-error \
  --retry 6 \
  --retry-delay 5 \
  --retry-all-errors \
  https://auth.kurvenfunk.at/realms/kurvenfunk \
  >/dev/null

echo "Web health: OK"
echo "API health: OK"
echo "API readiness: OK"
echo "Keycloak realm: OK"

echo
echo "=== Update rollback release state ==="

printf '%s\n' "$ROLLBACK_COMMIT" > "$CURRENT_RELEASE_FILE"
printf '%s\n' "$CURRENT_COMMIT" > "$PREVIOUS_RELEASE_FILE"

chmod 640 "$CURRENT_RELEASE_FILE"
chmod 640 "$PREVIOUS_RELEASE_FILE"

echo "Current release:  $(<"$CURRENT_RELEASE_FILE")"
echo "Previous release: $(<"$PREVIOUS_RELEASE_FILE")"

echo
echo "=== PRODUCTION Services ==="
"${COMPOSE[@]}" ps

echo
echo "=== Rollback complete ==="
git log -1 --oneline
