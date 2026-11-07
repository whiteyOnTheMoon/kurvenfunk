import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

export function normalizeSocketAddress(address: string | undefined): string | null {
  if (!address) return null;
  const value = address.startsWith('::ffff:') ? address.slice(7) : address;
  return !value.includes('%') && isIP(value) > 0 ? value.toLowerCase() : null;
}

/**
 * Never treat a client-supplied HTTP header as proof of origin. In the
 * production Docker topology ONLY the cloudflared process is permitted to
 * supply CF-Connecting-IP; the TCP peer must be its current Docker DNS IP.
 * A direct loopback port or any other backend container is not trusted.
 */
export function validatedCloudflareIp(
  remoteAddress: string | undefined,
  header: string | string[] | undefined,
  trustedPeerAddresses: readonly string[],
): string | null {
  const peer = normalizeSocketAddress(remoteAddress);
  if (!peer || !trustedPeerAddresses.some((value) => normalizeSocketAddress(value) === peer)) {
    return null;
  }

  if (
    typeof header !== 'string' ||
    header !== header.trim() ||
    header.includes('%') ||
    isIP(header) === 0
  ) {
    return null;
  }

  return header;
}

@Injectable()
export class TrustedClientIpService {
  async fromRequest(request: Pick<Request, 'headers' | 'socket'>): Promise<string | null> {
    let peers: string[];
    try {
      // Docker-internal DNS, never a header or hostname provided by a client.
      peers = (await lookup('cloudflared', { all: true })).map((entry) => entry.address);
    } catch {
      return null;
    }

    return validatedCloudflareIp(
      request.socket.remoteAddress,
      request.headers['cf-connecting-ip'],
      peers,
    );
  }
}
