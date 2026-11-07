#!/usr/bin/env bash
# One-shot DEV-only API write-rate activation, with automatic env/service rollback.
# No secrets or real IP addresses are printed. Cloudflare route is untouched.
set -Eeuo pipefail
set +x
umask 077
cd /home/ap/www/kurvenfunk || exit 1

if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ||
  ! -f .env.dev || -z "${EXPECTED_COMMIT:-}" ||
  "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
  -n "$(git status --porcelain)" ]]; then
  echo "PHASE20_182_API_ENABLE_PRECHECK: REJECTED" >&2
  exit 1
fi

if ! grep -Fxq 'AUTH_GATEWAY_ENABLED=true' .env.dev &&
  ! grep -Fxq 'AUTH_GATEWAY_ENABLED="true"' .env.dev; then
  echo "PHASE20_182_API_ENABLE_GATEWAY_NOT_ENABLED" >&2
  exit 1
fi

compose=(docker compose -p kurvenfunk-dev --env-file .env.dev
  -f compose.yml -f compose.dev.yml -f compose.dev.auth-gateway.yml)
backup="$(mktemp /tmp/kurvenfunk-dev-api-rate-env.XXXXXX)"
cp -p .env.dev "$backup"
complete=false

rollback() {
  if [[ "$complete" != "true" ]]; then
    cp -p "$backup" .env.dev
    "${compose[@]}" up -d --no-deps --force-recreate api >/dev/null 2>&1 ||
      echo "PHASE20_182_API_ENABLE_ROLLBACK_REQUIRES_OPERATOR" >&2
    echo "PHASE20_182_API_ENABLE: ROLLED_BACK" >&2
  fi
  rm -f "$backup"
}
trap rollback EXIT

node --input-type=module <<'JS'
import { readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';

const file = '.env.dev';
const raw = readFileSync(file, 'utf8');
if ((statSync(file).mode & 0o077) !== 0) throw new Error('DEV_ENV_NOT_PRIVATE');
const lines = raw.split('\n');
function read(name) {
  const matching = lines.filter((line) => line.startsWith(name + '='));
  if (matching.length > 1) throw new Error('DEV_ENV_DUPLICATE_KEY');
  if (!matching.length) return null;
  return matching[0].slice(name.length + 1).replace(/^["']|["']$/g, '');
}
const secret = read('IP_HASH_HMAC_SECRET');
if (typeof secret !== 'string' || !/^[A-Za-z0-9_-]{43,128}$/.test(secret)) {
  throw new Error('DEV_API_HMAC_NOT_CONFIGURED');
}
const key = Buffer.from(secret, 'base64url');
if (key.length < 32 || key.toString('base64url') !== secret) {
  throw new Error('DEV_API_HMAC_INVALID');
}
const flag = read('IP_RATE_LIMIT_ENABLED');
if (flag && flag !== 'false' && flag !== 'true') {
  throw new Error('DEV_API_RATE_LIMIT_FLAG_INVALID');
}
const index = lines.findIndex((line) => line.startsWith('IP_RATE_LIMIT_ENABLED='));
if (index >= 0) lines[index] = 'IP_RATE_LIMIT_ENABLED=true';
else lines.push('IP_RATE_LIMIT_ENABLED=true');
const target = file + '.phase20-182-api.tmp';
const output = lines.join('\n');
writeFileSync(target, output.endsWith('\n') ? output : output + '\n', {
  flag: 'wx', mode: 0o600,
});
renameSync(target, file);
console.log('PHASE20_182_DEV_API_RATE_LIMIT_FLAG: CONFIGURED');
JS

"${compose[@]}" config --quiet
"${compose[@]}" up -d --no-deps --force-recreate api

api="$("${compose[@]}" ps -q api)"
if [[ -z "$api" ]]; then
  echo "PHASE20_182_DEV_API_CONTAINER: MISSING" >&2
  exit 1
fi
health=""
for attempt in $(seq 1 30); do
  health="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$api")"
  if [[ "$health" == healthy ]]; then break; fi
  if [[ "$health" == unhealthy || "$health" == exited || "$health" == dead ]]; then
    echo "PHASE20_182_DEV_API_CONTAINER: UNHEALTHY" >&2
    exit 1
  fi
  sleep 2
done
if [[ "$health" != healthy ]]; then
  echo "PHASE20_182_DEV_API_CONTAINER: HEALTH_TIMEOUT" >&2
  exit 1
fi

"${compose[@]}" exec -T api node --input-type=module <<'JS'
import assert from 'node:assert/strict';
assert.equal(process.env.IP_RATE_LIMIT_ENABLED, 'true');
const secret = process.env.IP_HASH_HMAC_SECRET || '';
assert.ok(Buffer.from(secret, 'base64url').length >= 32);
console.log('PHASE20_182_DEV_API_WRITE_LIMIT_RUNTIME: ENABLED');
JS

# Synthetic guard and ephemeral Redis entries, no real identities or accounts.
EXPECTED_COMMIT="$EXPECTED_COMMIT" bash infrastructure/scripts/verify/dev-phase20-ip-rate-limits.sh

# Confirm public API health and a protected unauthenticated operation.
# No authorization bearer token, so no report or comment can be persisted.
node --input-type=module <<'JS'
const health = await fetch('https://api-dev.kurvenfunk.at/api/v1/health/live', {
  signal: AbortSignal.timeout(8000),
});
if (health.status !== 200) throw new Error('DEV_PUBLIC_API_HEALTH_FAILED');
const response = await fetch(
  'https://api-dev.kurvenfunk.at/api/v1/comments/00000000-0000-4000-8000-000000000001/reports',
  {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(8000),
  },
);
if (![400, 401, 403, 404, 405, 422].includes(response.status)) {
  throw new Error('DEV_PROTECTED_UNAUTHENTICATED_HTTP_' + response.status);
}
console.log('PHASE20_182_DEV_API_PUBLIC_READ_AND_UNAUTHENTICATED_WRITE: PASS');
JS

complete=true
echo "PHASE20_182_DEV_API_WRITE_LIMIT_ACTIVATION: PASS"
