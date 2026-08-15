const findMany = jest.fn<Promise<unknown[]>, [unknown]>();
const findCompetition = jest.fn();
const findClub = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    article: {
      findMany,
    },
    competition: {
      findUniqueOrThrow: findCompetition,
    },
    club: {
      findUnique: findClub,
    },
    $disconnect: disconnect,
  }),
}));

import { ArticlesService } from './articles.service';

const favoriteClubId = '11111111-1111-4111-8111-111111111111';
const competitionId = '22222222-2222-4222-8222-222222222222';

function article(id: string, publishedAt: string, articleCompetitionId: string | null = null) {
  return {
    id,
    title: `Title ${id}`,
    slug: `slug-${id}`,
    lead: null,
    publishedAt: new Date(publishedAt),
    competitionId: articleCompetitionId,
  };
}

describe('ArticlesService', () => {
  let service: ArticlesService;

  beforeEach(() => {
    findMany.mockReset();
    findCompetition.mockReset();
    findClub.mockReset();
    disconnect.mockReset();
    service = new ArticlesService();
  });

  it('prioritizes favorite club, then competition, then general news', async () => {
    findMany
      .mockResolvedValueOnce([article('club-1', '2026-08-14T12:00:00.000Z', competitionId)])
      .mockResolvedValueOnce([article('league-1', '2026-08-14T11:00:00.000Z', competitionId)])
      .mockResolvedValueOnce([article('general-1', '2026-08-14T10:00:00.000Z')]);

    const result = await service.getPrioritizedNews({
      favoriteClubId,
      competitionId,
      limit: 3,
    });

    expect(result.map((item) => item.id)).toEqual(['club-1', 'league-1', 'general-1']);

    expect(result.map((item) => item.priority)).toEqual([
      'FAVORITE_CLUB',
      'COMPETITION',
      'GENERAL',
    ]);
  });

  it('keeps league and general news in the feed when enough favorite-club news exists', async () => {
    findMany
      .mockResolvedValueOnce([
        article('club-1', '2026-08-14T15:00:00.000Z', competitionId),
        article('club-2', '2026-08-14T14:00:00.000Z', competitionId),
        article('club-3', '2026-08-14T13:00:00.000Z', competitionId),
        article('club-4', '2026-08-14T12:00:00.000Z', competitionId),
        article('club-5', '2026-08-14T11:00:00.000Z', competitionId),
      ])
      .mockResolvedValueOnce([article('league-1', '2026-08-14T10:00:00.000Z', competitionId)])
      .mockResolvedValueOnce([article('general-1', '2026-08-14T09:00:00.000Z')]);

    const result = await service.getPrioritizedNews({
      favoriteClubId,
      competitionId,
      limit: 5,
    });

    expect(result.map((item) => item.id)).toEqual([
      'club-1',
      'club-2',
      'club-3',
      'league-1',
      'general-1',
    ]);
  });

  it('backfills free slots according to priority when a news group is unavailable', async () => {
    findMany
      .mockResolvedValueOnce([
        article('club-1', '2026-08-14T15:00:00.000Z', competitionId),
        article('club-2', '2026-08-14T14:00:00.000Z', competitionId),
        article('club-3', '2026-08-14T13:00:00.000Z', competitionId),
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([article('general-1', '2026-08-14T12:00:00.000Z')]);

    const result = await service.getPrioritizedNews({
      favoriteClubId,
      competitionId,
      limit: 4,
    });

    expect(result.map((item) => item.id)).toEqual(['club-1', 'club-2', 'club-3', 'general-1']);
  });

  it('returns only the favorite-club priority for a one-item feed', async () => {
    findMany
      .mockResolvedValueOnce([article('club-1', '2026-08-14T15:00:00.000Z', competitionId)])
      .mockResolvedValueOnce([article('league-1', '2026-08-14T14:00:00.000Z', competitionId)])
      .mockResolvedValueOnce([article('general-1', '2026-08-14T13:00:00.000Z')]);

    const result = await service.getPrioritizedNews({
      favoriteClubId,
      competitionId,
      limit: 1,
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: 'club-1',
        priority: 'FAVORITE_CLUB',
      }),
    ]);
  });

  it('queries only published, non-deleted and already published articles', async () => {
    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await service.getPrioritizedNews({
      favoriteClubId,
      competitionId,
      limit: 10,
    });

    const firstCall = findMany.mock.calls[0]?.[0] as {
      where: {
        status: string;
        deletedAt: null;
        publishedAt: {
          not: null;
          lte: Date;
        };
        clubs: {
          some: {
            clubId: string;
          };
        };
      };
      orderBy: {
        publishedAt: string;
      };
      take: number;
    };

    expect(firstCall.where.status).toBe('PUBLISHED');
    expect(firstCall.where.deletedAt).toBeNull();
    expect(firstCall.where.publishedAt.not).toBeNull();
    expect(firstCall.where.publishedAt.lte).toBeInstanceOf(Date);
    expect(firstCall.where.clubs).toEqual({
      some: {
        clubId: favoriteClubId,
      },
    });
    expect(firstCall.orderBy).toEqual({
      publishedAt: 'desc',
    });
    expect(firstCall.take).toBe(10);

    const secondCall = findMany.mock.calls[1]?.[0] as {
      where: {
        competitionId: string;
        clubs: {
          none: {
            clubId: string;
          };
        };
      };
    };

    expect(secondCall.where.competitionId).toBe(competitionId);
    expect(secondCall.where.clubs).toEqual({
      none: {
        clubId: favoriteClubId,
      },
    });
  });

  it('uses the default limit for invalid limits', async () => {
    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await service.getPrioritizedNews({
      favoriteClubId,
      competitionId,
      limit: 0,
    });

    expect(findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        take: 20,
      }),
    );
  });

  it('caps the requested limit at 100', async () => {
    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await service.getPrioritizedNews({
      favoriteClubId,
      competitionId,
      limit: 500,
    });

    expect(findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        take: 100,
      }),
    );
  });

  it('ranks neutral news as top, recent, then competition without club priority', async () => {
    findMany
      .mockResolvedValueOnce([article('top-1', '2026-08-14T15:00:00.000Z', competitionId)])
      .mockResolvedValueOnce([article('recent-1', '2026-08-14T14:00:00.000Z')])
      .mockResolvedValueOnce([article('league-1', '2026-08-14T13:00:00.000Z', competitionId)]);

    const result = await service.getNeutralNews({
      competitionId,
      limit: 3,
    });

    expect(result.map((item) => item.id)).toEqual(['top-1', 'recent-1', 'league-1']);
    expect(result.map((item) => item.priority)).toEqual(['TOP_NEWS', 'RECENT', 'COMPETITION']);

    const topCall = findMany.mock.calls[0]?.[0] as {
      where: Record<string, unknown>;
    };
    const recentCall = findMany.mock.calls[1]?.[0] as {
      where: Record<string, unknown>;
    };
    const competitionCall = findMany.mock.calls[2]?.[0] as {
      where: Record<string, unknown>;
    };

    expect(topCall.where).toEqual(
      expect.objectContaining({
        isTopNews: true,
      }),
    );
    expect(recentCall.where).toEqual(
      expect.objectContaining({
        isTopNews: false,
      }),
    );
    expect(competitionCall.where).toEqual(
      expect.objectContaining({
        isTopNews: false,
        competitionId,
      }),
    );

    expect(topCall.where).not.toHaveProperty('clubs');
    expect(recentCall.where).not.toHaveProperty('clubs');
    expect(competitionCall.where).not.toHaveProperty('clubs');
  });

  it('keeps recent and competition news in a neutral feed when enough top news exists', async () => {
    findMany
      .mockResolvedValueOnce([
        article('top-1', '2026-08-14T18:00:00.000Z', competitionId),
        article('top-2', '2026-08-14T17:00:00.000Z'),
        article('top-3', '2026-08-14T16:00:00.000Z'),
        article('top-4', '2026-08-14T15:00:00.000Z'),
        article('top-5', '2026-08-14T14:00:00.000Z'),
      ])
      .mockResolvedValueOnce([article('recent-1', '2026-08-14T13:00:00.000Z')])
      .mockResolvedValueOnce([article('league-1', '2026-08-14T12:00:00.000Z', competitionId)]);

    const result = await service.getNeutralNews({
      competitionId,
      limit: 5,
    });

    expect(result.map((item) => item.id)).toEqual([
      'top-1',
      'top-2',
      'top-3',
      'recent-1',
      'league-1',
    ]);
  });

  it('backfills a neutral feed when no top news is available', async () => {
    findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        article('recent-1', '2026-08-14T15:00:00.000Z'),
        article('recent-2', '2026-08-14T14:00:00.000Z'),
        article('recent-3', '2026-08-14T13:00:00.000Z'),
      ])
      .mockResolvedValueOnce([article('league-1', '2026-08-14T12:00:00.000Z', competitionId)]);

    const result = await service.getNeutralNews({
      competitionId,
      limit: 4,
    });

    expect(result.map((item) => item.id)).toEqual(['recent-1', 'recent-2', 'recent-3', 'league-1']);
    expect(result.map((item) => item.priority)).toEqual([
      'RECENT',
      'RECENT',
      'RECENT',
      'COMPETITION',
    ]);
  });

  it('uses only published, non-deleted and already published articles for neutral news', async () => {
    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await service.getNeutralNews({
      competitionId,
      limit: 10,
    });

    for (const call of findMany.mock.calls) {
      const query = call[0] as {
        where: {
          status: string;
          deletedAt: null;
          publishedAt: {
            not: null;
            lte: Date;
          };
        };
        orderBy: {
          publishedAt: string;
        };
        take: number;
      };

      expect(query.where.status).toBe('PUBLISHED');
      expect(query.where.deletedAt).toBeNull();
      expect(query.where.publishedAt.not).toBeNull();
      expect(query.where.publishedAt.lte).toBeInstanceOf(Date);
      expect(query.orderBy).toEqual({
        publishedAt: 'desc',
      });
      expect(query.take).toBe(10);
    }
  });

  it('builds a club startpage for a fan with a valid favorite club', async () => {
    findCompetition.mockResolvedValue({
      id: competitionId,
      name: 'Österreichische Bundesliga',
      shortName: 'Bundesliga',
      slug: 'austrian-bundesliga',
    });

    findClub.mockResolvedValue({
      id: favoriteClubId,
      name: 'SK Rapid Wien',
      shortName: 'Rapid',
      slug: 'sk-rapid-wien',
    });

    findMany
      .mockResolvedValueOnce([article('club-1', '2026-08-14T15:00:00.000Z', competitionId)])
      .mockResolvedValueOnce([article('league-1', '2026-08-14T14:00:00.000Z', competitionId)])
      .mockResolvedValueOnce([article('general-1', '2026-08-14T13:00:00.000Z')]);

    const result = await service.getStartpageNews({
      fanPreference: 'CLUB',
      favoriteClubId,
      competitionSlug: 'austrian-bundesliga',
      limit: 3,
    });

    expect(findCompetition).toHaveBeenCalledWith({
      where: {
        slug: 'austrian-bundesliga',
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
      },
    });

    expect(findClub).toHaveBeenCalledWith({
      where: {
        id: favoriteClubId,
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
      },
    });

    expect(result.variant).toBe('CLUB');
    expect(result.favoriteClub).toEqual({
      id: favoriteClubId,
      name: 'SK Rapid Wien',
      shortName: 'Rapid',
      slug: 'sk-rapid-wien',
    });
    expect(result.competition.slug).toBe('austrian-bundesliga');
    expect(result.articles.map((item) => item.priority)).toEqual([
      'FAVORITE_CLUB',
      'COMPETITION',
      'GENERAL',
    ]);
  });

  it('builds a neutral startpage for a neutral user', async () => {
    findCompetition.mockResolvedValue({
      id: competitionId,
      name: 'Österreichische Bundesliga',
      shortName: 'Bundesliga',
      slug: 'austrian-bundesliga',
    });

    findMany
      .mockResolvedValueOnce([article('top-1', '2026-08-14T15:00:00.000Z', competitionId)])
      .mockResolvedValueOnce([article('recent-1', '2026-08-14T14:00:00.000Z')])
      .mockResolvedValueOnce([article('league-1', '2026-08-14T13:00:00.000Z', competitionId)]);

    const result = await service.getStartpageNews({
      fanPreference: 'NEUTRAL',
      favoriteClubId: null,
      competitionSlug: 'austrian-bundesliga',
      limit: 3,
    });

    expect(findClub).not.toHaveBeenCalled();
    expect(result.variant).toBe('NEUTRAL');
    expect(result.favoriteClub).toBeNull();
    expect(result.articles.map((item) => item.priority)).toEqual([
      'TOP_NEWS',
      'RECENT',
      'COMPETITION',
    ]);
  });

  it('treats an unset fan preference as neutral', async () => {
    findCompetition.mockResolvedValue({
      id: competitionId,
      name: 'Österreichische Bundesliga',
      shortName: 'Bundesliga',
      slug: 'austrian-bundesliga',
    });

    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await service.getStartpageNews({
      fanPreference: 'UNSET',
      favoriteClubId: null,
      competitionSlug: 'austrian-bundesliga',
      limit: 5,
    });

    expect(findClub).not.toHaveBeenCalled();
    expect(result.variant).toBe('NEUTRAL');
    expect(result.favoriteClub).toBeNull();
  });

  it('falls back to the neutral startpage when the favorite club no longer exists', async () => {
    findCompetition.mockResolvedValue({
      id: competitionId,
      name: 'Österreichische Bundesliga',
      shortName: 'Bundesliga',
      slug: 'austrian-bundesliga',
    });

    findClub.mockResolvedValue(null);

    findMany
      .mockResolvedValueOnce([article('top-1', '2026-08-14T15:00:00.000Z', competitionId)])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([article('league-1', '2026-08-14T13:00:00.000Z', competitionId)]);

    const result = await service.getStartpageNews({
      fanPreference: 'CLUB',
      favoriteClubId,
      competitionSlug: 'austrian-bundesliga',
      limit: 3,
    });

    expect(findClub).toHaveBeenCalledTimes(1);
    expect(result.variant).toBe('NEUTRAL');
    expect(result.favoriteClub).toBeNull();
    expect(result.articles.every((item) => item.priority !== 'FAVORITE_CLUB')).toBe(true);
  });

  it('passes the requested startpage limit through to the ranking query', async () => {
    findCompetition.mockResolvedValue({
      id: competitionId,
      name: 'Österreichische Bundesliga',
      shortName: 'Bundesliga',
      slug: 'austrian-bundesliga',
    });

    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await service.getStartpageNews({
      fanPreference: 'NEUTRAL',
      favoriteClubId: null,
      competitionSlug: 'austrian-bundesliga',
      limit: 7,
    });

    expect(findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        take: 7,
      }),
    );
    expect(findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        take: 7,
      }),
    );
    expect(findMany).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        take: 7,
      }),
    );
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
