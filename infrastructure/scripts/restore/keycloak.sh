#!/usr/bin/env bash

set -Eeuo pipefail

usage() {
  cat <<USAGE
Usage:
  $0 <staging|production> <backup-directory> --confirm

Example:
  $0 staging /srv/kurvenfunk/staging/backups/keycloak/20260814-001023 --confirm

WARNING:
  This imports the Keycloak realm from the selected backup and overrides
  an existing realm with the same name.
USAGE
  exit 1
}

if [[ $# -ne 3 ]]; then
  usage
fi

ENVIRONMENT="$1"
BACKUP_DIR="${2%/}"
CONFIRM="$3"

if [[ "$CONFIRM" != "--confirm" ]]; then
  echo "ERROR: Restore requires explicit --confirm." >&2
  exit 1
fi

case "$ENVIRONMENT" in
  staging)
    COMPOSE_PROJECT="kurvenfunk-staging"
    REPOSITORY="/home/ap/www/kurvenfunk-staging"
    ENV_FILE=".env.staging"
    COMPOSE_OVERRIDE="compose.staging.yml"
    EXPECTED_BACKUP_ROOT="/srv/kurvenfunk/staging/backups/keycloak"
    ;;
  production)
    COMPOSE_PROJECT="kurvenfunk-prod"
    REPOSITORY="/home/ap/www/kurvenfunk-production"
    ENV_FILE=".env.prod"
    COMPOSE_OVERRIDE="compose.prod.yml"
    EXPECTED_BACKUP_ROOT="/srv/kurvenfunk/prod/backups/keycloak"
    ;;
  *)
    usage
    ;;
esac

KEYCLOAK_CONTAINER="${COMPOSE_PROJECT}-keycloak-1"
METADATA="${BACKUP_DIR}/metadata.txt"

compose() {
  docker compose \
    -p "$COMPOSE_PROJECT" \
    --env-file "${REPOSITORY}/${ENV_FILE}" \
    -f "${REPOSITORY}/compose.yml" \
    -f "${REPOSITORY}/${COMPOSE_OVERRIDE}" \
    "$@"
}

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

[[ -d "$REPOSITORY" ]] ||
  fail "Repository does not exist: $REPOSITORY"

[[ -f "${REPOSITORY}/${ENV_FILE}" ]] ||
  fail "Environment file not found: ${REPOSITORY}/${ENV_FILE}"

[[ -f "${REPOSITORY}/compose.yml" ]] ||
  fail "Compose file not found: ${REPOSITORY}/compose.yml"

[[ -f "${REPOSITORY}/${COMPOSE_OVERRIDE}" ]] ||
  fail "Compose override not found: ${REPOSITORY}/${COMPOSE_OVERRIDE}"

[[ -d "$BACKUP_DIR" ]] ||
  fail "Backup directory does not exist: $BACKUP_DIR"

RESOLVED_BACKUP_DIR="$(realpath "$BACKUP_DIR")"
RESOLVED_BACKUP_ROOT="$(realpath "$EXPECTED_BACKUP_ROOT")"

case "$RESOLVED_BACKUP_DIR" in
  "${RESOLVED_BACKUP_ROOT}/"*)
    ;;
  *)
    fail "Backup is outside expected ${ENVIRONMENT} backup root: $BACKUP_DIR"
    ;;
esac

BACKUP_DIR="$RESOLVED_BACKUP_DIR"

[[ -s "$METADATA" ]] ||
  fail "Backup metadata not found or empty: $METADATA"

BACKUP_ENVIRONMENT="$(
  sed -n 's/^environment=//p' "$METADATA" | head -n 1
)"

BACKUP_FORMAT="$(
  sed -n 's/^format=//p' "$METADATA" | head -n 1
)"

REALM="$(
  sed -n 's/^realm=//p' "$METADATA" | head -n 1
)"

[[ "$BACKUP_ENVIRONMENT" == "$ENVIRONMENT" ]] ||
  fail "Backup environment '${BACKUP_ENVIRONMENT}' does not match target '${ENVIRONMENT}'."

[[ "$BACKUP_FORMAT" == "keycloak-directory-export" ]] ||
  fail "Unsupported backup format: $BACKUP_FORMAT"

[[ -n "$REALM" ]] ||
  fail "Realm is missing from backup metadata."

REALM_FILE="${BACKUP_DIR}/${REALM}-realm.json"

[[ -s "$REALM_FILE" ]] ||
  fail "Realm export not found or empty: $REALM_FILE"

echo "Validating JSON files"

JSON_COUNT=0

while IFS= read -r file; do
  python3 -m json.tool "$file" >/dev/null
  ((JSON_COUNT += 1))
done < <(
  find "$BACKUP_DIR" \
    -maxdepth 1 \
    -type f \
    -name '*.json' \
    -print
)

(( JSON_COUNT > 0 )) ||
  fail "No JSON files found in backup."

docker inspect "$KEYCLOAK_CONTAINER" >/dev/null 2>&1 ||
  fail "Keycloak container not found: $KEYCLOAK_CONTAINER"

[[ "$(docker inspect -f '{{.State.Running}}' "$KEYCLOAK_CONTAINER")" == "true" ]] ||
  fail "Keycloak is not currently running: $KEYCLOAK_CONTAINER"

echo
echo "=== Keycloak Restore ==="
echo "Environment: $ENVIRONMENT"
echo "Realm:       $REALM"
echo "Container:   $KEYCLOAK_CONTAINER"
echo "Backup:      $BACKUP_DIR"
echo
echo "WARNING: Existing realm data for '$REALM' may be replaced."
echo

KEYCLOAK_STOPPED=false
RESTORE_SUCCESS=false

cleanup() {
  local exit_code=$?

  if [[ "$KEYCLOAK_STOPPED" == "true" ]]; then
    echo
    echo "Ensuring Keycloak is running"

    compose start keycloak >/dev/null 2>&1 || {
      echo "ERROR: Failed to restart Keycloak." >&2
    }
  fi

  exit "$exit_code"
}

trap cleanup EXIT INT TERM

echo "Stopping Keycloak"
compose stop keycloak
KEYCLOAK_STOPPED=true

echo
echo "Importing realm"

compose run \
  --rm \
  --no-deps \
  -v "${BACKUP_DIR}:/opt/keycloak/data/import:ro" \
  keycloak \
  import \
  --dir /opt/keycloak/data/import \
  --override true

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

[[ "$STATUS" == "healthy" ]] ||
  fail "Keycloak did not become healthy after restore. Status: $STATUS"

RESTORE_SUCCESS=true
KEYCLOAK_STOPPED=false
trap - EXIT INT TERM

echo
echo "=== Restore completed ==="
echo "Environment: $ENVIRONMENT"
echo "Realm:       $REALM"
echo "Backup:      $BACKUP_DIR"
