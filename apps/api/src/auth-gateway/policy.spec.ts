import { createHmac, randomBytes } from 'node:crypto';

import {
  AUTH_LIMITS,
  classifyAuthRequest,
  normalizeAddress,
  rateKey,
  verifiedClientIp,
} from './policy';

describe('Task 182 DEV Keycloak auth gateway', () => {
  const base = '/realms/kurvenfunk';

  it('classifies only the intended POST actions', () => {
    expect(classifyAuthRequest('POST', base + '/login-actions/authenticate')).toBe('login');
    expect(classifyAuthRequest('POST', base + '/login-actions/registration')).toBe('register');
    expect(classifyAuthRequest('POST', base + '/login-actions/reset-credentials')).toBe('reset');
    expect(classifyAuthRequest('POST', base + '/protocol/openid-connect/token')).toBe('token');
    expect(classifyAuthRequest('GET', base + '/login-actions/authenticate')).toBeNull();
    expect(classifyAuthRequest('POST', '/realms/another/login-actions/authenticate')).toBeNull();
    expect(classifyAuthRequest('POST', base + '/protocol/openid-connect/token-info')).toBeNull();
    expect(classifyAuthRequest('POST', base + '/login-actions/authenticate-anything')).toBeNull();
    expect(AUTH_LIMITS.login).toEqual({ requests: 10, windowMs: 60_000 });
    expect(AUTH_LIMITS.register).toEqual({ requests: 3, windowMs: 600_000 });
    expect(AUTH_LIMITS.reset).toEqual({ requests: 3, windowMs: 600_000 });
    expect(AUTH_LIMITS.token).toEqual({ requests: 30, windowMs: 60_000 });
  });

  it('does not accept a forged Cloudflare client IP from a different TCP peer', () => {
    const peers = ['172.25.0.4'];
    expect(verifiedClientIp('172.25.0.99', '203.0.113.7', peers)).toBeNull();
    expect(verifiedClientIp('172.25.0.4', ['203.0.113.7'], peers)).toBeNull();
    expect(verifiedClientIp('172.25.0.4', '203.0.113.7, 1.2.3.4', peers)).toBeNull();
    expect(verifiedClientIp('172.25.0.4', '203.0.113.7', peers)).toBe('203.0.113.7');
    expect(verifiedClientIp('::ffff:172.25.0.4', '2001:db8::1', peers)).toBe('2001:db8::1');
  });

  it('normalizes IPv4-mapped IPv6 and rejects malformed network identities', () => {
    expect(normalizeAddress('::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(normalizeAddress('2001:0DB8:0:0:0:0:0:1')).toBe('2001:db8::1');
    expect(normalizeAddress('203.0.113.7 ')).toBeNull();
    expect(normalizeAddress('2001:db8::1%eth0')).toBeNull();
  });

  it('stores keyed HMAC pseudonyms, never raw IPs or naked SHA digests', () => {
    const secret = randomBytes(32).toString('base64url');
    const key = rateKey('203.0.113.7', secret);
    expect(key).toMatch(/^[a-f0-9]{64}$/u);
    expect(key).toBe(
      createHmac('sha256', Buffer.from(secret, 'base64url'))
        .update('kurvenfunk:auth-ip:v1:203.0.113.7')
        .digest('hex'),
    );
    expect(rateKey('::ffff:203.0.113.7', secret)).toBe(key);
    expect(key).not.toContain('203.0.113.7');
    expect(() => rateKey('203.0.113.7', 'bad')).toThrow('AUTH_GATEWAY_IDENTITY_UNAVAILABLE');
  });
});
