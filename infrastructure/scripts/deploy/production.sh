#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk-production}"
BRANCH="main"
COMPOSE_PROJECT="kurvenfunk-prod"
EXPECTED_COMMIT="${EXPECTED_COMMIT:-}"
LOCK_FILE="/tmp/kurvenfunk-prod-deploy.lock"
BACKUP_DIR="/srv/kurvenfunk/prod/backups/pre-deploy"
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
  echo "ERROR: Another PRODUCTION deployment is already running."
  exit 1
fi

echo "=== Kurvenfunk PRODUCTION Deployment ==="
echo "Directory: $PROJECT_DIR"
echo "Branch:    $BRANCH"
echo

if [[ ! -f ".env.prod" ]]; then
  echo "ERROR: .env.prod not found."
  exit 1
fi

if [[ -z "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: EXPECTED_COMMIT is required for PRODUCTION deployment."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: Working tree is not clean."
  git status --short
  exit 1
fi

echo "=== Fetch repository ==="
git fetch origin "$BRANCH"

REMOTE_COMMIT="$(git rev-parse "origin/$BRANCH")"

echo "Remote main: $REMOTE_COMMIT"
echo "Approved:    $EXPECTED_COMMIT"

if ! git cat-file -e "${EXPECTED_COMMIT}^{commit}" 2>/dev/null; then
  echo "ERROR: Approved commit does not exist locally after fetch."
  exit 1
fi

if ! git merge-base --is-ancestor "$EXPECTED_COMMIT" "origin/$BRANCH"; then
  echo "ERROR: Approved commit is not part of origin/$BRANCH."
  exit 1
fi

echo
echo "=== Checkout approved commit ==="
git checkout --detach "$EXPECTED_COMMIT"

DEPLOYED_COMMIT="$(git rev-parse HEAD)"

if [[ "$DEPLOYED_COMMIT" != "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: Checked out commit does not match approved commit."
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
echo "=== Ensure PRODUCTION infrastructure is running ==="
"${COMPOSE[@]}" \
  up -d postgres redis keycloak meilisearch

echo
echo "=== Pre-deployment PostgreSQL backup ==="

mkdir -p "$BACKUP_DIR"
chmod 750 "$BACKUP_DIR"

TIMESTAMP="$(date +'%Y%m%d-%H%M%S')"
BACKUP_FILE="$BACKUP_DIR/kurvenfunk-${TIMESTAMP}-${DEPLOYED_COMMIT:0:12}.dump"

POSTGRES_CONTAINER="$("${COMPOSE[@]}" ps -q postgres)"

if [[ -z "$POSTGRES_CONTAINER" ]]; then
  echo "ERROR: PostgreSQL container not found."
  exit 1
fi

docker exec \
  "$POSTGRES_CONTAINER" \
  pg_dump \
  -U kurvenfunk \
  -d kurvenfunk \
  -Fc \
  > "$BACKUP_FILE"

if [[ ! -s "$BACKUP_FILE" ]]; then
  echo "ERROR: PostgreSQL backup is empty."
  rm -f "$BACKUP_FILE"
  exit 1
fi

chmod 640 "$BACKUP_FILE"

echo "Backup created:"
echo "$BACKUP_FILE"
du -h "$BACKUP_FILE"

echo
echo "=== Apply database migrations ==="
"${COMPOSE[@]}" \
  --profile deployment \
  run --rm migrate

echo
echo "=== Deploy PRODUCTION application ==="
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
echo "=== PRODUCTION Services ==="
"${COMPOSE[@]}" ps

echo
echo "=== Update successful release state ==="

mkdir -p "$RELEASE_DIR"
chmod 750 "$RELEASE_DIR"

OLD_CURRENT=""

if [[ -f "$CURRENT_RELEASE_FILE" ]]; then
  OLD_CURRENT="$(<"$CURRENT_RELEASE_FILE")"
fi

if [[ -n "$OLD_CURRENT" && "$OLD_CURRENT" != "$DEPLOYED_COMMIT" ]]; then
  printf '%s\n' "$OLD_CURRENT" > "$PREVIOUS_RELEASE_FILE"
  chmod 640 "$PREVIOUS_RELEASE_FILE"
fi

printf '%s\n' "$DEPLOYED_COMMIT" > "$CURRENT_RELEASE_FILE"
chmod 640 "$CURRENT_RELEASE_FILE"

echo "Current release:  $(<"$CURRENT_RELEASE_FILE")"

if [[ -f "$PREVIOUS_RELEASE_FILE" ]]; then
  echo "Previous release: $(<"$PREVIOUS_RELEASE_FILE")"
else
  echo "Previous release: <not set yet>"
fi

echo
echo "=== Deployment complete ==="
git log -1 --oneline
