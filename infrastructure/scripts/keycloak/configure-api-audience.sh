#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../../.." &&
    pwd
)"

ENV_FILE="${1:-.env.dev}"
COMPOSE_OVERLAY="${2:-compose.dev.yml}"

REALM="${KEYCLOAK_REALM:-kurvenfunk}"
WEB_CLIENT="${KEYCLOAK_WEB_CLIENT:-kurvenfunk-web}"
API_CLIENT="${KEYCLOAK_API_CLIENT:-kurvenfunk-api}"
SCOPE_NAME="${API_CLIENT}-audience"

cd "$ROOT_DIR"

compose=(
  docker compose
  --env-file "$ENV_FILE"
  -f compose.yml
  -f "$COMPOSE_OVERLAY"
)

echo "Authenticating Keycloak admin CLI..."

"${compose[@]}" exec -T keycloak sh -lc '
  /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://127.0.0.1:8080 \
    --realm master \
    --user "$KC_BOOTSTRAP_ADMIN_USERNAME" \
    --password "$KC_BOOTSTRAP_ADMIN_PASSWORD"
' >/dev/null

echo "Resolving web client..."

WEB_CLIENT_ID="$(
  "${compose[@]}" exec -T keycloak \
    /opt/keycloak/bin/kcadm.sh get clients \
      -r "$REALM" \
      -q "clientId=$WEB_CLIENT" \
  | python3 -c '
import json
import sys

clients = json.load(sys.stdin)

if len(clients) != 1:
    raise SystemExit(
        f"Expected exactly one web client, found {len(clients)}"
    )

print(clients[0]["id"])
'
)"

echo "Resolving API audience scope..."

SCOPE_ID="$(
  "${compose[@]}" exec -T keycloak \
    /opt/keycloak/bin/kcadm.sh get client-scopes \
      -r "$REALM" \
  | SCOPE_NAME="$SCOPE_NAME" python3 -c '
import json
import os
import sys

scopes = json.load(sys.stdin)
name = os.environ["SCOPE_NAME"]

matches = [
    scope["id"]
    for scope in scopes
    if scope.get("name") == name
]

if len(matches) > 1:
    raise SystemExit(
        f"Expected at most one audience scope, found {len(matches)}"
    )

print(matches[0] if matches else "")
'
)"

if [ -z "$SCOPE_ID" ]; then
  echo "Creating audience scope..."

  SCOPE_ID="$(
    "${compose[@]}" exec -T keycloak \
      /opt/keycloak/bin/kcadm.sh create client-scopes \
        -r "$REALM" \
        -s "name=$SCOPE_NAME" \
        -s protocol=openid-connect \
        -s 'attributes."include.in.token.scope"=false' \
        -i
  )"
else
  echo "Audience scope already exists."
fi

echo "Checking audience mapper..."

MAPPER_COUNT="$(
  "${compose[@]}" exec -T keycloak \
    /opt/keycloak/bin/kcadm.sh get \
      "client-scopes/${SCOPE_ID}/protocol-mappers/models" \
      -r "$REALM" \
  | SCOPE_NAME="$SCOPE_NAME" python3 -c '
import json
import os
import sys

mappers = json.load(sys.stdin)
name = os.environ["SCOPE_NAME"]

print(
    sum(
        1
        for mapper in mappers
        if mapper.get("name") == name
    )
)
'
)"

if [ "$MAPPER_COUNT" -eq 0 ]; then
  echo "Creating audience mapper..."

  "${compose[@]}" exec -T keycloak \
    /opt/keycloak/bin/kcadm.sh create \
      "client-scopes/${SCOPE_ID}/protocol-mappers/models" \
      -r "$REALM" \
      -s "name=$SCOPE_NAME" \
      -s protocol=openid-connect \
      -s protocolMapper=oidc-audience-mapper \
      -s "config.\"included.client.audience\"=$API_CLIENT" \
      -s 'config."access.token.claim"=true' \
      -s 'config."introspection.token.claim"=true' \
      >/dev/null
elif [ "$MAPPER_COUNT" -eq 1 ]; then
  echo "Audience mapper already exists."
else
  echo "ERROR: Multiple audience mappers found." >&2
  exit 1
fi

echo "Checking web client default scopes..."

ASSIGNED="$(
  "${compose[@]}" exec -T keycloak \
    /opt/keycloak/bin/kcadm.sh get \
      "clients/${WEB_CLIENT_ID}/default-client-scopes" \
      -r "$REALM" \
  | SCOPE_ID="$SCOPE_ID" python3 -c '
import json
import os
import sys

scopes = json.load(sys.stdin)
scope_id = os.environ["SCOPE_ID"]

print(
    "yes"
    if any(scope.get("id") == scope_id for scope in scopes)
    else "no"
)
'
)"

if [ "$ASSIGNED" = "no" ]; then
  echo "Assigning audience scope to web client..."

  "${compose[@]}" exec -T keycloak \
    /opt/keycloak/bin/kcadm.sh update \
      "clients/${WEB_CLIENT_ID}/default-client-scopes/${SCOPE_ID}" \
      -r "$REALM"
else
  echo "Audience scope already assigned to web client."
fi

echo
echo "Keycloak API audience configuration is ready."
echo "Realm: $REALM"
echo "Web client: $WEB_CLIENT"
echo "API audience: $API_CLIENT"
