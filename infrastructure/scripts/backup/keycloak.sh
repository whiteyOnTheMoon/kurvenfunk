#!/usr/bin/env bash

set -Eeuo pipefail

usage() {
  echo "Usage: $0 <staging|production>"
  exit 1
}

if [[ $# -ne 1 ]]; then
  usage
fi

ENVIRONMENT="$1"

case "$ENVIRONMENT" in
  staging)
    COMPOSE_PROJECT="kurvenfunk-staging"
    REPOSITORY="/home/ap/www/kurvenfunk-staging"
    ENV_FILE=".env.staging"
    COMPOSE_OVERRIDE="compose.staging.yml"
    BACKUP_ROOT="/srv/kurvenfunk/staging/backups/keycloak"
    ;;
  production)
    COMPOSE_PROJECT="kurvenfunk-prod"
    REPOSITORY="/home/ap/www/kurvenfunk-production"
    ENV_FILE=".env.prod"
    COMPOSE_OVERRIDE="compose.prod.yml"
    BACKUP_ROOT="/srv/kurvenfunk/prod/backups/keycloak"
    ;;
  *)
    usage
    ;;
esac

REALM="${KEYCLOAK_BACKUP_REALM:-kurvenfunk}"
BACKUP_TIMEZONE="${BACKUP_TIMEZONE:-Europe/Vienna}"
KEYCLOAK_CONTAINER="${COMPOSE_PROJECT}-keycloak-1"

TIMESTAMP="$(TZ="$BACKUP_TIMEZONE" date '+%Y%m%d-%H%M%S')"
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
TMP_DIR="${BACKUP_DIR}.tmp"

KEYCLOAK_WAS_RUNNING=false
BACKUP_COMPLETED=false

compose() {
  docker compose \
    -p "$COMPOSE_PROJECT" \
    --env-file "${REPOSITORY}/${ENV_FILE}" \
    -f "${REPOSITORY}/compose.yml" \
    -f "${REPOSITORY}/${COMPOSE_OVERRIDE}" \
    "$@"
}

cleanup() {
  local exit_code=$?

  if [[ "$KEYCLOAK_WAS_RUNNING" == "true" ]]; then
    echo
    echo "Ensuring Keycloak is running"

    compose start keycloak >/dev/null 2>&1 || {
      echo "ERROR: Failed to restart Keycloak." >&2
    }
  fi

  if [[ "$BACKUP_COMPLETED" != "true" && -d "$TMP_DIR" ]]; then
    rm -rf "$TMP_DIR"
  fi

  exit "$exit_code"
}

trap cleanup EXIT INT TERM

if [[ ! -d "$REPOSITORY" ]]; then
  echo "ERROR: Repository does not exist: $REPOSITORY" >&2
  exit 1
fi

if [[ ! -f "${REPOSITORY}/${ENV_FILE}" ]]; then
  echo "ERROR: Environment file not found: ${REPOSITORY}/${ENV_FILE}" >&2
  exit 1
fi

if [[ ! -f "${REPOSITORY}/compose.yml" ]]; then
  echo "ERROR: Compose file not found: ${REPOSITORY}/compose.yml" >&2
  exit 1
fi

if [[ ! -f "${REPOSITORY}/${COMPOSE_OVERRIDE}" ]]; then
  echo "ERROR: Compose override not found: ${REPOSITORY}/${COMPOSE_OVERRIDE}" >&2
  exit 1
fi

if ! docker inspect "$KEYCLOAK_CONTAINER" >/dev/null 2>&1; then
  echo "ERROR: Keycloak container not found: $KEYCLOAK_CONTAINER" >&2
  exit 1
fi

if [[ "$(docker inspect -f '{{.State.Running}}' "$KEYCLOAK_CONTAINER")" == "true" ]]; then
  KEYCLOAK_WAS_RUNNING=true
fi

if [[ "$KEYCLOAK_WAS_RUNNING" != "true" ]]; then
  echo "ERROR: Keycloak is not currently running: $KEYCLOAK_CONTAINER" >&2
  exit 1
fi

mkdir -p "$BACKUP_ROOT"
chmod 750 "$BACKUP_ROOT"

mkdir -p "$TMP_DIR"
chmod 700 "$TMP_DIR"

echo "=== Keycloak Backup ==="
echo "Environment: $ENVIRONMENT"
echo "Realm:       $REALM"
echo "Container:   $KEYCLOAK_CONTAINER"
echo "Target:      $BACKUP_DIR"
echo

echo "Stopping Keycloak"
compose stop keycloak

echo
echo "Exporting realm"
compose run \
  --rm \
  --no-deps \
  -v "${TMP_DIR}:/opt/keycloak/data/export" \
  keycloak \
  export \
  --realm "$REALM" \
  --dir /opt/keycloak/data/export \
  --users different_files

REALM_FILE="${TMP_DIR}/${REALM}-realm.json"

if [[ ! -s "$REALM_FILE" ]]; then
  echo "ERROR: Realm export not found or empty: $REALM_FILE" >&2
  exit 1
fi

echo
echo "Validating JSON"

while IFS= read -r file; do
  python3 -m json.tool "$file" >/dev/null
done < <(
  find "$TMP_DIR" \
    -maxdepth 1 \
    -type f \
    -name '*.json' \
    -print
)

find "$TMP_DIR" \
  -maxdepth 1 \
  -type f \
  -name '*.json' \
  -exec chmod 600 {} +

cat > "${TMP_DIR}/metadata.txt" <<META
environment=${ENVIRONMENT}
created_at=$(TZ="$BACKUP_TIMEZONE" date --iso-8601=seconds)
timezone=${BACKUP_TIMEZONE}
realm=${REALM}
keycloak_container=${KEYCLOAK_CONTAINER}
keycloak_image=$(docker inspect -f '{{.Config.Image}}' "$KEYCLOAK_CONTAINER")
format=keycloak-directory-export
users=different_files
META

chmod 600 "${TMP_DIR}/metadata.txt"

mv "$TMP_DIR" "$BACKUP_DIR"
BACKUP_COMPLETED=true

echo
echo "Starting Keycloak"
compose start keycloak

echo
echo "Waiting for Keycloak health"

for _ in $(seq 1 60); do
  STATUS="$(
    docker inspect \
      -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
      "$KEYCLOAK_CONTAINER" 2>/dev/null || true
  )"

  if [[ "$STATUS" == "healthy" ]]; then
    break
  fi

  sleep 2
done

STATUS="$(
  docker inspect \
    -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
    "$KEYCLOAK_CONTAINER" 2>/dev/null || true
)"

if [[ "$STATUS" != "healthy" ]]; then
  echo "ERROR: Keycloak did not become healthy after backup. Status: $STATUS" >&2
  exit 1
fi

KEYCLOAK_WAS_RUNNING=false

echo
echo "=== Backup completed ==="

find "$BACKUP_DIR" \
  -maxdepth 1 \
  -type f \
  -printf '%f\t%k KB\n' \
  | sort
