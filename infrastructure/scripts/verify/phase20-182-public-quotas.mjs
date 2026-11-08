#!/usr/bin/env node
// One-shot guarded, bounded DEV-only check. Never use real credentials or accounts.
import assert from 'node:assert/strict';

if (process.env.GITHUB_ACTIONS !== 'true' || process.env.GITHUB_REF !== 'refs/heads/develop') {
  throw new Error('PHASE20_182_PUBLIC_TEST_REQUIRES_DEV_WORKFLOW');
}

const auth = 'https://auth-dev.kurvenfunk.at';
const api = 'https://api-dev.kurvenfunk.at';
const authRealm = auth + '/realms/kurvenfunk';
const syntheticId = '00000000-0000-4000-8000-000000000001';
const deadline = Date.now() + 130_000;
const accepted = new Set([200, 302, 303, 400, 401, 403, 404, 405, 422]);

async function request(url, method = 'GET', body = undefined) {
  if (Date.now() > deadline) throw new Error('PHASE20_182_PUBLIC_BUDGET_EXCEEDED');
  const response = await fetch(url, {
    method,
    ...(method === 'POST'
      ? {
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: body ?? 'ci_test=synthetic_only',
        }
      : {}),
    cache: 'no-store',
    redirect: 'manual',
    signal: AbortSignal.timeout(8000),
  });
  return { status: response.status, body: await response.text() };
}

assert.equal((await request(authRealm + '/.well-known/openid-configuration')).status, 200);
assert.equal((await request(api + '/api/v1/health/live')).status, 200);

// Requests have NO credentials or session cookies. They never create accounts,
// send reset emails, modify comments or submit real reports. The global IP
// guard must reject the first request over the category-specific threshold.
const profiles = [
  ['login', authRealm + '/login-actions/authenticate', 10, 'gateway'],
  ['register', authRealm + '/login-actions/registration', 3, 'gateway'],
  ['reset', authRealm + '/login-actions/reset-credentials', 3, 'gateway'],
  ['reports', api + '/api/v1/comments/' + syntheticId + '/reports', 10, 'api'],
  ['comments', api + '/api/v1/articles/' + syntheticId + '/comments', 30, 'api'],
];

for (const [category, url, limit, destination] of profiles) {
  let acceptedCount = 0;
  let blocked = false;
  for (let attempt = 1; attempt <= limit + 1; attempt += 1) {
    const result = await request(url, 'POST');
    if (result.status === 429) {
      assert.equal(attempt, limit + 1, category + '_EARLY_429');
      if (destination === 'gateway') {
        assert.equal(result.body.trim(), 'Too many requests', category + '_WRONG_429_SOURCE');
      } else {
        assert.match(result.body, /IP_RATE_LIMIT_EXCEEDED/u, category + '_WRONG_429_SOURCE');
      }
      blocked = true;
      break;
    }
    assert.ok(accepted.has(result.status), category + '_UNEXPECTED_HTTP_' + result.status);
    acceptedCount += 1;
  }
  assert.equal(acceptedCount, limit, category + '_LIMIT_NOT_REACHED');
  assert.equal(blocked, true, category + '_NO_429');
  console.log('PHASE20_182_PUBLIC_' + category.toUpperCase() + '_HTTP_429: PASS');
}

assert.equal((await request(authRealm + '/.well-known/openid-configuration')).status, 200);
assert.equal((await request(api + '/api/v1/health/live')).status, 200);
console.log('PHASE20_182_PUBLIC_UNRELATED_GET: PASS');
console.log('PHASE20_182_PUBLIC_QUOTAS: PASS (synthetic unauthenticated requests only)');
