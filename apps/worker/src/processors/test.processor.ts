import { createLogger } from '@kurvenfunk/logger';
import type { ContextualPayload } from '@kurvenfunk/types';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

interface TestJobData {
  message: string;
}

type TestJobPayload = ContextualPayload<TestJobData>;

const logger = createLogger({
  service: 'worker',
});

@Processor('test')
export class TestProcessor extends WorkerHost {
  async process(job: Job<TestJobPayload>): Promise<void> {
    const { requestId } = job.data.context;
    const startedAt = process.hrtime.bigint();

    logger.info('Job started', {
      requestId,
      event: 'queue.job.started',
      metadata: {
        queue: 'test',
        jobId: job.id,
        jobName: job.name,
      },
    });

    try {
      logger.info('Test job processed', {
        requestId,
        event: 'test.job.processed',
        metadata: {
          queue: 'test',
          jobId: job.id,
          jobName: job.name,
          message: job.data.data.message,
        },
      });

      const durationNs = process.hrtime.bigint() - startedAt;
      const durationMs = Number(durationNs) / 1_000_000;

      logger.info('Job completed', {
        requestId,
        event: 'queue.job.completed',
        metadata: {
          queue: 'test',
          jobId: job.id,
          jobName: job.name,
          durationMs: Number(durationMs.toFixed(2)),
        },
      });
    } catch (error: unknown) {
      const durationNs = process.hrtime.bigint() - startedAt;
      const durationMs = Number(durationNs) / 1_000_000;

      logger.error('Job failed', {
        requestId,
        event: 'queue.job.failed',
        metadata: {
          queue: 'test',
          jobId: job.id,
          jobName: job.name,
          durationMs: Number(durationMs.toFixed(2)),
          error,
        },
      });

      throw error;
    }
  }
}
