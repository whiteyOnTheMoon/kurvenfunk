#!/usr/bin/env bash
# Read-only cross-module DEV inventory. No cleanup or sensitive values.
set -Eeuo pipefail
set +x
PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?EXPECTED_COMMIT is required}"
cd "$PROJECT_DIR"
if [[ "$(git branch --show-current)" != develop || ! -f .env.dev ]]; then
  echo "ERROR: exact DEV develop checkout and .env.dev required"
  exit 1
fi
if [[ -n "$(git status --porcelain)" || "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: unclean or unexpected DEV checkout"
  exit 1
fi
git fetch -q origin develop
if [[ "$(git rev-parse origin/develop)" != "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: develop advanced; refusing stale inventory"
  exit 1
fi
compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
"${compose[@]}" config --quiet
echo "=== Phase 0-21 read-only DEV data provenance and dependencies ==="
"${compose[@]}" exec -T -e PHASE021_AUDIT_TARGET=DEV worker node --input-type=module \
  < infrastructure/scripts/verify/dev-phase0-21-data-audit.mjs
