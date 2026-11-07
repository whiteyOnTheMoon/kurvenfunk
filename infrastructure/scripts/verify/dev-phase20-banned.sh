#!/usr/bin/env bash
# DEV-only Task 180 acceptance. Creates and removes synthetic Keycloak/DB test users.
set -Eeuo pipefail
set +x
umask 077

cd /home/ap/www/kurvenfunk || exit 1

if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ]]; then
  echo "PHASE20_180_DEV_PRECHECK: WRONG_CHECKOUT" >&2
  exit 1
fi

if [[ ! -f .env.dev || -z "$EXPECTED_COMMIT" ||
      "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
      -n "$(git status --porcelain)" ]]; then
  echo "PHASE20_180_DEV_PRECHECK: COMMIT_OR_ENV_MISMATCH" >&2
  exit 1
fi

if [[ "$(stat -c %a .env.dev)" != 600 ]]; then
  echo "PHASE20_180_DEV_PRECHECK: ENV_PERMISSIONS" >&2
  exit 1
fi

docker compose \
  -p kurvenfunk-dev \
  --env-file .env.dev \
  -f compose.yml \
  -f compose.dev.yml \
  exec -T api node --input-type=module < \
    infrastructure/scripts/verify/dev-phase20-banned.mjs
