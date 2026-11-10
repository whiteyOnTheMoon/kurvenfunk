/* eslint-disable @typescript-eslint/no-unsafe-assignment */
jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
  Prisma: {},
}));

import {
  FAKE_SPORTS_SCOPE,
  QUEUE_NAMES,
  SPORTS_IMPORT_JOB_NAME,
  type SportsImportDeadLetterPayload,
} from '@kurvenfunk/types';
import type { ConfigService } from '@nestjs/config';
import type { Job, Queue } from 'bullmq';
import type { SportsImportStore } from '../services/sports-import.store';
import type { SportsClubMatchingService } from '../services/sports-club-matching.service';
import { SportsImportProcessor } from './sports-import.processor';

jest.mock('@kurvenfunk/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe('SportsImportProcessor', () => {
  const start = jest.fn();
  const storeRecord = jest.fn();
  const checkpoint = jest.fn();
  const complete = jest.fn();
  const fail = jest.fn();
  const deadLetter = jest.fn();
  const matchStaged = jest.fn();
  const add = jest.fn();
  const session = {
    importJobId: '22222222-2222-4222-8222-222222222222',
    providerId: '11111111-1111-4111-8111-111111111111',
    alreadyCompleted: false,
  };

  const payload = {
    providerKey: 'fake-sports',
    resource: 'fixtures' as const,
    ...FAKE_SPORTS_SCOPE,
  };

  const devConfig = {
    get: (key: string, fallback: unknown) =>
      key === 'SPORTS_FAKE_PROVIDER_ENABLED' ? true : key === 'NODE_ENV' ? 'development' : fallback,
  } as unknown as ConfigService;

  const store = {
    start,
    store: storeRecord,
    checkpoint,
    complete,
    fail,
    deadLetter,
  } as unknown as SportsImportStore;

  function processor(config = devConfig): SportsImportProcessor {
    return new SportsImportProcessor(
      store,
      config,
      { add } as unknown as Queue<SportsImportDeadLetterPayload>,
      { matchStaged } as unknown as SportsClubMatchingService,
    );
  }

  function job(data: unknown = payload, attemptsMade = 1): Job<unknown> {
    return {
      id: 'fake-job-123',
      name: SPORTS_IMPORT_JOB_NAME,
      data,
      attemptsMade,
      opts: { attempts: 3 },
    } as Job<unknown>;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    start.mockResolvedValue(session);
    storeRecord.mockResolvedValue(true);
    checkpoint.mockResolvedValue(undefined);
    complete.mockResolvedValue(undefined);
    fail.mockResolvedValue(undefined);
    deadLetter.mockResolvedValue(undefined);
    matchStaged.mockResolvedValue({ status: 'REVIEW_REQUIRED', reason: 'UNMATCHED' });
    add.mockResolvedValue({ id: 'dead-letter-id' });
  });

  it('stages the complete paginated fake fixture feed and never mutates canonical data', async () => {
    await processor().process(job());
    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'fake-sports' }),
      payload,
      'fake-job-123',
    );
    expect(storeRecord).toHaveBeenCalledTimes(8);
    expect(matchStaged).not.toHaveBeenCalled();
    const ids = storeRecord.mock.calls.map(
      (args: unknown[]) => (args[2] as { externalId: string }).externalId,
    );
    expect(new Set(ids).size).toBe(8);
    expect(checkpoint).toHaveBeenCalledTimes(4);
    expect(complete).toHaveBeenCalledWith(session);
    expect(fail).not.toHaveBeenCalled();
  });

  it('stages distinct club, result and live resources', async () => {
    for (const [resource, size] of [
      ['clubs', 4],
      ['results', 3],
      ['live', 1],
    ] as const) {
      jest.clearAllMocks();
      start.mockResolvedValue(session);
      storeRecord.mockResolvedValue(true);
      await processor().process(job({ ...payload, resource }));
      expect(storeRecord).toHaveBeenCalledTimes(size);
      expect(matchStaged).toHaveBeenCalledTimes(resource === 'clubs' ? size : 0);
      expect(complete).toHaveBeenCalledTimes(1);
    }
  });

  it('skips an already completed BullMQ job without fetching duplicate records', async () => {
    start.mockResolvedValue({ ...session, alreadyCompleted: true });
    await processor().process(job());
    expect(storeRecord).not.toHaveBeenCalled();
    expect(matchStaged).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });

  it('fails closed for disabled fake imports and untrusted payloads', async () => {
    const disabledConfig = {
      get: (key: string, fallback: unknown) =>
        key === 'SPORTS_FAKE_PROVIDER_ENABLED' ? false : fallback,
    } as unknown as ConfigService;
    await expect(processor(disabledConfig).process(job())).rejects.toThrow(
      'SPORTS_IMPORT_DISABLED',
    );
    await expect(
      processor().process(job({ ...payload, providerKey: 'real-vendor' })),
    ).rejects.toThrow('SPORTS_IMPORT_INVALID_PAYLOAD');
    await expect(processor().process(job({ ...payload, unexpected: 'secret' }))).rejects.toThrow(
      'SPORTS_IMPORT_INVALID_PAYLOAD',
    );
    expect(start).not.toHaveBeenCalled();
  });

  it('records a failed stage before allowing BullMQ to retry', async () => {
    storeRecord.mockRejectedValueOnce(new Error('DATABASE_TEMPORARILY_UNAVAILABLE'));
    await expect(processor().process(job())).rejects.toThrow('DATABASE_TEMPORARILY_UNAVAILABLE');
    expect(start).toHaveBeenCalledTimes(1);
    expect(fail).toHaveBeenCalledWith(session, expect.any(Error));
    expect(complete).not.toHaveBeenCalled();
  });

  it('only enqueues dead letter after all configured attempts and marks history', async () => {
    const handler = processor();
    await handler.onFailed(job(undefined, 1), new Error('transient'));
    expect(add).not.toHaveBeenCalled();

    await handler.onFailed(job(payload, 3), new Error('FAKE_SPORTS_TRANSIENT_FAILURE'));
    expect(add).toHaveBeenCalledWith(
      'sports-import-failed',
      expect.objectContaining({
        originalQueue: QUEUE_NAMES.SPORTS_IMPORT,
        originalJobId: 'fake-job-123',
        originalJobName: SPORTS_IMPORT_JOB_NAME,
        originalData: payload,
        errorCode: 'FAKE_SPORTS_TRANSIENT_FAILURE',
        attemptsMade: 3,
      }),
      expect.objectContaining({ jobId: expect.stringMatching(/^sportsdlq_[a-f0-9]{32}$/) }),
    );
    expect(deadLetter).toHaveBeenCalledWith('fake-job-123');
  });

  it('does not expose arbitrary error details in dead-letter payloads', async () => {
    await processor().onFailed(job(payload, 3), new Error('provider key: secret-token'));
    expect(add).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ errorCode: 'SPORTS_IMPORT_FAILED' }),
      expect.any(Object),
    );
  });
});
