import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';

import {
  encodeNotificationCursor,
  parseNotificationCursor,
  parseNotificationFilter,
  parseNotificationLimit,
} from './notification-inbox-pagination';

@Injectable()
export class NotificationInboxService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async listForUser(userId: string, input: { cursor?: unknown; limit?: unknown; filter?: unknown }) {
    const filter = parseNotificationFilter(input.filter);
    const limit = parseNotificationLimit(input.limit);
    const cursor = parseNotificationCursor(input.cursor, filter);
    const now = new Date();

    const items = await this.database.notification.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        ...(filter === 'unread' ? { readAt: null } : {}),
        ...(cursor
          ? {
              AND: [
                {
                  OR: [
                    { createdAt: { lt: cursor.createdAt } },
                    { createdAt: cursor.createdAt, id: { lt: cursor.id } },
                  ],
                },
              ],
            }
          : {}),
      },
      // Explicit projection keeps moderation metadata, actor identity, source,
      // dedupe keys and the outbox hidden from public-facing API responses.
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        url: true,
        createdAt: true,
        readAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasNextPage = items.length > limit;
    const visible = items.slice(0, limit);
    const last = visible.at(-1);
    return {
      items: visible,
      pagination: {
        hasNextPage,
        nextCursor:
          hasNextPage && last
            ? encodeNotificationCursor({ id: last.id, createdAt: last.createdAt, filter })
            : null,
      },
    };
  }

  async countUnreadForUser(userId: string): Promise<{ count: number }> {
    const now = new Date();
    const count = await this.database.notification.count({
      where: {
        userId,
        readAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
    return { count };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
