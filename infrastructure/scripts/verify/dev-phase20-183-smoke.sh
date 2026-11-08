#!/usr/bin/env bash
# Task 20.183 – guarded, non-mutating DEV runtime acceptance.
# Uses temporary HMAC identity, disposable Redis keys and read-only database lookup.
set -Eeuo pipefail
set +x
umask 077

cd /home/ap/www/kurvenfunk || exit 1

if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ]]; then
  echo "PHASE20_183_DEV_PRECHECK: WRONG_CHECKOUT" >&2
  exit 1
fi

if [[ ! -f .env.dev || -z "${EXPECTED_COMMIT:-}" ||
      "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
      -n "$(git status --porcelain)" ]]; then
  echo "PHASE20_183_DEV_PRECHECK: COMMIT_OR_ENV_MISMATCH" >&2
  exit 1
fi

if [[ "$(stat -c %a .env.dev)" != 600 ]]; then
  echo "PHASE20_183_DEV_PRECHECK: ENV_PERMISSIONS" >&2
  exit 1
fi

docker compose \
  -p kurvenfunk-dev \
  --env-file .env.dev \
  -f compose.yml \
  -f compose.dev.yml \
  exec -T api node --input-type=module <<'JS'
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
const require = createRequire(import.meta.url);
const Redis = require('ioredis');
const { IpIdentityService } = require('./dist/modules/bans/ip-identity.service.js');
const { TemporaryIpBlockService } = require('./dist/modules/bans/temporary-ip-block.service.js');
const { AUTO_ESCALATION_LUA } = require('./dist/modules/bans/ip-rate-limit.guard.js');

const assert = (valid) => { if (!valid) throw new Error('DEV_SMOKE_CHECK_FAILED'); };
const temporarySecret = randomBytes(32).toString('base64url');
const config = {
  get(key, fallback) {
    const synthetic = {
      IP_HASH_HMAC_SECRET: temporarySecret,
      IP_HASH_KEY_VERSION: 'v1',
      IP_HASH_PREVIOUS_KEYS_JSON: '',
    };
    return synthetic[key] ?? fallback;
  },
};
const identity = new IpIdentityService(config);
const blocks = new TemporaryIpBlockService(identity);
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 1500,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});
const key = 'kurvenfunk:ip-block:dev-smoke:' + randomBytes(16).toString('hex');
let failed = false;
try {
  // No real traffic can be blocked by this smoke; both flags stay disabled.
  assert(process.env.IP_TEMP_BLOCK_ENABLED !== 'true');
  assert(process.env.IP_TEMP_AUTO_BLOCK_ENABLED !== 'true');
  assert(identity.isConfigured);
  const syntheticAddress = '192.0.2.183';
  const hashed = identity.hash(syntheticAddress);
  assert(hashed.ipHash.length === 64 && hashed.hashKeyVersion === 'v1');
  assert(!JSON.stringify(hashed).includes(syntheticAddress));

  // Only a SELECT using a fresh temporary HMAC key: no real user is targeted.
  assert((await blocks.findActive(syntheticAddress)) === null);

  await redis.connect();
  const event = (timestamp) => redis.eval(
    AUTO_ESCALATION_LUA, 2, key, key + ':once',
    timestamp, 30 * 60_000, Math.floor(timestamp / 60_000), 1800,
  );
  const start = Math.floor(Date.now() / 60_000) * 60_000 - 3 * 60_000;
  assert((await event(start)) === 0);
  assert((await event(start + 1000)) === 0); // Same minute is not a new violation.
  assert((await event(start + 60_000)) === 0);
  assert((await event(start + 120_000)) === 1);
  assert((await event(start + 121_000)) === 0); // At most one escalation.
  assert((await redis.pttl(key)) > 0);
} catch {
  failed = true;
} finally {
  try {
    if (redis.status === 'ready') await redis.del(key, key + ':once');
  } catch {
    failed = true;
  } finally {
    redis.disconnect();
    try { await blocks.onModuleDestroy(); } catch { failed = true; }
  }
}
if (failed) {
  console.error('PHASE20_183_DEV_SMOKE: FAIL (no user changes)');
  process.exitCode = 1;
} else {
  console.log('PHASE20_183_DEV_SMOKE: PASS (synthetic HMAC, Redis cleaned, DB read-only, flags off)');
}
JS
