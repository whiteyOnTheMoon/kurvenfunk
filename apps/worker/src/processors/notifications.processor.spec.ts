import { NOTIFICATION_DISPATCH_JOB_NAME } from '@kurvenfunk/types';
import { BadRequestException } from '@nestjs/common';
import type { Job } from 'bullmq';

import type { DatabaseService } from '../database/database.service';
import { NotificationsProcessor } from './notifications.processor';

describe('Phase 23.225 – idempotent notification queue consumer', () => {
  const notificationId = '11111111-1111-4111-8111-111111111111';
  const db = { notificationOutbox: { updateMany: jest.fn() } };
  const processor = new NotificationsProcessor({ client: db } as unknown as DatabaseService);
  const job = {
    name: NOTIFICATION_DISPATCH_JOB_NAME,
    data: { notificationId },
    id: 'notification_' + notificationId.replaceAll('-', ''),
  } as unknown as Job<unknown>;

  beforeEach(() => {
    jest.resetAllMocks();
    db.notificationOutbox.updateMany.mockResolvedValue({ count: 1 });
  });

  it('acknowledges a stored event without editing its notification or email state', async () => {
    await expect(processor.process(job)).resolves.toBeUndefined();
    const calls = db.notificationOutbox.updateMany.mock.calls as Array<[
      {
        where: { notificationId: string; processedAt: null };
        data: { processedAt: Date; lastErrorCode: null };
      },
    ]>;
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0].where).toEqual({ notificationId, processedAt: null });
    expect(calls[0]?.[0].data.processedAt).toBeInstanceOf(Date);
    expect(calls[0]?.[0].data.lastErrorCode).toBeNull();
  });

  it('accepts duplicate deliveries after the first durable acknowledgment', async () => {
    db.notificationOutbox.updateMany.mockResolvedValue({ count: 0 });
    await processor.process(job);
    await processor.process(job);
    expect(db.notificationOutbox.updateMany).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['unknown name', { name: 'email' }],
    ['invalid UUID', { data: { notificationId: 'bad' } }],
    ['payload missing', { data: null }],
    ['extra PII', { data: { notificationId, privateBody: 'secret' } }],
    ['wrong job ID', { id: 'not-matching' }],
  ])('rejects %s without any database access', async (_name, patch) => {
    await expect(processor.process({ ...job, ...patch } as Job<unknown>)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(db.notificationOutbox.updateMany).not.toHaveBeenCalled();
  });
});
