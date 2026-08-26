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

import type { NewsImportDeadLetterPayload } from '@kurvenfunk/types';
import type { Job, Queue } from 'bullmq';
import type { NewsImportJobPayload } from '../processors/news-import.processor';
import { NewsImportDeadLetterService } from './news-import-dead-letter.service';

describe('NewsImportDeadLetterService', () => {
  const add = jest.fn();

  const queue = {
    add,
  } as unknown as Queue<NewsImportDeadLetterPayload>;

  let service: NewsImportDeadLetterService;

  beforeEach(() => {
    jest.clearAllMocks();

    add.mockResolvedValue({
      id: 'dead-letter-job-1',
    });

    service = new NewsImportDeadLetterService(queue);
  });

  function createJob(attemptsMade: number, attempts = 3): Job<NewsImportJobPayload> {
    return {
      id: 'news-import-job-1',
      name: 'fetch-provider',
      data: {
        providerKey: 'fake',
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
    expect(add).toHaveBeenCalledTimes(1);

    const [, payload, options] = add.mock.calls[0] as [
      string,
      NewsImportDeadLetterPayload,
      {
        removeOnComplete: boolean;
        removeOnFail: boolean;
      },
    ];

    expect(payload).toMatchObject({
      originalQueue: 'news-import',
      originalJobId: 'news-import-job-1',
      originalJobName: 'fetch-provider',
      originalData: {
        providerKey: 'fake',
      },
      failedReason: 'Provider permanently unavailable',
      attemptsMade: 3,
      maxAttempts: 3,
    });
    expect(typeof payload.failedAt).toBe('string');
    expect(options).toEqual({
      removeOnComplete: false,
      removeOnFail: false,
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
        removeOnComplete: false,
        removeOnFail: false,
      },
    );
  });
});
