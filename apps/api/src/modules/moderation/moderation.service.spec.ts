import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import { ModerationService, type CreateYellowCardCommand } from './moderation.service';

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

const USER_ID = '11111111-1111-4111-8111-111111111111';
const MODERATOR_ID = '22222222-2222-4222-8222-222222222222';
const SOURCE_ID = '33333333-3333-4333-8333-333333333333';
const CARD_ID = '44444444-4444-4444-8444-444444444444';

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
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: USER_ID,
      }),
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
      create: jest.fn().mockResolvedValue({
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
      create: jest.fn().mockResolvedValue({
        id: 'notification-id',
      }),
    },
  };
}

describe('ModerationService – Yellow Cards', () => {
  let service: ModerationService;
  let tx: ReturnType<typeof createTransactionClient>;
  let transaction: jest.Mock;
  let disconnect: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    tx = createTransactionClient();

    transaction = jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx));

    disconnect = jest.fn().mockResolvedValue(undefined);

    jest.mocked(createPrismaClient).mockReturnValue({
      $transaction: transaction,
      $disconnect: disconnect,
    } as unknown as DatabaseClient);

    service = new ModerationService();
  });

  it('creates a yellow card', async () => {
    const result = await service.createYellowCard(command());

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tx.moderationCard.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(CARD_ID);
    expect(result.type).toBe('YELLOW');

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
    tx.user.findUnique.mockResolvedValueOnce(null);

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
    tx.notification.create.mockRejectedValueOnce(new Error('Notification write failed'));

    await expect(service.createYellowCard(command())).rejects.toThrow('Notification write failed');
  });

  it('disconnects the database during shutdown', async () => {
    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
