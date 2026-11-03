import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import type { KeycloakSessionRevoker } from './keycloak-session-revoker';
import { ModerationService, type CreateYellowCardCommand } from './moderation.service';

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

const USER_ID = '11111111-1111-4111-8111-111111111111';
const MODERATOR_ID = '22222222-2222-4222-8222-222222222222';
const SOURCE_ID = '33333333-3333-4333-8333-333333333333';
const CARD_ID = '44444444-4444-4444-8444-444444444444';
const RED_CARD_ID = '55555555-5555-4555-8555-555555555555';

function command(overrides: Partial<CreateYellowCardCommand> = {}): CreateYellowCardCommand {
  return {
    userId: USER_ID,
    moderatorId: MODERATOR_ID,
    reasonCode: 'SPAM',
    moderatorNote: 'Internal moderator note',
    sourceType: 'NONE',
    ...overrides,
  };
}

function createTransactionClient() {
  return {
    $queryRaw: jest.fn().mockResolvedValue([
      {
        id: USER_ID,
        status: 'ACTIVE',
        keycloakSubject: SOURCE_ID,
      },
    ]),
    user: {
      update: jest.fn().mockResolvedValue({ id: USER_ID, status: 'BANNED' }),
    },
    comment: {
      findUnique: jest.fn().mockResolvedValue({
        authorId: USER_ID,
      }),
    },
    post: {
      findUnique: jest.fn().mockResolvedValue({
        authorId: USER_ID,
      }),
    },
    thread: {
      findUnique: jest.fn().mockResolvedValue({
        authorId: USER_ID,
      }),
    },
    article: {
      findUnique: jest.fn().mockResolvedValue({
        authorId: USER_ID,
      }),
    },
    moderationCard: {
      count: jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockResolvedValue({ id: RED_CARD_ID })
        .mockResolvedValueOnce({
          id: CARD_ID,
          userId: USER_ID,
          moderatorId: MODERATOR_ID,
          type: 'YELLOW',
          status: 'ACTIVE',
          reasonCode: 'SPAM',
          sourceType: 'NONE',
          sourceId: null,
          issuedAt: new Date('2026-10-16T12:00:00Z'),
          expiresAt: null,
        }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({
        id: 'audit-id',
      }),
    },
    notification: {
      create: jest
        .fn()
        .mockResolvedValue({ id: 'red-notification-id' })
        .mockResolvedValueOnce({ id: 'notification-id' }),
    },
  };
}

describe('ModerationService – Yellow Cards', () => {
  let service: ModerationService;
  let tx: ReturnType<typeof createTransactionClient>;
  let transaction: jest.Mock;
  let disconnect: jest.Mock;
  let revoker: { isConfigured: boolean; revokeSessions: jest.Mock };
  let notificationUpdate: jest.Mock;
  let notificationFindMany: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    tx = createTransactionClient();

    transaction = jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx));

    disconnect = jest.fn().mockResolvedValue(undefined);
    notificationUpdate = jest.fn().mockResolvedValue({ id: 'red-notification-id' });
    notificationFindMany = jest.fn().mockResolvedValue([]);
    revoker = {
      isConfigured: false,
      revokeSessions: jest.fn().mockResolvedValue(true),
    };

    jest.mocked(createPrismaClient).mockReturnValue({
      $transaction: transaction,
      $disconnect: disconnect,
      notification: {
        update: notificationUpdate,
        findMany: notificationFindMany,
      },
    } as unknown as DatabaseClient);

    service = new ModerationService(revoker as unknown as KeycloakSessionRevoker);
  });

  it('creates a yellow card', async () => {
    const result = await service.createYellowCard(command());

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'ReadCommitted',
    });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.moderationCard.create).toHaveBeenCalledTimes(1);
    expect(tx.moderationCard.count).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(CARD_ID);
    expect(result.type).toBe('YELLOW');
    expect(result.yellowCardCount).toBe(1);
    expect(result.counterStage).toBe('YELLOW');
    expect(result.redCardRequired).toBe(false);

    expect(tx.moderationCard.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        moderatorId: MODERATOR_ID,
        type: 'YELLOW',
        status: 'ACTIVE',
        reasonCode: 'SPAM',
        userMessage: null,
        moderatorNote: 'Internal moderator note',
        sourceType: 'NONE',
        sourceId: null,
        expiresAt: null,
        escalationSource: 'MANUAL',
      },
      select: {
        id: true,
        userId: true,
        moderatorId: true,
        type: true,
        status: true,
        reasonCode: true,
        sourceType: true,
        sourceId: true,
        issuedAt: true,
        expiresAt: true,
      },
    });
  });

  it('creates the audit event', async () => {
    await service.createYellowCard(command());

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorType: 'USER',
        actorUserId: MODERATOR_ID,
        action: 'MODERATION_CARD_CREATED',
        category: 'MODERATION',
        targetType: 'MODERATION_CARD',
        targetId: CARD_ID,
        targetUserId: USER_ID,
        moderationCardId: CARD_ID,
        reason: 'SPAM',
        metadata: {
          cardType: 'YELLOW',
          sourceType: 'NONE',
          sourceId: null,
          yellowCardCount: 1,
          counterStage: 'YELLOW',
        },
      },
    });
  });

  it('creates a notification without private notes', async () => {
    await service.createYellowCard(
      command({
        userMessage: 'Bitte beachte unsere Regeln.',
      }),
    );

    expect(tx.notification.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        type: 'YELLOW_CARD',
        title: 'Gelbe Karte',
        body: 'Du hast eine gelbe Karte erhalten. Grund: SPAM. ' + 'Bitte beachte unsere Regeln.',
        sourceType: 'MODERATION_CARD',
        sourceId: CARD_ID,
        actorUserId: MODERATOR_ID,
        dedupeKey: `yellow-card:${CARD_ID}`,
        metadata: {
          reasonCode: 'SPAM',
        },
      },
    });
  });

  it('sends a stronger notice for the second active yellow card', async () => {
    tx.moderationCard.count.mockResolvedValueOnce(2);

    await service.createYellowCard(command());

    expect(tx.notification.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        type: 'YELLOW_CARD',
        title: 'Gelbe Karte',
        body: 'Du hast eine gelbe Karte erhalten. Grund: SPAM. Dies ist deine zweite aktive gelbe Karte. Eine weitere erreicht die Schwelle für Rot.',
        sourceType: 'MODERATION_CARD',
        sourceId: CARD_ID,
        actorUserId: MODERATOR_ID,
        dedupeKey: `yellow-card:${CARD_ID}`,
        metadata: {
          reasonCode: 'SPAM',
        },
      },
    });
  });

  it('notifies the user when the red-card threshold is reached', async () => {
    tx.moderationCard.count.mockResolvedValueOnce(3);

    await service.createYellowCard(command());

    expect(tx.notification.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        type: 'YELLOW_CARD',
        title: 'Gelbe Karte',
        body: 'Du hast eine gelbe Karte erhalten. Grund: SPAM. Die Schwelle für eine rote Karte ist erreicht.',
        sourceType: 'MODERATION_CARD',
        sourceId: CARD_ID,
        actorUserId: MODERATOR_ID,
        dedupeKey: `yellow-card:${CARD_ID}`,
        metadata: {
          reasonCode: 'SPAM',
        },
      },
    });
  });

  it('does not expose private notes in the result', async () => {
    const result = await service.createYellowCard(command());

    expect(result).not.toHaveProperty('moderatorNote');
    expect(result).not.toHaveProperty('userMessage');
  });

  it('rejects self-warning', async () => {
    await expect(
      service.createYellowCard(command({ userId: MODERATOR_ID })),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects unknown users', async () => {
    tx.$queryRaw.mockResolvedValueOnce([]);

    await expect(service.createYellowCard(command())).rejects.toBeInstanceOf(NotFoundException);

    expect(tx.moderationCard.create).not.toHaveBeenCalled();
  });

  it('rejects mismatched user references', async () => {
    await expect(
      service.createYellowCard(
        command({
          sourceType: 'USER',
          sourceId: SOURCE_ID,
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each(['COMMENT', 'FORUM_POST', 'THREAD', 'ARTICLE'] as const)(
    'accepts a valid %s source',
    async (sourceType) => {
      await service.createYellowCard(
        command({
          sourceType,
          sourceId: SOURCE_ID,
        }),
      );

      expect(tx.moderationCard.create).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['COMMENT', 'FORUM_POST', 'THREAD', 'ARTICLE'] as const)(
    'rejects a %s source belonging to another user',
    async (sourceType) => {
      const lookups = {
        COMMENT: tx.comment.findUnique,
        FORUM_POST: tx.post.findUnique,
        THREAD: tx.thread.findUnique,
        ARTICLE: tx.article.findUnique,
      };

      lookups[sourceType].mockResolvedValueOnce({
        authorId: MODERATOR_ID,
      });

      await expect(
        service.createYellowCard(
          command({
            sourceType,
            sourceId: SOURCE_ID,
          }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(tx.moderationCard.create).not.toHaveBeenCalled();
    },
  );

  it('rejects unknown content', async () => {
    tx.comment.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.createYellowCard(
        command({
          sourceType: 'COMMENT',
          sourceId: SOURCE_ID,
        }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects missing source IDs', async () => {
    await expect(
      service.createYellowCard(
        command({
          sourceType: 'COMMENT',
          sourceId: undefined,
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects expired expiration dates', async () => {
    await expect(
      service.createYellowCard(
        command({
          expiresAt: '2020-01-01T00:00:00Z',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('fails if audit creation fails', async () => {
    tx.auditLog.create.mockRejectedValueOnce(new Error('Audit write failed'));

    await expect(service.createYellowCard(command())).rejects.toThrow('Audit write failed');

    expect(tx.notification.create).not.toHaveBeenCalled();
  });

  it('fails if notification creation fails', async () => {
    tx.notification.create
      .mockReset()
      .mockRejectedValueOnce(new Error('Notification write failed'));

    await expect(service.createYellowCard(command())).rejects.toThrow('Notification write failed');
  });

  it.each([
    [0, 'NONE', false],
    [1, 'YELLOW', false],
    [2, 'SECOND_YELLOW', false],
    [3, 'RED_CARD_REQUIRED', true],
    [4, 'RED_CARD_REQUIRED', true],
  ] as const)(
    'returns %s active yellow cards as %s (red card required: %s)',
    async (count, stage, redCardRequired) => {
      tx.moderationCard.count.mockResolvedValueOnce(count);

      const result = await service.createYellowCard(command());

      expect(result.yellowCardCount).toBe(count);
      expect(result.counterStage).toBe(stage);
      expect(result.redCardRequired).toBe(redCardRequired);
    },
  );

  it('locks the target user before creating or counting cards', async () => {
    await service.createYellowCard(command());

    const lockOrder = tx.$queryRaw.mock.invocationCallOrder[0];
    const createOrder = tx.moderationCard.create.mock.invocationCallOrder[0];
    const countOrder = tx.moderationCard.count.mock.invocationCallOrder[0];
    const auditOrder = tx.auditLog.create.mock.invocationCallOrder[0];

    expect(lockOrder).toBeLessThan(createOrder);
    expect(createOrder).toBeLessThan(countOrder);
    expect(countOrder).toBeLessThan(auditOrder);
  });

  it('does not create a card when the locked user does not exist', async () => {
    tx.$queryRaw.mockResolvedValueOnce([]);

    await expect(service.createYellowCard(command())).rejects.toBeInstanceOf(NotFoundException);

    expect(tx.moderationCard.create).not.toHaveBeenCalled();
    expect(tx.moderationCard.count).not.toHaveBeenCalled();
  });

  it('does not write audit or notifications when the counter fails', async () => {
    tx.moderationCard.count.mockRejectedValueOnce(new Error('Counter unavailable'));

    await expect(service.createYellowCard(command())).rejects.toThrow('Counter unavailable');

    expect(tx.auditLog.create).not.toHaveBeenCalled();
    expect(tx.notification.create).not.toHaveBeenCalled();
  });

  it('issues exactly one automatic red card and bans the user on the third yellow', async () => {
    tx.moderationCard.count.mockResolvedValueOnce(3);

    const result = await service.createYellowCard(command());

    expect(result.redCardRequired).toBe(true);
    expect(result.redCardId).toBe(RED_CARD_ID);
    expect(result.accountStatus).toBe('BANNED');
    expect(result.sessionRevocation).toBe('PENDING');
    expect(tx.moderationCard.create).toHaveBeenCalledTimes(2);
    expect(tx.moderationCard.create).toHaveBeenLastCalledWith({
      data: {
        userId: USER_ID,
        moderatorId: null,
        type: 'RED',
        status: 'ACTIVE',
        reasonCode: 'THREE_YELLOW_CARDS',
        userMessage: 'Drei aktive gelbe Karten: Dein Konto wurde gesperrt.',
        moderatorNote: 'Automatic escalation after three relevant yellow cards.',
        sourceType: 'USER',
        sourceId: USER_ID,
        escalationSource: 'THREE_YELLOW_CARDS',
      },
      select: { id: true },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { status: 'BANNED' },
    });
    expect(tx.auditLog.create).toHaveBeenCalledTimes(3);
    expect(tx.notification.create).toHaveBeenCalledTimes(2);
    expect(revoker.revokeSessions).not.toHaveBeenCalled();
  });

  it('does not escalate on one or two yellow cards', async () => {
    tx.moderationCard.count.mockResolvedValueOnce(2);

    const result = await service.createYellowCard(command());

    expect(result.redCardId).toBeNull();
    expect(result.accountStatus).toBe('ACTIVE');
    expect(result.sessionRevocation).toBeNull();
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.moderationCard.create).toHaveBeenCalledTimes(1);
  });

  it('prevents repeated warnings for banned accounts', async () => {
    tx.$queryRaw.mockResolvedValueOnce([
      {
        id: USER_ID,
        status: 'BANNED',
        keycloakSubject: SOURCE_ID,
      },
    ]);

    await expect(service.createYellowCard(command())).rejects.toBeInstanceOf(ConflictException);
    expect(tx.moderationCard.create).not.toHaveBeenCalled();
  });

  it('does not create a duplicate red card when an active red already exists', async () => {
    tx.moderationCard.count.mockResolvedValueOnce(3);
    tx.moderationCard.findFirst.mockResolvedValueOnce({ id: RED_CARD_ID });

    await expect(service.createYellowCard(command())).rejects.toBeInstanceOf(ConflictException);
    expect(tx.moderationCard.create).toHaveBeenCalledTimes(1);
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('revokes sessions after the ban transaction has completed', async () => {
    tx.moderationCard.count.mockResolvedValueOnce(3);
    revoker.isConfigured = true;
    const response = await service.createYellowCard(command());

    expect(response.sessionRevocation).toBe('REVOKED');
    expect(revoker.revokeSessions).toHaveBeenCalledWith(SOURCE_ID);
    expect(notificationUpdate).toHaveBeenCalledWith({
      where: { id: 'red-notification-id' },
      data: {
        metadata: { reasonCode: 'THREE_YELLOW_CARDS', sessionRevocation: 'REVOKED' },
      },
    });
    expect(transaction.mock.invocationCallOrder[0]).toBeLessThan(
      revoker.revokeSessions.mock.invocationCallOrder[0],
    );
  });

  it('keeps a durable retry marker if Keycloak rejects revocation', async () => {
    tx.moderationCard.count.mockResolvedValueOnce(3);
    revoker.isConfigured = true;
    revoker.revokeSessions.mockResolvedValueOnce(false);

    const response = await service.createYellowCard(command());

    expect(response.sessionRevocation).toBe('PENDING');
    expect(notificationUpdate).not.toHaveBeenCalled();
  });

  it('retries pending revocations without affecting active accounts', async () => {
    revoker.isConfigured = true;
    notificationFindMany.mockResolvedValueOnce([
      { id: 'pending-1', user: { status: 'BANNED', keycloakSubject: SOURCE_ID } },
      { id: 'pending-2', user: { status: 'ACTIVE', keycloakSubject: 'other' } },
    ]);

    await service.retryPendingSessionRevocations();

    expect(revoker.revokeSessions).toHaveBeenCalledTimes(1);
    expect(revoker.revokeSessions).toHaveBeenCalledWith(SOURCE_ID);
    expect(notificationUpdate).toHaveBeenCalledTimes(1);
  });

  it('preserves a direct RED reason when retrying a PENDING Keycloak revocation', async () => {
    revoker.isConfigured = true;
    notificationFindMany.mockResolvedValueOnce([
      {
        id: 'pending-direct',
        metadata: { reasonCode: 'SEVERE_ABUSE', sessionRevocation: 'PENDING' },
        user: { status: 'BANNED', keycloakSubject: SOURCE_ID },
      },
    ]);

    await service.retryPendingSessionRevocations();

    expect(notificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          type: 'RED_CARD',
          metadata: { path: ['sessionRevocation'], equals: 'PENDING' },
        },
      }),
    );
    expect(revoker.revokeSessions).toHaveBeenCalledWith(SOURCE_ID);
    expect(notificationUpdate).toHaveBeenCalledWith({
      where: { id: 'pending-direct' },
      data: { metadata: { reasonCode: 'SEVERE_ABUSE', sessionRevocation: 'REVOKED' } },
    });
  });

  it('disconnects the database during shutdown', async () => {
    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
