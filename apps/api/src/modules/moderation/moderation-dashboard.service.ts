import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';

/**
 * Task 187 – bounded, read-only moderation overview.
 * The API projects only safe dashboard fields: no evidence, private notes,
 * audit metadata, raw IP or keyed IP pseudonyms leave this service.
 * Appeals do not have a persisted model until Task 189.
 */
@Injectable()
export class ModerationDashboardService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async overview() {
    const now = new Date();
    const activeCard = {
      status: 'ACTIVE' as const,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };
    const [
      pendingReports,
      activeYellowCards,
      activeRedCards,
      limitedUsers,
      bannedUsers,
      activeLimitedSanctions,
      recentReports,
      recentCards,
      recentLimitedSanctions,
    ] = await Promise.all([
      this.database.moderationReport.count({
        where: { status: { in: ['OPEN', 'IN_REVIEW'] } },
      }),
      this.database.moderationCard.count({ where: { type: 'YELLOW', ...activeCard } }),
      this.database.moderationCard.count({ where: { type: 'RED', ...activeCard } }),
      this.database.user.count({ where: { status: 'LIMITED' } }),
      this.database.user.count({ where: { status: 'BANNED' } }),
      this.database.sanction.count({
        where: {
          type: 'LIMITED',
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      this.database.moderationReport.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 12,
        select: {
          id: true,
          targetType: true,
          status: true,
          reason: true,
          createdAt: true,
        },
      }),
      this.database.moderationCard.findMany({
        orderBy: [{ issuedAt: 'desc' }, { id: 'desc' }],
        take: 12,
        select: {
          id: true,
          type: true,
          status: true,
          reasonCode: true,
          issuedAt: true,
          expiresAt: true,
          user: { select: { id: true, nickname: true, status: true } },
        },
      }),
      this.database.sanction.findMany({
        where: { type: 'LIMITED' },
        orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
        take: 12,
        select: {
          id: true,
          status: true,
          reasonCode: true,
          startsAt: true,
          expiresAt: true,
          user: { select: { id: true, nickname: true, status: true } },
        },
      }),
    ]);

    return {
      asOf: now,
      counts: {
        pendingReports,
        activeYellowCards,
        activeRedCards,
        limitedUsers,
        bannedUsers,
        activeLimitedSanctions,
      },
      recentReports,
      recentCards,
      recentLimitedSanctions,
      appeals: { available: false, trackingTask: '20.189' as const },
      ipBlocks: { access: 'SUPERADMIN_ONLY' as const },
    };
  }

  /** Independent SUPERADMIN-only read endpoint. Never reveal HMAC or notes. */
  async ipBlocksSummary() {
    const now = new Date();
    const active = {
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    const [activeBlocks, activeManual, activeAutomatic, activeSanction, recentBlocks] =
      await Promise.all([
        this.database.iPBlock.count({ where: active }),
        this.database.iPBlock.count({ where: { ...active, source: 'MANUAL' } }),
        this.database.iPBlock.count({ where: { ...active, source: 'AUTOMATIC' } }),
        this.database.iPBlock.count({ where: { ...active, source: 'SANCTION' } }),
        this.database.iPBlock.findMany({
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 12,
          select: {
            id: true,
            source: true,
            reasonCode: true,
            active: true,
            startsAt: true,
            expiresAt: true,
            deactivatedAt: true,
          },
        }),
      ]);
    return {
      asOf: now,
      counts: { activeBlocks, activeManual, activeAutomatic, activeSanction },
      recentBlocks,
      note: 'NETWORK_ADDRESS_NOT_DISPLAYED' as const,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
