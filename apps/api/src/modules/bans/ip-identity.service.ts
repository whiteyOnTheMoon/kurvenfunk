import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface HashedIp {
  ipHash: string;
  hashKeyVersion: string;
}

interface VersionedKey {
  version: string;
  secret: Buffer;
}

const VERSION_PATTERN = /^v[1-9][0-9]{0,2}$/;
const SECRET_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;
const MAX_PREVIOUS_KEYS = 4;

function unavailable(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    code: 'IP_HASHING_NOT_CONFIGURED',
    message: 'IP pseudonymization is unavailable.',
  });
}

function invalidAddress(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    code: 'IP_ADDRESS_INVALID',
    message: 'Invalid network address.',
  });
}

/**
 * Task 181: a keyed, versioned IP pseudonym, never a plain SHA-256 digest.
 * This service does not read HTTP headers. Establishing a trusted reverse-proxy
 * identity and enforcing blocks or rate limits are separate Tasks 182–185.
 */
@Injectable()
export class IpIdentityService {
  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    try {
      return this.readKeys() !== null;
    } catch {
      return false;
    }
  }

  hash(address: string): HashedIp {
    const keys = this.readKeys();
    if (!keys) {
      throw unavailable();
    }

    return this.hashWithKey(this.normalize(address), keys[0]);
  }

  /**
   * While keys are rotated, active and retained legacy HMACs must both match.
   * Callers match the pair (hashKeyVersion, ipHash), never the digest alone.
   * The active key is first. Previous keys are not used to create new blocks.
   */
  candidateHashes(address: string): HashedIp[] {
    const keys = this.readKeys();
    if (!keys) {
      throw unavailable();
    }

    const canonicalAddress = this.normalize(address);
    return keys.map((key) => this.hashWithKey(canonicalAddress, key));
  }

  private hashWithKey(address: string, key: VersionedKey): HashedIp {
    const ipHash = createHmac('sha256', key.secret)
      .update('kurvenfunk:ip:' + key.version + ':' + address, 'utf8')
      .digest('hex');

    return { ipHash, hashKeyVersion: key.version };
  }

  private normalize(address: string): string {
    if (typeof address !== 'string') {
      throw invalidAddress();
    }

    const value = address.trim();
    const kind = isIP(value);

    if (kind === 4) {
      return value;
    }

    if (kind !== 6) {
      throw invalidAddress();
    }

    // WHATWG normalizes expanded IPv6 and lettercase. Remove the brackets
    // added for URL hosts before using the canonical IP as HMAC input.
    let normalized: string;
    try {
      normalized = new URL('http://[' + value + ']/').hostname.slice(1, -1).toLowerCase();
    } catch {
      throw invalidAddress();
    }

    // IPv4-mapped IPv6 and the native IPv4 form are the same client identity.
    const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(normalized);
    if (mapped) {
      const upper = Number.parseInt(mapped[1], 16);
      const lower = Number.parseInt(mapped[2], 16);
      return [upper >>> 8, upper & 255, lower >>> 8, lower & 255].join('.');
    }

    return normalized;
  }

  private readKeys(): VersionedKey[] | null {
    const currentSecret = this.config.get<string>('IP_HASH_HMAC_SECRET');
    if (!currentSecret) {
      return null;
    }

    const currentVersion = this.config.get<string>('IP_HASH_KEY_VERSION', 'v1');
    if (!VERSION_PATTERN.test(currentVersion)) {
      throw unavailable();
    }

    const keys: VersionedKey[] = [
      { version: currentVersion, secret: this.decodeSecret(currentSecret) },
    ];

    const previousJson = this.config.get<string>('IP_HASH_PREVIOUS_KEYS_JSON');
    if (!previousJson) {
      return keys;
    }

    let previous: unknown;
    try {
      previous = JSON.parse(previousJson);
    } catch {
      throw unavailable();
    }

    if (
      typeof previous !== 'object' ||
      previous === null ||
      Array.isArray(previous) ||
      Object.getPrototypeOf(previous) !== Object.prototype
    ) {
      throw unavailable();
    }

    const entries = Object.entries(previous);
    if (entries.length > MAX_PREVIOUS_KEYS) {
      throw unavailable();
    }

    for (const [version, secret] of entries) {
      if (
        !VERSION_PATTERN.test(version) ||
        version === currentVersion ||
        typeof secret !== 'string'
      ) {
        throw unavailable();
      }
      keys.push({ version, secret: this.decodeSecret(secret) });
    }

    return keys;
  }

  private decodeSecret(value: string): Buffer {
    // Secrets are 32+ random bytes, unpadded base64url. Comparing the encoded
    // roundtrip prevents permissive base64 decoders from accepting bad input.
    if (!SECRET_PATTERN.test(value)) {
      throw unavailable();
    }
    const secret = Buffer.from(value, 'base64url');
    if (secret.length < 32 || secret.toString('base64url') !== value) {
      throw unavailable();
    }
    return secret;
  }
}
