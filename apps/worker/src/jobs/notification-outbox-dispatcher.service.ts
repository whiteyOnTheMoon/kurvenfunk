import {
  NOTIFICATION_DISPATCH_JOB_NAME,
  QUEUE_NAMES,
  type NotificationDispatchJobPayload,
} from '@kurvenfunk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { DatabaseService } from '../database/database.service';

const SCAN_INTERVAL_MS = 30_000;
const REDELIVERY_INTERVAL_MS = 60_000;
const BATCH_SIZE = 25;

/**
 * PostgreSQL is authoritative. A claimed event is never marked processed until
 * the queue worker acknowledges it. Crashes, Redis outages and duplicate queue
 * submissions recover on a later scan with one stable, non-PII job ID.
 */
@Injectable()
export class NotificationOutboxDispatcher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationOutboxDispatcher.name);
  private timer?: NodeJS.Timeout;
  private scanning = false;

  constructor(
    private readonly database: DatabaseService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
    private readonly queue: Queue<NotificationDispatchJobPayload>,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.dispatchDue().catch(() => this.logger.error('Notification outbox scan failed'));
    }, SCAN_INTERVAL_MS);
    this.timer.unref();
    void this.dispatchDue().catch(() =>
      this.logger.error('Initial notification outbox scan failed'),
    );
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async dispatchDue(now: Date = new Date()): Promise<{ queued: number; failed: number }> {
    if (this.scanning) return { queued: 0, failed: 0 };
    this.scanning = true;
    let queued = 0;
    let failed = 0;
    try {
      const candidates = await this.database.client.notificationOutbox.findMany({
        where: { processedAt: null, nextAttemptAt: { lte: now } },
        select: { notificationId: true },
        orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
        take: BATCH_SIZE,
      });
      for (const candidate of candidates) {
        // Atomic compare-and-swap claim also works across multiple worker replicas.
        // Its expiry makes a crash between claim and queue.add recoverable.
        const claimed = await this.database.client.notificationOutbox.updateMany({
          where: {
            notificationId: candidate.notificationId,
            processedAt: null,
            nextAttemptAt: { lte: now },
          },
          data: {
            attemptCount: { increment: 1 },
            nextAttemptAt: new Date(now.getTime() + REDELIVERY_INTERVAL_MS),
          },
        });
        if (claimed.count !== 1) continue;

        try {
          await this.queue.add(
            NOTIFICATION_DISPATCH_JOB_NAME,
            { notificationId: candidate.notificationId },
            {
              jobId: 'notification_' + candidate.notificationId.replaceAll('-', ''),
              attempts: 3,
              backoff: { type: 'exponential', delay: 2_000 },
              // Completed/failed jobs must not trap an unacknowledged outbox
              // row behind a permanent BullMQ duplicate job ID.
              removeOnComplete: true,
              removeOnFail: true,
            },
          );
          queued += 1;
        } catch {
          failed += 1;
          // No exception message or event body is written to logs/database.
          // Retry indefinitely on later scans: Redis downtime is not a DLQ.
          await this.database.client.notificationOutbox.updateMany({
            where: { notificationId: candidate.notificationId, processedAt: null },
            data: { lastErrorCode: 'NOTIFICATION_QUEUE_UNAVAILABLE' },
          });
          this.logger.warn('Notification queue dispatch unavailable; outbox retained for retry');
        }
      }
      return { queued, failed };
    } finally {
      this.scanning = false;
    }
  }
}
