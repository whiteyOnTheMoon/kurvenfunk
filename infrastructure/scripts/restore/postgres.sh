#!/usr/bin/env bash

set -Eeuo pipefail

usage() {
  cat <<USAGE
Usage:
  $0 <staging|production> <backup-directory> --confirm

Example:
  $0 staging /srv/kurvenfunk/staging/backups/postgres/20260813-235755 --confirm

WARNING:
  This replaces the kurvenfunk and keycloak databases of the selected
  environment with the contents of the specified backup.
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
    EXPECTED_BACKUP_ROOT="/srv/kurvenfunk/staging/backups/postgres"
    ;;
  production)
    COMPOSE_PROJECT="kurvenfunk-prod"
    REPOSITORY="/home/ap/www/kurvenfunk-production"
    ENV_FILE=".env.prod"
    COMPOSE_OVERRIDE="compose.prod.yml"
    EXPECTED_BACKUP_ROOT="/srv/kurvenfunk/prod/backups/postgres"
    ;;
  *)
    usage
    ;;
esac

POSTGRES_CONTAINER="${COMPOSE_PROJECT}-postgres-1"
METADATA="${BACKUP_DIR}/metadata.txt"
KURVENFUNK_DUMP="${BACKUP_DIR}/kurvenfunk.dump"
KEYCLOAK_DUMP="${BACKUP_DIR}/keycloak.dump"

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

[[ -s "$KURVENFUNK_DUMP" ]] ||
  fail "Kurvenfunk dump not found or empty: $KURVENFUNK_DUMP"

[[ -s "$KEYCLOAK_DUMP" ]] ||
  fail "Keycloak dump not found or empty: $KEYCLOAK_DUMP"

BACKUP_ENVIRONMENT="$(
  sed -n 's/^environment=//p' "$METADATA" | head -n 1
)"

BACKUP_FORMAT="$(
  sed -n 's/^format=//p' "$METADATA" | head -n 1
)"

[[ "$BACKUP_ENVIRONMENT" == "$ENVIRONMENT" ]] ||
  fail "Backup environment '${BACKUP_ENVIRONMENT}' does not match target '${ENVIRONMENT}'."

[[ "$BACKUP_FORMAT" == "postgresql-custom" ]] ||
  fail "Unsupported backup format: $BACKUP_FORMAT"

docker inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1 ||
  fail "PostgreSQL container not found: $POSTGRES_CONTAINER"

[[ "$(docker inspect -f '{{.State.Running}}' "$POSTGRES_CONTAINER")" == "true" ]] ||
  fail "PostgreSQL container is not running: $POSTGRES_CONTAINER"

echo "Validating backup dumps"

docker exec -i "$POSTGRES_CONTAINER" \
  pg_restore --list < "$KURVENFUNK_DUMP" >/dev/null

docker exec -i "$POSTGRES_CONTAINER" \
  pg_restore --list < "$KEYCLOAK_DUMP" >/dev/null

echo
echo "=== PostgreSQL Restore ==="
echo "Environment: $ENVIRONMENT"
echo "Container:   $POSTGRES_CONTAINER"
echo "Backup:      $BACKUP_DIR"
echo
echo "WARNING: Existing kurvenfunk and keycloak database contents will be replaced."
echo

echo "Stopping application services"
compose stop web api worker keycloak

restore_database() {
  local database="$1"
  local dump_file="$2"

  echo
  echo "Restoring database: $database"

  docker exec -i "$POSTGRES_CONTAINER" \
    sh -c 'exec psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres' <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${database}'
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS "${database}";
CREATE DATABASE "${database}";
SQL

  docker exec -i "$POSTGRES_CONTAINER" \
    sh -c "exec pg_restore \
      -v \
      --exit-on-error \
      --no-owner \
      --no-acl \
      -U \"\$POSTGRES_USER\" \
      -d \"$database\"" \
    < "$dump_file"
}

RESTORE_SUCCESS=false

cleanup() {
  local exit_code=$?

  if [[ "$RESTORE_SUCCESS" != "true" ]]; then
    echo
    echo "Restore did not complete successfully." >&2
    echo "Attempting to start stopped services." >&2

    compose start keycloak api worker web >/dev/null 2>&1 || true
  fi

  exit "$exit_code"
}

trap cleanup EXIT INT TERM

restore_database "kurvenfunk" "$KURVENFUNK_DUMP"
restore_database "keycloak" "$KEYCLOAK_DUMP"

echo
echo "Starting application services"
compose start keycloak api worker web

echo
echo "Waiting for Keycloak health"

for _ in $(seq 1 60); do
  STATUS="$(
    docker inspect \
      -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
      "${COMPOSE_PROJECT}-keycloak-1" 2>/dev/null || true
  )"

  if [[ "$STATUS" == "healthy" ]]; then
    break
  fi

  sleep 2
done

STATUS="$(
  docker inspect \
    -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
    "${COMPOSE_PROJECT}-keycloak-1" 2>/dev/null || true
)"

[[ "$STATUS" == "healthy" ]] ||
  fail "Keycloak did not become healthy after restore. Status: $STATUS"

RESTORE_SUCCESS=true
trap - EXIT INT TERM

echo
echo "=== Restore completed ==="
echo "Environment: $ENVIRONMENT"
echo "Backup:      $BACKUP_DIR"
