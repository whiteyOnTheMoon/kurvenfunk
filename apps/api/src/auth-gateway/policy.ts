import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

export const AUTH_LIMITS = {
  login: { requests: 10, windowMs: 60_000 },
  register: { requests: 3, windowMs: 600_000 },
  reset: { requests: 3, windowMs: 600_000 },
  token: { requests: 30, windowMs: 60_000 },
} as const;

export type AuthAction = keyof typeof AUTH_LIMITS;

export function classifyAuthRequest(method: string, pathname: string): AuthAction | null {
  if (method !== 'POST') return null;
  const prefix = '/realms/kurvenfunk';
  if (!pathname.startsWith(prefix + '/')) return null;
  const route = pathname.slice(prefix.length);
  if (route === '/protocol/openid-connect/token') return 'token';
  if (/^\/login-actions\/authenticate(?:\/|$)/u.test(route)) return 'login';
  if (/^\/login-actions\/registration(?:\/|$)/u.test(route)) return 'register';
  if (/^\/login-actions\/reset-credentials(?:\/|$)/u.test(route)) return 'reset';
  return null;
}

export function normalizeAddress(value: string): string | null {
  if (typeof value !== 'string' || value.trim() !== value || value.includes('%')) {
    return null;
  }
  const kind = isIP(value);
  if (kind === 4) return value;
  if (kind !== 6) return null;
  try {
    const normalized = new URL('http://[' + value + ']/').hostname.slice(1, -1).toLowerCase();
    const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/u.exec(normalized);
    if (!mapped) return normalized;
    const hi = Number.parseInt(mapped[1], 16);
    const lo = Number.parseInt(mapped[2], 16);
    return [hi >>> 8, hi & 255, lo >>> 8, lo & 255].join('.');
  } catch {
    return null;
  }
}

export function verifiedClientIp(
  remoteAddress: string | undefined,
  cloudflareHeader: string | string[] | undefined,
  peers: readonly string[],
): string | null {
  const remote = remoteAddress ? normalizeAddress(remoteAddress) : null;
  if (!remote || !peers.some((value) => normalizeAddress(value) === remote)) return null;
  if (typeof cloudflareHeader !== 'string') return null;
  return normalizeAddress(cloudflareHeader);
}

export function rateKey(address: string, secretBase64Url: string): string {
  const ip = normalizeAddress(address);
  const secret = Buffer.from(secretBase64Url, 'base64url');
  if (
    !ip ||
    !/^[A-Za-z0-9_-]{43,128}$/u.test(secretBase64Url) ||
    secret.length < 32 ||
    secret.toString('base64url') !== secretBase64Url
  ) {
    throw new Error('AUTH_GATEWAY_IDENTITY_UNAVAILABLE');
  }
  return createHmac('sha256', secret).update('kurvenfunk:auth-ip:v1:' + ip).digest('hex');
}

// Fixed-window atomic counter. No raw client addresses in Redis keys.
export const COUNTER_LUA = [
  "local n = redis.call('INCR', KEYS[1])",
  "if n == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end",
  'return n',
].join('\n');
