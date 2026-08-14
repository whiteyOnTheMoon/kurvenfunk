import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APPLICATION_QUEUE_NAMES, DEFAULT_JOB_OPTIONS, QUEUE_NAMES } from '@kurvenfunk/types';
import { TestJobService } from './jobs/test-job.service';
import { TestProcessor } from './processors/test.processor';
import { validateEnvironment } from './config/env.validation';

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
  providers: [TestProcessor, TestJobService],
})
export class AppModule {}
