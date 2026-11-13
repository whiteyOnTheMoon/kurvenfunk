import { NOTIFICATION_DISPATCH_JOB_NAME, QUEUE_NAMES } from '@kurvenfunk/types';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import type { Job } from 'bullmq';

import { DatabaseService } from '../database/database.service';

const UUID_PATTERN = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

@Processor(QUEUE_NAMES.NOTIFICATIONS, { concurrency: 4 })
export class NotificationsProcessor extends WorkerHost {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  async process(job: Job<unknown>): Promise<void> {
    const data = job.data;
    if (
      job.name !== NOTIFICATION_DISPATCH_JOB_NAME ||
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      !('notificationId' in data) ||
      typeof data.notificationId !== 'string' ||
      !UUID_PATTERN.test(data.notificationId) ||
      Object.keys(data).length !== 1 ||
      job.id !== 'notification_' + data.notificationId.replaceAll('-', '')
    ) {
      throw new BadRequestException('NOTIFICATION_QUEUE_INVALID_JOB');
    }

    // Nothing is sent to users in task 225. Mark the durable queue handshake
    // only, NEVER an email delivery or notification read receipt.
    await this.database.client.notificationOutbox.updateMany({
      where: { notificationId: data.notificationId, processedAt: null },
      data: { processedAt: new Date(), lastErrorCode: null },
    });
    // Deleted recipients cascade their outbox entry; duplicate/missing jobs
    // are harmless and cannot resurrect another user's notification.
  }
}
