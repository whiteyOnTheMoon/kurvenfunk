// The worker's database wrapper imports a generated ESM Prisma client.
// Mock it so this unit suite remains isolated from runtime database loading.
jest.mock('../database/database.service', () => ({
  DatabaseService: class DatabaseService {},
}));

import type { DatabaseService } from '../database/database.service';

import { SanctionExpirationService } from './sanction-expiration.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SANCTION_ID = '22222222-2222-4222-8222-222222222222';
const BLOCK_ID = '33333333-3333-4333-8333-333333333333';

function createDb() {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: USER_ID, status: 'LIMITED' }]),
    sanction: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    user: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    moderationCard: { count: jest.fn().mockResolvedValue(0) },
    auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit' }) },
    iPBlock: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  };
  const db = {
    sanction: { findMany: jest.fn().mockResolvedValue([]) },
    iPBlock: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
  };
  return { tx, db };
}

describe('SanctionExpirationService', () => {
  const expiredAt = new Date('2026-10-17T10:00:00.000Z');
  const now = new Date('2026-10-18T10:00:00.000Z');

  let service: SanctionExpirationService;
  let tx: ReturnType<typeof createDb>['tx'];
  let db: ReturnType<typeof createDb>['db'];

  beforeEach(() => {
    jest.clearAllMocks();
    ({ tx, db } = createDb());
    service = new SanctionExpirationService({ client: db } as unknown as DatabaseService);
  });

  it('expires LIMITED, restores ACTIVE and records both audit events', async () => {
    db.sanction.findMany.mockResolvedValueOnce([
      {
        id: SANCTION_ID,
        userId: USER_ID,
        type: 'LIMITED',
        expiresAt: expiredAt,
      },
    ]);

    await service.expireDueSanctions(now);

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.sanction.updateMany).toHaveBeenCalledWith({
      where: { id: SANCTION_ID, status: 'ACTIVE', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    });
    expect(tx.sanction.count).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        type: 'LIMITED',
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
    expect(tx.sanction.count).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        type: 'ACCOUNT_BAN',
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
    expect(tx.moderationCard.count).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        type: 'RED',
        status: 'ACTIVE',
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: USER_ID, status: 'LIMITED' },
      data: { status: 'ACTIVE' },
    });
    expect(tx.auditLog.create).toHaveBeenCalledTimes(2);
  });

  it('keeps LIMITED if another active LIMITED sanction remains', async () => {
    db.sanction.findMany.mockResolvedValueOnce([
      {
        id: SANCTION_ID,
        userId: USER_ID,
        type: 'LIMITED',
      },
    ]);
    tx.sanction.count.mockResolvedValueOnce(1);

    await service.expireDueSanctions(now);

    expect(tx.user.updateMany).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('does not lift LIMITED when an active ACCOUNT_BAN exists despite an inconsistent status', async () => {
    db.sanction.findMany.mockResolvedValueOnce([
      { id: SANCTION_ID, userId: USER_ID, type: 'LIMITED' },
    ]);
    tx.sanction.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);

    await service.expireDueSanctions(now);

    expect(tx.user.updateMany).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('does not lift LIMITED when an active RED card exists despite an inconsistent status', async () => {
    db.sanction.findMany.mockResolvedValueOnce([
      { id: SANCTION_ID, userId: USER_ID, type: 'LIMITED' },
    ]);
    tx.moderationCard.count.mockResolvedValueOnce(1);

    await service.expireDueSanctions(now);

    expect(tx.user.updateMany).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('never reactivates a BANNED user after a LIMITED expiry', async () => {
    db.sanction.findMany.mockResolvedValueOnce([
      {
        id: SANCTION_ID,
        userId: USER_ID,
        type: 'LIMITED',
      },
    ]);
    tx.$queryRaw.mockResolvedValueOnce([{ id: USER_ID, status: 'BANNED' }]);

    await service.expireDueSanctions(now);

    expect(tx.user.updateMany).not.toHaveBeenCalled();
  });

  it('does not repeat audit logs for already expired sanctions', async () => {
    db.sanction.findMany.mockResolvedValueOnce([
      {
        id: SANCTION_ID,
        userId: USER_ID,
        type: 'LIMITED',
      },
    ]);
    tx.sanction.updateMany.mockResolvedValueOnce({ count: 0 });

    await service.expireDueSanctions(now);

    expect(tx.auditLog.create).not.toHaveBeenCalled();
    expect(tx.user.updateMany).not.toHaveBeenCalled();
  });

  it('expires COMMENT_BLOCK and FORUM_BLOCK without changing account status', async () => {
    db.sanction.findMany.mockResolvedValueOnce([
      { id: SANCTION_ID, userId: USER_ID, type: 'COMMENT_BLOCK' },
      { id: '55555555-5555-4555-8555-555555555555', userId: USER_ID, type: 'FORUM_BLOCK' },
    ]);

    await service.expireDueSanctions(now);

    expect(tx.sanction.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.user.updateMany).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledTimes(2);
  });

  it('expires IP blocks and their associated sanction with audit events', async () => {
    db.iPBlock.findMany.mockResolvedValueOnce([{ id: BLOCK_ID }]);
    tx.sanction.findUnique.mockResolvedValueOnce({ id: SANCTION_ID });

    await service.expireDueSanctions(now);

    expect(tx.iPBlock.updateMany).toHaveBeenCalledWith({
      where: { id: BLOCK_ID, active: true, expiresAt: { lte: now } },
      data: { active: false, deactivatedAt: now, deactivationReason: 'EXPIRED' },
    });
    expect(tx.sanction.updateMany).toHaveBeenCalledWith({
      where: { id: SANCTION_ID, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });
    expect(tx.auditLog.create).toHaveBeenCalledTimes(2);
  });

  it('does not falsely audit an inactive linked IP sanction when the block expires', async () => {
    db.iPBlock.findMany.mockResolvedValueOnce([{ id: BLOCK_ID }]);
    tx.sanction.findUnique.mockResolvedValueOnce({ id: SANCTION_ID });
    tx.sanction.updateMany.mockResolvedValueOnce({ count: 0 });

    await service.expireDueSanctions(now);

    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
    const auditArgs = (tx.auditLog.create.mock.calls as unknown[][])[0]?.[0] as {
      data: { action: string; ipBlockId: string };
    };
    expect(auditArgs.data).toMatchObject({ action: 'IP_BLOCK_EXPIRED', ipBlockId: BLOCK_ID });
  });

  it('recovers an overdue sanction at worker startup and stops its timer on shutdown', async () => {
    jest.useFakeTimers();
    const spy = jest.spyOn(service, 'expireDueSanctions').mockResolvedValue(undefined);
    try {
      service.onModuleInit();
      await Promise.resolve();
      expect(spy).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(60_000);
      expect(spy).toHaveBeenCalledTimes(2);
      service.onModuleDestroy();
      await jest.advanceTimersByTimeAsync(60_000);
      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      service.onModuleDestroy();
      spy.mockRestore();
      jest.useRealTimers();
    }
  });

  it('skips already deactivated IP blocks', async () => {
    db.iPBlock.findMany.mockResolvedValueOnce([{ id: BLOCK_ID }]);
    tx.iPBlock.updateMany.mockResolvedValueOnce({ count: 0 });

    await service.expireDueSanctions(now);

    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it('does not overlap concurrent scans', async () => {
    let release!: () => void;
    db.sanction.findMany.mockImplementationOnce(
      () =>
        new Promise<[]>((resolve) => {
          release = () => resolve([]);
        }),
    );
    const first = service.expireDueSanctions(now);
    await service.expireDueSanctions(now);
    expect(db.sanction.findMany).toHaveBeenCalledTimes(1);
    release();
    await first;
  });

  it('stops the retry timer without affecting the database', () => {
    expect(() => service.onModuleDestroy()).not.toThrow();
  });
});
