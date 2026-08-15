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
        primaryColor: '#5B2C83',
        secondaryColor: '#FFFFFF',
        accentColor: '#D4AF37',
        logoMedia: null,
      },
      {
        id: 'club-2',
        name: 'SK Rapid Wien',
        shortName: 'Rapid Wien',
        slug: 'sk-rapid-wien',
        primaryColor: '#007A3D',
        secondaryColor: '#FFFFFF',
        accentColor: '#D4AF37',
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
        primaryColor: '#5B2C83',
        secondaryColor: '#FFFFFF',
        accentColor: '#D4AF37',
        logo: null,
      },
      {
        id: 'club-2',
        name: 'SK Rapid Wien',
        shortName: 'Rapid Wien',
        slug: 'sk-rapid-wien',
        primaryColor: '#007A3D',
        secondaryColor: '#FFFFFF',
        accentColor: '#D4AF37',
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
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
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
