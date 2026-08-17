jest.mock('./matches.service', () => ({
  MatchesService: class MatchesService {},
}));

import { MatchesController } from './matches.controller';
import type { MatchesService } from './matches.service';

describe('MatchesController', () => {
  const findById = jest.fn();

  const service = {
    findById,
  } as unknown as MatchesService;

  const controller = new MatchesController(service);

  beforeEach(() => {
    findById.mockReset();
  });

  it('returns a match by id', async () => {
    const match = {
      id: 'match-1',
      status: 'SCHEDULED',
      homeClub: {
        id: 'club-1',
        name: 'SK Rapid Wien',
        shortName: 'Rapid Wien',
        slug: 'sk-rapid-wien',
      },
      awayClub: {
        id: 'club-2',
        name: 'FK Austria Wien',
        shortName: 'Austria Wien',
        slug: 'fk-austria-wien',
      },
      news: [],
    };

    findById.mockResolvedValue(match);

    await expect(controller.findById('match-1')).resolves.toEqual(match);
    expect(findById).toHaveBeenCalledWith('match-1');
  });
});
