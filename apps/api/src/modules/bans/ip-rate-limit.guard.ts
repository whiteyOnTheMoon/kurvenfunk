import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Optional,
  type OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import Redis from 'ioredis';

import { IpIdentityService } from './ip-identity.service';
import { TemporaryIpBlockService } from './temporary-ip-block.service';
import { TrustedClientIpService } from './trusted-client-ip.service';

export const IP_RATE_LIMITS = {
  comments: 30,
  forum: 30,
  reports: 10,
} as const;

type WriteCategory = keyof typeof IP_RATE_LIMITS;

const RATE_WINDOW_MS = 60_000;

/** Fixed window, atomic INCR+PEXPIRE, no non-atomic read/write race. */
const RATE_LUA = [
  "local n = redis.call('INCR', KEYS[1])",
  "if n == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end",
  'return n',
].join('\n');

/**
 * Record one over-quota event per UTC minute, never one per HTTP request.
 * Only three distinct minutes in a rolling 30-minute period can trigger
 * one 15-minute block. All keys contain versioned HMACs, never raw IPs.
 */
export const AUTO_ESCALATION_LUA = [
  "redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1] - ARGV[2])",
  "redis.call('ZADD', KEYS[1], 'NX', ARGV[1], ARGV[3])",
  "redis.call('EXPIRE', KEYS[1], ARGV[4])",
  "if redis.call('ZCARD', KEYS[1]) < 3 then return 0 end",
  "if redis.call('SET', KEYS[2], '1', 'NX', 'EX', ARGV[4]) then return 1 end",
  'return 0',
].join('\\n');

const AUTO_ESCALATION_WINDOW_MS = 30 * 60_000;
const AUTO_ESCALATION_TTL_SEC = 30 * 60;

export function classifyIpLimitedWrite(method: string, url: string): WriteCategory | null {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return null;
  const path = url.split('?', 1)[0] ?? '';
  if (!path.startsWith('/api/v1/')) return null;

  // Reports have priority over their comment-parent path.
  if (method === 'POST' && /^\/api\/v1\/comments\/[^/]+\/reports$/u.test(path)) {
    return 'reports';
  }
  if (/^\/api\/v1\/articles\/[^/]+\/comments(?:\/|$)/u.test(path)) {
    return 'comments';
  }
  if (/^\/api\/v1\/comments\/[^/]+\/votes$/u.test(path)) {
    return 'comments';
  }
  if (/^\/api\/v1\/(?:forums|threads|posts)(?:\/|$)/u.test(path)) {
    return 'forum';
  }
  return null;
}

function unavailable(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    code: 'IP_RATE_LIMIT_UNAVAILABLE',
    message: 'This operation is temporarily unavailable.',
  });
}

/**
 * Task 182: additional per-network write quotas.
 *
 * Disabled by default. When enabled, an untrusted socket peer, absent CF
 * header or missing hashing secret causes a 503 instead of silently bypassing
 * the protection. Never hash or log a raw header without verifying its peer.
 */
@Injectable()
export class IpRateLimitGuard implements CanActivate, OnModuleDestroy {
  private readonly redis: Redis | null;
  private readonly enabled: boolean;
  private readonly autoBlockEnabled: boolean;

  constructor(
    private readonly identity: IpIdentityService,
    private readonly trustedIp: TrustedClientIpService,
    config: ConfigService,
    @Optional() private readonly temporaryBlocks?: TemporaryIpBlockService,
  ) {
    this.enabled = config.get<string>('IP_RATE_LIMIT_ENABLED', 'false') === 'true';
    const autoRequested = config.get<string>('IP_TEMP_AUTO_BLOCK_ENABLED', 'false') === 'true';
    const blockEnabled = config.get<string>('IP_TEMP_BLOCK_ENABLED', 'false') === 'true';
    if (autoRequested && (!this.enabled || !blockEnabled)) {
      throw new Error('IP_TEMP_AUTO_BLOCK_REQUIRES_BOTH_GUARDS');
    }
    this.autoBlockEnabled = autoRequested;
    this.redis = this.enabled
      ? new Redis({
          host: config.get<string>('REDIS_HOST', 'redis'),
          port: Number(config.get<number>('REDIS_PORT', 6379)),
          password: config.getOrThrow<string>('REDIS_PASSWORD'),
          lazyConnect: false,
          connectTimeout: 1500,
          maxRetriesPerRequest: 1,
          // Fail closed without queuing writes, then reconnect automatically.
          enableOfflineQueue: false,
          retryStrategy: (attempt) => Math.min(attempt * 100, 1000),
        })
      : null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.enabled) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const category = classifyIpLimitedWrite(request.method, request.originalUrl);
    if (!category) return true;

    const address = await this.trustedIp.fromRequest(request);
    if (!address || !this.identity.isConfigured) {
      throw unavailable();
    }

    const hashed = this.identity.hash(address);
    const key = [
      'kurvenfunk:ip-write-rate:v1',
      hashed.hashKeyVersion,
      category,
      hashed.ipHash,
    ].join(':');

    let count: unknown;
    try {
      count = await this.redis?.eval(RATE_LUA, 1, key, RATE_WINDOW_MS);
    } catch {
      throw unavailable();
    }

    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 1) {
      throw unavailable();
    }

    if (count > IP_RATE_LIMITS[category]) {
      // A temporary block is never created on a single burst. Automatic
      // escalation requires three DISTINCT abusive minutes and explicit
      // operator opt-in, to reduce false positives on shared networks.
      if (this.autoBlockEnabled && this.temporaryBlocks) {
        try {
          const evidenceKey = [
            'kurvenfunk:ip-write-escalation:v1',
            hashed.hashKeyVersion,
            category,
            hashed.ipHash,
          ].join(':');
          const now = Date.now();
          const shouldBlock: unknown = await this.redis?.eval(
            AUTO_ESCALATION_LUA,
            2,
            evidenceKey,
            evidenceKey + ':once',
            now,
            AUTO_ESCALATION_WINDOW_MS,
            Math.floor(now / RATE_WINDOW_MS),
            AUTO_ESCALATION_TTL_SEC,
          );
          if (shouldBlock === 1) {
            await this.temporaryBlocks.issueAutomatic(address);
          }
        } catch {
          // This request is already over quota. Never bypass the 429 or
          // disclose DB/Redis details if block creation is unavailable.
        }
      }
      throw new HttpException(
        {
          code: 'IP_RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again shortly.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  onModuleDestroy(): void {
    if (this.redis && this.redis.status !== 'end') {
      this.redis.disconnect();
    }
  }
}
