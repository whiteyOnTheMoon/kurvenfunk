import { createHash } from 'node:crypto';
import type { SportsProviderMatch } from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { SportsImportSession } from './sports-import.store';
import { resolveSportsMatch, SPORTS_MATCH_KICKOFF_TOLERANCE_MS } from './sports-match-matching';

export type SportsMatchResource = 'fixtures' | 'results' | 'live';
export type SportsMatchOutcome =
  | { status: 'MATCHED'; matchId: string; method: 'COMPOSITE' | 'EXTERNAL_ID' | 'MANUAL' }
  | {
      status: 'REVIEW_REQUIRED';
      reason:
        | 'UNRESOLVED_SCOPE'
        | 'UNRESOLVED_CLUB'
        | 'INCONSISTENT_MAPPING'
        | 'UNMATCHED'
        | 'AMBIGUOUS'
        | 'MANUAL_REVIEW'
        | 'REJECTED';
    };

/**
 * Resolves provider fixture identity exclusively against approved club,
 * competition and season bindings. Writes only EntityMatch/ImportRecord.
 * Scores, results, match statuses and canonical fixtures are never mutated.
 */
@Injectable()
export class SportsMatchMatchingService {
  constructor(private readonly database: DatabaseService) {}

  async matchStaged(
    session: SportsImportSession,
    resource: SportsMatchResource,
    record: SportsProviderMatch,
    scope: { competitionExternalId: string; seasonExternalId: string },
  ): Promise<SportsMatchOutcome> {
    if (
      record.kind !== 'match' ||
      !record.externalId.trim() ||
      record.externalId.length > 160 ||
      !record.homeClubExternalId.trim() ||
      !record.awayClubExternalId.trim() ||
      record.homeClubExternalId === record.awayClubExternalId ||
      !scope.competitionExternalId.trim() ||
      !scope.seasonExternalId.trim() ||
      !Number.isFinite(Date.parse(record.kickoff)) ||
      (record.matchday !== undefined &&
        (!Number.isSafeInteger(record.matchday) || record.matchday < 1))
    ) {
      throw new Error('SPORTS_MATCH_INVALID_RECORD');
    }

    const kind = resource === 'fixtures' ? 'SPORTS_MATCH' : 'SPORTS_RESULT';
    const fingerprint = createHash('sha256').update(JSON.stringify(record)).digest('hex');
    const kickoff = new Date(record.kickoff);

    return this.database.client.$transaction(async (tx) => {
      const lock = session.providerId + ':MATCH:' + record.externalId;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lock}, 203))`;
      const staged = await tx.importRecord.findFirst({
        where: {
          importJobId: session.importJobId,
          providerId: session.providerId,
          recordType: kind,
          externalId: record.externalId,
        },
        select: {
          id: true,
          status: true,
          reviewedAt: true,
          canonicalEntityId: true,
          canonicalEntityType: true,
          contentHash: true,
        },
      });
      if (!staged || staged.contentHash !== fingerprint) {
        throw new Error('SPORTS_MATCH_STAGING_MISMATCH');
      }

      const externalKey = {
        providerId: session.providerId,
        entityType: 'MATCH' as const,
        externalId: record.externalId,
      };
      const prior = await tx.entityMatch.findUnique({
        where: { providerId_entityType_externalId: externalKey },
        select: {
          status: true,
          matchId: true,
          method: true,
          reviewedAt: true,
        },
      });

      const setStaged = async (matchId: string | null): Promise<void> => {
        const status = matchId ? 'MATCHED' : 'REVIEW_REQUIRED';
        if (
          staged.status === status &&
          staged.canonicalEntityId === matchId &&
          staged.canonicalEntityType === (matchId ? 'MATCH' : null)
        ) {
          return;
        }
        await tx.importRecord.update({
          where: { id: staged.id },
          data: {
            status,
            canonicalEntityId: matchId,
            canonicalEntityType: matchId ? 'MATCH' : null,
          },
        });
      };

      if (staged.reviewedAt || (prior?.reviewedAt && prior.status !== 'MATCHED')) {
        return { status: 'REVIEW_REQUIRED', reason: 'MANUAL_REVIEW' };
      }
      if (prior?.status === 'REJECTED') {
        return { status: 'REVIEW_REQUIRED', reason: 'REJECTED' };
      }

      const byExternalId = async (
        entityType: 'CLUB' | 'COMPETITION' | 'SEASON',
        externalId: string,
      ) =>
        tx.entityMatch.findUnique({
          where: {
            providerId_entityType_externalId: {
              providerId: session.providerId,
              entityType,
              externalId,
            },
          },
          select: { status: true, clubId: true, competitionId: true, seasonId: true },
        });

      const [home, away, competition, season] = await Promise.all([
        byExternalId('CLUB', record.homeClubExternalId),
        byExternalId('CLUB', record.awayClubExternalId),
        byExternalId('COMPETITION', scope.competitionExternalId),
        byExternalId('SEASON', scope.seasonExternalId),
      ]);

      const mappedHomeId = home?.status === 'MATCHED' ? home.clubId : null;
      const mappedAwayId = away?.status === 'MATCHED' ? away.clubId : null;
      const mappedCompetitionId =
        competition?.status === 'MATCHED' ? competition.competitionId : null;
      const mappedSeasonId = season?.status === 'MATCHED' ? season.seasonId : null;

      const missingScope = !mappedCompetitionId || !mappedSeasonId;
      const missingClubs = !mappedHomeId || !mappedAwayId || mappedHomeId === mappedAwayId;
      let reason:
        | 'UNRESOLVED_SCOPE'
        | 'UNRESOLVED_CLUB'
        | 'INCONSISTENT_MAPPING'
        | 'UNMATCHED'
        | 'AMBIGUOUS' = missingScope
        ? 'UNRESOLVED_SCOPE'
        : missingClubs
          ? 'UNRESOLVED_CLUB'
          : 'UNMATCHED';
      let selectedMatchId: string | null = null;

      if (
        mappedCompetitionId &&
        mappedSeasonId &&
        mappedHomeId &&
        mappedAwayId &&
        mappedHomeId !== mappedAwayId
      ) {
        const [competitionRecord, seasonRecord, activeClubs] = await Promise.all([
          tx.competition.findUnique({
            where: { id: mappedCompetitionId },
            select: { id: true },
          }),
          tx.season.findUnique({
            where: { id: mappedSeasonId },
            select: { competitionId: true },
          }),
          tx.club.count({
            where: { id: { in: [mappedHomeId, mappedAwayId] }, active: true },
          }),
        ]);
        if (
          !competitionRecord ||
          !seasonRecord ||
          seasonRecord.competitionId !== mappedCompetitionId ||
          activeClubs !== 2
        ) {
          reason = 'INCONSISTENT_MAPPING';
        } else {
          // Previously approved external identifiers cannot silently drift to
          // another game, even when a new composite search would find one.
          if (prior?.status === 'MATCHED') {
            const mappedMatch = prior.matchId
              ? await tx.match.findUnique({
                  where: { id: prior.matchId },
                  select: {
                    id: true,
                    competitionId: true,
                    seasonId: true,
                    homeClubId: true,
                    awayClubId: true,
                    kickoff: true,
                    matchday: true,
                  },
                })
              : null;
            const valid =
              mappedMatch !== null &&
              mappedMatch?.competitionId === mappedCompetitionId &&
              mappedMatch?.seasonId === mappedSeasonId &&
              mappedMatch?.homeClubId === mappedHomeId &&
              mappedMatch?.awayClubId === mappedAwayId &&
              Math.abs(mappedMatch.kickoff.getTime() - kickoff.getTime()) <=
                SPORTS_MATCH_KICKOFF_TOLERANCE_MS &&
              (record.matchday === undefined || mappedMatch.matchday === record.matchday);
            if (valid && mappedMatch) {
              await setStaged(mappedMatch.id);
              return {
                status: 'MATCHED',
                matchId: mappedMatch.id,
                method: prior.method === 'MANUAL' ? 'MANUAL' : 'EXTERNAL_ID',
              };
            }
            reason = 'INCONSISTENT_MAPPING';
          } else {
            const candidates = await tx.match.findMany({
              where: {
                competitionId: mappedCompetitionId,
                seasonId: mappedSeasonId,
                homeClubId: mappedHomeId,
                awayClubId: mappedAwayId,
                kickoff: {
                  gte: new Date(kickoff.getTime() - SPORTS_MATCH_KICKOFF_TOLERANCE_MS),
                  lte: new Date(kickoff.getTime() + SPORTS_MATCH_KICKOFF_TOLERANCE_MS),
                },
                ...(record.matchday === undefined ? {} : { matchday: record.matchday }),
              },
              select: {
                id: true,
                competitionId: true,
                seasonId: true,
                homeClubId: true,
                awayClubId: true,
                kickoff: true,
                matchday: true,
              },
            });
            const resolved = resolveSportsMatch(candidates, {
              competitionId: mappedCompetitionId,
              seasonId: mappedSeasonId,
              homeClubId: mappedHomeId,
              awayClubId: mappedAwayId,
              kickoff,
              ...(record.matchday === undefined ? {} : { matchday: record.matchday }),
            });
            if (resolved.kind === 'MATCHED') {
              // One provider must not silently assign two different external
              // match IDs to the same canonical fixture.
              const conflictingExternalId = await tx.entityMatch.findFirst({
                where: {
                  providerId: session.providerId,
                  entityType: 'MATCH',
                  status: 'MATCHED',
                  matchId: resolved.matchId,
                  externalId: { not: record.externalId },
                },
                select: { id: true },
              });
              if (conflictingExternalId) reason = 'INCONSISTENT_MAPPING';
              else selectedMatchId = resolved.matchId;
            } else reason = resolved.kind;
          }
        }
      }

      // A prior MATCHED ID is never rebound to a different fixture by an
      // automatic import. Leave it intact for a human to resolve.
      if (prior?.status === 'MATCHED') {
        await setStaged(null);
        return { status: 'REVIEW_REQUIRED', reason: 'INCONSISTENT_MAPPING' };
      }

      const status = selectedMatchId
        ? ('MATCHED' as const)
        : reason === 'UNMATCHED' || reason === 'AMBIGUOUS'
          ? reason
          : ('REVIEW_REQUIRED' as const);

      await tx.entityMatch.upsert({
        where: { providerId_entityType_externalId: externalKey },
        create: {
          ...externalKey,
          status,
          confidence: selectedMatchId ? 'HIGH' : 'UNKNOWN',
          method: selectedMatchId ? 'COMPOSITE' : null,
          matchId: selectedMatchId,
          evidence: {
            rule: selectedMatchId ? 'season-clubs-kickoff-matchday' : reason,
            source: 'sports-match-matching-v1',
            resource,
            competitionExternalId: scope.competitionExternalId,
            seasonExternalId: scope.seasonExternalId,
            stageExternalId: record.stageExternalId ?? null,
            kickoffToleranceMinutes: 15,
          },
          lastSeenAt: new Date(),
        },
        update: {
          status,
          confidence: selectedMatchId ? 'HIGH' : 'UNKNOWN',
          method: selectedMatchId ? 'COMPOSITE' : null,
          matchId: selectedMatchId,
          lastSeenAt: new Date(),
          evidence: {
            rule: selectedMatchId ? 'season-clubs-kickoff-matchday' : reason,
            source: 'sports-match-matching-v1',
            resource,
            competitionExternalId: scope.competitionExternalId,
            seasonExternalId: scope.seasonExternalId,
            stageExternalId: record.stageExternalId ?? null,
            kickoffToleranceMinutes: 15,
          },
        },
      });
      await setStaged(selectedMatchId);
      return selectedMatchId
        ? { status: 'MATCHED', matchId: selectedMatchId, method: 'COMPOSITE' }
        : { status: 'REVIEW_REQUIRED', reason };
    });
  }
}
