import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

export type SportsCorrectionEntity = 'CLUB' | 'MATCH';
export type SportsCorrectionDecision = 'MATCH' | 'REJECT';

export interface SportsCorrectionInput {
  decision: SportsCorrectionDecision;
  targetId?: string;
  expectedUpdatedAt: string;
  reason: string;
}

const REVIEW_STATUSES = ['PENDING', 'UNMATCHED', 'AMBIGUOUS', 'REVIEW_REQUIRED'] as const;

/**
 * A human can correct provider-scoped sporting identities without changing
 * canonical clubs, fixtures, results or standings.
 */
@Injectable()
export class SportsCorrectionsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async list(status: 'review' | 'all', limit: number) {
    return this.database.entityMatch.findMany({
      where: {
        provider: { type: 'SPORTS' },
        entityType: { in: ['CLUB', 'MATCH'] },
        ...(status === 'review' ? { status: { in: [...REVIEW_STATUSES] } } : {}),
      },
      take: Math.min(Math.max(limit, 1), 50),
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        providerId: true,
        entityType: true,
        externalId: true,
        externalName: true,
        status: true,
        confidence: true,
        method: true,
        clubId: true,
        matchId: true,
        evidence: true,
        updatedAt: true,
        reviewedAt: true,
        provider: { select: { key: true, name: true } },
        club: { select: { name: true } },
        match: {
          select: {
            kickoff: true,
            homeClub: { select: { name: true } },
            awayClub: { select: { name: true } },
          },
        },
      },
    });
  }

  async candidates(entityType: SportsCorrectionEntity, query: string) {
    const search = query.trim();
    if (entityType === 'CLUB') {
      return this.database.club.findMany({
        where: { active: true, name: { contains: search, mode: 'insensitive' } },
        select: { id: true, name: true, slug: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        take: 20,
      });
    }

    return this.database.match.findMany({
      where: {
        OR: [
          { homeClub: { name: { contains: search, mode: 'insensitive' } } },
          { awayClub: { name: { contains: search, mode: 'insensitive' } } },
          ...(this.isUuid(search) ? [{ id: search }] : []),
        ],
      },
      select: {
        id: true,
        kickoff: true,
        matchday: true,
        competition: { select: { name: true } },
        season: { select: { name: true } },
        homeClub: { select: { name: true } },
        awayClub: { select: { name: true } },
      },
      orderBy: [{ kickoff: 'desc' }, { id: 'desc' }],
      take: 20,
    });
  }

  async correct(id: string, actorUserId: string, input: SportsCorrectionInput) {
    if (!input.reason.trim() || input.reason.trim().length < 10) {
      throw new ConflictException({
        code: 'SPORTS_CORRECTION_REASON_REQUIRED',
        message: 'Eine aussagekräftige Begründung ist erforderlich.',
      });
    }

    // Serializable transaction and the SAME provider/external-ID advisory
    // lock as the import worker prevent races with automated matching.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        return await this.database.$transaction(
          async (tx) => {
            const identity = await tx.entityMatch.findUnique({
              where: { id },
              select: { id: true, providerId: true, entityType: true, externalId: true },
            });
            if (!identity || !['CLUB', 'MATCH'].includes(identity.entityType)) {
              throw new NotFoundException({
                code: 'SPORTS_CORRECTION_NOT_FOUND',
                message: 'Die Sport-Zuordnung wurde nicht gefunden.',
              });
            }

            const namespace = identity.entityType === 'CLUB' ? 202 : 203;
            const lock = `${identity.providerId}:${identity.entityType}:${identity.externalId}`;
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lock}, ${namespace}))`;

            const mapping = await tx.entityMatch.findUniqueOrThrow({
              where: { id },
              select: {
                id: true,
                providerId: true,
                entityType: true,
                externalId: true,
                status: true,
                clubId: true,
                matchId: true,
                updatedAt: true,
                provider: { select: { type: true } },
              },
            });

            if (mapping.provider.type !== 'SPORTS') {
              throw new NotFoundException({
                code: 'SPORTS_CORRECTION_NOT_FOUND',
                message: 'Die Sport-Zuordnung wurde nicht gefunden.',
              });
            }
            if (mapping.updatedAt.toISOString() !== input.expectedUpdatedAt) {
              throw new ConflictException({
                code: 'SPORTS_CORRECTION_STALE',
                message: 'Diese Zuordnung wurde inzwischen geändert. Bitte neu laden.',
              });
            }

            const entityType = mapping.entityType as SportsCorrectionEntity;
            let targetId: string | null = null;
            if (input.decision === 'MATCH') {
              if (!input.targetId) {
                throw new ConflictException({
                  code: 'SPORTS_CORRECTION_TARGET_REQUIRED',
                  message: 'Für die Zuordnung ist ein Ziel erforderlich.',
                });
              }
              targetId = input.targetId;
              const targetLock = `${mapping.providerId}:${entityType}:target:${targetId}`;
              await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${targetLock}, 205))`;

              if (entityType === 'CLUB') {
                const club = await tx.club.findUnique({
                  where: { id: targetId },
                  select: { active: true },
                });
                if (!club?.active) {
                  throw new ConflictException({
                    code: 'SPORTS_CORRECTION_INACTIVE_CLUB',
                    message: 'Nur vorhandene aktive Vereine dürfen zugeordnet werden.',
                  });
                }
              } else {
                const match = await tx.match.findUnique({
                  where: { id: targetId },
                  select: {
                    competitionId: true,
                    homeClubId: true,
                    awayClubId: true,
                    season: { select: { competitionId: true } },
                    homeClub: { select: { active: true } },
                    awayClub: { select: { active: true } },
                  },
                });
                if (
                  !match ||
                  !match.homeClub.active ||
                  !match.awayClub.active ||
                  match.homeClubId === match.awayClubId ||
                  match.season.competitionId !== match.competitionId
                ) {
                  throw new ConflictException({
                    code: 'SPORTS_CORRECTION_INVALID_MATCH',
                    message: 'Das Zielspiel hat eine ungültige oder inaktive Zuordnung.',
                  });
                }
                const collision = await tx.entityMatch.findFirst({
                  where: {
                    providerId: mapping.providerId,
                    entityType: 'MATCH',
                    status: 'MATCHED',
                    matchId: targetId,
                    id: { not: mapping.id },
                  },
                  select: { id: true },
                });
                if (collision) {
                  throw new ConflictException({
                    code: 'SPORTS_CORRECTION_MATCH_ALREADY_BOUND',
                    message: 'Dieses Spiel ist bereits einer anderen Provider-ID zugeordnet.',
                  });
                }
              }
            }

            const priorTargetId = entityType === 'CLUB' ? mapping.clubId : mapping.matchId;
            const reviewedAt = new Date();
            const approved = input.decision === 'MATCH';
            const updated = await tx.entityMatch.update({
              where: { id },
              data: {
                status: approved ? 'MATCHED' : 'REJECTED',
                confidence: approved ? 'HIGH' : 'UNKNOWN',
                method: approved ? 'MANUAL' : null,
                clubId: entityType === 'CLUB' ? targetId : null,
                matchId: entityType === 'MATCH' ? targetId : null,
                reviewedById: actorUserId,
                reviewedAt,
              },
              select: {
                id: true,
                entityType: true,
                externalId: true,
                status: true,
                clubId: true,
                matchId: true,
                reviewedAt: true,
                updatedAt: true,
              },
            });

            const reviewedRecords = await tx.importRecord.updateMany({
              where: {
                providerId: mapping.providerId,
                externalId: mapping.externalId,
                recordType:
                  entityType === 'CLUB'
                    ? 'SPORTS_CLUB'
                    : { in: ['SPORTS_MATCH', 'SPORTS_RESULT'] },
                reviewDecision: null,
                status: { in: ['REVIEW_REQUIRED', 'MATCHED'] },
              },
              data: {
                status: approved ? 'MATCHED' : 'SKIPPED',
                canonicalEntityType: approved ? entityType : null,
                canonicalEntityId: targetId,
                reviewDecision: approved ? 'APPROVED' : 'REJECTED',
                reviewedById: actorUserId,
                reviewedAt,
              },
            });

            await tx.auditLog.create({
              data: {
                actorType: 'USER',
                actorUserId,
                action: 'ADMIN_CORRECTION',
                category: 'SYSTEM',
                targetType: entityType,
                targetId,
                reason: input.reason.trim(),
                metadata: {
                  source: 'sports-correction-v1',
                  providerId: mapping.providerId,
                  externalId: mapping.externalId,
                  entityType,
                  decision: input.decision,
                  previousStatus: mapping.status,
                  previousTargetId: priorTargetId,
                  newTargetId: targetId,
                  reviewedRecords: reviewedRecords.count,
                },
              },
            });
            return updated;
          },
          { isolationLevel: 'Serializable' },
        );
      } catch (error) {
        const code =
          error !== null && typeof error === 'object' && 'code' in error
            ? (error as { code?: unknown }).code
            : null;
        if (code === 'P2034' && attempt < 3) continue;
        throw error;
      }
    }

    throw new ConflictException({
      code: 'SPORTS_CORRECTION_CONCURRENT_UPDATE',
      message: 'Die Zuordnung wurde zeitgleich bearbeitet.',
    });
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
