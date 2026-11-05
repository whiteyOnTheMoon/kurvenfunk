import { createHash } from 'node:crypto';

import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import type { Queue } from 'bullmq';
import type { NewsImportDeadLetterPayload, NewsImportJobPayload } from '@kurvenfunk/types';

const database = {
  importJob: { findUnique: jest.fn() },
  auditLog: { create: jest.fn() },
  $disconnect: jest.fn(),
};

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => database,
}));

import { ImportReplayService } from './import-replay.service';

describe('ImportReplayService', () => {
  const sourceId = '6acd0c29-5a64-4a7b-a408-37d490ebddef';
  const actorId = 'a8c5f64a-4ae5-4af1-9b64-99dd8ddc0edb';
  const sourceQueueId = 'repeat:news-import-ots:1730';
  const hash = createHash('sha256').update(sourceQueueId).digest('hex');
  const deadLetterId = `news-import-dead-${hash}`;
  const replayQueueId = `news-import-replay-${hash}`;

  const add = jest.fn();
  const getReplay = jest.fn();
  const getDeadLetter = jest.fn();

  let service: ImportReplayService;

  beforeEach(() => {
    jest.clearAllMocks();

    database.importJob.findUnique.mockResolvedValue({
      id: sourceId,
      kind: 'NEWS_FETCH',
      status: 'DEAD_LETTER',
      queueJobId: sourceQueueId,
      windowStart: new Date('2026-11-05T08:00:00.000Z'),
      windowEnd: new Date('2026-11-05T08:15:00.000Z'),
      provider: { key: 'ots', status: 'ACTIVE' },
    });

    getReplay.mockResolvedValue(null);
    getDeadLetter.mockResolvedValue({
      data: {
        originalQueue: 'news-import',
        originalJobId: sourceQueueId,
        originalJobName: 'fetch-provider',
        originalData: {
          providerKey: 'ots',
          lookbackMinutes: 15,
        },
      },
    });
    add.mockResolvedValue({ id: replayQueueId });
    database.auditLog.create.mockResolvedValue({ id: 'audit-1' });

    service = new ImportReplayService(
      { add, getJob: getReplay } as unknown as Queue<NewsImportJobPayload>,
      { getJob: getDeadLetter } as unknown as Queue<NewsImportDeadLetterPayload>,
    );
  });

  it('replays the exact source window, preserves lineage, and audits the admin action', async () => {
    const result = await service.replayDeadLetter(sourceId, actorId);

    expect(getDeadLetter).toHaveBeenCalledWith(deadLetterId);
    expect(getReplay).toHaveBeenCalledWith(replayQueueId);
    expect(add).toHaveBeenCalledWith(
      'fetch-provider',
      {
        providerKey: 'ots',
        lookbackMinutes: 15,
        windowStart: '2026-11-05T08:00:00.000Z',
        windowEnd: '2026-11-05T08:15:00.000Z',
        retryOfImportJobId: sourceId,
      },
      expect.objectContaining({
        jobId: replayQueueId,
        attempts: 3,
      }),
    );
    expect(database.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: actorId,
        action: 'ADMIN_CORRECTION',
        reason: 'MANUAL_NEWS_IMPORT_REPLAY',
        targetId: sourceId,
      }),
    });
    expect(result).toEqual({
      sourceImportJobId: sourceId,
      queueJobId: replayQueueId,
      alreadyQueued: false,
    });
  });

  it('uses a stable queue ID to avoid replaying twice', async () => {
    getReplay.mockResolvedValue({ id: replayQueueId });

    expect(await service.replayDeadLetter(sourceId, actorId)).toEqual({
      sourceImportJobId: sourceId,
      queueJobId: replayQueueId,
      alreadyQueued: true,
    });
    expect(add).not.toHaveBeenCalled();
    expect(database.auditLog.create).not.toHaveBeenCalled();
  });

  it('refuses to replay a job that is not dead-lettered', async () => {
    database.importJob.findUnique.mockResolvedValue({
      id: sourceId,
      kind: 'NEWS_FETCH',
      status: 'FAILED',
      queueJobId: sourceQueueId,
      provider: { key: 'ots', status: 'ACTIVE' },
    });

    await expect(service.replayDeadLetter(sourceId, actorId)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(add).not.toHaveBeenCalled();
  });

  it('refuses a provider that has been disabled', async () => {
    database.importJob.findUnique.mockResolvedValue({
      id: sourceId,
      kind: 'NEWS_FETCH',
      status: 'DEAD_LETTER',
      queueJobId: sourceQueueId,
      provider: { key: 'ots', status: 'DISABLED' },
    });

    await expect(service.replayDeadLetter(sourceId, actorId)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(add).not.toHaveBeenCalled();
  });

  it('does not replay a missing or unrelated dead-letter entry', async () => {
    getDeadLetter.mockResolvedValue({ data: { originalJobId: 'wrong' } });

    await expect(service.replayDeadLetter(sourceId, actorId)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(add).not.toHaveBeenCalled();
  });

  it('does not replay corrupted or mismatched provider data', async () => {
    getDeadLetter.mockResolvedValue({
      data: {
        originalQueue: 'news-import',
        originalJobId: sourceQueueId,
        originalJobName: 'fetch-provider',
        originalData: { providerKey: 'not-ots' },
      },
    });

    await expect(service.replayDeadLetter(sourceId, actorId)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(add).not.toHaveBeenCalled();
  });

  it('rejects Redis failures without claiming the replay was queued', async () => {
    add.mockRejectedValueOnce(new Error('Connection refused'));

    await expect(service.replayDeadLetter(sourceId, actorId)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(database.auditLog.create).not.toHaveBeenCalled();
  });

  it('disconnects its Prisma client on shutdown', async () => {
    await service.onModuleDestroy();
    expect(database.$disconnect).toHaveBeenCalledTimes(1);
  });
});
