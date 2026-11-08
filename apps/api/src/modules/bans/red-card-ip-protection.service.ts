import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

import { IpIdentityService } from './ip-identity.service';
import { TEMP_IP_DURATION_MS } from './temporary-ip-block.service';

export type RedCardIpProtectionDuration = '15M' | '1H' | '24H';

export interface RedCardIpProtectionCommand {
  cardId: string;
  address: string;
  duration: RedCardIpProtectionDuration;
  reasonCode: string;
  moderatorNote: string;
  actorUserId: string;
  sharedIpRiskAccepted: true;
}

export interface RevokeRedCardIpProtectionCommand {
  cardId: string;
  blockId: string;
  actorUserId: string;
  reasonCode: string;
  moderatorNote: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const REASON_PATTERN = /^[A-Z][A-Z0-9_]{1,79}$/u;

function validEvidence(reasonCode: string, moderatorNote: string): boolean {
  return REASON_PATTERN.test(reasonCode) &&
    moderatorNote.trim().length > 0 &&
    moderatorNote.length <= 2000;
}

/**
 * Task 185: a red card never implies a network block. Only an explicit
 * SUPERADMIN-authorized API request can attach bounded IP protection.
 * IP identity is not evidence of account ownership (shared IP / CGNAT / VPN).
 */
@Injectable()
export class RedCardIpProtectionService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  constructor(private readonly identity: IpIdentityService) {}

  async issue(command: RedCardIpProtectionCommand) {
    if (
      !UUID_PATTERN.test(command.cardId) ||
      !UUID_PATTERN.test(command.actorUserId) ||
      !['15M', '1H', '24H'].includes(command.duration) ||
      command.sharedIpRiskAccepted !== true ||
      !validEvidence(command.reasonCode, command.moderatorNote)
    ) {
      throw new Error('RED_CARD_IP_PROTECTION_INVALID');
    }

    // Derive both the current hash and retained-key hashes on the server.
    // The address and HMAC secrets must never be persisted or audited.
    const hash = this.identity.hash(command.address);
    const candidates = this.identity.candidateHashes(command.address);
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + TEMP_IP_DURATION_MS[command.duration]);

    try {
      return await this.database.$transaction(
        async (tx) => {
          const card = await tx.moderationCard.findUnique({
            where: { id: command.cardId },
            select: {
              id: true,
              type: true,
              status: true,
              revokedAt: true,
              expiresAt: true,
              user: { select: { status: true } },
            },
          });

          if (!card || card.type !== 'RED') {
            throw new NotFoundException({
              code: 'RED_CARD_IP_PROTECTION_CARD_NOT_FOUND',
              message: 'Red card not found.',
            });
          }
          if (
            card.status !== 'ACTIVE' ||
            card.revokedAt !== null ||
            (card.expiresAt !== null && card.expiresAt <= startsAt) ||
            card.user.status !== 'BANNED'
          ) {
            throw new ConflictException({
              code: 'RED_CARD_IP_PROTECTION_CARD_NOT_ACTIVE',
              message: 'Red card is not currently enforceable.',
            });
          }

          // No collection of IP addresses may silently grow against one card.
          const existingCardProtection = await tx.sanction.findFirst({
            where: {
              sourceCardId: card.id,
              type: 'IP_BLOCK',
              status: 'ACTIVE',
              expiresAt: { gt: startsAt },
            },
            select: { id: true },
          });
          if (existingCardProtection) {
            throw new ConflictException({
              code: 'RED_CARD_IP_PROTECTION_ALREADY_ACTIVE',
              message: 'A temporary network restriction is already linked to this card.',
            });
          }

          const existingNetworkBlock = await tx.iPBlock.findFirst({
            where: {
              OR: candidates.map((candidate) => ({
                ipHash: candidate.ipHash,
                hashKeyVersion: candidate.hashKeyVersion,
              })),
              active: true,
              startsAt: { lte: startsAt },
              AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: startsAt } }] }],
            },
            select: { id: true },
          });
          if (existingNetworkBlock) {
            throw new ConflictException({
              code: 'RED_CARD_IP_PROTECTION_IP_ALREADY_BLOCKED',
              message: 'A restriction for this network is already active.',
            });
          }

          const block = await tx.iPBlock.create({
            data: {
              ipHash: hash.ipHash,
              hashKeyVersion: hash.hashKeyVersion,
              source: 'SANCTION',
              reasonCode: command.reasonCode,
              internalNote: command.moderatorNote,
              createdById: command.actorUserId,
              startsAt,
              expiresAt,
              active: true,
            },
            select: { id: true, active: true, startsAt: true, expiresAt: true },
          });

          // sourceCardId is the provenance link, not proof that the IP
          // belongs exclusively to the banned person. No extra account ban.
          const sanction = await tx.sanction.create({
            data: {
              sourceCardId: card.id,
              ipBlockId: block.id,
              type: 'IP_BLOCK',
              status: 'ACTIVE',
              reasonCode: command.reasonCode,
              internalNote: command.moderatorNote,
              createdById: command.actorUserId,
              startsAt,
              expiresAt,
            },
            select: { id: true },
          });

          await tx.auditLog.create({
            data: {
              actorType: 'USER',
              actorUserId: command.actorUserId,
              action: 'IP_BLOCK_CREATED',
              category: 'IP_PROTECTION',
              targetType: 'IP_BLOCK',
              targetId: block.id,
              moderationCardId: card.id,
              ipBlockId: block.id,
              sanctionId: sanction.id,
              reason: command.reasonCode,
              metadata: {
                source: 'SANCTION',
                duration: command.duration,
                hashKeyVersion: hash.hashKeyVersion,
                sharedIpRiskAccepted: true,
              },
            },
          });
          await tx.auditLog.create({
            data: {
              actorType: 'USER',
              actorUserId: command.actorUserId,
              action: 'SANCTION_CREATED',
              category: 'SANCTION',
              targetType: 'SANCTION',
              targetId: sanction.id,
              moderationCardId: card.id,
              ipBlockId: block.id,
              sanctionId: sanction.id,
              reason: command.reasonCode,
            },
          });

          return {
            id: block.id,
            redCardId: card.id,
            sanctionId: sanction.id,
            active: block.active,
            startsAt: block.startsAt,
            expiresAt: block.expiresAt,
          };
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2034') {
        throw new ConflictException({ code: 'RED_CARD_IP_PROTECTION_CONCURRENT_CREATE' });
      }
      throw error;
    }
  }

  async revoke(command: RevokeRedCardIpProtectionCommand) {
    if (
      !UUID_PATTERN.test(command.cardId) ||
      !UUID_PATTERN.test(command.blockId) ||
      !UUID_PATTERN.test(command.actorUserId) ||
      !validEvidence(command.reasonCode, command.moderatorNote)
    ) {
      throw new Error('RED_CARD_IP_PROTECTION_REVOKE_INVALID');
    }

    const at = new Date();
    try {
      return await this.database.$transaction(
        async (tx) => {
          const block = await tx.iPBlock.findUnique({
            where: { id: command.blockId },
            select: {
              id: true,
              source: true,
              active: true,
              expiresAt: true,
              sanction: {
                select: { id: true, sourceCardId: true, type: true, status: true },
              },
            },
          });

          if (
            !block ||
            block.source !== 'SANCTION' ||
            block.sanction?.sourceCardId !== command.cardId ||
            block.sanction.type !== 'IP_BLOCK'
          ) {
            throw new NotFoundException({
              code: 'RED_CARD_IP_PROTECTION_NOT_FOUND',
              message: 'Linked network restriction not found.',
            });
          }

          if (
            !block.active ||
            !block.expiresAt ||
            block.expiresAt <= at ||
            block.sanction.status !== 'ACTIVE'
          ) {
            throw new ConflictException({ code: 'RED_CARD_IP_PROTECTION_NOT_ACTIVE' });
          }

          const updated = await tx.iPBlock.updateMany({
            where: { id: block.id, source: 'SANCTION', active: true, expiresAt: { gt: at } },
            data: {
              active: false,
              deactivatedAt: at,
              deactivatedById: command.actorUserId,
              deactivationReason: command.reasonCode,
            },
          });
          if (updated.count !== 1) {
            throw new ConflictException({ code: 'RED_CARD_IP_PROTECTION_CONCURRENT_REVOKE' });
          }
          const revoked = await tx.sanction.updateMany({
            where: {
              id: block.sanction.id,
              sourceCardId: command.cardId,
              type: 'IP_BLOCK',
              status: 'ACTIVE',
            },
            data: {
              status: 'REVOKED',
              revokedAt: at,
              revokedById: command.actorUserId,
              revocationReason: command.reasonCode,
            },
          });
          if (revoked.count !== 1) {
            throw new ConflictException({ code: 'RED_CARD_IP_PROTECTION_CONCURRENT_REVOKE' });
          }

          await tx.auditLog.create({
            data: {
              actorType: 'USER',
              actorUserId: command.actorUserId,
              action: 'IP_BLOCK_DEACTIVATED',
              category: 'IP_PROTECTION',
              targetType: 'IP_BLOCK',
              targetId: block.id,
              ipBlockId: block.id,
              sanctionId: block.sanction.id,
              moderationCardId: command.cardId,
              reason: command.reasonCode,
              metadata: { moderatorNote: command.moderatorNote },
            },
          });
          await tx.auditLog.create({
            data: {
              actorType: 'USER',
              actorUserId: command.actorUserId,
              action: 'SANCTION_REVOKED',
              category: 'SANCTION',
              targetType: 'SANCTION',
              targetId: block.sanction.id,
              sanctionId: block.sanction.id,
              ipBlockId: block.id,
              moderationCardId: command.cardId,
              reason: command.reasonCode,
            },
          });

          // Deliberately do not revoke a red card or unban its user.
          return {
            id: block.id,
            redCardId: command.cardId,
            sanctionId: block.sanction.id,
            active: false,
            revokedAt: at,
          };
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2034') {
        throw new ConflictException({ code: 'RED_CARD_IP_PROTECTION_CONCURRENT_REVOKE' });
      }
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
