import { createHash } from 'node:crypto';
import { Prisma } from '@kurvenfunk/database';
import type { NewsProvider, NewsProviderRecord } from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface RawPayloadImportContext {
  queueJobId?: string;
  retryOfImportJobId?: string;
  windowStart?: string;
  windowEnd?: string;
}

export interface RawPayloadImportSession {
  providerId: string;
  importJobId: string;
}

export interface StoredRawPayloadRecord {
  rawPayloadId: string;
  importRecordId: string;
}

@Injectable()
export class RawPayloadService {
  constructor(private readonly databaseService: DatabaseService) {}

  async startNewsImport(
    provider: NewsProvider,
    context: RawPayloadImportContext = {},
  ): Promise<RawPayloadImportSession> {
    const providerRow = await this.databaseService.client.provider.upsert({
      where: {
        key: provider.key,
      },
      update: {
        name: provider.name,
        type: 'NEWS',
        status: 'ACTIVE',
        capabilities: provider.capabilities,
      },
      create: {
        key: provider.key,
        name: provider.name,
        type: 'NEWS',
        status: 'ACTIVE',
        capabilities: provider.capabilities,
      },
      select: {
        id: true,
      },
    });

    const importJob = await this.databaseService.client.importJob.create({
      data: {
        providerId: providerRow.id,
        kind: 'NEWS_FETCH',
        status: 'RUNNING',
        trigger: context.retryOfImportJobId ? 'REPLAY' : 'SYSTEM',
        retryOfJobId: context.retryOfImportJobId,
        queueJobId: context.queueJobId,
        windowStart: context.windowStart !== undefined ? new Date(context.windowStart) : undefined,
        windowEnd: context.windowEnd !== undefined ? new Date(context.windowEnd) : undefined,
        startedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    return {
      providerId: providerRow.id,
      importJobId: importJob.id,
    };
  }

  async storeRecord(
    session: RawPayloadImportSession,
    record: NewsProviderRecord,
  ): Promise<StoredRawPayloadRecord> {
    const serializedPayload = this.serializePayload(record.payload);
    const payloadHash = createHash('sha256').update(serializedPayload).digest('hex');
    const sizeBytes = BigInt(Buffer.byteLength(serializedPayload, 'utf8'));

    const result = await this.databaseService.client.$transaction(async (transaction) => {
      const rawPayload = await transaction.rawPayload.create({
        data: {
          providerId: session.providerId,
          importJobId: session.importJobId,
          type: 'RECORD',
          externalId: record.externalId,
          payload: record.payload as Prisma.InputJsonValue,
          payloadHash,
          sizeBytes,
          metadata: {
            externalUrl: record.externalUrl ?? null,
            hashAlgorithm: 'sha256',
            serialization: 'stable-json-v1',
          },
        },
        select: {
          id: true,
        },
      });

      const importRecord = await transaction.importRecord.create({
        data: {
          importJobId: session.importJobId,
          providerId: session.providerId,
          rawPayloadId: rawPayload.id,
          recordType: 'NEWS_ARTICLE',
          status: 'RECEIVED',
          externalId: record.externalId,
          externalUrl: record.externalUrl,
          contentHash: payloadHash,
        },
        select: {
          id: true,
        },
      });

      await transaction.importJob.update({
        where: {
          id: session.importJobId,
        },
        data: {
          receivedCount: {
            increment: 1,
          },
        },
      });

      return {
        rawPayloadId: rawPayload.id,
        importRecordId: importRecord.id,
      };
    });

    return result;
  }

  async completeNewsImport(session: RawPayloadImportSession): Promise<void> {
    const finishedAt = new Date();

    const groupedStatuses = await this.databaseService.client.importRecord.groupBy({
      by: ['status'],
      where: {
        importJobId: session.importJobId,
      },
      _count: {
        _all: true,
      },
    });

    const counts = new Map(groupedStatuses.map((group) => [group.status, group._count._all]));

    type ImportRecordStatus = (typeof groupedStatuses)[number]['status'];

    const count = (...statuses: ImportRecordStatus[]) =>
      statuses.reduce((total, status) => total + (counts.get(status) ?? 0), 0);

    const processedCount = count(
      'CREATED',
      'UPDATED',
      'DUPLICATE',
      'SKIPPED',
      'REVIEW_REQUIRED',
      'FAILED',
    );

    await this.databaseService.client.$transaction([
      this.databaseService.client.importJob.update({
        where: {
          id: session.importJobId,
        },
        data: {
          status: 'SUCCEEDED',
          processedCount,
          createdCount: count('CREATED'),
          updatedCount: count('UPDATED'),
          duplicateCount: count('DUPLICATE'),
          failedCount: count('FAILED'),
          finishedAt,
        },
      }),
      this.databaseService.client.provider.update({
        where: {
          id: session.providerId,
        },
        data: {
          lastImportAt: finishedAt,
        },
      }),
    ]);
  }

  async failNewsImport(session: RawPayloadImportSession, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);

    await this.databaseService.client.importJob.update({
      where: {
        id: session.importJobId,
      },
      data: {
        status: 'FAILED',
        errorCode: 'NEWS_IMPORT_FAILED',
        errorMessage: message.slice(0, 2000),
        finishedAt: new Date(),
      },
    });
  }

  private serializePayload(payload: unknown): string {
    return JSON.stringify(this.sortValue(payload));
  }

  private sortValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortValue(item));
    }

    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => [key, this.sortValue(item)]),
      );
    }

    return value;
  }
}
