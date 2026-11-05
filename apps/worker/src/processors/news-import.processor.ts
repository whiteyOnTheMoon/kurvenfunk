import { createLogger } from '@kurvenfunk/logger';
import { QUEUE_NAMES, type NewsImportJobPayload } from '@kurvenfunk/types';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { FakeNewsNormalizer } from '../providers/fake-news-normalizer';
import { FakeNewsProvider } from '../providers/fake-news-provider';
import { OtsNewsNormalizer } from '../providers/ots-news-normalizer';
import { OtsNewsProvider } from '../providers/ots-news-provider';
import { NewsAutoPublishingService } from '../services/news-auto-publishing.service';
import { NewsClubMatchingService } from '../services/news-club-matching.service';
import { NewsCompetitionMatchingService } from '../services/news-competition-matching.service';
import { NewsConfidenceScoreService } from '../services/news-confidence-score.service';
import { NewsDuplicateDetectionService } from '../services/news-duplicate-detection.service';
import { NewsImportDeadLetterService } from '../services/news-import-dead-letter.service';
import { NewsMatchMatchingService } from '../services/news-match-matching.service';
import { NewsReviewWorkflowService } from '../services/news-review-workflow.service';
import { NewsNormalizationService } from '../services/news-normalization.service';
import { NewsValidationService } from '../services/news-validation.service';
import { RawPayloadService, type RawPayloadImportSession } from '../services/raw-payload.service';

const logger = createLogger({
  service: 'worker',
});

@Processor(QUEUE_NAMES.NEWS_IMPORT)
export class NewsImportProcessor extends WorkerHost {
  constructor(
    private readonly fakeNewsProvider: FakeNewsProvider,
    private readonly fakeNewsNormalizer: FakeNewsNormalizer,
    private readonly otsNewsProvider: OtsNewsProvider,
    private readonly otsNewsNormalizer: OtsNewsNormalizer,
    private readonly rawPayloadService: RawPayloadService,
    private readonly newsNormalizationService: NewsNormalizationService,
    private readonly newsValidationService: NewsValidationService,
    private readonly newsDuplicateDetectionService: NewsDuplicateDetectionService,
    private readonly newsClubMatchingService: NewsClubMatchingService,
    private readonly newsCompetitionMatchingService: NewsCompetitionMatchingService,
    private readonly newsMatchMatchingService: NewsMatchMatchingService,
    private readonly newsConfidenceScoreService: NewsConfidenceScoreService,
    private readonly newsReviewWorkflowService: NewsReviewWorkflowService,
    private readonly newsAutoPublishingService: NewsAutoPublishingService,
    private readonly newsImportDeadLetterService: NewsImportDeadLetterService,
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

      const { provider, normalizer } = this.resolveProvider(job.data.providerKey);

      // BullMQ keeps job.timestamp across automatic retry attempts. Pin the
      // import window to that timestamp instead of shifting it on each retry.
      const windowEnd =
        job.data.windowEnd ??
        (job.data.lookbackMinutes !== undefined
          ? new Date(job.timestamp ?? Date.now()).toISOString()
          : undefined);
      const windowStart =
        job.data.windowStart ??
        (job.data.lookbackMinutes !== undefined && windowEnd !== undefined
          ? new Date(Date.parse(windowEnd) - job.data.lookbackMinutes * 60_000).toISOString()
          : undefined);

      importSession = await this.rawPayloadService.startNewsImport(provider, {
        ...(job.id !== undefined ? { queueJobId: String(job.id) } : {}),
        ...(job.data.retryOfImportJobId !== undefined
          ? { retryOfImportJobId: job.data.retryOfImportJobId }
          : {}),
        ...(windowStart !== undefined ? { windowStart } : {}),
        ...(windowEnd !== undefined ? { windowEnd } : {}),
      });

      let cursor: string | undefined;
      let pageCount = 0;
      let recordCount = 0;

      do {
        const result = await provider.fetch({
          ...(cursor !== undefined ? { cursor } : {}),
          ...(windowStart !== undefined ? { windowStart } : {}),
          ...(windowEnd !== undefined ? { windowEnd } : {}),
        });

        for (const record of result.records) {
          const storedRecord = await this.rawPayloadService.storeRecord(importSession, record);

          const normalized = await this.newsNormalizationService.normalizeRecord(
            storedRecord.importRecordId,
            record,
            normalizer,
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

          const clubMatching = await this.newsClubMatchingService.matchClubs(
            storedRecord.importRecordId,
            validation.article,
          );

          const competitionMatching = await this.newsCompetitionMatchingService.matchCompetition(
            storedRecord.importRecordId,
            validation.article,
          );

          const matchMatching = await this.newsMatchMatchingService.matchMatch(
            storedRecord.importRecordId,
            validation.article,
            clubMatching,
            competitionMatching,
          );

          const confidence = this.newsConfidenceScoreService.score(
            clubMatching,
            competitionMatching,
            matchMatching,
          );

          const reviewWorkflow = await this.newsReviewWorkflowService.apply(
            storedRecord.importRecordId,
            confidence,
            clubMatching,
            competitionMatching,
            matchMatching,
            !provider.trustedForAutoPublish,
          );

          if (!reviewWorkflow.reviewRequired) {
            await this.newsAutoPublishingService.publish(
              provider,
              storedRecord.importRecordId,
              validation.article,
              clubMatching,
              competitionMatching,
              matchMatching,
            );
          }
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

  @OnWorkerEvent('failed')
  async onFailed(job: Job<NewsImportJobPayload> | undefined, error: Error): Promise<void> {
    if (job === undefined) {
      logger.error('News import failed event received without job', {
        event: 'queue.job.dead_letter_skipped',
        metadata: {
          queue: QUEUE_NAMES.NEWS_IMPORT,
          failedReason: error.message,
        },
      });

      return;
    }

    try {
      await this.newsImportDeadLetterService.moveToDeadLetter(job, error);
    } catch (deadLetterError: unknown) {
      logger.error('Failed to move news import job to dead letter queue', {
        event: 'queue.job.dead_letter_failed',
        metadata: {
          queue: QUEUE_NAMES.NEWS_IMPORT,
          jobId: job.id,
          jobName: job.name,
          providerKey: job.data.providerKey,
          error: deadLetterError,
        },
      });
    }
  }

  private resolveProvider(providerKey: string):
    | {
        provider: FakeNewsProvider;
        normalizer: FakeNewsNormalizer;
      }
    | {
        provider: OtsNewsProvider;
        normalizer: OtsNewsNormalizer;
      } {
    if (providerKey === this.fakeNewsProvider.key) {
      return {
        provider: this.fakeNewsProvider,
        normalizer: this.fakeNewsNormalizer,
      };
    }

    if (providerKey === this.otsNewsProvider.key) {
      return {
        provider: this.otsNewsProvider,
        normalizer: this.otsNewsNormalizer,
      };
    }

    throw new Error(`Unknown news provider: ${providerKey}`);
  }
}
