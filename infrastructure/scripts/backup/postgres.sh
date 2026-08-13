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
    BACKUP_ROOT="/srv/kurvenfunk/staging/backups/postgres"
    ;;
  production)
    COMPOSE_PROJECT="kurvenfunk-prod"
    BACKUP_ROOT="/srv/kurvenfunk/prod/backups/postgres"
    ;;
  *)
    usage
    ;;
esac

POSTGRES_CONTAINER="${COMPOSE_PROJECT}-postgres-1"
BACKUP_TIMEZONE="${BACKUP_TIMEZONE:-Europe/Vienna}"
BACKUP_TIMEZONE="${BACKUP_TIMEZONE:-Europe/Vienna}"

if ! docker inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1; then
  echo "ERROR: PostgreSQL container not found: $POSTGRES_CONTAINER" >&2
  exit 1
fi

if [[ "$(docker inspect -f '{{.State.Running}}' "$POSTGRES_CONTAINER")" != "true" ]]; then
  echo "ERROR: PostgreSQL container is not running: $POSTGRES_CONTAINER" >&2
  exit 1
fi

TIMESTAMP="$(TZ="$BACKUP_TIMEZONE" date '+%Y%m%d-%H%M%S')"
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
TMP_DIR="${BACKUP_DIR}.tmp"

cleanup() {
  if [[ -d "$TMP_DIR" ]]; then
    rm -rf "$TMP_DIR"
  fi
}

trap cleanup ERR INT TERM

mkdir -p "$BACKUP_ROOT"
chmod 750 "$BACKUP_ROOT"

mkdir -p "$TMP_DIR"
chmod 700 "$TMP_DIR"

echo "=== PostgreSQL Backup ==="
echo "Environment: $ENVIRONMENT"
echo "Container:   $POSTGRES_CONTAINER"
echo "Target:      $BACKUP_DIR"
echo

echo "Backing up database: kurvenfunk"
docker exec "$POSTGRES_CONTAINER" \
  sh -c 'exec pg_dump -U "$POSTGRES_USER" -Fc --no-owner --no-acl kurvenfunk' \
  > "${TMP_DIR}/kurvenfunk.dump"

echo "Backing up database: keycloak"
docker exec "$POSTGRES_CONTAINER" \
  sh -c 'exec pg_dump -U "$POSTGRES_USER" -Fc --no-owner --no-acl keycloak' \
  > "${TMP_DIR}/keycloak.dump"

echo "Backing up PostgreSQL globals"
docker exec "$POSTGRES_CONTAINER" \
  sh -c 'exec pg_dumpall -U "$POSTGRES_USER" --globals-only --no-role-passwords' \
  > "${TMP_DIR}/globals.sql"

chmod 600 \
  "${TMP_DIR}/kurvenfunk.dump" \
  "${TMP_DIR}/keycloak.dump" \
  "${TMP_DIR}/globals.sql"

echo "Validating dumps"
docker exec -i "$POSTGRES_CONTAINER" \
  pg_restore --list < "${TMP_DIR}/kurvenfunk.dump" >/dev/null

docker exec -i "$POSTGRES_CONTAINER" \
  pg_restore --list < "${TMP_DIR}/keycloak.dump" >/dev/null

test -s "${TMP_DIR}/globals.sql"

cat > "${TMP_DIR}/metadata.txt" <<META
environment=${ENVIRONMENT}
created_at=$(TZ="$BACKUP_TIMEZONE" date --iso-8601=seconds)
timezone=${BACKUP_TIMEZONE}
postgres_container=${POSTGRES_CONTAINER}
postgres_image=$(docker inspect -f '{{.Config.Image}}' "$POSTGRES_CONTAINER")
format=postgresql-custom
databases=kurvenfunk,keycloak
globals=true
META

chmod 600 "${TMP_DIR}/metadata.txt"

mv "$TMP_DIR" "$BACKUP_DIR"
trap - ERR INT TERM

echo
echo "=== Backup completed ==="

find "$BACKUP_DIR" \
  -maxdepth 1 \
  -type f \
  -printf '%f\t%k KB\n' \
  | sort
