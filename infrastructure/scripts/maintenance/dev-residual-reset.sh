#!/usr/bin/env bash
# Destructive DEV-only app + sidecar reset. Requires explicit post-CI apply gate.
# Preserve Keycloak realms/admin/service users, Prisma history, bucket and search settings.
set -Eeuo pipefail
set +x
umask 077

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact CI-tested develop SHA is required}"
MODE="${DEV_RESIDUAL_RESET_MODE:-plan}"
[[ "${DEV_RESIDUAL_RESET_TARGET:-}" == DEV && ( "$MODE" == plan || "$MODE" == apply ) ]] || {
  echo 'ERROR: DEV_RESIDUAL_ONLY'; exit 1;
}
if [[ "$MODE" == apply && "${DEV_RESIDUAL_RESET_CONFIRM:-}" != CLEAR_DEV_ONLY_RESIDUAL_DATA ]]; then
  echo 'ERROR: EXPLICIT_DEV_RESET_AUTHORIZATION_REQUIRED'; exit 1;
fi
cd "$PROJECT_DIR"
[[ -f .env.dev && ! -L .env.dev && "$(git branch --show-current)" == develop ]] || {
  echo 'ERROR: DEV_CHECKOUT_REQUIRED'; exit 1;
}
[[ -z "$(git status --porcelain)" && "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" ]] || {
  echo 'ERROR: DEV_CHECKOUT_NOT_EXACT_HEAD'; exit 1;
}
git fetch -q origin develop
[[ "$(git rev-parse origin/develop)" == "$EXPECTED_COMMIT" ]] || {
  echo 'ERROR: REMOTE_DEVELOP_MOVED'; exit 1;
}

# Mutual exclusion with DEV deployments and all prior destructive workflows.
exec 9>/tmp/kurvenfunk-dev-deploy.lock
flock -n 9 || { echo 'ERROR: DEV_DEPLOY_LOCKED'; exit 1; }
exec 8>/tmp/kurvenfunk-dev-full-application-reset.lock
flock -n 8 || { echo 'ERROR: DEV_APP_RESET_LOCKED'; exit 1; }
exec 7>/tmp/kurvenfunk-dev-phase0-21-synthetic-cleanup.lock
flock -n 7 || { echo 'ERROR: DEV_SYNTHETIC_CLEANUP_LOCKED'; exit 1; }
exec 6>/tmp/kurvenfunk-dev-residual-reset.lock
flock -n 6 || { echo 'ERROR: DEV_RESIDUAL_RESET_LOCKED'; exit 1; }

compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
"${compose[@]}" config --quiet
for service in postgres keycloak api worker redis minio meilisearch mailpit; do
  [[ -n "$("${compose[@]}" ps -q "$service")" ]] || {
    echo "ERROR: DEV_SERVICE_NOT_RUNNING=$service"; exit 1;
  }
done

# Ensure the application and identity databases are separate and the target is DEV.
app_db="$("${compose[@]}" exec -T postgres printenv POSTGRES_DB | tr -d '\r')"
kc_url="$("${compose[@]}" exec -T keycloak printenv KC_DB_URL | tr -d '\r')"
[[ "$app_db" =~ ^[A-Za-z0-9_]+$ && "$kc_url" =~ ^jdbc:postgresql://postgres:5432/([A-Za-z0-9_]+)$ ]] || {
  echo 'ERROR: INVALID_DEV_DATABASE_NAMES'; exit 1;
}
kc_db="${BASH_REMATCH[1]}"
[[ "$app_db" != "$kc_db" ]] || { echo 'ERROR: KEYCLOAK_DB_MUST_BE_SEPARATE'; exit 1; }
"${compose[@]}" exec -T api node -e \
  'const u=new URL(process.env.DATABASE_URL);if(u.hostname!=="postgres"||u.pathname!=="/"+process.argv[1])process.exit(1)' "$app_db"

app_bucket="$("${compose[@]}" exec -T api printenv STORAGE_BUCKET | tr -d '\r')"
minio_bucket="$("${compose[@]}" exec -T minio printenv MINIO_BUCKET | tr -d '\r')"
[[ -n "$app_bucket" && "$app_bucket" == "$minio_bucket" ]] || {
  echo 'ERROR: DEV_MINIO_BUCKET_MISMATCH'; exit 1;
}
for key in NEWS_IMPORT_SCHEDULER_ENABLED SPORTS_FAKE_PROVIDER_ENABLED SPORTS_IMPORT_SCHEDULER_ENABLED SPORTS_IMPORT_LIVE_ENABLED; do
  state="$("${compose[@]}" exec -T worker printenv "$key" | tr -d '\r')"
  [[ "$state" == false ]] || { echo "ERROR: DEV_IMPORT_NOT_DISABLED=$key"; exit 1; }
done

psql_app() {
  "${compose[@]}" exec -T postgres sh -ec \
    'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"' sh "$@"
}
psql_kc() {
  "${compose[@]}" exec -T postgres sh -ec \
    'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$1" "$@"' \
    sh "$kc_db" "${@}"
}
app_tables="$(psql_app -At -c "SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'" | tr -d '\r[:space:]')"
[[ "$app_tables" =~ ^[0-9]+$ && "$app_tables" -ge 20 ]] || {
  echo 'ERROR: DEV_APP_SCHEMA_UNEXPECTED'; exit 1;
}
psql_app -At -c "SELECT to_regclass('public.\\\"_prisma_migrations\\\"') IS NOT NULL" | grep -qx t || {
  echo 'ERROR: PRISMA_HISTORY_MISSING'; exit 1;
}
master_users_before="$(psql_kc -At -c "SELECT count(*) FROM user_entity u JOIN realm r ON r.id=u.realm_id WHERE r.name='master'" | tr -d '\r[:space:]')"
[[ "$master_users_before" =~ ^[0-9]+$ && "$master_users_before" -ge 1 ]] || {
  echo 'ERROR: KEYCLOAK_MASTER_ADMIN_MISSING'; exit 1;
}

# Refuse to touch any location other than these exact, bound DEV volumes.
for mapping in 'redis:/data' 'minio:/data' 'meilisearch:/meili_data' 'mailpit:/data'; do
  service="${mapping%%:*}"
  target="${mapping#*:}"
  source="/srv/kurvenfunk/dev/$service"
  [[ -d "$source" && ! -L "$source" ]] || { echo "ERROR: DEV_VOLUME_MISSING=$service"; exit 1; }
  cid="$("${compose[@]}" ps -q "$service")"
  python3 - "$cid" "$source" "$target" <<'PY'
import json,os,subprocess,sys
container, source, destination=sys.argv[1:]
mounts=json.loads(subprocess.check_output(
    ['docker','inspect','--format','{{json .Mounts}}',container], timeout=15))
matched=[x for x in mounts if x.get('Destination')==destination]
if len(matched)!=1 or os.path.realpath(matched[0].get('Source',''))!=source:
    raise SystemExit('ERROR: DOCKER_VOLUME_IS_NOT_EXACT_DEV_PATH')
PY
done
echo "DEV_RESIDUAL_PREFLIGHT=PASS; app_tables=$app_tables; protected_master_users=$master_users_before"
echo "DEV_RESIDUAL_SCHEDULERS=OFF"
if [[ "$MODE" == plan ]]; then
  echo 'DEV_RESIDUAL_RESULT=PLAN_ONLY_NO_MUTATION'
  exit 0
fi

# Keep private, verified dumps and complete consistent copies of all affected volumes.
# Do not upload the backups, PII or secrets to Actions artifacts.
backup_root="$HOME/.kurvenfunk-dev-backups/residual-reset"
install -d -m 700 "$backup_root"
backup_dir="$(mktemp -d "$backup_root/run-XXXXXXXX")"
chmod 700 "$backup_dir"
backup_verified=NO
services_stopped=NO
on_exit() {
  result=$?
  trap - EXIT
  if [[ "$services_stopped" == YES ]]; then
    "${compose[@]}" start redis keycloak minio meilisearch mailpit api worker >/dev/null || {
      echo 'ERROR: DEV_SERVICES_RESTART_NEEDS_ATTENTION'
    }
  fi
  if [[ "$backup_verified" != YES ]]; then
    echo 'ERROR: PRIVATE_BACKUP_NOT_VERIFIED'
  fi
  exit "$result"
}
trap on_exit EXIT

services_stopped=YES
"${compose[@]}" stop api worker keycloak redis minio meilisearch mailpit
for db_role in application keycloak; do
  db="$app_db"
  [[ "$db_role" == keycloak ]] && db="$kc_db"
  file="$backup_dir/$db_role.dump"
  "${compose[@]}" exec -T postgres sh -ec \
    'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_dump -U "$POSTGRES_USER" -d "$1" --format=custom --no-owner --no-acl' \
    sh "$db" > "$file"
  [[ -s "$file" ]] || { echo 'ERROR: EMPTY_POSTGRES_BACKUP'; exit 1; }
  "${compose[@]}" exec -T postgres pg_restore --list < "$file" >/dev/null
  "${compose[@]}" exec -T postgres pg_restore --file /dev/null < "$file" >/dev/null
  chmod 600 "$file"
  echo "DEV_RESIDUAL_BACKUP_VERIFIED=$db_role; SHA256=$(sha256sum "$file" | cut -d ' ' -f 1)"
done
for volume in redis minio meilisearch mailpit; do
  source="/srv/kurvenfunk/dev/$volume"
  # The existing postgres Alpine image contains tar; no new image download needed.
  docker run --rm --network none \
    -v "$source:/source:ro" -v "$backup_dir:/backup:rw" \
    --entrypoint sh postgres:17-alpine -ec '
      tar -czf "/backup/$1.tar.gz" -C /source .
      chmod 600 "/backup/$1.tar.gz"
      chown "$2:$3" "/backup/$1.tar.gz"
    ' sh "$volume" "$(id -u)" "$(id -g)"
  gzip -t "$backup_dir/$volume.tar.gz"
  tar -tzf "$backup_dir/$volume.tar.gz" >/dev/null
  echo "DEV_RESIDUAL_BACKUP_VERIFIED=$volume; SHA256=$(sha256sum "$backup_dir/$volume.tar.gz" | cut -d ' ' -f 1)"
done
backup_verified=YES
echo 'DEV_RESIDUAL_ALL_BACKUPS=PRIVATE_AND_VERIFIED'

"${compose[@]}" start redis keycloak minio meilisearch mailpit >/dev/null
wait_health() {
  service="$1"
  cid="$("${compose[@]}" ps -q "$service")"
  for _ in $(seq 1 90); do
    state="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid")"
    [[ "$state" == healthy || ( "$service" == mailpit && "$state" == running ) ]] && return 0
    [[ "$state" == unhealthy || "$state" == exited || "$state" == dead ]] && break
    sleep 2
  done
  echo "ERROR: DEV_SERVICE_UNHEALTHY=$service"
  exit 1
}
for service in redis keycloak minio meilisearch mailpit; do wait_health "$service"; done

# Keycloak Admin API, not destructive SQL: preserve realm, admin and service accounts.
DEV_RESIDUAL_DELETE_CONFIRM=CLEAR_DEV_ONLY_RESIDUAL_DATA \
  bash infrastructure/scripts/maintenance/dev-residual-clear-keycloak.sh

# Keep the bucket, API keys and policies; delete all versions/objects/multipart uploads.
"${compose[@]}" start api >/dev/null
wait_health api
"${compose[@]}" exec -T -e DEV_RESIDUAL_DELETE_CONFIRM=CLEAR_DEV_ONLY_RESIDUAL_DATA \
  api node --input-type=module < infrastructure/scripts/maintenance/dev-residual-clear-media.mjs
"${compose[@]}" stop api >/dev/null

python3 infrastructure/scripts/maintenance/dev-residual-clear-http.py CLEAR_DEV_ONLY_RESIDUAL_DATA

# Re-clear application rows in case any authentication re-created them since PR #141.
psql_app -q < infrastructure/scripts/maintenance/dev-full-app-reset.sql
psql_app -At -c 'SELECT count(*) FROM "User" UNION ALL SELECT count(*) FROM "Article" UNION ALL SELECT count(*) FROM "ImportJob"' | grep -Ev '^0$' | {
  if read -r leftover; then echo 'ERROR: APPLICATION_DATA_REAPPEARED'; exit 1; fi
}
master_users_after="$(psql_kc -At -c "SELECT count(*) FROM user_entity u JOIN realm r ON r.id=u.realm_id WHERE r.name='master'" | tr -d '\r[:space:]')"
[[ "$master_users_after" == "$master_users_before" ]] || {
  echo 'ERROR: KEYCLOAK_MASTER_ADMIN_CHANGED'; exit 1;
}

# Flush only isolated DEV Redis. Do not use FLUSHALL or affect other projects.
"${compose[@]}" exec -T redis sh -ec 'REDISCLI_AUTH="$REDIS_PASSWORD" exec redis-cli FLUSHDB SYNC' | grep -qx OK
"${compose[@]}" exec -T redis sh -ec 'REDISCLI_AUTH="$REDIS_PASSWORD" exec redis-cli DBSIZE' | tr -d '\r' | grep -qx 0
echo 'DEV_REDIS_POST_PURGE_KEYS=0'

"${compose[@]}" start api worker >/dev/null
wait_health api
wait_health worker
services_stopped=NO
echo 'DEV_RESIDUAL_APPLY_RESULT=PASS_BACKED_UP_AND_CLEARED'
echo 'DEV_RESIDUAL_BACKUPS=PRIVATE_RETAINED'
echo 'DEV_RESIDUAL_SCOPE=DEV_ONLY; MASTER_REALM=PRESERVED; SCHEMAS=PRESERVED'
