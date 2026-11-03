import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { Request } from 'express';
import Redis from 'ioredis';

import { IpIdentityService } from './ip-identity.service';

const RATE_WINDOW_MS = 60_000;
const RATE_MAX: Readonly<Record<string, number>> = {
  comments: 30,
  forum: 30,
  reports: 10,
};

const RATE_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return current
`;

function classifyWrite(request: Pick<Request, 'method' | 'originalUrl'>): string | null {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    return null;
  }

  const path = (request.originalUrl ?? '').split('?')[0] ?? '';
  if (!path.startsWith('/api/v1/')) {
    return null;
  }

  if (/\/(reports)(?:\/|$)/u.test(path)) {
    return 'reports';
  }
  if (/\/(forums|threads|posts)(?:\/|$)/u.test(path)) {
    return 'forum';
  }
  if (/\/(comments)(?:\/|$)/u.test(path)) {
    return 'comments';
  }
  return null;
}

/**
 * Tasks 182–184: coarse IP-based abuse limits and active block enforcement.
 * The existing account-level spam/rate limits stay in place as a second layer.
 */
@Injectable()
export class IpPolicyGuard implements CanActivate, OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();
  private readonly logger = new Logger(IpPolicyGuard.name);
  private readonly redis: Redis;

  constructor(
    private readonly identities: IpIdentityService,
    config: ConfigService,
  ) {
    this.redis = new Redis({
      host: config.get<string>('REDIS_HOST', 'redis'),
      port: config.get<number>('REDIS_PORT', 6379),
      password: config.getOrThrow<string>('REDIS_PASSWORD'),
      lazyConnect: true,
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const trustedAddress = this.identities.trustedAddress(request);

    if (!trustedAddress) {
      // Never hash the tunnel's shared internal IP or unverified X-Forwarded-For.
      return true;
    }

    const hashed = this.identities.hash(trustedAddress);
    const activeBlock = await this.database.iPBlock.findFirst({
      where: {
        ipHash: hashed.ipHash,
        hashKeyVersion: hashed.hashKeyVersion,
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true },
    });

    if (activeBlock) {
      this.logger.warn('IP_BLOCKED_ACCESS_DENIED: pseudonymous active block');
      throw new ForbiddenException({
        code: 'IP_BLOCKED',
        message: 'This network has been temporarily restricted.',
      });
    }

    const category = classifyWrite(request);
    if (!category) {
      return true;
    }

    const key = `kurvenfunk:ip-rate:v1:${hashed.hashKeyVersion}:${category}:${hashed.ipHash}`;
    let count: unknown;
    try {
      count = await this.redis.eval(RATE_SCRIPT, 1, key, RATE_WINDOW_MS);
    } catch {
      throw new ServiceUnavailableException({
        code: 'IP_RATE_LIMIT_UNAVAILABLE',
        message: 'Posting is temporarily unavailable.',
      });
    }

    if (typeof count !== 'number' || !Number.isFinite(count)) {
      throw new ServiceUnavailableException({
        code: 'IP_RATE_LIMIT_UNAVAILABLE',
        message: 'Posting is temporarily unavailable.',
      });
    }

    if (count > RATE_MAX[category]!) {
      throw new HttpException(
        {
          code: 'IP_RATE_LIMIT',
          message: 'Too many requests from this network. Please try again shortly.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  onModuleDestroy(): void {
    if (this.redis.status !== 'end') {
      this.redis.disconnect();
    }
    void this.database.$disconnect();
  }
}
