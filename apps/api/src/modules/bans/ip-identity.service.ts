import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export interface HashedIp {
  ipHash: string;
  hashKeyVersion: string;
}

/**
 * Task 181: keyed, versioned pseudonymization.
 * Never write raw IP addresses to logs, database records or audit events.
 */
@Injectable()
export class IpIdentityService {
  constructor(private readonly config: ConfigService) {}

  get isEnabled(): boolean {
    return this.config.get<string>('IP_TRUST_CLOUDFLARE') === 'true';
  }

  get isConfigured(): boolean {
    const key = this.config.get<string>('IP_HASH_HMAC_SECRET');
    const version = this.config.get<string>('IP_HASH_KEY_VERSION', 'v1');
    return Boolean(
      key && Buffer.byteLength(key, 'utf8') >= 32 && /^v[1-9][0-9]{0,2}$/.test(version),
    );
  }

  /**
   * A header is trusted ONLY with explicit infrastructure opt-in. The API must
   * be reachable only via the protected Cloudflare Tunnel when enabled.
   * Do not trust X-Forwarded-For or user-supplied arbitrary headers.
   */
  trustedAddress(request: Pick<Request, 'headers'>): string | null {
    if (!this.isEnabled) {
      return null;
    }

    const raw = request.headers['cf-connecting-ip'];
    if (typeof raw !== 'string' || isIP(raw.trim()) === 0) {
      return null;
    }

    return this.normalize(raw.trim());
  }

  hash(address: string): HashedIp {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException({
        code: 'IP_HASHING_NOT_CONFIGURED',
        message: 'IP protection is not available.',
      });
    }

    const normalized = this.normalize(address);
    const secret = this.config.getOrThrow<string>('IP_HASH_HMAC_SECRET');
    const version = this.config.get<string>('IP_HASH_KEY_VERSION', 'v1');
    const ipHash = createHmac('sha256', secret)
      .update(`kurvenfunk:ip:${version}:${normalized}`, 'utf8')
      .digest('hex');

    return { ipHash, hashKeyVersion: version };
  }

  private normalize(value: string): string {
    const kind = isIP(value);
    if (kind === 4) {
      return value;
    }
    if (kind === 6) {
      // The WHATWG parser produces canonical, compressed IPv6 notation.
      return new URL(`http://[${value}]/`).hostname.toLowerCase();
    }
    throw new ServiceUnavailableException({
      code: 'IP_ADDRESS_INVALID',
      message: 'Invalid network address.',
    });
  }
}
