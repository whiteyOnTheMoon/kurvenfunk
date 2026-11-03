import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import { KeycloakSessionRevoker } from './keycloak-session-revoker';
import type { CreateYellowCardInput } from './moderation.controller';
import { countRelevantYellowCards, getYellowCardCounterStage } from './yellow-card-counter';

export interface CreateYellowCardCommand extends CreateYellowCardInput {
  moderatorId: string;
}

@Injectable()
export class ModerationService implements OnModuleDestroy, OnModuleInit {
  private readonly database: DatabaseClient = createPrismaClient();
  private readonly logger = new Logger(ModerationService.name);
  private retryTimer?: NodeJS.Timeout;

  constructor(private readonly sessionRevoker: KeycloakSessionRevoker) {}

  onModuleInit(): void {
    this.retryTimer = setInterval(() => {
      void this.retryPendingSessionRevocations().catch(() => {
        this.logger.error('Retrying pending Keycloak session revocations failed');
      });
    }, 60_000);
    this.retryTimer.unref();
  }

  /** Recovery for a crash or Keycloak outage after a red-card transaction commits. */
  async retryPendingSessionRevocations(): Promise<void> {
    if (!this.sessionRevoker.isConfigured) {
      return;
    }

    const pending = await this.database.notification.findMany({
      where: {
        type: 'RED_CARD',
        metadata: { path: ['sessionRevocation'], equals: 'PENDING' },
      },
      select: {
        id: true,
        metadata: true,
        user: { select: { status: true, keycloakSubject: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    for (const notification of pending) {
      if (notification.user.status === 'BANNED') {
        const metadata = notification.metadata;
        const reasonCode =
          metadata &&
          typeof metadata === 'object' &&
          !Array.isArray(metadata) &&
          typeof metadata.reasonCode === 'string'
            ? metadata.reasonCode
            : 'THREE_YELLOW_CARDS';

        await this.revokeForNotification(
          notification.id,
          notification.user.keycloakSubject,
          reasonCode,
        );
      }
    }
  }

  private async revokeForNotification(
    notificationId: string,
    keycloakSubject: string,
    reasonCode: string,
  ): Promise<'PENDING' | 'REVOKED'> {
    if (!this.sessionRevoker.isConfigured) {
      return 'PENDING';
    }

    try {
      if (!(await this.sessionRevoker.revokeSessions(keycloakSubject))) {
        return 'PENDING';
      }

      await this.database.notification.update({
        where: { id: notificationId },
        data: {
          metadata: { reasonCode, sessionRevocation: 'REVOKED' },
        },
      });
      return 'REVOKED';
    } catch {
      // Keep the durable PENDING marker for the periodic retry.
      this.logger.error('Could not finalize Keycloak session revocation');
      return 'PENDING';
    }
  }

  async createYellowCard(command: CreateYellowCardCommand) {
    if (command.userId === command.moderatorId) {
      throw new BadRequestException({
        code: 'YELLOW_CARD_SELF_WARNING',
        message: 'Moderators cannot warn themselves.',
      });
    }

    if (
      (command.sourceType === 'NONE' && command.sourceId !== undefined) ||
      (command.sourceType !== 'NONE' && command.sourceId === undefined)
    ) {
      throw new BadRequestException({
        code: 'YELLOW_CARD_INVALID_SOURCE',
        message: 'Invalid moderation source.',
      });
    }

    const expiresAt = command.expiresAt ? new Date(command.expiresAt) : null;

    if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) {
      throw new BadRequestException({
        code: 'YELLOW_CARD_INVALID_EXPIRATION',
        message: 'Expiration must be in the future.',
      });
    }

    const issued = await this.database.$transaction(
      async (tx) => {
        // Serialize warnings for the same account. READ COMMITTED ensures
        // a waiting transaction counts previously committed warnings.
        const lockedUsers = await tx.$queryRaw<
          Array<{ id: string; status: 'ACTIVE' | 'LIMITED' | 'BANNED'; keycloakSubject: string }>
        >`
          SELECT "id", "status", "keycloakSubject" FROM "User"
          WHERE "id" = ${command.userId}::uuid FOR UPDATE
        `;

        const targetUser = lockedUsers[0];

        if (!targetUser) {
          throw new NotFoundException({
            code: 'YELLOW_CARD_USER_NOT_FOUND',
            message: 'Target user not found.',
          });
        }

        if (targetUser.status === 'BANNED') {
          throw new ConflictException({
            code: 'YELLOW_CARD_USER_ALREADY_BANNED',
            message: 'Cannot warn an already banned account.',
          });
        }

        if (command.sourceType === 'USER') {
          if (command.sourceId !== command.userId) {
            throw new BadRequestException({
              code: 'YELLOW_CARD_SOURCE_MISMATCH',
              message: 'Source does not belong to target user.',
            });
          }
        }

        if (command.sourceType !== 'NONE' && command.sourceType !== 'USER') {
          const sourceId = command.sourceId!;

          let sourceAuthorId: string | null | undefined;

          switch (command.sourceType) {
            case 'COMMENT': {
              const comment = await tx.comment.findUnique({
                where: { id: sourceId },
                select: { authorId: true },
              });

              sourceAuthorId = comment?.authorId;
              break;
            }

            case 'FORUM_POST': {
              const post = await tx.post.findUnique({
                where: { id: sourceId },
                select: { authorId: true },
              });

              sourceAuthorId = post?.authorId;
              break;
            }

            case 'THREAD': {
              const thread = await tx.thread.findUnique({
                where: { id: sourceId },
                select: { authorId: true },
              });

              sourceAuthorId = thread?.authorId;
              break;
            }

            case 'ARTICLE': {
              const article = await tx.article.findUnique({
                where: { id: sourceId },
                select: { authorId: true },
              });

              sourceAuthorId = article?.authorId;
              break;
            }
          }

          if (sourceAuthorId === undefined) {
            throw new NotFoundException({
              code: 'YELLOW_CARD_SOURCE_NOT_FOUND',
              message: 'Moderation source not found.',
            });
          }

          if (sourceAuthorId !== command.userId) {
            throw new BadRequestException({
              code: 'YELLOW_CARD_SOURCE_MISMATCH',
              message: 'Source does not belong to target user.',
            });
          }
        }

        const card = await tx.moderationCard.create({
          data: {
            userId: command.userId,
            moderatorId: command.moderatorId,

            type: 'YELLOW',
            status: 'ACTIVE',

            reasonCode: command.reasonCode,
            userMessage: command.userMessage ?? null,
            moderatorNote: command.moderatorNote,

            sourceType: command.sourceType,
            sourceId: command.sourceId ?? null,

            expiresAt,
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

        // Count within the issuance transaction, including the new yellow card.
        const yellowCardCount = await countRelevantYellowCards(tx, command.userId, new Date());
        const counterStage = getYellowCardCounterStage(yellowCardCount);

        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId: command.moderatorId,

            action: 'MODERATION_CARD_CREATED',
            category: 'MODERATION',

            targetType: 'MODERATION_CARD',
            targetId: card.id,
            targetUserId: command.userId,

            moderationCardId: card.id,
            reason: command.reasonCode,

            metadata: {
              cardType: 'YELLOW',
              sourceType: command.sourceType,
              sourceId: command.sourceId ?? null,
              yellowCardCount,
              counterStage,
            },
          },
        });

        const notificationBody = command.userMessage
          ? `Du hast eine gelbe Karte erhalten. Grund: ${command.reasonCode}. ${command.userMessage}`
          : `Du hast eine gelbe Karte erhalten. Grund: ${command.reasonCode}.`;

        const additionalWarning =
          counterStage === 'SECOND_YELLOW'
            ? ' Dies ist deine zweite aktive gelbe Karte. Eine weitere erreicht die Schwelle für Rot.'
            : counterStage === 'RED_CARD_REQUIRED'
              ? ' Die Schwelle für eine rote Karte ist erreicht.'
              : '';

        await tx.notification.create({
          data: {
            userId: command.userId,
            type: 'YELLOW_CARD',

            title: 'Gelbe Karte',
            body: `${notificationBody}${additionalWarning}`,

            sourceType: 'MODERATION_CARD',
            sourceId: card.id,

            actorUserId: command.moderatorId,

            dedupeKey: `yellow-card:${card.id}`,

            metadata: {
              reasonCode: command.reasonCode,
            },
          },
        });

        let redCardId: string | null = null;
        let redNotificationId: string | null = null;

        if (counterStage === 'RED_CARD_REQUIRED') {
          const existingRedCard = await tx.moderationCard.findFirst({
            where: {
              userId: command.userId,
              type: 'RED',
              status: 'ACTIVE',
              revokedAt: null,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            select: { id: true },
          });

          if (existingRedCard) {
            throw new ConflictException({
              code: 'AUTOMATIC_RED_CARD_ALREADY_ACTIVE',
              message: 'The account already has an active red card.',
            });
          }

          const redCard = await tx.moderationCard.create({
            data: {
              userId: command.userId,
              moderatorId: null,
              type: 'RED',
              status: 'ACTIVE',
              reasonCode: 'THREE_YELLOW_CARDS',
              userMessage: 'Drei aktive gelbe Karten: Dein Konto wurde gesperrt.',
              moderatorNote: 'Automatic escalation after three relevant yellow cards.',
              sourceType: 'USER',
              sourceId: command.userId,
              escalationSource: 'THREE_YELLOW_CARDS',
            },
            select: { id: true },
          });
          redCardId = redCard.id;

          await tx.user.update({
            where: { id: command.userId },
            data: { status: 'BANNED' },
          });

          await tx.auditLog.create({
            data: {
              actorType: 'SECURITY_AUTOMATION',
              action: 'MODERATION_CARD_CREATED',
              category: 'MODERATION',
              targetType: 'MODERATION_CARD',
              targetId: redCard.id,
              targetUserId: command.userId,
              moderationCardId: redCard.id,
              reason: 'THREE_YELLOW_CARDS',
              metadata: { cardType: 'RED', sourceYellowCardId: card.id, yellowCardCount },
            },
          });

          await tx.auditLog.create({
            data: {
              actorType: 'SECURITY_AUTOMATION',
              action: 'USER_STATUS_CHANGED',
              category: 'ACCOUNT',
              targetType: 'USER',
              targetId: command.userId,
              targetUserId: command.userId,
              moderationCardId: redCard.id,
              reason: 'THREE_YELLOW_CARDS',
              metadata: {
                previousStatus: targetUser.status,
                newStatus: 'BANNED',
                yellowCardCount,
              },
            },
          });

          const redNotification = await tx.notification.create({
            data: {
              userId: command.userId,
              type: 'RED_CARD',
              title: 'Rote Karte – Konto gesperrt',
              body: 'Du hast drei aktive gelbe Karten erhalten. Dein Konto ist gesperrt.',
              sourceType: 'MODERATION_CARD',
              sourceId: redCard.id,
              dedupeKey: `automatic-red-card:${redCard.id}`,
              metadata: { reasonCode: 'THREE_YELLOW_CARDS', sessionRevocation: 'PENDING' },
            },
            select: { id: true },
          });
          redNotificationId = redNotification.id;
        }

        return {
          ...card,
          yellowCardCount,
          counterStage,
          redCardRequired: counterStage === 'RED_CARD_REQUIRED',
          redCardId,
          redNotificationId,
          keycloakSubject: targetUser.keycloakSubject,
          accountStatus: redCardId ? 'BANNED' : targetUser.status,
        };
      },
      { isolationLevel: 'ReadCommitted' },
    );

    const { redNotificationId, keycloakSubject, ...publicResult } = issued;
    const sessionRevocation = redNotificationId
      ? await this.revokeForNotification(redNotificationId, keycloakSubject, 'THREE_YELLOW_CARDS')
      : null;

    return { ...publicResult, sessionRevocation };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
    }
    await this.database.$disconnect();
  }
}
