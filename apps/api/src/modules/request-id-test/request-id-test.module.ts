import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
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
export class RequestIdTestModule {}
