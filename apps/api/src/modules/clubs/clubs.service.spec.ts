const findMany = jest.fn();
const findFirst = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    club: {
      findMany,
      findFirst,
    },
    $disconnect: disconnect,
  }),
}));

import { ClubsService } from './clubs.service';

describe('ClubsService', () => {
  let service: ClubsService;

  beforeEach(() => {
    findMany.mockReset();
    findFirst.mockReset();
    disconnect.mockReset();
    service = new ClubsService();
  });

  it('returns only active clubs sorted by name', async () => {
    const clubs = [
      {
        id: 'club-1',
        name: 'FK Austria Wien',
        shortName: 'Austria Wien',
        slug: 'fk-austria-wien',
        color1Hex: '#5B2C83',
        color1Rgba: 'rgba(91, 44, 131, 1)',
        color2Hex: '#FFFFFF',
        color2Rgba: 'rgba(255, 255, 255, 1)',
        color3Hex: null,
        color3Rgba: null,
        accentColorHex: '#D4AF37',
        accentColorRgba: 'rgba(212, 175, 55, 1)',
        logoMedia: null,
      },
      {
        id: 'club-2',
        name: 'SK Rapid Wien',
        shortName: 'Rapid Wien',
        slug: 'sk-rapid-wien',
        color1Hex: '#007A3D',
        color1Rgba: 'rgba(0, 122, 61, 1)',
        color2Hex: '#FFFFFF',
        color2Rgba: 'rgba(255, 255, 255, 1)',
        color3Hex: null,
        color3Rgba: null,
        accentColorHex: '#D4AF37',
        accentColorRgba: 'rgba(212, 175, 55, 1)',
        logoMedia: null,
      },
    ];

    findMany.mockResolvedValue(clubs);

    await expect(service.findActive()).resolves.toEqual(
      clubs.map(({ logoMedia, ...club }) => ({
        ...club,
        logo: logoMedia,
      })),
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          active: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
    );
  });

  it('returns an active club by slug', async () => {
    const club = {
      id: 'club-1',
      name: 'SK Rapid Wien',
      shortName: 'Rapid Wien',
      slug: 'sk-rapid-wien',
      color1Hex: '#007A3D',
      color1Rgba: 'rgba(0, 122, 61, 1)',
      color2Hex: '#FFFFFF',
      color2Rgba: 'rgba(255, 255, 255, 1)',
      color3Hex: null,
      color3Rgba: null,
      accentColorHex: '#D4AF37',
      accentColorRgba: 'rgba(212, 175, 55, 1)',
      website: 'https://www.skrapid.at',
      logoMedia: null,
    };

    findFirst.mockResolvedValue(club);

    await expect(service.findActiveBySlug('sk-rapid-wien')).resolves.toEqual({
      ...club,
      logoMedia: undefined,
      logo: null,
    });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: 'sk-rapid-wien',
          active: true,
        },
      }),
    );
  });

  it('throws when an active club cannot be found by slug', async () => {
    findFirst.mockResolvedValue(null);

    await expect(service.findActiveBySlug('unknown-club')).rejects.toMatchObject({
      response: {
        code: 'CLUB_NOT_FOUND',
        message: 'Verein wurde nicht gefunden.',
      },
    });
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
