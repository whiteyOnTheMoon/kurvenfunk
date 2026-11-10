import { FAKE_SPORTS_SCOPE, SPORTS_IMPORT_JOB_NAME, SPORTS_IMPORT_RETRY_OPTIONS } from '@kurvenfunk/types';
import type { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { SportsImportQueueService } from './sports-import-queue.service';

describe('SportsImportQueueService', () => {
  const add = jest.fn();
  const config = {
    get: jest.fn((key: string, fallback: unknown) =>
      key === 'SPORTS_FAKE_PROVIDER_ENABLED'
        ? true
        : key === 'NODE_ENV'
          ? 'development'
          : fallback,
    ),
  } as unknown as ConfigService;
  const service = new SportsImportQueueService({ add } as unknown as Queue, config);
  const input = {
    providerKey: 'fake-sports',
    resource: 'fixtures' as const,
    ...FAKE_SPORTS_SCOPE,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    add.mockResolvedValue({ id: 'generated-queue-id' });
  });

  it('enqueues explicitly with bounded retries and stable deduplication IDs', async () => {
    await expect(service.enqueue(input)).resolves.toBe('generated-queue-id');
    await service.enqueue({ ...input });
    const calls = add.mock.calls as Array<[string, unknown, { jobId: string }]>;
    expect(calls).toHaveLength(2);
    expect(calls[0]?.[0]).toBe(SPORTS_IMPORT_JOB_NAME);
    expect(calls[0]?.[1]).toEqual(input);
    expect(calls[0]?.[2]).toMatchObject({
      jobId: expect.stringMatching(/^sports_[0-9a-f]{64}$/),
      ...SPORTS_IMPORT_RETRY_OPTIONS,
    });
    expect(calls[1]?.[2].jobId).toBe(calls[0]?.[2].jobId);
  });

  it('rejects malformed jobs before writing to Redis', async () => {
    await expect(service.enqueue({ ...input, resource: 'nonsense' as 'fixtures' })).rejects.toThrow(
      'SPORTS_IMPORT_INVALID_PAYLOAD',
    );
    await expect(
      service.enqueue({ ...input, windowStart: '2026-02-31T00:00:00Z' }),
    ).rejects.toThrow('SPORTS_IMPORT_INVALID_PAYLOAD');
    expect(add).not.toHaveBeenCalled();
  });

  it('rejects production and non-opted-in executions', async () => {
    const get = jest.fn((_key: string, _fallback: unknown) => false);
    const disabled = new SportsImportQueueService(
      { add } as unknown as Queue,
      { get } as unknown as ConfigService,
    );
    await expect(disabled.enqueue(input)).rejects.toThrow('SPORTS_IMPORT_DISABLED');

    const production = new SportsImportQueueService(
      { add } as unknown as Queue,
      {
        get: (key: string, fallback: unknown) =>
          key === 'NODE_ENV' ? 'production' : key === 'SPORTS_FAKE_PROVIDER_ENABLED' ? true : fallback,
      } as unknown as ConfigService,
    );
    await expect(production.enqueue(input)).rejects.toThrow('SPORTS_IMPORT_DISABLED');
    expect(add).not.toHaveBeenCalled();
  });
});
