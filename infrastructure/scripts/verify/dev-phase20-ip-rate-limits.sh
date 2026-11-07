#!/usr/bin/env bash
# DEV-only Task 182: synthetic HTTP guard and Redis-rate smoke test.
set -Eeuo pipefail
set +x
umask 077
cd /home/ap/www/kurvenfunk || exit 1

if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ||
  ! -f .env.dev || -z "${EXPECTED_COMMIT:-}" ||
  "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
  -n "$(git status --porcelain)" ]]; then
  echo "PHASE20_182_DEV_PRECHECK: REJECTED" >&2
  exit 1
fi

docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml exec -T api node --input-type=module <<'JS'
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { lookup } from 'node:dns/promises';

const require = createRequire(import.meta.url);
const Redis = require('ioredis');
const { IpIdentityService } = require('./dist/modules/bans/ip-identity.service.js');
const { IpRateLimitGuard } = require('./dist/modules/bans/ip-rate-limit.guard.js');
const { TrustedClientIpService } = require('./dist/modules/bans/trusted-client-ip.service.js');

const secret = randomBytes(32).toString('base64url');
const config = {
  get: (key, fallback) => ({
    IP_HASH_HMAC_SECRET: secret,
    IP_HASH_KEY_VERSION: 'v1',
    IP_RATE_LIMIT_ENABLED: 'true',
    REDIS_HOST: process.env.REDIS_HOST || 'redis',
    REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  })[key] ?? fallback,
  getOrThrow(key) {
    if (key !== 'REDIS_PASSWORD' || !process.env.REDIS_PASSWORD) {
      throw new Error('REDIS_TEST_CONFIG_MISSING');
    }
    return process.env.REDIS_PASSWORD;
  },
};
function check(assertion, code) {
  if (!assertion) throw new Error(code);
}
const ip = new IpIdentityService(config);
const trust = new TrustedClientIpService();
const peers = await lookup('cloudflared', { all: true });
check(peers.length > 0, 'CLOUDFLARED_DEV_DNS_MISSING');
const fakeRequest = {
  headers: { 'cf-connecting-ip': '203.0.113.22' },
  socket: { remoteAddress: '127.0.0.1' },
};
check((await trust.fromRequest(fakeRequest)) === null, 'HOST_FORGED_CF_HEADER_ACCEPTED');
const validTestRequest = {
  headers: { 'cf-connecting-ip': '203.0.113.22' },
  socket: { remoteAddress: peers[0].address },
};
check((await trust.fromRequest(validTestRequest)) === '203.0.113.22', 'TUNNEL_PEER_RESOLUTION_FAILED');

const guard = new IpRateLimitGuard(ip, {
  async fromRequest() { return '203.0.113.22'; },
}, config);
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 1,
});
const hashed = ip.hash('203.0.113.22');
const key = ['kurvenfunk:ip-write-rate:v1', hashed.hashKeyVersion,
  'reports', hashed.ipHash].join(':');
const context = {
  switchToHttp() {
    return { getRequest: () => ({
      method: 'POST',
      originalUrl: '/api/v1/comments/00000000-0000-4000-8000-000000000001/reports',
    }) };
  },
};
let passed = false;
try {
  for (let i = 0; i < 10; i++) {
    check(await guard.canActivate(context), 'RATE_ALLOWED_REQUEST_REJECTED');
  }
  try {
    await guard.canActivate(context);
    throw new Error('RATE_ELEVENTH_REQUEST_ALLOWED');
  } catch (err) {
    check(err.status === 429, 'RATE_REJECTION_WRONG_STATUS');
  }
  check((await redis.pttl(key)) > 0, 'RATE_TTL_MISSING');
  passed = true;
} finally {
  await redis.del(key);
  await redis.quit();
  guard.onModuleDestroy();
}
check(passed, 'RATE_SMOKE_INCOMPLETE');
console.log('PHASE20_182_DEV_API_REDIS: PASS (synthetic IP and ephemeral HMAC)');
JS
