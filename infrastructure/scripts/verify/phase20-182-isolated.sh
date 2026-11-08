#!/usr/bin/env bash
# Disposable docker-only acceptance; NEVER stop or fault-inject shared DEV Redis.
set -Eeuo pipefail
set +x
umask 077

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

if [[ "${GITHUB_ACTIONS:-}" != true || "${GITHUB_EVENT_NAME:-}" != pull_request ]]; then
  echo "PHASE20_182_ISOLATED_REQUIRES_PULL_REQUEST_RUNNER" >&2
  exit 1
fi

export IP_HASH_HMAC_SECRET
IP_HASH_HMAC_SECRET="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))")"

project="kf182ci${GITHUB_RUN_ID:-0}"
compose=(docker compose -p "$project" -f infrastructure/tests/phase20-182.compose.yml)
cleanup() {
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

"${compose[@]}" up -d --build --quiet-pull

# Exercise actual compiled gateway HTTP server through the verified
# cloudflared TCP peer, against a disposable Redis and mock Keycloak.
"${compose[@]}" exec -T cloudflared node /opt/phase20-182-test.mjs quotas

# A different Docker TCP peer must not forge CF-Connecting-IP.
"${compose[@]}" exec -T keycloak node --input-type=module <<'JS'
import { request } from 'node:http';

const status = await new Promise((resolve, reject) => {
  const call = request({
    hostname: 'auth-gateway',
    port: 8080,
    path: '/realms/kurvenfunk/protocol/openid-connect/token',
    method: 'POST',
    headers: {
      host: 'auth-dev.kurvenfunk.at',
      'cf-connecting-ip': '198.51.100.20',
    },
    timeout: 8000,
  }, (response) => {
    response.resume();
    response.on('end', () => resolve(response.statusCode));
    response.on('error', reject);
  });
  call.on('error', reject);
  call.on('timeout', () => call.destroy(new Error('CI_HTTP_TIMEOUT')));
  call.end('ci_synthetic=1');
});
if (status !== 503) throw new Error('CI_FORGED_PEER_ACCEPTED');
console.log('PHASE20_182_ISOLATED_FORGED_TCP_PEER: PASS');
JS

"${compose[@]}" stop redis
"${compose[@]}" exec -T cloudflared node /opt/phase20-182-test.mjs outage
"${compose[@]}" start redis
"${compose[@]}" exec -T cloudflared node /opt/phase20-182-test.mjs recovery

# Redis remains running: quota keys must survive an auth-gateway restart.
"${compose[@]}" restart auth-gateway
"${compose[@]}" exec -T cloudflared node /opt/phase20-182-test.mjs restart

echo "PHASE20_182_ISOLATED_FAIL_CLOSED_RECOVERY_RESTART: PASS"
