#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../../.." &&
    pwd
)"

ENV_FILE="${1:-.env.dev}"
COMPOSE_OVERLAY="${2:-compose.dev.yml}"
REALM="${KEYCLOAK_REALM:-kurvenfunk}"
GOOGLE_IDP_ALIAS="${KEYCLOAK_GOOGLE_IDP_ALIAS:-google}"
FIRST_BROKER_LOGIN_FLOW="${KEYCLOAK_FIRST_BROKER_LOGIN_FLOW:-first broker login}"

cd "$ROOT_DIR"

compose=(
  docker compose
  --env-file "$ENV_FILE"
  -f compose.yml
  -f "$COMPOSE_OVERLAY"
)

echo "Reading Keycloak management credentials..."
readarray -t KEYCLOAK_CONFIG_ADMIN < <(
  python3 - "$ENV_FILE" <<'PYENV'
from pathlib import Path
import sys

path = Path(sys.argv[1])
values = {}

for raw_line in path.read_text().splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    values[key] = value

required = [
    "KEYCLOAK_CONFIG_ADMIN_USERNAME",
    "KEYCLOAK_CONFIG_ADMIN_PASSWORD",
]

for key in required:
    value = values.get(key)
    if not value:
        raise SystemExit(f"Missing required variable: {key}")
    print(value)
PYENV
)

CONFIG_ADMIN_USERNAME="${KEYCLOAK_CONFIG_ADMIN[0]}"
CONFIG_ADMIN_PASSWORD="${KEYCLOAK_CONFIG_ADMIN[1]}"
unset KEYCLOAK_CONFIG_ADMIN

echo "Authenticating Keycloak admin CLI..."
"${compose[@]}" exec -T \
  -e "KEYCLOAK_CONFIG_ADMIN_USERNAME=$CONFIG_ADMIN_USERNAME" \
  -e "KEYCLOAK_CONFIG_ADMIN_PASSWORD=$CONFIG_ADMIN_PASSWORD" \
  keycloak sh -lc '
    /opt/keycloak/bin/kcadm.sh config credentials \
      --server http://127.0.0.1:8080 \
      --realm master \
      --user "$KEYCLOAK_CONFIG_ADMIN_USERNAME" \
      --password "$KEYCLOAK_CONFIG_ADMIN_PASSWORD"
  ' >/dev/null

unset CONFIG_ADMIN_PASSWORD

echo "Configuring realm account-linking safeguards..."
"${compose[@]}" exec -T keycloak \
  /opt/keycloak/bin/kcadm.sh update "realms/$REALM" \
    -s loginWithEmailAllowed=true \
    -s duplicateEmailsAllowed=false \
    -s "firstBrokerLoginFlow=$FIRST_BROKER_LOGIN_FLOW"

echo "Checking Google identity provider..."
GOOGLE_IDP_COUNT="$(
  "${compose[@]}" exec -T keycloak \
    /opt/keycloak/bin/kcadm.sh get identity-provider/instances \
      -r "$REALM" \
  | GOOGLE_IDP_ALIAS="$GOOGLE_IDP_ALIAS" python3 -c '
import json
import os
import sys

providers = json.load(sys.stdin)
alias = os.environ["GOOGLE_IDP_ALIAS"]

print(
    sum(
        1
        for provider in providers
        if provider.get("alias") == alias
    )
)
'
)"

if [ "$GOOGLE_IDP_COUNT" -ne 1 ]; then
  echo "ERROR: Expected exactly one Google identity provider with alias '$GOOGLE_IDP_ALIAS', found $GOOGLE_IDP_COUNT." >&2
  exit 1
fi

echo "Configuring Google account linking..."
"${compose[@]}" exec -T keycloak \
  /opt/keycloak/bin/kcadm.sh update \
    "identity-provider/instances/$GOOGLE_IDP_ALIAS" \
    -r "$REALM" \
    -s enabled=true \
    -s trustEmail=true \
    -s linkOnly=false \
    -s "firstBrokerLoginFlowAlias=$FIRST_BROKER_LOGIN_FLOW"

echo
echo "Keycloak account-linking configuration is ready."
echo "Realm: $REALM"
echo "Google identity provider: $GOOGLE_IDP_ALIAS"
echo "Duplicate e-mail accounts: disabled"
echo "First broker login flow: $FIRST_BROKER_LOGIN_FLOW"
echo "Google e-mail trust: enabled"
echo "Existing accounts require the configured broker-linking flow."
