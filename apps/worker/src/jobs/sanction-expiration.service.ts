import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/**
 * Task 191: expire temporary sanctions and IP blocks in the worker.
 * Idempotent updates, with row-level locking to avoid races against new sanctions or bans.
 */
@Injectable()
export class SanctionExpirationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SanctionExpirationService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly databaseService: DatabaseService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.scan().catch(() => this.logger.error('Sanction expiration scan failed'));
    }, 60_000);
    this.timer.unref();

    // Catch up after a worker restart without delaying NestJS startup.
    void this.scan().catch(() => this.logger.error('Initial sanction expiration scan failed'));
  }

  async scan(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;

    try {
      const now = new Date();
      const db = this.databaseService.client;

      const dueSanctions = await db.sanction.findMany({
        where: {
          status: 'ACTIVE',
          type: { in: ['LIMITED', 'COMMENT_BLOCK', 'FORUM_BLOCK'] },
          expiresAt: { lte: now },
        },
        orderBy: { expiresAt: 'asc' },
        select: { id: true, type: true, userId: true },
        take: 100,
      });

      for (const sanction of dueSanctions) {
        await db.$transaction(async (tx) => {
          let lockedStatus: 'ACTIVE' | 'LIMITED' | 'BANNED' | null = null;

          if (sanction.type === 'LIMITED' && sanction.userId) {
            // Lock before expiration so account status changes cannot race new warnings/bans.
            const locked = await tx.$queryRaw<
              Array<{ id: string; status: 'ACTIVE' | 'LIMITED' | 'BANNED' }>
            >`
              SELECT "id", "status" FROM "User"
              WHERE "id" = ${sanction.userId}::uuid FOR UPDATE
            `;
            lockedStatus = locked[0]?.status ?? null;
          }

          const changed = await tx.sanction.updateMany({
            where: {
              id: sanction.id,
              status: 'ACTIVE',
              expiresAt: { lte: new Date() },
            },
            data: { status: 'EXPIRED' },
          });

          if (changed.count === 0) {
            return;
          }

          await tx.auditLog.create({
            data: {
              actorType: 'WORKER',
              action: 'SANCTION_EXPIRED',
              category: 'SANCTION',
              targetType: 'SANCTION',
              targetId: sanction.id,
              targetUserId: sanction.userId,
              sanctionId: sanction.id,
              reason: 'SANCTION_EXPIRED',
              metadata: { sanctionType: sanction.type },
            },
          });

          if (sanction.type === 'LIMITED' && sanction.userId && lockedStatus === 'LIMITED') {
            const anotherActive = await tx.sanction.findFirst({
              where: {
                userId: sanction.userId,
                type: 'LIMITED',
                status: 'ACTIVE',
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              select: { id: true },
            });

            if (!anotherActive) {
              await tx.user.update({
                where: { id: sanction.userId },
                data: { status: 'ACTIVE' },
              });

              await tx.auditLog.create({
                data: {
                  actorType: 'WORKER',
                  action: 'USER_STATUS_CHANGED',
                  category: 'ACCOUNT',
                  targetType: 'USER',
                  targetId: sanction.userId,
                  targetUserId: sanction.userId,
                  sanctionId: sanction.id,
                  reason: 'LIMITED_EXPIRED',
                  metadata: { previousStatus: 'LIMITED', newStatus: 'ACTIVE' },
                },
              });

              await tx.notification.create({
                data: {
                  userId: sanction.userId,
                  type: 'SYSTEM',
                  title: 'Einschränkung abgelaufen',
                  body: 'Die zeitlich begrenzte Einschränkung deines Kontos ist abgelaufen.',
                  sourceType: 'SANCTION',
                  sourceId: sanction.id,
                  dedupeKey: `limited-expired:${sanction.id}`,
                },
              });
            }
          }
        });
      }

      const dueIpBlocks = await db.iPBlock.findMany({
        where: { active: true, expiresAt: { lte: now } },
        orderBy: { expiresAt: 'asc' },
        select: { id: true },
        take: 100,
      });

      for (const block of dueIpBlocks) {
        await db.$transaction(async (tx) => {
          const updated = await tx.iPBlock.updateMany({
            where: { id: block.id, active: true, expiresAt: { lte: new Date() } },
            data: {
              active: false,
              deactivatedAt: new Date(),
              deactivationReason: 'EXPIRED',
            },
          });
          if (updated.count === 0) {
            return;
          }

          await tx.auditLog.create({
            data: {
              actorType: 'WORKER',
              action: 'IP_BLOCK_EXPIRED',
              category: 'IP_PROTECTION',
              targetType: 'IP_BLOCK',
              targetId: block.id,
              ipBlockId: block.id,
              reason: 'IP_BLOCK_EXPIRED',
            },
          });

          const related = await tx.sanction.updateMany({
            where: { ipBlockId: block.id, type: 'IP_BLOCK', status: 'ACTIVE' },
            data: { status: 'EXPIRED' },
          });

          if (related.count > 0) {
            const linked = await tx.sanction.findFirst({
              where: { ipBlockId: block.id, type: 'IP_BLOCK' },
              select: { id: true },
            });
            if (linked) {
              await tx.auditLog.create({
                data: {
                  actorType: 'WORKER',
                  action: 'SANCTION_EXPIRED',
                  category: 'SANCTION',
                  targetType: 'SANCTION',
                  targetId: linked.id,
                  sanctionId: linked.id,
                  ipBlockId: block.id,
                  reason: 'IP_BLOCK_EXPIRED',
                },
              });
            }
          }
        });
      }

      if (dueSanctions.length || dueIpBlocks.length) {
        this.logger.log(
          `Processed ${dueSanctions.length} due sanctions and ${dueIpBlocks.length} due IP blocks`,
        );
      }
    } finally {
      this.running = false;
    }
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
