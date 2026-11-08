import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

import { IpIdentityService } from './ip-identity.service';

export const TEMP_IP_DURATION_MS = {
  '15M': 15 * 60_000,
  '1H': 60 * 60_000,
  '24H': 24 * 60 * 60_000,
  '3D': 3 * 24 * 60 * 60_000,
  '7D': 7 * 24 * 60 * 60_000,
  '30D': 30 * 24 * 60 * 60_000,
} as const;

export type TemporaryIpDuration = keyof typeof TEMP_IP_DURATION_MS;

export interface TemporaryIpBlockCommand {
  address: string;
  duration: TemporaryIpDuration;
  reasonCode: string;
  source: 'MANUAL' | 'RATE_LIMIT_ESCALATION';
  actorUserId?: string;
  internalNote?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const REASON_PATTERN = /^[A-Z][A-Z0-9_]{1,79}$/u;

/** Expiring IP blocks; no raw IP or secret is ever written to PostgreSQL. */
@Injectable()
export class TemporaryIpBlockService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  constructor(private readonly identity: IpIdentityService) {}

  async findActive(address: string, at: Date = new Date()) {
    const hashes = this.identity.candidateHashes(address);
    return this.database.iPBlock.findFirst({
      where: {
        OR: hashes.map((hash) => ({
          ipHash: hash.ipHash,
          hashKeyVersion: hash.hashKeyVersion,
        })),
        active: true,
        startsAt: { lte: at },
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] }],
      },
      select: { id: true, expiresAt: true },
    });
  }

  /**
   * Manual issuance is deliberately internal until Task 184 adds an
   * authenticated, permission-checked endpoint. Never expose this method
   * directly as an HTTP route.
   */
  async issueManual(
    address: string,
    duration: Exclude<TemporaryIpDuration, '15M' | '1H'>,
    actorUserId: string,
    reasonCode = 'MANUAL_SECURITY_ACTION',
    internalNote?: string,
  ) {
    if (!UUID_PATTERN.test(actorUserId)) throw new Error('IP_TEMP_BLOCK_ACTOR_INVALID');
    return this.issue({
      address,
      duration,
      source: 'MANUAL',
      reasonCode,
      actorUserId,
      internalNote,
    });
  }

  /** Only called by the explicitly opt-in repeated-write-abuse policy. */
  issueAutomatic(address: string) {
    return this.issue({
      address,
      duration: '15M',
      source: 'RATE_LIMIT_ESCALATION',
      reasonCode: 'REPEATED_WRITE_ABUSE',
    });
  }

  async issue(command: TemporaryIpBlockCommand) {
    if (
      !(command.duration in TEMP_IP_DURATION_MS) ||
      !REASON_PATTERN.test(command.reasonCode) ||
      !['MANUAL', 'RATE_LIMIT_ESCALATION'].includes(command.source) ||
      (command.source === 'MANUAL' &&
        (!command.actorUserId || !UUID_PATTERN.test(command.actorUserId))) ||
      (command.source !== 'MANUAL' && command.actorUserId !== undefined) ||
      (command.source === 'MANUAL' && !['24H', '3D', '7D', '30D'].includes(command.duration)) ||
      (command.source === 'RATE_LIMIT_ESCALATION' &&
        (command.duration !== '15M' || command.internalNote !== undefined)) ||
      (command.internalNote !== undefined &&
        (command.internalNote.length < 1 || command.internalNote.length > 2000))
    ) {
      throw new Error('IP_TEMP_BLOCK_COMMAND_INVALID');
    }
    const current = this.identity.hash(command.address);
    const candidates = this.identity.candidateHashes(command.address);
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + TEMP_IP_DURATION_MS[command.duration]);
    if (!Number.isFinite(expiresAt.getTime())) throw new Error('IP_TEMP_BLOCK_EXPIRY_INVALID');

    try {
      return await this.database.$transaction(
        async (tx) => {
          const existing = await tx.iPBlock.findFirst({
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
          if (existing) {
            throw new ConflictException({
              code: 'IP_TEMP_BLOCK_ALREADY_ACTIVE',
              message: 'A restriction for this network is already active.',
            });
          }

          const record = await tx.iPBlock.create({
            data: {
              ipHash: current.ipHash,
              hashKeyVersion: current.hashKeyVersion,
              source: command.source,
              reasonCode: command.reasonCode,
              internalNote: command.internalNote ?? null,
              createdById: command.actorUserId ?? null,
              active: true,
              startsAt,
              expiresAt,
            },
            select: { id: true, startsAt: true, expiresAt: true, active: true },
          });

          // A formal manually issued block has a linked sanction.
          // Automatic technical protection never becomes an account sanction.
          const sanction =
            command.source === 'MANUAL'
              ? await tx.sanction.create({
                  data: {
                    ipBlockId: record.id,
                    type: 'IP_BLOCK',
                    status: 'ACTIVE',
                    reasonCode: command.reasonCode,
                    internalNote: command.internalNote ?? null,
                    createdById: command.actorUserId,
                    startsAt,
                    expiresAt,
                  },
                  select: { id: true },
                })
              : null;

          await tx.auditLog.create({
            data: {
              actorType: command.source === 'MANUAL' ? 'USER' : 'SECURITY_AUTOMATION',
              actorUserId: command.actorUserId ?? null,
              action: 'IP_BLOCK_CREATED',
              category: 'IP_PROTECTION',
              targetType: 'IP_BLOCK',
              targetId: record.id,
              ipBlockId: record.id,
              sanctionId: sanction?.id ?? null,
              reason: command.reasonCode,
              metadata: {
                source: command.source,
                duration: command.duration,
                hashKeyVersion: current.hashKeyVersion,
              },
            },
          });

          if (sanction) {
            await tx.auditLog.create({
              data: {
                actorType: 'USER',
                actorUserId: command.actorUserId,
                action: 'SANCTION_CREATED',
                category: 'SANCTION',
                targetType: 'SANCTION',
                targetId: sanction.id,
                ipBlockId: record.id,
                sanctionId: sanction.id,
                reason: command.reasonCode,
              },
            });
          }

          return {
            id: record.id,
            active: record.active,
            startsAt: record.startsAt,
            expiresAt: record.expiresAt,
            sanctionId: sanction?.id ?? null,
          };
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      const caught: unknown = error;
      if (caught && typeof caught === 'object' && 'code' in caught && caught.code === 'P2034') {
        throw new ConflictException({
          code: 'IP_TEMP_BLOCK_CONCURRENT_CREATE',
          message: 'The network restriction has changed concurrently.',
        });
      }
      throw error;
    }
  }

  /**
   * Reverse a manual decision, without ever retrieving or exposing its HMAC or
   * the network address. A compare-and-update makes concurrent revocations
   * and expiry-worker races auditable and non-duplicating.
   */
  async revokeManual(
    blockId: string,
    actorUserId: string,
    reasonCode: string,
    moderatorNote: string,
  ) {
    if (
      !UUID_PATTERN.test(blockId) ||
      !UUID_PATTERN.test(actorUserId) ||
      !REASON_PATTERN.test(reasonCode) ||
      moderatorNote.length < 1 ||
      moderatorNote.length > 2000
    ) {
      throw new Error('MANUAL_IP_BAN_REVOCATION_INVALID');
    }

    const at = new Date();
    try {
      return await this.database.$transaction(
        async (tx) => {
          const block = await tx.iPBlock.findUnique({
            where: { id: blockId },
            select: {
              id: true,
              source: true,
              active: true,
              expiresAt: true,
              sanction: { select: { id: true, status: true } },
            },
          });

          if (!block || block.source !== 'MANUAL') {
            throw new NotFoundException({
              code: 'MANUAL_IP_BAN_NOT_FOUND',
              message: 'Manual network restriction not found.',
            });
          }

          if (
            !block.active ||
            !block.expiresAt ||
            block.expiresAt <= at ||
            block.sanction?.status !== 'ACTIVE'
          ) {
            throw new ConflictException({
              code: 'MANUAL_IP_BAN_NOT_ACTIVE',
              message: 'This network restriction is no longer active.',
            });
          }

          const updated = await tx.iPBlock.updateMany({
            where: { id: block.id, source: 'MANUAL', active: true, expiresAt: { gt: at } },
            data: {
              active: false,
              deactivatedAt: at,
              deactivatedById: actorUserId,
              deactivationReason: reasonCode,
            },
          });
          if (updated.count !== 1) {
            throw new ConflictException({ code: 'MANUAL_IP_BAN_CONCURRENT_UPDATE' });
          }

          const sanctionId = block.sanction.id;
          const revoked = await tx.sanction.updateMany({
            where: { id: sanctionId, status: 'ACTIVE' },
            data: {
              status: 'REVOKED',
              revokedAt: at,
              revokedById: actorUserId,
              revocationReason: reasonCode,
            },
          });
          if (revoked.count !== 1) {
            throw new ConflictException({ code: 'MANUAL_IP_BAN_CONCURRENT_UPDATE' });
          }

          await tx.auditLog.create({
            data: {
              actorType: 'USER',
              actorUserId,
              action: 'IP_BLOCK_DEACTIVATED',
              category: 'IP_PROTECTION',
              targetType: 'IP_BLOCK',
              targetId: block.id,
              ipBlockId: block.id,
              sanctionId,
              reason: reasonCode,
              metadata: { moderatorNote },
            },
          });
          await tx.auditLog.create({
            data: {
              actorType: 'USER',
              actorUserId,
              action: 'SANCTION_REVOKED',
              category: 'SANCTION',
              targetType: 'SANCTION',
              targetId: sanctionId,
              sanctionId,
              ipBlockId: block.id,
              reason: reasonCode,
            },
          });

          return { id: block.id, active: false, revokedAt: at, sanctionId };
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      const caught: unknown = error;
      if (caught && typeof caught === 'object' && 'code' in caught && caught.code === 'P2034') {
        throw new ConflictException({ code: 'MANUAL_IP_BAN_CONCURRENT_UPDATE' });
      }
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
