import { Prisma } from '@kurvenfunk/database';
import type { NewsProvider, NormalizedNewsArticle } from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import type { NewsClubMatchingResult } from './news-club-matching.service';
import type { NewsCompetitionMatchingResult } from './news-competition-matching.service';
import type { NewsMatchMatchingResult } from './news-match-matching.service';

export interface NewsAutoPublishingResult {
  articleId: string | null;
  created: boolean;
  skippedReason?: 'PROVIDER_NOT_TRUSTED';
}

@Injectable()
export class NewsAutoPublishingService {
  constructor(private readonly databaseService: DatabaseService) {}

  async publish(
    provider: NewsProvider,
    importRecordId: string,
    article: NormalizedNewsArticle,
    clubMatching: NewsClubMatchingResult,
    competitionMatching: NewsCompetitionMatchingResult,
    matchMatching: NewsMatchMatchingResult,
  ): Promise<NewsAutoPublishingResult> {
    if (!provider.trustedForAutoPublish) {
      return {
        articleId: null,
        created: false,
        skippedReason: 'PROVIDER_NOT_TRUSTED',
      };
    }

    const importRecord = await this.databaseService.client.importRecord.findUniqueOrThrow({
      where: {
        id: importRecordId,
      },
      select: {
        id: true,
        status: true,
        canonicalEntityType: true,
        canonicalEntityId: true,
      },
    });

    if (
      importRecord.status === 'CREATED' &&
      importRecord.canonicalEntityType === 'ARTICLE' &&
      importRecord.canonicalEntityId !== null
    ) {
      return {
        articleId: importRecord.canonicalEntityId,
        created: false,
      };
    }

    if (importRecord.status !== 'MATCHED') {
      throw new Error(
        `Import record ${importRecordId} cannot be published from status ${importRecord.status}`,
      );
    }

    if (!article.title) {
      throw new Error(`Import record ${importRecordId} has no title`);
    }

    const title = article.title;
    const slug = await this.createUniqueSlug(title);

    const publishedAt =
      article.publishedAt !== undefined ? new Date(article.publishedAt) : new Date();

    if (Number.isNaN(publishedAt.getTime())) {
      throw new Error(`Import record ${importRecordId} has an invalid publishedAt value`);
    }

    const content = this.createArticleContent(article.body);

    const createdArticle = await this.databaseService.client.$transaction(async (tx) => {
      const currentRecord = await tx.importRecord.findUniqueOrThrow({
        where: {
          id: importRecordId,
        },
        select: {
          importJobId: true,
          status: true,
          canonicalEntityType: true,
          canonicalEntityId: true,
        },
      });

      if (
        currentRecord.status === 'CREATED' &&
        currentRecord.canonicalEntityType === 'ARTICLE' &&
        currentRecord.canonicalEntityId !== null
      ) {
        return {
          id: currentRecord.canonicalEntityId,
          created: false,
        };
      }

      if (currentRecord.status !== 'MATCHED') {
        throw new Error(
          `Import record ${importRecordId} cannot be published from status ${currentRecord.status}`,
        );
      }

      const created = await tx.article.create({
        data: {
          title,
          slug,
          lead: article.lead ?? null,
          content,
          status: 'PUBLISHED',
          externalAuthorName: article.authorName ?? null,
          originalUrl: article.originalUrl ?? null,
          competitionId: competitionMatching.match?.competitionId ?? null,
          matchId: matchMatching.match?.matchId ?? null,
          publishedAt,
          clubs:
            clubMatching.matches.length > 0
              ? {
                  create: clubMatching.matches.map((club) => ({
                    clubId: club.clubId,
                  })),
                }
              : undefined,
        },
        select: {
          id: true,
        },
      });

      await tx.importRecord.update({
        where: {
          id: importRecordId,
        },
        data: {
          status: 'CREATED',
          canonicalEntityType: 'ARTICLE',
          canonicalEntityId: created.id,
          errorCode: null,
          errorMessage: null,
        },
      });

      await tx.importJob.update({
        where: {
          id: currentRecord.importJobId,
        },
        data: {
          createdCount: {
            increment: 1,
          },
        },
      });

      return {
        id: created.id,
        created: true,
      };
    });

    return {
      articleId: createdArticle.id,
      created: createdArticle.created,
    };
  }

  private createArticleContent(body: string | undefined): Prisma.InputJsonValue {
    if (!body?.trim()) {
      return {
        type: 'doc',
        content: [],
      };
    }

    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: body.trim(),
            },
          ],
        },
      ],
    };
  }

  private async createUniqueSlug(title: string): Promise<string> {
    const baseSlug =
      title
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('de')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 180) || 'news';

    let slug = baseSlug;
    let suffix = 2;

    while (
      (await this.databaseService.client.article.findUnique({
        where: {
          slug,
        },
        select: {
          id: true,
        },
      })) !== null
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }
}
