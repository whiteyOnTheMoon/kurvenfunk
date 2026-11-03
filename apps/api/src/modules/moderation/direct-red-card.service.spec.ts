import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import type { KeycloakSessionRevoker } from './keycloak-session-revoker';
import { DirectRedCardService, type CreateDirectRedCardCommand } from './direct-red-card.service';

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

const TARGET_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const SOURCE_ID = '33333333-3333-4333-8333-333333333333';
const RED_ID = '44444444-4444-4444-8444-444444444444';
const KEYCLOAK_SUBJECT = '55555555-5555-4555-8555-555555555555';

const input = (extra: Partial<CreateDirectRedCardCommand> = {}): CreateDirectRedCardCommand => ({
  userId: TARGET_ID,
  moderatorId: ACTOR_ID,
  reasonCode: 'SEVERE_ABUSE',
  moderatorNote: 'Internal investigation notes',
  sourceType: 'NONE',
  ...extra,
});

function txClient() {
  return {
    $queryRaw: jest.fn().mockResolvedValue([
      {
        id: TARGET_ID,
        status: 'ACTIVE',
        keycloakSubject: KEYCLOAK_SUBJECT,
      },
    ]),
    moderationCard: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: RED_ID }),
    },
    user: {
      update: jest.fn().mockResolvedValue({ id: TARGET_ID, status: 'BANNED' }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
    },
    comment: { findUnique: jest.fn().mockResolvedValue({ authorId: TARGET_ID }) },
    post: { findUnique: jest.fn().mockResolvedValue({ authorId: TARGET_ID }) },
    thread: { findUnique: jest.fn().mockResolvedValue({ authorId: TARGET_ID }) },
    article: { findUnique: jest.fn().mockResolvedValue({ authorId: TARGET_ID }) },
  };
}

describe('DirectRedCardService', () => {
  let service: DirectRedCardService;
  let tx: ReturnType<typeof txClient>;
  let transact: jest.Mock;
  let notificationUpdate: jest.Mock;
  let disconnect: jest.Mock;
  let revoker: { isConfigured: boolean; revokeSessions: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    tx = txClient();
    transact = jest.fn((fn: (transaction: typeof tx) => Promise<unknown>) => fn(tx));
    notificationUpdate = jest.fn().mockResolvedValue({ id: 'notification-1' });
    disconnect = jest.fn().mockResolvedValue(undefined);
    revoker = {
      isConfigured: false,
      revokeSessions: jest.fn().mockResolvedValue(true),
    };

    jest.mocked(createPrismaClient).mockReturnValue({
      $transaction: transact,
      notification: { update: notificationUpdate },
      $disconnect: disconnect,
    } as unknown as DatabaseClient);
    service = new DirectRedCardService(revoker as unknown as KeycloakSessionRevoker);
  });

  it('creates an exactly one direct RED card, BANNED status, audit and notification', async () => {
    const response = await service.createDirectRedCard(input());

    expect(transact).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'ReadCommitted',
    });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.moderationCard.create).toHaveBeenCalledTimes(1);
    expect(tx.moderationCard.create).toHaveBeenCalledWith({
      data: {
        userId: TARGET_ID,
        moderatorId: ACTOR_ID,
        type: 'RED',
        status: 'ACTIVE',
        reasonCode: 'SEVERE_ABUSE',
        userMessage: null,
        moderatorNote: 'Internal investigation notes',
        sourceType: 'NONE',
        sourceId: null,
        escalationSource: 'MANUAL',
      },
      select: { id: true },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: TARGET_ID },
      data: { status: 'BANNED' },
    });
    expect(tx.auditLog.create).toHaveBeenCalledTimes(2);
    expect(tx.notification.create).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      id: RED_ID,
      userId: TARGET_ID,
      type: 'RED',
      escalationSource: 'MANUAL',
      accountStatus: 'BANNED',
      sessionRevocation: 'PENDING',
    });
    expect(response).not.toHaveProperty('moderatorNote');
    expect(response).not.toHaveProperty('userMessage');
    expect(response).not.toHaveProperty('keycloakSubject');
    expect(response).not.toHaveProperty('notificationId');
  });

  it('writes the correct direct RED audit actor and previous account state', async () => {
    tx.$queryRaw.mockResolvedValueOnce([
      {
        id: TARGET_ID,
        status: 'LIMITED',
        keycloakSubject: KEYCLOAK_SUBJECT,
      },
    ]);

    await service.createDirectRedCard(input());

    expect(tx.auditLog.create).toHaveBeenNthCalledWith(1, {
      data: {
        actorType: 'USER',
        actorUserId: ACTOR_ID,
        action: 'MODERATION_CARD_CREATED',
        category: 'MODERATION',
        targetType: 'MODERATION_CARD',
        targetId: RED_ID,
        targetUserId: TARGET_ID,
        moderationCardId: RED_ID,
        reason: 'SEVERE_ABUSE',
        metadata: {
          cardType: 'RED',
          escalationSource: 'MANUAL',
          sourceType: 'NONE',
          sourceId: null,
        },
      },
    });
    expect(tx.auditLog.create).toHaveBeenNthCalledWith(2, {
      data: {
        actorType: 'USER',
        actorUserId: ACTOR_ID,
        action: 'USER_STATUS_CHANGED',
        category: 'ACCOUNT',
        targetType: 'USER',
        targetId: TARGET_ID,
        targetUserId: TARGET_ID,
        moderationCardId: RED_ID,
        reason: 'SEVERE_ABUSE',
        metadata: { previousStatus: 'LIMITED', newStatus: 'BANNED' },
      },
    });
  });

  it('stores the reason and PENDING status but never exposes internal notes in notifications', async () => {
    await service.createDirectRedCard(input({ userMessage: 'Regelverstoß dokumentiert.' }));
    expect(tx.notification.create).toHaveBeenCalledWith({
      data: {
        userId: TARGET_ID,
        type: 'RED_CARD',
        title: 'Rote Karte – Konto gesperrt',
        body: 'Dein Konto wurde gesperrt. Grund: SEVERE_ABUSE. Regelverstoß dokumentiert.',
        sourceType: 'MODERATION_CARD',
        sourceId: RED_ID,
        actorUserId: ACTOR_ID,
        dedupeKey: `direct-red-card:${RED_ID}`,
        metadata: { reasonCode: 'SEVERE_ABUSE', sessionRevocation: 'PENDING' },
      },
      select: { id: true },
    });
  });

  it('locks the target before the red card or status update', async () => {
    await service.createDirectRedCard(input());
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.moderationCard.findFirst.mock.invocationCallOrder[0],
    );
    expect(tx.moderationCard.findFirst.mock.invocationCallOrder[0]).toBeLessThan(
      tx.moderationCard.create.mock.invocationCallOrder[0],
    );
  });

  it('rejects a self-ban before opening a transaction', async () => {
    await expect(service.createDirectRedCard(input({ userId: ACTOR_ID }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transact).not.toHaveBeenCalled();
  });

  it('rejects a nonexistent target without any writes', async () => {
    tx.$queryRaw.mockResolvedValueOnce([]);
    await expect(service.createDirectRedCard(input())).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.moderationCard.create).not.toHaveBeenCalled();
  });

  it('rejects a BANNED target without making duplicate cards', async () => {
    tx.$queryRaw.mockResolvedValueOnce([
      {
        id: TARGET_ID,
        status: 'BANNED',
        keycloakSubject: KEYCLOAK_SUBJECT,
      },
    ]);
    await expect(service.createDirectRedCard(input())).rejects.toBeInstanceOf(ConflictException);
    expect(tx.moderationCard.create).not.toHaveBeenCalled();
  });

  it('rejects any existing active red card', async () => {
    tx.moderationCard.findFirst.mockResolvedValueOnce({ id: 'existing' });
    await expect(service.createDirectRedCard(input())).rejects.toBeInstanceOf(ConflictException);
    expect(tx.moderationCard.create).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('rejects an invalid source pairing before opening a transaction', async () => {
    await expect(
      service.createDirectRedCard(input({ sourceType: 'COMMENT' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transact).not.toHaveBeenCalled();
  });

  it('rejects a mismatched USER source', async () => {
    await expect(
      service.createDirectRedCard(
        input({
          sourceType: 'USER',
          sourceId: SOURCE_ID,
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.moderationCard.create).not.toHaveBeenCalled();
  });

  it.each(['COMMENT', 'FORUM_POST', 'THREAD', 'ARTICLE'] as const)(
    'accepts valid %s evidence tied to the target',
    async (sourceType) => {
      const result = await service.createDirectRedCard(
        input({
          sourceType,
          sourceId: SOURCE_ID,
        }),
      );
      expect(result.type).toBe('RED');
    },
  );

  it.each(['COMMENT', 'FORUM_POST', 'THREAD', 'ARTICLE'] as const)(
    'rejects a %s owned by someone else',
    async (sourceType) => {
      const lookup = {
        COMMENT: tx.comment.findUnique,
        FORUM_POST: tx.post.findUnique,
        THREAD: tx.thread.findUnique,
        ARTICLE: tx.article.findUnique,
      }[sourceType];
      lookup.mockResolvedValueOnce({ authorId: ACTOR_ID });
      await expect(
        service.createDirectRedCard(
          input({
            sourceType,
            sourceId: SOURCE_ID,
          }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.moderationCard.create).not.toHaveBeenCalled();
    },
  );

  it('rejects missing content', async () => {
    tx.comment.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.createDirectRedCard(
        input({
          sourceType: 'COMMENT',
          sourceId: SOURCE_ID,
        }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.moderationCard.create).not.toHaveBeenCalled();
  });

  it('rolls back transaction on audit or notification failures', async () => {
    tx.auditLog.create.mockRejectedValueOnce(new Error('Audit unavailable'));
    await expect(service.createDirectRedCard(input())).rejects.toThrow('Audit unavailable');
    expect(revoker.revokeSessions).not.toHaveBeenCalled();

    tx = txClient();
    tx.notification.create.mockRejectedValueOnce(new Error('Notice unavailable'));
    await expect(service.createDirectRedCard(input())).rejects.toThrow('Notice unavailable');
    expect(revoker.revokeSessions).not.toHaveBeenCalled();
  });

  it('revokes sessions only after the committed ban and preserves the direct reason', async () => {
    revoker.isConfigured = true;
    const result = await service.createDirectRedCard(input());
    expect(result.sessionRevocation).toBe('REVOKED');
    expect(revoker.revokeSessions).toHaveBeenCalledWith(KEYCLOAK_SUBJECT);
    expect(transact.mock.invocationCallOrder[0]).toBeLessThan(
      revoker.revokeSessions.mock.invocationCallOrder[0],
    );
    expect(notificationUpdate).toHaveBeenCalledWith({
      where: { id: 'notification-1' },
      data: { metadata: { reasonCode: 'SEVERE_ABUSE', sessionRevocation: 'REVOKED' } },
    });
  });

  it('keeps PENDING if the Keycloak logout fails', async () => {
    revoker.isConfigured = true;
    revoker.revokeSessions.mockResolvedValueOnce(false);
    const result = await service.createDirectRedCard(input());
    expect(result.sessionRevocation).toBe('PENDING');
    expect(notificationUpdate).not.toHaveBeenCalled();
  });

  it('keeps PENDING if persisting the revoked marker fails', async () => {
    revoker.isConfigured = true;
    notificationUpdate.mockRejectedValueOnce(new Error('Database unavailable'));
    const result = await service.createDirectRedCard(input());
    expect(result.sessionRevocation).toBe('PENDING');
  });

  it('disconnects the Prisma client', async () => {
    await service.onModuleDestroy();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
