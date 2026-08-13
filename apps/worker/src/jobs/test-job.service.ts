import { randomUUID } from 'node:crypto';
import { createLogger } from '@kurvenfunk/logger';
import { QUEUE_NAMES, type ContextualPayload } from '@kurvenfunk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';

interface TestJobData {
  message: string;
}

type TestJobPayload = ContextualPayload<TestJobData>;

const logger = createLogger({
  service: 'worker',
});

@Injectable()
export class TestJobService implements OnModuleInit {
  constructor(
    @InjectQueue(QUEUE_NAMES.TEST)
    private readonly testQueue: Queue<TestJobPayload>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const runStartupTest =
      this.configService.get('WORKER_RUN_STARTUP_TEST', false);

    if (!runStartupTest) {
      return;
    }

    const requestId = randomUUID();

    const job = await this.testQueue.add('startup-test', {
      context: {
        requestId,
      },
      data: {
        message: 'Kurvenfunk BullMQ funktioniert',
      },
    });

    logger.info('Test job queued', {
      requestId,
      event: 'queue.job.queued',
      metadata: {
        queue: QUEUE_NAMES.TEST,
        jobId: job.id,
        jobName: job.name,
      },
    });
  }
}
