jest.mock('./matches.service', () => ({
  MatchesService: class MatchesService {},
}));

import { MatchesController } from './matches.controller';
import type { MatchesService } from './matches.service';

describe('MatchesController', () => {
  const findSchedule = jest.fn();
  const findById = jest.fn();

  const service = {
    findSchedule,
    findById,
  } as unknown as MatchesService;

  const controller = new MatchesController(service);

  beforeEach(() => {
    findSchedule.mockReset();
    findById.mockReset();
  });

  it('returns the match schedule', async () => {
    const schedule = {
      competition: {
        id: 'competition-1',
        name: 'Österreichische Bundesliga',
        shortName: 'Bundesliga',
        slug: 'austrian-bundesliga',
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
      matches: [],
    };

    findSchedule.mockResolvedValue(schedule);

    await expect(controller.findSchedule('austrian-bundesliga')).resolves.toEqual(schedule);
    expect(findSchedule).toHaveBeenCalledWith('austrian-bundesliga');
  });

  it('uses the default competition when none is supplied', async () => {
    findSchedule.mockResolvedValue({
      competition: {},
      season: {},
      stage: null,
      matches: [],
    });

    await controller.findSchedule(undefined);

    expect(findSchedule).toHaveBeenCalledWith(undefined);
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
