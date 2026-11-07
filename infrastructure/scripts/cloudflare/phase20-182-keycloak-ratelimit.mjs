import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

#!/usr/bin/env node
// Task 182: fail-closed Cloudflare WAF deployment/audit for DEV Keycloak only.
// No production hostname or existing unrelated rule is ever modified.
const hostname = 'auth-dev.kurvenfunk.at';
const zoneName = 'kurvenfunk.at';
const realm = '/realms/kurvenfunk';
const profiles = Object.freeze([
  { id: 'login', path: '/login-actions/authenticate', limit: 10, period: 60, timeout: 60 },
  { id: 'register', path: '/login-actions/registration', limit: 3, period: 600, timeout: 600 },
  { id: 'reset', path: '/login-actions/reset-credentials', limit: 3, period: 600, timeout: 600 },
  { id: 'token', path: '/protocol/openid-connect/token', limit: 30, period: 60, timeout: 60 },
]);

export function desiredRules() {
  return profiles.map(({ id, path, limit, period, timeout }) => ({
    ref: 'kf_20_182_dev_' + id,
    description: 'KURVENFUNK Task 182 DEV Keycloak: ' + id,
    expression:
      '(http.host eq "' + hostname + '" and http.request.method eq "POST" and ' +
      'starts_with(http.request.uri.path, "' + realm + path + '"))',
    action: 'block',
    enabled: true,
    ratelimit: {
      characteristics: ['cf.colo.id', 'ip.src'],
      period,
      requests_per_period: limit,
      mitigation_timeout: timeout,
      requests_to_origin: false,
    },
  }));
}

export function qualifiedPlan(plan) {
  const label = String(plan?.legacy_id ?? plan?.name ?? '').toLowerCase();
  if (label.includes('enterprise')) return 'enterprise';
  if (label.includes('business') || label === 'biz') return 'business';
  return null;
}

export function rulesAreEquivalent(actual, expected) {
  if (!actual || !actual.enabled || actual.ref !== expected.ref ||
      actual.expression !== expected.expression || actual.action !== expected.action) {
    return false;
  }

  const x = actual.ratelimit;
  const y = expected.ratelimit;
  return Boolean(x &&
    x.period === y.period &&
    x.requests_per_period === y.requests_per_period &&
    x.mitigation_timeout === y.mitigation_timeout &&
    x.requests_to_origin === y.requests_to_origin &&
    Array.isArray(x.characteristics) &&
    x.characteristics.length === y.characteristics.length &&
    y.characteristics.every((v) => x.characteristics.includes(v)));
}

function sanitizedApiFailure(response, payload) {
  const code = payload?.errors?.[0]?.code;
  const safeCode = Number.isInteger(code) ? '_CF_' + code : '';
  return new Error('CLOUDFLARE_API_HTTP_' + response.status + safeCode);
}

export async function manageRules({ mode, zoneId, token, fetcher = fetch, out = console.log }) {
  if (!['audit', 'apply'].includes(mode) ||
      !/^[a-f0-9]{32}$/i.test(zoneId ?? '') ||
      typeof token !== 'string' || token.length < 16) {
    throw new Error('CF_WAF_CREDENTIALS_OR_MODE_MISSING');
  }

  async function cf(method, path, body, allow404 = false) {
    const response = await fetcher('https://api.cloudflare.com/client/v4' + path, {
      method,
      headers: {
        authorization: 'Bearer ' + token,
        accept: 'application/json',
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20000),
    });
    const payload = await response.json().catch(() => null);
    if (allow404 && response.status === 404) return null;
    if (!response.ok || payload?.success !== true || !payload.result) {
      throw sanitizedApiFailure(response, payload);
    }
    return payload.result;
  }

  // Validate zone ownership and WAF plan BEFORE ANY MUTATION.
  const prefix = '/zones/' + zoneId;
  const zone = await cf('GET', prefix);
  if (zone.name !== zoneName) throw new Error('CF_WAF_WRONG_ZONE');
  const plan = qualifiedPlan(zone.plan);
  if (!plan) {
    throw new Error('CF_WAF_PLAN_REQUIRES_HOST_AND_METHOD_RULES');
  }

  const entrypoint = prefix + '/rulesets/phases/http_ratelimit/entrypoint';
  let existing = await cf('GET', entrypoint, undefined, true);
  const desired = desiredRules();

  if (existing && (existing.phase !== 'http_ratelimit' || existing.kind !== 'zone')) {
    throw new Error('CF_WAF_UNEXPECTED_RULESET_TYPE');
  }

  const actualRules = existing?.rules ?? [];
  const toCreate = [];
  for (const rule of desired) {
    const found = actualRules.filter((item) => item.ref === rule.ref);
    if (found.length > 1) throw new Error('CF_WAF_DUPLICATE_OWNED_RULE_' + rule.ref);
    if (found.length === 1) {
      if (!rulesAreEquivalent(found[0], rule)) {
        throw new Error('CF_WAF_OWNED_RULE_DRIFT_' + rule.ref);
      }
    } else {
      toCreate.push(rule);
    }
  }

  if (plan === 'business' && actualRules.length + toCreate.length > 5) {
    throw new Error('CF_WAF_BUSINESS_RULE_CAPACITY_EXCEEDED');
  }

  if (mode === 'audit') {
    if (toCreate.length) throw new Error('CF_WAF_NOT_CONFIGURED_' + toCreate.length);
    out('PHASE20_182_CLOUDFLARE_DEV_WAF: PASS');
    return { status: 'verified', present: desired.length };
  }

  if (!existing) {
    // Cloudflare officially documents creating a zone entrypoint ruleset
    // with the rule array when the phase entrypoint does not yet exist.
    existing = await cf('POST', prefix + '/rulesets', {
      name: 'KURVENFUNK DEV Keycloak authentication rate limits',
      description: 'Managed Task 182 DEV-only authentication rules',
      kind: 'zone',
      phase: 'http_ratelimit',
      rules: desired,
    });
  } else {
    // Add ONLY missing rules. Never PUT the entire ruleset and overwrite
    // unrelated customer rules or change their order.
    for (const rule of toCreate) {
      await cf('POST', prefix + '/rulesets/' + existing.id + '/rules', rule);
    }
  }

  // Mandatory read-back audit; no success claim on partial API failure.
  const verified = await cf('GET', entrypoint);
  const current = verified?.rules ?? [];
  for (const rule of desired) {
    if (current.filter((item) => rulesAreEquivalent(item, rule)).length !== 1) {
      throw new Error('CF_WAF_READBACK_MISMATCH_' + rule.ref);
    }
  }
  out('PHASE20_182_CLOUDFLARE_DEV_WAF: PASS');
  return { status: 'verified', present: desired.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    await manageRules({
      mode: process.argv[2]?.replace(/^--/, ''),
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
      token: process.env.CLOUDFLARE_WAF_API_TOKEN,
    });
  } catch (error) {
    // Never print response bodies, auth tokens, URLs or zone identifiers.
    const code = error instanceof Error ? error.message : 'CF_WAF_UNEXPECTED_FAILURE';
    console.error('PHASE20_182_CLOUDFLARE_DEV_WAF: FAIL ' +
      (/^[A-Z0-9_]+$/.test(code) ? code : 'CF_WAF_UNEXPECTED_FAILURE'));
    process.exitCode = 1;
  }
}
