#!/usr/bin/env bash
# Only called by the guarded DEV residual reset after verified private backups.
# Preserve the master realm, DEV realm configuration, admin and service identities.
set -Eeuo pipefail
set +x
umask 077
MODE="${DEV_KEYCLOAK_CLEAR_MODE:-apply}"
[[ "$MODE" == plan || "$MODE" == apply ]] || {
  echo 'ERROR: KEYCLOAK_CLEAR_MODE_INVALID'; exit 1;
}
if [[ "$MODE" == apply && "${DEV_RESIDUAL_DELETE_CONFIRM:-}" != CLEAR_DEV_ONLY_RESIDUAL_DATA ]]; then
  echo 'ERROR: KEYCLOAK_CLEAR_REQUIRES_AUTHORIZATION'; exit 1;
fi
[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: KEYCLOAK_CLEAR_NOT_DEV'; exit 1;
}
[[ -n "${EXPECTED_COMMIT:-}" && "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: KEYCLOAK_CLEAR_NOT_PINNED'; exit 1;
}
git fetch -q origin develop
[[ "$(git rev-parse origin/develop)" == "$EXPECTED_COMMIT" ]] || {
  echo 'ERROR: KEYCLOAK_CLEAR_REMOTE_MOVED'; exit 1;
}
if [[ "$MODE" == plan ]]; then
  exec 9>/tmp/kurvenfunk-dev-deploy.lock
  flock -n 9 || { echo 'ERROR: DEV_DEPLOY_BUSY'; exit 1; }
  exec 6>/tmp/kurvenfunk-dev-residual-reset.lock
  flock -n 6 || { echo 'ERROR: DEV_RESIDUAL_RESET_BUSY'; exit 1; }
fi
compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT

# Transfer config admin credentials via stdin, never GitHub logs or command arguments.
python3 - .env.dev <<'PY' | "${compose[@]}" exec -T keycloak sh -ec '
  IFS= read -r kc_admin
  IFS= read -r kc_password
  test -n "$kc_admin" && test -n "$kc_password"
  /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://127.0.0.1:8080 --realm master \
    --user "$kc_admin" --password "$kc_password" >/dev/null 2>&1
'
from pathlib import Path
import sys
values = {}
for raw in Path(sys.argv[1]).read_text().splitlines():
    line = raw.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    name, value = line.split('=', 1)
    if name in ('KEYCLOAK_CONFIG_ADMIN_USERNAME', 'KEYCLOAK_CONFIG_ADMIN_PASSWORD'):
        if name in values:
            raise SystemExit('ERROR: DUPLICATE_KEYCLOAK_CONFIG_ADMIN')
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
            value = value[1:-1]
        if not value or any(c in value for c in '\r\n\x00'):
            raise SystemExit('ERROR: INVALID_KEYCLOAK_CONFIG_ADMIN')
        values[name] = value
for name in ('KEYCLOAK_CONFIG_ADMIN_USERNAME', 'KEYCLOAK_CONFIG_ADMIN_PASSWORD'):
    if name not in values:
        raise SystemExit('ERROR: MISSING_KEYCLOAK_CONFIG_ADMIN')
    print(values[name])
PY

kc=( "${compose[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh )

# The Admin API can briefly expose a partial user listing after Keycloak restart.
# Compare SQL regular-user count, Admin count endpoint and TWO full listings.
# Never delete based on an incomplete cache/pagination result.
kc_url="$("${compose[@]}" exec -T keycloak printenv KC_DB_URL | tr -d '\r')"
app_db="$("${compose[@]}" exec -T postgres printenv POSTGRES_DB | tr -d '\r')"
[[ "$kc_url" =~ ^jdbc:postgresql://postgres:5432/([A-Za-z0-9_]+)$ && "$app_db" =~ ^[A-Za-z0-9_]+$ ]] || {
  echo 'ERROR: INVALID_KEYCLOAK_DB_TARGET'; exit 1;
}
kc_db="${BASH_REMATCH[1]}"
[[ "$kc_db" != "$app_db" ]] || { echo 'ERROR: KEYCLOAK_DB_NOT_ISOLATED'; exit 1; }
count_regular_sql() {
  "${compose[@]}" exec -T postgres sh -ec '
    PGPASSWORD="$POSTGRES_PASSWORD" exec psql -XAt -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$1" -c "
      SELECT COUNT(*) FROM user_entity u
      JOIN realm r ON r.id=u.realm_id
      WHERE r.name='\''kurvenfunk'\'' AND u.username NOT LIKE '\''service-account-%'\'';
    "
  ' sh "$kc_db" | tr -d '\r[:space:]'
}
regular_before="$(count_regular_sql)"
[[ "$regular_before" =~ ^[0-9]+$ && "$regular_before" -le 200 ]] || {
  echo 'ERROR: KEYCLOAK_SQL_REGULAR_USER_LIMIT'; exit 1;
}
echo "DEV_KEYCLOAK_SQL_REGULAR_BEFORE=$regular_before"

enumeration_verified=NO
for attempt in $(seq 1 20); do
  "${kc[@]}" get users/count -r kurvenfunk > "$tmp/count.json"
  admin_count="$(python3 - "$tmp/count.json" <<'PY'
import json,sys
with open(sys.argv[1]) as f:
    value=json.load(f)
if type(value) is not int or value<0:
    raise SystemExit('ERROR: INVALID_KEYCLOAK_ADMIN_USER_COUNT')
print(value)
PY
)"
  : > "$tmp/list"
  offset=0
  page=0
  while :; do
    page=$((page+1))
    ((page <= 100)) || { echo 'ERROR: KEYCLOAK_PAGINATION_LIMIT'; exit 1; }
    "${kc[@]}" get users -r kurvenfunk --offset "$offset" --limit 200 > "$tmp/page.json"
    count="$(python3 - "$tmp/page.json" "$tmp/list" <<'PY'
import json,re,sys
with open(sys.argv[1]) as f:
    rows=json.load(f)
if not isinstance(rows,list):
    raise SystemExit('ERROR: INVALID_KEYCLOAK_USERS')
with open(sys.argv[2],'a') as out:
    for u in rows:
        ident=u.get('id','')
        username=u.get('username','')
        if not isinstance(username,str) or not re.fullmatch(r'[0-9a-fA-F-]{36}',ident):
            raise SystemExit('ERROR: UNEXPECTED_KEYCLOAK_USER')
        protect=bool(u.get('serviceAccountClientId')) or username.lower().startswith('service-account-') or 'admin' in username.lower()
        print(ident, 'protect' if protect else 'review', file=out)
print(len(rows))
PY
)"
    [[ "$count" =~ ^[0-9]+$ ]] || { echo 'ERROR: INVALID_KEYCLOAK_PAGE_COUNT'; exit 1; }
    offset=$((offset+count))
    ((count == 200)) || break
  done
  "${kc[@]}" get users -r kurvenfunk -q first=0 -q max=200 > "$tmp/query.json"
  parity="$(python3 - "$tmp/list" "$tmp/query.json" <<'PY'
import json,re,sys
with open(sys.argv[1]) as f:
    listed=[line.split()[0] for line in f if line.strip()]
with open(sys.argv[2]) as f:
    queried=json.load(f)
if not isinstance(queried,list):
    raise SystemExit('ERROR: INVALID_KEYCLOAK_QUERY_USERS')
ids=[u.get('id') for u in queried]
if not all(isinstance(v,str) and re.fullmatch(r'[0-9a-fA-F-]{36}',v) for v in ids):
    raise SystemExit('ERROR: INVALID_KEYCLOAK_QUERY_IDS')
print('YES' if len(set(listed))==len(listed) and set(ids)==set(listed) and len(set(ids))==len(ids) else 'NO')
PY
)"
  if [[ "$offset" == "$admin_count" && "$offset" == "$regular_before" && "$parity" == YES ]]; then
    enumeration_verified=YES
    break
  fi
  echo "DEV_KEYCLOAK_ENUMERATION_RETRY=$attempt; sql=$regular_before; api=$admin_count; listed=$offset"
  sleep 3
done
[[ "$enumeration_verified" == YES ]] || {
  echo 'ERROR: KEYCLOAK_ENUMERATION_NOT_COMPLETE'; exit 1;
}
echo "DEV_KEYCLOAK_ENUMERATION_VERIFIED=$regular_before"

# Fail closed on malformed role data; preserve any realm management or admin identity.
: > "$tmp/delete"
protected=0
while read -r id state; do
  if [[ "$state" == protect ]]; then
    protected=$((protected+1))
    continue
  fi
  "${kc[@]}" get-roles -r kurvenfunk --uid "$id" --effective > "$tmp/roles.json"
  realm_role="$(python3 - "$tmp/roles.json" <<'PY'
import json,sys
with open(sys.argv[1]) as f:
    roles=json.load(f)
if not isinstance(roles,list):
    raise SystemExit('ERROR: INVALID_USER_ROLES')
names={str(r.get('name','')).lower() for r in roles}
print('protect' if names & {'admin','realm-admin','manage-realm','manage-users','manage-clients'} else 'review')
PY
)"
  [[ "$realm_role" == protect || "$realm_role" == review ]] || exit 1
  if [[ "$realm_role" == protect ]]; then
    protected=$((protected+1))
    continue
  fi
  "${kc[@]}" get-roles -r kurvenfunk --uid "$id" --cclientid realm-management --effective > "$tmp/clientroles.json"
  client_role="$(python3 - "$tmp/clientroles.json" <<'PY'
import json,sys
with open(sys.argv[1]) as f:
    roles=json.load(f)
if not isinstance(roles,list):
    raise SystemExit('ERROR: INVALID_CLIENT_ROLES')
print('protect' if roles else 'review')
PY
)"
  [[ "$client_role" == protect || "$client_role" == review ]] || exit 1
  if [[ "$client_role" == protect ]]; then
    protected=$((protected+1))
    continue
  fi
  printf '%s\n' "$id" >> "$tmp/delete"
done < "$tmp/list"

planned="$(wc -l < "$tmp/delete" | tr -d '[:space:]')"
[[ "$planned" =~ ^[0-9]+$ ]] || { echo 'ERROR: INVALID_DELETE_COUNT'; exit 1; }
echo "DEV_KEYCLOAK_PROTECTED_IDENTITIES=$protected"
echo "DEV_KEYCLOAK_DELETE_CANDIDATES=$planned"
if [[ "$MODE" == plan ]]; then
  echo "DEV_KEYCLOAK_PLAN_PROTECTED=$protected"
  echo "DEV_KEYCLOAK_PLAN_DELETE_CANDIDATES=$planned"
  echo 'DEV_KEYCLOAK_PLAN_RESULT=PASS_READ_ONLY_NO_MUTATION'
  exit 0
fi
removed=0
while IFS= read -r id; do
  "${kc[@]}" delete "users/$id" -r kurvenfunk >/dev/null
  removed=$((removed+1))
done < "$tmp/delete"
echo "DEV_KEYCLOAK_USERS_REMOVED=$removed"

expected_remaining="$protected"
post_verified=NO
for attempt in $(seq 1 20); do
  regular_after="$(count_regular_sql)"
  "${kc[@]}" get users/count -r kurvenfunk > "$tmp/count-after.json"
  api_after="$(python3 - "$tmp/count-after.json" <<'PY'
import json,sys
with open(sys.argv[1]) as f:
    value=json.load(f)
if type(value) is not int or value<0:
    raise SystemExit('ERROR: INVALID_KEYCLOAK_ADMIN_POSTCOUNT')
print(value)
PY
)"
  if [[ "$regular_after" == "$expected_remaining" && "$api_after" == "$expected_remaining" ]]; then
    post_verified=YES
    break
  fi
  sleep 3
done
[[ "$post_verified" == YES ]] || {
  echo 'ERROR: KEYCLOAK_REGULAR_USERS_REMAIN_AFTER_DELETE'; exit 1;
}
echo "DEV_KEYCLOAK_REGULAR_USERS_REMAINING=$regular_after"
echo 'DEV_KEYCLOAK_CLEAR_RESULT=PASS_VERIFIED'
