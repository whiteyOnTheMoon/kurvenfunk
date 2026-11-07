import { ServiceUnavailableException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import type { IpIdentityService } from './ip-identity.service';
import { classifyIpLimitedWrite, IpRateLimitGuard, IP_RATE_LIMITS } from './ip-rate-limit.guard';

const redisEval = jest.fn<(...args: unknown[]) => Promise<number>>().mockResolvedValue(1);
const redisDisconnect = jest.fn();

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    eval: (...args: unknown[]) => redisEval(...args),
    disconnect: redisDisconnect,
    status: 'wait',
  })),
}));

function context(method: string, originalUrl: string): ExecutionContext {
  const request = { method, originalUrl } as Request;
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function setup(enabled = true) {
  const ip = {
    fromRequest: jest.fn<() => Promise<string | null>>().mockResolvedValue('203.0.113.22'),
  };
  const identity = {
    isConfigured: true,
    hash: jest.fn().mockReturnValue({ ipHash: 'a'.repeat(64), hashKeyVersion: 'v2' }),
  };
  const config = {
    get: (key: string, fallback?: string | number) => {
      if (key === 'IP_RATE_LIMIT_ENABLED') return enabled ? 'true' : 'false';
      if (key === 'REDIS_PASSWORD') return 'test-redis-secret';
      return fallback;
    },
    getOrThrow: () => 'test-redis-secret',
  } as unknown as ConfigService;

  const guard = new IpRateLimitGuard(
    identity as unknown as IpIdentityService,
    ip,
    config,
  );
  return { guard, ip, identity };
}

describe('Task 182 – API IP rate limits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisEval.mockResolvedValue(1);
  });

  it.each([
    ['POST', '/api/v1/articles/uuid/comments', 'comments'],
    ['PATCH', '/api/v1/articles/uuid/comments/uuid', 'comments'],
    ['DELETE', '/api/v1/articles/uuid/comments/uuid', 'comments'],
    ['POST', '/api/v1/articles/uuid/comments/uuid/replies', 'comments'],
    ['PUT', '/api/v1/comments/uuid/votes', 'comments'],
    ['DELETE', '/api/v1/comments/uuid/votes', 'comments'],
    ['POST', '/api/v1/comments/uuid/reports', 'reports'],
    ['POST', '/api/v1/forums/uuid/threads', 'forum'],
    ['POST', '/api/v1/threads/uuid/posts', 'forum'],
    ['PATCH', '/api/v1/posts/uuid', 'forum'],
  ])('classifies %s %s as %s', (method, url, expected) => {
    expect(classifyIpLimitedWrite(method, url)).toBe(expected);
  });

  it.each([
    ['GET', '/api/v1/articles/uuid/comments'],
    ['GET', '/api/v1/comments/uuid/reports'],
    ['POST', '/api/v1/moderation/comment-reports/uuid/resolve'],
    ['POST', '/api/v1/auth/login'],
    ['POST', '/realms/kurvenfunk/protocol/openid-connect/token'],
    ['POST', '/api/v1/articles/uuid'],
    ['POST', '/api/v1/article/comments-incorrect'],
  ])('does not throttle unrelated or read-only operation', (method, url) => {
    expect(classifyIpLimitedWrite(method, url)).toBeNull();
  });

  it('has documented per-minute thresholds and is off by default', async () => {
    expect(IP_RATE_LIMITS).toEqual({ comments: 30, forum: 30, reports: 10 });
    const { guard, ip } = setup(false);
    try {
      await expect(
        guard.canActivate(context('POST', '/api/v1/articles/uuid/comments')),
      ).resolves.toBe(true);
      expect(ip.fromRequest).not.toHaveBeenCalled();
      expect(redisEval).not.toHaveBeenCalled();
    } finally {
      guard.onModuleDestroy();
    }
  });

  it('counts trusted clients under HMAC keys without storing raw addresses', async () => {
    const { guard } = setup();
    try {
      await expect(
        guard.canActivate(context('POST', '/api/v1/comments/uuid/reports')),
      ).resolves.toBe(true);
      expect(redisEval).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(redisEval.mock.calls)).not.toContain('203.0.113.22');
      expect(JSON.stringify(redisEval.mock.calls)).toContain('ip-write-rate:v1:v2:reports:');
      expect(redisEval.mock.calls[0]?.[2]).toBe(1);
      expect(redisEval.mock.calls[0]?.[3]).toBe(60000);
    } finally {
      guard.onModuleDestroy();
    }
  });

  it('returns 429 on the first over-limit request and permits the threshold', async () => {
    const { guard } = setup();
    try {
      redisEval.mockResolvedValueOnce(30).mockResolvedValueOnce(31);
      await expect(
        guard.canActivate(context('POST', '/api/v1/articles/uuid/comments')),
      ).resolves.toBe(true);
      const attempt = guard.canActivate(context('POST', '/api/v1/articles/uuid/comments'));
      await expect(attempt).rejects.toMatchObject({ status: 429 });
    } finally {
      guard.onModuleDestroy();
    }
  });

  it('fails closed if the socket is untrusted or CF header is absent', async () => {
    const { guard, ip } = setup();
    try {
      ip.fromRequest.mockResolvedValue(null);
      await expect(
        guard.canActivate(context('POST', '/api/v1/articles/uuid/comments')),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(redisEval).not.toHaveBeenCalled();
    } finally {
      guard.onModuleDestroy();
    }
  });

  it('fails closed if the HMAC key is missing', async () => {
    const { guard, identity } = setup();
    try {
      identity.isConfigured = false;
      await expect(
        guard.canActivate(context('POST', '/api/v1/comments/uuid/reports')),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(redisEval).not.toHaveBeenCalled();
    } finally {
      guard.onModuleDestroy();
    }
  });

  it('fails closed on Redis errors, never bypasses rate limits', async () => {
    const { guard } = setup();
    try {
      redisEval.mockRejectedValueOnce(new Error('private backend failure'));
      await expect(
        guard.canActivate(context('POST', '/api/v1/comments/uuid/reports')),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    } finally {
      guard.onModuleDestroy();
    }
  });

  it('does not count public reads, including when Redis is unavailable', async () => {
    const { guard } = setup();
    try {
      redisEval.mockRejectedValue(new Error('Redis unavailable'));
      await expect(guard.canActivate(context('GET', '/api/v1/articles'))).resolves.toBe(true);
      expect(redisEval).not.toHaveBeenCalled();
    } finally {
      guard.onModuleDestroy();
    }
  });
});
