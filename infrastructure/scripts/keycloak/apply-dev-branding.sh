#!/usr/bin/env bash
# DEV-only, opt-in Keycloak login branding activation. Does not touch SMTP,
# users, clients, credentials, admin theme, Cloudflare or production.
set -Eeuo pipefail
set +x
umask 077

cd /home/ap/www/kurvenfunk || exit 1

if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ||
  -z "${EXPECTED_COMMIT:-}" ||
  "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
  -n "$(git status --porcelain)" ||
  ! -f .env.dev || -L .env.dev ||
  "$(stat -c %a .env.dev)" != 600 ]]; then
  echo "KURVENFUNK_DEV_LOGIN_THEME_PRECHECK_FAILED" >&2
  exit 1
fi

compose=(docker compose -p kurvenfunk-dev --env-file .env.dev
  -f compose.yml -f compose.dev.yml)

"${compose[@]}" config --quiet

# The compose deployment must finish before changing the live realm.
"${compose[@]}" exec -T keycloak   test -f /opt/keycloak/themes/kurvenfunk/login/theme.properties
"${compose[@]}" exec -T keycloak   test -f /opt/keycloak/themes/kurvenfunk/login/resources/css/kurvenfunk.css
"${compose[@]}" exec -T keycloak   test -f /opt/keycloak/themes/kurvenfunk/login/resources/img/favicon.ico

# Credentials remain solely in the private host env, travel over stdin,
# and never appear in Docker command-line arguments or output.
python3 - .env.dev <<'PY' | "${compose[@]}" exec -T keycloak sh -ec '
  IFS= read -r config_user
  IFS= read -r config_password
  test -n "$config_user" && test -n "$config_password"
  /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://127.0.0.1:8080 \
    --realm master \
    --user "$config_user" \
    --password "$config_password" >/dev/null 2>&1
'
from pathlib import Path
import sys

values = {}
for raw in Path(sys.argv[1]).read_text().splitlines():
    line = raw.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    key, value = line.split('=', 1)
    if key not in ('KEYCLOAK_CONFIG_ADMIN_USERNAME', 'KEYCLOAK_CONFIG_ADMIN_PASSWORD'):
        continue
    if key in values:
        raise SystemExit('DUPLICATE_CONFIG_ADMIN')
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    if not value or any(char in value for char in '\r\n\x00'):
        raise SystemExit('INVALID_CONFIG_ADMIN')
    values[key] = value
for key in ('KEYCLOAK_CONFIG_ADMIN_USERNAME', 'KEYCLOAK_CONFIG_ADMIN_PASSWORD'):
    if key not in values:
        raise SystemExit('CONFIG_ADMIN_MISSING')
    print(values[key])
PY

read_theme() {
  "${compose[@]}" exec -T keycloak     /opt/keycloak/bin/kcadm.sh get realms/kurvenfunk |
    node -e '
      let body = "";
      process.stdin.on("data", (chunk) => { body += chunk; });
      process.stdin.on("end", () => {
        const realm = JSON.parse(body);
        if (realm.realm !== "kurvenfunk") process.exit(1);
        const value = realm.loginTheme;
        if (value != null && (typeof value !== "string" || !/^[a-zA-Z0-9._-]{1,80}$/.test(value))) process.exit(1);
        process.stdout.write(value || "");
      });
    '
}

before="$(read_theme)"
complete=false
rollback() {
  if [[ "$complete" != true ]]; then
    "${compose[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh       update realms/kurvenfunk -s "loginTheme=$before" >/dev/null 2>&1 ||
      echo "KURVENFUNK_LOGIN_THEME_ROLLBACK_MANUAL_REVIEW_REQUIRED" >&2
    echo "KURVENFUNK_LOGIN_THEME: ROLLBACK_ATTEMPTED" >&2
  fi
}
trap rollback EXIT

"${compose[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh   update realms/kurvenfunk -s "loginTheme=kurvenfunk" >/dev/null

after="$(read_theme)"
if [[ "$after" != kurvenfunk ]]; then
  echo "KURVENFUNK_DEV_LOGIN_THEME_READBACK_FAILED" >&2
  exit 1
fi

# Read-only public smoke; no account changes or credential exchange.
curl --fail --silent --show-error --max-time 10   https://auth-dev.kurvenfunk.at/realms/kurvenfunk/.well-known/openid-configuration   >/dev/null

complete=true
echo "KURVENFUNK_DEV_LOGIN_THEME: PASS"
echo "Only realm loginTheme changed; registration, verification, reset and SMTP were untouched."
