import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

@Processor('test')
export class TestProcessor extends WorkerHost {
  private readonly logger = new Logger(TestProcessor.name);

  async process(job: Job<{ message: string }>): Promise<void> {
    this.logger.log(
      `Test job verarbeitet: id=${job.id}, message="${job.data.message}"`,
    );
  }
}
