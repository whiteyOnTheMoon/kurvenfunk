import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import type { LimitedSanctionInput } from './limited-sanctions.controller';

export interface CreateLimitedSanctionCommand extends LimitedSanctionInput {
  moderatorId: string;
}

const DURATION_HOURS: Readonly<Record<LimitedSanctionInput['duration'], number>> = {
  '24H': 24,
  '3D': 72,
  '7D': 168,
  '30D': 720,
};

@Injectable()
export class LimitedSanctionsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async create(command: CreateLimitedSanctionCommand) {
    if (command.userId === command.moderatorId) {
      throw new BadRequestException({
        code: 'LIMITED_SELF_SANCTION',
        message: 'Moderators cannot limit themselves.',
      });
    }

    const durationHours = DURATION_HOURS[command.duration];
    if (!Number.isSafeInteger(durationHours)) {
      throw new BadRequestException({
        code: 'LIMITED_INVALID_DURATION',
        message: 'Unsupported LIMITED duration.',
      });
    }

    return this.database.$transaction(
      async (tx) => {
        // Shared lock with direct and automatic red cards.
        // READ COMMITTED observes a preceding committed ban after waiting.
        const lockedUsers = await tx.$queryRaw<
          Array<{ id: string; status: 'ACTIVE' | 'LIMITED' | 'BANNED' }>
        >`
          SELECT "id", "status" FROM "User"
          WHERE "id" = ${command.userId}::uuid FOR UPDATE
        `;

        const target = lockedUsers[0];
        if (!target) {
          throw new NotFoundException({
            code: 'LIMITED_USER_NOT_FOUND',
            message: 'Target user not found.',
          });
        }
        if (target.status === 'BANNED') {
          throw new ConflictException({
            code: 'LIMITED_USER_BANNED',
            message: 'Cannot limit an already banned account.',
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
            code: 'LIMITED_SANCTION_ALREADY_ACTIVE',
            message: 'User already has an active LIMITED sanction.',
          });
        }

        const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
        const sanction = await tx.sanction.create({
          data: {
            userId: command.userId,
            createdById: command.moderatorId,
            type: 'LIMITED',
            status: 'ACTIVE',
            reasonCode: command.reasonCode,
            userMessage: command.userMessage ?? null,
            internalNote: command.moderatorNote,
            startsAt: now,
            expiresAt,
          },
          select: { id: true, userId: true, type: true, status: true, expiresAt: true },
        });

        await tx.user.update({
          where: { id: command.userId },
          data: { status: 'LIMITED' },
        });

        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId: command.moderatorId,
            action: 'SANCTION_CREATED',
            category: 'MODERATION',
            targetType: 'SANCTION',
            targetId: sanction.id,
            targetUserId: command.userId,
            sanctionId: sanction.id,
            reason: command.reasonCode,
            metadata: { sanctionType: 'LIMITED', duration: command.duration, expiresAt: expiresAt.toISOString() },
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
            sanctionId: sanction.id,
            reason: command.reasonCode,
            metadata: { previousStatus: target.status, newStatus: 'LIMITED' },
          },
        });

        await tx.notification.create({
          data: {
            userId: command.userId,
            type: 'LIMITED',
            title: 'Dein Konto ist vorübergehend eingeschränkt',
            body: `Dein Konto ist bis ${expiresAt.toISOString()} eingeschränkt. Grund: ${command.reasonCode}.${command.userMessage ? ` ${command.userMessage}` : ''}`,
            sourceType: 'SANCTION',
            sourceId: sanction.id,
            actorUserId: command.moderatorId,
            dedupeKey: `limited-sanction:${sanction.id}`,
            metadata: { reasonCode: command.reasonCode, expiresAt: expiresAt.toISOString() },
          },
        });

        // No internal notes or private actor details in the response.
        return {
          id: sanction.id,
          userId: sanction.userId,
          type: sanction.type,
          status: sanction.status,
          accountStatus: 'LIMITED' as const,
          expiresAt: sanction.expiresAt,
        };
      },
      { isolationLevel: 'ReadCommitted' },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
