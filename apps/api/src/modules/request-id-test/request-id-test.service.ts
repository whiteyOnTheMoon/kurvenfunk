import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { ContextualPayload } from '@kurvenfunk/types';
import type { Queue } from 'bullmq';

interface TestJobData {
  message: string;
}

type TestJobPayload = ContextualPayload<TestJobData>;

@Injectable()
export class RequestIdTestService {
  constructor(
    @InjectQueue('test')
    private readonly testQueue: Queue<TestJobPayload>,
  ) {}

  async enqueue(requestId: string) {
    const job = await this.testQueue.add('request-id-test', {
      context: {
        requestId,
      },
      data: {
        message: 'Request ID propagation test',
      },
    });

    return {
      jobId: job.id,
      requestId,
    };
  }
}
