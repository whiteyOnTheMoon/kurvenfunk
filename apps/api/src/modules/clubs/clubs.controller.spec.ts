jest.mock('./clubs.service', () => ({
  ClubsService: class ClubsService {},
}));

import { ClubsController } from './clubs.controller';
import type { ClubsService } from './clubs.service';

describe('ClubsController', () => {
  const findActive = jest.fn();

  const service = {
    findActive,
  } as unknown as ClubsService;

  const controller = new ClubsController(service);

  beforeEach(() => {
    findActive.mockReset();
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
});
