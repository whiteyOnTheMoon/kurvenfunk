#!/usr/bin/env node
// Controlled DEV-only edge acceptance. No credentials, accounts or session tokens.
import assert from 'node:assert/strict';

const host = 'https://auth-dev.kurvenfunk.at';
const realm = host + '/realms/kurvenfunk';
const deadline = Date.now() + 55_000;

async function request(url, options = {}) {
  return fetch(url, {
    ...options,
    redirect: 'manual',
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
}

function checkWithinBudget() {
  if (Date.now() > deadline) throw new Error('DEV_EDGE_TEST_TIME_BUDGET_EXCEEDED');
}

const discovery = await request(realm + '/.well-known/openid-configuration');
assert.equal(discovery.status, 200, 'DEV_OIDC_DISCOVERY_FAILED');
const metadata = await discovery.json();
assert.equal(metadata.issuer, realm, 'DEV_OIDC_ISSUER_MISMATCH');
assert.equal(
  metadata.authorization_endpoint,
  realm + '/protocol/openid-connect/auth',
  'DEV_OIDC_AUTH_ENDPOINT_MISMATCH',
);
assert.equal(
  metadata.token_endpoint,
  realm + '/protocol/openid-connect/token',
  'DEV_OIDC_TOKEN_ENDPOINT_MISMATCH',
);
console.log('PHASE20_182_DEV_PUBLIC_OIDC: PASS');

const health = await request(host + '/_gateway/health');
assert.equal(health.status, 503, 'DEV_GATEWAY_HEALTH_EXPOSED_TO_INTERNET');
console.log('PHASE20_182_DEV_PUBLIC_GATEWAY_HEALTH_IS_PRIVATE: PASS');

// Synthetic invalid OAuth client: no Keycloak user, password, token or email.
// At most 33 attempts; do not affect any real account or change any settings.
const postOptions = {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: 'kurvenfunk-phase20-182-nonexistent',
    grant_type: 'client_credentials',
  }),
};
let rateLimited = false;
let allowedErrorCount = 0;
for (let attempt = 1; attempt <= 33; attempt += 1) {
  checkWithinBudget();
  const response = await request(metadata.token_endpoint, postOptions);
  if (response.status === 429) {
    assert.equal((await response.text()).trim(), 'Too many requests', 'UNEXPECTED_RATE_RESPONSE');
    rateLimited = true;
    break;
  }
  if (![400, 401, 403].includes(response.status)) {
    throw new Error('UNEXPECTED_SYNTHETIC_TOKEN_RESPONSE_' + response.status);
  }
  allowedErrorCount += 1;
}
assert.equal(rateLimited, true, 'DEV_PUBLIC_TOKEN_RATE_LIMIT_NOT_PROVEN');
assert.ok(allowedErrorCount >= 1, 'NO_UNLIMITED_TOKEN_RESPONSE_OBSERVED');
console.log('PHASE20_182_DEV_PUBLIC_TOKEN_HTTP_429: PASS');

// A forged external CF-Connecting-IP must NOT obtain a fresh quota.
// A Cloudflare 403 is also a safe explicit edge rejection.
checkWithinBudget();
const forged = await request(metadata.token_endpoint, {
  ...postOptions,
  headers: {
    ...postOptions.headers,
    'cf-connecting-ip': '198.51.100.44',
    'x-forwarded-for': '198.51.100.44',
  },
});
if (forged.status === 429) {
  assert.equal((await forged.text()).trim(), 'Too many requests');
} else if (forged.status !== 403) {
  throw new Error('DEV_PUBLIC_FORGED_IP_BYPASSED_QUOTA_' + forged.status);
}
console.log('PHASE20_182_DEV_PUBLIC_FORGED_CLIENT_IP_BLOCKED: PASS');
console.log('PHASE20_182_DEV_EDGE_ACCEPTANCE: PASS');
