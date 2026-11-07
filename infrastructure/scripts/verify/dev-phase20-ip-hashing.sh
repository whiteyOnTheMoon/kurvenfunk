#!/usr/bin/env bash
# Task 181 – DEV only. Runtime HMAC verification using ephemeral keys in memory.
set -Eeuo pipefail
set +x
umask 077

cd /home/ap/www/kurvenfunk || exit 1

if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ]]; then
  echo "PHASE20_181_DEV_PRECHECK: WRONG_CHECKOUT" >&2
  exit 1
fi

if [[ ! -f .env.dev || -z "${EXPECTED_COMMIT:-}" ||
      "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
      -n "$(git status --porcelain)" ]]; then
  echo "PHASE20_181_DEV_PRECHECK: COMMIT_OR_ENV_MISMATCH" >&2
  exit 1
fi

if [[ "$(stat -c %a .env.dev)" != 600 ]]; then
  echo "PHASE20_181_DEV_PRECHECK: ENV_PERMISSIONS" >&2
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
const { IpIdentityService } = require('./dist/modules/bans/ip-identity.service.js');

const current = randomBytes(32).toString('base64url');
const previous = randomBytes(32).toString('base64url');
const config = {
  get(key, fallback) {
    const values = {
      IP_HASH_HMAC_SECRET: current,
      IP_HASH_KEY_VERSION: 'v2',
      IP_HASH_PREVIOUS_KEYS_JSON: JSON.stringify({ v1: previous }),
    };
    return values[key] ?? fallback;
  },
};
const service = new IpIdentityService(config);
function assert(condition, code) {
  if (!condition) throw new Error(code);
}
const first = service.hash('203.0.113.22');
assert(service.isConfigured, 'HMAC_CONFIG_UNAVAILABLE');
assert(first.hashKeyVersion === 'v2', 'HMAC_VERSION_MISMATCH');
assert(/^[a-f0-9]{64}$/.test(first.ipHash), 'HMAC_DIGEST_INVALID');
assert(JSON.stringify(first).indexOf('203.0.113.22') === -1, 'HMAC_RAW_IP_LEAK');
assert(service.hash('::ffff:203.0.113.22').ipHash === first.ipHash, 'HMAC_MAPPED_IP_MISMATCH');
assert(service.candidateHashes('203.0.113.22').length === 2, 'HMAC_ROTATION_MISMATCH');
assert(service.hash('2001:0db8:0:0:0:0:0:1').ipHash ===
  service.hash('2001:db8::1').ipHash, 'HMAC_IPV6_MISMATCH');
let rejected = false;
try {
  service.hash('203.0.113.22, 192.0.2.7');
} catch {
  rejected = true;
}
assert(rejected, 'HMAC_UNTRUSTED_HEADER_ACCEPTED');
console.log('PHASE20_181_DEV_HMAC: PASS (ephemeral keys, no persisted IP data)');
JS
