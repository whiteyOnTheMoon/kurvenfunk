import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { ContextualPayload } from '@kurvenfunk/types';
import type { Job } from 'bullmq';

interface TestJobData {
  message: string;
}

type TestJobPayload = ContextualPayload<TestJobData>;

@Processor('test')
export class TestProcessor extends WorkerHost {
  private readonly logger = new Logger(TestProcessor.name);

  async process(job: Job<TestJobPayload>): Promise<void> {
    const { requestId } = job.data.context;

    this.logger.log(
      `Test job verarbeitet: id=${job.id}, requestId=${requestId}, message="${job.data.data.message}"`,
    );
  }
}
