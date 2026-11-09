import { createHmac, randomBytes } from 'node:crypto';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import type { DatabaseService as WorkerDatabaseService } from '../../worker/src/database/database.service';
import { SanctionExpirationService } from '../../worker/src/services/sanction-expiration.service';

describe('Task 191 – isolated PostgreSQL sanction expiration, recovery and concurrency', () => {
  let db: DatabaseClient;
  const marker = randomBytes(8).toString('hex');
  const users: string[] = [];
  const sanctions: string[] = [];
  const blocks: string[] = [];
  const cards: string[] = [];
  const deadline = new Date(Date.now() - 120_000);
  const future = new Date(Date.now() + 3_600_000);
  const userIds: Record<string, string> = {};
  const sanctionIds: Record<string, string> = {};
  const blockIds: Record<string, string> = {};

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      url.hostname !== '127.0.0.1' ||
      url.pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('P191_REQUIRES_DISPOSABLE_POSTGRES_AND_REDIS');
    }

    db = createPrismaClient();
    for (const [name, status] of [
      ['restore', 'LIMITED'],
      ['overlap', 'LIMITED'],
      ['ban', 'LIMITED'],
      ['red', 'LIMITED'],
      ['banned', 'BANNED'],
    ] as const) {
      const user = await db.user.create({
        data: {
          keycloakSubject: 'p191-' + name + '-' + marker,
          nickname: 'p191' + name + marker,
          status,
          onboardingCompleted: true,
        },
        select: { id: true },
      });
      userIds[name] = user.id;
      users.push(user.id);
    }

    for (const [name, user, type, expiresAt, status] of [
      ['restore', 'restore', 'LIMITED', deadline, 'ACTIVE'],
      ['comment', 'restore', 'COMMENT_BLOCK', deadline, 'ACTIVE'],
      ['forum', 'restore', 'FORUM_BLOCK', deadline, 'ACTIVE'],
      ['overlapExpired', 'overlap', 'LIMITED', deadline, 'ACTIVE'],
      ['overlapFuture', 'overlap', 'LIMITED', future, 'ACTIVE'],
      ['banExpired', 'ban', 'LIMITED', deadline, 'ACTIVE'],
      ['banActive', 'ban', 'ACCOUNT_BAN', future, 'ACTIVE'],
      ['redExpired', 'red', 'LIMITED', deadline, 'ACTIVE'],
      ['bannedExpired', 'banned', 'LIMITED', deadline, 'ACTIVE'],
    ] as const) {
      const record = await db.sanction.create({
        data: {
          userId: userIds[user],
          type,
          status,
          reasonCode: 'P191_SYNTHETIC',
          startsAt: new Date(deadline.getTime() - 10_000),
          expiresAt,
        },
        select: { id: true },
      });
      sanctionIds[name] = record.id;
      sanctions.push(record.id);
    }

    const red = await db.moderationCard.create({
      data: {
        userId: userIds.red,
        type: 'RED',
        status: 'ACTIVE',
        reasonCode: 'P191_KEEP_RED',
      },
      select: { id: true },
    });
    cards.push(red.id);

    for (const [name, sanctionStatus] of [
      ['expired', 'ACTIVE'],
      ['priorRevoked', 'REVOKED'],
    ] as const) {
      // RFC 5737 documentation IP and a disposable HMAC secret; no real IP.
      const hash = createHmac('sha256', randomBytes(32)).update('192.0.2.191').digest('hex');
      const block = await db.iPBlock.create({
        data: {
          ipHash: hash,
          hashKeyVersion: 'v1',
          reasonCode: 'P191_SYNTHETIC',
          source: 'MANUAL',
          active: true,
          expiresAt: deadline,
        },
        select: { id: true },
      });
      blocks.push(block.id);
      blockIds[name] = block.id;
      const linked = await db.sanction.create({
        data: {
          type: 'IP_BLOCK',
          status: sanctionStatus,
          reasonCode: 'P191_SYNTHETIC',
          ipBlockId: block.id,
          expiresAt: deadline,
        },
        select: { id: true },
      });
      sanctions.push(linked.id);
      sanctionIds[name] = linked.id;
    }
  }, 30000);

  afterAll(async () => {
    if (!db) return;
    try {
      await db.auditLog.deleteMany({
        where: {
          OR: [
            { targetUserId: { in: users } },
            { sanctionId: { in: sanctions } },
            { ipBlockId: { in: blocks } },
          ],
        },
      });
      await db.notification.deleteMany({ where: { userId: { in: users } } });
      await db.appeal.deleteMany({ where: { userId: { in: users } } });
      await db.sanction.deleteMany({ where: { id: { in: sanctions } } });
      await db.moderationCard.deleteMany({ where: { id: { in: cards } } });
      await db.iPBlock.deleteMany({ where: { id: { in: blocks } } });
      await db.userRoleAssignment.deleteMany({ where: { userId: { in: users } } });
      await db.user.deleteMany({ where: { id: { in: users } } });
    } finally {
      await db.$disconnect();
    }
  }, 30000);

  it('expires safely under concurrent scans and remains idempotent after restart', async () => {
    const first = new SanctionExpirationService({ client: db } as WorkerDatabaseService);
    const second = new SanctionExpirationService({ client: db } as WorkerDatabaseService);
    await Promise.all([first.expireDueSanctions(), second.expireDueSanctions()]);
    // A newly constructed worker must resume without any in-process scan state.
    const recovered = new SanctionExpirationService({ client: db } as WorkerDatabaseService);
    await recovered.expireDueSanctions();

    for (const name of [
      'restore',
      'comment',
      'forum',
      'overlapExpired',
      'banExpired',
      'redExpired',
      'bannedExpired',
      'expired',
    ]) {
      expect(
        (await db.sanction.findUniqueOrThrow({ where: { id: sanctionIds[name] } })).status,
      ).toBe('EXPIRED');
      expect(
        await db.auditLog.count({
          where: { sanctionId: sanctionIds[name], action: 'SANCTION_EXPIRED' },
        }),
      ).toBe(1);
    }
    for (const name of ['overlapFuture', 'banActive']) {
      expect(
        (await db.sanction.findUniqueOrThrow({ where: { id: sanctionIds[name] } })).status,
      ).toBe('ACTIVE');
    }
    expect(
      (
        await db.sanction.findUniqueOrThrow({
          where: { id: sanctionIds.priorRevoked },
        })
      ).status,
    ).toBe('REVOKED');
    expect(
      await db.auditLog.count({
        where: { sanctionId: sanctionIds.priorRevoked, action: 'SANCTION_EXPIRED' },
      }),
    ).toBe(0);

    for (const name of ['expired', 'priorRevoked']) {
      expect((await db.iPBlock.findUniqueOrThrow({ where: { id: blockIds[name] } })).active).toBe(
        false,
      );
      expect(
        await db.auditLog.count({
          where: { ipBlockId: blockIds[name], action: 'IP_BLOCK_EXPIRED' },
        }),
      ).toBe(1);
    }

    expect((await db.user.findUniqueOrThrow({ where: { id: userIds.restore } })).status).toBe(
      'ACTIVE',
    );
    for (const name of ['overlap', 'ban', 'red']) {
      expect((await db.user.findUniqueOrThrow({ where: { id: userIds[name] } })).status).toBe(
        'LIMITED',
      );
    }
    expect((await db.user.findUniqueOrThrow({ where: { id: userIds.banned } })).status).toBe(
      'BANNED',
    );
    expect(
      await db.auditLog.count({
        where: {
          targetUserId: userIds.restore,
          action: 'USER_STATUS_CHANGED',
          reason: 'LIMITED_EXPIRED',
        },
      }),
    ).toBe(1);
    for (const name of ['overlap', 'ban', 'red', 'banned']) {
      expect(
        await db.auditLog.count({
          where: {
            targetUserId: userIds[name],
            action: 'USER_STATUS_CHANGED',
            reason: 'LIMITED_EXPIRED',
          },
        }),
      ).toBe(0);
    }
  }, 30000);
});
