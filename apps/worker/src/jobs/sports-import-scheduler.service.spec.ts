/* eslint-disable @typescript-eslint/no-unsafe-assignment */
jest.mock('@kurvenfunk/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

import {
  FAKE_SPORTS_SCOPE,
  SPORTS_IMPORT_JOB_NAME,
  SPORTS_IMPORT_RETRY_OPTIONS,
  type SportsImportJobPayload,
} from '@kurvenfunk/types';
import type { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { SportsImportSchedulerService } from './sports-import-scheduler.service';

describe('SportsImportSchedulerService', () => {
  const removeJobScheduler = jest.fn();
  const upsertJobScheduler = jest.fn();
  const queue = {
    removeJobScheduler,
    upsertJobScheduler,
  } as unknown as Queue<SportsImportJobPayload>;

  function config(values: Record<string, unknown>): ConfigService {
    return {
      get: jest.fn((key: string, fallback: unknown) =>
        key in values ? values[key] : fallback,
      ),
    } as unknown as ConfigService;
  }

  function service(values: Record<string, unknown>): SportsImportSchedulerService {
    return new SportsImportSchedulerService(queue, config(values));
  }

  const devEnabled = {
    NODE_ENV: 'development',
    SPORTS_FAKE_PROVIDER_ENABLED: true,
    SPORTS_IMPORT_SCHEDULER_ENABLED: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    removeJobScheduler.mockResolvedValue(false);
    upsertJobScheduler.mockResolvedValue({ id: 'synthetic-job' });
  });

  it('removes all known repeat schedules by default and never queues a job', async () => {
    await service({}).onModuleInit();
    expect(removeJobScheduler).toHaveBeenCalledTimes(3);
    for (const name of ['fixtures', 'results', 'live']) {
      expect(removeJobScheduler).toHaveBeenCalledWith(`sports-import-fake-${name}-v1`);
    }
    expect(upsertJobScheduler).not.toHaveBeenCalled();
  });

  it('registers independent fixture and result intervals without enabling live', async () => {
    await service({
      ...devEnabled,
      SPORTS_IMPORT_FIXTURES_INTERVAL_MS: 21_600_000,
      SPORTS_IMPORT_RESULTS_INTERVAL_MS: 300_000,
    }).onModuleInit();

    expect(removeJobScheduler).toHaveBeenCalledTimes(1);
    expect(removeJobScheduler).toHaveBeenCalledWith('sports-import-fake-live-v1');
    expect(upsertJobScheduler).toHaveBeenCalledTimes(2);
    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      1,
      'sports-import-fake-fixtures-v1',
      { every: 21_600_000 },
      {
        name: SPORTS_IMPORT_JOB_NAME,
        data: { providerKey: 'fake-sports', resource: 'fixtures', ...FAKE_SPORTS_SCOPE },
        opts: SPORTS_IMPORT_RETRY_OPTIONS,
      },
    );
    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      2,
      'sports-import-fake-results-v1',
      { every: 300_000 },
      {
        name: SPORTS_IMPORT_JOB_NAME,
        data: { providerKey: 'fake-sports', resource: 'results', ...FAKE_SPORTS_SCOPE },
        opts: SPORTS_IMPORT_RETRY_OPTIONS,
      },
    );
  });

  it('uses safe 12h/15min defaults and leaves club imports unscheduled', async () => {
    await service(devEnabled).onModuleInit();
    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      1,
      'sports-import-fake-fixtures-v1',
      { every: 43_200_000 },
      expect.any(Object),
    );
    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      2,
      'sports-import-fake-results-v1',
      { every: 900_000 },
      expect.any(Object),
    );
    const templates = upsertJobScheduler.mock.calls.map((args: unknown[]) => args[2]);
    expect(JSON.stringify(templates)).not.toContain('"resource":"clubs"');
  });

  it('enables a separate fast live cadence only with an explicit live flag', async () => {
    await service({
      ...devEnabled,
      SPORTS_IMPORT_LIVE_ENABLED: true,
      SPORTS_IMPORT_LIVE_INTERVAL_MS: 120_000,
    }).onModuleInit();

    expect(removeJobScheduler).not.toHaveBeenCalled();
    expect(upsertJobScheduler).toHaveBeenCalledTimes(3);
    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      3,
      'sports-import-fake-live-v1',
      { every: 120_000 },
      {
        name: SPORTS_IMPORT_JOB_NAME,
        data: { providerKey: 'fake-sports', resource: 'live', ...FAKE_SPORTS_SCOPE },
        opts: SPORTS_IMPORT_RETRY_OPTIONS,
      },
    );
  });

  it('reuses the same scheduler identities after repeated worker startup', async () => {
    const scheduler = service({ ...devEnabled, SPORTS_IMPORT_LIVE_ENABLED: true });
    await scheduler.onModuleInit();
    await scheduler.onModuleInit();
    expect(upsertJobScheduler.mock.calls.map((args: unknown[]) => args[0])).toEqual([
      'sports-import-fake-fixtures-v1',
      'sports-import-fake-results-v1',
      'sports-import-fake-live-v1',
      'sports-import-fake-fixtures-v1',
      'sports-import-fake-results-v1',
      'sports-import-fake-live-v1',
    ]);
  });

  it('removes all old schedulers if fake provider is not explicitly opted in', async () => {
    await expect(
      service({ NODE_ENV: 'development', SPORTS_IMPORT_SCHEDULER_ENABLED: true }).onModuleInit(),
    ).rejects.toThrow('SPORTS_SCHEDULER_REQUIRES_DEV_FAKE_PROVIDER');
    expect(removeJobScheduler).toHaveBeenCalledTimes(3);
    expect(upsertJobScheduler).not.toHaveBeenCalled();
  });

  it('fails closed and clears schedules when enabled in production', async () => {
    await expect(
      service({ ...devEnabled, NODE_ENV: 'production' }).onModuleInit(),
    ).rejects.toThrow('SPORTS_SCHEDULER_REQUIRES_DEV_FAKE_PROVIDER');
    expect(removeJobScheduler).toHaveBeenCalledTimes(3);
    expect(upsertJobScheduler).not.toHaveBeenCalled();
  });

  it('does not enqueue live data if the global scheduler is disabled', async () => {
    await service({ ...devEnabled, SPORTS_IMPORT_SCHEDULER_ENABLED: false, SPORTS_IMPORT_LIVE_ENABLED: true }).onModuleInit();
    expect(removeJobScheduler).toHaveBeenCalledTimes(3);
    expect(upsertJobScheduler).not.toHaveBeenCalled();
  });

  it('rejects invalid cadence before registering any schedule and removes stale schedules', async () => {
    await expect(
      service({ ...devEnabled, SPORTS_IMPORT_RESULTS_INTERVAL_MS: 1_000 }).onModuleInit(),
    ).rejects.toThrow('SPORTS_SCHEDULER_INVALID_INTERVAL');
    expect(removeJobScheduler).toHaveBeenCalledTimes(3);
    expect(upsertJobScheduler).not.toHaveBeenCalled();

    jest.clearAllMocks();
    removeJobScheduler.mockResolvedValue(false);
    await expect(
      service({ ...devEnabled, SPORTS_IMPORT_LIVE_ENABLED: true, SPORTS_IMPORT_LIVE_INTERVAL_MS: 604_800_001 }).onModuleInit(),
    ).rejects.toThrow('SPORTS_SCHEDULER_INVALID_INTERVAL');
    expect(removeJobScheduler).toHaveBeenCalledTimes(3);
    expect(upsertJobScheduler).not.toHaveBeenCalled();
  });

  it('cleans up partial schedule registration when Redis rejects an upsert', async () => {
    upsertJobScheduler
      .mockResolvedValueOnce({ id: 'first' })
      .mockRejectedValueOnce(new Error('REDIS_UNAVAILABLE'));
    await expect(service(devEnabled).onModuleInit()).rejects.toThrow('REDIS_UNAVAILABLE');
    // One pre-removal of disabled live and three rollback removals.
    expect(removeJobScheduler).toHaveBeenCalledTimes(4);
    expect(removeJobScheduler).toHaveBeenCalledWith('sports-import-fake-fixtures-v1');
    expect(removeJobScheduler).toHaveBeenCalledWith('sports-import-fake-results-v1');
    expect(removeJobScheduler).toHaveBeenCalledWith('sports-import-fake-live-v1');
  });
});
