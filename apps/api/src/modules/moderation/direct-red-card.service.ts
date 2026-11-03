import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import { createPrismaClient, Prisma, type DatabaseClient } from '@kurvenfunk/database';

import type { CreateDirectRedCardInput } from './moderation.controller';
import { KeycloakSessionRevoker } from './keycloak-session-revoker';

export interface CreateDirectRedCardCommand extends CreateDirectRedCardInput {
  moderatorId: string;
}

/**
 * Task 177. A direct ban is independent of the yellow-card counter.
 * The target row lock serializes this operation with automatic escalation.
 */
@Injectable()
export class DirectRedCardService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();
  private readonly logger = new Logger(DirectRedCardService.name);

  constructor(private readonly sessionRevoker: KeycloakSessionRevoker) {}

  async createDirectRedCard(command: CreateDirectRedCardCommand) {
    if (command.userId === command.moderatorId) {
      throw new BadRequestException({
        code: 'DIRECT_RED_CARD_SELF_BAN',
        message: 'Moderators cannot ban themselves.',
      });
    }

    if (
      (command.sourceType === 'NONE' && command.sourceId !== undefined) ||
      (command.sourceType !== 'NONE' && command.sourceId === undefined)
    ) {
      throw new BadRequestException({
        code: 'DIRECT_RED_CARD_INVALID_SOURCE',
        message: 'Invalid moderation source.',
      });
    }

    const issued = await this.database.$transaction(
      async (tx) => {
        const lockedUsers = await tx.$queryRaw<
          Array<{ id: string; status: 'ACTIVE' | 'LIMITED' | 'BANNED'; keycloakSubject: string }>
        >`
          SELECT "id", "status", "keycloakSubject" FROM "User"
          WHERE "id" = ${command.userId}::uuid FOR UPDATE
        `;

        const target = lockedUsers[0];
        if (!target) {
          throw new NotFoundException({
            code: 'DIRECT_RED_CARD_USER_NOT_FOUND',
            message: 'Target user not found.',
          });
        }

        if (target.status === 'BANNED') {
          throw new ConflictException({
            code: 'DIRECT_RED_CARD_USER_ALREADY_BANNED',
            message: 'Cannot ban an already banned account.',
          });
        }

        await this.validateSource(tx, command);

        const existingRed = await tx.moderationCard.findFirst({
          where: {
            userId: command.userId,
            type: 'RED',
            status: 'ACTIVE',
            revokedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          select: { id: true },
        });

        if (existingRed) {
          throw new ConflictException({
            code: 'DIRECT_RED_CARD_ALREADY_ACTIVE',
            message: 'The account already has an active red card.',
          });
        }

        const card = await tx.moderationCard.create({
          data: {
            userId: command.userId,
            moderatorId: command.moderatorId,
            type: 'RED',
            status: 'ACTIVE',
            reasonCode: command.reasonCode,
            userMessage: command.userMessage ?? null,
            moderatorNote: command.moderatorNote,
            sourceType: command.sourceType,
            sourceId: command.sourceId ?? null,
            escalationSource: 'MANUAL',
          },
          select: { id: true },
        });

        await tx.user.update({
          where: { id: command.userId },
          data: { status: 'BANNED' },
        });

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
              cardType: 'RED',
              escalationSource: 'MANUAL',
              sourceType: command.sourceType,
              sourceId: command.sourceId ?? null,
            },
          },
        });

        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId: command.moderatorId,
            action: 'USER_STATUS_CHANGED',
            category: 'ACCOUNT',
            targetType: 'USER',
            targetId: command.userId,
            targetUserId: command.userId,
            moderationCardId: card.id,
            reason: command.reasonCode,
            metadata: {
              previousStatus: target.status,
              newStatus: 'BANNED',
            },
          },
        });

        const notice = await tx.notification.create({
          data: {
            userId: command.userId,
            type: 'RED_CARD',
            title: 'Rote Karte – Konto gesperrt',
            body: `Dein Konto wurde gesperrt. Grund: ${command.reasonCode}.${command.userMessage ? ` ${command.userMessage}` : ''}`,
            sourceType: 'MODERATION_CARD',
            sourceId: card.id,
            actorUserId: command.moderatorId,
            dedupeKey: `direct-red-card:${card.id}`,
            metadata: {
              reasonCode: command.reasonCode,
              sessionRevocation: 'PENDING',
            },
          },
          select: { id: true },
        });

        return {
          id: card.id,
          userId: command.userId,
          type: 'RED' as const,
          escalationSource: 'MANUAL' as const,
          accountStatus: 'BANNED' as const,
          notificationId: notice.id,
          keycloakSubject: target.keycloakSubject,
        };
      },
      { isolationLevel: 'ReadCommitted' },
    );

    const { notificationId, keycloakSubject, ...publicResult } = issued;
    const sessionRevocation = await this.revokeSessions(
      notificationId,
      keycloakSubject,
      command.reasonCode,
    );

    return { ...publicResult, sessionRevocation };
  }

  private async revokeSessions(
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
      // The PENDING metadata was committed with the ban.
      // ModerationService periodically retries all pending RED_CARD notifications.
      this.logger.error('Could not finalize direct red-card session revocation');
      return 'PENDING';
    }
  }

  private async validateSource(
    tx: Prisma.TransactionClient,
    command: CreateDirectRedCardCommand,
  ): Promise<void> {
    if (command.sourceType === 'NONE') {
      return;
    }

    if (command.sourceType === 'USER') {
      if (command.sourceId !== command.userId) {
        throw new BadRequestException({
          code: 'DIRECT_RED_CARD_SOURCE_MISMATCH',
          message: 'Source does not belong to target user.',
        });
      }
      return;
    }

    const sourceId = command.sourceId!;
    let authorId: string | null | undefined;

    switch (command.sourceType) {
      case 'COMMENT': {
        const comment = await tx.comment.findUnique({
          where: { id: sourceId },
          select: { authorId: true },
        });
        authorId = comment?.authorId;
        break;
      }
      case 'FORUM_POST': {
        const post = await tx.post.findUnique({
          where: { id: sourceId },
          select: { authorId: true },
        });
        authorId = post?.authorId;
        break;
      }
      case 'THREAD': {
        const thread = await tx.thread.findUnique({
          where: { id: sourceId },
          select: { authorId: true },
        });
        authorId = thread?.authorId;
        break;
      }
      case 'ARTICLE': {
        const article = await tx.article.findUnique({
          where: { id: sourceId },
          select: { authorId: true },
        });
        authorId = article?.authorId;
        break;
      }
    }

    if (authorId === undefined) {
      throw new NotFoundException({
        code: 'DIRECT_RED_CARD_SOURCE_NOT_FOUND',
        message: 'Moderation source not found.',
      });
    }

    if (authorId !== command.userId) {
      throw new BadRequestException({
        code: 'DIRECT_RED_CARD_SOURCE_MISMATCH',
        message: 'Source does not belong to target user.',
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
