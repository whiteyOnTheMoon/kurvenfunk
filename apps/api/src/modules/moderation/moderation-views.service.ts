import { Injectable, NotFoundException, type OnModuleDestroy } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

@Injectable()
export class ModerationViewsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async dashboard() {
    const now = new Date();

    const [
      openReports,
      activeYellowCards,
      activeRedCards,
      limitedUsers,
      bannedUsers,
      activeIPBlocks,
      openAppeals,
      recentReports,
      recentCards,
      recentAppeals,
    ] = await Promise.all([
      this.database.moderationReport.count({ where: { status: 'OPEN' } }),
      this.database.moderationCard.count({
        where: {
          type: 'YELLOW',
          status: 'ACTIVE',
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      this.database.moderationCard.count({
        where: {
          type: 'RED',
          status: 'ACTIVE',
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      this.database.user.count({ where: { status: 'LIMITED' } }),
      this.database.user.count({ where: { status: 'BANNED' } }),
      this.database.iPBlock.count({
        where: {
          active: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      this.database.appeal.count({ where: { status: 'OPEN' } }),
      this.database.moderationReport.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          targetType: true,
          reason: true,
          status: true,
          createdAt: true,
          reportedUserId: true,
        },
      }),
      this.database.moderationCard.findMany({
        orderBy: { issuedAt: 'desc' },
        take: 12,
        select: {
          id: true,
          userId: true,
          type: true,
          status: true,
          reasonCode: true,
          issuedAt: true,
        },
      }),
      this.database.appeal.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          userId: true,
          status: true,
          moderationCardId: true,
          sanctionId: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      counts: {
        openReports,
        activeYellowCards,
        activeRedCards,
        limitedUsers,
        bannedUsers,
        activeIPBlocks,
        openAppeals,
      },
      recentReports,
      recentCards,
      recentAppeals,
    };
  }

  async userHistory(userId: string) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, status: true },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'MODERATION_USER_NOT_FOUND',
        message: 'User not found.',
      });
    }

    const [reports, cards, sanctions, appeals, statusEvents] = await Promise.all([
      this.database.moderationReport.findMany({
        where: {
          OR: [
            { reportedUserId: userId },
            { comment: { authorId: userId } },
            { post: { authorId: userId } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          reason: true,
          details: true,
          status: true,
          moderatorNote: true,
          assignedModeratorId: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
      this.database.moderationCard.findMany({
        where: { userId },
        orderBy: { issuedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          type: true,
          status: true,
          reasonCode: true,
          moderatorNote: true,
          sourceType: true,
          sourceId: true,
          moderatorId: true,
          escalationSource: true,
          issuedAt: true,
          expiresAt: true,
          revokedAt: true,
          revocationReason: true,
        },
      }),
      this.database.sanction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          type: true,
          status: true,
          reasonCode: true,
          internalNote: true,
          sourceCardId: true,
          ipBlock: { select: { active: true, expiresAt: true } },
          startsAt: true,
          expiresAt: true,
          revokedAt: true,
          revocationReason: true,
          createdById: true,
        },
      }),
      this.database.appeal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          moderationCardId: true,
          sanctionId: true,
          reason: true,
          status: true,
          decisionNote: true,
          reviewedById: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
      this.database.auditLog.findMany({
        where: { targetUserId: userId, action: 'USER_STATUS_CHANGED' },
        orderBy: { occurredAt: 'desc' },
        take: 100,
        select: {
          id: true,
          actorType: true,
          actorUserId: true,
          action: true,
          reason: true,
          metadata: true,
          occurredAt: true,
        },
      }),
    ]);

    return {
      user,
      reports,
      cards,
      sanctions,
      appeals,
      statusEvents,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
