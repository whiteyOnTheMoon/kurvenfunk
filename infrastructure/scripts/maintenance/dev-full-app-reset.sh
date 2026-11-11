#!/usr/bin/env bash
# DEV-only full application-data reset. Preserves schema, migrations and Keycloak realm.
set -Eeuo pipefail
set +x
umask 077

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested commit required}"
MODE="${DEV_FULL_RESET_MODE:-plan}"
[[ "${DEV_FULL_RESET_TARGET:-}" == DEV && ( "$MODE" == plan || "$MODE" == apply ) ]] || {
  echo "ERROR: DEV_ONLY_AND_EXPLICIT_MODE_REQUIRED"; exit 1;
}
if [[ "$MODE" == apply && "${DEV_FULL_RESET_CONFIRM:-}" != RESET_ALL_DEV_APPLICATION_DATA ]]; then
  echo "ERROR: EXPLICIT_DESTRUCTIVE_CONFIRMATION_REQUIRED"; exit 1
fi

cd "$PROJECT_DIR"
[[ -f .env.dev && "$(git branch --show-current)" == develop ]] || {
  echo "ERROR: DEV_DEVELOP_ONLY"; exit 1;
}
[[ -z "$(git status --porcelain)" && "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" ]] || {
  echo "ERROR: UNEXPECTED_DEV_CHECKOUT"; exit 1;
}
git fetch -q origin develop
[[ "$(git rev-parse origin/develop)" == "$EXPECTED_COMMIT" ]] || {
  echo "ERROR: STALE_DEVELOP_COMMIT"; exit 1;
}

exec 9>/tmp/kurvenfunk-dev-deploy.lock
flock -n 9 || { echo "ERROR: DEV_DEPLOY_LOCKED"; exit 1; }
exec 8>/tmp/kurvenfunk-dev-phase21-seed-cleanup.lock
flock -n 8 || { echo "ERROR: DEV_SPORT_CLEANUP_LOCKED"; exit 1; }
exec 7>/tmp/kurvenfunk-dev-phase0-21-synthetic-cleanup.lock
flock -n 7 || { echo "ERROR: DEV_SYNTHETIC_CLEANUP_LOCKED"; exit 1; }
exec 6>/tmp/kurvenfunk-dev-full-application-reset.lock
flock -n 6 || { echo "ERROR: DEV_RESET_LOCKED"; exit 1; }

compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
"${compose[@]}" config --quiet
app_db="$("${compose[@]}" exec -T postgres printenv POSTGRES_DB | tr -d '\r')"
kc_url="$("${compose[@]}" exec -T keycloak printenv KC_DB_URL | tr -d '\r')"
[[ "$app_db" =~ ^[A-Za-z0-9_]+$ && "$kc_url" =~ ^jdbc:postgresql://postgres:5432/([A-Za-z0-9_]+)$ ]] || {
  echo "ERROR: UNRECOGNIZED_DATABASE_NAMES"; exit 1;
}
keycloak_db="${BASH_REMATCH[1]}"
[[ "$app_db" != "$keycloak_db" ]] || {
  echo "ERROR: APPLICATION_AND_KEYCLOAK_DB_IDENTICAL"; exit 1;
}
"${compose[@]}" exec -T api node -e \
  'const u = new URL(process.env.DATABASE_URL); if (u.hostname !== "postgres" || u.pathname !== "/" + process.argv[1]) process.exit(1)' \
  "$app_db"

psql_app() {
  "${compose[@]}" exec -T postgres sh -ec \
    'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"' \
    sh "$@"
}
table_count="$(psql_app -At -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'" | tr -d '\r[:space:]')"
[[ "$table_count" =~ ^[0-9]+$ && "$table_count" -ge 20 ]] || {
  echo "ERROR: UNEXPECTED_APPLICATION_SCHEMA"; exit 1;
}
psql_app -At -c "SELECT to_regclass('public.\"User\"') IS NOT NULL AND to_regclass('public.\"Article\"') IS NOT NULL AND to_regclass('public.\"ImportJob\"') IS NOT NULL AND to_regclass('public.\"_prisma_migrations\"') IS NOT NULL" | grep -qx t || {
  echo "ERROR: MISSING_APPLICATION_TABLE"; exit 1;
}

echo "DEV_APP_RESET_PREFLIGHT=PASS; tables=$table_count; keycloak_database_separate=YES"
EXPECTED_COMMIT="$EXPECTED_COMMIT" bash infrastructure/scripts/verify/dev-phase0-21-data-audit.sh
if [[ "$MODE" == plan ]]; then
  echo "DEV_APP_RESET_MODE=PLAN_ONLY"; exit 0
fi
"${compose[@]}" exec -T worker printenv NEWS_IMPORT_SCHEDULER_ENABLED | tr -d '\r' | grep -qx false || {
  echo "ERROR: DEV_NEWS_SCHEDULER_MUST_BE_OFF"; exit 1
}

services_stopped=NO
backup_verified=NO
backup_dir=
on_exit() {
  local exit_code=$?
  trap - EXIT
  if [[ "$services_stopped" == YES ]]; then
    "${compose[@]}" start api worker >/dev/null || echo "ERROR: DEV_SERVICE_RESTART_NEEDS_ATTENTION"
  fi
  if [[ "$backup_verified" != YES && -n "$backup_dir" ]]; then
    rm -rf -- "$backup_dir"
  fi
  exit "$exit_code"
}
trap on_exit EXIT

services_stopped=YES
"${compose[@]}" stop api worker

backup_root="$HOME/.kurvenfunk-dev-backups/full-app-reset"
install -m 700 -d "$backup_root"
backup_dir="$(mktemp -d "$backup_root/run-XXXXXXXX")"
for role in application keycloak; do
  db="$app_db"
  [[ "$role" == keycloak ]] && db="$keycloak_db"
  file="$backup_dir/$role.dump"
  "${compose[@]}" exec -T postgres sh -ec \
    'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_dump -U "$POSTGRES_USER" -d "$1" --format=custom --no-owner --no-acl' \
    sh "$db" > "$file"
  [[ -s "$file" ]] || { echo "ERROR: EMPTY_PRIVATE_BACKUP"; exit 1; }
  "${compose[@]}" exec -T postgres pg_restore --list < "$file" >/dev/null
  "${compose[@]}" exec -T postgres pg_restore --file /dev/null < "$file" >/dev/null
  chmod 600 "$file"
  echo "DEV_APP_RESET_BACKUP_VERIFIED=$role; SHA256=$(sha256sum "$file" | cut -d ' ' -f 1)"
done
backup_verified=YES

echo "=== DEV application data transactional reset; preserve migrations ==="
psql_app -q < infrastructure/scripts/maintenance/dev-full-app-reset.sql

# Clear only the isolated DEV Redis database to avoid stale BullMQ replay.
"${compose[@]}" exec -T redis sh -ec \
  'REDISCLI_AUTH="$REDIS_PASSWORD" exec redis-cli FLUSHDB SYNC' | grep -qx OK
"${compose[@]}" exec -T redis sh -ec \
  'REDISCLI_AUTH="$REDIS_PASSWORD" exec redis-cli DBSIZE' | tr -d '\r' | grep -qx 0

# Re-enable normal DEV reads; the DEV news scheduler stays disabled.
"${compose[@]}" start api worker
services_stopped=NO
EXPECTED_COMMIT="$EXPECTED_COMMIT" bash infrastructure/scripts/verify/dev-phase0-21-data-audit.sh

echo "DEV_APP_RESET_RESULT=APPLICATION_TABLES_EMPTY_AND_REDIS_CLEARED"
echo "DEV_APP_RESET_SCOPE=DEV_ONLY; keycloak=UNCHANGED; migrations=PRESERVED"
echo "DEV_APP_RESET_BACKUPS=PRIVATE_AND_RETAINED"
