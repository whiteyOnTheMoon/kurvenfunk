#!/usr/bin/env bash
# Only called by the guarded DEV residual reset after verified private backups.
# Preserve the master realm, DEV realm configuration, admin and service identities.
set -Eeuo pipefail
set +x
umask 077
[[ "${DEV_RESIDUAL_DELETE_CONFIRM:-}" == CLEAR_DEV_ONLY_RESIDUAL_DATA ]] || {
  echo 'ERROR: KEYCLOAK_CLEAR_REQUIRES_AUTHORIZATION'; exit 1;
}
[[ "$(git branch --show-current)" == develop && -f .env.dev ]] || {
  echo 'ERROR: KEYCLOAK_CLEAR_NOT_DEV'; exit 1;
}
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
removed=0
while IFS= read -r id; do
  "${kc[@]}" delete "users/$id" -r kurvenfunk >/dev/null
  removed=$((removed+1))
done < "$tmp/delete"
echo "DEV_KEYCLOAK_USERS_REMOVED=$removed"
