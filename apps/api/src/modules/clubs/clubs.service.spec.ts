const findMany = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    club: {
      findMany,
    },
    $disconnect: disconnect,
  }),
}));

import { ClubsService } from './clubs.service';

describe('ClubsService', () => {
  let service: ClubsService;

  beforeEach(() => {
    findMany.mockReset();
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
        color2Hex: '#FFFFFF',
        accentColorHex: '#D4AF37',
        logoMedia: null,
      },
      {
        id: 'club-2',
        name: 'SK Rapid Wien',
        shortName: 'Rapid Wien',
        slug: 'sk-rapid-wien',
        color1Hex: '#007A3D',
        color2Hex: '#FFFFFF',
        accentColorHex: '#D4AF37',
        logoMedia: null,
      },
    ];

    findMany.mockResolvedValue(clubs);

    await expect(service.findActive()).resolves.toEqual([
      {
        id: 'club-1',
        name: 'FK Austria Wien',
        shortName: 'Austria Wien',
        slug: 'fk-austria-wien',
        color1Hex: '#5B2C83',
        color2Hex: '#FFFFFF',
        accentColorHex: '#D4AF37',
        logo: null,
      },
      {
        id: 'club-2',
        name: 'SK Rapid Wien',
        shortName: 'Rapid Wien',
        slug: 'sk-rapid-wien',
        color1Hex: '#007A3D',
        color2Hex: '#FFFFFF',
        accentColorHex: '#D4AF37',
        logo: null,
      },
    ]);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
        color1Hex: true,
        color1Rgba: true,
        color2Hex: true,
        color2Rgba: true,
        color3Hex: true,
        color3Rgba: true,
        accentColorHex: true,
        accentColorRgba: true,
        logoMedia: {
          select: {
            externalUrl: true,
            storageKey: true,
            altText: true,
          },
        },
      },
    });
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
