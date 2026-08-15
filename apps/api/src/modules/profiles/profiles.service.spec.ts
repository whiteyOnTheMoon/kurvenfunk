const findUniqueOrThrow = jest.fn();
const update = jest.fn();
const findFirstClub = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    user: {
      findUniqueOrThrow,
      update,
    },
    club: {
      findFirst: findFirstClub,
    },
    $disconnect: disconnect,
  }),
}));

import { BadRequestException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';

describe('ProfilesService', () => {
  let service: ProfilesService;

  beforeEach(() => {
    findUniqueOrThrow.mockReset();
    update.mockReset();
    findFirstClub.mockReset();
    disconnect.mockReset();

    service = new ProfilesService();
  });

  it('returns the current fan preference', async () => {
    findUniqueOrThrow.mockResolvedValue({
      fanPreference: 'CLUB',
      favoriteClubId: '11111111-1111-4111-8111-111111111111',
    });

    await expect(service.getFanPreference('user-123')).resolves.toEqual({
      fanPreference: 'CLUB',
      favoriteClubId: '11111111-1111-4111-8111-111111111111',
    });

    expect(findUniqueOrThrow).toHaveBeenCalledWith({
      where: {
        id: 'user-123',
      },
      select: {
        fanPreference: true,
        favoriteClubId: true,
      },
    });
  });

  it('changes the favorite club from one active club to another', async () => {
    findFirstClub.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
    });

    update.mockResolvedValue({
      fanPreference: 'CLUB',
      favoriteClubId: '22222222-2222-4222-8222-222222222222',
    });

    await expect(
      service.updateFanPreference('user-123', {
        fanPreference: 'CLUB',
        favoriteClubId: '22222222-2222-4222-8222-222222222222',
      }),
    ).resolves.toEqual({
      fanPreference: 'CLUB',
      favoriteClubId: '22222222-2222-4222-8222-222222222222',
    });

    expect(findFirstClub).toHaveBeenCalledWith({
      where: {
        id: '22222222-2222-4222-8222-222222222222',
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
        fanPreference: 'CLUB',
        favoriteClubId: '22222222-2222-4222-8222-222222222222',
      },
      select: {
        fanPreference: true,
        favoriteClubId: true,
      },
    });
  });

  it('changes a club preference to Neutral without looking up a club', async () => {
    update.mockResolvedValue({
      fanPreference: 'NEUTRAL',
      favoriteClubId: null,
    });

    await expect(
      service.updateFanPreference('user-123', {
        fanPreference: 'NEUTRAL',
        favoriteClubId: null,
      }),
    ).resolves.toEqual({
      fanPreference: 'NEUTRAL',
      favoriteClubId: null,
    });

    expect(findFirstClub).not.toHaveBeenCalled();

    expect(update).toHaveBeenCalledWith({
      where: {
        id: 'user-123',
      },
      data: {
        fanPreference: 'NEUTRAL',
        favoriteClubId: null,
      },
      select: {
        fanPreference: true,
        favoriteClubId: true,
      },
    });
  });

  it('changes Neutral to an active club preference', async () => {
    findFirstClub.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
    });

    update.mockResolvedValue({
      fanPreference: 'CLUB',
      favoriteClubId: '33333333-3333-4333-8333-333333333333',
    });

    await expect(
      service.updateFanPreference('user-123', {
        fanPreference: 'CLUB',
        favoriteClubId: '33333333-3333-4333-8333-333333333333',
      }),
    ).resolves.toEqual({
      fanPreference: 'CLUB',
      favoriteClubId: '33333333-3333-4333-8333-333333333333',
    });

    expect(update).toHaveBeenCalledWith({
      where: {
        id: 'user-123',
      },
      data: {
        fanPreference: 'CLUB',
        favoriteClubId: '33333333-3333-4333-8333-333333333333',
      },
      select: {
        fanPreference: true,
        favoriteClubId: true,
      },
    });
  });

  it('rejects an inactive or unknown favorite club', async () => {
    findFirstClub.mockResolvedValue(null);

    const promise = service.updateFanPreference('user-123', {
      fanPreference: 'CLUB',
      favoriteClubId: '44444444-4444-4444-8444-444444444444',
    });

    await expect(promise).rejects.toBeInstanceOf(BadRequestException);

    try {
      await promise;
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        code: 'INVALID_FAVORITE_CLUB',
        message: 'Favorite club does not exist or is inactive',
      });
    }

    expect(update).not.toHaveBeenCalled();
  });

  it('does not change onboarding completion when updating the fan preference', async () => {
    update.mockResolvedValue({
      fanPreference: 'NEUTRAL',
      favoriteClubId: null,
    });

    await service.updateFanPreference('user-123', {
      fanPreference: 'NEUTRAL',
      favoriteClubId: null,
    });

    expect(update).toHaveBeenCalledWith({
      where: {
        id: 'user-123',
      },
      data: {
        fanPreference: 'NEUTRAL',
        favoriteClubId: null,
      },
      select: {
        fanPreference: true,
        favoriteClubId: true,
      },
    });
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
