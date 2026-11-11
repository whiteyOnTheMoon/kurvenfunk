#!/usr/bin/env bash
# DEV-only, exact-SHA, read-only analysis of all MinIO buckets and Redis key classes.
set -Eeuo pipefail
set +x
umask 077
PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?SHA required}"
[[ "${DEV_STORAGE_AUDIT_TARGET:-}" == DEV ]] || { echo 'ERROR: DEV_STORAGE_AUDIT_ONLY'; exit 1; }
cd "$PROJECT_DIR"
[[ -f .env.dev && ! -L .env.dev && "$(git branch --show-current)" == develop ]] || {
  echo 'ERROR: DEV_STORAGE_CHECKOUT_REQUIRED'; exit 1;
}
[[ -z "$(git status --porcelain)" && "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" ]] || {
  echo 'ERROR: DEV_STORAGE_HEAD_MISMATCH'; exit 1;
}
git fetch -q origin develop
[[ "$(git rev-parse origin/develop)" == "$EXPECTED_COMMIT" ]] || {
  echo 'ERROR: DEV_STORAGE_REMOTE_MOVED'; exit 1;
}
exec 9>/tmp/kurvenfunk-dev-deploy.lock
flock -n 9 || { echo 'ERROR: DEV_DEPLOY_BUSY'; exit 1; }
exec 8>/tmp/kurvenfunk-dev-full-application-reset.lock
flock -n 8 || { echo 'ERROR: DEV_APP_RESET_BUSY'; exit 1; }
exec 6>/tmp/kurvenfunk-dev-residual-reset.lock
flock -n 6 || { echo 'ERROR: DEV_RESIDUAL_RESET_BUSY'; exit 1; }
compose=(docker compose -p kurvenfunk-dev --env-file .env.dev -f compose.yml -f compose.dev.yml)
"${compose[@]}" config --quiet

# Keys flow through a private local process pipeline. Never print key names.
"${compose[@]}" exec -T redis sh -ec \
  'REDISCLI_AUTH="$REDIS_PASSWORD" exec redis-cli --scan' |
  python3 -c '
import sys
keys=[line.rstrip("\r\n") for line in sys.stdin]
bull=sum(s.startswith("bull:") for s in keys)
rate=sum("ratelimit" in s.lower() or "rate-limit" in s.lower() for s in keys if not s.startswith("bull:"))
other=len(keys)-bull-rate
print("DEV_REDIS_SCAN_KEYS="+str(len(keys)))
print("DEV_REDIS_BULLMQ_KEYS="+str(bull))
print("DEV_REDIS_RATE_KEYS="+str(rate))
print("DEV_REDIS_OTHER_KEYS="+str(other))
'
size="$("${compose[@]}" exec -T redis sh -ec 'REDISCLI_AUTH="$REDIS_PASSWORD" exec redis-cli --raw DBSIZE' | tr -d '\r')"
[[ "$size" =~ ^[0-9]+$ ]] || { echo 'ERROR: INVALID_DEV_REDIS_COUNT'; exit 1; }
echo "DEV_REDIS_DBSIZE=$size"

# Only the local DEV MinIO endpoint is accepted by the Node verifier.
"${compose[@]}" exec -T api node --input-type=module - \
  < infrastructure/scripts/verify/dev-minio-deep-readonly.mjs
echo 'DEV_STORAGE_CACHE_AUDIT=PASS_READ_ONLY'
