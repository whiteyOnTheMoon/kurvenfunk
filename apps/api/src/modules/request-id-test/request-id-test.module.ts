import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { RequestIdTestController } from './request-id-test.controller';
import { RequestIdTestService } from './request-id-test.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'test',
    }),
  ],
  controllers: [RequestIdTestController],
  providers: [RequestIdTestService],
})
export class RequestIdTestModule {}
