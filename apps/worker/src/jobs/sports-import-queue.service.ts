import { createHash } from 'node:crypto';
import {
  QUEUE_NAMES,
  SPORTS_IMPORT_JOB_NAME,
  SPORTS_IMPORT_RETRY_OPTIONS,
  type SportsImportJobPayload,
} from '@kurvenfunk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { parseSportsImportPayload } from '../services/sports-import-payload';

/**
 * Internal enqueue API for future admin/scheduler tasks. This service is not
 * triggered during startup and is intentionally not exposed over HTTP.
 */
@Injectable()
export class SportsImportQueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.SPORTS_IMPORT)
    private readonly queue: Queue<SportsImportJobPayload>,
    private readonly config: ConfigService,
  ) {}

  async enqueue(data: SportsImportJobPayload): Promise<string> {
    const payload = parseSportsImportPayload(data);
    const enabled = this.config.get<boolean>('SPORTS_FAKE_PROVIDER_ENABLED', false);
    const env = this.config.get<string>('NODE_ENV', 'production');
    if (!enabled || (env !== 'development' && env !== 'test')) {
      throw new Error('SPORTS_IMPORT_DISABLED');
    }

    // The same request has one queue key, preventing simultaneous duplicate
    // fetches. A later scheduler can choose a new explicit window to rerun.
    const fingerprint = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const queueJobId = 'sports_' + fingerprint;
    const job = await this.queue.add(SPORTS_IMPORT_JOB_NAME, payload, {
      jobId: queueJobId,
      ...SPORTS_IMPORT_RETRY_OPTIONS,
      removeOnComplete: { count: 1_000 },
      removeOnFail: { count: 5_000 },
    });
    return String(job.id);
  }
}
