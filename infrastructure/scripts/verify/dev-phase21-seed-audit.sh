#!/usr/bin/env bash
# Read-only provenance inspection before any DEV sport-data deletion.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:-}"
cd "$PROJECT_DIR"

if [[ "$(git branch --show-current)" != "develop" || ! -f .env.dev ]]; then
  echo "ERROR: DEV-only checkout and .env.dev are required."
  exit 1
fi
if [[ -n "$EXPECTED_COMMIT" && "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: DEV checkout does not match tested commit."
  exit 1
fi

compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
echo "=== Phase 21 DEV seed audit (read-only; no deletion) ==="
"${compose[@]}" exec -T worker node --input-type=module < infrastructure/scripts/verify/dev-phase21-seed-audit.mjs
