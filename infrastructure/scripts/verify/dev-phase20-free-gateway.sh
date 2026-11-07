#!/usr/bin/env bash
# DEV-only preflight: prepare and verify the optional Keycloak auth gateway.
# This does NOT modify the managed Cloudflare Tunnel route.
set -Eeuo pipefail
set +x
umask 077

cd /home/ap/www/kurvenfunk || exit 1
if [[ "$(id -un)" != "ap" || "$(git branch --show-current)" != "develop" ||
  -z "\${EXPECTED_COMMIT:-}" || "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
  -n "$(git status --porcelain)" || ! -f .env.dev ]]; then
  echo "PHASE20_182_FREE_DEV_PRECHECK: REJECTED" >&2
  exit 1
fi

if [[ "$(stat -c %a .env.dev)" != "600" ]]; then
  echo "PHASE20_182_FREE_DEV_ENV_PERMISSIONS: REJECTED" >&2
  exit 1
fi

backup="$(mktemp /tmp/kurvenfunk-auth-gateway-env.XXXXXX)"
cp -p .env.dev "$backup"
completed=false

rollback() {
  if [[ "$completed" != "true" ]]; then
    cp -p "$backup" .env.dev
    docker compose -p kurvenfunk-dev --env-file .env.dev \
      -f compose.yml -f compose.dev.yml -f compose.dev.auth-gateway.yml \
      stop auth-gateway >/dev/null 2>&1 || true
    docker compose -p kurvenfunk-dev --env-file .env.dev \
      -f compose.yml -f compose.dev.yml -f compose.dev.auth-gateway.yml \
      rm -sf auth-gateway >/dev/null 2>&1 || true
    echo "PHASE20_182_FREE_DEV_PREFLIGHT: ROLLED_BACK" >&2
  fi
  rm -f "$backup"
}
trap rollback EXIT

node --input-type=module <<'JS'
import { randomBytes } from 'node:crypto';
import { readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';

const envFile = '.env.dev';
let input = readFileSync(envFile, 'utf8');
if ((statSync(envFile).mode & 0o077) !== 0) throw new Error('ENV_NOT_PRIVATE');
const get = (name) => {
  const lines = input.split('\n').filter(line => line.startsWith(name + '='));
  if (lines.length > 1) throw new Error('DUPLICATE_DEV_ENV_KEY');
  if (!lines.length) return null;
  const raw = lines[0].slice(name.length + 1).trim();
  if ((raw.startsWith("'") && raw.endsWith("'")) ||
      (raw.startsWith('"') && raw.endsWith('"'))) return raw.slice(1, -1);
  return raw;
};
const currentSecret = get('IP_HASH_HMAC_SECRET');
const secretPattern = /^[A-Za-z0-9_-]{43,128}$/;
if (currentSecret) {
  const decoded = Buffer.from(currentSecret, 'base64url');
  if (!secretPattern.test(currentSecret) || decoded.length < 32 ||
      decoded.toString('base64url') !== currentSecret) {
    throw new Error('INVALID_EXISTING_HMAC_SECRET');
  }
}
const newSecret = currentSecret || randomBytes(32).toString('base64url');
function assign(name, value) {
  const lines = input.split('\n');
  const index = lines.findIndex(line => line.startsWith(name + '='));
  if (index >= 0) lines[index] = name + '=' + value;
  else lines.push(name + '=' + value);
  input = lines.join('\n');
}
assign('IP_HASH_HMAC_SECRET', newSecret);
assign('AUTH_GATEWAY_ENABLED', 'true');
const temp = envFile + '.phase20-182.tmp';
writeFileSync(temp, input.endsWith('\n') ? input : input + '\n', { mode: 0o600, flag: 'wx' });
renameSync(temp, envFile);
console.log('PHASE20_182_FREE_DEV_CONFIG: READY (secret never printed)');
JS

docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml -f compose.dev.auth-gateway.yml \
  config --quiet

docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml -f compose.dev.auth-gateway.yml \
  up -d --no-deps --build auth-gateway

gateway="$(docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml -f compose.dev.auth-gateway.yml \
  ps -q auth-gateway)"
if [[ -z "$gateway" ]]; then
  echo "PHASE20_182_FREE_DEV_GATEWAY: NOT_STARTED" >&2
  exit 1
fi

for attempt in $(seq 1 30); do
  status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$gateway")"
  if [[ "$status" == healthy ]]; then break; fi
  if [[ "$status" == unhealthy || "$status" == exited || "$status" == dead ]]; then
    echo "PHASE20_182_FREE_DEV_GATEWAY: UNHEALTHY" >&2
    exit 1
  fi
  sleep 2
done
[[ "$status" == healthy ]] || { echo "PHASE20_182_FREE_DEV_GATEWAY: TIMEOUT" >&2; exit 1; }

# API lives on the Docker backend but is NOT the cloudflared tunnel TCP peer.
# This must reject forged CF metadata before any forwarding to Keycloak.
docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml -f compose.dev.auth-gateway.yml \
  exec -T api node --input-type=module <<'JS'
const url = 'http://auth-gateway:8080/realms/kurvenfunk/.well-known/openid-configuration';
const response = await fetch(url, {
  headers: { host: 'auth-dev.kurvenfunk.at', 'cf-connecting-ip': '203.0.113.22' },
  signal: AbortSignal.timeout(3000),
});
if (response.status !== 503) throw new Error('FORGED_PEER_HEADER_NOT_REJECTED');
console.log('PHASE20_182_FREE_DEV_UNTRUSTED_PEER: PASS');
JS

completed=true
echo "PHASE20_182_FREE_DEV_GATEWAY_PREFLIGHT: PASS (not publicly routed)"
