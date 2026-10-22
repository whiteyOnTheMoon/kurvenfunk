jest.mock('./clubs.service', () => ({
  ClubsService: class ClubsService {},
}));

import { ClubsController } from './clubs.controller';
import type { ClubsService } from './clubs.service';

describe('ClubsController', () => {
  const findActive = jest.fn();
  const findActiveBySlug = jest.fn();

  const service = {
    findActive,
    findActiveBySlug,
  } as unknown as ClubsService;

  const controller = new ClubsController(service);

  beforeEach(() => {
    findActive.mockReset();
    findActiveBySlug.mockReset();
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
