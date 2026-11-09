import 'reflect-metadata';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { NotFoundException } from '@nestjs/common';

import {
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
} from '../permissions/permissions.constants';
import { PermissionsService } from '../permissions/permissions.service';

import { UserModerationHistoryController } from './user-moderation-history.controller';
import { UserModerationHistoryService } from './user-moderation-history.service';

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));
jest.mock('../auth/auth.guard', () => ({
  AuthGuard: jest.fn(),
}));

const USER = '11111111-1111-4111-8111-111111111111';

describe('Task 188 – private, account-scoped history', () => {
  let database: {
    user: { findUnique: jest.Mock };
    moderationReport: { findMany: jest.Mock };
    moderationCard: { findMany: jest.Mock };
    sanction: { findMany: jest.Mock };
    auditLog: { findMany: jest.Mock };
    $disconnect: jest.Mock;
  };
  let histories: UserModerationHistoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    database = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: USER,
          nickname: 'Synthetic user',
          status: 'BANNED',
          createdAt: new Date(),
        }),
      },
      moderationReport: { findMany: jest.fn().mockResolvedValue([]) },
      moderationCard: { findMany: jest.fn().mockResolvedValue([]) },
      sanction: { findMany: jest.fn().mockResolvedValue([]) },
      auditLog: { findMany: jest.fn().mockResolvedValue([]) },
      $disconnect: jest.fn().mockResolvedValue(undefined),
    };
    jest.mocked(createPrismaClient).mockReturnValue(database as unknown as DatabaseClient);
    histories = new UserModerationHistoryService();
  });

  it('requires user.warn and denies all ordinary, inactive, banned and limited identities', () => {
    const handler: unknown = Object.getOwnPropertyDescriptor(
      UserModerationHistoryController.prototype,
      'getUserHistory',
    )?.value;
    expect(typeof handler).toBe('function');
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, handler as object)).toEqual([
      PERMISSIONS.USER_WARN,
    ]);

    const policy = new PermissionsService();
    for (const role of ['USER', 'TRUSTED_USER', 'EDITOR'] as const) {
      expect(policy.hasPermission({ roles: [role], status: 'ACTIVE' }, PERMISSIONS.USER_WARN)).toBe(
        false,
      );
    }
    for (const role of ['MODERATOR', 'ADMIN', 'SUPERADMIN'] as const) {
      expect(policy.hasPermission({ roles: [role], status: 'ACTIVE' }, PERMISSIONS.USER_WARN)).toBe(
        true,
      );
      for (const status of ['LIMITED', 'BANNED'] as const) {
        expect(policy.hasPermission({ roles: [role], status }, PERMISSIONS.USER_WARN)).toBe(false);
      }
    }
  });

  it('selects only the specified target, bounded records and no IP-block or audit metadata', async () => {
    const result = await histories.history(USER);
    expect(result.user).toMatchObject({ id: USER, status: 'BANNED' });
    expect(result.privacy).toEqual({ restrictedTo: 'user.warn', ipDetails: false });
    expect(database.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER },
      select: { id: true, nickname: true, status: true, createdAt: true },
    });

    const reportQuery = (database.moderationReport.findMany.mock.calls as unknown[][])[0]?.[0] as {
      where: { OR: unknown[] };
      take: number;
      select: Record<string, boolean>;
    };
    expect(reportQuery.take).toBe(51);
    expect(reportQuery.where.OR).toEqual([
      { reportedUserId: USER },
      { comment: { authorId: USER } },
      { post: { authorId: USER } },
    ]);
    expect(reportQuery.select.moderatorNote).toBe(true);
    expect(reportQuery.select.details).toBe(true);
    expect(reportQuery.select).not.toHaveProperty('reporterId');

    const cardQuery = (database.moderationCard.findMany.mock.calls as unknown[][])[0]?.[0] as {
      where: { userId: string };
      take: number;
      select: Record<string, boolean>;
    };
    expect(cardQuery.where.userId).toBe(USER);
    expect(cardQuery.take).toBe(51);
    expect(cardQuery.select.moderatorNote).toBe(true);

    const sanctionQuery = (database.sanction.findMany.mock.calls as unknown[][])[0]?.[0] as {
      where: { userId: string; type: { not: string } };
      take: number;
      select: Record<string, boolean>;
    };
    expect(sanctionQuery.where).toEqual({ userId: USER, type: { not: 'IP_BLOCK' } });
    expect(sanctionQuery.take).toBe(51);
    expect(sanctionQuery.select.internalNote).toBe(true);
    expect(sanctionQuery.select).not.toHaveProperty('ipBlock');

    const eventsQuery = (database.auditLog.findMany.mock.calls as unknown[][])[0]?.[0] as {
      where: { targetUserId: string; action: string };
      take: number;
      select: Record<string, boolean>;
    };
    expect(eventsQuery.where).toEqual({ targetUserId: USER, action: 'USER_STATUS_CHANGED' });
    expect(eventsQuery.take).toBe(51);
    for (const forbidden of [
      'metadata',
      'reason',
      'ipBlockId',
      'requestId',
      'correlationId',
      'actorLabel',
    ]) {
      expect(eventsQuery.select).not.toHaveProperty(forbidden);
    }
  });

  it('returns at most 50 entries per list, with explicit hasMore when truncated', async () => {
    database.moderationCard.findMany.mockResolvedValue(
      Array.from({ length: 51 }, (_, id) => ({ id: String(id), moderatorNote: 'Private' })),
    );
    const result = await histories.history(USER);
    expect(result.cards.items).toHaveLength(50);
    expect(result.cards.hasMore).toBe(true);
    expect(result.cards.items[0]).toEqual({ id: '0', moderatorNote: 'Private' });
    expect(result.reports).toEqual({ items: [], hasMore: false });
  });

  it('returns 404 without querying confidential events for a missing account', async () => {
    database.user.findUnique.mockResolvedValue(null);
    await expect(histories.history(USER)).rejects.toBeInstanceOf(NotFoundException);
    expect(database.moderationReport.findMany).not.toHaveBeenCalled();
    expect(database.auditLog.findMany).not.toHaveBeenCalled();
  });

  it('forwards only the validated target UUID to the service and disconnects', async () => {
    const history = jest.fn().mockResolvedValue({ user: { id: USER } });
    const controller = new UserModerationHistoryController({
      history,
    } as unknown as UserModerationHistoryService);
    expect(await controller.getUserHistory(USER)).toEqual({ user: { id: USER } });
    expect(history).toHaveBeenCalledWith(USER);
    await histories.onModuleDestroy();
    expect(database.$disconnect).toHaveBeenCalledTimes(1);
  });
});
