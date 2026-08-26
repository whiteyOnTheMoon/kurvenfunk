jest.mock('@kurvenfunk/database', () => ({
  Prisma: {},
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
  },
}));

import type { NewsProviderRecord } from '@kurvenfunk/types';
import type { Job } from 'bullmq';
import { FakeNewsNormalizer } from '../providers/fake-news-normalizer';
import { FakeNewsProvider } from '../providers/fake-news-provider';
import type { NewsNormalizationService } from '../services/news-normalization.service';
import type { RawPayloadImportSession, RawPayloadService } from '../services/raw-payload.service';
import { NewsImportProcessor, type NewsImportJobPayload } from './news-import.processor';

describe('NewsImportProcessor', () => {
  let provider: FakeNewsProvider;
  let processor: NewsImportProcessor;

  const startNewsImport = jest.fn();
  const storeRecord = jest.fn();
  const normalizeRecord = jest.fn();
  const completeNewsImport = jest.fn();
  const failNewsImport = jest.fn();

  const importSession = {
    providerId: '11111111-1111-4111-8111-111111111111',
    importJobId: '22222222-2222-4222-8222-222222222222',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    provider = new FakeNewsProvider();
    const normalizer = new FakeNewsNormalizer();

    startNewsImport.mockResolvedValue(importSession);
    storeRecord.mockImplementation(
      (_session: RawPayloadImportSession, record: NewsProviderRecord) =>
        Promise.resolve({
          rawPayloadId: `raw-${record.externalId ?? 'unknown'}`,
          importRecordId: `import-${record.externalId ?? 'unknown'}`,
        }),
    );
    normalizeRecord.mockResolvedValue(undefined);
    completeNewsImport.mockResolvedValue(undefined);
    failNewsImport.mockResolvedValue(undefined);

    const rawPayloadService = {
      startNewsImport,
      storeRecord,
      completeNewsImport,
      failNewsImport,
    } as unknown as RawPayloadService;

    const newsNormalizationService = {
      normalizeRecord,
    } as unknown as NewsNormalizationService;

    processor = new NewsImportProcessor(
      provider,
      normalizer,
      rawPayloadService,
      newsNormalizationService,
    );
  });

  function createJob(
    data: NewsImportJobPayload = {
      providerKey: 'fake',
    },
    name = 'fetch-provider',
  ): Job<NewsImportJobPayload> {
    return {
      id: 'news-import-job-1',
      name,
      data,
    } as Job<NewsImportJobPayload>;
  }

  it('fetches all pages from the selected provider', async () => {
    const fetch = jest.spyOn(provider, 'fetch');

    await processor.process(createJob());

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenNthCalledWith(1, {});
    expect(fetch).toHaveBeenNthCalledWith(2, {
      cursor: '2',
    });
    expect(fetch).toHaveBeenNthCalledWith(3, {
      cursor: '4',
    });
  });

  it('persists every provider record as raw payload', async () => {
    await processor.process(createJob());

    expect(startNewsImport).toHaveBeenCalledTimes(1);
    expect(startNewsImport).toHaveBeenCalledWith(provider, {
      queueJobId: 'news-import-job-1',
    });

    expect(storeRecord).toHaveBeenCalledTimes(5);

    expect(storeRecord).toHaveBeenNthCalledWith(
      1,
      importSession,
      expect.objectContaining({
        externalId: 'fake-001',
      }),
    );

    expect(storeRecord).toHaveBeenNthCalledWith(
      5,
      importSession,
      expect.objectContaining({
        externalId: 'fake-005',
      }),
    );

    expect(completeNewsImport).toHaveBeenCalledTimes(1);
    expect(completeNewsImport).toHaveBeenCalledWith(importSession);
    expect(failNewsImport).not.toHaveBeenCalled();
  });

  it('normalizes every persisted provider record', async () => {
    await processor.process(createJob());

    expect(normalizeRecord).toHaveBeenCalledTimes(5);

    expect(normalizeRecord).toHaveBeenNthCalledWith(
      1,
      'import-fake-001',
      expect.objectContaining({
        externalId: 'fake-001',
      }),
      expect.any(FakeNewsNormalizer),
    );

    expect(normalizeRecord).toHaveBeenNthCalledWith(
      5,
      'import-fake-005',
      expect.objectContaining({
        externalId: 'fake-005',
      }),
      expect.any(FakeNewsNormalizer),
    );
  });

  it('rejects an unknown provider without creating an import job', async () => {
    await expect(
      processor.process(
        createJob({
          providerKey: 'unknown',
        }),
      ),
    ).rejects.toThrow('Unknown news provider: unknown');

    expect(startNewsImport).not.toHaveBeenCalled();
    expect(storeRecord).not.toHaveBeenCalled();
    expect(failNewsImport).not.toHaveBeenCalled();
  });

  it('rejects an unsupported job name without creating an import job', async () => {
    await expect(processor.process(createJob(undefined, 'unknown-job'))).rejects.toThrow(
      'Unsupported news import job: unknown-job',
    );

    expect(startNewsImport).not.toHaveBeenCalled();
    expect(storeRecord).not.toHaveBeenCalled();
    expect(failNewsImport).not.toHaveBeenCalled();
  });

  it('marks the durable import job failed and propagates provider failures', async () => {
    jest.spyOn(provider, 'fetch').mockRejectedValueOnce(new Error('Provider unavailable'));

    await expect(processor.process(createJob())).rejects.toThrow('Provider unavailable');

    expect(startNewsImport).toHaveBeenCalledTimes(1);
    expect(failNewsImport).toHaveBeenCalledTimes(1);
    expect(failNewsImport).toHaveBeenCalledWith(importSession, expect.any(Error));
    expect(completeNewsImport).not.toHaveBeenCalled();
  });

  it('propagates raw payload persistence failures', async () => {
    storeRecord.mockRejectedValueOnce(new Error('Raw payload write failed'));

    await expect(processor.process(createJob())).rejects.toThrow('Raw payload write failed');

    expect(failNewsImport).toHaveBeenCalledWith(importSession, expect.any(Error));
    expect(completeNewsImport).not.toHaveBeenCalled();
  });
});
