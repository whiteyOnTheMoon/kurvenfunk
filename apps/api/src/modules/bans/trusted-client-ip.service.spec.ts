import { validatedCloudflareIp, normalizeSocketAddress } from './trusted-client-ip.service';

describe('Task 182 – trusted Cloudflare client-IP boundary', () => {
  const cloudflared = ['172.19.0.5', '2001:db8::5'];

  it('accepts a single valid CF address only from the verified tunnel TCP peer', () => {
    expect(validatedCloudflareIp('172.19.0.5', '203.0.113.9', cloudflared)).toBe('203.0.113.9');
    expect(validatedCloudflareIp('::ffff:172.19.0.5', '2001:db8::9', cloudflared)).toBe(
      '2001:db8::9',
    );
  });

  it.each([
    ['172.19.0.1', '203.0.113.9'],
    ['127.0.0.1', '203.0.113.9'],
    ['172.19.0.12', '203.0.113.9'],
    ['::1', '203.0.113.9'],
    ['', '203.0.113.9'],
  ])('rejects forged Cloudflare headers from direct and other backend peers', (peer, header) => {
    expect(validatedCloudflareIp(peer, header, cloudflared)).toBeNull();
  });

  it.each([
    '',
    '203.0.113.1, 198.51.100.9',
    '203.0.113.1:8080',
    ' 203.0.113.1',
    'not-an-ip',
    'fe80::1%eth0',
  ])('rejects malformed or combined header %s', (header) => {
    expect(validatedCloudflareIp('172.19.0.5', header, cloudflared)).toBeNull();
  });

  it('never trusts multiple header values or an absent header', () => {
    expect(validatedCloudflareIp('172.19.0.5', ['203.0.113.9'], cloudflared)).toBeNull();
    expect(validatedCloudflareIp('172.19.0.5', undefined, cloudflared)).toBeNull();
  });

  it('normalizes IPv4-mapped peer addresses and rejects unparseable peers', () => {
    expect(normalizeSocketAddress('::ffff:172.19.0.5')).toBe('172.19.0.5');
    expect(normalizeSocketAddress('peer-attacker')).toBeNull();
  });
});
