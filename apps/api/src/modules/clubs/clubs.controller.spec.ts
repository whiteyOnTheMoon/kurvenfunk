jest.mock('../permissions/require-permissions.decorator', () => ({
  RequirePermissions: () => () => undefined,
}));

jest.mock('@kurvenfunk/validation', () => ({
  createClubSchema: {},
  updateClubSchema: {},
}));

jest.mock('./clubs.service', () => ({
  ClubsService: class ClubsService {},
}));

import { ClubsController } from './clubs.controller';
import type { ClubsService } from './clubs.service';
import type { ClubOverviewService } from './club-overview.service';

describe('ClubsController', () => {
  const findActive = jest.fn();
  const findActiveBySlug = jest.fn();
  const findOverview = jest.fn();

  const service = {
    findActive,
    findActiveBySlug,
  } as unknown as ClubsService;

  const controller = new ClubsController(
    service,
    { findBySlug: findOverview } as unknown as ClubOverviewService,
  );

  beforeEach(() => {
    findActive.mockReset();
    findActiveBySlug.mockReset();
    findOverview.mockReset();
  });

  it('returns active clubs', async () => {
    const clubs = [
      {
        id: 'club-1',
        name: 'SK Rapid Wien',
        shortName: 'Rapid Wien',
        slug: 'sk-rapid-wien',
        color1Hex: '#007A3D',
        color2Hex: '#FFFFFF',
        accentColorHex: '#D4AF37',
        logo: null,
      },
    ];

    findActive.mockResolvedValue(clubs);

    await expect(controller.findActive()).resolves.toEqual(clubs);
    expect(findActive).toHaveBeenCalledTimes(1);
  });

  it('exposes the real, read-only club overview by slug', async () => {
    const overview = { club: { id: 'club-1' }, matches: [], news: [], standings: [] };
    findOverview.mockResolvedValue(overview);
    await expect(controller.findOverview('sk-rapid-wien')).resolves.toBe(overview);
    expect(findOverview).toHaveBeenCalledWith('sk-rapid-wien');
  });

  it('returns an active club by slug', async () => {
    const club = {
      id: 'club-1',
      name: 'SK Rapid Wien',
      shortName: 'Rapid Wien',
      slug: 'sk-rapid-wien',
      website: 'https://www.skrapid.at',
      logo: null,
    };

    findActiveBySlug.mockResolvedValue(club);

    await expect(controller.findActiveBySlug('sk-rapid-wien')).resolves.toEqual(club);
    expect(findActiveBySlug).toHaveBeenCalledWith('sk-rapid-wien');
  });
});
