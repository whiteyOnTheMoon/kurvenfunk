/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest mock calls are dynamic. */
import { NOTIFICATION_DISPATCH_JOB_NAME } from '@kurvenfunk/types';
import type { Queue } from 'bullmq';

import type { DatabaseService } from '../database/database.service';
import { NotificationOutboxDispatcher } from './notification-outbox-dispatcher.service';

describe('Phase 23.225 – durable outbox dispatcher', () => {
  const notificationId = '11111111-1111-4111-8111-111111111111';
  const now = new Date('2026-11-13T23:00:00.000Z');
  const db = {
    notificationOutbox: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const queue = { add: jest.fn() };
  const service = new NotificationOutboxDispatcher(
    { client: db } as unknown as DatabaseService,
    queue as unknown as Queue,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    db.notificationOutbox.findMany.mockResolvedValue([{ notificationId }]);
    db.notificationOutbox.updateMany.mockResolvedValue({ count: 1 });
    queue.add.mockResolvedValue({ id: 'notification_job' });
  });

  it('claims a small ordered batch before enqueuing a stable minimal Redis job', async () => {
    await expect(service.dispatchDue(now)).resolves.toEqual({ queued: 1, failed: 0 });
    expect(db.notificationOutbox.findMany).toHaveBeenCalledWith({
      where: { processedAt: null, nextAttemptAt: { lte: now } },
      select: { notificationId: true },
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
      take: 25,
    });
    expect(db.notificationOutbox.updateMany).toHaveBeenCalledWith({
      where: {
        notificationId,
        processedAt: null,
        nextAttemptAt: { lte: now },
      },
      data: {
        attemptCount: { increment: 1 },
        nextAttemptAt: new Date(now.getTime() + 60_000),
      },
    });
    expect(queue.add).toHaveBeenCalledWith(
      NOTIFICATION_DISPATCH_JOB_NAME,
      { notificationId },
      expect.objectContaining({
        jobId: 'notification_' + notificationId.replaceAll('-', ''),
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: true,
      }),
    );
  });

  it('skips a row claimed by another worker without publishing twice', async () => {
    db.notificationOutbox.updateMany.mockResolvedValue({ count: 0 });
    expect(await service.dispatchDue(now)).toEqual({ queued: 0, failed: 0 });
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('retains a retryable row on Redis outage with sanitized persistent error code', async () => {
    queue.add.mockRejectedValue(new Error('redis password and secret detail'));
    expect(await service.dispatchDue(now)).toEqual({ queued: 0, failed: 1 });
    expect(db.notificationOutbox.updateMany).toHaveBeenLastCalledWith({
      where: { notificationId, processedAt: null },
      data: { lastErrorCode: 'NOTIFICATION_QUEUE_UNAVAILABLE' },
    });
    expect(db.notificationOutbox.updateMany).toHaveBeenCalledTimes(2);

    queue.add.mockResolvedValue({ id: 'retry-job' });
    expect(await service.dispatchDue(new Date(now.getTime() + 61_000))).toEqual({
      queued: 1,
      failed: 0,
    });
    expect(queue.add).toHaveBeenCalledTimes(2);
  });

  it('never marks a row processed merely because BullMQ accepted the job', async () => {
    await service.dispatchDue(now);
    const writes = db.notificationOutbox.updateMany.mock.calls as Array<
      [
        {
          data: { processedAt?: Date };
        },
      ]
    >;
    for (const [write] of writes) {
      expect(write.data.processedAt).toBeUndefined();
    }
  });

  it('remains idle with an empty durable outbox', async () => {
    db.notificationOutbox.findMany.mockResolvedValue([]);
    expect(await service.dispatchDue(now)).toEqual({ queued: 0, failed: 0 });
    expect(queue.add).not.toHaveBeenCalled();
    expect(db.notificationOutbox.updateMany).not.toHaveBeenCalled();
  });
});
