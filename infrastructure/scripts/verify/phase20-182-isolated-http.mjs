// Runs ONLY inside the disposable cloudflared CI container.
// No real Keycloak, accounts, mail, domains, user identities or production data.
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';

const host = 'auth-dev.kurvenfunk.at';
const base = 'http://auth-gateway:8080/realms/kurvenfunk';
const ip = '192.0.2.42';

async function probe(path, address = ip, method = 'POST', requestHost = host) {
  return new Promise((resolve, reject) => {
    const incoming = httpRequest(
      {
        hostname: 'auth-gateway',
        port: 8080,
        path: '/realms/kurvenfunk' + path,
        method,
        headers: {
          host: requestHost,
          'cf-connecting-ip': address,
          ...(method === 'POST' ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
        },
        timeout: 8000,
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            status: response.statusCode,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
        response.on('error', reject);
      },
    );
    incoming.on('error', reject);
    incoming.on('timeout', () => incoming.destroy(new Error('CI_HTTP_TIMEOUT')));
    incoming.end(method === 'POST' ? 'ci_synthetic=1' : undefined);
  });
}

async function waitForGateway() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      if ((await probe('/.well-known/openid-configuration', ip, 'GET')).status === 200) {
        return;
      }
    } catch {
      // The isolated gateway may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error('CI_GATEWAY_NOT_READY');
}

const stage = process.argv[2];
if (!['quotas', 'outage', 'recovery', 'restart'].includes(stage)) {
  throw new Error('CI_ISOLATED_STAGE_INVALID');
}
await waitForGateway();

if (stage === 'quotas') {
  const profiles = [
    ['login', '/login-actions/authenticate', 10],
    ['register', '/login-actions/registration', 3],
    ['reset', '/login-actions/reset-credentials', 3],
    ['token', '/protocol/openid-connect/token', 30],
  ];
  for (const [name, path, allowed] of profiles) {
    for (let attempt = 1; attempt <= allowed; attempt += 1) {
      const result = await probe(path);
      assert.equal(result.status, 200, name + '_PREMATURE_REJECTION_' + attempt);
    }
    const denied = await probe(path);
    assert.equal(denied.status, 429, name + '_NOT_RATE_LIMITED');
    assert.equal(denied.body, 'Too many requests', name + '_REJECTION_NOT_FROM_GATEWAY');
  }

  const wrongHost = await probe(
    '/protocol/openid-connect/token',
    ip,
    'POST',
    'invalid.example',
  );
  assert.equal(wrongHost.status, 503, 'HOST_REWRITE_NOT_ENFORCED');
  assert.equal((await probe('/.well-known/openid-configuration', ip, 'GET')).status, 200);
  console.log('PHASE20_182_ISOLATED_HTTP_ALL_FOUR_429: PASS');
}

if (stage === 'outage') {
  const rejected = await probe('/login-actions/registration', '192.0.2.77');
  assert.equal(rejected.status, 503, 'REDIS_OUTAGE_NOT_FAIL_CLOSED');
  assert.equal(rejected.body, 'Service unavailable');
  assert.equal(
    (await probe('/.well-known/openid-configuration', '192.0.2.77', 'GET')).status,
    200,
    'REDIS_OUTAGE_BLOCKED_UNRELATED_GET',
  );
  console.log('PHASE20_182_ISOLATED_REDIS_OUTAGE_503: PASS');
}

if (stage === 'recovery') {
  let recovered = false;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const result = await probe('/login-actions/registration', '192.0.2.77');
    if (result.status === 200) {
      recovered = true;
      break;
    }
    assert.equal(result.status, 503, 'UNEXPECTED_RECOVERY_RESPONSE');
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  assert.equal(recovered, true, 'REDIS_DID_NOT_RECOVER_AUTOMATICALLY');
  console.log('PHASE20_182_ISOLATED_REDIS_RECOVERY: PASS');
}

if (stage === 'restart') {
  const rejected = await probe('/login-actions/authenticate');
  assert.equal(rejected.status, 429, 'GATEWAY_RESTART_LOST_COUNTER');
  assert.equal(rejected.body, 'Too many requests');
  assert.equal((await probe('/.well-known/openid-configuration', ip, 'GET')).status, 200);
  console.log('PHASE20_182_ISOLATED_RESTART_PRESERVES_COUNTER: PASS');
}
