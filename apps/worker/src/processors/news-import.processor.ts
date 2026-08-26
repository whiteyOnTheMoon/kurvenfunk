import { createLogger } from '@kurvenfunk/logger';
import { QUEUE_NAMES } from '@kurvenfunk/types';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { FakeNewsNormalizer } from '../providers/fake-news-normalizer';
import { FakeNewsProvider } from '../providers/fake-news-provider';
import { NewsClubMatchingService } from '../services/news-club-matching.service';
import { NewsCompetitionMatchingService } from '../services/news-competition-matching.service';
import { NewsDuplicateDetectionService } from '../services/news-duplicate-detection.service';
import { NewsNormalizationService } from '../services/news-normalization.service';
import { NewsValidationService } from '../services/news-validation.service';
import { RawPayloadService, type RawPayloadImportSession } from '../services/raw-payload.service';

const logger = createLogger({
  service: 'worker',
});

export interface NewsImportJobPayload {
  providerKey: string;
}

@Processor(QUEUE_NAMES.NEWS_IMPORT)
export class NewsImportProcessor extends WorkerHost {
  constructor(
    private readonly fakeNewsProvider: FakeNewsProvider,
    private readonly fakeNewsNormalizer: FakeNewsNormalizer,
    private readonly rawPayloadService: RawPayloadService,
    private readonly newsNormalizationService: NewsNormalizationService,
    private readonly newsValidationService: NewsValidationService,
    private readonly newsDuplicateDetectionService: NewsDuplicateDetectionService,
    private readonly newsClubMatchingService: NewsClubMatchingService,
    private readonly newsCompetitionMatchingService: NewsCompetitionMatchingService,
  ) {
    super();
  }

  async process(job: Job<NewsImportJobPayload>): Promise<void> {
    const startedAt = process.hrtime.bigint();
    let importSession: RawPayloadImportSession | undefined;

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

      importSession = await this.rawPayloadService.startNewsImport(provider, {
        ...(job.id !== undefined ? { queueJobId: String(job.id) } : {}),
      });

      let cursor: string | undefined;
      let pageCount = 0;
      let recordCount = 0;

      do {
        const result = await provider.fetch({
          ...(cursor !== undefined ? { cursor } : {}),
        });

        for (const record of result.records) {
          const storedRecord = await this.rawPayloadService.storeRecord(importSession, record);

          const normalized = await this.newsNormalizationService.normalizeRecord(
            storedRecord.importRecordId,
            record,
            this.fakeNewsNormalizer,
          );

          const validation = await this.newsValidationService.validateRecord(
            storedRecord.importRecordId,
            normalized,
          );

          if (!validation.valid) {
            continue;
          }

          const duplicateDetection = await this.newsDuplicateDetectionService.detectDuplicate(
            storedRecord.importRecordId,
            validation.article,
          );

          if (duplicateDetection.duplicate) {
            continue;
          }

          await this.newsClubMatchingService.matchClubs(
            storedRecord.importRecordId,
            validation.article,
          );

          await this.newsCompetitionMatchingService.matchCompetition(
            storedRecord.importRecordId,
            validation.article,
          );
        }

        pageCount += 1;
        recordCount += result.records.length;
        cursor = result.nextCursor;
      } while (cursor !== undefined);

      await this.rawPayloadService.completeNewsImport(importSession);

      const durationNs = process.hrtime.bigint() - startedAt;
      const durationMs = Number(durationNs) / 1_000_000;

      logger.info('News import job completed', {
        event: 'queue.job.completed',
        metadata: {
          queue: QUEUE_NAMES.NEWS_IMPORT,
          jobId: job.id,
          jobName: job.name,
          providerKey: provider.key,
          importJobId: importSession.importJobId,
          pageCount,
          recordCount,
          durationMs: Number(durationMs.toFixed(2)),
        },
      });
    } catch (error: unknown) {
      if (importSession !== undefined) {
        try {
          await this.rawPayloadService.failNewsImport(importSession, error);
        } catch (persistenceError: unknown) {
          logger.error('Failed to persist news import failure state', {
            event: 'import.job.failure_persistence_failed',
            metadata: {
              queue: QUEUE_NAMES.NEWS_IMPORT,
              jobId: job.id,
              providerKey: job.data.providerKey,
              importJobId: importSession.importJobId,
              error: persistenceError,
            },
          });
        }
      }

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
