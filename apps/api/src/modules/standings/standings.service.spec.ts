const competitionFindUnique = jest.fn();
const standingFindMany = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    competition: {
      findUnique: competitionFindUnique,
    },
    standing: {
      findMany: standingFindMany,
    },
    $disconnect: disconnect,
  }),
}));

import { StandingsService } from './standings.service';

describe('StandingsService', () => {
  let service: StandingsService;

  beforeEach(() => {
    competitionFindUnique.mockReset();
    standingFindMany.mockReset();
    disconnect.mockReset();
    service = new StandingsService();
  });

  it('returns the current standings for the latest stage', async () => {
    const competition = {
      id: 'competition-1',
      name: 'Österreichische Bundesliga',
      shortName: 'Bundesliga',
      slug: 'bundesliga',
      seasons: [
        {
          id: 'season-1',
          name: '2026/27',
          slug: '2026-27',
          stages: [
            {
              id: 'stage-1',
              name: 'Grunddurchgang',
              slug: 'grunddurchgang',
            },
          ],
        },
      ],
    };

    const standings = [
      {
        id: 'standing-1',
        position: 1,
        played: 3,
        won: 3,
        drawn: 0,
        lost: 0,
        goalsFor: 8,
        goalsAgainst: 2,
        goalDifference: 6,
        points: 9,
        deductionPoints: 0,
        club: {
          id: 'club-1',
          name: 'SK Sturm Graz',
          shortName: 'Sturm Graz',
          slug: 'sk-sturm-graz',
        },
      },
    ];

    competitionFindUnique.mockResolvedValue(competition);
    standingFindMany.mockResolvedValue(standings);

    await expect(service.findCurrent('bundesliga')).resolves.toEqual({
      competition: {
        id: competition.id,
        name: competition.name,
        shortName: competition.shortName,
        slug: competition.slug,
      },
      season: {
        id: competition.seasons[0].id,
        name: competition.seasons[0].name,
        slug: competition.seasons[0].slug,
      },
      stage: competition.seasons[0].stages[0],
      standings,
    });

    expect(competitionFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: 'bundesliga',
        },
      }),
    );

    expect(standingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          competitionId: 'competition-1',
          seasonId: 'season-1',
          stageId: 'stage-1',
        },
        orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
      }),
    );
  });

  it('loads season standings when the season has no stage', async () => {
    competitionFindUnique.mockResolvedValue({
      id: 'competition-1',
      name: 'Österreichische Bundesliga',
      shortName: 'Bundesliga',
      slug: 'bundesliga',
      seasons: [
        {
          id: 'season-1',
          name: '2026/27',
          slug: '2026-27',
          stages: [],
        },
      ],
    });

    standingFindMany.mockResolvedValue([]);

    const result = await service.findCurrent('bundesliga');

    expect(result?.stage).toBeNull();

    expect(standingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          competitionId: 'competition-1',
          seasonId: 'season-1',
          stageId: null,
        },
      }),
    );
  });

  it('returns null when the competition cannot be found', async () => {
    competitionFindUnique.mockResolvedValue(null);

    await expect(service.findCurrent('unknown')).resolves.toBeNull();
    expect(standingFindMany).not.toHaveBeenCalled();
  });

  it('returns null when the competition has no active season', async () => {
    competitionFindUnique.mockResolvedValue({
      id: 'competition-1',
      name: 'Österreichische Bundesliga',
      shortName: 'Bundesliga',
      slug: 'bundesliga',
      seasons: [],
    });

    await expect(service.findCurrent('bundesliga')).resolves.toBeNull();
    expect(standingFindMany).not.toHaveBeenCalled();
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
