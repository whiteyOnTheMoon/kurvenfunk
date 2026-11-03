import {
  BadRequestException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import type { CreateYellowCardInput } from './moderation.controller';
import { countRelevantYellowCards, getYellowCardCounterStage } from './yellow-card-counter';

export interface CreateYellowCardCommand extends CreateYellowCardInput {
  moderatorId: string;
}

@Injectable()
export class ModerationService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

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

    return this.database.$transaction(async (tx) => {
      // Serialize warnings for the same account. READ COMMITTED ensures
      // a waiting transaction counts previously committed warnings.
      const lockedUsers = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "User" WHERE "id" = ${command.userId}::uuid FOR UPDATE
      `;

      if (lockedUsers.length === 0) {
        throw new NotFoundException({
          code: 'YELLOW_CARD_USER_NOT_FOUND',
          message: 'Target user not found.',
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
          },
        },
      });

      const notificationBody = command.userMessage
        ? `Du hast eine gelbe Karte erhalten. Grund: ${command.reasonCode}. ${command.userMessage}`
        : `Du hast eine gelbe Karte erhalten. Grund: ${command.reasonCode}.`;

      await tx.notification.create({
        data: {
          userId: command.userId,
          type: 'YELLOW_CARD',

          title: 'Gelbe Karte',
          body: notificationBody,

          sourceType: 'MODERATION_CARD',
          sourceId: card.id,

          actorUserId: command.moderatorId,

          dedupeKey: `yellow-card:${card.id}`,

          metadata: {
            reasonCode: command.reasonCode,
          },
        },
      });

      return {
        ...card,
        yellowCardCount,
        counterStage,
        redCardRequired: counterStage === 'RED_CARD_REQUIRED',
      };
    }, { isolationLevel: 'ReadCommitted' });
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
