import { BullModule } from '@nestjs/bullmq';
import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  APPLICATION_QUEUE_NAMES,
  DEFAULT_JOB_OPTIONS,
} from '@kurvenfunk/types';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { validateEnvironment } from './config/env.validation';
import { HealthModule } from './modules/health/health.module';
import { RequestIdTestModule } from './modules/request-id-test/request-id-test.module';

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
          password:
            configService.getOrThrow<string>('REDIS_PASSWORD'),
        },
      }),
    }),

    BullModule.registerQueue(
      ...APPLICATION_QUEUE_NAMES.map((name) => ({
        name,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      })),
    ),

    HealthModule,
    RequestIdTestModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('{*path}');
  }
}
