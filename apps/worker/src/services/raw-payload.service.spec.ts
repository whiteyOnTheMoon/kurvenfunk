/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { DatabaseClient } from '@kurvenfunk/database';
import type { NewsProvider, NewsProviderRecord } from '@kurvenfunk/types';
import type { DatabaseService } from '../database/database.service';
import { RawPayloadService } from './raw-payload.service';

jest.mock('@kurvenfunk/database', () => ({
  Prisma: {},
  createPrismaClient: jest.fn(),
}));

describe('RawPayloadService', () => {
  const provider: NewsProvider = {
    key: 'fake',
    name: 'Kurvenfunk Fake News Provider',
    capabilities: {
      supportsCursorPagination: true,
      supportsTimeWindow: true,
    },
    fetch: jest.fn(),
  };

  const record: NewsProviderRecord = {
    externalId: 'fake-001',
    externalUrl: 'https://fake-provider.test/news/fake-001',
    payload: {
      title: 'Rapid gewinnt',
      id: 'fake-001',
      nested: {
        z: 2,
        a: 1,
      },
    },
  };

  function createService() {
    const providerUpsert = jest.fn();
    const providerUpdate = jest.fn();

    const importJobCreate = jest.fn();
    const importJobUpdate = jest.fn();

    const rawPayloadCreate = jest.fn();
    const importRecordCreate = jest.fn();
    const importRecordGroupBy = jest.fn();

    const transactionClient = {
      rawPayload: {
        create: rawPayloadCreate,
      },
      importRecord: {
        create: importRecordCreate,
      },
      importJob: {
        update: importJobUpdate,
      },
    };

    const transaction = jest.fn(async (input: unknown) => {
      if (typeof input === 'function') {
        return input(transactionClient);
      }

      return Promise.all(input as Promise<unknown>[]);
    });

    const database = {
      provider: {
        upsert: providerUpsert,
        update: providerUpdate,
      },
      importJob: {
        create: importJobCreate,
        update: importJobUpdate,
      },
      importRecord: {
        groupBy: importRecordGroupBy,
      },
      $transaction: transaction,
    } as unknown as DatabaseClient;

    const databaseService = {
      client: database,
    } as DatabaseService;

    return {
      service: new RawPayloadService(databaseService),
      providerUpsert,
      providerUpdate,
      importJobCreate,
      importJobUpdate,
      rawPayloadCreate,
      importRecordCreate,
      importRecordGroupBy,
      transaction,
    };
  }

  it('creates provider and running import job', async () => {
    const { service, providerUpsert, importJobCreate } = createService();

    providerUpsert.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
    });

    importJobCreate.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
    });

    const session = await service.startNewsImport(provider, {
      queueJobId: 'bull-job-123',
      windowStart: '2026-08-28T01:45:00.000Z',
      windowEnd: '2026-08-28T02:00:00.000Z',
    });

    expect(session).toEqual({
      providerId: '11111111-1111-4111-8111-111111111111',
      importJobId: '22222222-2222-4222-8222-222222222222',
    });

    expect(providerUpsert).toHaveBeenCalledTimes(1);
    expect(importJobCreate).toHaveBeenCalledTimes(1);

    expect(importJobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerId: '11111111-1111-4111-8111-111111111111',
          kind: 'NEWS_FETCH',
          status: 'RUNNING',
          trigger: 'SYSTEM',
          queueJobId: 'bull-job-123',
          windowStart: new Date('2026-08-28T01:45:00.000Z'),
          windowEnd: new Date('2026-08-28T02:00:00.000Z'),
        }),
      }),
    );
  });

  it('marks replayed jobs with their original import job and replay trigger', async () => {
    const { service, providerUpsert, importJobCreate } = createService();
    providerUpsert.mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111' });
    importJobCreate.mockResolvedValue({ id: '22222222-2222-4222-8222-222222222222' });

    await service.startNewsImport(provider, {
      queueJobId: 'manual-replay-01',
      retryOfImportJobId: '77777777-7777-4777-8777-777777777777',
      windowStart: '2026-11-05T08:00:00.000Z',
      windowEnd: '2026-11-05T08:15:00.000Z',
    });

    expect(importJobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          trigger: 'REPLAY',
          retryOfJobId: '77777777-7777-4777-8777-777777777777',
          queueJobId: 'manual-replay-01',
        }),
      }),
    );
  });

  it('stores raw payload and links an import record', async () => {
    const { service, rawPayloadCreate, importRecordCreate, importJobUpdate } = createService();

    rawPayloadCreate.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
    });

    importRecordCreate.mockResolvedValue({
      id: '44444444-4444-4444-8444-444444444444',
    });

    const storedRecord = await service.storeRecord(
      {
        providerId: '11111111-1111-4111-8111-111111111111',
        importJobId: '22222222-2222-4222-8222-222222222222',
      },
      record,
    );

    expect(rawPayloadCreate).toHaveBeenCalledTimes(1);

    const rawPayloadArguments = rawPayloadCreate.mock.calls[0]?.[0];

    expect(rawPayloadArguments.data).toEqual(
      expect.objectContaining({
        providerId: '11111111-1111-4111-8111-111111111111',
        importJobId: '22222222-2222-4222-8222-222222222222',
        type: 'RECORD',
        externalId: 'fake-001',
        payload: record.payload,
        payloadHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        sizeBytes: expect.any(BigInt),
      }),
    );

    expect(importRecordCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        rawPayloadId: '33333333-3333-4333-8333-333333333333',
        recordType: 'NEWS_ARTICLE',
        status: 'RECEIVED',
        externalId: 'fake-001',
        externalUrl: 'https://fake-provider.test/news/fake-001',
        contentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
      select: {
        id: true,
      },
    });

    expect(storedRecord).toEqual({
      rawPayloadId: '33333333-3333-4333-8333-333333333333',
      importRecordId: '44444444-4444-4444-8444-444444444444',
    });

    expect(importJobUpdate).toHaveBeenCalledWith({
      where: {
        id: '22222222-2222-4222-8222-222222222222',
      },
      data: {
        receivedCount: {
          increment: 1,
        },
      },
    });
  });

  it('produces the same hash for equivalent object key order', async () => {
    const { service, rawPayloadCreate, importRecordCreate } = createService();

    rawPayloadCreate
      .mockResolvedValueOnce({
        id: '33333333-3333-4333-8333-333333333333',
      })
      .mockResolvedValueOnce({
        id: '44444444-4444-4444-8444-444444444444',
      });

    importRecordCreate
      .mockResolvedValueOnce({
        id: '55555555-5555-4555-8555-555555555555',
      })
      .mockResolvedValueOnce({
        id: '66666666-6666-4666-8666-666666666666',
      });

    const first: NewsProviderRecord = {
      externalId: 'one',
      payload: {
        b: 2,
        a: 1,
      },
    };

    const second: NewsProviderRecord = {
      externalId: 'two',
      payload: {
        a: 1,
        b: 2,
      },
    };

    const session = {
      providerId: '11111111-1111-4111-8111-111111111111',
      importJobId: '22222222-2222-4222-8222-222222222222',
    };

    await service.storeRecord(session, first);
    await service.storeRecord(session, second);

    const firstHash = rawPayloadCreate.mock.calls[0]?.[0].data.payloadHash;
    const secondHash = rawPayloadCreate.mock.calls[1]?.[0].data.payloadHash;

    expect(firstHash).toBe(secondHash);
  });

  it('finalizes counters from the persisted import record states', async () => {
    const { service, importRecordGroupBy, importJobUpdate, providerUpdate } = createService();

    importRecordGroupBy.mockResolvedValue([
      {
        status: 'REVIEW_REQUIRED',
        _count: {
          _all: 12,
        },
      },
      {
        status: 'DUPLICATE',
        _count: {
          _all: 3,
        },
      },
      {
        status: 'CREATED',
        _count: {
          _all: 2,
        },
      },
      {
        status: 'UPDATED',
        _count: {
          _all: 1,
        },
      },
      {
        status: 'SKIPPED',
        _count: {
          _all: 1,
        },
      },
      {
        status: 'FAILED',
        _count: {
          _all: 1,
        },
      },
    ]);

    await service.completeNewsImport({
      providerId: '11111111-1111-4111-8111-111111111111',
      importJobId: '22222222-2222-4222-8222-222222222222',
    });

    expect(importRecordGroupBy).toHaveBeenCalledWith({
      by: ['status'],
      where: {
        importJobId: '22222222-2222-4222-8222-222222222222',
      },
      _count: {
        _all: true,
      },
    });

    expect(importJobUpdate).toHaveBeenCalledWith({
      where: {
        id: '22222222-2222-4222-8222-222222222222',
      },
      data: expect.objectContaining({
        status: 'SUCCEEDED',
        processedCount: 20,
        createdCount: 2,
        updatedCount: 1,
        duplicateCount: 3,
        failedCount: 1,
        finishedAt: expect.any(Date),
      }),
    });

    expect(providerUpdate).toHaveBeenCalledWith({
      where: {
        id: '11111111-1111-4111-8111-111111111111',
      },
      data: {
        lastImportAt: expect.any(Date),
      },
    });
  });

  it('marks the import job as failed', async () => {
    const { service, importJobUpdate } = createService();

    await service.failNewsImport(
      {
        providerId: '11111111-1111-4111-8111-111111111111',
        importJobId: '22222222-2222-4222-8222-222222222222',
      },
      new Error('Provider unavailable'),
    );

    expect(importJobUpdate).toHaveBeenCalledWith({
      where: {
        id: '22222222-2222-4222-8222-222222222222',
      },
      data: expect.objectContaining({
        status: 'FAILED',
        errorCode: 'NEWS_IMPORT_FAILED',
        errorMessage: 'Provider unavailable',
      }),
    });
  });
});
