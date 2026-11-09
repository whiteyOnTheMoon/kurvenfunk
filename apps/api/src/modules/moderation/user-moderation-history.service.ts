import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Injectable, NotFoundException, type OnModuleDestroy } from '@nestjs/common';

const PAGE_LIMIT = 50;
const QUERY_LIMIT = PAGE_LIMIT + 1;

function capped<T>(items: T[]) {
  return { items: items.slice(0, PAGE_LIMIT), hasMore: items.length > PAGE_LIMIT };
}

/**
 * Task 20.188: private, account-scoped, strictly read-only moderation history.
 * The controller is the only public entry and requires user.warn. No IP blocks,
 * raw IP/HMAC, arbitrary audit metadata, Keycloak identity or reporter identity
 * are selected. Internal moderation notes are deliberately available to staff
 * ONLY at this endpoint, never via the public dashboard.
 */
@Injectable()
export class UserModerationHistoryService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async history(userId: string) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, status: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'MODERATION_USER_NOT_FOUND',
        message: 'Moderationskonto nicht gefunden.',
      });
    }

    const [reports, cards, sanctions, statusEvents] = await Promise.all([
      this.database.moderationReport.findMany({
        where: {
          OR: [
            { reportedUserId: userId },
            { comment: { authorId: userId } },
            { post: { authorId: userId } },
          ],
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: QUERY_LIMIT,
        select: {
          id: true,
          targetType: true,
          reason: true,
          details: true,
          status: true,
          resolution: true,
          moderatorNote: true,
          assignedModeratorId: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
      this.database.moderationCard.findMany({
        where: { userId },
        orderBy: [{ issuedAt: 'desc' }, { id: 'desc' }],
        take: QUERY_LIMIT,
        select: {
          id: true,
          type: true,
          status: true,
          reasonCode: true,
          userMessage: true,
          moderatorNote: true,
          escalationSource: true,
          sourceType: true,
          moderatorId: true,
          issuedAt: true,
          expiresAt: true,
          revokedAt: true,
          revocationReason: true,
        },
      }),
      this.database.sanction.findMany({
        // Network bans are a separate SUPERADMIN domain (Task 184/185).
        // Never leak IP-block metadata or notes via user.warn.
        where: { userId, type: { not: 'IP_BLOCK' } },
        orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
        take: QUERY_LIMIT,
        select: {
          id: true,
          type: true,
          status: true,
          reasonCode: true,
          userMessage: true,
          internalNote: true,
          sourceCardId: true,
          sourceReportId: true,
          createdById: true,
          startsAt: true,
          expiresAt: true,
          revokedAt: true,
          revocationReason: true,
        },
      }),
      this.database.auditLog.findMany({
        // Past bans and account reactivations remain visible even if the
        // original RED card or sanction is no longer active.
        where: { targetUserId: userId, action: 'USER_STATUS_CHANGED' },
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
        take: QUERY_LIMIT,
        select: {
          id: true,
          action: true,
          actorType: true,
          occurredAt: true,
          // Deliberately omit metadata, reason, correlation IDs and IP links:
          // audit payloads may contain network diagnostics or secret context.
        },
      }),
    ]);

    return {
      user,
      reports: capped(reports),
      cards: capped(cards),
      sanctions: capped(sanctions),
      statusEvents: capped(statusEvents),
      privacy: { restrictedTo: 'user.warn' as const, ipDetails: false },
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
