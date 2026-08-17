jest.mock('./standings.service', () => ({
  StandingsService: class StandingsService {},
}));

import { StandingsController } from './standings.controller';
import type { StandingsService } from './standings.service';

describe('StandingsController', () => {
  const findCurrent = jest.fn();

  const service = {
    findCurrent,
  } as unknown as StandingsService;

  const controller = new StandingsController(service);

  beforeEach(() => {
    findCurrent.mockReset();
  });

  it('returns the current standings for a competition', async () => {
    const response = {
      competition: {
        id: 'competition-1',
        name: 'Österreichische Bundesliga',
        shortName: 'Bundesliga',
        slug: 'bundesliga',
      },
      season: {
        id: 'season-1',
        name: '2026/27',
        slug: '2026-27',
      },
      stage: {
        id: 'stage-1',
        name: 'Grunddurchgang',
        slug: 'grunddurchgang',
      },
      standings: [],
    };

    findCurrent.mockResolvedValue(response);

    await expect(controller.findCurrent('bundesliga')).resolves.toEqual(response);
    expect(findCurrent).toHaveBeenCalledWith('bundesliga');
  });
});
