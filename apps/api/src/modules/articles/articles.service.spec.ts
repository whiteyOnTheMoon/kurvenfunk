const findMany = jest.fn<Promise<unknown[]>, [unknown]>();
const findUniqueArticle = jest.fn<Promise<unknown>, [unknown]>();
const findFirstArticle = jest.fn<Promise<unknown>, [unknown]>();
const createArticle = jest.fn<Promise<unknown>, [unknown]>();
const updateArticle = jest.fn<Promise<unknown>, [unknown]>();
const findCompetition = jest.fn();
const findClub = jest.fn();
const findManyClub = jest.fn();
const findManyCategory = jest.fn();
const findManyTag = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    article: {
      findMany,
      findUnique: findUniqueArticle,
      findFirst: findFirstArticle,
      create: createArticle,
      update: updateArticle,
    },
    competition: {
      findUniqueOrThrow: findCompetition,
    },
    club: {
      findUnique: findClub,
      findMany: findManyClub,
    },
    category: {
      findMany: findManyCategory,
    },
    tag: {
      findMany: findManyTag,
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
    findUniqueArticle.mockReset();
    findFirstArticle.mockReset();
    createArticle.mockReset();
    updateArticle.mockReset();
    findCompetition.mockReset();
    findClub.mockReset();
    findManyClub.mockReset();
    findManyCategory.mockReset();
    findManyTag.mockReset();
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

  describe('article CRUD', () => {
    const articleId = '11111111-1111-4111-8111-111111111111';
    const authorId = '22222222-2222-4222-8222-222222222222';

    const draftArticle = {
      id: articleId,
      title: 'Test article',
      slug: 'test-article',
      lead: 'Test lead',
      content: { type: 'doc', content: [] },
      status: 'DRAFT',
      isTopNews: false,
      authorId,
      externalAuthorName: null,
      sourceId: null,
      originalUrl: null,
      competitionId: null,
      matchId: null,
      leadMediaId: null,
      scheduledAt: null,
      publishedAt: null,
      archivedAt: null,
      deletedAt: null,
      createdAt: new Date('2026-08-18T12:00:00.000Z'),
      updatedAt: new Date('2026-08-18T12:00:00.000Z'),
    };

    it('creates a draft article for the authenticated author', async () => {
      findUniqueArticle.mockResolvedValue(null);
      createArticle.mockResolvedValue(draftArticle);

      await expect(
        service.create(
          {
            title: 'Test article',
            slug: 'test-article',
            lead: 'Test lead',
            content: { type: 'doc', content: [] },
            clubIds: [],
            categoryIds: [],
            tagIds: [],
          },
          authorId,
        ),
      ).resolves.toEqual(draftArticle);

      expect(findUniqueArticle).toHaveBeenCalledWith({
        where: {
          slug: 'test-article',
        },
        select: {
          id: true,
        },
      });

      expect(createArticle).toHaveBeenCalledWith({
        data: {
          title: 'Test article',
          slug: 'test-article',
          lead: 'Test lead',
          content: { type: 'doc', content: [] },
          isTopNews: false,
          authorId,
          clubs: {
            create: [],
          },
          categories: {
            create: [],
          },
          tags: {
            create: [],
          },
        },
        include: {
          clubs: {
            include: {
              club: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    it('rejects creation when the slug is already in use', async () => {
      findUniqueArticle.mockResolvedValue({
        id: 'existing-article',
      });

      await expect(
        service.create(
          {
            title: 'Test article',
            slug: 'test-article',
            content: {
              type: 'doc',
              content: [],
            },
            clubIds: [],
            categoryIds: [],
            tagIds: [],
          },
          authorId,
        ),
      ).rejects.toMatchObject({
        response: {
          code: 'ARTICLE_SLUG_TAKEN',
          message: 'Article slug is already in use',
        },
      });

      expect(createArticle).not.toHaveBeenCalled();
    });

    it('reads an article for editorial use regardless of publication state', async () => {
      findUniqueArticle.mockResolvedValue(draftArticle);

      await expect(service.findEditorialById(articleId)).resolves.toEqual(draftArticle);

      expect(findUniqueArticle).toHaveBeenCalledWith({
        where: {
          id: articleId,
        },
        include: {
          clubs: {
            include: {
              club: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    it('returns ARTICLE_NOT_FOUND for a missing editorial article', async () => {
      findUniqueArticle.mockResolvedValue(null);

      await expect(service.findEditorialById(articleId)).rejects.toMatchObject({
        response: {
          code: 'ARTICLE_NOT_FOUND',
          message: 'Article not found',
        },
      });
    });

    it('updates an existing article', async () => {
      findUniqueArticle.mockResolvedValue(draftArticle);
      updateArticle.mockResolvedValue({
        ...draftArticle,
        title: 'Updated article',
      });

      await service.update(articleId, {
        title: 'Updated article',
      });

      expect(findFirstArticle).not.toHaveBeenCalled();
      expect(updateArticle).toHaveBeenCalledWith({
        where: {
          id: articleId,
        },
        data: {
          title: 'Updated article',
        },
        include: {
          clubs: {
            include: {
              club: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    it('rejects an update when the new slug belongs to another article', async () => {
      findUniqueArticle.mockResolvedValue(draftArticle);
      findFirstArticle.mockResolvedValue({
        id: 'other-article',
      });

      await expect(
        service.update(articleId, {
          slug: 'already-used',
        }),
      ).rejects.toMatchObject({
        response: {
          code: 'ARTICLE_SLUG_TAKEN',
          message: 'Article slug is already in use',
        },
      });

      expect(updateArticle).not.toHaveBeenCalled();
    });

    describe('publication workflow', () => {
      it('moves a draft article to review', async () => {
        findUniqueArticle.mockResolvedValue({
          id: 'article-1',
          status: 'DRAFT',
          deletedAt: null,
        });
        updateArticle.mockResolvedValue({
          id: 'article-1',
          status: 'REVIEW',
        });

        await service.changePublicationStatus('article-1', {
          status: 'REVIEW',
        });

        expect(updateArticle).toHaveBeenCalledWith({
          where: {
            id: 'article-1',
          },
          data: {
            status: 'REVIEW',
            scheduledAt: null,
            publishedAt: null,
            archivedAt: null,
          },
        });
      });

      it('schedules a review article for a future publication date', async () => {
        findUniqueArticle.mockResolvedValue({
          id: 'article-1',
          status: 'REVIEW',
          deletedAt: null,
        });
        updateArticle.mockResolvedValue({
          id: 'article-1',
          status: 'SCHEDULED',
        });

        const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        await service.changePublicationStatus('article-1', {
          status: 'SCHEDULED',
          scheduledAt,
        });

        expect(updateArticle).toHaveBeenCalledWith({
          where: {
            id: 'article-1',
          },
          data: {
            status: 'SCHEDULED',
            scheduledAt: new Date(scheduledAt),
            publishedAt: null,
            archivedAt: null,
          },
        });
      });

      it('rejects scheduling in the past', async () => {
        findUniqueArticle.mockResolvedValue({
          id: 'article-1',
          status: 'REVIEW',
          deletedAt: null,
        });

        await expect(
          service.changePublicationStatus('article-1', {
            status: 'SCHEDULED',
            scheduledAt: '2020-01-01T00:00:00.000Z',
          }),
        ).rejects.toMatchObject({
          response: {
            code: 'ARTICLE_SCHEDULED_AT_INVALID',
            message: 'scheduledAt must be in the future',
          },
        });

        expect(updateArticle).not.toHaveBeenCalled();
      });

      it('publishes a review article immediately', async () => {
        findUniqueArticle.mockResolvedValue({
          id: 'article-1',
          status: 'REVIEW',
          deletedAt: null,
        });
        updateArticle.mockResolvedValue({
          id: 'article-1',
          status: 'PUBLISHED',
        });

        const before = new Date();

        await service.changePublicationStatus('article-1', {
          status: 'PUBLISHED',
        });

        const call = updateArticle.mock.calls[0]?.[0] as {
          data: {
            status: string;
            scheduledAt: null;
            publishedAt: Date;
            archivedAt: null;
          };
        };

        expect(call.data.status).toBe('PUBLISHED');
        expect(call.data.scheduledAt).toBeNull();
        expect(call.data.publishedAt).toBeInstanceOf(Date);
        expect(call.data.publishedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(call.data.archivedAt).toBeNull();
      });

      it('rejects an invalid publication transition', async () => {
        findUniqueArticle.mockResolvedValue({
          id: 'article-1',
          status: 'DRAFT',
          deletedAt: null,
        });

        await expect(
          service.changePublicationStatus('article-1', {
            status: 'PUBLISHED',
          }),
        ).rejects.toMatchObject({
          response: {
            code: 'ARTICLE_PUBLICATION_TRANSITION_INVALID',
            message: 'Cannot change article publication status from DRAFT to PUBLISHED',
          },
        });

        expect(updateArticle).not.toHaveBeenCalled();
      });

      it('rejects publication changes for deleted articles', async () => {
        findUniqueArticle.mockResolvedValue({
          id: 'article-1',
          status: 'DRAFT',
          deletedAt: new Date(),
        });

        await expect(
          service.changePublicationStatus('article-1', {
            status: 'REVIEW',
          }),
        ).rejects.toMatchObject({
          response: {
            code: 'ARTICLE_DELETED',
            message: 'Deleted articles cannot change publication status',
          },
        });

        expect(updateArticle).not.toHaveBeenCalled();
      });

      it('moves an archived article back to draft and clears workflow dates', async () => {
        findUniqueArticle.mockResolvedValue({
          id: 'article-1',
          status: 'ARCHIVED',
          deletedAt: null,
        });
        updateArticle.mockResolvedValue({
          id: 'article-1',
          status: 'DRAFT',
        });

        await service.changePublicationStatus('article-1', {
          status: 'DRAFT',
        });

        expect(updateArticle).toHaveBeenCalledWith({
          where: {
            id: 'article-1',
          },
          data: {
            status: 'DRAFT',
            scheduledAt: null,
            publishedAt: null,
            archivedAt: null,
          },
        });
      });
    });

    it('archives an article', async () => {
      findUniqueArticle.mockResolvedValue(draftArticle);
      updateArticle.mockResolvedValue({
        ...draftArticle,
        status: 'ARCHIVED',
      });

      await service.archive(articleId);

      expect(updateArticle).toHaveBeenCalledTimes(1);

      const call = updateArticle.mock.calls[0]?.[0] as {
        where: { id: string };
        data: { status: string; archivedAt: Date };
      };

      expect(call.where).toEqual({
        id: articleId,
      });
      expect(call.data.status).toBe('ARCHIVED');
      expect(call.data.archivedAt).toBeInstanceOf(Date);
    });

    it('soft deletes an article', async () => {
      findUniqueArticle.mockResolvedValue(draftArticle);
      updateArticle.mockResolvedValue({
        ...draftArticle,
        deletedAt: new Date(),
      });

      await service.softDelete(articleId);

      const call = updateArticle.mock.calls[0]?.[0] as {
        where: { id: string };
        data: { deletedAt: Date };
      };

      expect(call.where).toEqual({
        id: articleId,
      });
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });

    it('restores a soft-deleted non-archived article without changing its status', async () => {
      findUniqueArticle.mockResolvedValue({
        ...draftArticle,
        deletedAt: new Date(),
      });

      updateArticle.mockResolvedValue(draftArticle);

      await service.restore(articleId);

      expect(updateArticle).toHaveBeenCalledWith({
        where: {
          id: articleId,
        },
        data: {
          deletedAt: null,
        },
      });
    });

    it('restores an archived article as a draft and clears archivedAt', async () => {
      findUniqueArticle.mockResolvedValue({
        ...draftArticle,
        status: 'ARCHIVED',
        archivedAt: new Date(),
        deletedAt: new Date(),
      });

      updateArticle.mockResolvedValue(draftArticle);

      await service.restore(articleId);

      expect(updateArticle).toHaveBeenCalledWith({
        where: {
          id: articleId,
        },
        data: {
          deletedAt: null,
          status: 'DRAFT',
          archivedAt: null,
        },
      });
    });
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});

describe('article category assignment', () => {
  const categoryId = '33333333-3333-4333-8333-333333333333';

  beforeEach(() => {
    findMany.mockReset();
    findUniqueArticle.mockReset();
    findFirstArticle.mockReset();
    createArticle.mockReset();
    updateArticle.mockReset();
    findCompetition.mockReset();
    findClub.mockReset();
    findManyClub.mockReset();
    findManyCategory.mockReset();
    findManyTag.mockReset();
    disconnect.mockReset();
  });

  it('creates article category assignments', async () => {
    findUniqueArticle.mockResolvedValue(null);
    findManyCategory.mockResolvedValue([{ id: categoryId }]);
    createArticle.mockResolvedValue({
      id: 'article-id',
    });

    const service = new ArticlesService();

    await service.create(
      {
        title: 'Transfer News',
        slug: 'transfer-news',
        lead: null,
        content: {
          type: 'doc',
          content: [],
        },
        clubIds: [],
        categoryIds: [categoryId],
        tagIds: [],
      },
      'author-id',
    );

    expect(findManyCategory).toHaveBeenCalledWith({
      where: {
        id: {
          in: [categoryId],
        },
        active: true,
      },
      select: {
        id: true,
      },
    });

    expect(createArticle.mock.calls[0]?.[0]).toMatchObject({
      data: {
        categories: {
          create: [
            {
              categoryId,
            },
          ],
        },
      },
    });
  });

  it('rejects unknown or inactive article categories', async () => {
    findUniqueArticle.mockResolvedValue(null);
    findManyCategory.mockResolvedValue([]);

    const service = new ArticlesService();

    await expect(
      service.create(
        {
          title: 'Transfer News',
          slug: 'transfer-news',
          lead: null,
          content: {
            type: 'doc',
            content: [],
          },
          clubIds: [],
          categoryIds: [categoryId],
          tagIds: [],
        },
        'author-id',
      ),
    ).rejects.toMatchObject({
      response: {
        code: 'ARTICLE_CATEGORY_INVALID',
        message: 'One or more article categories are invalid or inactive',
      },
    });

    expect(createArticle).not.toHaveBeenCalled();
  });

  it('replaces category assignments during article update', async () => {
    findUniqueArticle.mockResolvedValue({
      id: 'article-id',
      title: 'Article',
      slug: 'article',
      content: {
        type: 'doc',
        content: [],
      },
      status: 'DRAFT',
      deletedAt: null,
      categories: [],
    });

    findManyCategory.mockResolvedValue([{ id: categoryId }]);

    updateArticle.mockResolvedValue({
      id: 'article-id',
    });

    const service = new ArticlesService();

    await service.update('article-id', {
      categoryIds: [categoryId],
    });

    expect(updateArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'article-id',
        },
        data: {
          categories: {
            deleteMany: {},
            create: [
              {
                categoryId,
              },
            ],
          },
        },
      }),
    );
  });

  it('allows removing all category assignments', async () => {
    findUniqueArticle.mockResolvedValue({
      id: 'article-id',
      title: 'Article',
      slug: 'article',
      content: {
        type: 'doc',
        content: [],
      },
      status: 'DRAFT',
      deletedAt: null,
      categories: [],
    });

    updateArticle.mockResolvedValue({
      id: 'article-id',
    });

    const service = new ArticlesService();

    await service.update('article-id', {
      categoryIds: [],
    });

    expect(updateArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          categories: {
            deleteMany: {},
            create: [],
          },
        },
      }),
    );
  });
});

describe('article tag assignment', () => {
  const tagId = '44444444-4444-4444-8444-444444444444';

  beforeEach(() => {
    findMany.mockReset();
    findUniqueArticle.mockReset();
    findFirstArticle.mockReset();
    createArticle.mockReset();
    updateArticle.mockReset();
    findCompetition.mockReset();
    findClub.mockReset();
    findManyClub.mockReset();
    findManyCategory.mockReset();
    findManyTag.mockReset();
    disconnect.mockReset();
  });

  it('creates article tag assignments', async () => {
    findUniqueArticle.mockResolvedValue(null);
    findManyTag.mockResolvedValue([{ id: tagId }]);
    createArticle.mockResolvedValue({
      id: 'article-id',
    });

    const service = new ArticlesService();

    await service.create(
      {
        title: 'Transfer News',
        slug: 'transfer-news',
        lead: null,
        content: {
          type: 'doc',
          content: [],
        },
        clubIds: [],
        categoryIds: [],
        tagIds: [tagId],
      },
      'author-id',
    );

    expect(findManyTag).toHaveBeenCalledWith({
      where: {
        id: {
          in: [tagId],
        },
        active: true,
      },
      select: {
        id: true,
      },
    });

    expect(createArticle.mock.calls[0]?.[0]).toMatchObject({
      data: {
        tags: {
          create: [
            {
              tagId,
            },
          ],
        },
      },
    });
  });

  it('rejects unknown or inactive article tags', async () => {
    findUniqueArticle.mockResolvedValue(null);
    findManyTag.mockResolvedValue([]);

    const service = new ArticlesService();

    await expect(
      service.create(
        {
          title: 'Transfer News',
          slug: 'transfer-news',
          lead: null,
          content: {
            type: 'doc',
            content: [],
          },
          clubIds: [],
          categoryIds: [],
          tagIds: [tagId],
        },
        'author-id',
      ),
    ).rejects.toMatchObject({
      response: {
        code: 'ARTICLE_TAG_INVALID',
        message: 'One or more article tags are invalid or inactive',
      },
    });

    expect(createArticle).not.toHaveBeenCalled();
  });

  it('replaces tag assignments during article update', async () => {
    findUniqueArticle.mockResolvedValue({
      id: 'article-id',
      title: 'Article',
      slug: 'article',
      content: {
        type: 'doc',
        content: [],
      },
      status: 'DRAFT',
      deletedAt: null,
      categories: [],
      tags: [],
    });

    findManyTag.mockResolvedValue([{ id: tagId }]);

    updateArticle.mockResolvedValue({
      id: 'article-id',
    });

    const service = new ArticlesService();

    await service.update('article-id', {
      tagIds: [tagId],
    });

    expect(updateArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'article-id',
        },
        data: {
          tags: {
            deleteMany: {},
            create: [
              {
                tagId,
              },
            ],
          },
        },
      }),
    );
  });

  it('allows removing all tag assignments', async () => {
    findUniqueArticle.mockResolvedValue({
      id: 'article-id',
      title: 'Article',
      slug: 'article',
      content: {
        type: 'doc',
        content: [],
      },
      status: 'DRAFT',
      deletedAt: null,
      categories: [],
      tags: [],
    });

    updateArticle.mockResolvedValue({
      id: 'article-id',
    });

    const service = new ArticlesService();

    await service.update('article-id', {
      tagIds: [],
    });

    expect(updateArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          tags: {
            deleteMany: {},
            create: [],
          },
        },
      }),
    );
  });
});

describe('article club assignment', () => {
  const clubId = '55555555-5555-4555-8555-555555555555';

  beforeEach(() => {
    findMany.mockReset();
    findUniqueArticle.mockReset();
    findFirstArticle.mockReset();
    createArticle.mockReset();
    updateArticle.mockReset();
    findCompetition.mockReset();
    findClub.mockReset();
    findManyClub.mockReset();
    findManyCategory.mockReset();
    findManyTag.mockReset();
    disconnect.mockReset();
  });

  it('creates article club assignments', async () => {
    findUniqueArticle.mockResolvedValue(null);
    findManyClub.mockResolvedValue([{ id: clubId }]);
    createArticle.mockResolvedValue({
      id: 'article-id',
    });

    const service = new ArticlesService();

    await service.create(
      {
        title: 'Rapid News',
        slug: 'rapid-news',
        lead: null,
        content: {
          type: 'doc',
          content: [],
        },
        clubIds: [clubId],
        categoryIds: [],
        tagIds: [],
      },
      'author-id',
    );

    expect(findManyClub).toHaveBeenCalledWith({
      where: {
        id: {
          in: [clubId],
        },
        active: true,
      },
      select: {
        id: true,
      },
    });

    expect(createArticle.mock.calls[0]?.[0]).toMatchObject({
      data: {
        clubs: {
          create: [
            {
              clubId,
            },
          ],
        },
      },
    });
  });

  it('rejects unknown or inactive article clubs', async () => {
    findUniqueArticle.mockResolvedValue(null);
    findManyClub.mockResolvedValue([]);

    const service = new ArticlesService();

    await expect(
      service.create(
        {
          title: 'Rapid News',
          slug: 'rapid-news',
          lead: null,
          content: {
            type: 'doc',
            content: [],
          },
          clubIds: [clubId],
          categoryIds: [],
          tagIds: [],
        },
        'author-id',
      ),
    ).rejects.toMatchObject({
      response: {
        code: 'ARTICLE_CLUB_INVALID',
        message: 'One or more article clubs are invalid or inactive',
      },
    });

    expect(createArticle).not.toHaveBeenCalled();
  });

  it('replaces club assignments during article update', async () => {
    findUniqueArticle.mockResolvedValue({
      id: 'article-id',
      title: 'Article',
      slug: 'article',
      content: {
        type: 'doc',
        content: [],
      },
      status: 'DRAFT',
      deletedAt: null,
      clubs: [],
      categories: [],
      tags: [],
    });

    findManyClub.mockResolvedValue([{ id: clubId }]);

    updateArticle.mockResolvedValue({
      id: 'article-id',
    });

    const service = new ArticlesService();

    await service.update('article-id', {
      clubIds: [clubId],
    });

    expect(updateArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'article-id',
        },
        data: {
          clubs: {
            deleteMany: {},
            create: [
              {
                clubId,
              },
            ],
          },
        },
      }),
    );
  });

  it('allows removing all club assignments', async () => {
    findUniqueArticle.mockResolvedValue({
      id: 'article-id',
      title: 'Article',
      slug: 'article',
      content: {
        type: 'doc',
        content: [],
      },
      status: 'DRAFT',
      deletedAt: null,
      clubs: [],
      categories: [],
      tags: [],
    });

    updateArticle.mockResolvedValue({
      id: 'article-id',
    });

    const service = new ArticlesService();

    await service.update('article-id', {
      clubIds: [],
    });

    expect(findManyClub).not.toHaveBeenCalled();

    expect(updateArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          clubs: {
            deleteMany: {},
            create: [],
          },
        },
      }),
    );
  });
});
