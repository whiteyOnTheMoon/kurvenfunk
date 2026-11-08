import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { classifyIpLimitedWrite } from './ip-rate-limit.guard';
import { TemporaryIpBlockService } from './temporary-ip-block.service';
import { TrustedClientIpService } from './trusted-client-ip.service';

function unavailable(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    code: 'IP_TEMP_BLOCK_CHECK_UNAVAILABLE',
    message: 'This action is temporarily unavailable.',
  });
}

/**
 * Conservative Task 183 enforcement: only community write operations, not
 * shared-network reading, login, moderation, appeals or account recovery.
 * Disabled by default. Never trusts unverified Cloudflare headers.
 */
@Injectable()
export class TemporaryIpBlockGuard implements CanActivate {
  private readonly enabled: boolean;

  constructor(
    private readonly trustedIp: TrustedClientIpService,
    private readonly blocks: TemporaryIpBlockService,
    config: ConfigService,
  ) {
    this.enabled = config.get<string>('IP_TEMP_BLOCK_ENABLED', 'false') === 'true';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.enabled) return true;
    const request = context.switchToHttp().getRequest<Request>();
    if (!classifyIpLimitedWrite(request.method, request.originalUrl)) return true;
    const address = await this.trustedIp.fromRequest(request);
    if (!address) throw unavailable();

    let block: { id: string; expiresAt: Date | null } | null;
    try {
      block = await this.blocks.findActive(address);
    } catch {
      throw unavailable();
    }

    if (block) {
      throw new ForbiddenException({
        code: 'IP_TEMPORARILY_BLOCKED',
        message: 'Posting from this network is temporarily unavailable.',
      });
    }
    return true;
  }
}
