import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import { IpIdentityService } from './ip-identity.service';

export type IpBlockDuration = '24H' | '3D' | '7D' | '30D';

export const IP_BLOCK_DURATION_MS: Readonly<Record<IpBlockDuration, number>> = {
  '24H': 24 * 60 * 60 * 1000,
  '3D': 3 * 24 * 60 * 60 * 1000,
  '7D': 7 * 24 * 60 * 60 * 1000,
  '30D': 30 * 24 * 60 * 60 * 1000,
};

export interface CreateIpBlockCommand {
  ipAddress: string;
  duration: IpBlockDuration;
  reasonCode: string;
  moderatorNote: string;
  actorId: string;
  userId?: string;
  sourceCardId?: string;
}

/**
 * Task 183–185: block a pseudonymized IP for a bounded duration.
 * Only SUPERADMIN may invoke this service through user.ipban-protected routes.
 */
@Injectable()
export class IpBlockService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  constructor(private readonly identities: IpIdentityService) {}

  async create(command: CreateIpBlockCommand) {
    // No raw IP address ever crosses the database boundary.
    const hashed = this.identities.hash(command.ipAddress);
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + IP_BLOCK_DURATION_MS[command.duration]);

    try {
      return await this.database.$transaction(
        async (tx) => {
          const alreadyBlocked = await tx.iPBlock.findFirst({
            where: {
              ipHash: hashed.ipHash,
              hashKeyVersion: hashed.hashKeyVersion,
              active: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: startedAt } }],
            },
            select: { id: true },
          });
          if (alreadyBlocked) {
            throw new ConflictException({
              code: 'IP_BLOCK_ALREADY_ACTIVE',
              message: 'There is already an active IP protection block.',
            });
          }

          let targetUserId = command.userId ?? null;

          if (command.sourceCardId) {
            const red = await tx.moderationCard.findUnique({
              where: { id: command.sourceCardId },
              select: { type: true, userId: true, status: true },
            });
            if (!red || red.type !== 'RED' || red.status !== 'ACTIVE') {
              throw new NotFoundException({
                code: 'IP_BLOCK_RED_CARD_NOT_FOUND',
                message: 'No active RED card was found.',
              });
            }
            if (targetUserId && targetUserId !== red.userId) {
              throw new ConflictException({
                code: 'IP_BLOCK_TARGET_MISMATCH',
                message: 'The selected red card does not belong to this user.',
              });
            }
            targetUserId = red.userId;
          }

          if (targetUserId) {
            const user = await tx.user.findUnique({
              where: { id: targetUserId },
              select: { status: true },
            });
            if (!user) {
              throw new NotFoundException({
                code: 'IP_BLOCK_TARGET_NOT_FOUND',
                message: 'Target user not found.',
              });
            }
            if (command.sourceCardId && user.status !== 'BANNED') {
              throw new ConflictException({
                code: 'IP_BLOCK_RED_CARD_TARGET_NOT_BANNED',
                message: 'Red-card IP protection requires a banned account.',
              });
            }
          }

          const block = await tx.iPBlock.create({
            data: {
              ipHash: hashed.ipHash,
              hashKeyVersion: hashed.hashKeyVersion,
              reasonCode: command.reasonCode,
              internalNote: command.moderatorNote,
              source: command.sourceCardId ? 'SANCTION' : 'MANUAL',
              createdById: command.actorId,
              active: true,
              startsAt: startedAt,
              expiresAt,
            },
            select: {
              id: true,
              active: true,
              startsAt: true,
              expiresAt: true,
            },
          });

          const sanction = await tx.sanction.create({
            data: {
              type: 'IP_BLOCK',
              status: 'ACTIVE',
              ipBlockId: block.id,
              userId: targetUserId,
              createdById: command.actorId,
              sourceCardId: command.sourceCardId ?? null,
              reasonCode: command.reasonCode,
              internalNote: command.moderatorNote,
              startsAt: startedAt,
              expiresAt,
            },
            select: { id: true },
          });

          await tx.auditLog.create({
            data: {
              actorType: 'USER',
              actorUserId: command.actorId,
              action: 'IP_BLOCK_CREATED',
              category: 'IP_PROTECTION',
              targetType: 'IP_BLOCK',
              targetId: block.id,
              targetUserId,
              ipBlockId: block.id,
              sanctionId: sanction.id,
              reason: command.reasonCode,
              metadata: {
                hashKeyVersion: hashed.hashKeyVersion,
                duration: command.duration,
                sourceCardId: command.sourceCardId ?? null,
              },
            },
          });

          await tx.auditLog.create({
            data: {
              actorType: 'USER',
              actorUserId: command.actorId,
              action: 'SANCTION_CREATED',
              category: 'SANCTION',
              targetType: 'SANCTION',
              targetId: sanction.id,
              targetUserId,
              ipBlockId: block.id,
              sanctionId: sanction.id,
              reason: command.reasonCode,
              metadata: { sanctionType: 'IP_BLOCK', duration: command.duration },
            },
          });

          return {
            id: block.id,
            active: block.active,
            startsAt: block.startsAt,
            expiresAt: block.expiresAt,
            sanctionId: sanction.id,
          };
        },
        // Phantom-safe protection against concurrent block creation for the same hash.
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2034'
      ) {
        throw new ConflictException({
          code: 'IP_BLOCK_CONCURRENT_UPDATE',
          message: 'IP protection changed concurrently; retry.',
        });
      }
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
