import { Injectable, NotFoundException, type OnModuleDestroy } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

/**
 * Read-only aggregate dashboard and account moderation history.
 * Both routes require a real moderator permission; never expose the data publicly.
 */
@Injectable()
export class ModerationInsightsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async dashboard() {
    const now = new Date();
    const [
      reportsOpen,
      reportsInReview,
      yellowCardsActive,
      redCardsActive,
      usersLimited,
      usersBanned,
      ipBlocksActive,
      sanctionsActive,
      recentCards,
      recentReports,
    ] = await Promise.all([
      this.database.moderationReport.count({ where: { status: 'OPEN' } }),
      this.database.moderationReport.count({ where: { status: 'IN_REVIEW' } }),
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
      this.database.sanction.count({
        where: {
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      this.database.moderationCard.findMany({
        orderBy: { issuedAt: 'desc' },
        take: 15,
        select: {
          id: true,
          userId: true,
          type: true,
          status: true,
          reasonCode: true,
          issuedAt: true,
          escalationSource: true,
          user: { select: { nickname: true, status: true } },
        },
      }),
      this.database.moderationReport.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          reporterId: true,
          reportedUserId: true,
          targetType: true,
          reason: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      counts: {
        reportsOpen,
        reportsInReview,
        yellowCardsActive,
        redCardsActive,
        usersLimited,
        usersBanned,
        ipBlocksActive,
        sanctionsActive,
      },
      recentCards,
      recentReports,
      generatedAt: now,
    };
  }

  async userHistory(userId: string) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, status: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'MODERATION_USER_NOT_FOUND',
        message: 'Target user not found.',
      });
    }

    const [reportsReceived, reportsCreated, cards, sanctions, auditEvents] = await Promise.all([
      this.database.moderationReport.findMany({
        where: { reportedUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          targetType: true,
          reason: true,
          details: true,
          status: true,
          resolution: true,
          moderatorNote: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
      this.database.moderationReport.findMany({
        where: { reporterId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          targetType: true,
          reason: true,
          status: true,
          createdAt: true,
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
          userMessage: true,
          moderatorNote: true,
          moderatorId: true,
          sourceType: true,
          sourceId: true,
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
          userMessage: true,
          internalNote: true,
          createdById: true,
          startsAt: true,
          expiresAt: true,
          revokedAt: true,
          revocationReason: true,
          sourceCardId: true,
          ipBlockId: true,
        },
      }),
      this.database.auditLog.findMany({
        where: { targetUserId: userId },
        orderBy: { occurredAt: 'desc' },
        take: 100,
        select: {
          id: true,
          occurredAt: true,
          actorType: true,
          actorUserId: true,
          action: true,
          category: true,
          reason: true,
          metadata: true,
        },
      }),
    ]);

    return {
      user,
      reportsReceived,
      reportsCreated,
      cards,
      sanctions,
      auditEvents,
      historyLimit: { reports: 50, cards: 100, sanctions: 100, audit: 100 },
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
