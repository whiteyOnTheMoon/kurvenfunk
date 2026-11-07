import { createHash, createHmac, randomBytes } from 'node:crypto';

import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import { IpIdentityService } from './ip-identity.service';

const CURRENT_KEY = randomBytes(32).toString('base64url');
const OLD_KEY = randomBytes(32).toString('base64url');
const ALTERNATE_KEY = randomBytes(32).toString('base64url');

function createIdentity(overrides: Record<string, string | undefined> = {}): IpIdentityService {
  const values: Record<string, string | undefined> = {
    IP_HASH_HMAC_SECRET: CURRENT_KEY,
    IP_HASH_KEY_VERSION: 'v2',
    IP_HASH_PREVIOUS_KEYS_JSON: '',
    ...overrides,
  };
  const config = {
    get: (name: string, fallback?: string) => values[name] || fallback,
  } as ConfigService;
  return new IpIdentityService(config);
}

describe('Task 181 – keyed IP pseudonymization', () => {
  it('produces a deterministic 256-bit HMAC and no raw address', () => {
    const identity = createIdentity();
    const address = '203.0.113.22';
    const result = identity.hash(address);

    expect(result.hashKeyVersion).toBe('v2');
    expect(result.ipHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.ipHash).toBe(
      createHmac('sha256', Buffer.from(CURRENT_KEY, 'base64url'))
        .update('kurvenfunk:ip:v2:' + address)
        .digest('hex'),
    );
    expect(result.ipHash).not.toEqual(createHash('sha256').update(address).digest('hex'));
    expect(JSON.stringify(result)).not.toContain(address);
    expect(identity.hash(address)).toEqual(result);
    expect(identity.hash('203.0.113.23')).not.toEqual(result);
  });

  it('normalizes expanded and compressed IPv6, including uppercase', () => {
    const identity = createIdentity();
    expect(identity.hash('2001:0DB8:0000:0000:0000:0000:0000:0001')).toEqual(
      identity.hash('2001:db8::1'),
    );
    expect(identity.hash('2001:db8::2')).not.toEqual(identity.hash('2001:db8::1'));
  });

  it.each(['::ffff:203.0.113.22', '0:0:0:0:0:ffff:cb00:7116', '::FFFF:CB00:7116'])(
    'treats IPv4-mapped IPv6 %s as the same native IPv4 address',
    (mapped) => {
      const identity = createIdentity();
      expect(identity.hash(mapped)).toEqual(identity.hash('203.0.113.22'));
    },
  );

  it.each([
    'not-an-ip',
    '203.0.113.22, 198.51.100.42',
    '203.0.113.22:3000',
    '010.000.000.001',
    '[2001:db8::1]',
    'fe80::1%en0',
    '',
  ])('rejects invalid, combined or ambiguous network address %s', (address) => {
    expect(() => createIdentity().hash(address)).toThrow(ServiceUnavailableException);
  });

  it('rejects unexpected input types without echoing them', () => {
    expect(() => createIdentity().hash(null as unknown as string)).toThrow(
      ServiceUnavailableException,
    );
    try {
      createIdentity().hash('untrusted-user-header');
      throw new Error('Expected invalid address rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toEqual({
        code: 'IP_ADDRESS_INVALID',
        message: 'Invalid network address.',
      });
    }
  });

  it('separates environment keys and versions', () => {
    const address = '2001:db8::a';
    expect(createIdentity().hash(address).ipHash).not.toEqual(
      createIdentity({ IP_HASH_KEY_VERSION: 'v3' }).hash(address).ipHash,
    );
    expect(createIdentity().hash(address).ipHash).not.toEqual(
      createIdentity({ IP_HASH_HMAC_SECRET: ALTERNATE_KEY }).hash(address).ipHash,
    );
  });

  it('supports key rotation with active and retained old versions', () => {
    const address = '192.0.2.20';
    const old = createIdentity({
      IP_HASH_KEY_VERSION: 'v1',
      IP_HASH_HMAC_SECRET: OLD_KEY,
    });
    const rotated = createIdentity({
      IP_HASH_PREVIOUS_KEYS_JSON: JSON.stringify({ v1: OLD_KEY }),
    });

    expect(rotated.isConfigured).toBe(true);
    expect(rotated.hash(address).hashKeyVersion).toBe('v2');
    expect(rotated.candidateHashes(address)).toEqual([rotated.hash(address), old.hash(address)]);
    expect(rotated.hash(address)).not.toEqual(old.hash(address));
  });

  it('never creates new hashes using previous versions', () => {
    const identity = createIdentity({
      IP_HASH_PREVIOUS_KEYS_JSON: JSON.stringify({ v1: OLD_KEY }),
    });
    expect(identity.hash('2001:db8::20').hashKeyVersion).toBe('v2');
    expect(identity.candidateHashes('2001:db8::20').map((item) => item.hashKeyVersion)).toEqual([
      'v2',
      'v1',
    ]);
  });

  it.each([
    { IP_HASH_HMAC_SECRET: '' },
    { IP_HASH_HMAC_SECRET: 'insecure' },
    { IP_HASH_HMAC_SECRET: 'a'.repeat(43) + '=' },
    { IP_HASH_KEY_VERSION: 'invalid' },
    { IP_HASH_KEY_VERSION: 'v0' },
    { IP_HASH_PREVIOUS_KEYS_JSON: '{broken' },
    { IP_HASH_PREVIOUS_KEYS_JSON: '[]' },
    { IP_HASH_PREVIOUS_KEYS_JSON: JSON.stringify({ v2: OLD_KEY }) },
    { IP_HASH_PREVIOUS_KEYS_JSON: JSON.stringify({ bad: OLD_KEY }) },
    { IP_HASH_PREVIOUS_KEYS_JSON: JSON.stringify({ v1: 'weak-key' }) },
    {
      IP_HASH_PREVIOUS_KEYS_JSON: JSON.stringify({
        v1: OLD_KEY,
        v3: OLD_KEY,
        v4: OLD_KEY,
        v5: OLD_KEY,
        v6: OLD_KEY,
      }),
    },
  ])('fails closed on missing or malformed key configuration', (overrides) => {
    const identity = createIdentity(overrides);
    expect(identity.isConfigured).toBe(false);
    expect(() => identity.hash('203.0.113.22')).toThrow(ServiceUnavailableException);
    expect(() => identity.candidateHashes('203.0.113.22')).toThrow(ServiceUnavailableException);
  });
});
