import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  isNotificationKind,
  NOTIFICATION_SOURCE_TYPES,
  NOTIFICATION_TYPE_POLICIES,
  NOTIFICATION_TYPES,
} from '@kurvenfunk/types';

import { NotificationsService } from './notifications.service';

const database = {
  notification: { create: jest.fn(), findUnique: jest.fn() },
  notificationOutbox: { create: jest.fn() },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
};
jest.mock('@kurvenfunk/database', () => ({ createPrismaClient: () => database }));

describe('Phase 23.224 notification taxonomy', () => {
  it('enumerates only the existing notification/source types', () => {
    expect(NOTIFICATION_TYPES).toEqual([
      'COMMENT_REPLY',
      'THREAD_REPLY',
      'YELLOW_CARD',
      'BLUE_CARD',
      'RED_CARD',
      'LIMITED',
      'BAN',
      'APPEAL',
      'SYSTEM',
    ]);
    expect(new Set(NOTIFICATION_TYPES).size).toBe(NOTIFICATION_TYPES.length);
    expect(Object.keys(NOTIFICATION_TYPE_POLICIES).sort()).toEqual([...NOTIFICATION_TYPES].sort());
    expect(NOTIFICATION_SOURCE_TYPES).toEqual([
      'COMMENT',
      'POST',
      'THREAD',
      'MODERATION_CARD',
      'SANCTION',
      'APPEAL',
      'SYSTEM',
    ]);
    expect(isNotificationKind('BAN')).toBe(true);
    expect(isNotificationKind('__proto__')).toBe(false);
    expect(isNotificationKind('')).toBe(false);
  });

  it('protects mandatory moderation/security types and private actor identities', () => {
    for (const type of ['YELLOW_CARD', 'BLUE_CARD', 'RED_CARD', 'LIMITED', 'BAN'] as const) {
      expect(NOTIFICATION_TYPE_POLICIES[type].mandatoryInApp).toBe(true);
      expect(NOTIFICATION_TYPE_POLICIES[type].showActor).toBe(false);
    }
    expect(NOTIFICATION_TYPE_POLICIES.COMMENT_REPLY.showActor).toBe(true);
    expect(NOTIFICATION_TYPE_POLICIES.THREAD_REPLY.showActor).toBe(true);
    for (const policy of Object.values(NOTIFICATION_TYPE_POLICIES)) {
      expect(policy.title.length).toBeGreaterThan(0);
      expect(policy.body.length).toBeGreaterThan(0);
      expect(policy.title).not.toMatch(/https?:\/\/|token|password/i);
      expect(policy.body).not.toMatch(/https?:\/\/|token|password/i);
    }
  });
});

describe('Phase 23.224 internal NotificationsService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const actorUserId = '22222222-2222-4222-8222-222222222222';
  const sourceId = '33333333-3333-4333-8333-333333333333';
  const notificationId = '44444444-4444-4444-8444-444444444444';
  const command = {
    userId,
    type: 'COMMENT_REPLY' as const,
    eventKey: 'reply-event-001',
    sourceType: 'COMMENT' as const,
    sourceId,
    actorUserId,
    url: '/artikel/spielbericht#diskussion',
  };
  let service: NotificationsService;

  beforeEach(() => {
    jest.resetAllMocks();
    database.notification.create.mockResolvedValue({ id: notificationId });
    database.notificationOutbox.create.mockResolvedValue({ notificationId });
    database.$transaction.mockImplementation((fn: (db: typeof database) => unknown) =>
      Promise.resolve(fn(database)),
    );
    service = new NotificationsService();
  });

  it('writes only static templates and a recipient/event-scoped dedupe key', async () => {
    await expect(service.persist(command)).resolves.toEqual({
      status: 'CREATED',
      id: notificationId,
    });
    expect(database.notification.create).toHaveBeenCalledWith({
      data: {
        userId,
        type: 'COMMENT_REPLY',
        title: NOTIFICATION_TYPE_POLICIES.COMMENT_REPLY.title,
        body: NOTIFICATION_TYPE_POLICIES.COMMENT_REPLY.body,
        sourceType: 'COMMENT',
        sourceId,
        actorUserId,
        url: '/artikel/spielbericht#diskussion',
        dedupeKey: ['notification', userId, 'COMMENT_REPLY', 'reply-event-001'].join(':'),
      },
      select: { id: true },
    });
    expect(database.notificationOutbox.create).toHaveBeenCalledWith({
      data: { notificationId },
    });
    expect(database.$transaction).toHaveBeenCalledTimes(1);
  });

  it('does not persist self-notifications', async () => {
    expect(await service.persist({ ...command, actorUserId: userId })).toEqual({
      status: 'SKIPPED_SELF',
      id: null,
    });
    expect(database.notification.create).not.toHaveBeenCalled();
  });

  it.each([
    ['type', { type: 'UNLISTED' }],
    ['recipient', { userId: 'not-a-uuid' }],
    ['event key', { eventKey: '' }],
    ['secret-like key', { eventKey: 'event key?token=abc' }],
    ['source type', { sourceType: 'SANCTION' }],
    ['missing source', { sourceId: null }],
    ['external URL', { url: 'https://attacker.example/path' }],
    ['protocol-relative URL', { url: '//attacker.example/path' }],
    ['backslash URL', { url: '/\\attacker.example/path' }],
    ['whitespace URL', { url: '/hello there' }],
    ['actor', { actorUserId: 'not-a-uuid' }],
  ])('refuses invalid %s before database writes', async (_label, overrides) => {
    await expect(
      service.persist({ ...command, ...overrides } as typeof command),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(database.notification.create).not.toHaveBeenCalled();
  });

  it('never exposes moderator actors in card/sanction notifications', async () => {
    await expect(
      service.persist({ ...command, type: 'YELLOW_CARD', sourceType: 'MODERATION_CARD' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows source-free SYSTEM messages but not unrelated source links', async () => {
    await expect(
      service.persist({
        ...command,
        type: 'SYSTEM',
        sourceType: null,
        sourceId: null,
        actorUserId: null,
        url: null,
      }),
    ).resolves.toMatchObject({ status: 'CREATED' });
    await expect(
      service.persist({ ...command, type: 'SYSTEM', sourceType: 'COMMENT', actorUserId: null }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('makes a matching unique-event retry idempotent', async () => {
    database.notification.create.mockRejectedValue({ code: 'P2002' });
    database.notification.findUnique.mockResolvedValue({
      id: notificationId,
      userId,
      type: command.type,
      sourceType: command.sourceType,
      sourceId,
      actorUserId,
    });
    await expect(service.persist(command)).resolves.toEqual({
      status: 'ALREADY_EXISTS',
      id: notificationId,
    });
  });

  it('rolls back notification creation when the durable outbox write fails', async () => {
    database.notificationOutbox.create.mockRejectedValue(new Error('postgres unavailable'));
    await expect(service.persist(command)).rejects.toThrow('postgres unavailable');
    expect(database.$transaction).toHaveBeenCalledTimes(1);
    expect(database.notificationOutbox.create).toHaveBeenCalledTimes(1);
  });

  it('does not mask contradictory event key reuse or unrelated database failures', async () => {
    database.notification.create.mockRejectedValue({ code: 'P2002' });
    database.notification.findUnique.mockResolvedValue({
      id: notificationId,
      userId,
      type: 'COMMENT_REPLY',
      sourceType: 'POST',
      sourceId,
      actorUserId,
    });
    await expect(service.persist(command)).rejects.toBeInstanceOf(ConflictException);
    database.notification.create.mockRejectedValue(new Error('database unavailable'));
    await expect(service.persist(command)).rejects.toThrow('database unavailable');
  });
});
