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
    let slug = await this.createUniqueSlug(title);

    const publishedAt =
      article.publishedAt !== undefined ? new Date(article.publishedAt) : new Date();

    if (Number.isNaN(publishedAt.getTime())) {
      throw new Error(`Import record ${importRecordId} has an invalid publishedAt value`);
    }

    const content = this.createArticleContent(article.body);

    // A worker retry or a competing worker must never create a second
    // article for one import record. Claim the record before writing the
    // article, and rely on the unique Article.importRecordId constraint too.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const result = await this.databaseService.client.$transaction(
          async (tx) => {
            const currentRecord = await tx.importRecord.findUniqueOrThrow({
              where: { id: importRecordId },
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
              return { id: currentRecord.canonicalEntityId, created: false };
            }

            if (currentRecord.status !== 'MATCHED') {
              throw new Error(
                'Import record ' +
                  importRecordId +
                  ' cannot be published from status ' +
                  currentRecord.status,
              );
            }

            // Atomic conditional write takes a row lock. Concurrent
            // Serializable transactions retry without publishing twice.
            const claim = await tx.importRecord.updateMany({
              where: { id: importRecordId, status: 'MATCHED' },
              data: { status: 'CREATED' },
            });

            if (claim.count !== 1) {
              const latest = await tx.importRecord.findUniqueOrThrow({
                where: { id: importRecordId },
                select: {
                  status: true,
                  canonicalEntityType: true,
                  canonicalEntityId: true,
                },
              });

              if (
                latest.status === 'CREATED' &&
                latest.canonicalEntityType === 'ARTICLE' &&
                latest.canonicalEntityId !== null
              ) {
                return { id: latest.canonicalEntityId, created: false };
              }

              throw new Error('IMPORT_RECORD_CLAIM_CONFLICT');
            }

            const created = await tx.article.create({
              data: {
                importRecordId,
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
              select: { id: true },
            });

            await tx.importRecord.update({
              where: { id: importRecordId },
              data: {
                status: 'CREATED',
                canonicalEntityType: 'ARTICLE',
                canonicalEntityId: created.id,
                errorCode: null,
                errorMessage: null,
              },
            });

            await tx.importJob.update({
              where: { id: currentRecord.importJobId },
              data: { createdCount: { increment: 1 } },
            });

            return { id: created.id, created: true };
          },
          { isolationLevel: 'Serializable' },
        );

        return {
          articleId: result.id,
          created: result.created,
        };
      } catch (error) {
        const code =
          error !== null && typeof error === 'object' && 'code' in error
            ? (error as { code?: unknown }).code
            : null;

        if (
          attempt < 3 &&
          (code === 'P2034' ||
            (error instanceof Error && error.message === 'IMPORT_RECORD_CLAIM_CONFLICT'))
        ) {
          continue;
        }

        // Concurrent imports may have the same headline and therefore slug.
        // A stable record-ID fallback avoids a second slug race on retry.
        if (attempt < 3 && code === 'P2002') {
          slug = slug.slice(0, 130) + '-' + importRecordId;
          continue;
        }

        throw error;
      }
    }

    throw new Error('Import article transaction retries exhausted');
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
