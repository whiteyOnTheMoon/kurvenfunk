import { randomUUID } from 'node:crypto';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { NOTIFICATION_SOURCE_TYPES, NOTIFICATION_TYPES } from '@kurvenfunk/types';

import { NotificationsService } from '../src/modules/notifications/notifications.service';

describe('Phase 23.224 – isolated notification taxonomy and durable event deduplication', () => {
  let database: DatabaseClient;
  let service: NotificationsService;
  const marker = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let recipientId = '';
  let actorId = '';

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      url.hostname !== '127.0.0.1' ||
      url.pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('PHASE23_224_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }
    database = createPrismaClient();
    service = new NotificationsService();
    for (const name of ['recipient', 'actor']) {
      const user = await database.user.create({
        data: { keycloakSubject: 'p224-' + name + '-' + marker },
        select: { id: true },
      });
      userIds.push(user.id);
    }
    recipientId = userIds[0]!;
    actorId = userIds[1]!;
  });

  afterAll(async () => {
    if (database) {
      await database.notification.deleteMany({ where: { userId: { in: userIds } } });
      await database.user.deleteMany({ where: { id: { in: userIds } } });
      await database.$disconnect();
    }
    if (service) await service.onModuleDestroy();
  });

  it('matches both actual PostgreSQL enums exactly', async () => {
    // Only static, hardcoded SQL with no user input against a disposable local DB.
    const kinds = await database.$queryRawUnsafe<Array<{ value: string }>>(
      "SELECT e.enumlabel::text AS value FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'NotificationType' ORDER BY e.enumsortorder",
    );
    const sources = await database.$queryRawUnsafe<Array<{ value: string }>>(
      "SELECT e.enumlabel::text AS value FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'NotificationSourceType' ORDER BY e.enumsortorder",
    );
    expect(kinds.map((row) => row.value)).toEqual([...NOTIFICATION_TYPES]);
    expect(sources.map((row) => row.value)).toEqual([...NOTIFICATION_SOURCE_TYPES]);
  });

  it('persists exactly one event and never reverts read state on retry', async () => {
    const command = {
      userId: recipientId,
      type: 'COMMENT_REPLY' as const,
      sourceType: 'COMMENT' as const,
      sourceId: randomUUID(),
      actorUserId: actorId,
      eventKey: 'comment-reply-' + marker,
      url: '/artikel/test#diskussion',
    };
    const initial = await service.persist(command);
    expect(initial.status).toBe('CREATED');
    if (!initial.id) throw new Error('NOTIFICATION_ID_MISSING');
    const readAt = new Date('2026-01-01T12:00:00.000Z');
    await database.notification.update({ where: { id: initial.id }, data: { readAt } });
    expect(await service.persist(command)).toEqual({ status: 'ALREADY_EXISTS', id: initial.id });
    const stored = await database.notification.findUniqueOrThrow({ where: { id: initial.id } });
    expect(stored.readAt).toEqual(readAt);
    expect(stored.userId).toBe(recipientId);
    expect(stored.title).toBe('Neue Antwort');
    expect(stored.body).not.toContain('test#diskussion');
    expect(await database.notification.count({ where: { dedupeKey: stored.dedupeKey } })).toBe(1);
  });

  it('handles two concurrent deliveries without duplicate notifications', async () => {
    const command = {
      userId: recipientId,
      type: 'THREAD_REPLY' as const,
      sourceType: 'POST' as const,
      sourceId: randomUUID(),
      actorUserId: actorId,
      eventKey: 'thread-reply-' + marker,
    };
    const attempts = await Promise.all([service.persist(command), service.persist(command)]);
    expect(attempts.map((x) => x.status).sort()).toEqual(['ALREADY_EXISTS', 'CREATED']);
    expect(attempts[0].id).toBe(attempts[1].id);
    expect(
      await database.notification.count({
        where: { userId: recipientId, type: 'THREAD_REPLY' },
      }),
    ).toBe(1);
  });

  it('keeps mandatory moderation notifications free of internal actor/metadata', async () => {
    const sourceId = randomUUID();
    await service.persist({
      userId: recipientId,
      type: 'YELLOW_CARD',
      sourceType: 'MODERATION_CARD',
      sourceId,
      eventKey: 'yellow-card-' + marker,
      url: '/einstellungen',
    });
    const stored = await database.notification.findFirstOrThrow({
      where: { userId: recipientId, type: 'YELLOW_CARD' },
    });
    expect(stored.actorUserId).toBeNull();
    expect(stored.metadata).toBeNull();
    expect(stored.body).not.toContain(sourceId);
  });

  it('does not create a notification for the replying actor', async () => {
    const before = await database.notification.count({ where: { userId: actorId } });
    expect(
      await service.persist({
        userId: actorId,
        type: 'COMMENT_REPLY',
        sourceType: 'COMMENT',
        sourceId: randomUUID(),
        actorUserId: actorId,
        eventKey: 'self-' + marker,
      }),
    ).toEqual({ status: 'SKIPPED_SELF', id: null });
    expect(await database.notification.count({ where: { userId: actorId } })).toBe(before);
  });
});
