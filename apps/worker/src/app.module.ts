import { APPLICATION_QUEUE_NAMES, DEFAULT_JOB_OPTIONS, QUEUE_NAMES } from '@kurvenfunk/types';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnvironment } from './config/env.validation';
import { DatabaseService } from './database/database.service';
import { NewsImportSchedulerService } from './jobs/news-import-scheduler.service';
import { SportsImportQueueService } from './jobs/sports-import-queue.service';
import { ScheduledPublishingJobService } from './jobs/scheduled-publishing-job.service';
import { TestJobService } from './jobs/test-job.service';
import { NewsImportProcessor } from './processors/news-import.processor';
import { SportsImportProcessor } from './processors/sports-import.processor';
import { ScheduledPublishingProcessor } from './processors/scheduled-publishing.processor';
import { TestProcessor } from './processors/test.processor';
import { FakeNewsNormalizer } from './providers/fake-news-normalizer';
import { FakeNewsProvider } from './providers/fake-news-provider';
import { OtsNewsNormalizer } from './providers/ots-news-normalizer';
import { OtsNewsProvider } from './providers/ots-news-provider';
import { NewsAutoPublishingService } from './services/news-auto-publishing.service';
import { NewsClubMatchingService } from './services/news-club-matching.service';
import { NewsCompetitionMatchingService } from './services/news-competition-matching.service';
import { NewsConfidenceScoreService } from './services/news-confidence-score.service';
import { NewsDuplicateDetectionService } from './services/news-duplicate-detection.service';
import { NewsImportDeadLetterService } from './services/news-import-dead-letter.service';
import { NewsMatchMatchingService } from './services/news-match-matching.service';
import { NewsReviewWorkflowService } from './services/news-review-workflow.service';
import { NewsNormalizationService } from './services/news-normalization.service';
import { NewsValidationService } from './services/news-validation.service';
import { RawPayloadService } from './services/raw-payload.service';
import { SanctionExpirationService } from './services/sanction-expiration.service';
import { SportsImportStore } from './services/sports-import.store';
import { ScheduledPublishingService } from './services/scheduled-publishing.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'redis'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.getOrThrow<string>('REDIS_PASSWORD'),
        },
      }),
    }),

    BullModule.registerQueue({
      name: QUEUE_NAMES.TEST,
    }),

    BullModule.registerQueue(
      ...APPLICATION_QUEUE_NAMES.map((name) => ({
        name,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      })),
    ),

    BullModule.registerQueue(
      ...[QUEUE_NAMES.NEWS_IMPORT_DEAD_LETTER, QUEUE_NAMES.SPORTS_IMPORT_DEAD_LETTER].map(
        (name) => ({
          name,
          defaultJobOptions: {
            removeOnComplete: false,
            removeOnFail: false,
          },
        }),
      ),
    ),
  ],
  providers: [
    DatabaseService,
    FakeNewsProvider,
    FakeNewsNormalizer,
    OtsNewsProvider,
    OtsNewsNormalizer,
    NewsImportSchedulerService,
    SportsImportQueueService,
    SportsImportStore,
    SportsImportProcessor,
    NewsAutoPublishingService,
    NewsClubMatchingService,
    NewsCompetitionMatchingService,
    NewsConfidenceScoreService,
    NewsDuplicateDetectionService,
    NewsImportDeadLetterService,
    NewsMatchMatchingService,
    NewsReviewWorkflowService,
    NewsNormalizationService,
    NewsValidationService,
    RawPayloadService,
    ScheduledPublishingService,
    SanctionExpirationService,
    NewsImportProcessor,
    ScheduledPublishingProcessor,
    ScheduledPublishingJobService,
    TestProcessor,
    TestJobService,
  ],
})
export class AppModule {}
