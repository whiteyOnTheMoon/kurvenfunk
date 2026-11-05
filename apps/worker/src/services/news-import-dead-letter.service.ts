import { createLogger } from '@kurvenfunk/logger';
import {
  QUEUE_NAMES,
  type NewsImportDeadLetterPayload,
  type NewsImportJobPayload,
} from '@kurvenfunk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { DatabaseService } from '../database/database.service';

const logger = createLogger({
  service: 'worker',
});

@Injectable()
export class NewsImportDeadLetterService {
  constructor(
    @InjectQueue(QUEUE_NAMES.NEWS_IMPORT_DEAD_LETTER)
    private readonly deadLetterQueue: Queue<NewsImportDeadLetterPayload>,
    private readonly databaseService: DatabaseService,
  ) {}

  async moveToDeadLetter(job: Job<NewsImportJobPayload>, error: Error): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 1;

    if (job.attemptsMade < maxAttempts) {
      return;
    }

    const payload: NewsImportDeadLetterPayload = {
      originalQueue: QUEUE_NAMES.NEWS_IMPORT,
      originalJobId: job.id !== undefined ? String(job.id) : null,
      originalJobName: job.name,
      originalData: { ...job.data },
      failedReason: error.message,
      attemptsMade: job.attemptsMade,
      maxAttempts,
      failedAt: new Date().toISOString(),
    };

    // A worker failure notification can be delivered more than once.
    // Reuse the original BullMQ ID to avoid duplicate dead-letter entries.
    const deadLetterJob = await this.deadLetterQueue.add('dead-letter', payload, {
      ...(job.id !== undefined ? { jobId: `news-import-dead-${String(job.id)}` } : {}),
      removeOnComplete: false,
      removeOnFail: false,
    });

    // Only report DEAD_LETTER after successfully storing the queue entry.
    // The original BullMQ job may have created a separate ImportJob per retry.
    // All failed attempts have reached a terminal state at this point.
    if (job.id !== undefined) {
      await this.databaseService.client.importJob.updateMany({
        where: {
          queueJobId: String(job.id),
          kind: 'NEWS_FETCH',
          status: 'FAILED',
        },
        data: { status: 'DEAD_LETTER' },
      });
    }

    logger.error('News import job moved to dead letter queue', {
      event: 'queue.job.dead_lettered',
      metadata: {
        queue: QUEUE_NAMES.NEWS_IMPORT,
        deadLetterQueue: QUEUE_NAMES.NEWS_IMPORT_DEAD_LETTER,
        jobId: job.id,
        deadLetterJobId: deadLetterJob.id,
        jobName: job.name,
        providerKey: job.data.providerKey,
        attemptsMade: job.attemptsMade,
        maxAttempts,
        failedReason: error.message,
      },
    });
  }
}
