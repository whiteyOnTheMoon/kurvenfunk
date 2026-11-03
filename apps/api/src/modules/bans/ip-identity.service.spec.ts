import type { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import type { Request } from 'express';

import { IpIdentityService } from './ip-identity.service';

function createService(options: Record<string, string> = {}) {
  const values = {
    IP_HASH_HMAC_SECRET: 'This-is-an-isolated-unit-test-key-with-over-32-bytes',
    IP_HASH_KEY_VERSION: 'v1',
    IP_TRUST_CLOUDFLARE: 'false',
    ...options,
  };

  const get = jest.fn((key: string, fallback?: string) => values[key] ?? fallback);
  const getOrThrow = jest.fn((key: string) => {
    const found = values[key];
    if (!found) throw new Error('Missing config');
    return found;
  });
  const config = { get, getOrThrow } as unknown as ConfigService;
  return new IpIdentityService(config);
}

describe('IpIdentityService – keyed HMAC', () => {
  it('returns a versioned 256-bit HMAC instead of storing raw IP text', () => {
    const identity = createService();
    const hashed = identity.hash('203.0.113.22');

    expect(hashed).toEqual({
      ipHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      hashKeyVersion: 'v1',
    });
    expect(hashed.ipHash).not.toContain('203.0.113.22');
    expect(identity.hash('203.0.113.22')).toEqual(hashed);
    expect(identity.hash('203.0.113.23')).not.toEqual(hashed);
  });

  it('normalizes equivalent IPv6 forms before hashing', () => {
    const identity = createService();
    expect(identity.hash('2001:0db8:0:0:0:0:0:1')).toEqual(identity.hash('2001:db8::1'));
  });

  it('uses different digests for key versions and secrets', () => {
    expect(createService().hash('203.0.113.22').ipHash).not.toBe(
      createService({ IP_HASH_KEY_VERSION: 'v2' }).hash('203.0.113.22').ipHash,
    );
    expect(createService().hash('203.0.113.22').ipHash).not.toBe(
      createService({
        IP_HASH_HMAC_SECRET: 'This-is-a-different-isolated-unit-test-key-more-than-32bytes',
      }).hash('203.0.113.22').ipHash,
    );
  });

  it('rejects invalid IP values and missing/weak secret keys', () => {
    expect(() => createService().hash('not-an-ip')).toThrow(ServiceUnavailableException);
    expect(() => createService({ IP_HASH_HMAC_SECRET: 'short' }).hash('203.0.113.2'))
      .toThrow(ServiceUnavailableException);
    expect(() => createService({ IP_HASH_KEY_VERSION: 'bad' }).hash('203.0.113.2'))
      .toThrow(ServiceUnavailableException);
  });

  it('never trusts Cloudflare IP headers without explicit opt-in', () => {
    const request = {
      headers: { 'cf-connecting-ip': '203.0.113.9', 'x-forwarded-for': '198.51.100.7' },
    } as unknown as Pick<Request, 'headers'>;
    expect(createService().trustedAddress(request)).toBeNull();
  });

  it('only extracts a valid Cloudflare address when enabled; ignores X-Forwarded-For', () => {
    const identity = createService({ IP_TRUST_CLOUDFLARE: 'true' });
    expect(identity.trustedAddress({
      headers: { 'cf-connecting-ip': '203.0.113.9', 'x-forwarded-for': '198.51.100.7' },
    } as unknown as Pick<Request, 'headers'>)).toBe('203.0.113.9');

    expect(identity.trustedAddress({
      headers: { 'x-forwarded-for': '198.51.100.7' },
    } as unknown as Pick<Request, 'headers'>)).toBeNull();

    expect(identity.trustedAddress({
      headers: { 'cf-connecting-ip': '203.0.113.9, 198.51.100.7' },
    } as unknown as Pick<Request, 'headers'>)).toBeNull();
  });
});
