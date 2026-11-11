#!/usr/bin/env bash
# DEV-only aggregate comparison of Keycloak Admin API and SQL inventory.
set -Eeuo pipefail
set +x
umask 077
[[ "${DEV_KEYCLOAK_DIAG_TARGET:-}" == DEV ]] || { echo 'ERROR: DEV_KEYCLOAK_DIAG_ONLY'; exit 1; }
[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: DEV_KEYCLOAK_DIAG_CHECKOUT_REQUIRED'; exit 1;
}
compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT

# Authenticate via stdin as in the guarded reset, never show credentials or tokens.
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

kc=("${compose[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh)
"${kc[@]}" get users/count -r kurvenfunk > "$tmp/count.json"
"${kc[@]}" get users -r kurvenfunk --offset 0 --limit 200 > "$tmp/cli.json"
"${kc[@]}" get users -r kurvenfunk -q first=0 -q max=200 > "$tmp/query.json"

python3 - "$tmp/count.json" "$tmp/cli.json" "$tmp/query.json" <<'PY'
import json
import sys
with open(sys.argv[1]) as f:
    count = json.load(f)
with open(sys.argv[2]) as f:
    cli = json.load(f)
with open(sys.argv[3]) as f:
    query = json.load(f)
if type(count) is not int or count < 0:
    raise SystemExit('ERROR: INVALID_KEYCLOAK_COUNT')
if not isinstance(cli, list) or not isinstance(query, list):
    raise SystemExit('ERROR: INVALID_KEYCLOAK_LIST')
if count > 200:
    raise SystemExit('ERROR: KEYCLOAK_DIAG_PAGINATION_LIMIT')
print('KEYCLOAK_ADMIN_COUNT_ENDPOINT=' + str(count))
print('KEYCLOAK_ADMIN_CLI_LISTED=' + str(len(cli)))
print('KEYCLOAK_ADMIN_QUERY_LISTED=' + str(len(query)))
print('DEV_KEYCLOAK_READONLY_DIAG_RESULT=PASS')
PY
