import { createLogger } from '@kurvenfunk/logger';
import { QUEUE_NAMES } from '@kurvenfunk/types';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { ScheduledPublishingService } from '../services/scheduled-publishing.service';

const logger = createLogger({
  service: 'worker',
});

@Processor(QUEUE_NAMES.SCHEDULED_PUBLISHING)
export class ScheduledPublishingProcessor extends WorkerHost {
  constructor(private readonly scheduledPublishingService: ScheduledPublishingService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const startedAt = process.hrtime.bigint();

    logger.info('Scheduled publishing scan started', {
      event: 'queue.job.started',
      metadata: {
        queue: QUEUE_NAMES.SCHEDULED_PUBLISHING,
        jobId: job.id,
        jobName: job.name,
      },
    });

    try {
      const publishedCount = await this.scheduledPublishingService.publishDueArticles();

      const durationNs = process.hrtime.bigint() - startedAt;
      const durationMs = Number(durationNs) / 1_000_000;

      logger.info('Scheduled publishing scan completed', {
        event: 'queue.job.completed',
        metadata: {
          queue: QUEUE_NAMES.SCHEDULED_PUBLISHING,
          jobId: job.id,
          jobName: job.name,
          publishedCount,
          durationMs: Number(durationMs.toFixed(2)),
        },
      });
    } catch (error: unknown) {
      const durationNs = process.hrtime.bigint() - startedAt;
      const durationMs = Number(durationNs) / 1_000_000;

      logger.error('Scheduled publishing scan failed', {
        event: 'queue.job.failed',
        metadata: {
          queue: QUEUE_NAMES.SCHEDULED_PUBLISHING,
          jobId: job.id,
          jobName: job.name,
          durationMs: Number(durationMs.toFixed(2)),
          error,
        },
      });

      throw error;
    }
  }
}
