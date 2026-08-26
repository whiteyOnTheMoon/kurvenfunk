import { createLogger } from '@kurvenfunk/logger';
import { QUEUE_NAMES } from '@kurvenfunk/types';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { FakeNewsProvider } from '../providers/fake-news-provider';

const logger = createLogger({
  service: 'worker',
});

export interface NewsImportJobPayload {
  providerKey: string;
}

@Processor(QUEUE_NAMES.NEWS_IMPORT)
export class NewsImportProcessor extends WorkerHost {
  constructor(private readonly fakeNewsProvider: FakeNewsProvider) {
    super();
  }

  async process(job: Job<NewsImportJobPayload>): Promise<void> {
    const startedAt = process.hrtime.bigint();

    logger.info('News import job started', {
      event: 'queue.job.started',
      metadata: {
        queue: QUEUE_NAMES.NEWS_IMPORT,
        jobId: job.id,
        jobName: job.name,
        providerKey: job.data.providerKey,
      },
    });

    try {
      if (job.name !== 'fetch-provider') {
        throw new Error(`Unsupported news import job: ${job.name}`);
      }

      const provider = this.resolveProvider(job.data.providerKey);

      let cursor: string | undefined;
      let pageCount = 0;
      let recordCount = 0;

      do {
        const result = await provider.fetch({
          ...(cursor !== undefined ? { cursor } : {}),
        });

        pageCount += 1;
        recordCount += result.records.length;
        cursor = result.nextCursor;
      } while (cursor !== undefined);

      const durationNs = process.hrtime.bigint() - startedAt;
      const durationMs = Number(durationNs) / 1_000_000;

      logger.info('News import job completed', {
        event: 'queue.job.completed',
        metadata: {
          queue: QUEUE_NAMES.NEWS_IMPORT,
          jobId: job.id,
          jobName: job.name,
          providerKey: provider.key,
          pageCount,
          recordCount,
          durationMs: Number(durationMs.toFixed(2)),
        },
      });
    } catch (error: unknown) {
      const durationNs = process.hrtime.bigint() - startedAt;
      const durationMs = Number(durationNs) / 1_000_000;

      logger.error('News import job failed', {
        event: 'queue.job.failed',
        metadata: {
          queue: QUEUE_NAMES.NEWS_IMPORT,
          jobId: job.id,
          jobName: job.name,
          providerKey: job.data.providerKey,
          durationMs: Number(durationMs.toFixed(2)),
          error,
        },
      });

      throw error;
    }
  }

  private resolveProvider(providerKey: string): FakeNewsProvider {
    if (providerKey === this.fakeNewsProvider.key) {
      return this.fakeNewsProvider;
    }

    throw new Error(`Unknown news provider: ${providerKey}`);
  }
}
