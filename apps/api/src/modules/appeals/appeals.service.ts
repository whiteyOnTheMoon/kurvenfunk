import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import type { CreateAppealInput, DecideAppealInput } from './appeals.controller';

export interface CreateAppealCommand extends CreateAppealInput {
  userId: string;
}

export interface DecideAppealCommand extends DecideAppealInput {
  appealId: string;
  reviewerId: string;
  /** Only set by the separate server-side second-review endpoint. */
  isSecondApproval?: boolean;
}

export interface ApproveAppealCommand {
  appealId: string;
  reviewerId: string;
  decisionNote: string;
  outcome: 'APPROVE' | 'RETURN';
}

/**
 * Task 20.189: transactional, independently audited appeals. No network
 * sanctions are actionable here: IP-block changes require user.ipban and the
 * dedicated Task 184/185 workflow, never a user.ban appeal decision.
 *
 * Accepting a card/sanction only revokes the exact target. Recompute account
 * status under an existing User row lock; other active RED/bans keep BANNED.
 * Task 190 may add further dual-review requirements.
 */
@Injectable()
export class AppealsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async create(command: CreateAppealCommand) {
    if (Boolean(command.moderationCardId) === Boolean(command.sanctionId)) {
      throw new BadRequestException({
        code: 'APPEAL_INVALID_TARGET',
        message: 'An appeal must reference exactly one card or sanction.',
      });
    }

    try {
      return await this.database.$transaction(
        async (tx) => {
          if (command.moderationCardId) {
            const card = await tx.moderationCard.findUnique({
              where: { id: command.moderationCardId },
              select: { userId: true },
            });
            if (!card || card.userId !== command.userId) {
              throw new NotFoundException({
                code: 'APPEAL_CARD_NOT_FOUND',
                message: 'This moderation card was not found.',
              });
            }
          } else if (command.sanctionId) {
            const sanction = await tx.sanction.findUnique({
              where: { id: command.sanctionId },
              select: { userId: true, type: true },
            });
            if (!sanction || sanction.userId !== command.userId || sanction.type === 'IP_BLOCK') {
              throw new NotFoundException({
                code: 'APPEAL_SANCTION_NOT_FOUND',
                message: 'This sanction was not found.',
              });
            }
          }

          const appeal = await tx.appeal.create({
            data: {
              userId: command.userId,
              moderationCardId: command.moderationCardId ?? null,
              sanctionId: command.sanctionId ?? null,
              reason: command.reason,
              status: 'OPEN',
            },
            select: {
              id: true,
              status: true,
              moderationCardId: true,
              sanctionId: true,
              createdAt: true,
            },
          });

          await tx.auditLog.create({
            data: {
              actorType: 'USER',
              actorUserId: command.userId,
              action: 'APPEAL_CREATED',
              category: 'MODERATION',
              targetType: 'APPEAL',
              targetId: appeal.id,
              targetUserId: command.userId,
              reason: 'APPEAL_SUBMITTED',
              metadata: {
                moderationCardId: command.moderationCardId ?? null,
                sanctionId: command.sanctionId ?? null,
              },
            },
          });

          await tx.notification.create({
            data: {
              userId: command.userId,
              type: 'APPEAL',
              title: 'Einspruch eingereicht',
              body: 'Dein Einspruch wurde eingereicht und wird geprüft.',
              sourceType: 'APPEAL',
              sourceId: appeal.id,
              dedupeKey: `appeal-submitted:${appeal.id}`,
            },
          });

          return appeal;
        },
        { isolationLevel: 'ReadCommitted' },
      );
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new ConflictException({
          code: 'APPEAL_ALREADY_EXISTS',
          message: 'An appeal for this item already exists.',
        });
      }
      throw error;
    }
  }

  async eligible(userId: string) {
    const [cards, sanctions] = await Promise.all([
      this.database.moderationCard.findMany({
        where: { userId, type: { in: ['YELLOW', 'RED', 'BLUE'] } },
        orderBy: { issuedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          type: true,
          status: true,
          reasonCode: true,
          issuedAt: true,
        },
      }),
      this.database.sanction.findMany({
        where: { userId, type: { not: 'IP_BLOCK' } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          type: true,
          status: true,
          reasonCode: true,
          startsAt: true,
          expiresAt: true,
        },
      }),
    ]);

    return { cards, sanctions };
  }

  async listMine(userId: string) {
    return this.database.appeal.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 50,
      select: {
        id: true,
        moderationCardId: true,
        sanctionId: true,
        reason: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
      },
    });
  }

  isFourEyesEnabled(): boolean {
    return process.env.APPEAL_FOUR_EYES_ENABLED === 'true';
  }

  async listPendingForApproval() {
    return this.database.appeal.findMany({
      where: { status: 'PENDING_APPROVAL' },
      orderBy: [{ proposedAt: 'asc' }, { id: 'asc' }],
      take: 50,
      select: {
        id: true,
        userId: true,
        moderationCardId: true,
        sanctionId: true,
        reason: true,
        proposedDecision: true,
        proposedById: true,
        proposedAt: true,
        proposalNote: true,
      },
    });
  }

  async approve(command: ApproveAppealCommand) {
    if (command.outcome === 'RETURN') {
      return this.returnForReview(command);
    }
    return this.decide({
      appealId: command.appealId,
      reviewerId: command.reviewerId,
      decision: 'ACCEPTED',
      decisionNote: command.decisionNote,
      isSecondApproval: true,
    });
  }

  private async returnForReview(command: ApproveAppealCommand) {
    const preliminary = await this.database.appeal.findUnique({
      where: { id: command.appealId },
      select: { userId: true },
    });
    if (!preliminary) {
      throw new NotFoundException({ code: 'APPEAL_NOT_FOUND', message: 'Appeal not found.' });
    }
    if (preliminary.userId === command.reviewerId) {
      throw new ForbiddenException({
        code: 'APPEAL_SELF_REVIEW_FORBIDDEN',
        message: 'An appeal cannot be reviewed by its author.',
      });
    }
    return this.database.$transaction(async (tx) => {
      const users = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "User" WHERE "id" = ${preliminary.userId}::uuid FOR UPDATE
      `;
      if (!users[0]) {
        throw new NotFoundException({ code: 'APPEAL_USER_NOT_FOUND', message: 'User not found.' });
      }
      const appeal = await tx.appeal.findUnique({
        where: { id: command.appealId },
        select: { id: true, userId: true, status: true, proposedById: true },
      });
      if (!appeal || appeal.userId !== preliminary.userId || appeal.status !== 'PENDING_APPROVAL') {
        throw new ConflictException({
          code: 'APPEAL_NOT_PENDING',
          message: 'No review proposal is pending.',
        });
      }
      if (!appeal.proposedById || appeal.proposedById === command.reviewerId) {
        throw new ForbiddenException({
          code: 'APPEAL_SECOND_REVIEWER_REQUIRED',
          message: 'A different reviewer must return the proposal.',
        });
      }
      const reopened = await tx.appeal.update({
        where: { id: appeal.id },
        data: {
          status: 'OPEN',
          proposedById: null,
          proposedDecision: null,
          proposalNote: null,
          proposedAt: null,
        },
        select: { id: true, status: true },
      });
      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorUserId: command.reviewerId,
          action: 'APPEAL_DECISION_RETURNED',
          category: 'MODERATION',
          targetType: 'APPEAL',
          targetId: appeal.id,
          targetUserId: appeal.userId,
          reason: 'SECOND_REVIEW_RETURNED',
          metadata: { proposedById: appeal.proposedById },
        },
      });
      return reopened;
    });
  }

  async listOpenForModeration() {
    return this.database.appeal.findMany({
      where: { status: 'OPEN' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 50,
      select: {
        id: true,
        userId: true,
        moderationCardId: true,
        sanctionId: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async decide(command: DecideAppealCommand) {
    const preliminary = await this.database.appeal.findUnique({
      where: { id: command.appealId },
      select: { userId: true },
    });

    if (!preliminary) {
      throw new NotFoundException({
        code: 'APPEAL_NOT_FOUND',
        message: 'Appeal not found.',
      });
    }

    if (preliminary.userId === command.reviewerId) {
      throw new ForbiddenException({
        code: 'APPEAL_SELF_REVIEW_FORBIDDEN',
        message: 'An appeal cannot be reviewed by its author.',
      });
    }

    return this.database.$transaction(
      async (tx) => {
        // Synchronizes appeal decisions with direct bans, yellow-card escalation,
        // LIMITED sanctions and expiration jobs for the same account.
        const lockedUsers = await tx.$queryRaw<
          Array<{ id: string; status: 'ACTIVE' | 'LIMITED' | 'BANNED' }>
        >`
          SELECT "id", "status" FROM "User"
          WHERE "id" = ${preliminary.userId}::uuid FOR UPDATE
        `;
        const target = lockedUsers[0];
        if (!target) {
          throw new NotFoundException({
            code: 'APPEAL_USER_NOT_FOUND',
            message: 'User not found.',
          });
        }

        const appeal = await tx.appeal.findUnique({
          where: { id: command.appealId },
          select: {
            id: true,
            userId: true,
            status: true,
            moderationCardId: true,
            sanctionId: true,
            proposedById: true,
            proposedDecision: true,
          },
        });
        if (
          !appeal ||
          appeal.userId !== preliminary.userId ||
          appeal.status !== (command.isSecondApproval ? 'PENDING_APPROVAL' : 'OPEN')
        ) {
          throw new ConflictException({
            code: 'APPEAL_ALREADY_REVIEWED',
            message: 'This appeal has already been reviewed.',
          });
        }

        if (command.isSecondApproval) {
          if (!appeal.proposedById || appeal.proposedById === command.reviewerId) {
            throw new ForbiddenException({
              code: 'APPEAL_SECOND_REVIEWER_REQUIRED',
              message: 'A different reviewer must approve this proposal.',
            });
          }
          if (appeal.proposedDecision !== 'ACCEPTED' && appeal.proposedDecision !== 'REJECTED') {
            throw new ConflictException({
              code: 'APPEAL_PROPOSAL_INVALID',
              message: 'The pending decision is invalid.',
            });
          }
        }

        const now = new Date();
        if (!command.isSecondApproval && this.isFourEyesEnabled()) {
          const proposed = await tx.appeal.update({
            where: { id: appeal.id },
            data: {
              status: 'PENDING_APPROVAL',
              proposedDecision: command.decision,
              proposalNote: command.decisionNote,
              proposedById: command.reviewerId,
              proposedAt: now,
            },
            select: { id: true, status: true, proposedAt: true },
          });
          await tx.auditLog.create({
            data: {
              actorType: 'USER',
              actorUserId: command.reviewerId,
              action: 'APPEAL_DECISION_PROPOSED',
              category: 'MODERATION',
              targetType: 'APPEAL',
              targetId: appeal.id,
              targetUserId: appeal.userId,
              reason: command.decision,
              metadata: { proposedDecision: command.decision },
            },
          });
          // No card, sanction, account, or appellant notification changes at proposal time.
          return proposed;
        }

        const finalDecision = command.isSecondApproval
          ? appeal.proposedDecision!
          : command.decision;
        const accepted = finalDecision === 'ACCEPTED';

        if (accepted && appeal.moderationCardId) {
          const changed = await tx.moderationCard.updateMany({
            where: { id: appeal.moderationCardId, userId: appeal.userId, status: 'ACTIVE' },
            data: {
              status: 'REVOKED',
              revokedAt: now,
              revokedById: command.reviewerId,
              revocationReason: 'APPEAL_ACCEPTED',
            },
          });

          if (changed.count === 1) {
            await tx.auditLog.create({
              data: {
                actorType: 'USER',
                actorUserId: command.reviewerId,
                action: 'MODERATION_CARD_REVOKED',
                category: 'MODERATION',
                targetType: 'MODERATION_CARD',
                targetId: appeal.moderationCardId,
                targetUserId: appeal.userId,
                moderationCardId: appeal.moderationCardId,
                reason: 'APPEAL_ACCEPTED',
              },
            });
          }
        }

        if (accepted && appeal.sanctionId) {
          const prior = await tx.sanction.findUnique({
            where: { id: appeal.sanctionId },
            select: { id: true, userId: true, type: true },
          });
          if (!prior || prior.userId !== appeal.userId || prior.type === 'IP_BLOCK') {
            throw new ConflictException({
              code: 'APPEAL_SANCTION_MISSING',
              message: 'The sanction no longer belongs to this user.',
            });
          }

          const changed = await tx.sanction.updateMany({
            where: { id: appeal.sanctionId, userId: appeal.userId, status: 'ACTIVE' },
            data: {
              status: 'REVOKED',
              revokedAt: now,
              revokedById: command.reviewerId,
              revocationReason: 'APPEAL_ACCEPTED',
            },
          });

          if (changed.count === 1) {
            await tx.auditLog.create({
              data: {
                actorType: 'USER',
                actorUserId: command.reviewerId,
                action: 'SANCTION_REVOKED',
                category: 'SANCTION',
                targetType: 'SANCTION',
                targetId: appeal.sanctionId,
                targetUserId: appeal.userId,
                sanctionId: appeal.sanctionId,
                reason: 'APPEAL_ACCEPTED',
              },
            });
          }
        }

        if (accepted) {
          const [activeReds, activeBans, activeLimits] = await Promise.all([
            tx.moderationCard.count({
              where: {
                userId: appeal.userId,
                type: 'RED',
                status: 'ACTIVE',
                revokedAt: null,
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              },
            }),
            tx.sanction.count({
              where: {
                userId: appeal.userId,
                type: 'ACCOUNT_BAN',
                status: 'ACTIVE',
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              },
            }),
            tx.sanction.count({
              where: {
                userId: appeal.userId,
                type: 'LIMITED',
                status: 'ACTIVE',
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              },
            }),
          ]);

          const nextStatus =
            activeReds > 0 || activeBans > 0 ? 'BANNED' : activeLimits > 0 ? 'LIMITED' : 'ACTIVE';

          if (nextStatus !== target.status) {
            await tx.user.update({
              where: { id: appeal.userId },
              data: { status: nextStatus },
            });
            await tx.auditLog.create({
              data: {
                actorType: 'USER',
                actorUserId: command.reviewerId,
                action: 'USER_STATUS_CHANGED',
                category: 'ACCOUNT',
                targetType: 'USER',
                targetId: appeal.userId,
                targetUserId: appeal.userId,
                reason: 'APPEAL_ACCEPTED',
                metadata: { previousStatus: target.status, newStatus: nextStatus },
              },
            });
          }
        }

        const reviewed = await tx.appeal.update({
          where: { id: appeal.id },
          data: {
            status: finalDecision,
            reviewedById: command.reviewerId,
            decisionNote: command.decisionNote,
            resolvedAt: now,
          },
          select: { id: true, status: true, resolvedAt: true },
        });

        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId: command.reviewerId,
            action: 'APPEAL_RESOLVED',
            category: 'MODERATION',
            targetType: 'APPEAL',
            targetId: appeal.id,
            targetUserId: appeal.userId,
            reason: finalDecision,
            metadata: { decision: finalDecision, proposedById: appeal.proposedById },
          },
        });

        await tx.notification.create({
          data: {
            userId: appeal.userId,
            type: 'APPEAL',
            title: accepted ? 'Einspruch angenommen' : 'Einspruch abgelehnt',
            body: accepted
              ? 'Dein Einspruch wurde angenommen. Die betroffene Sanktion wurde überprüft.'
              : 'Dein Einspruch wurde überprüft und abgelehnt.',
            sourceType: 'APPEAL',
            sourceId: appeal.id,
            actorUserId: command.reviewerId,
            dedupeKey: `appeal-decision:${appeal.id}`,
            metadata: { decision: finalDecision },
          },
        });

        if (command.isSecondApproval) {
          await tx.auditLog.create({
            data: {
              actorType: 'USER',
              actorUserId: command.reviewerId,
              action: 'APPEAL_DECISION_APPROVED',
              category: 'MODERATION',
              targetType: 'APPEAL',
              targetId: appeal.id,
              targetUserId: appeal.userId,
              reason: finalDecision,
              metadata: { proposedById: appeal.proposedById },
            },
          });
        }

        // Internal decision notes are never returned to the appellant.
        return reviewed;
      },
      { isolationLevel: 'ReadCommitted' },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
