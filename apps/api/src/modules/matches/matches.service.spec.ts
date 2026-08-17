const findUnique = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    match: {
      findUnique,
    },
    $disconnect: disconnect,
  }),
}));

import { MatchesService } from './matches.service';

describe('MatchesService', () => {
  let service: MatchesService;

  beforeEach(() => {
    findUnique.mockReset();
    disconnect.mockReset();
    service = new MatchesService();
  });

  it('returns a match with published news', async () => {
    const match = {
      id: 'match-1',
      kickoff: new Date('2026-08-23T15:00:00.000Z'),
      matchday: 4,
      status: 'SCHEDULED',
      homeScore: null,
      awayScore: null,
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
      competition: {
        id: 'competition-1',
        name: 'Österreichische Bundesliga',
        shortName: 'Bundesliga',
        slug: 'bundesliga',
      },
      season: {
        id: 'season-1',
        name: '2026/27',
      },
      stage: {
        id: 'stage-1',
        name: 'Grunddurchgang',
      },
      articles: [
        {
          id: 'article-1',
          title: 'Wiener Derby im Fokus',
          slug: 'wiener-derby-im-fokus',
          lead: 'Alles zum kommenden Derby.',
          publishedAt: new Date('2026-08-22T10:00:00.000Z'),
        },
      ],
    };

    findUnique.mockResolvedValue(match);

    await expect(service.findById('match-1')).resolves.toEqual({
      ...match,
      articles: undefined,
      news: match.articles,
    });

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'match-1',
        },
      }),
    );
  });

  it('throws when the match cannot be found', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.findById('unknown-match')).rejects.toMatchObject({
      response: {
        code: 'MATCH_NOT_FOUND',
        message: 'Spiel wurde nicht gefunden.',
      },
    });
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
