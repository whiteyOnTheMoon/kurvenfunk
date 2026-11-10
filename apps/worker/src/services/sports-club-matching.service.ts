import type { SportsProviderClub } from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { SportsImportSession } from './sports-import.store';
import { normalizeSportsClubName, resolveSportsClubName } from './sports-club-matching';

export type SportsClubMatchOutcome =
  | { status: 'MATCHED'; clubId: string; method: 'CANONICAL_NAME' | 'ALIAS' | 'EXTERNAL_ID' | 'MANUAL' }
  | { status: 'REVIEW_REQUIRED'; reason: 'UNMATCHED' | 'AMBIGUOUS' | 'REJECTED' | 'INACTIVE_MAPPING' | 'MANUAL_REVIEW' };

/**
 * Maps provider-specific club IDs to existing canonical clubs, never creating,
 * renaming or mutating Club or ClubAlias. All matches remain traceable in the
 * existing EntityMatch and ImportRecord tables.
 */
@Injectable()
export class SportsClubMatchingService {
  constructor(private readonly database: DatabaseService) {}

  async matchStaged(
    session: SportsImportSession,
    club: SportsProviderClub,
  ): Promise<SportsClubMatchOutcome> {
    if (
      club.kind !== 'club' ||
      !club.externalId.trim() ||
      club.externalId.length > 160 ||
      !club.name.trim() ||
      club.name.length > 200
    ) {
      throw new Error('SPORTS_CLUB_INVALID_RECORD');
    }

    return this.database.client.$transaction(async (tx) => {
      // A retry and another worker must not concurrently decide the same
      // provider-scoped external identity.
      const lockKey = session.providerId + ':CLUB:' + club.externalId;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 202))`;

      const importRecord = await tx.importRecord.findFirst({
        where: {
          importJobId: session.importJobId,
          providerId: session.providerId,
          recordType: 'SPORTS_CLUB',
          externalId: club.externalId,
        },
        select: {
          id: true,
          status: true,
          canonicalEntityId: true,
          reviewedAt: true,
        },
      });
      if (!importRecord) throw new Error('SPORTS_CLUB_IMPORT_RECORD_MISSING');

      const key = {
        providerId: session.providerId,
        entityType: 'CLUB' as const,
        externalId: club.externalId,
      };
      const prior = await tx.entityMatch.findUnique({
        where: { providerId_entityType_externalId: key },
        select: {
          id: true,
          status: true,
          clubId: true,
          method: true,
          reviewedAt: true,
        },
      });

      const setRecord = async (clubId: string | null): Promise<void> => {
        if (
          importRecord.status === (clubId ? 'MATCHED' : 'REVIEW_REQUIRED') &&
          importRecord.canonicalEntityId === clubId
        ) return;
        await tx.importRecord.update({
          where: { id: importRecord.id },
          data: {
            status: clubId ? 'MATCHED' : 'REVIEW_REQUIRED',
            canonicalEntityType: clubId ? 'CLUB' : null,
            canonicalEntityId: clubId,
          },
        });
      };

      // Editorial decisions and explicitly rejected mappings must never be
      // silently reinterpreted by a fresh import.
      if (importRecord.reviewedAt || prior?.status === 'REJECTED') {
        return { status: 'REVIEW_REQUIRED', reason: 'REJECTED' };
      }
      if (prior?.reviewedAt && prior.status !== 'MATCHED') {
        return { status: 'REVIEW_REQUIRED', reason: 'MANUAL_REVIEW' };
      }

      // Once a provider-specific ID was safely bound, the stable external ID
      // wins over later spellings; the canonical target must still be active.
      if (prior?.status === 'MATCHED') {
        const target = prior.clubId
          ? await tx.club.findUnique({
              where: { id: prior.clubId },
              select: { active: true },
            })
          : null;
        if (prior.clubId && target?.active) {
          await setRecord(prior.clubId);
          return {
            status: 'MATCHED',
            clubId: prior.clubId,
            method: prior.method === 'MANUAL' ? 'MANUAL' : 'EXTERNAL_ID',
          };
        }
        await setRecord(null);
        return { status: 'REVIEW_REQUIRED', reason: 'INACTIVE_MAPPING' };
      }

      // The official name and enabled aliases of active clubs are the only
      // automatic candidates. Short names are presentation-only unless an
      // editor deliberately added them as aliases.
      const clubs = await tx.club.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          aliases: {
            where: { active: true },
            select: { normalizedAlias: true },
          },
        },
      });
      const result = resolveSportsClubName(club.name, clubs);
      const matched = result.kind === 'MATCHED';
      const id = matched ? result.clubId : null;
      const method = matched ? result.method : null;

      const matchData = {
        externalName: club.name,
        status: matched ? ('MATCHED' as const) : result.kind,
        confidence: matched ? ('HIGH' as const) : ('UNKNOWN' as const),
        method,
        clubId: id,
        lastSeenAt: new Date(),
        evidence: {
          source: 'sports-club-matching-v1',
          normalizedName: normalizeSportsClubName(club.name),
          rule: matched ? result.method : result.kind,
          candidateCount: matched ? 1 : result.candidateCount,
        },
      };
      await tx.entityMatch.upsert({
        where: { providerId_entityType_externalId: key },
        create: {
          ...key,
          ...matchData,
        },
        update: matchData,
      });
      await setRecord(id);
      return matched
        ? { status: 'MATCHED', clubId: result.clubId, method: result.method }
        : { status: 'REVIEW_REQUIRED', reason: result.kind };
    });
  }
}
