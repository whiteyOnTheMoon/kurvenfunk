const update = jest.fn();
const findFirstUser = jest.fn();
const findFirstClub = jest.fn();
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
        findFirst: findFirstUser,
      },
      club: {
        findFirst: findFirstClub,
      },
      $disconnect: disconnect,
    }),
    Prisma: {
      PrismaClientKnownRequestError,
    },
  };
});

import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@kurvenfunk/database';
import { OnboardingService } from './onboarding.service';

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(() => {
    update.mockReset();
    findFirstUser.mockReset();
    findFirstClub.mockReset();
    disconnect.mockReset();
    service = new OnboardingService();
  });

  it('returns available when no other user has the nickname', async () => {
    findFirstUser.mockResolvedValue(null);

    await expect(service.checkNicknameAvailability('user-123', 'RapidFan')).resolves.toEqual({
      available: true,
      nickname: 'RapidFan',
    });
  });

  it('returns unavailable when another user has the nickname', async () => {
    findFirstUser.mockResolvedValue({
      id: 'user-456',
    });

    await expect(service.checkNicknameAvailability('user-123', 'rapidfan')).resolves.toEqual({
      available: false,
      nickname: 'rapidfan',
    });
  });

  it('completes onboarding with an active club preference', async () => {
    findFirstUser.mockResolvedValue(null);
    findFirstClub.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
    });
    update.mockResolvedValue({
      id: 'user-123',
      nickname: 'RapidFan',
      fanPreference: 'CLUB',
      favoriteClubId: '11111111-1111-4111-8111-111111111111',
      onboardingCompleted: true,
    });

    await expect(
      service.completeOnboarding('user-123', {
        nickname: 'RapidFan',
        fanPreference: 'CLUB',
        favoriteClubId: '11111111-1111-4111-8111-111111111111',
      }),
    ).resolves.toEqual({
      id: 'user-123',
      nickname: 'RapidFan',
      fanPreference: 'CLUB',
      favoriteClubId: '11111111-1111-4111-8111-111111111111',
      onboardingCompleted: true,
    });

    expect(findFirstClub).toHaveBeenCalledWith({
      where: {
        id: '11111111-1111-4111-8111-111111111111',
        active: true,
      },
      select: {
        id: true,
      },
    });

    expect(update).toHaveBeenCalledWith({
      where: {
        id: 'user-123',
      },
      data: {
        nickname: 'RapidFan',
        fanPreference: 'CLUB',
        favoriteClubId: '11111111-1111-4111-8111-111111111111',
        onboardingCompleted: true,
      },
      select: {
        id: true,
        nickname: true,
        fanPreference: true,
        favoriteClubId: true,
        onboardingCompleted: true,
      },
    });
  });

  it('completes onboarding with a neutral preference without looking up a club', async () => {
    findFirstUser.mockResolvedValue(null);
    update.mockResolvedValue({
      id: 'user-123',
      nickname: 'NeutralFan',
      fanPreference: 'NEUTRAL',
      favoriteClubId: null,
      onboardingCompleted: true,
    });

    await expect(
      service.completeOnboarding('user-123', {
        nickname: 'NeutralFan',
        fanPreference: 'NEUTRAL',
        favoriteClubId: null,
      }),
    ).resolves.toEqual({
      id: 'user-123',
      nickname: 'NeutralFan',
      fanPreference: 'NEUTRAL',
      favoriteClubId: null,
      onboardingCompleted: true,
    });

    expect(findFirstClub).not.toHaveBeenCalled();
  });

  it('rejects an inactive or unknown favorite club', async () => {
    findFirstUser.mockResolvedValue(null);
    findFirstClub.mockResolvedValue(null);

    await expect(
      service.completeOnboarding('user-123', {
        nickname: 'RapidFan',
        fanPreference: 'CLUB',
        favoriteClubId: '11111111-1111-4111-8111-111111111111',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(update).not.toHaveBeenCalled();
  });

  it('rejects onboarding completion when another user already has the nickname', async () => {
    findFirstUser.mockResolvedValue({
      id: 'user-456',
    });

    await expect(
      service.completeOnboarding('user-123', {
        nickname: 'RapidFan',
        fanPreference: 'NEUTRAL',
        favoriteClubId: null,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(update).not.toHaveBeenCalled();
  });

  it('maps a database nickname conflict to NICKNAME_TAKEN', async () => {
    findFirstUser.mockResolvedValue(null);

    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    );

    await expect(
      service.completeOnboarding('user-123', {
        nickname: 'RapidFan',
        fanPreference: 'NEUTRAL',
        favoriteClubId: null,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
