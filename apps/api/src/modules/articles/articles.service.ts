import { createPrismaClient, type DatabaseClient, Prisma } from '@kurvenfunk/database';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import type {
  ArticlePublicationStatus,
  ArticlePublicationWorkflowInput,
  CreateArticleInput,
  UpdateArticleInput,
} from '@kurvenfunk/validation';
import {
  createCursorPaginatedResult,
  type CursorPaginatedResult,
} from '../../common/pagination/cursor-pagination';

export type NewsPriority = 'FAVORITE_CLUB' | 'COMPETITION' | 'GENERAL' | 'TOP_NEWS' | 'RECENT';

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
  competitionId: string | null;
  limit?: number;
}

export interface StartpageNewsOptions {
  fanPreference: 'CLUB' | 'NEUTRAL' | 'UNSET';
  favoriteClubId: string | null;
  competitionSlug: string;
  limit?: number;
}

export interface ArticleListOptions {
  cursor?: string;
  limit: number;
  clubSlug?: string;
  competitionSlug?: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  lead: string | null;
  publishedAt: Date;
  isTopNews: boolean;
  competition: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  } | null;
  clubs: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  }[];
}

export interface StartpageNews {
  variant: 'CLUB' | 'NEUTRAL';
  favoriteClub: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  } | null;
  competition: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  } | null;
  articles: PrioritizedArticle[];
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

const ARTICLE_PUBLICATION_TRANSITIONS: Record<
  ArticlePublicationStatus,
  ReadonlySet<ArticlePublicationStatus>
> = {
  DRAFT: new Set(['REVIEW', 'ARCHIVED']),
  REVIEW: new Set(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']),
  SCHEDULED: new Set(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']),
  PUBLISHED: new Set(['ARCHIVED']),
  ARCHIVED: new Set(['DRAFT']),
};

function toPrismaJson(value: CreateArticleInput['content']): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function storedJsonToPrismaInput(value: Prisma.JsonValue): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

@Injectable()
export class ArticlesService implements OnModuleDestroy {
  private async validateClubIds(clubIds: string[]) {
    if (clubIds.length === 0) {
      return;
    }

    const uniqueClubIds = [...new Set(clubIds)];

    const clubs = await this.database.club.findMany({
      where: {
        id: {
          in: uniqueClubIds,
        },
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (clubs.length !== uniqueClubIds.length) {
      throw new BadRequestException({
        code: 'ARTICLE_CLUB_INVALID',
        message: 'One or more article clubs are invalid or inactive',
      });
    }
  }

  private async validateCompetitionId(competitionId: string | null) {
    if (competitionId === null) {
      return;
    }

    const competition = await this.database.competition.findUnique({
      where: {
        id: competitionId,
      },
      select: {
        id: true,
        active: true,
      },
    });

    if (!competition?.active) {
      throw new BadRequestException({
        code: 'ARTICLE_COMPETITION_INVALID',
        message: 'Article competition is invalid or inactive',
      });
    }
  }

  private async validateMatchId(matchId: string | null, competitionId: string | null) {
    if (matchId === null) {
      return;
    }

    const match = await this.database.match.findUnique({
      where: {
        id: matchId,
      },
      select: {
        id: true,
        competitionId: true,
      },
    });

    if (!match) {
      throw new BadRequestException({
        code: 'ARTICLE_MATCH_INVALID',
        message: 'Article match is invalid',
      });
    }

    if (competitionId !== match.competitionId) {
      throw new BadRequestException({
        code: 'ARTICLE_MATCH_COMPETITION_MISMATCH',
        message: 'Article match does not belong to the selected competition',
      });
    }
  }

  private async validateCategoryIds(categoryIds: string[]) {
    if (categoryIds.length === 0) {
      return;
    }

    const uniqueCategoryIds = [...new Set(categoryIds)];

    const categories = await this.database.category.findMany({
      where: {
        id: {
          in: uniqueCategoryIds,
        },
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (categories.length !== uniqueCategoryIds.length) {
      throw new BadRequestException({
        code: 'ARTICLE_CATEGORY_INVALID',
        message: 'One or more article categories are invalid or inactive',
      });
    }
  }

  private async validateTagIds(tagIds: string[]) {
    if (tagIds.length === 0) {
      return;
    }

    const uniqueTagIds = [...new Set(tagIds)];

    const tags = await this.database.tag.findMany({
      where: {
        id: {
          in: uniqueTagIds,
        },
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (tags.length !== uniqueTagIds.length) {
      throw new BadRequestException({
        code: 'ARTICLE_TAG_INVALID',
        message: 'One or more article tags are invalid or inactive',
      });
    }
  }

  private async validateLeadMediaId(leadMediaId: string | null | undefined) {
    if (!leadMediaId) {
      return;
    }

    const media = await this.database.media.findFirst({
      where: {
        id: leadMediaId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (!media) {
      throw new BadRequestException({
        code: 'ARTICLE_LEAD_MEDIA_INVALID',
        message: 'Article lead media is invalid or inactive',
      });
    }
  }

  private async validateOgImageId(ogImageId: string | null | undefined) {
    if (!ogImageId) {
      return;
    }

    const media = await this.database.media.findFirst({
      where: {
        id: ogImageId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (!media) {
      throw new BadRequestException({
        code: 'ARTICLE_OG_IMAGE_INVALID',
        message: 'Article OG image is invalid or inactive',
      });
    }
  }

  private readonly database: DatabaseClient = createPrismaClient();

  async create(input: CreateArticleInput, authorId: string) {
    const existing = await this.database.article.findUnique({
      where: {
        slug: input.slug,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'ARTICLE_SLUG_TAKEN',
        message: 'Article slug is already in use',
      });
    }

    const clubIds = [...new Set(input.clubIds)];
    const categoryIds = [...new Set(input.categoryIds)];
    const tagIds = [...new Set(input.tagIds)];

    await this.validateCompetitionId(input.competitionId ?? null);
    await this.validateMatchId(input.matchId ?? null, input.competitionId ?? null);
    await this.validateLeadMediaId(input.leadMediaId);
    await this.validateOgImageId(input.ogImageId);
    await this.validateClubIds(clubIds);
    await this.validateCategoryIds(categoryIds);
    await this.validateTagIds(tagIds);

    return this.database.article.create({
      data: {
        title: input.title,
        slug: input.slug,
        lead: input.lead,
        content: toPrismaJson(input.content),
        isTopNews: input.isTopNews ?? false,
        authorId,
        competitionId: input.competitionId ?? null,
        matchId: input.matchId ?? null,
        leadMediaId: input.leadMediaId ?? null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        canonicalUrl: input.canonicalUrl ?? null,
        ogImageId: input.ogImageId ?? null,
        clubs: {
          create: clubIds.map((clubId) => ({
            clubId,
          })),
        },
        categories: {
          create: categoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
        tags: {
          create: tagIds.map((tagId) => ({
            tagId,
          })),
        },
      },
      include: {
        leadMedia: {
          select: {
            id: true,
            originalFileName: true,
            mimeType: true,
            width: true,
            height: true,
            altText: true,
          },
        },
        ogImage: {
          select: {
            id: true,
            originalFileName: true,
            mimeType: true,
            width: true,
            height: true,
            altText: true,
          },
        },
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
  }

  async findEditorialList() {
    return this.database.article.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        deletedAt: true,
        publishedAt: true,
        scheduledAt: true,
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });
  }

  async findEditorialById(id: string) {
    const article = await this.database.article.findUnique({
      where: {
        id,
      },
      include: {
        leadMedia: {
          select: {
            id: true,
            originalFileName: true,
            mimeType: true,
            width: true,
            height: true,
            altText: true,
          },
        },
        ogImage: {
          select: {
            id: true,
            originalFileName: true,
            mimeType: true,
            width: true,
            height: true,
            altText: true,
          },
        },
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

    if (!article) {
      throw new NotFoundException({
        code: 'ARTICLE_NOT_FOUND',
        message: 'Article not found',
      });
    }

    return article;
  }

  async update(id: string, input: UpdateArticleInput) {
    const article = await this.findEditorialById(id);

    if (article.deletedAt) {
      throw new ConflictException({
        code: 'ARTICLE_DELETED',
        message: 'Deleted articles cannot be edited',
      });
    }

    if (input.slug) {
      const existing = await this.database.article.findFirst({
        where: {
          slug: input.slug,
          id: {
            not: id,
          },
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        throw new ConflictException({
          code: 'ARTICLE_SLUG_TAKEN',
          message: 'Article slug is already in use',
        });
      }
    }

    const { content, clubIds, categoryIds, tagIds, ...data } = input;

    if (input.competitionId !== undefined) {
      await this.validateCompetitionId(input.competitionId);
    }

    if (input.matchId !== undefined || input.competitionId !== undefined) {
      await this.validateMatchId(
        input.matchId !== undefined ? input.matchId : (article.matchId ?? null),
        input.competitionId !== undefined ? input.competitionId : (article.competitionId ?? null),
      );
    }

    if (input.leadMediaId !== undefined) {
      await this.validateLeadMediaId(input.leadMediaId);
    }

    if (input.ogImageId !== undefined) {
      await this.validateOgImageId(input.ogImageId);
    }

    if (clubIds !== undefined) {
      await this.validateClubIds(clubIds);
    }

    if (categoryIds !== undefined) {
      await this.validateCategoryIds(categoryIds);
    }

    if (tagIds !== undefined) {
      await this.validateTagIds(tagIds);
    }

    return this.database.$transaction(async (transaction) => {
      await transaction.articleRevision.create({
        data: {
          articleId: article.id,
          title: article.title,
          slug: article.slug,
          lead: article.lead,
          content: storedJsonToPrismaInput(article.content),
          isTopNews: article.isTopNews,
          competitionId: article.competitionId,
          matchId: article.matchId,
          leadMediaId: article.leadMediaId,
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
          canonicalUrl: article.canonicalUrl,
          ogImageId: article.ogImageId,
          clubIds: article.clubs?.map(({ clubId }) => clubId) ?? [],
          categoryIds: article.categories?.map(({ categoryId }) => categoryId) ?? [],
          tagIds: article.tags?.map(({ tagId }) => tagId) ?? [],
        },
      });

      return transaction.article.update({
        where: {
          id,
        },
        data: {
          ...data,
          ...(content !== undefined
            ? {
                content: toPrismaJson(content),
              }
            : {}),
          ...(clubIds !== undefined
            ? {
                clubs: {
                  deleteMany: {},
                  create: [...new Set(clubIds)].map((clubId) => ({
                    clubId,
                  })),
                },
              }
            : {}),
          ...(categoryIds !== undefined
            ? {
                categories: {
                  deleteMany: {},
                  create: [...new Set(categoryIds)].map((categoryId) => ({
                    categoryId,
                  })),
                },
              }
            : {}),
          ...(tagIds !== undefined
            ? {
                tags: {
                  deleteMany: {},
                  create: [...new Set(tagIds)].map((tagId) => ({
                    tagId,
                  })),
                },
              }
            : {}),
        },
        include: {
          leadMedia: {
            select: {
              id: true,
              originalFileName: true,
              mimeType: true,
              width: true,
              height: true,
              altText: true,
            },
          },
          ogImage: {
            select: {
              id: true,
              originalFileName: true,
              mimeType: true,
              width: true,
              height: true,
              altText: true,
            },
          },
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
  }

  async changePublicationStatus(id: string, input: ArticlePublicationWorkflowInput) {
    const article = await this.findEditorialById(id);

    if (article.deletedAt) {
      throw new ConflictException({
        code: 'ARTICLE_DELETED',
        message: 'Deleted articles cannot change publication status',
      });
    }

    const currentStatus = article.status;
    const targetStatus = input.status;

    if (!ARTICLE_PUBLICATION_TRANSITIONS[currentStatus].has(targetStatus)) {
      throw new ConflictException({
        code: 'ARTICLE_PUBLICATION_TRANSITION_INVALID',
        message: `Cannot change article publication status from ${currentStatus} to ${targetStatus}`,
      });
    }

    const now = new Date();

    if (targetStatus === 'SCHEDULED') {
      const scheduledAt = new Date(input.scheduledAt!);

      if (scheduledAt <= now) {
        throw new BadRequestException({
          code: 'ARTICLE_SCHEDULED_AT_INVALID',
          message: 'scheduledAt must be in the future',
        });
      }

      return this.database.article.update({
        where: {
          id,
        },
        data: {
          status: 'SCHEDULED',
          scheduledAt,
          publishedAt: null,
          archivedAt: null,
        },
      });
    }

    if (targetStatus === 'PUBLISHED') {
      return this.database.article.update({
        where: {
          id,
        },
        data: {
          status: 'PUBLISHED',
          scheduledAt: null,
          publishedAt: now,
          archivedAt: null,
        },
      });
    }

    if (targetStatus === 'ARCHIVED') {
      return this.database.article.update({
        where: {
          id,
        },
        data: {
          status: 'ARCHIVED',
          scheduledAt: null,
          archivedAt: now,
        },
      });
    }

    return this.database.article.update({
      where: {
        id,
      },
      data: {
        status: targetStatus,
        scheduledAt: null,
        publishedAt: null,
        archivedAt: null,
      },
    });
  }

  async archive(id: string) {
    return this.changePublicationStatus(id, {
      status: 'ARCHIVED',
    });
  }

  async softDelete(id: string) {
    await this.findEditorialById(id);

    return this.database.article.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async restore(id: string) {
    const article = await this.findEditorialById(id);

    if (!article.deletedAt) {
      throw new ConflictException({
        code: 'ARTICLE_NOT_DELETED',
        message: 'Only deleted articles can be restored',
      });
    }

    // Restore to editorial review, never make a previously published or
    // scheduled article publicly visible without a fresh publish decision.
    return this.database.article.update({
      where: { id },
      data: {
        deletedAt: null,
        status: 'DRAFT',
        scheduledAt: null,
        publishedAt: null,
        archivedAt: null,
      },
    });
  }

  async findPublished(
    options: ArticleListOptions,
  ): Promise<CursorPaginatedResult<ArticleListItem>> {
    const now = new Date();

    const articles = await this.database.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          not: null,
          lte: now,
        },
        deletedAt: null,
        ...(options.clubSlug
          ? {
              clubs: {
                some: {
                  club: {
                    slug: options.clubSlug,
                    active: true,
                  },
                },
              },
            }
          : {}),
        ...(options.competitionSlug
          ? {
              competition: {
                slug: options.competitionSlug,
              },
            }
          : {}),
      },
      ...(options.cursor
        ? {
            cursor: {
              id: options.cursor,
            },
            skip: 1,
          }
        : {}),
      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      take: options.limit + 1,
      select: {
        id: true,
        title: true,
        slug: true,
        lead: true,
        publishedAt: true,
        isTopNews: true,
        competition: {
          select: {
            id: true,
            name: true,
            shortName: true,
            slug: true,
          },
        },
        clubs: {
          select: {
            club: {
              select: {
                id: true,
                name: true,
                shortName: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    const items = articles.flatMap(({ clubs, publishedAt, ...article }) => {
      if (publishedAt === null) {
        return [];
      }

      return [
        {
          ...article,
          publishedAt,
          clubs: clubs.map(({ club }) => club),
        },
      ];
    });

    return createCursorPaginatedResult(items, options.limit, (article) => article.id);
  }

  async findPublishedBySlug(slug: string) {
    const now = new Date();

    return this.database.article.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        publishedAt: {
          not: null,
          lte: now,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        lead: true,
        content: true,
        publishedAt: true,
        originalUrl: true,
        seoTitle: true,
        seoDescription: true,
        canonicalUrl: true,
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
        source: {
          select: {
            id: true,
            name: true,
            website: true,
          },
        },
        leadMedia: {
          select: {
            id: true,
            externalUrl: true,
            storageKey: true,
            altText: true,
            copyright: true,
            source: true,
            sourceUrl: true,
            width: true,
            height: true,
          },
        },
        ogImage: {
          select: {
            id: true,
            externalUrl: true,
            storageKey: true,
            altText: true,
            width: true,
            height: true,
          },
        },
        competition: {
          select: {
            id: true,
            name: true,
            shortName: true,
            slug: true,
          },
        },
        clubs: {
          select: {
            club: {
              select: {
                id: true,
                name: true,
                shortName: true,
                slug: true,
              },
            },
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: {
              where: {
                status: 'VISIBLE',
                deletedAt: null,
              },
            },
          },
        },
      },
    });
  }

  async getStartpageNews(options: StartpageNewsOptions): Promise<StartpageNews> {
    const competition = await this.database.competition.findUnique({
      where: {
        slug: options.competitionSlug,
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
      },
    });

    // A newly reset DEV database has no competition rows. This is an empty feed,
    // not an application error; do not fabricate competition or sports data.
    if (!competition) {
      return {
        variant: 'NEUTRAL',
        favoriteClub: null,
        competition: null,
        articles: await this.getNeutralNews({ competitionId: null, limit: options.limit }),
      };
    }

    if (options.fanPreference === 'CLUB' && options.favoriteClubId) {
      const favoriteClub = await this.database.club.findUnique({
        where: {
          id: options.favoriteClubId,
        },
        select: {
          id: true,
          name: true,
          shortName: true,
          slug: true,
        },
      });

      if (favoriteClub) {
        const articles = await this.getPrioritizedNews({
          favoriteClubId: favoriteClub.id,
          competitionId: competition.id,
          limit: options.limit,
        });

        return {
          variant: 'CLUB',
          favoriteClub,
          competition,
          articles,
        };
      }
    }

    const articles = await this.getNeutralNews({
      competitionId: competition.id,
      limit: options.limit,
    });

    return {
      variant: 'NEUTRAL',
      favoriteClub: null,
      competition,
      articles,
    };
  }

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
          ...(options.competitionId
            ? {
                OR: [
                  { competitionId: null },
                  { competitionId: { not: options.competitionId } },
                ],
              }
            : {}),
        },
        select: articleSelect,
        orderBy: {
          publishedAt: 'desc',
        },
        take: limit,
      }),
      options.competitionId
        ? this.database.article.findMany({
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
          })
        : Promise.resolve([] as SelectedArticle[]),
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
