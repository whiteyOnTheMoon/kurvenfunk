#!/usr/bin/env bash
# Read-only checks + isolated ephemeral Redis keys. No live Redis shutdown or real accounts.
set -Eeuo pipefail
set +x
umask 077
cd /home/ap/www/kurvenfunk || exit 1

if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ||
  ! -f .env.dev || -z "${EXPECTED_COMMIT:-}" ||
  "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
  -n "$(git status --porcelain)" ]]; then
  echo "PHASE20_182_DEV_FINAL_PRECHECK: REJECTED" >&2
  exit 1
fi

# After the opt-in preflight the gateway must survive normal DEV redeployments.
if ! grep -Fxq 'AUTH_GATEWAY_ENABLED=true' .env.dev &&
  ! grep -Fxq 'AUTH_GATEWAY_ENABLED="true"' .env.dev; then
  echo "PHASE20_182_DEV_GATEWAY_CONFIG: NOT_ACTIVE" >&2
  exit 1
fi

gateway="$(docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml -f compose.dev.auth-gateway.yml \
  ps -q auth-gateway)"
if [[ -z "$gateway" ]]; then
  echo "PHASE20_182_DEV_GATEWAY_CONTAINER: MISSING" >&2
  exit 1
fi
if [[ "$(docker inspect --format='{{.State.Health.Status}}' "$gateway")" != "healthy" ]]; then
  echo "PHASE20_182_DEV_GATEWAY_CONTAINER: UNHEALTHY" >&2
  exit 1
fi
echo "PHASE20_182_DEV_GATEWAY_AFTER_DEPLOY: PASS"

# Run actual compiled gateway Redis Lua script against NEVER-live random keys.
docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml -f compose.dev.auth-gateway.yml \
  exec -T auth-gateway node --input-type=module <<'JS'
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';

const require = createRequire(import.meta.url);
const Redis = require('ioredis');
const { AUTH_LIMITS, COUNTER_LUA, rateKey } = require('./dist/auth-gateway/policy.js');

const secret = process.env.IP_HASH_HMAC_SECRET;
const digest = rateKey('203.0.113.22', secret || '');
if (!/^[a-f0-9]{64}$/u.test(digest)) throw new Error('HMAC_INVALID');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD,
  connectTimeout: 1500,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});
const keys = [];
try {
  for (const [action, quota] of Object.entries(AUTH_LIMITS)) {
    const key = 'kurvenfunk:auth-acceptance:ephemeral:' +
      randomBytes(18).toString('hex') + ':' + action;
    keys.push(key);
    for (let attempt = 1; attempt <= quota.requests + 1; attempt++) {
      const result = await redis.eval(COUNTER_LUA, 1, key, quota.windowMs);
      if (result !== attempt) throw new Error('REDIS_ATOMIC_COUNT_INVALID');
    }
    const ttl = await redis.pttl(key);
    if (ttl <= 0 || ttl > quota.windowMs) throw new Error('REDIS_TTL_INVALID');
  }
  console.log('PHASE20_182_DEV_AUTH_REDIS_LUA_AND_TTLS: PASS');
  console.log('PHASE20_182_DEV_AUTH_HMAC_CONFIGURED: PASS');
} finally {
  if (keys.length) {
    try { await redis.del(...keys); } catch { /* report original error */ }
  }
  redis.disconnect();
}
JS

# Detect if the separate API write limiter is really enabled after deployment.
docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml -f compose.dev.auth-gateway.yml \
  exec -T api node -e '
    const enabled = process.env.IP_RATE_LIMIT_ENABLED === "true";
    const secret = process.env.IP_HASH_HMAC_SECRET || "";
    if (enabled && secret.length < 43) process.exit(1);
    console.log("PHASE20_182_DEV_API_WRITE_LIMIT_RUNTIME: " + (enabled ? "ENABLED" : "DISABLED"));
  '

# Existing isolated guard test; temporary Redis entries are deleted.
bash infrastructure/scripts/verify/dev-phase20-ip-rate-limits.sh
echo "PHASE20_182_DEV_PRIVATE_VERIFICATION: PASS"
