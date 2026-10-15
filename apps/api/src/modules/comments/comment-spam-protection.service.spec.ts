const mockRedisEval = jest.fn();
const mockRedisDisconnect = jest.fn();

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    eval: mockRedisEval,
    disconnect: mockRedisDisconnect,
    status: 'wait',
  })),
}));

import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import { CommentSpamProtectionService } from './comment-spam-protection.service';

describe('CommentSpamProtectionService', () => {
  let service: CommentSpamProtectionService;

  beforeEach(() => {
    mockRedisEval.mockReset();
    mockRedisDisconnect.mockClear();

    mockRedisEval.mockResolvedValue(0);

    const config = {
      get: (_key: string, fallback: unknown) => fallback,
      getOrThrow: () => 'test-password',
    } as unknown as ConfigService;

    service = new CommentSpamProtectionService(config);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('link limits', () => {
    it('accepts comments without links', () => {
      expect(() => service.validateLinks('Rapid gewinnt heute!')).not.toThrow();
    });

    it('accepts two links', () => {
      expect(() =>
        service.validateLinks('https://rapid.at und https://bundesliga.at'),
      ).not.toThrow();
    });

    it('rejects more than two links', () => {
      try {
        service.validateLinks('https://eins.at https://zwei.at https://drei.at');

        throw new Error('Expected link limit rejection');
      } catch (error: unknown) {
        if (!(error instanceof BadRequestException)) {
          throw error;
        }

        expect(error.getResponse()).toMatchObject({
          code: 'COMMENT_LINK_LIMIT',
        });
      }
    });

    it('recognizes domains without https', () => {
      expect(() => service.validateLinks('rapid.at bundesliga.at example.com')).toThrow();
    });

    it('does not count email addresses as links', () => {
      expect(() => service.validateLinks('Kontakt: user@example.at')).not.toThrow();
    });
  });

  describe('Redis reservations', () => {
    it('accepts an allowed comment', async () => {
      const result = await service.reserve('test-user', 'Rapid gewinnt!');

      expect(result.token).toEqual(expect.any(String));
      expect(result.keys).toHaveLength(3);

      expect(mockRedisEval).toHaveBeenCalledTimes(1);

      const args = mockRedisEval.mock.calls[0] as unknown[];

      expect(args[1]).toBe(3);

      expect(args[2]).toBe('kurvenfunk:comments:spam:v1:test-user:rate');

      expect(args[3]).toBe('kurvenfunk:comments:spam:v1:test-user:cooldown');

      expect(args[4]).toMatch(/^kurvenfunk:comments:spam:v1:test-user:duplicate:[a-f0-9]{64}$/);

      expect(args[5]).toBe(result.token);
      expect(args[6]).toBe(60000);
      expect(args[7]).toBe(10);
      expect(args[8]).toBe(5000);
      expect(args[9]).toBe(300000);
    });

    it('normalizes duplicate comment content', async () => {
      const first = await service.reserve('test-user', '  RAPID   gewinnt! ');

      const second = await service.reserve('test-user', 'rapid gewinnt!');

      expect(first.keys[2]).toBe(second.keys[2]);
    });

    it('keeps users separate', async () => {
      const first = await service.reserve('user-one', 'Rapid gewinnt!');

      const second = await service.reserve('user-two', 'Rapid gewinnt!');

      expect(first.keys[0]).not.toBe(second.keys[0]);
      expect(first.keys[2]).not.toBe(second.keys[2]);
    });

    it('rejects rate limit violations', async () => {
      mockRedisEval.mockResolvedValueOnce(1);

      await expect(service.reserve('test-user', 'Kommentar')).rejects.toMatchObject({
        status: 429,
        response: {
          code: 'COMMENT_RATE_LIMIT',
        },
      });
    });

    it('rejects posting too frequently', async () => {
      mockRedisEval.mockResolvedValueOnce(2);

      await expect(service.reserve('test-user', 'Kommentar')).rejects.toMatchObject({
        status: 429,
        response: {
          code: 'COMMENT_POST_COOLDOWN',
        },
      });
    });

    it('rejects duplicate spam', async () => {
      mockRedisEval.mockResolvedValueOnce(3);

      await expect(service.reserve('test-user', 'Kommentar')).rejects.toMatchObject({
        status: 409,
        response: {
          code: 'COMMENT_DUPLICATE_SPAM',
        },
      });
    });

    it('rejects unknown Redis results', async () => {
      mockRedisEval.mockResolvedValueOnce(99);

      await expect(service.reserve('test-user', 'Kommentar')).rejects.toMatchObject({
        status: 503,
        response: {
          code: 'COMMENT_SPAM_PROTECTION_UNAVAILABLE',
        },
      });
    });

    it('fails closed when Redis is unavailable', async () => {
      mockRedisEval.mockRejectedValueOnce(new Error('Redis unavailable'));

      await expect(service.reserve('test-user', 'Kommentar')).rejects.toMatchObject({
        status: 503,
        response: {
          code: 'COMMENT_SPAM_PROTECTION_UNAVAILABLE',
        },
      });
    });

    it('rejects excessive links before accessing Redis', async () => {
      await expect(service.reserve('test-user', 'eins.at zwei.at drei.at')).rejects.toMatchObject({
        response: {
          code: 'COMMENT_LINK_LIMIT',
        },
      });

      expect(mockRedisEval).not.toHaveBeenCalled();
    });

    it('releases a reservation using its token', async () => {
      const reservation = await service.reserve('test-user', 'Kommentar');

      await service.release(reservation);

      expect(mockRedisEval).toHaveBeenCalledTimes(2);

      const args = mockRedisEval.mock.calls[1] as unknown[];

      expect(args[1]).toBe(3);
      expect(args.slice(2, 5)).toEqual(reservation.keys);
      expect(args[5]).toBe(reservation.token);
    });
  });

  it('disconnects Redis on shutdown', () => {
    service.onModuleDestroy();

    expect(mockRedisDisconnect).toHaveBeenCalled();
  });
});
