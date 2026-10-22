import { createLogger } from '@kurvenfunk/logger';
import { NEWS_IMPORT_RETRY_OPTIONS, QUEUE_NAMES } from '@kurvenfunk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';

const logger = createLogger({
  service: 'worker',
});

const SUPPORTED_PROVIDER_KEYS = ['fake', 'ots'] as const;
const DEFAULT_PROVIDER_KEY = 'fake';
const DEFAULT_INTERVAL_MS = 300_000;
const DEFAULT_OTS_LOOKBACK_MINUTES = 15;

type SupportedProviderKey = (typeof SUPPORTED_PROVIDER_KEYS)[number];

@Injectable()
export class NewsImportSchedulerService implements OnModuleInit {
  constructor(
    @InjectQueue(QUEUE_NAMES.NEWS_IMPORT)
    private readonly newsImportQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const providerKey = this.getProviderKey();

    const enabled = this.configService.get<boolean>('NEWS_IMPORT_SCHEDULER_ENABLED', false);

    if (!enabled) {
      const removed = await Promise.all(
        SUPPORTED_PROVIDER_KEYS.map(async (key) => ({
          providerKey: key,
          removed: await this.newsImportQueue.removeJobScheduler(this.schedulerId(key)),
        })),
      );

      logger.info('News import scheduler disabled', {
        event: 'news-import.scheduler.disabled',
        metadata: {
          queue: QUEUE_NAMES.NEWS_IMPORT,
          providerKey,
          removed,
        },
      });

      return;
    }

    await Promise.all(
      SUPPORTED_PROVIDER_KEYS.filter((key) => key !== providerKey).map((key) =>
        this.newsImportQueue.removeJobScheduler(this.schedulerId(key)),
      ),
    );

    const intervalMs = this.configService.get<number>(
      'NEWS_IMPORT_SCHEDULER_INTERVAL_MS',
      DEFAULT_INTERVAL_MS,
    );

    const schedulerId = this.schedulerId(providerKey);

    const data =
      providerKey === 'ots'
        ? {
            providerKey,
            lookbackMinutes: this.configService.get<number>(
              'NEWS_OTS_LOOKBACK_MINUTES',
              DEFAULT_OTS_LOOKBACK_MINUTES,
            ),
          }
        : {
            providerKey,
          };

    const job = await this.newsImportQueue.upsertJobScheduler(
      schedulerId,
      {
        every: intervalMs,
      },
      {
        name: 'fetch-provider',
        data,
        opts: NEWS_IMPORT_RETRY_OPTIONS,
      },
    );

    logger.info('News import scheduler registered', {
      event: 'news-import.scheduler.registered',
      metadata: {
        queue: QUEUE_NAMES.NEWS_IMPORT,
        schedulerId,
        providerKey,
        jobId: job?.id ?? null,
        intervalMs,
      },
    });
  }

  private getProviderKey(): SupportedProviderKey {
    const configured = this.configService.get<string>('NEWS_IMPORT_PROVIDER', DEFAULT_PROVIDER_KEY);

    if (!SUPPORTED_PROVIDER_KEYS.includes(configured as SupportedProviderKey)) {
      throw new Error(`Unsupported news import provider: ${configured}`);
    }

    return configured as SupportedProviderKey;
  }

  private schedulerId(providerKey: SupportedProviderKey): string {
    return `news-import-${providerKey}`;
  }
}
