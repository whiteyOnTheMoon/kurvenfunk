import { createHash } from 'node:crypto';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import {
  DEFAULT_JOB_OPTIONS,
  QUEUE_NAMES,
  type NewsImportDeadLetterPayload,
  type NewsImportJobPayload,
} from '@kurvenfunk/types';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  type OnModuleDestroy,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import { z } from 'zod';

const originalJobSchema = z
  .object({
    providerKey: z.string().trim().min(1).max(100),
    windowStart: z.string().datetime({ offset: true }).optional(),
    windowEnd: z.string().datetime({ offset: true }).optional(),
    lookbackMinutes: z
      .number()
      .int()
      .min(1)
      .max(24 * 60)
      .optional(),
  })
  .passthrough();

@Injectable()
export class ImportReplayService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  constructor(
    @InjectQueue(QUEUE_NAMES.NEWS_IMPORT)
    private readonly importQueue: Queue<NewsImportJobPayload>,
    @InjectQueue(QUEUE_NAMES.NEWS_IMPORT_DEAD_LETTER)
    private readonly deadLetterQueue: Queue<NewsImportDeadLetterPayload>,
  ) {}

  async replayDeadLetter(importJobId: string, actorUserId: string) {
    const source = await this.database.importJob.findUnique({
      where: { id: importJobId },
      select: {
        id: true,
        kind: true,
        status: true,
        queueJobId: true,
        windowStart: true,
        windowEnd: true,
        provider: { select: { key: true, status: true } },
      },
    });

    if (!source) {
      throw new NotFoundException({
        code: 'IMPORT_JOB_NOT_FOUND',
        message: 'Importjob wurde nicht gefunden.',
      });
    }

    if (source.kind !== 'NEWS_FETCH' || source.status !== 'DEAD_LETTER' || !source.queueJobId) {
      throw new ConflictException({
        code: 'IMPORT_REPLAY_NOT_ALLOWED',
        message: 'Nur endgültig gescheiterte Newsimporte können erneut gestartet werden.',
      });
    }

    if (source.provider.status !== 'ACTIVE') {
      throw new ConflictException({
        code: 'IMPORT_PROVIDER_NOT_ACTIVE',
        message: 'Der Nachrichtenprovider ist nicht aktiv.',
      });
    }

    // Deterministic IDs prevent double replay when a moderator retries the
    // HTTP request or two administrators click at the same time.
    const sourceHash = createHash('sha256').update(source.queueJobId).digest('hex');
    const deadLetterId = `news-import-dead-${sourceHash}`;
    const replayId = `news-import-replay-${sourceHash}`;

    let deadLetter;
    let existingReplay;
    try {
      [deadLetter, existingReplay] = await Promise.all([
        this.deadLetterQueue.getJob(deadLetterId),
        this.importQueue.getJob(replayId),
      ]);
    } catch {
      throw new ServiceUnavailableException({
        code: 'IMPORT_REPLAY_QUEUE_UNAVAILABLE',
        message: 'Die Import-Warteschlange ist momentan nicht erreichbar.',
      });
    }

    if (existingReplay) {
      return {
        sourceImportJobId: importJobId,
        queueJobId: replayId,
        alreadyQueued: true,
      };
    }

    if (
      !deadLetter ||
      deadLetter.data.originalQueue !== QUEUE_NAMES.NEWS_IMPORT ||
      deadLetter.data.originalJobId !== source.queueJobId ||
      deadLetter.data.originalJobName !== 'fetch-provider'
    ) {
      throw new ConflictException({
        code: 'IMPORT_DEAD_LETTER_MISSING',
        message: 'Der ursprüngliche Dead-Letter-Eintrag ist nicht verfügbar.',
      });
    }

    const parsed = originalJobSchema.safeParse(deadLetter.data.originalData);
    if (!parsed.success || parsed.data.providerKey !== source.provider.key) {
      throw new ConflictException({
        code: 'IMPORT_DEAD_LETTER_INVALID',
        message: 'Der ursprüngliche Importauftrag ist ungültig.',
      });
    }

    const original = parsed.data;
    const payload: NewsImportJobPayload = {
      providerKey: source.provider.key,
      ...(source.windowStart
        ? { windowStart: source.windowStart.toISOString() }
        : original.windowStart
          ? { windowStart: original.windowStart }
          : {}),
      ...(source.windowEnd
        ? { windowEnd: source.windowEnd.toISOString() }
        : original.windowEnd
          ? { windowEnd: original.windowEnd }
          : {}),
      ...(original.lookbackMinutes !== undefined
        ? { lookbackMinutes: original.lookbackMinutes }
        : {}),
      retryOfImportJobId: source.id,
    };

    try {
      await this.importQueue.add('fetch-provider', payload, {
        ...DEFAULT_JOB_OPTIONS,
        jobId: replayId,
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'IMPORT_REPLAY_ENQUEUE_FAILED',
        message: 'Der Import konnte nicht erneut eingereiht werden.',
      });
    }

    await this.database.auditLog.create({
      data: {
        actorType: 'USER',
        actorUserId,
        action: 'ADMIN_CORRECTION',
        category: 'EDITORIAL',
        targetType: 'SYSTEM',
        targetId: source.id,
        reason: 'MANUAL_NEWS_IMPORT_REPLAY',
        metadata: {
          sourceImportJobId: source.id,
          replayQueueJobId: replayId,
          providerKey: source.provider.key,
        },
      },
    });

    return {
      sourceImportJobId: importJobId,
      queueJobId: replayId,
      alreadyQueued: false,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
