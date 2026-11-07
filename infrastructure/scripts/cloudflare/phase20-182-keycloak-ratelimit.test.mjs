import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  desiredRules,
  manageRules,
  qualifiedPlan,
  rulesAreEquivalent,
} from './phase20-182-keycloak-ratelimit.mjs';

const token = 'example-test-token-only-not-a-real-secret';
const zoneId = 'f'.repeat(32);

function response(status, result, errors = []) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => ({
      success: status >= 200 && status < 300,
      ...(result === undefined ? {} : { result }),
      errors,
    }),
  };
}

function fakeFetch({ plan = 'Business', initialRules = [], failOnWrite = false } = {}) {
  const calls = [];
  const rules = [...initialRules];
  let rulesetExists = initialRules.length !== 0;
  const fetcher = async (url, options) => {
    const path = new URL(url).pathname;
    calls.push({ method: options.method, path, body: options.body });
    if (path === '/client/v4/zones/' + zoneId) {
      return response(200, { name: 'kurvenfunk.at', plan: { name: plan } });
    }
    if (path.endsWith('/rulesets/phases/http_ratelimit/entrypoint')) {
      return rulesetExists
        ? response(200, { id: 'test-ruleset', kind: 'zone', phase: 'http_ratelimit', rules })
        : response(404, undefined);
    }
    if (path.endsWith('/rulesets') && options.method === 'POST') {
      if (failOnWrite) return response(403, undefined);
      const payload = JSON.parse(options.body);
      rules.push(...payload.rules);
      rulesetExists = true;
      return response(200, { id: 'test-ruleset' });
    }
    if (path.endsWith('/rulesets/test-ruleset/rules') && options.method === 'POST') {
      if (failOnWrite) return response(403, undefined);
      rules.push(JSON.parse(options.body));
      return response(200, { id: 'test-rule' });
    }
    throw new Error('UNEXPECTED_TEST_API_REQUEST');
  };
  return { fetcher, calls, rules };
}

test('four host- and POST-only rate limits cover Keycloak auth flows', () => {
  const rules = desiredRules();
  assert.equal(rules.length, 4);
  assert.deepEqual(
    rules.map((r) => r.ratelimit.requests_per_period),
    [10, 3, 3, 30],
  );
  for (const rule of rules) {
    assert.match(rule.expression, /http\.host eq "auth-dev\.kurvenfunk\.at"/);
    assert.match(rule.expression, /http\.request\.method eq "POST"/);
    assert.match(rule.expression, /starts_with\(http\.request\.uri\.path/);
    assert.deepEqual(rule.ratelimit.characteristics, ['cf.colo.id', 'ip.src']);
    assert.equal(rule.enabled, true);
    assert.equal(rule.action, 'block');
    assert.ok(rulesAreEquivalent(rule, { ...rule }));
  }
  assert.ok(!JSON.stringify(rules).includes('auth.kurvenfunk.at"'));
});

test('does not authorize WAF deploy on Free, Pro or an unknown plan', () => {
  assert.equal(qualifiedPlan({ name: 'Free Website' }), null);
  assert.equal(qualifiedPlan({ name: 'Pro Website' }), null);
  assert.equal(qualifiedPlan({ name: 'Business Website' }), 'business');
  assert.equal(qualifiedPlan({ legacy_id: 'enterprise' }), 'enterprise');
  assert.equal(qualifiedPlan(null), null);
});

test('unconfigured/invalid tokens fail before any network request', async () => {
  let called = false;
  await assert.rejects(
    manageRules({
      mode: 'apply',
      zoneId: 'invalid',
      token,
      fetcher: async () => { called = true; },
    }),
    /CF_WAF_CREDENTIALS_OR_MODE_MISSING/,
  );
  assert.equal(called, false);
});

test('audit does not mutate and requires all four existing rules', async () => {
  const source = fakeFetch({ initialRules: desiredRules() });
  const result = await manageRules({
    mode: 'audit',
    zoneId,
    token,
    fetcher: source.fetcher,
    out: () => {},
  });
  assert.deepEqual(result, { status: 'verified', present: 4 });
  assert.ok(source.calls.every((call) => call.method === 'GET'));
});

test('audit fails closed when rules are not yet configured', async () => {
  const source = fakeFetch();
  await assert.rejects(
    manageRules({
      mode: 'audit',
      zoneId,
      token,
      fetcher: source.fetcher,
      out: () => {},
    }),
    /CF_WAF_NOT_CONFIGURED_4/,
  );
  assert.ok(source.calls.every((call) => call.method === 'GET'));
});

test('apply creates DEV-only ruleset if entrypoint does not exist', async () => {
  const source = fakeFetch();
  await manageRules({
    mode: 'apply',
    zoneId,
    token,
    fetcher: source.fetcher,
    out: () => {},
  });
  assert.equal(source.rules.length, 4);
  assert.equal(source.calls.filter((call) => call.method === 'POST').length, 1);
});

test('apply preserves unrelated existing rules and does not duplicate itself', async () => {
  const unrelated = {
    id: 'other',
    ref: 'other_maintained_rule',
    enabled: true,
    expression: 'ip.src eq 192.0.2.1',
  };
  const source = fakeFetch({
    initialRules: [unrelated, desiredRules()[0]],
  });
  await manageRules({
    mode: 'apply',
    zoneId,
    token,
    fetcher: source.fetcher,
    out: () => {},
  });
  assert.equal(source.rules.length, 5);
  assert.equal(source.rules[0], unrelated);
  assert.equal(source.calls.filter((call) => call.method === 'POST').length, 3);
  await manageRules({
    mode: 'apply',
    zoneId,
    token,
    fetcher: source.fetcher,
    out: () => {},
  });
  assert.equal(source.calls.filter((call) => call.method === 'POST').length, 3);
});

test('refuses plan limits, rule drift and API failures rather than widening scope', async () => {
  const free = fakeFetch({ plan: 'Free Website' });
  await assert.rejects(
    manageRules({ mode: 'apply', zoneId, token, fetcher: free.fetcher }),
    /CF_WAF_PLAN_REQUIRES_HOST_AND_METHOD_RULES/,
  );
  assert.ok(free.calls.every((call) => call.method === 'GET'));

  const different = {
    ...desiredRules()[0],
    expression: '(true)',
  };
  const drifted = fakeFetch({ initialRules: [different] });
  await assert.rejects(
    manageRules({ mode: 'apply', zoneId, token, fetcher: drifted.fetcher }),
    /CF_WAF_OWNED_RULE_DRIFT/,
  );
  assert.ok(drifted.calls.every((call) => call.method === 'GET'));

  const capacity = fakeFetch({
    initialRules: [
      { ref: 'external1' },
      { ref: 'external2' },
    ],
  });
  await assert.rejects(
    manageRules({ mode: 'apply', zoneId, token, fetcher: capacity.fetcher }),
    /CF_WAF_BUSINESS_RULE_CAPACITY_EXCEEDED/,
  );
  assert.ok(capacity.calls.every((call) => call.method === 'GET'));

  const failing = fakeFetch({ failOnWrite: true });
  await assert.rejects(
    manageRules({ mode: 'apply', zoneId, token, fetcher: failing.fetcher }),
    /CLOUDFLARE_API_HTTP_403/,
  );
});
