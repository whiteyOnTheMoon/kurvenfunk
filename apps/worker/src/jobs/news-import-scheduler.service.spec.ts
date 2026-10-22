jest.mock('@kurvenfunk/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('@kurvenfunk/types', () => ({
  QUEUE_NAMES: {
    NEWS_IMPORT: 'news-import',
  },
  NEWS_IMPORT_RETRY_OPTIONS: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2_000,
    },
  },
}));

import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { NewsImportSchedulerService } from './news-import-scheduler.service';

describe('NewsImportSchedulerService', () => {
  const upsertJobScheduler = jest.fn();
  const removeJobScheduler = jest.fn();

  const queue = {
    upsertJobScheduler,
    removeJobScheduler,
  } as unknown as Queue;

  beforeEach(() => {
    jest.clearAllMocks();
    removeJobScheduler.mockResolvedValue(false);
  });

  function config(values: Record<string, unknown>): ConfigService {
    return {
      get: jest.fn((key: string, defaultValue: unknown) =>
        key in values ? values[key] : defaultValue,
      ),
    } as unknown as ConfigService;
  }

  it('removes all known provider schedulers when disabled', async () => {
    const service = new NewsImportSchedulerService(
      queue,
      config({
        NEWS_IMPORT_SCHEDULER_ENABLED: false,
      }),
    );

    await service.onModuleInit();

    expect(removeJobScheduler).toHaveBeenCalledTimes(2);
    expect(removeJobScheduler).toHaveBeenCalledWith('news-import-fake');
    expect(removeJobScheduler).toHaveBeenCalledWith('news-import-ots');

    expect(upsertJobScheduler).not.toHaveBeenCalled();
  });

  it('registers the fake provider by default', async () => {
    upsertJobScheduler.mockResolvedValue({
      id: 'scheduler-job-id',
    });

    const service = new NewsImportSchedulerService(
      queue,
      config({
        NEWS_IMPORT_SCHEDULER_ENABLED: true,
        NEWS_IMPORT_SCHEDULER_INTERVAL_MS: 60_000,
      }),
    );

    await service.onModuleInit();

    expect(removeJobScheduler).toHaveBeenCalledWith('news-import-ots');

    expect(upsertJobScheduler).toHaveBeenCalledWith(
      'news-import-fake',
      {
        every: 60_000,
      },
      {
        name: 'fetch-provider',
        data: {
          providerKey: 'fake',
        },
        opts: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2_000,
          },
        },
      },
    );
  });

  it('registers the OTS provider when configured', async () => {
    upsertJobScheduler.mockResolvedValue({
      id: 'scheduler-job-id',
    });

    const service = new NewsImportSchedulerService(
      queue,
      config({
        NEWS_IMPORT_PROVIDER: 'ots',
        NEWS_IMPORT_SCHEDULER_ENABLED: true,
        NEWS_IMPORT_SCHEDULER_INTERVAL_MS: 120_000,
        NEWS_OTS_LOOKBACK_MINUTES: 15,
      }),
    );

    await service.onModuleInit();

    expect(removeJobScheduler).toHaveBeenCalledWith('news-import-fake');

    expect(upsertJobScheduler).toHaveBeenCalledWith(
      'news-import-ots',
      {
        every: 120_000,
      },
      {
        name: 'fetch-provider',
        data: {
          providerKey: 'ots',
          lookbackMinutes: 15,
        },
        opts: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2_000,
          },
        },
      },
    );
  });

  it('uses the default interval when none is configured', async () => {
    upsertJobScheduler.mockResolvedValue({
      id: 'scheduler-job-id',
    });

    const service = new NewsImportSchedulerService(
      queue,
      config({
        NEWS_IMPORT_SCHEDULER_ENABLED: true,
      }),
    );

    await service.onModuleInit();

    expect(upsertJobScheduler).toHaveBeenCalledWith(
      'news-import-fake',
      {
        every: 300_000,
      },
      {
        name: 'fetch-provider',
        data: {
          providerKey: 'fake',
        },
        opts: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2_000,
          },
        },
      },
    );
  });

  it('rejects an unsupported provider', async () => {
    const service = new NewsImportSchedulerService(
      queue,
      config({
        NEWS_IMPORT_PROVIDER: 'unknown',
        NEWS_IMPORT_SCHEDULER_ENABLED: true,
      }),
    );

    await expect(service.onModuleInit()).rejects.toThrow(
      'Unsupported news import provider: unknown',
    );

    expect(upsertJobScheduler).not.toHaveBeenCalled();
  });
});
