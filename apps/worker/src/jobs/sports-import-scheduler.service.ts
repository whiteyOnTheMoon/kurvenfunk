import { createLogger } from '@kurvenfunk/logger';
import {
  FAKE_SPORTS_SCOPE,
  QUEUE_NAMES,
  SPORTS_IMPORT_JOB_NAME,
  SPORTS_IMPORT_RETRY_OPTIONS,
  type SportsImportJobPayload,
} from '@kurvenfunk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';

const logger = createLogger({ service: 'worker' });

type ScheduledResource = 'fixtures' | 'results' | 'live';

const SCHEDULER_IDS: Record<ScheduledResource, string> = {
  fixtures: 'sports-import-fake-fixtures-v1',
  results: 'sports-import-fake-results-v1',
  live: 'sports-import-fake-live-v1',
};

const INTERVALS: Record<
  ScheduledResource,
  { configKey: string; defaultMs: number; minimumMs: number }
> = {
  fixtures: {
    configKey: 'SPORTS_IMPORT_FIXTURES_INTERVAL_MS',
    defaultMs: 43_200_000,
    minimumMs: 60_000,
  },
  results: {
    configKey: 'SPORTS_IMPORT_RESULTS_INTERVAL_MS',
    defaultMs: 900_000,
    minimumMs: 60_000,
  },
  live: {
    configKey: 'SPORTS_IMPORT_LIVE_INTERVAL_MS',
    defaultMs: 60_000,
    minimumMs: 60_000,
  },
};

const MAX_INTERVAL_MS = 604_800_000;

/**
 * Phase 21.204: explicit DEV/test-only BullMQ job schedulers. Stable scheduler
 * IDs let multiple worker bootstraps reconfigure schedules instead of creating
 * duplicates. Club import remains manual; real providers are not supported.
 */
@Injectable()
export class SportsImportSchedulerService implements OnModuleInit {
  constructor(
    @InjectQueue(QUEUE_NAMES.SPORTS_IMPORT)
    private readonly sportsImportQueue: Queue<SportsImportJobPayload>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.configService.get<boolean>('SPORTS_IMPORT_SCHEDULER_ENABLED', false);
    if (!enabled) {
      await this.removeAll();
      logger.info('Sports import scheduler disabled', {
        event: 'sports-import.scheduler.disabled',
        metadata: { queue: QUEUE_NAMES.SPORTS_IMPORT },
      });
      return;
    }

    const environment = this.configService.get<string>('NODE_ENV', 'production');
    const fakeEnabled = this.configService.get<boolean>('SPORTS_FAKE_PROVIDER_ENABLED', false);
    if (!fakeEnabled || (environment !== 'development' && environment !== 'test')) {
      // A previous DEV schedule must not survive a disabled or unsafe restart.
      await this.removeAll();
      throw new Error('SPORTS_SCHEDULER_REQUIRES_DEV_FAKE_PROVIDER');
    }

    const liveEnabled = this.configService.get<boolean>('SPORTS_IMPORT_LIVE_ENABLED', false);
    const resources: ScheduledResource[] = liveEnabled
      ? ['fixtures', 'results', 'live']
      : ['fixtures', 'results'];

    // Fail before registering ANY schedule when a config is invalid. The
    // environment validator also checks these bounds at application startup.
    const intervals = resources.map((resource) => ({
      resource,
      intervalMs: this.getInterval(resource),
    }));

    if (!liveEnabled) {
      await this.sportsImportQueue.removeJobScheduler(SCHEDULER_IDS.live);
    }

    for (const { resource, intervalMs } of intervals) {
      const data: SportsImportJobPayload = {
        providerKey: 'fake-sports',
        resource,
        ...FAKE_SPORTS_SCOPE,
      };
      const scheduled = await this.sportsImportQueue.upsertJobScheduler(
        SCHEDULER_IDS[resource],
        { every: intervalMs },
        {
          name: SPORTS_IMPORT_JOB_NAME,
          data,
          opts: SPORTS_IMPORT_RETRY_OPTIONS,
        },
      );
      logger.info('Sports import schedule registered', {
        event: 'sports-import.scheduler.registered',
        metadata: {
          queue: QUEUE_NAMES.SPORTS_IMPORT,
          schedulerId: SCHEDULER_IDS[resource],
          resource,
          intervalMs,
          jobId: scheduled?.id ?? null,
        },
      });
    }
  }

  private getInterval(resource: ScheduledResource): number {
    const setting = INTERVALS[resource];
    const value = this.configService.get<number>(setting.configKey, setting.defaultMs);
    if (
      !Number.isSafeInteger(value) ||
      value < setting.minimumMs ||
      value > MAX_INTERVAL_MS
    ) {
      throw new Error('SPORTS_SCHEDULER_INVALID_INTERVAL');
    }
    return value;
  }

  private async removeAll(): Promise<void> {
    await Promise.all(
      Object.values(SCHEDULER_IDS).map((id) => this.sportsImportQueue.removeJobScheduler(id)),
    );
  }
}
