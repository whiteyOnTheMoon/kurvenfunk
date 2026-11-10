/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { FAKE_SPORTS_SCOPE, FakeSportsProvider } from '@kurvenfunk/types';
import type { DatabaseClient } from '@kurvenfunk/database';
import type { DatabaseService } from '../database/database.service';
import { SportsImportStore } from './sports-import.store';

describe('SportsImportStore', () => {
  const provider = new FakeSportsProvider();
  const payload = {
    providerKey: 'fake-sports',
    resource: 'fixtures' as const,
    ...FAKE_SPORTS_SCOPE,
  };
  const record = {
    kind: 'match' as const,
    externalId: 'fake-match-001',
    homeClubExternalId: 'fake-club-nord',
    awayClubExternalId: 'fake-club-sued',
    kickoff: '2026-08-01T15:00:00Z',
    status: 'FINISHED' as const,
    homeScore: 2,
    awayScore: 1,
  };

  function setup() {
    let lastJob: { id: string; status: string } | null = null;
    let lastRecord: { id: string; contentHash: string } | null = null;
    const providerUpsert = jest.fn().mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      type: 'SPORTS',
      status: 'ACTIVE',
    });
    const providerUpdate = jest.fn().mockResolvedValue({});
    const jobCreate = jest.fn().mockImplementation(() => {
      lastJob = { id: '22222222-2222-4222-8222-222222222222', status: 'RUNNING' };
      return Promise.resolve({ id: lastJob.id });
    });
    const jobFind = jest.fn().mockImplementation(() => Promise.resolve(lastJob));
    const jobUpdate = jest.fn().mockImplementation((args: { data: { status?: string } }) => {
      if (args.data.status && lastJob) lastJob.status = args.data.status;
      return Promise.resolve({});
    });
    const jobUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const recordFind = jest.fn().mockImplementation(() => Promise.resolve(lastRecord));
    const recordCreate = jest
      .fn()
      .mockImplementation((args: { data: { contentHash: string } }) => {
        lastRecord = { id: 'record-1', contentHash: args.data.contentHash };
        return Promise.resolve(lastRecord);
      });
    const rawCreate = jest.fn().mockResolvedValue({ id: 'raw-1' });
    const executeRaw = jest.fn().mockResolvedValue(0);

    const tx = {
      $executeRaw: executeRaw,
      importJob: { findFirst: jobFind, create: jobCreate, update: jobUpdate },
      importRecord: { findFirst: recordFind, create: recordCreate },
      rawPayload: { create: rawCreate },
    };
    const client = {
      provider: { upsert: providerUpsert, update: providerUpdate },
      importJob: {
        update: jobUpdate,
        updateMany: jobUpdateMany,
      },
      $transaction: jest.fn((value: unknown) => {
        if (typeof value === 'function') {
          const handler = value as (transaction: typeof tx) => Promise<unknown>;
          return handler(tx);
        }
        return Promise.all(value as Promise<unknown>[]);
      }),
    } as unknown as DatabaseClient;
    const store = new SportsImportStore({ client } as DatabaseService);
    return {
      store,
      providerUpsert,
      providerUpdate,
      jobCreate,
      jobFind,
      jobUpdate,
      jobUpdateMany,
      recordFind,
      recordCreate,
      rawCreate,
      executeRaw,
    };
  }

  it('creates a SPORTS provider and a running import record without modifying canonical data', async () => {
    const mock = setup();
    const session = await mock.store.start(provider, payload, 'queue-abc');
    expect(session).toEqual({
      providerId: '11111111-1111-4111-8111-111111111111',
      importJobId: '22222222-2222-4222-8222-222222222222',
      alreadyCompleted: false,
    });
    expect(mock.providerUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ type: 'SPORTS' }) }),
    );
    expect(mock.jobCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind: 'SPORTS_FIXTURES',
        status: 'RUNNING',
        queueJobId: 'queue-abc',
      }),
      select: { id: true },
    });
    expect(mock.executeRaw).toHaveBeenCalledTimes(1);
  });

  it('reuses the same queued attempt and treats already succeeded retries as no-op', async () => {
    const mock = setup();
    await mock.store.start(provider, payload, 'queue-abc');
    await mock.store.start(provider, payload, 'queue-abc');
    expect(mock.jobCreate).toHaveBeenCalledTimes(1);
    expect(mock.jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'RUNNING' }) }),
    );

    const session = await mock.store.start(provider, payload, 'queue-abc');
    await mock.store.complete(session);
    const next = await mock.store.start(provider, payload, 'queue-abc');
    expect(next.alreadyCompleted).toBe(true);
    expect(mock.jobCreate).toHaveBeenCalledTimes(1);
  });

  it('stores a raw payload and immutable review-required normalized record once', async () => {
    const mock = setup();
    const session = await mock.store.start(provider, payload, 'queue-abc');
    await expect(mock.store.store(session, 'fixtures', record)).resolves.toBe(true);
    await expect(mock.store.store(session, 'fixtures', record)).resolves.toBe(false);
    expect(mock.rawCreate).toHaveBeenCalledTimes(1);
    expect(mock.recordCreate).toHaveBeenCalledTimes(1);
    expect(mock.rawCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'RECORD',
        externalId: record.externalId,
        payload: record,
        sizeBytes: expect.any(BigInt),
        payloadHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
      select: { id: true },
    });
    expect(mock.recordCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'REVIEW_REQUIRED',
        recordType: 'SPORTS_MATCH',
        normalizedPayload: record,
      }),
    });
  });

  it('stops if a provider changes an already staged record during a retry', async () => {
    const mock = setup();
    const session = await mock.store.start(provider, payload, 'queue-abc');
    await mock.store.store(session, 'fixtures', record);
    await expect(
      mock.store.store(session, 'fixtures', { ...record, homeScore: 3 }),
    ).rejects.toThrow('SPORTS_IMPORT_RECORD_CHANGED_DURING_RETRY');
    expect(mock.rawCreate).toHaveBeenCalledTimes(1);
  });

  it('safely checkpoints, completes and records failure without leaking raw errors', async () => {
    const mock = setup();
    const session = await mock.store.start(provider, payload, 'queue-abc');
    await mock.store.checkpoint(session, 'next-cursor');
    expect(mock.jobUpdate).toHaveBeenCalledWith({
      where: { id: session.importJobId },
      data: { cursor: 'next-cursor' },
    });
    await mock.store.fail(session, new Error('provider credential=secret'));
    expect(mock.jobUpdate).toHaveBeenCalledWith({
      where: { id: session.importJobId },
      data: expect.objectContaining({
        status: 'FAILED',
        errorCode: 'SPORTS_IMPORT_FAILED',
        errorMessage: null,
      }),
    });
    await mock.store.deadLetter('queue-abc');
    expect(mock.jobUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'DEAD_LETTER' } }),
    );
  });

  it('refuses a disabled or conflicting provider rather than enabling it', async () => {
    const mock = setup();
    mock.providerUpsert.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      type: 'NEWS',
      status: 'DISABLED',
    });
    await expect(mock.store.start(provider, payload, 'queue-abc')).rejects.toThrow(
      'SPORTS_IMPORT_PROVIDER_NOT_ACTIVE',
    );
    expect(mock.jobCreate).not.toHaveBeenCalled();
  });
});
