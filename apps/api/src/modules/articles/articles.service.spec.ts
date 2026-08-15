const findMany = jest.fn<Promise<unknown[]>, [unknown]>();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    article: {
      findMany,
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

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
