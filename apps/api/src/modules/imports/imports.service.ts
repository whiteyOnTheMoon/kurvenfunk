import { Injectable, NotFoundException, type OnModuleDestroy } from '@nestjs/common';
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

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
