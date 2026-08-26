import { createLogger } from '@kurvenfunk/logger';
import { QUEUE_NAMES, type NewsImportDeadLetterPayload } from '@kurvenfunk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import type { NewsImportJobPayload } from '../processors/news-import.processor';

const logger = createLogger({
  service: 'worker',
});

@Injectable()
export class NewsImportDeadLetterService {
  constructor(
    @InjectQueue(QUEUE_NAMES.NEWS_IMPORT_DEAD_LETTER)
    private readonly deadLetterQueue: Queue<NewsImportDeadLetterPayload>,
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
      originalData: {
        providerKey: job.data.providerKey,
      },
      failedReason: error.message,
      attemptsMade: job.attemptsMade,
      maxAttempts,
      failedAt: new Date().toISOString(),
    };

    const deadLetterJob = await this.deadLetterQueue.add('dead-letter', payload, {
      removeOnComplete: false,
      removeOnFail: false,
    });

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
