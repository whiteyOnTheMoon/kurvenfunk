#!/usr/bin/env bash
# DEV-only cleanup of comments and six strictly proven seed/QA identities.
# Back up both PostgreSQL databases before ANY deletion; no STAGING/PROD access.
set -Eeuo pipefail
set +x
umask 077

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?EXPECTED_COMMIT required}"
MODE="${PHASE021_CLEANUP_MODE:-plan}"
[[ "$MODE" == plan || "$MODE" == apply ]] || { echo "Invalid mode"; exit 1; }
cd "$PROJECT_DIR"
[[ -f .env.dev && "$(git branch --show-current)" == develop ]] || {
  echo "ERROR: checked-out DEV develop and .env.dev required"; exit 1;
}
[[ -z "$(git status --porcelain)" && "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" ]] || {
  echo "ERROR: DEV worktree/commit guard"; exit 1;
}
git fetch -q origin develop
[[ "$(git rev-parse origin/develop)" == "$EXPECTED_COMMIT" ]] || {
  echo "ERROR: develop advanced"; exit 1;
}

exec 8>/tmp/kurvenfunk-dev-deploy.lock
flock -n 8 || { echo "ERROR: deployment lock held"; exit 1; }
exec 9>/tmp/kurvenfunk-dev-phase21-seed-cleanup.lock
flock -n 9 || { echo "ERROR: sport cleanup lock held"; exit 1; }
exec 7>/tmp/kurvenfunk-dev-phase0-21-synthetic-cleanup.lock
flock -n 7 || { echo "ERROR: another synthetic cleanup in progress"; exit 1; }

compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
"${compose[@]}" config --quiet

execute_audit() {
  local action="$1"
  local backups="$2"
  "${compose[@]}" exec -T \
    -e PHASE021_CLEANUP_TARGET=DEV \
    -e "PHASE021_CLEANUP_MODE=$action" \
    -e "PHASE021_TWO_VERIFIED_BACKUPS=$backups" \
    api node --input-type=module < infrastructure/scripts/maintenance/dev-phase0-21-synthetic-cleanup.mjs
}

echo "=== Cross-phase DEV preflight: read-only, exact account and article fingerprints ==="
execute_audit plan NO
if [[ "$MODE" == plan ]]; then
  echo "PHASE021 DEV: PLAN ONLY"
  exit 0
fi

app_db="$("${compose[@]}" exec -T postgres printenv POSTGRES_DB | tr -d '\r')"
kc_url="$("${compose[@]}" exec -T keycloak printenv KC_DB_URL | tr -d '\r')"
if [[ ! "$app_db" =~ ^[a-zA-Z0-9_]+$ || ! "$kc_url" =~ ^jdbc:postgresql://postgres:5432/([a-zA-Z0-9_]+)$ ]]; then
  echo "ERROR: unverified DEV database names"; exit 1;
fi
kc_db="${BASH_REMATCH[1]}"
if [[ "$app_db" == "$kc_db" ]]; then
  echo "ERROR: app and Keycloak DB unexpectedly identical"; exit 1;
fi

backup_root="$HOME/.kurvenfunk-dev-backups/phase0-21"
install -m 700 -d "$backup_root"
backup_dir="$(mktemp -d "$backup_root/cleanup-XXXXXXXX")"
verified=NO
on_exit() {
  if [[ "$verified" != YES ]]; then
    rm -rf -- "$backup_dir"
  fi
}
trap on_exit EXIT
for role in app keycloak; do
  dbname="$app_db"
  [[ "$role" == keycloak ]] && dbname="$kc_db"
  file="$backup_dir/$role.dump"
  "${compose[@]}" exec -T postgres sh -ec \
    'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_dump -U "$POSTGRES_USER" -d "$1" --format=custom --no-owner --no-acl' \
    sh "$dbname" > "$file"
  [[ -s "$file" ]] || { echo "ERROR: empty backup"; exit 1; }
  "${compose[@]}" exec -T postgres pg_restore --list < "$file" >/dev/null
  "${compose[@]}" exec -T postgres pg_restore --file /dev/null < "$file" >/dev/null
  chmod 600 "$file"
  echo "Verified private backup: $role database; SHA256 $(sha256sum "$file" | cut -d ' ' -f 1)"
done
verified=YES
echo "=== Apply exact DEV cleanup (database transaction + Keycloak test-only identities) ==="
execute_audit apply YES
echo "=== Confirm all targeted DEV records are gone ==="
execute_audit verify YES

# Expired, private QA test-credentials are no longer needed after confirmed removal.
vault="$HOME/.local/share/kurvenfunk"
for name in phase17-dev-accounts-created.json phase19-dev-moderator-created.json; do
  artifact="$vault/$name"
  if [[ -f "$artifact" && ! -L "$artifact" ]]; then
    rm -f -- "$artifact"
    echo "Removed obsolete private QA-credential artifact ($name)"
  fi
done

echo "=== Read-only cross-module post-cleanup audit ==="
EXPECTED_COMMIT="$EXPECTED_COMMIT" bash infrastructure/scripts/verify/dev-phase0-21-data-audit.sh
echo "PHASE021 DEV SYNTHETIC CLEANUP: COMPLETED; both private backups retained"
