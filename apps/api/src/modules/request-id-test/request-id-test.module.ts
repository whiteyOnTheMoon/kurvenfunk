import { BullModule } from '@nestjs/bullmq';
import { type DynamicModule, Module } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';
import { QUEUE_NAMES } from '@kurvenfunk/types';
import { RequestIdTestController } from './request-id-test.controller';
import { RequestIdTestService } from './request-id-test.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.TEST,
    }),
  ],
  controllers: [RequestIdTestController],
  providers: [RequestIdTestService],
})
export class RequestIdTestModule {
  static register(): Promise<DynamicModule> {
    // Wait for ConfigModule to load .env before deciding which routes to expose.
    // Opt in only on a local development instance; production can never enable it.
    return ConditionalModule.registerWhen(
      RequestIdTestModule,
      (env) => env.NODE_ENV === 'development' && env.REQUEST_ID_TEST_ENABLED === 'true',
      { debug: false },
    );
  }
}
