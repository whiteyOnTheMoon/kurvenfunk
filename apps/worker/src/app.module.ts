import { APPLICATION_QUEUE_NAMES, DEFAULT_JOB_OPTIONS, QUEUE_NAMES } from '@kurvenfunk/types';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnvironment } from './config/env.validation';
import { DatabaseService } from './database/database.service';
import { NewsImportSchedulerService } from './jobs/news-import-scheduler.service';
import { ScheduledPublishingJobService } from './jobs/scheduled-publishing-job.service';
import { TestJobService } from './jobs/test-job.service';
import { NewsImportProcessor } from './processors/news-import.processor';
import { ScheduledPublishingProcessor } from './processors/scheduled-publishing.processor';
import { TestProcessor } from './processors/test.processor';
import { FakeNewsProvider } from './providers/fake-news-provider';
import { RawPayloadService } from './services/raw-payload.service';
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
  ],
  providers: [
    DatabaseService,
    FakeNewsProvider,
    NewsImportSchedulerService,
    RawPayloadService,
    ScheduledPublishingService,
    NewsImportProcessor,
    ScheduledPublishingProcessor,
    ScheduledPublishingJobService,
    TestProcessor,
    TestJobService,
  ],
})
export class AppModule {}
