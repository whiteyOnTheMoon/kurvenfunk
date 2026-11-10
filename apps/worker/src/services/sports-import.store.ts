import { createHash } from 'node:crypto';
import type {
  SportsImportJobPayload,
  SportsProvider,
  SportsProviderRecord,
  SportsProviderResource,
} from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const RECORD_KINDS = {
  clubs: { job: 'SPORTS_CLUBS', record: 'SPORTS_CLUB' },
  fixtures: { job: 'SPORTS_FIXTURES', record: 'SPORTS_MATCH' },
  results: { job: 'SPORTS_RESULTS', record: 'SPORTS_RESULT' },
  live: { job: 'SPORTS_RESULTS', record: 'SPORTS_RESULT' },
} as const;

export interface SportsImportSession {
  providerId: string;
  importJobId: string;
  /** Same BullMQ job may be delivered more than once; completed jobs are no-ops. */
  alreadyCompleted: boolean;
}

export function sportsImportFailureCode(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  return /^FAKE_SPORTS_[A-Z_]+$/.test(message) || /^SPORTS_IMPORT_[A-Z_]+$/.test(message)
    ? message
    : 'SPORTS_IMPORT_FAILED';
}

/**
 * Staging-only persistence. It never writes canonical Club, Match or Standing.
 * The existing import history schema supports manual review in later tasks.
 */
@Injectable()
export class SportsImportStore {
  constructor(private readonly database: DatabaseService) {}

  async start(
    provider: SportsProvider,
    payload: SportsImportJobPayload,
    queueJobId: string,
  ): Promise<SportsImportSession> {
    const db = this.database.client;
    const row = await db.provider.upsert({
      where: { key: provider.key },
      update: { name: provider.name, capabilities: provider.capabilities },
      create: {
        key: provider.key,
        name: provider.name,
        type: 'SPORTS',
        status: 'ACTIVE',
        capabilities: provider.capabilities,
      },
      select: { id: true, type: true, status: true },
    });
    if (row.type !== 'SPORTS' || row.status !== 'ACTIVE') {
      throw new Error('SPORTS_IMPORT_PROVIDER_NOT_ACTIVE');
    }

    // Serialize duplicate executions of the same BullMQ job without schema changes.
    const job = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${provider.key + ':' + queueJobId}, 201))`;
      const kind = RECORD_KINDS[payload.resource].job;
      const prior = await tx.importJob.findFirst({
        where: { providerId: row.id, kind, queueJobId },
        select: { id: true, status: true },
      });
      if (prior?.status === 'SUCCEEDED') return { id: prior.id, completed: true };
      if (prior) {
        await tx.importJob.update({
          where: { id: prior.id },
          data: {
            status: 'RUNNING',
            errorCode: null,
            errorMessage: null,
            finishedAt: null,
            startedAt: new Date(),
          },
        });
        return { id: prior.id, completed: false };
      }
      const created = await tx.importJob.create({
        data: {
          providerId: row.id,
          kind,
          status: 'RUNNING',
          trigger: 'SYSTEM',
          queueJobId,
          windowStart: payload.windowStart ? new Date(payload.windowStart) : null,
          windowEnd: payload.windowEnd ? new Date(payload.windowEnd) : null,
          startedAt: new Date(),
        },
        select: { id: true },
      });
      return { id: created.id, completed: false };
    });

    return { providerId: row.id, importJobId: job.id, alreadyCompleted: job.completed };
  }

  async store(
    session: SportsImportSession,
    resource: SportsProviderResource,
    record: SportsProviderRecord,
  ): Promise<boolean> {
    const payloadText = JSON.stringify(record);
    const contentHash = createHash('sha256').update(payloadText).digest('hex');
    const recordType = RECORD_KINDS[resource].record;

    return this.database.client.$transaction(async (tx) => {
      const lock = session.importJobId + ':' + recordType + ':' + record.externalId;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lock}, 201))`;
      const existing = await tx.importRecord.findFirst({
        where: {
          importJobId: session.importJobId,
          recordType,
          externalId: record.externalId,
        },
        select: { id: true, contentHash: true },
      });
      if (existing) {
        if (existing.contentHash !== contentHash) {
          throw new Error('SPORTS_IMPORT_RECORD_CHANGED_DURING_RETRY');
        }
        return false;
      }

      const raw = await tx.rawPayload.create({
        data: {
          providerId: session.providerId,
          importJobId: session.importJobId,
          type: 'RECORD',
          externalId: record.externalId,
          payload: record,
          payloadHash: contentHash,
          sizeBytes: BigInt(Buffer.byteLength(payloadText, 'utf8')),
          metadata: {
            synthetic: true,
            resource,
            hashAlgorithm: 'sha256',
          },
        },
        select: { id: true },
      });

      await tx.importRecord.create({
        data: {
          importJobId: session.importJobId,
          providerId: session.providerId,
          rawPayloadId: raw.id,
          recordType,
          status: 'REVIEW_REQUIRED',
          externalId: record.externalId,
          contentHash,
          normalizedPayload: record,
          normalizedAt: new Date(),
        },
      });
      await tx.importJob.update({
        where: { id: session.importJobId },
        data: {
          receivedCount: { increment: 1 },
          processedCount: { increment: 1 },
        },
      });
      return true;
    });
  }

  async checkpoint(session: SportsImportSession, nextCursor: string | undefined): Promise<void> {
    await this.database.client.importJob.update({
      where: { id: session.importJobId },
      data: { cursor: nextCursor ?? null },
    });
  }

  async complete(session: SportsImportSession): Promise<void> {
    const finishedAt = new Date();
    await this.database.client.$transaction([
      this.database.client.importJob.update({
        where: { id: session.importJobId },
        data: { status: 'SUCCEEDED', cursor: null, finishedAt },
      }),
      this.database.client.provider.update({
        where: { id: session.providerId },
        data: { lastImportAt: finishedAt },
      }),
    ]);
  }

  async fail(session: SportsImportSession, error: unknown): Promise<void> {
    await this.database.client.importJob.update({
      where: { id: session.importJobId },
      data: {
        status: 'FAILED',
        errorCode: sportsImportFailureCode(error),
        errorMessage: null,
        finishedAt: new Date(),
      },
    });
  }

  async deadLetter(queueJobId: string): Promise<void> {
    await this.database.client.importJob.updateMany({
      where: {
        queueJobId,
        kind: { in: ['SPORTS_CLUBS', 'SPORTS_FIXTURES', 'SPORTS_RESULTS'] },
        status: 'FAILED',
      },
      data: { status: 'DEAD_LETTER' },
    });
  }
}
