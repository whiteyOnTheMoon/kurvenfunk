import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import type { CreateLimitedSanctionInput } from './limited-sanctions.controller';

export interface IssueLimitedSanctionCommand extends CreateLimitedSanctionInput {
  moderatorId: string;
}

export const LIMITED_DURATION_MS: Readonly<Record<CreateLimitedSanctionInput['duration'], number>> =
  {
    '24H': 24 * 60 * 60 * 1000,
    '3D': 3 * 24 * 60 * 60 * 1000,
    '7D': 7 * 24 * 60 * 60 * 1000,
    '30D': 30 * 24 * 60 * 60 * 1000,
  };

/** Temporarily limits a user. Expiration and return to ACTIVE are handled by Task 191. */
@Injectable()
export class LimitedSanctionsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async issue(command: IssueLimitedSanctionCommand) {
    if (command.userId === command.moderatorId) {
      throw new BadRequestException({
        code: 'LIMITED_SELF_SANCTION',
        message: 'Moderators cannot limit their own account.',
      });
    }

    const issued = await this.database.$transaction(
      async (tx) => {
        // Use the same per-user lock as yellow and red cards.
        const locked = await tx.$queryRaw<
          Array<{ id: string; status: 'ACTIVE' | 'LIMITED' | 'BANNED' }>
        >`
          SELECT "id", "status" FROM "User"
          WHERE "id" = ${command.userId}::uuid FOR UPDATE
        `;
        const target = locked[0];

        if (!target) {
          throw new NotFoundException({
            code: 'LIMITED_TARGET_NOT_FOUND',
            message: 'Target user does not exist.',
          });
        }

        if (target.status === 'BANNED') {
          throw new ConflictException({
            code: 'LIMITED_TARGET_BANNED',
            message: 'BANNED accounts cannot receive LIMITED sanctions.',
          });
        }

        const now = new Date();
        const existing = await tx.sanction.findFirst({
          where: {
            userId: command.userId,
            type: 'LIMITED',
            status: 'ACTIVE',
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
          select: { id: true },
        });
        if (existing) {
          throw new ConflictException({
            code: 'LIMITED_ALREADY_ACTIVE',
            message: 'The user already has an active LIMITED sanction.',
          });
        }

        const expiresAt = new Date(now.getTime() + LIMITED_DURATION_MS[command.duration]);
        const sanction = await tx.sanction.create({
          data: {
            type: 'LIMITED',
            status: 'ACTIVE',
            userId: command.userId,
            createdById: command.moderatorId,
            reasonCode: command.reasonCode,
            userMessage: command.userMessage ?? null,
            internalNote: command.moderatorNote,
            startsAt: now,
            expiresAt,
          },
          select: {
            id: true,
            type: true,
            status: true,
            userId: true,
            startsAt: true,
            expiresAt: true,
          },
        });

        if (target.status !== 'LIMITED') {
          await tx.user.update({
            where: { id: command.userId },
            data: { status: 'LIMITED' },
          });
        }

        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId: command.moderatorId,
            action: 'SANCTION_CREATED',
            category: 'SANCTION',
            targetType: 'SANCTION',
            targetId: sanction.id,
            targetUserId: command.userId,
            sanctionId: sanction.id,
            reason: command.reasonCode,
            metadata: {
              sanctionType: 'LIMITED',
              duration: command.duration,
              expiresAt: expiresAt.toISOString(),
            },
          },
        });

        if (target.status !== 'LIMITED') {
          await tx.auditLog.create({
            data: {
              actorType: 'USER',
              actorUserId: command.moderatorId,
              action: 'USER_STATUS_CHANGED',
              category: 'ACCOUNT',
              targetType: 'USER',
              targetId: command.userId,
              targetUserId: command.userId,
              sanctionId: sanction.id,
              reason: command.reasonCode,
              metadata: { previousStatus: target.status, newStatus: 'LIMITED' },
            },
          });
        }

        await tx.notification.create({
          data: {
            userId: command.userId,
            type: 'LIMITED',
            title: 'Dein Konto ist vorübergehend eingeschränkt',
            body: `Dein Konto ist vorübergehend eingeschränkt. Grund: ${command.reasonCode}. Die Einschränkung endet am ${expiresAt.toISOString()}.${command.userMessage ? ` ${command.userMessage}` : ''}`,
            sourceType: 'SANCTION',
            sourceId: sanction.id,
            actorUserId: command.moderatorId,
            dedupeKey: `limited-sanction:${sanction.id}`,
            metadata: { reasonCode: command.reasonCode, expiresAt: expiresAt.toISOString() },
          },
        });

        return sanction;
      },
      { isolationLevel: 'ReadCommitted' },
    );
    // No internal notes, moderator private metadata or raw user messages returned.
    return issued;
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
