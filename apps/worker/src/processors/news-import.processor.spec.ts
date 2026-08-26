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

import type { Job } from 'bullmq';
import { NewsImportProcessor, type NewsImportJobPayload } from './news-import.processor';
import { FakeNewsProvider } from '../providers/fake-news-provider';

describe('NewsImportProcessor', () => {
  let provider: FakeNewsProvider;
  let processor: NewsImportProcessor;

  beforeEach(() => {
    provider = new FakeNewsProvider();
    processor = new NewsImportProcessor(provider);
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

  it('rejects an unknown provider', async () => {
    await expect(
      processor.process(
        createJob({
          providerKey: 'unknown',
        }),
      ),
    ).rejects.toThrow('Unknown news provider: unknown');
  });

  it('rejects an unsupported job name', async () => {
    await expect(processor.process(createJob(undefined, 'unknown-job'))).rejects.toThrow(
      'Unsupported news import job: unknown-job',
    );
  });

  it('propagates provider failures so BullMQ can retry the job', async () => {
    jest.spyOn(provider, 'fetch').mockRejectedValueOnce(new Error('Provider unavailable'));

    await expect(processor.process(createJob())).rejects.toThrow('Provider unavailable');
  });
});
