import { ForbiddenException, HttpException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import type { IpIdentityService } from './ip-identity.service';
import { IpPolicyGuard } from './ip-policy.guard';

jest.mock('@kurvenfunk/database', () => ({ createPrismaClient: jest.fn() }));

const mockRedisEval = jest.fn();
const mockRedisDisconnect = jest.fn();
jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    eval: (...args: unknown[]) => mockRedisEval(...args),
    disconnect: mockRedisDisconnect,
    status: 'wait',
  })),
}));

function context(method: string, originalUrl: string): ExecutionContext {
  const request = { method, originalUrl, headers: { 'cf-connecting-ip': '203.0.113.10' } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('IpPolicyGuard – IP blocks and rate limits', () => {
  let guard: IpPolicyGuard;
  let findFirst: jest.Mock;
  let trustedAddress: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisEval.mockResolvedValue(1);
    findFirst = jest.fn().mockResolvedValue(null);
    jest.mocked(createPrismaClient).mockReturnValue({
      iPBlock: { findFirst },
      $disconnect: jest.fn().mockResolvedValue(undefined),
    } as unknown as DatabaseClient);
    trustedAddress = jest.fn().mockReturnValue('203.0.113.10');
    const identities = {
      trustedAddress,
      hash: jest.fn().mockReturnValue({ ipHash: 'a'.repeat(64), hashKeyVersion: 'v1' }),
    } as unknown as IpIdentityService;
    const config = {
      get: (key: string, fallback?: unknown) => (key === 'REDIS_PASSWORD' ? 'unit-test' : fallback),
      getOrThrow: () => 'unit-test',
    } as unknown as ConfigService;

    guard = new IpPolicyGuard(identities, config);
  });

  afterEach(() => {
    guard.onModuleDestroy();
  });

  it('is inactive when the Cloudflare trust boundary is not configured', async () => {
    trustedAddress.mockReturnValueOnce(null);
    await expect(guard.canActivate(context('POST', '/api/v1/comments'))).resolves.toBe(true);
    expect(findFirst).not.toHaveBeenCalled();
    expect(mockRedisEval).not.toHaveBeenCalled();
  });

  it('denies an IP with an active unexpired block without logging a raw address', async () => {
    findFirst.mockResolvedValueOnce({ id: 'block-id' });
    await expect(guard.canActivate(context('GET', '/api/v1/news'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(mockRedisEval).not.toHaveBeenCalled();
  });

  it('allows a trusted unblocked IP to read public resources', async () => {
    await expect(guard.canActivate(context('GET', '/api/v1/news'))).resolves.toBe(true);
    expect(mockRedisEval).not.toHaveBeenCalled();
  });

  it('applies Redis rate controls to comments, reports, and forum posts', async () => {
    await expect(guard.canActivate(context('POST', '/api/v1/articles/123/comments'))).resolves.toBe(
      true,
    );
    await expect(guard.canActivate(context('POST', '/api/v1/comments/123/reports'))).resolves.toBe(
      true,
    );
    await expect(guard.canActivate(context('POST', '/api/v1/forums/123/posts'))).resolves.toBe(
      true,
    );
    expect(mockRedisEval).toHaveBeenCalledTimes(3);
    const calls = mockRedisEval.mock.calls as unknown[][];
    expect(JSON.stringify(calls)).not.toContain('203.0.113.10');
    expect(JSON.stringify(calls)).toContain('ip-rate:v1');
  });

  it('responds HTTP 429 when an IP exceeds the write limit', async () => {
    mockRedisEval.mockResolvedValueOnce(31);
    await expect(
      guard.canActivate(context('POST', '/api/v1/articles/123/comments')),
    ).rejects.toBeInstanceOf(HttpException);
    expect(mockRedisEval).toHaveBeenCalledTimes(1);
  });

  it('denies writes safely if the IP rate store is unavailable', async () => {
    mockRedisEval.mockRejectedValueOnce(new Error('Redis unavailable'));
    await expect(
      guard.canActivate(context('POST', '/api/v1/comments/123/reports')),
    ).rejects.toThrow('Posting is temporarily unavailable.');
  });
});
