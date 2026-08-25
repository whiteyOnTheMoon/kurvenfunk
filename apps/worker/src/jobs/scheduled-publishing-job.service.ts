import { createLogger } from '@kurvenfunk/logger';
import { QUEUE_NAMES } from '@kurvenfunk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bullmq';

const logger = createLogger({
  service: 'worker',
});

const SCHEDULER_ID = 'scheduled-publishing-scan';
const SCHEDULE_INTERVAL_MS = 30_000;

@Injectable()
export class ScheduledPublishingJobService implements OnModuleInit {
  constructor(
    @InjectQueue(QUEUE_NAMES.SCHEDULED_PUBLISHING)
    private readonly scheduledPublishingQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    const job = await this.scheduledPublishingQueue.upsertJobScheduler(
      SCHEDULER_ID,
      {
        every: SCHEDULE_INTERVAL_MS,
      },
      {
        name: 'publish-due-articles',
        data: {},
      },
    );

    logger.info('Scheduled publishing scheduler registered', {
      event: 'scheduled-publishing.scheduler.registered',
      metadata: {
        queue: QUEUE_NAMES.SCHEDULED_PUBLISHING,
        schedulerId: SCHEDULER_ID,
        jobId: job?.id ?? null,
        intervalMs: SCHEDULE_INTERVAL_MS,
      },
    });
  }
}
