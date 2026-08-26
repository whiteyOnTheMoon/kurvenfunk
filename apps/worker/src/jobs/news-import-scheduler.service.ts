import { createLogger } from '@kurvenfunk/logger';
import { QUEUE_NAMES } from '@kurvenfunk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';

const logger = createLogger({
  service: 'worker',
});

const PROVIDER_KEY = 'fake';
const SCHEDULER_ID = `news-import-${PROVIDER_KEY}`;
const DEFAULT_INTERVAL_MS = 300_000;

@Injectable()
export class NewsImportSchedulerService implements OnModuleInit {
  constructor(
    @InjectQueue(QUEUE_NAMES.NEWS_IMPORT)
    private readonly newsImportQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.configService.get<boolean>('NEWS_IMPORT_SCHEDULER_ENABLED', false);

    if (!enabled) {
      const removed = await this.newsImportQueue.removeJobScheduler(SCHEDULER_ID);

      logger.info('News import scheduler disabled', {
        event: 'news-import.scheduler.disabled',
        metadata: {
          queue: QUEUE_NAMES.NEWS_IMPORT,
          schedulerId: SCHEDULER_ID,
          providerKey: PROVIDER_KEY,
          removed,
        },
      });

      return;
    }

    const intervalMs = this.configService.get<number>(
      'NEWS_IMPORT_SCHEDULER_INTERVAL_MS',
      DEFAULT_INTERVAL_MS,
    );

    const job = await this.newsImportQueue.upsertJobScheduler(
      SCHEDULER_ID,
      {
        every: intervalMs,
      },
      {
        name: 'fetch-provider',
        data: {
          providerKey: PROVIDER_KEY,
        },
      },
    );

    logger.info('News import scheduler registered', {
      event: 'news-import.scheduler.registered',
      metadata: {
        queue: QUEUE_NAMES.NEWS_IMPORT,
        schedulerId: SCHEDULER_ID,
        providerKey: PROVIDER_KEY,
        jobId: job?.id ?? null,
        intervalMs,
      },
    });
  }
}
