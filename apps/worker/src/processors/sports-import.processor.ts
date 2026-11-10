import { createHash } from 'node:crypto';
import { createLogger } from '@kurvenfunk/logger';
import {
  FakeSportsProvider,
  QUEUE_NAMES,
  type SportsProvider,
  type SportsProviderRecord,
  SPORTS_IMPORT_JOB_NAME,
  type SportsImportDeadLetterPayload,
} from '@kurvenfunk/types';
import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import type { Job, Queue } from 'bullmq';
import { parseSportsImportPayload } from '../services/sports-import-payload';
import {
  SportsImportStore,
  sportsImportFailureCode,
  type SportsImportSession,
} from '../services/sports-import.store';

const logger = createLogger({ service: 'worker' });
const MAX_PAGES = 50;
const MAX_RECORDS = 5_000;
const MAX_PAGE_SIZE = 500;

/**
 * Initially supports the offline fake adapter ONLY, with explicit DEV/test
 * opt-in. A real provider needs separately reviewed trust and match policies.
 */
@Processor(QUEUE_NAMES.SPORTS_IMPORT, { concurrency: 1 })
export class SportsImportProcessor extends WorkerHost {
  private readonly fake: SportsProvider = new FakeSportsProvider();

  constructor(
    private readonly store: SportsImportStore,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_NAMES.SPORTS_IMPORT_DEAD_LETTER)
    private readonly deadLetters: Queue<SportsImportDeadLetterPayload>,
  ) {
    super();
  }

  async process(job: Job<unknown>): Promise<void> {
    let session: SportsImportSession | undefined;
    const started = process.hrtime.bigint();

    try {
      if (job.name !== SPORTS_IMPORT_JOB_NAME || !job.id) {
        throw new Error('SPORTS_IMPORT_INVALID_JOB');
      }
      const input = parseSportsImportPayload(job.data);
      this.assertEnabled();
      if (input.providerKey !== this.fake.key) {
        throw new Error('SPORTS_IMPORT_UNKNOWN_PROVIDER');
      }

      session = await this.store.start(this.fake, input, String(job.id));
      if (session.alreadyCompleted) return;

      let cursor: string | undefined;
      let pages = 0;
      let count = 0;
      const cursors = new Set<string>();

      do {
        if (++pages > MAX_PAGES) throw new Error('SPORTS_IMPORT_PAGE_LIMIT');
        const result = await this.fake.fetch({
          resource: input.resource,
          competitionExternalId: input.competitionExternalId,
          seasonExternalId: input.seasonExternalId,
          ...(input.windowStart ? { windowStart: input.windowStart } : {}),
          ...(input.windowEnd ? { windowEnd: input.windowEnd } : {}),
          ...(cursor ? { cursor } : {}),
        });
        if (!Array.isArray(result.records) || result.records.length > MAX_PAGE_SIZE) {
          throw new Error('SPORTS_IMPORT_PAGE_INVALID');
        }
        count += result.records.length;
        if (count > MAX_RECORDS) throw new Error('SPORTS_IMPORT_RECORD_LIMIT');
        if (result.nextCursor && (result.nextCursor === cursor || cursors.has(result.nextCursor))) {
          throw new Error('SPORTS_IMPORT_CURSOR_LOOP');
        }

        for (const record of result.records as readonly SportsProviderRecord[]) {
          if (input.resource === 'clubs' ? record.kind !== 'club' : record.kind !== 'match') {
            throw new Error('SPORTS_IMPORT_RECORD_KIND_MISMATCH');
          }
          await this.store.store(session, input.resource, record);
        }

        // Checkpoint only after the entire page has been stored; retry restarts
        // and uses per-record advisory locks to avoid duplicate staging records.
        await this.store.checkpoint(session, result.nextCursor);
        if (result.nextCursor) cursors.add(result.nextCursor);
        cursor = result.nextCursor;
      } while (cursor !== undefined);

      await this.store.complete(session);
      logger.info('Sports import staged for review', {
        event: 'sports-import.staged',
        metadata: {
          queue: QUEUE_NAMES.SPORTS_IMPORT,
          jobId: String(job.id),
          resource: input.resource,
          providerKey: input.providerKey,
          pages,
          records: count,
          durationMs: Number(process.hrtime.bigint() - started) / 1_000_000,
        },
      });
    } catch (error: unknown) {
      if (session) {
        try {
          await this.store.fail(session, error);
        } catch {
          logger.error('Could not mark sports import failed', {
            event: 'sports-import.status_error',
            metadata: { jobId: String(job.id ?? '') },
          });
        }
      }
      logger.error('Sports import job failed', {
        event: 'sports-import.failed',
        metadata: {
          jobId: String(job.id ?? ''),
          queue: QUEUE_NAMES.SPORTS_IMPORT,
          // Never log raw record data, provider responses or secrets.
          errorCode: sportsImportFailureCode(error),
        },
      });
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<unknown> | undefined, error: Error): Promise<void> {
    if (!job?.id || job.attemptsMade < (job.opts.attempts ?? 1)) return;

    try {
      const payload = parseSportsImportPayload(job.data);
      const key = createHash('sha256').update(String(job.id)).digest('hex').slice(0, 32);
      const entry: SportsImportDeadLetterPayload = {
        originalQueue: QUEUE_NAMES.SPORTS_IMPORT,
        originalJobId: String(job.id),
        originalJobName: SPORTS_IMPORT_JOB_NAME,
        originalData: payload,
        // A finite enumerated code, not raw exception text.
        errorCode:
          /^FAKE_SPORTS_[A-Z_]+$/.test(error.message) ||
          /^SPORTS_IMPORT_[A-Z_]+$/.test(error.message)
            ? error.message
            : 'SPORTS_IMPORT_FAILED',
        attemptsMade: job.attemptsMade,
        failedAt: new Date().toISOString(),
      };
      await this.deadLetters.add('sports-import-failed', entry, {
        jobId: 'sportsdlq_' + key,
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false,
      });
      await this.store.deadLetter(String(job.id));
    } catch {
      logger.error('Sports import dead-letter handling failed', {
        event: 'sports-import.dead_letter_error',
        metadata: { jobId: String(job.id) },
      });
    }
  }

  private assertEnabled(): void {
    const enabled = this.config.get<boolean>('SPORTS_FAKE_PROVIDER_ENABLED', false);
    const environment = this.config.get<string>('NODE_ENV', 'production');
    if (!enabled || (environment !== 'development' && environment !== 'test')) {
      throw new Error('SPORTS_IMPORT_DISABLED');
    }
  }
}
