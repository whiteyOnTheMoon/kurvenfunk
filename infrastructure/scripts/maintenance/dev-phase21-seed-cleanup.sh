#!/usr/bin/env bash
# DEV-only guarded cleanup. Preserves a private, verified app DB backup.
set -Eeuo pipefail
set +x
umask 077

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?EXPECTED_COMMIT is required}"
MODE="${PHASE21_CLEANUP_MODE:-plan}"

if [[ "$MODE" != plan && "$MODE" != apply ]]; then
  echo "ERROR: only plan/apply permitted"
  exit 1
fi
cd "$PROJECT_DIR"
if [[ ! -f .env.dev || "$(git branch --show-current)" != develop ]]; then
  echo "ERROR: DEV-only checked-out develop branch required"
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: DEV working tree not clean"
  exit 1
fi
if [[ "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: DEV checkout not at tested commit"
  exit 1
fi
git fetch -q origin develop
if [[ "$(git rev-parse origin/develop)" != "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: develop advanced; refusing stale cleanup"
  exit 1
fi

# No simultaneous deploy, second cleanup, or write job may be running.
exec 8>/tmp/kurvenfunk-dev-deploy.lock
flock -n 8 || { echo "ERROR: DEV deployment is in progress"; exit 1; }
exec 9>/tmp/kurvenfunk-dev-phase21-seed-cleanup.lock
flock -n 9 || { echo "ERROR: DEV cleanup already in progress"; exit 1; }

compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
"${compose[@]}" config --quiet
for key in SPORTS_FAKE_PROVIDER_ENABLED SPORTS_IMPORT_SCHEDULER_ENABLED SPORTS_IMPORT_LIVE_ENABLED; do
  if ! "${compose[@]}" exec -T worker printenv "$key" | tr -d '\r' | grep -qx false; then
    echo "ERROR: synthetic producer switch not OFF: $key"
    exit 1
  fi
done

run_cleanup() {
  local action="$1"
  local backup_verified="$2"
  "${compose[@]}" exec -T \
    -e "PHASE21_CLEANUP_TARGET=DEV" \
    -e "PHASE21_CLEANUP_MODE=$action" \
    -e "PHASE21_VERIFIED_BACKUP=$backup_verified" \
    worker node --input-type=module \
    < infrastructure/scripts/maintenance/dev-phase21-seed-cleanup.mjs
}

echo "=== DEV phase21 cleanup preflight (read-only) ==="
run_cleanup plan NO
if [[ "$MODE" == plan ]]; then
  echo "DEV PHASE21 CLEANUP: PLAN ONLY; nothing deleted"
  exit 0
fi

BACKUP_DIR="$HOME/.kurvenfunk-dev-backups/phase21"
install -m 700 -d "$BACKUP_DIR"
BACKUP_FILE="$(mktemp "$BACKUP_DIR/sports-cleanup-XXXXXXXX.dump")"
backup_ok=false
cleanup_failed_backup() {
  if [[ "$backup_ok" != true ]]; then
    rm -f -- "$BACKUP_FILE"
  fi
}
trap cleanup_failed_backup EXIT

echo "=== Backup DEV application PostgreSQL before all data changes ==="
"${compose[@]}" exec -T postgres sh -ec \
  'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl' \
  > "$BACKUP_FILE"
test -s "$BACKUP_FILE"
"${compose[@]}" exec -T postgres pg_restore --list < "$BACKUP_FILE" >/dev/null
"${compose[@]}" exec -T postgres pg_restore --file /dev/null < "$BACKUP_FILE" >/dev/null
chmod 600 "$BACKUP_FILE"
backup_ok=true
echo "Backup created and archive completely read-verified (pg_restore)."
echo "Backup checksum SHA256: $(sha256sum "$BACKUP_FILE" | cut -d ' ' -f 1)"
echo "Backup retained privately on DEV host; do not upload it to GitHub."

echo "=== Apply strict fingerprint cleanup inside serializable transaction ==="
run_cleanup apply YES
echo "=== Post-cleanup read-only inventory ==="
EXPECTED_COMMIT="$EXPECTED_COMMIT" bash infrastructure/scripts/verify/dev-phase21-seed-audit.sh
echo "DEV PHASE21 CLEANUP: COMPLETED. Backup retained for restoration."
