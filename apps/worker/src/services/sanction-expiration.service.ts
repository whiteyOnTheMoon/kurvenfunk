import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

const INTERVAL_MS = 60_000;
const BATCH_SIZE = 50;

@Injectable()
export class SanctionExpirationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SanctionExpirationService.name);
  private timer?: NodeJS.Timeout;
  private scanning = false;

  constructor(private readonly database: DatabaseService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.expireDueSanctions().catch(() => {
        this.logger.error('Sanction expiration scan failed');
      });
    }, INTERVAL_MS);
    this.timer.unref();

    // Also recover sanctions whose deadlines elapsed during worker downtime.
    void this.expireDueSanctions().catch(() => {
      this.logger.error('Initial sanction expiration scan failed');
    });
  }

  async expireDueSanctions(at: Date = new Date()): Promise<void> {
    if (this.scanning) {
      return;
    }

    this.scanning = true;

    try {
      await this.expireUserSanctions(at);
      await this.expireIPBlocks(at);
    } finally {
      this.scanning = false;
    }
  }

  private async expireUserSanctions(at: Date): Promise<void> {
    const db = this.database.client;
    const candidates = await db.sanction.findMany({
      where: {
        type: { in: ['LIMITED', 'COMMENT_BLOCK', 'FORUM_BLOCK'] },
        status: 'ACTIVE',
        expiresAt: { lte: at },
      },
      select: { id: true, type: true, userId: true },
      orderBy: { expiresAt: 'asc' },
      take: BATCH_SIZE,
    });

    for (const candidate of candidates) {
      await db.$transaction(
        async (tx) => {
          let userStatus: 'ACTIVE' | 'LIMITED' | 'BANNED' | null = null;

          if (candidate.userId) {
            // Lock order matches direct RED / LIMITED issuance: User row first.
            const users = await tx.$queryRaw<
              Array<{ id: string; status: 'ACTIVE' | 'LIMITED' | 'BANNED' }>
            >`
              SELECT "id", "status" FROM "User"
              WHERE "id" = ${candidate.userId}::uuid FOR UPDATE
            `;
            userStatus = users[0]?.status ?? null;
          }

          const updated = await tx.sanction.updateMany({
            where: { id: candidate.id, status: 'ACTIVE', expiresAt: { lte: at } },
            data: { status: 'EXPIRED' },
          });

          if (updated.count !== 1) {
            return;
          }

          await tx.auditLog.create({
            data: {
              actorType: 'WORKER',
              action: 'SANCTION_EXPIRED',
              category: 'SANCTION',
              targetType: 'SANCTION',
              targetId: candidate.id,
              targetUserId: candidate.userId,
              sanctionId: candidate.id,
              reason: 'SANCTION_EXPIRED',
              metadata: { sanctionType: candidate.type },
            },
          });

          if (candidate.type !== 'LIMITED' || !candidate.userId || userStatus !== 'LIMITED') {
            return;
          }

          // Another overlapping LIMITED sanction or an account ban must win.
          const remaining = await tx.sanction.count({
            where: {
              userId: candidate.userId,
              type: 'LIMITED',
              status: 'ACTIVE',
              OR: [{ expiresAt: null }, { expiresAt: { gt: at } }],
            },
          });

          if (remaining > 0) {
            return;
          }

          const restored = await tx.user.updateMany({
            where: { id: candidate.userId, status: 'LIMITED' },
            data: { status: 'ACTIVE' },
          });

          if (restored.count !== 1) {
            return;
          }

          await tx.auditLog.create({
            data: {
              actorType: 'WORKER',
              action: 'USER_STATUS_CHANGED',
              category: 'ACCOUNT',
              targetType: 'USER',
              targetId: candidate.userId,
              targetUserId: candidate.userId,
              sanctionId: candidate.id,
              reason: 'LIMITED_EXPIRED',
              metadata: { previousStatus: 'LIMITED', newStatus: 'ACTIVE' },
            },
          });
        },
        { isolationLevel: 'ReadCommitted' },
      );
    }
  }

  private async expireIPBlocks(at: Date): Promise<void> {
    const db = this.database.client;
    const blocks = await db.iPBlock.findMany({
      where: { active: true, expiresAt: { lte: at } },
      select: { id: true },
      orderBy: { expiresAt: 'asc' },
      take: BATCH_SIZE,
    });

    for (const block of blocks) {
      await db.$transaction(
        async (tx) => {
          const updated = await tx.iPBlock.updateMany({
            where: { id: block.id, active: true, expiresAt: { lte: at } },
            data: {
              active: false,
              deactivatedAt: at,
              deactivationReason: 'EXPIRED',
            },
          });

          if (updated.count !== 1) {
            return;
          }

          const linked = await tx.sanction.findUnique({
            where: { ipBlockId: block.id },
            select: { id: true },
          });

          if (linked) {
            await tx.sanction.updateMany({
              where: { id: linked.id, status: 'ACTIVE' },
              data: { status: 'EXPIRED' },
            });

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
        },
        { isolationLevel: 'ReadCommitted' },
      );
    }
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
