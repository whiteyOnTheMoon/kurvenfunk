#!/usr/bin/env bash
set -Eeuo pipefail
set +x
umask 077

# Run from the existing clean DEV checkout. No checkout or deployment is needed.
PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
cd "$PROJECT_DIR"

test "$(git branch --show-current)" = develop
test -f .env.dev
test "$(stat -c %a .env.dev)" = 600

REALM=kurvenfunk
CLIENT_NAME=kurvenfunk-session-revoker

compose=(
  docker compose
  -p kurvenfunk-dev
  --env-file .env.dev
  -f compose.yml
  -f compose.dev.yml
)

echo "=== DEV Keycloak session-revoker provisioning ==="

# The admin password is read inside the Keycloak container, not passed to the API.
"${compose[@]}" exec -T keycloak sh -lc '
  /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://127.0.0.1:8080 \
    --realm master \
    --user "$KC_BOOTSTRAP_ADMIN_USERNAME" \
    --password "$KC_BOOTSTRAP_ADMIN_PASSWORD"
' >/dev/null

CLIENT_UUID="$(
  "${compose[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh get clients \
    -r "$REALM" -q "clientId=$CLIENT_NAME" |
    python3 -c '
import json
import sys
matches = json.load(sys.stdin)
if len(matches) > 1:
    raise SystemExit("Ambiguous Keycloak clientId")
print(matches[0]["id"] if matches else "")
'
)"

if [[ -z "$CLIENT_UUID" ]]; then
  echo "Creating dedicated Keycloak client..."
  CLIENT_UUID="$(
    "${compose[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh create clients \
      -r "$REALM" \
      -s "clientId=$CLIENT_NAME" \
      -s enabled=true \
      -s publicClient=false \
      -s serviceAccountsEnabled=true \
      -s standardFlowEnabled=false \
      -s directAccessGrantsEnabled=false \
      -s clientAuthenticatorType=client-secret \
      -i
  )"
else
  echo "Dedicated Keycloak client exists; verifying settings..."
  "${compose[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh get \
    "clients/$CLIENT_UUID" -r "$REALM" |
    python3 -c '
import json
import sys
client = json.load(sys.stdin)
if not client.get("enabled") or client.get("publicClient") or not client.get("serviceAccountsEnabled"):
    raise SystemExit("Existing client is not an enabled confidential service-account client")
'
fi

SERVICE_USER="$(
  "${compose[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh get \
    "clients/$CLIENT_UUID/service-account-user" -r "$REALM" |
    python3 -c 'import json,sys; print(json.load(sys.stdin)["username"])'
)"

HAS_ROLE="$(
  "${compose[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh get-roles \
    -r "$REALM" --uusername "$SERVICE_USER" --cclientid realm-management |
    python3 -c '
import json, sys
roles = {r["name"] for r in json.load(sys.stdin)}
if roles - {"manage-users"}:
    raise SystemExit("Service account has unexpected realm-management roles")
print("yes" if "manage-users" in roles else "no")
'
)"

if [[ "$HAS_ROLE" == no ]]; then
  echo "Granting only realm-management/manage-users..."
  "${compose[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh add-roles \
    -r "$REALM" \
    --uusername "$SERVICE_USER" \
    --cclientid realm-management \
    --rolename manage-users >/dev/null
fi

# Never print the generated secret to stdout, logs or shell history.
SECRET="$(
  "${compose[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh get \
    "clients/$CLIENT_UUID/client-secret" -r "$REALM" |
    python3 -c '
import json, sys
secret = json.load(sys.stdin).get("value")
if not isinstance(secret, str) or not secret or "\n" in secret or "\r" in secret:
    raise SystemExit("Client secret is missing or invalid")
print(secret)
'
)"

KEYCLOAK_REVOKER_SECRET="$SECRET" python3 <<'PY'
import os
import tempfile
from pathlib import Path

path = Path(".env.dev")
lines = path.read_text().splitlines()
values = {
    "KEYCLOAK_ADMIN_INTERNAL_URL": "http://keycloak:8080",
    "KEYCLOAK_REVOKER_REALM": "kurvenfunk",
    "KEYCLOAK_REVOKER_CLIENT_ID": "kurvenfunk-session-revoker",
    "KEYCLOAK_REVOKER_CLIENT_SECRET": os.environ["KEYCLOAK_REVOKER_SECRET"],
}

existing = {}
for line in lines:
    if "=" in line and not line.lstrip().startswith("#"):
        key, value = line.split("=", 1)
        key = key.strip()
        if key in values:
            if key in existing:
                raise SystemExit(f"Duplicate environment key: {key}")
            existing[key] = value.strip().strip("'").strip('"')

for key, desired in values.items():
    if key in existing and existing[key] not in ("", desired):
        raise SystemExit(f"{key} exists with a different value; not overwriting")

missing = [f"{key}={value}" for key, value in values.items() if key not in existing]
updated = [
    f"{line.split('=', 1)[0]}={values[line.split('=', 1)[0].strip()]}"
    if "=" in line and line.split("=", 1)[0].strip() in values
    and not line.lstrip().startswith("#")
    else line
    for line in lines
]
if missing:
    updated.extend(["", "# Dedicated DEV Keycloak session revoker", *missing])

payload = ("\n".join(updated).rstrip() + "\n").encode()
with tempfile.NamedTemporaryFile(prefix=".env.dev.", dir=".", delete=False) as tmp:
    tmp.write(payload)
    tmp.flush()
    os.fsync(tmp.fileno())
    temp_path = Path(tmp.name)
os.chmod(temp_path, 0o600)
os.replace(temp_path, path)
PY

unset SECRET

echo "Service-account access and .env.dev are configured; secret was not printed."
echo "DEV API will receive the credentials after the Task 176 code is deployed."
