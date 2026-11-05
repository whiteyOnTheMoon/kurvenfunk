import { createHash } from 'node:crypto';

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

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
    NEWS_IMPORT_DEAD_LETTER: 'news-import-dead-letter',
  },
}));

import type { NewsImportDeadLetterPayload, NewsImportJobPayload } from '@kurvenfunk/types';
import type { DatabaseService } from '../database/database.service';
import type { Job, Queue } from 'bullmq';
import { NewsImportDeadLetterService } from './news-import-dead-letter.service';

describe('NewsImportDeadLetterService', () => {
  const deadLetterId = (id: string) =>
    `news-import-dead-${createHash('sha256').update(id).digest('hex')}`;

  const add = jest.fn();
  const updateMany = jest.fn();

  const queue = {
    add,
  } as unknown as Queue<NewsImportDeadLetterPayload>;

  const databaseService = {
    client: { importJob: { updateMany } },
  } as unknown as DatabaseService;

  let service: NewsImportDeadLetterService;

  beforeEach(() => {
    jest.clearAllMocks();

    add.mockResolvedValue({
      id: 'dead-letter-job-1',
    });
    updateMany.mockResolvedValue({ count: 2 });

    service = new NewsImportDeadLetterService(queue, databaseService);
  });

  function createJob(attemptsMade: number, attempts = 3): Job<NewsImportJobPayload> {
    return {
      id: 'news-import-job-1',
      name: 'fetch-provider',
      data: {
        providerKey: 'ots',
        windowStart: '2026-08-28T01:45:00.000Z',
        windowEnd: '2026-08-28T02:00:00.000Z',
        lookbackMinutes: 15,
      },
      attemptsMade,
      opts: {
        attempts,
      },
    } as Job<NewsImportJobPayload>;
  }

  it('does not dead-letter a job while retries remain', async () => {
    await service.moveToDeadLetter(createJob(1), new Error('Provider temporarily unavailable'));

    expect(add).not.toHaveBeenCalled();
  });

  it('does not dead-letter the second failure when a third attempt remains', async () => {
    await service.moveToDeadLetter(createJob(2), new Error('Provider temporarily unavailable'));

    expect(add).not.toHaveBeenCalled();
  });

  it('moves a permanently failed job to the dead letter queue', async () => {
    await service.moveToDeadLetter(createJob(3), new Error('Provider permanently unavailable'));

    expect(add).toHaveBeenCalledTimes(1);

    const [, payload, options] = add.mock.calls[0] as [
      string,
      NewsImportDeadLetterPayload,
      {
        jobId: string;
        removeOnComplete: boolean;
        removeOnFail: boolean;
      },
    ];

    expect(payload).toMatchObject({
      originalQueue: 'news-import',
      originalJobId: 'news-import-job-1',
      originalJobName: 'fetch-provider',
      originalData: {
        providerKey: 'ots',
        windowStart: '2026-08-28T01:45:00.000Z',
        windowEnd: '2026-08-28T02:00:00.000Z',
        lookbackMinutes: 15,
      },
      failedReason: 'Provider permanently unavailable',
      attemptsMade: 3,
      maxAttempts: 3,
    });
    expect(typeof payload.failedAt).toBe('string');
    expect(options).toEqual({
      jobId: deadLetterId('news-import-job-1'),
      removeOnComplete: false,
      removeOnFail: false,
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        queueJobId: 'news-import-job-1',
        kind: 'NEWS_FETCH',
        status: 'FAILED',
      },
      data: { status: 'DEAD_LETTER' },
    });
  });

  it('dead-letters a job after its first failure when attempts are not configured', async () => {
    const job = {
      id: 'single-attempt-job',
      name: 'fetch-provider',
      data: {
        providerKey: 'fake',
      },
      attemptsMade: 1,
      opts: {},
    } as Job<NewsImportJobPayload>;

    await service.moveToDeadLetter(job, new Error('Permanent failure'));

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith(
      'dead-letter',
      expect.objectContaining({
        attemptsMade: 1,
        maxAttempts: 1,
      }),
      {
        jobId: deadLetterId('single-attempt-job'),
        removeOnComplete: false,
        removeOnFail: false,
      },
    );
  });

  it('uses a stable DLQ ID if the failed event is delivered twice', async () => {
    const job = createJob(3);
    await service.moveToDeadLetter(job, new Error('Failed'));
    await service.moveToDeadLetter(job, new Error('Failed'));

    expect(add).toHaveBeenCalledTimes(2);
    const firstCall = add.mock.calls[0] as unknown as [
      string,
      NewsImportDeadLetterPayload,
      { jobId: string },
    ];
    const secondCall = add.mock.calls[1] as unknown as [
      string,
      NewsImportDeadLetterPayload,
      { jobId: string },
    ];
    expect(firstCall[2]).toEqual(secondCall[2]);
    expect(updateMany).toHaveBeenCalledTimes(2);
  });

  it('does not mark failed attempts as dead-lettered if Redis enqueue fails', async () => {
    add.mockRejectedValueOnce(new Error('Redis unavailable'));

    await expect(
      service.moveToDeadLetter(createJob(3), new Error('Provider failure')),
    ).rejects.toThrow('Redis unavailable');
    expect(updateMany).not.toHaveBeenCalled();
  });
});
