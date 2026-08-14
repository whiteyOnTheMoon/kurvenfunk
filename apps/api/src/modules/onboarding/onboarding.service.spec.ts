const update = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;

    constructor(message: string, options: { code: string }) {
      super(message);
      this.code = options.code;
    }
  }

  return {
    createPrismaClient: () => ({
      user: {
        update,
      },
      $disconnect: disconnect,
    }),
    Prisma: {
      PrismaClientKnownRequestError,
    },
  };
});

import { ConflictException } from '@nestjs/common';
import { Prisma } from '@kurvenfunk/database';
import { OnboardingService } from './onboarding.service';

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(() => {
    update.mockReset();
    disconnect.mockReset();
    service = new OnboardingService();
  });

  it('sets the nickname for the authenticated user', async () => {
    update.mockResolvedValue({
      id: 'user-123',
      nickname: 'RapidFan',
    });

    await expect(service.selectNickname('user-123', 'RapidFan')).resolves.toEqual({
      id: 'user-123',
      nickname: 'RapidFan',
    });

    expect(update).toHaveBeenCalledWith({
      where: {
        id: 'user-123',
      },
      data: {
        nickname: 'RapidFan',
      },
      select: {
        id: true,
        nickname: true,
      },
    });
  });

  it('returns NICKNAME_TAKEN for a unique constraint conflict', async () => {
    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    );

    let caught: unknown;

    try {
      await service.selectNickname('user-123', 'rapidfan');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ConflictException);
    expect((caught as ConflictException).getResponse()).toEqual({
      code: 'NICKNAME_TAKEN',
      message: 'Nickname is already taken',
    });
  });

  it('rethrows unexpected database errors', async () => {
    const error = new Error('database unavailable');
    update.mockRejectedValue(error);

    await expect(service.selectNickname('user-123', 'RapidFan')).rejects.toBe(error);
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
