import type { DatabaseClient } from '@kurvenfunk/database';

import type { DatabaseService } from '../database/database.service';
import { SanctionExpirationService } from './sanction-expiration.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SANCTION_ID = '22222222-2222-4222-8222-222222222222';
const IP_BLOCK_ID = '33333333-3333-4333-8333-333333333333';

function transactionClient() {
  return {
    $queryRaw: jest.fn().mockResolvedValue([{ id: USER_ID, status: 'LIMITED' }]),
    sanction: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    iPBlock: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit' }),
    },
    user: {
      update: jest.fn().mockResolvedValue({ id: USER_ID, status: 'ACTIVE' }),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notice' }),
    },
  };
}

function databaseClient() {
  const tx = transactionClient();
  return {
    tx,
    $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    sanction: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    iPBlock: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

describe('SanctionExpirationService', () => {
  let database: ReturnType<typeof databaseClient>;
  let service: SanctionExpirationService;

  beforeEach(() => {
    jest.clearAllMocks();
    database = databaseClient();
    service = new SanctionExpirationService({
      client: database as unknown as DatabaseClient,
    } as DatabaseService);
  });

  it('expires a LIMITED sanction and reactivates the account atomically', async () => {
    database.sanction.findMany.mockResolvedValueOnce([
      { id: SANCTION_ID, userId: USER_ID, type: 'LIMITED' },
    ]);

    await service.scan();

    expect(database.tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(database.tx.sanction.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: SANCTION_ID,
          status: 'ACTIVE',
          expiresAt: expect.any(Object),
        }),
        data: { status: 'EXPIRED' },
      }),
    );
    expect(database.tx.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { status: 'ACTIVE' },
    });
    expect(database.tx.auditLog.create).toHaveBeenCalledTimes(2);
    expect(database.tx.notification.create).toHaveBeenCalledTimes(1);
  });

  it('does not reactivate a banned account on sanction expiry', async () => {
    database.sanction.findMany.mockResolvedValueOnce([
      { id: SANCTION_ID, userId: USER_ID, type: 'LIMITED' },
    ]);
    database.tx.$queryRaw.mockResolvedValueOnce([{ id: USER_ID, status: 'BANNED' }]);

    await service.scan();

    expect(database.tx.sanction.updateMany).toHaveBeenCalledTimes(1);
    expect(database.tx.user.update).not.toHaveBeenCalled();
    expect(database.tx.notification.create).not.toHaveBeenCalled();
  });

  it('does not reactivate if another unexpired LIMITED sanction exists', async () => {
    database.sanction.findMany.mockResolvedValueOnce([
      { id: SANCTION_ID, userId: USER_ID, type: 'LIMITED' },
    ]);
    database.tx.sanction.findFirst.mockResolvedValueOnce({ id: 'other-active' });

    await service.scan();

    expect(database.tx.user.update).not.toHaveBeenCalled();
  });

  it('handles a concurrent prior expiry idempotently', async () => {
    database.sanction.findMany.mockResolvedValueOnce([
      { id: SANCTION_ID, userId: USER_ID, type: 'LIMITED' },
    ]);
    database.tx.sanction.updateMany.mockResolvedValueOnce({ count: 0 });

    await service.scan();

    expect(database.tx.user.update).not.toHaveBeenCalled();
    expect(database.tx.auditLog.create).not.toHaveBeenCalled();
  });

  it('expires COMMENT_BLOCK and FORUM_BLOCK without changing account status', async () => {
    database.sanction.findMany.mockResolvedValueOnce([
      { id: SANCTION_ID, userId: USER_ID, type: 'COMMENT_BLOCK' },
      { id: '44444444-4444-4444-8444-444444444444', userId: USER_ID, type: 'FORUM_BLOCK' },
    ]);

    await service.scan();

    expect(database.tx.sanction.updateMany).toHaveBeenCalledTimes(2);
    expect(database.tx.user.update).not.toHaveBeenCalled();
    expect(database.tx.auditLog.create).toHaveBeenCalledTimes(2);
  });

  it('expires an IP block and any linked IP_BLOCK sanction', async () => {
    database.iPBlock.findMany.mockResolvedValueOnce([{ id: IP_BLOCK_ID }]);
    database.tx.sanction.findFirst.mockResolvedValueOnce({ id: SANCTION_ID });

    await service.scan();

    expect(database.tx.iPBlock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: IP_BLOCK_ID, active: true }),
        data: expect.objectContaining({
          active: false,
          deactivationReason: 'EXPIRED',
        }),
      }),
    );
    expect(database.tx.sanction.updateMany).toHaveBeenCalledWith({
      where: { ipBlockId: IP_BLOCK_ID, type: 'IP_BLOCK', status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });
    expect(database.tx.auditLog.create).toHaveBeenCalledTimes(2);
  });

  it('does not repeat audit when an IP block was already deactivated', async () => {
    database.iPBlock.findMany.mockResolvedValueOnce([{ id: IP_BLOCK_ID }]);
    database.tx.iPBlock.updateMany.mockResolvedValueOnce({ count: 0 });

    await service.scan();

    expect(database.tx.auditLog.create).not.toHaveBeenCalled();
  });
});
