#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../../.." &&
    pwd
)"

ENV_FILE="${1:-.env.dev}"
COMPOSE_OVERLAY="${2:-compose.dev.yml}"

# Legacy registration bootstrap is intentionally restricted to DEV Mailpit.
# Use configure-transactional-email.sh for STAGING/PROD SMTP instead.
if [[ "$ENV_FILE" != ".env.dev" || "$COMPOSE_OVERLAY" != "compose.dev.yml" ]]; then
  echo "KEYCLOAK_LEGACY_MAILPIT_DEV_ONLY" >&2
  exit 1
fi

REALM="${KEYCLOAK_REALM:-kurvenfunk}"

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

echo "Configuring e-mail registration..."

"${compose[@]}" exec -T keycloak \
  /opt/keycloak/bin/kcadm.sh update "realms/$REALM" \
    -s registrationAllowed=true \
    -s registrationEmailAsUsername=true \
    -s verifyEmail=true \
    -s loginWithEmailAllowed=true \
    -s duplicateEmailsAllowed=false \
    -s resetPasswordAllowed=true

echo "Configuring DEV SMTP..."

cat <<'JSON' | "${compose[@]}" exec -T keycloak sh -lc '
  cat > /tmp/kurvenfunk-smtp.json
  /opt/keycloak/bin/kcadm.sh update "realms/'"$REALM"'" \
    -f /tmp/kurvenfunk-smtp.json
  rm -f /tmp/kurvenfunk-smtp.json
'
{
  "smtpServer": {
    "host": "mailpit",
    "port": "1025",
    "from": "noreply@kurvenfunk.at",
    "fromDisplayName": "Kurvenfunk",
    "replyTo": "noreply@kurvenfunk.at",
    "replyToDisplayName": "Kurvenfunk",
    "auth": "false",
    "ssl": "false",
    "starttls": "false"
  }
}
JSON
echo
echo "Keycloak e-mail registration configuration is ready."
echo "Realm: $REALM"
echo "Registration: enabled"
echo "E-mail as username: enabled"
echo "E-mail verification: required"
echo "SMTP: mailpit:1025"
