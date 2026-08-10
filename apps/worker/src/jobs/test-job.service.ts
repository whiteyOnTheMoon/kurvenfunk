import { randomUUID } from 'node:crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ContextualPayload } from '@kurvenfunk/types';
import type { Queue } from 'bullmq';

interface TestJobData {
  message: string;
}

type TestJobPayload = ContextualPayload<TestJobData>;

@Injectable()
export class TestJobService implements OnModuleInit {
  private readonly logger = new Logger(TestJobService.name);

  constructor(
    @InjectQueue('test')
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

    this.logger.log(
      `Test job erstellt: id=${job.id}, requestId=${requestId}`,
    );
  }
}
