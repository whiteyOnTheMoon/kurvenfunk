import { createPrismaClient, type DatabaseClient, type Prisma } from '@kurvenfunk/database';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';

export type NewsPriority =
  | 'FAVORITE_CLUB'
  | 'COMPETITION'
  | 'GENERAL'
  | 'TOP_NEWS'
  | 'RECENT';

export interface PrioritizedArticle {
  id: string;
  title: string;
  slug: string;
  lead: string | null;
  publishedAt: Date;
  competitionId: string | null;
  priority: NewsPriority;
}

export interface PrioritizedNewsOptions {
  favoriteClubId: string;
  competitionId: string;
  limit?: number;
}

export interface NeutralNewsOptions {
  competitionId: string;
  limit?: number;
}

const DEFAULT_NEWS_LIMIT = 20;
const MAX_NEWS_LIMIT = 100;

const articleSelect = {
  id: true,
  title: true,
  slug: true,
  lead: true,
  publishedAt: true,
  competitionId: true,
} satisfies Prisma.ArticleSelect;

type SelectedArticle = Prisma.ArticleGetPayload<{
  select: typeof articleSelect;
}>;

@Injectable()
export class ArticlesService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async getPrioritizedNews(options: PrioritizedNewsOptions): Promise<PrioritizedArticle[]> {
    const limit = this.normalizeLimit(options.limit);
    const now = new Date();

    const baseWhere = {
      status: 'PUBLISHED',
      publishedAt: {
        not: null,
        lte: now,
      },
      deletedAt: null,
    } satisfies Prisma.ArticleWhereInput;

    const [favoriteClubArticles, competitionArticles, generalArticles] = await Promise.all([
      this.database.article.findMany({
        where: {
          ...baseWhere,
          clubs: {
            some: {
              clubId: options.favoriteClubId,
            },
          },
        },
        select: articleSelect,
        orderBy: {
          publishedAt: 'desc',
        },
        take: limit,
      }),
      this.database.article.findMany({
        where: {
          ...baseWhere,
          competitionId: options.competitionId,
          clubs: {
            none: {
              clubId: options.favoriteClubId,
            },
          },
        },
        select: articleSelect,
        orderBy: {
          publishedAt: 'desc',
        },
        take: limit,
      }),
      this.database.article.findMany({
        where: {
          ...baseWhere,
          clubs: {
            none: {
              clubId: options.favoriteClubId,
            },
          },
          OR: [
            {
              competitionId: null,
            },
            {
              competitionId: {
                not: options.competitionId,
              },
            },
          ],
        },
        select: articleSelect,
        orderBy: {
          publishedAt: 'desc',
        },
        take: limit,
      }),
    ]);

    return this.buildPrioritizedFeed(
      favoriteClubArticles,
      competitionArticles,
      generalArticles,
      limit,
    );
  }

  async getNeutralNews(options: NeutralNewsOptions): Promise<PrioritizedArticle[]> {
    const limit = this.normalizeLimit(options.limit);
    const now = new Date();

    const baseWhere = {
      status: 'PUBLISHED',
      publishedAt: {
        not: null,
        lte: now,
      },
      deletedAt: null,
    } satisfies Prisma.ArticleWhereInput;

    const [topArticles, recentArticles, competitionArticles] = await Promise.all([
      this.database.article.findMany({
        where: {
          ...baseWhere,
          isTopNews: true,
        },
        select: articleSelect,
        orderBy: {
          publishedAt: 'desc',
        },
        take: limit,
      }),
      this.database.article.findMany({
        where: {
          ...baseWhere,
          isTopNews: false,
          OR: [
            {
              competitionId: null,
            },
            {
              competitionId: {
                not: options.competitionId,
              },
            },
          ],
        },
        select: articleSelect,
        orderBy: {
          publishedAt: 'desc',
        },
        take: limit,
      }),
      this.database.article.findMany({
        where: {
          ...baseWhere,
          isTopNews: false,
          competitionId: options.competitionId,
        },
        select: articleSelect,
        orderBy: {
          publishedAt: 'desc',
        },
        take: limit,
      }),
    ]);

    return this.buildNeutralFeed(topArticles, recentArticles, competitionArticles, limit);
  }

  private buildPrioritizedFeed(
    favoriteClubArticles: SelectedArticle[],
    competitionArticles: SelectedArticle[],
    generalArticles: SelectedArticle[],
    limit: number,
  ): PrioritizedArticle[] {
    const reserveCompetition = limit >= 2 && competitionArticles.length > 0 ? 1 : 0;

    const reserveGeneral =
      limit >= 3 && generalArticles.length > 0
        ? 1
        : limit >= 2 && reserveCompetition === 0 && generalArticles.length > 0
          ? 1
          : 0;

    let favoriteCount = Math.min(
      favoriteClubArticles.length,
      Math.max(0, limit - reserveCompetition - reserveGeneral),
    );
    let competitionCount = reserveCompetition;
    let generalCount = reserveGeneral;

    let remaining = limit - favoriteCount - competitionCount - generalCount;

    if (remaining > 0) {
      const additionalFavorite = Math.min(remaining, favoriteClubArticles.length - favoriteCount);
      favoriteCount += additionalFavorite;
      remaining -= additionalFavorite;
    }

    if (remaining > 0) {
      const additionalCompetition = Math.min(
        remaining,
        competitionArticles.length - competitionCount,
      );
      competitionCount += additionalCompetition;
      remaining -= additionalCompetition;
    }

    if (remaining > 0) {
      const additionalGeneral = Math.min(remaining, generalArticles.length - generalCount);
      generalCount += additionalGeneral;
    }

    return [
      ...this.withPriority(favoriteClubArticles.slice(0, favoriteCount), 'FAVORITE_CLUB'),
      ...this.withPriority(competitionArticles.slice(0, competitionCount), 'COMPETITION'),
      ...this.withPriority(generalArticles.slice(0, generalCount), 'GENERAL'),
    ];
  }

  private buildNeutralFeed(
    topArticles: SelectedArticle[],
    recentArticles: SelectedArticle[],
    competitionArticles: SelectedArticle[],
    limit: number,
  ): PrioritizedArticle[] {
    const reserveRecent = limit >= 2 && recentArticles.length > 0 ? 1 : 0;
    const reserveCompetition =
      limit >= 3 && competitionArticles.length > 0
        ? 1
        : limit >= 2 && reserveRecent === 0 && competitionArticles.length > 0
          ? 1
          : 0;

    let topCount = Math.min(
      topArticles.length,
      Math.max(0, limit - reserveRecent - reserveCompetition),
    );
    let recentCount = reserveRecent;
    let competitionCount = reserveCompetition;

    let remaining = limit - topCount - recentCount - competitionCount;

    if (remaining > 0) {
      const additionalTop = Math.min(remaining, topArticles.length - topCount);
      topCount += additionalTop;
      remaining -= additionalTop;
    }

    if (remaining > 0) {
      const additionalRecent = Math.min(remaining, recentArticles.length - recentCount);
      recentCount += additionalRecent;
      remaining -= additionalRecent;
    }

    if (remaining > 0) {
      const additionalCompetition = Math.min(
        remaining,
        competitionArticles.length - competitionCount,
      );
      competitionCount += additionalCompetition;
    }

    return [
      ...this.withPriority(topArticles.slice(0, topCount), 'TOP_NEWS'),
      ...this.withPriority(recentArticles.slice(0, recentCount), 'RECENT'),
      ...this.withPriority(competitionArticles.slice(0, competitionCount), 'COMPETITION'),
    ];
  }

  private normalizeLimit(limit?: number): number {
    if (limit === undefined) {
      return DEFAULT_NEWS_LIMIT;
    }

    if (!Number.isInteger(limit) || limit < 1) {
      return DEFAULT_NEWS_LIMIT;
    }

    return Math.min(limit, MAX_NEWS_LIMIT);
  }

  private withPriority(articles: SelectedArticle[], priority: NewsPriority): PrioritizedArticle[] {
    return articles.flatMap((article) => {
      if (article.publishedAt === null) {
        return [];
      }

      return [
        {
          ...article,
          publishedAt: article.publishedAt,
          priority,
        },
      ];
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
