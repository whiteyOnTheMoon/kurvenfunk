#!/usr/bin/env bash
# Configure Keycloak SMTP without shipping secrets to Git or Docker Compose.
# Default: validate only. --apply changes only the selected Keycloak realm.
set -Eeuo pipefail
set +x
umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"

target="${1:-}"
mode="${2:---check}"
case "$target" in
  dev) env_file=.env.dev; overlay=compose.dev.yml; project=kurvenfunk-dev ;;
  staging) env_file=.env.staging; overlay=compose.staging.yml; project=kurvenfunk-staging ;;
  prod) env_file=.env.prod; overlay=compose.prod.yml; project=kurvenfunk-prod ;;
  *) echo "MAIL_ENVIRONMENT_INVALID" >&2; exit 1 ;;
esac
case "$mode" in
  --check|--apply|--audit) ;;
  *) echo "MAIL_MODE_INVALID" >&2; exit 1 ;;
esac
if [[ ! -f "$env_file" || -L "$env_file" ]]; then
  echo "MAIL_ENV_FILE_MISSING_OR_SYMLINK" >&2
  exit 1
fi
if [[ "$(stat -c %a "$env_file")" != 600 ]]; then
  echo "MAIL_ENV_FILE_MUST_BE_0600" >&2
  exit 1
fi

node infrastructure/scripts/keycloak/smtp-config.mjs --validate "$env_file" "$target"
if [[ "$mode" == --check ]]; then
  echo "KEYCLOAK_MAIL_DRY_RUN: PASS ($target)"
  exit 0
fi

compose=(docker compose -p "$project" --env-file "$env_file" -f compose.yml -f "$overlay")
"${compose[@]}" config --quiet

authenticate() {
  # The initial bootstrap account may no longer be active. Use the dedicated
  # Keycloak configuration admin already present in the private environment.
  # Password is transferred only over stdin, never in the Docker exec args.
  python3 - "$env_file" <<'PY' | "${compose[@]}" exec -T keycloak sh -ec '
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

entries = {}
for raw in Path(sys.argv[1]).read_text().splitlines():
    line = raw.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    name, value = line.split('=', 1)
    if name in ('KEYCLOAK_CONFIG_ADMIN_USERNAME', 'KEYCLOAK_CONFIG_ADMIN_PASSWORD'):
        if name in entries:
            raise SystemExit('KEYCLOAK_MAIL_ADMIN_CONFIG_DUPLICATE')
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        if not value or any(char in value for char in '\r\n\x00'):
            raise SystemExit('KEYCLOAK_MAIL_ADMIN_CONFIG_INVALID')
        entries[name] = value
for name in ('KEYCLOAK_CONFIG_ADMIN_USERNAME', 'KEYCLOAK_CONFIG_ADMIN_PASSWORD'):
    if name not in entries:
        raise SystemExit('KEYCLOAK_MAIL_ADMIN_CONFIG_MISSING')
    print(entries[name])
PY
}
authenticate || { echo "KEYCLOAK_MAIL_ADMIN_AUTH_FAILED" >&2; exit 1; }

if [[ "$mode" == --apply ]]; then
  # The pipe is secret-bearing: never enable shell trace or tee it to a file.
  # A temporary file exists only inside the Keycloak container (mode 0600).
  node infrastructure/scripts/keycloak/smtp-config.mjs --emit "$env_file" "$target" |
    "${compose[@]}" exec -T keycloak sh -ec '
      umask 077
      mail_config="$(mktemp /tmp/kurvenfunk-realm-smtp.XXXXXX)"
      trap "rm -f \"$mail_config\"" EXIT
      cat > "$mail_config"
      /opt/keycloak/bin/kcadm.sh update realms/kurvenfunk \
        -f "$mail_config" >/dev/null 2>&1
    ' || { echo "KEYCLOAK_MAIL_APPLY_FAILED" >&2; exit 1; }
fi

# This JSON can contain a masked credential. Never echo it; consume in process stdin.
"${compose[@]}" exec -T keycloak \
  /opt/keycloak/bin/kcadm.sh get realms/kurvenfunk |
  node infrastructure/scripts/keycloak/smtp-config.mjs \
    --audit "$env_file" "$target"

echo "KEYCLOAK_MAIL_CONFIGURED_AND_AUDITED: PASS ($target)"
echo "No test email was sent; verify provider/DNS and test delivery separately."
