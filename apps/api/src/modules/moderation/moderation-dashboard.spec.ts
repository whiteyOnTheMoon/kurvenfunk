import 'reflect-metadata';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import {
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
} from '../permissions/permissions.constants';
import { PermissionsService } from '../permissions/permissions.service';

import { ModerationDashboardController } from './moderation-dashboard.controller';
import { ModerationDashboardService } from './moderation-dashboard.service';

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

describe('Task 187 moderation dashboard authorization and privacy', () => {
  let database: {
    moderationReport: { count: jest.Mock; findMany: jest.Mock };
    moderationCard: { count: jest.Mock; findMany: jest.Mock };
    sanction: { count: jest.Mock; findMany: jest.Mock };
    user: { count: jest.Mock };
    iPBlock: { count: jest.Mock; findMany: jest.Mock };
    $disconnect: jest.Mock;
  };
  let service: ModerationDashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    database = {
      moderationReport: {
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue([]),
      },
      moderationCard: {
        count: jest.fn().mockResolvedValue(3),
        findMany: jest.fn().mockResolvedValue([]),
      },
      sanction: {
        count: jest.fn().mockResolvedValue(4),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: { count: jest.fn().mockResolvedValue(5) },
      iPBlock: {
        count: jest.fn().mockResolvedValue(6),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $disconnect: jest.fn().mockResolvedValue(undefined),
    };
    jest.mocked(createPrismaClient).mockReturnValue(database as unknown as DatabaseClient);
    service = new ModerationDashboardService();
  });

  it('enforces moderator-only overview and SUPERADMIN-only network summary', () => {
    const permissions = new PermissionsService();

    for (const [handler, required] of [
      ['overview', PERMISSIONS.USER_WARN],
      ['ipBlocksSummary', PERMISSIONS.USER_IPBAN],
    ] as const) {
      const method: unknown = Object.getOwnPropertyDescriptor(
        ModerationDashboardController.prototype,
        handler,
      )?.value;
      expect(typeof method).toBe('function');
      expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, method as object)).toEqual([
        required,
      ]);
    }

    for (const role of ['USER', 'TRUSTED_USER', 'EDITOR'] as const) {
      expect(permissions.hasPermission({ status: 'ACTIVE', roles: [role] }, PERMISSIONS.USER_WARN))
        .toBe(false);
    }
    expect(
      permissions.hasPermission(
        { status: 'ACTIVE', roles: ['MODERATOR'] },
        PERMISSIONS.USER_WARN,
      ),
    ).toBe(true);
    expect(
      permissions.hasPermission(
        { status: 'ACTIVE', roles: ['ADMIN'] },
        PERMISSIONS.USER_IPBAN,
      ),
    ).toBe(false);
    expect(
      permissions.hasPermission(
        { status: 'ACTIVE', roles: ['MODERATOR'] },
        PERMISSIONS.USER_IPBAN,
      ),
    ).toBe(false);
    expect(
      permissions.hasPermission(
        { status: 'ACTIVE', roles: ['SUPERADMIN'] },
        PERMISSIONS.USER_IPBAN,
      ),
    ).toBe(true);
    for (const status of ['LIMITED', 'BANNED'] as const) {
      expect(permissions.hasPermission({ status, roles: ['SUPERADMIN'] }, PERMISSIONS.USER_WARN))
        .toBe(false);
      expect(permissions.hasPermission({ status, roles: ['SUPERADMIN'] }, PERMISSIONS.USER_IPBAN))
        .toBe(false);
    }
  });

  it('dashboard counts pending and unexpired records, excluding IP data and appeal inventions', async () => {
    const result = await service.overview();
    expect(result.counts).toEqual({
      pendingReports: 2,
      activeYellowCards: 3,
      activeRedCards: 3,
      limitedUsers: 5,
      bannedUsers: 5,
      activeLimitedSanctions: 4,
    });
    expect(result.appeals).toEqual({ available: false, trackingTask: '20.189' });
    expect(result.ipBlocks).toEqual({ access: 'SUPERADMIN_ONLY' });
    expect(database.iPBlock.count).not.toHaveBeenCalled();
    expect(database.iPBlock.findMany).not.toHaveBeenCalled();

    expect(database.moderationReport.count).toHaveBeenCalledWith({
      where: { status: { in: ['OPEN', 'IN_REVIEW'] } },
    });
    const [yellowQuery, redQuery] = database.moderationCard.count.mock.calls.map(
      (args: unknown[]) => args[0] as { where: { type: string; revokedAt: unknown; OR: unknown[] } },
    );
    expect(yellowQuery.where.type).toBe('YELLOW');
    expect(redQuery.where.type).toBe('RED');
    expect(yellowQuery.where.revokedAt).toBeNull();
    expect(redQuery.where.OR).toHaveLength(2);

    const selectionCalls = [
      database.moderationReport.findMany,
      database.moderationCard.findMany,
      database.sanction.findMany,
    ];
    for (const operation of selectionCalls) {
      const options = operation.mock.calls[0][0] as {
        select: Record<string, unknown>;
        take: number;
      };
      expect(options.take).toBe(12);
      expect(Object.keys(options.select)).not.toEqual(
        expect.arrayContaining(['moderatorNote', 'internalNote', 'details', 'metadata']),
      );
      expect(options.select).not.toHaveProperty('moderatorNote');
      expect(options.select).not.toHaveProperty('internalNote');
      expect(options.select).not.toHaveProperty('details');
    }
  });

  it('projects only non-identifying network metadata on its independently gated endpoint', async () => {
    const result = await service.ipBlocksSummary();
    expect(result.counts).toEqual({
      activeBlocks: 6,
      activeManual: 6,
      activeAutomatic: 6,
      activeSanction: 6,
    });
    expect(result.note).toBe('NETWORK_ADDRESS_NOT_DISPLAYED');
    expect(database.moderationCard.findMany).not.toHaveBeenCalled();
    const selection = database.iPBlock.findMany.mock.calls[0][0] as {
      select: Record<string, boolean>;
      take: number;
    };
    expect(selection.take).toBe(12);
    for (const forbidden of [
      'ipHash',
      'hashKeyVersion',
      'internalNote',
      'createdById',
      'deactivationReason',
    ]) {
      expect(selection.select).not.toHaveProperty(forbidden);
    }
    expect(database.iPBlock.count.mock.calls).toHaveLength(4);
    expect(database.iPBlock.count.mock.calls[1][0]).toMatchObject({
      where: { active: true, source: 'MANUAL' },
    });
  });

  it('routes reads into separate service methods and closes the database', async () => {
    const view = jest.fn().mockResolvedValue({ counts: {} });
    const network = jest.fn().mockResolvedValue({ counts: {} });
    const controller = new ModerationDashboardController({
      overview: view,
      ipBlocksSummary: network,
    } as unknown as ModerationDashboardService);
    await controller.overview();
    await controller.ipBlocksSummary();
    expect(view).toHaveBeenCalledTimes(1);
    expect(network).toHaveBeenCalledTimes(1);
    await service.onModuleDestroy();
    expect(database.$disconnect).toHaveBeenCalledTimes(1);
  });
});
