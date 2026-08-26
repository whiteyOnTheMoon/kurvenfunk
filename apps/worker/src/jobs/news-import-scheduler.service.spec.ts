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
  });

  it('removes an existing scheduler when disabled', async () => {
    removeJobScheduler.mockResolvedValue(true);

    const configService = {
      get: jest.fn((key: string, defaultValue: unknown) => {
        if (key === 'NEWS_IMPORT_SCHEDULER_ENABLED') {
          return false;
        }

        return defaultValue;
      }),
    } as unknown as ConfigService;

    const service = new NewsImportSchedulerService(queue, configService);

    await service.onModuleInit();

    expect(removeJobScheduler).toHaveBeenCalledTimes(1);
    expect(removeJobScheduler).toHaveBeenCalledWith('news-import-fake');
    expect(upsertJobScheduler).not.toHaveBeenCalled();
  });

  it('registers the fake provider scheduler when enabled', async () => {
    upsertJobScheduler.mockResolvedValue({
      id: 'scheduler-job-id',
    });

    const configService = {
      get: jest.fn((key: string, defaultValue: unknown) => {
        if (key === 'NEWS_IMPORT_SCHEDULER_ENABLED') {
          return true;
        }

        if (key === 'NEWS_IMPORT_SCHEDULER_INTERVAL_MS') {
          return 60_000;
        }

        return defaultValue;
      }),
    } as unknown as ConfigService;

    const service = new NewsImportSchedulerService(queue, configService);

    await service.onModuleInit();

    expect(removeJobScheduler).not.toHaveBeenCalled();
    expect(upsertJobScheduler).toHaveBeenCalledTimes(1);
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
      },
    );
  });

  it('uses the default interval when none is configured', async () => {
    upsertJobScheduler.mockResolvedValue({
      id: 'scheduler-job-id',
    });

    const configService = {
      get: jest.fn((key: string, defaultValue: unknown) => {
        if (key === 'NEWS_IMPORT_SCHEDULER_ENABLED') {
          return true;
        }

        return defaultValue;
      }),
    } as unknown as ConfigService;

    const service = new NewsImportSchedulerService(queue, configService);

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
      },
    );
  });
});
