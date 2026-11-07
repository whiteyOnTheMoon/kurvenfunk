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
  "${compose[@]}" exec -T keycloak sh -ec '
    : "${KC_BOOTSTRAP_ADMIN_USERNAME:?}"
    : "${KC_BOOTSTRAP_ADMIN_PASSWORD:?}"
    /opt/keycloak/bin/kcadm.sh config credentials \
      --server http://127.0.0.1:8080 \
      --realm master \
      --user "$KC_BOOTSTRAP_ADMIN_USERNAME" \
      --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" >/dev/null 2>&1
  ' || { echo "KEYCLOAK_MAIL_ADMIN_AUTH_FAILED" >&2; return 1; }
}
authenticate

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
