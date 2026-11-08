#!/usr/bin/env bash
# Read-only DEV runtime readiness for the final bounded public quota checks.
set -Eeuo pipefail
set +x
cd /home/ap/www/kurvenfunk || exit 1

if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ||
  -z "${EXPECTED_COMMIT:-}" || "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
  -n "$(git status --porcelain)" || ! -f .env.dev ]]; then
  echo "PHASE20_182_FINAL_PRECHECK: REJECTED" >&2
  exit 1
fi

if ! grep -Fxq 'AUTH_GATEWAY_ENABLED=true' .env.dev &&
  ! grep -Fxq 'AUTH_GATEWAY_ENABLED="true"' .env.dev; then
  echo "PHASE20_182_FINAL_GATEWAY: DISABLED" >&2
  exit 1
fi

compose=(docker compose -p kurvenfunk-dev --env-file .env.dev
  -f compose.yml -f compose.dev.yml -f compose.dev.auth-gateway.yml)
"${compose[@]}" config --quiet

"${compose[@]}" exec -T api node -e '
  const ok = process.env.IP_RATE_LIMIT_ENABLED === "true";
  if (!ok) process.exit(1);
  const key = process.env.IP_HASH_HMAC_SECRET || "";
  if (Buffer.from(key, "base64url").length < 32) process.exit(1);
  console.log("PHASE20_182_FINAL_API_RUNTIME: PASS");
'

gateway="$("${compose[@]}" ps -q auth-gateway)"
if [[ -z "$gateway" ||
  "$(docker inspect --format='{{.State.Health.Status}}' "$gateway")" != healthy ]]; then
  echo "PHASE20_182_FINAL_AUTH_GATEWAY: UNHEALTHY" >&2
  exit 1
fi

echo "PHASE20_182_FINAL_AUTH_GATEWAY: PASS"
