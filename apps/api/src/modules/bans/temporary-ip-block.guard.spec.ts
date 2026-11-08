import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import type { TemporaryIpBlockService } from './temporary-ip-block.service';
import { TemporaryIpBlockGuard } from './temporary-ip-block.guard';

const now = new Date('2026-11-08T10:00:00.000Z');

function context(method = 'POST', originalUrl = '/api/v1/articles/id/comments'): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ method, originalUrl }) as Request }),
  } as unknown as ExecutionContext;
}

function setup(enabled = true) {
  const trustedIp = {
    fromRequest: jest.fn().mockResolvedValue('192.0.2.33'),
  };
  const blocks = {
    findActive: jest.fn().mockResolvedValue(null),
  };
  const config = {
    get: (key: string, fallback?: string) =>
      key === 'IP_TEMP_BLOCK_ENABLED' ? (enabled ? 'true' : 'false') : fallback,
  };
  const guard = new TemporaryIpBlockGuard(
    trustedIp,
    blocks as unknown as TemporaryIpBlockService,
    config as ConfigService,
  );
  return { guard, trustedIp, blocks };
}

describe('Task 183 fail-closed temporary IP guard', () => {
  it('stays disabled until explicitly opted into the API runtime', async () => {
    const { guard, trustedIp, blocks } = setup(false);
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(trustedIp.fromRequest).not.toHaveBeenCalled();
    expect(blocks.findActive).not.toHaveBeenCalled();
  });

  it('allows regular writes and does not touch unrelated public GET endpoints', async () => {
    const { guard, blocks } = setup();
    await expect(guard.canActivate(context())).resolves.toBe(true);
    await expect(guard.canActivate(context('GET'))).resolves.toBe(true);
    expect(blocks.findActive).toHaveBeenCalledTimes(1);
  });

  it('forbids active blocks without revealing the HMAC or underlying IP', async () => {
    const { guard, blocks } = setup();
    blocks.findActive.mockResolvedValueOnce({ id: 'record', expiresAt: now });
    await expect(guard.canActivate(context())).rejects.toMatchObject({
      status: 403,
      response: { code: 'IP_TEMPORARILY_BLOCKED' },
    });
  });

  it('rejects missing or untrusted network identity with 503 on writes', async () => {
    const { guard, trustedIp, blocks } = setup();
    trustedIp.fromRequest.mockResolvedValueOnce(null);
    await expect(guard.canActivate(context())).rejects.toMatchObject({ status: 503 });
    expect(blocks.findActive).not.toHaveBeenCalled();
  });

  it('fails closed on database errors but leaves GET unaffected', async () => {
    const { guard, blocks } = setup();
    blocks.findActive.mockRejectedValueOnce(new Error('Database connection lost'));
    await expect(guard.canActivate(context())).rejects.toMatchObject({
      status: 503,
      response: { code: 'IP_TEMP_BLOCK_CHECK_UNAVAILABLE' },
    });
    await expect(guard.canActivate(context('GET'))).resolves.toBe(true);
  });

  it('does not affect unrelated moderation routes', async () => {
    const { guard, blocks } = setup();
    await expect(
      guard.canActivate(context('POST', '/api/v1/moderation/limited-sanctions')),
    ).resolves.toBe(true);
    expect(blocks.findActive).not.toHaveBeenCalled();
  });
});
