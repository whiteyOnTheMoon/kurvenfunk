import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

const DEFAULT_JOB_LIMIT = 30;
const MAX_JOB_LIMIT = 100;

export interface ImportJobListOptions {
  cursor?: string;
  limit?: number;
}

@Injectable()
export class ImportsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async getOverview() {
    const [
      providers,
      totalJobs,
      runningJobs,
      failedJobs,
      deadLetterJobs,
      importedRecords,
      duplicateRecords,
      reviewRequiredRecords,
      failedRecords,
      matchingProblems,
    ] = await Promise.all([
      this.database.provider.findMany({
        orderBy: [{ name: 'asc' }],
        select: {
          id: true,
          key: true,
          name: true,
          type: true,
          status: true,
          lastImportAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              importJobs: true,
              importRecords: true,
            },
          },
        },
      }),
      this.database.importJob.count(),
      this.database.importJob.count({
        where: {
          status: {
            in: ['QUEUED', 'RUNNING'],
          },
        },
      }),
      this.database.importJob.count({
        where: {
          status: {
            in: ['FAILED', 'PARTIALLY_SUCCEEDED'],
          },
        },
      }),
      this.database.importJob.count({
        where: {
          status: 'DEAD_LETTER',
        },
      }),
      this.database.importRecord.count({
        where: {
          status: {
            in: ['CREATED', 'UPDATED'],
          },
        },
      }),
      this.database.importRecord.count({
        where: {
          status: 'DUPLICATE',
        },
      }),
      this.database.importRecord.count({
        where: {
          status: 'REVIEW_REQUIRED',
        },
      }),
      this.database.importRecord.count({
        where: {
          status: 'FAILED',
        },
      }),
      this.database.entityMatch.count({
        where: {
          status: {
            in: ['UNMATCHED', 'AMBIGUOUS', 'REVIEW_REQUIRED'],
          },
        },
      }),
    ]);

    return {
      summary: {
        totalJobs,
        runningJobs,
        failedJobs,
        deadLetterJobs,
        importedRecords,
        duplicateRecords,
        reviewRequiredRecords,
        failedRecords,
        matchingProblems,
      },
      providers: providers.map((provider) => ({
        id: provider.id,
        key: provider.key,
        name: provider.name,
        type: provider.type,
        status: provider.status,
        lastImportAt: provider.lastImportAt,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
        jobCount: provider._count.importJobs,
        recordCount: provider._count.importRecords,
      })),
    };
  }

  async listJobs(options: ImportJobListOptions = {}) {
    const limit = Math.min(Math.max(options.limit ?? DEFAULT_JOB_LIMIT, 1), MAX_JOB_LIMIT);

    const jobs = await this.database.importJob.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(options.cursor
        ? {
            cursor: {
              id: options.cursor,
            },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        kind: true,
        status: true,
        trigger: true,
        queueJobId: true,
        requestId: true,
        correlationId: true,
        retryOfJobId: true,
        cursor: true,
        windowStart: true,
        windowEnd: true,
        receivedCount: true,
        processedCount: true,
        createdCount: true,
        updatedCount: true,
        duplicateCount: true,
        failedCount: true,
        errorCode: true,
        errorMessage: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
        updatedAt: true,
        provider: {
          select: {
            id: true,
            key: true,
            name: true,
            type: true,
            status: true,
          },
        },
      },
    });

    const hasMore = jobs.length > limit;
    const items = hasMore ? jobs.slice(0, limit) : jobs;
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor: hasMore && lastItem ? lastItem.id : null,
    };
  }

  async getJob(id: string) {
    const job = await this.database.importJob.findUnique({
      where: {
        id,
      },
      include: {
        provider: {
          select: {
            id: true,
            key: true,
            name: true,
            type: true,
            status: true,
            lastImportAt: true,
          },
        },
        retryOf: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        retryJobs: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        records: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            recordType: true,
            status: true,
            externalId: true,
            externalUrl: true,
            canonicalEntityType: true,
            canonicalEntityId: true,
            duplicateOfRecordId: true,
            errorCode: true,
            errorMessage: true,
            normalizedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException({
        code: 'IMPORT_JOB_NOT_FOUND',
        message: 'Import job not found',
      });
    }

    return job;
  }

  async getMatchingProblems() {
    return this.database.entityMatch.findMany({
      where: {
        status: {
          in: ['UNMATCHED', 'AMBIGUOUS', 'REVIEW_REQUIRED'],
        },
      },
      orderBy: [{ lastSeenAt: 'desc' }, { id: 'desc' }],
      take: 100,
      select: {
        id: true,
        entityType: true,
        externalId: true,
        externalName: true,
        status: true,
        confidence: true,
        method: true,
        evidence: true,
        firstSeenAt: true,
        lastSeenAt: true,
        reviewedAt: true,
        provider: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        competition: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        match: {
          select: {
            id: true,
            kickoff: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });
  }

  async getReviewQueue() {
    return this.database.importRecord.findMany({
      where: {
        status: 'REVIEW_REQUIRED',
        reviewDecision: null,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 100,
      select: {
        id: true,
        importJobId: true,
        recordType: true,
        status: true,
        externalId: true,
        externalUrl: true,
        normalizedPayload: true,
        normalizedAt: true,
        canonicalEntityType: true,
        canonicalEntityId: true,
        errorCode: true,
        errorMessage: true,
        reviewDecision: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        provider: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        importJob: {
          select: {
            id: true,
            kind: true,
            status: true,
            trigger: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async approveReview(id: string, reviewerId: string) {
    return this.decideReview(id, reviewerId, 'APPROVED');
  }

  async rejectReview(id: string, reviewerId: string) {
    return this.decideReview(id, reviewerId, 'REJECTED');
  }

  private async decideReview(id: string, reviewerId: string, decision: 'APPROVED' | 'REJECTED') {
    // The conditional update acquires the PostgreSQL row lock. Serializable
    // retries also cover competing workers/reviewers and prevent duplicate drafts.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.database.$transaction(
          async (transaction) => {
            const record = await transaction.importRecord.findUnique({
              where: { id },
              select: {
                id: true,
                importJobId: true,
                status: true,
                recordType: true,
                reviewDecision: true,
                normalizedPayload: true,
                externalUrl: true,
                canonicalEntityId: true,
              },
            });

            if (!record) {
              throw new NotFoundException({
                code: 'IMPORT_RECORD_NOT_FOUND',
                message: 'Import record not found',
              });
            }

            // Repeated approvals return the original draft without creating
            // new content or duplicate audit/count records.
            if (record.reviewDecision === 'APPROVED' && decision === 'APPROVED') {
              const existing = await transaction.article.findUnique({
                where: { importRecordId: id },
                select: { id: true },
              });

              if (existing && existing.id === record.canonicalEntityId) {
                return transaction.importRecord.findUniqueOrThrow({
                  where: { id },
                  select: {
                    id: true,
                    status: true,
                    reviewDecision: true,
                    reviewedAt: true,
                    reviewedById: true,
                    canonicalEntityId: true,
                  },
                });
              }
            }

            if (record.status !== 'REVIEW_REQUIRED' || record.reviewDecision !== null) {
              throw new BadRequestException({
                code: 'IMPORT_REVIEW_ALREADY_DECIDED',
                message: 'Import record is not awaiting review',
              });
            }

            const article =
              decision === 'APPROVED'
                ? this.parseReviewedArticle(record.recordType, record.normalizedPayload)
                : null;

            const reviewedAt = new Date();
            const claimed = await transaction.importRecord.updateMany({
              where: {
                id,
                status: 'REVIEW_REQUIRED',
                reviewDecision: null,
              },
              data: {
                status: decision === 'APPROVED' ? 'MATCHED' : 'SKIPPED',
                reviewDecision: decision,
                reviewedById: reviewerId,
                reviewedAt,
              },
            });

            if (claimed.count !== 1) {
              throw new BadRequestException({
                code: 'IMPORT_REVIEW_ALREADY_DECIDED',
                message: 'Import record is not awaiting review',
              });
            }

            if (article) {
              const slug = `${article.slugBase}-${id}`;
              const created = await transaction.article.create({
                data: {
                  importRecordId: id,
                  title: article.title,
                  slug,
                  lead: article.lead,
                  content: article.content,
                  status: 'DRAFT',
                  authorId: reviewerId,
                  externalAuthorName: article.authorName,
                  originalUrl: this.safeExternalUrl(record.externalUrl) ?? article.originalUrl,
                },
                select: { id: true },
              });

              await transaction.importRecord.update({
                where: { id },
                data: {
                  status: 'CREATED',
                  canonicalEntityType: 'ARTICLE',
                  canonicalEntityId: created.id,
                },
              });

              await transaction.importJob.update({
                where: { id: record.importJobId },
                data: { createdCount: { increment: 1 } },
              });

              await transaction.auditLog.create({
                data: {
                  actorType: 'USER',
                  actorUserId: reviewerId,
                  action: 'ADMIN_CORRECTION',
                  category: 'EDITORIAL',
                  targetType: 'ARTICLE',
                  targetId: created.id,
                  reason: 'Import review approved as editorial draft',
                  metadata: {
                    importRecordId: id,
                    reviewDecision: 'APPROVED',
                    articleStatus: 'DRAFT',
                  },
                },
              });
            }

            return transaction.importRecord.findUniqueOrThrow({
              where: { id },
              select: {
                id: true,
                status: true,
                reviewDecision: true,
                reviewedAt: true,
                reviewedById: true,
                canonicalEntityId: true,
              },
            });
          },
          { isolationLevel: 'Serializable' },
        );
      } catch (error) {
        if (
          attempt < 2 &&
          error !== null &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2034'
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException({
      code: 'IMPORT_REVIEW_CONFLICT',
      message: 'Import review was updated concurrently',
    });
  }

  private parseReviewedArticle(recordType: string, payload: unknown) {
    if (recordType !== 'NEWS_ARTICLE' || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException({
        code: 'IMPORT_REVIEW_NOT_ARTICLE',
        message: 'Review approval requires normalized news article content',
      });
    }

    const normalized = payload as Record<string, unknown>;
    const title = typeof normalized.title === 'string' ? normalized.title.trim() : '';
    const body = typeof normalized.body === 'string' ? normalized.body.trim() : '';
    const lead = typeof normalized.lead === 'string' ? normalized.lead.trim() : '';

    if (!title || title.length > 200 || body.length > 100_000 || lead.length > 1000) {
      throw new BadRequestException({
        code: 'IMPORT_REVIEW_CONTENT_INVALID',
        message: 'Reviewed article title or content is invalid',
      });
    }

    const slugBase =
      title
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('de')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 65) || 'import';

    return {
      title,
      slugBase,
      lead: lead || null,
      authorName:
        typeof normalized.authorName === 'string'
          ? normalized.authorName.trim().slice(0, 200) || null
          : null,
      originalUrl: this.safeExternalUrl(normalized.originalUrl),
      content: {
        type: 'doc',
        content: body
          ? [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: body }],
              },
            ]
          : [],
      },
    };
  }

  private safeExternalUrl(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
    } catch {
      return null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
