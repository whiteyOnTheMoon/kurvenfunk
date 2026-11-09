import { createHash } from 'node:crypto';

import { createPrismaClient, type DatabaseClient, type Prisma } from '@kurvenfunk/database';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

import {
  calculateStandings,
  earnedPointsFor,
  profileForCompetition,
  type CalculationMatch,
  type CalculationRow,
  type RankingProfile,
} from './standing-calculator';

const calculationVersion = 'phase21.198-v1';
const standingSelect = {
  id: true,
  clubId: true,
  stageId: true,
  position: true,
  played: true,
  won: true,
  drawn: true,
  lost: true,
  goalsFor: true,
  goalsAgainst: true,
  goalDifference: true,
  points: true,
  deductionPoints: true,
  sortOrder: true,
  updatedAt: true,
} as const;

type ExistingStanding = {
  id: string;
  clubId: string;
  stageId: string | null;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  deductionPoints: number;
  sortOrder: number | null;
  updatedAt: Date;
};

type Fixture = CalculationMatch & {
  id: string;
  competitionId: string;
  stageId: string | null;
  status: string;
  updatedAt: Date;
};

function invalid(code: string, message: string): BadRequestException {
  return new BadRequestException({ code, message });
}
function conflict(code: string, message: string): ConflictException {
  return new ConflictException({ code, message });
}

function statData(row: CalculationRow) {
  return {
    position: row.position,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
    points: row.points,
    deductionPoints: row.deductionPoints,
  };
}

function previousStats(row: ExistingStanding) {
  return {
    position: row.position,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
    points: row.points,
    deductionPoints: row.deductionPoints,
  };
}

function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

interface InternalPreview {
  season: {
    id: string;
    slug: string;
    competitionId: string;
    competition: { slug: string; type: string };
  };
  stageId: string | null;
  profile: RankingProfile;
  rows: CalculationRow[];
  existingRows: ExistingStanding[];
  finishedMatches: number;
  excludedMatches: number;
  unresolvedTies: string[][];
  previewHash: string;
}

@Injectable()
export class StandingCalculationService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  private async buildPreview(
    tx: Prisma.TransactionClient,
    seasonId: string,
    stageId: string | null,
  ): Promise<InternalPreview> {
    const season = await tx.season.findUnique({
      where: { id: seasonId },
      select: {
        id: true,
        slug: true,
        competitionId: true,
        competition: { select: { slug: true, type: true } },
        stages: {
          select: { id: true, slug: true, type: true, sequence: true, parentStageId: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });
    if (!season) throw new NotFoundException({ code: 'SEASON_NOT_FOUND' });
    if (season.competition.type !== 'LEAGUE') {
      throw invalid(
        'STANDING_CALC_ONLY_LEAGUES',
        'Automatische Tabellen sind nur für Ligabewerbe verfügbar.',
      );
    }
    const stage = stageId ? season.stages.find((item) => item.id === stageId) : null;
    if (stageId && !stage) {
      throw invalid('STANDING_CALC_STAGE_MISMATCH', 'Die Phase gehört nicht zur Saison.');
    }
    if (stage?.type === 'KNOCKOUT') {
      throw invalid('STANDING_CALC_KNOCKOUT', 'K.-o.-Phasen haben keine Ligatabelle.');
    }
    let profile: RankingProfile;
    try {
      profile = profileForCompetition(season.competition.slug, season.slug);
    } catch {
      throw invalid(
        'STANDING_CALC_UNSUPPORTED_RULES',
        'Für diese historische Saison fehlt ein geprüfter Regelsatz.',
      );
    }
    const fixtures = await tx.match.findMany({
      where: { seasonId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        competitionId: true,
        stageId: true,
        homeClubId: true,
        awayClubId: true,
        homeScore: true,
        awayScore: true,
        status: true,
        updatedAt: true,
      },
    });
    const matches = fixtures as Fixture[];
    if (matches.some((fixture) => fixture.competitionId !== season.competitionId)) {
      throw conflict(
        'STANDING_CALC_INVALID_MATCH_COMPETITION',
        'Spiele mit falschem Wettbewerb gefunden.',
      );
    }

    const existingRows = await tx.standing.findMany({
      where: { seasonId, stageId },
      select: standingSelect,
      orderBy: { id: 'asc' },
    });
    const inStage = matches.filter((fixture) => fixture.stageId === stageId);
    let countMatches = inStage;
    const members = new Set<string>(existingRows.map((row) => row.clubId));
    for (const match of inStage) {
      members.add(match.homeClubId);
      members.add(match.awayClubId);
    }
    let adjustments: Record<string, number> = {};
    const deductions = Object.fromEntries(
      existingRows.map((row) => [row.clubId, row.deductionPoints]),
    ) as Record<string, number>;
    let roundedDown: Record<string, boolean> = {};
    let regularRows: ExistingStanding[] = [];
    let allowExternalOpponents = false;
    let regularStageId: string | null = null;

    if (season.competition.slug === 'austrian-bundesliga' && stage?.type === 'GROUP') {
      if (!['meistergruppe', 'qualifikationsgruppe'].includes(stage.slug)) {
        throw invalid('STANDING_CALC_UNKNOWN_GROUP', 'Unbekannte Bundesliga-Gruppe.');
      }
      const earlierRegular = season.stages.filter(
        (item) => item.type === 'REGULAR' && item.sequence < stage.sequence,
      );
      const parent = stage.parentStageId
        ? earlierRegular.find((item) => item.id === stage.parentStageId)
        : earlierRegular.length === 1
          ? earlierRegular[0]
          : undefined;
      if (!parent) {
        throw conflict(
          'STANDING_CALC_REGULAR_STAGE_MISSING',
          'Grunddurchgang nicht eindeutig zugeordnet.',
        );
      }
      regularStageId = parent.id;
      const regularFixtures = matches.filter((fixture) => fixture.stageId === parent.id);
      const regularMembers = new Set<string>();
      const finishedPerClub = new Map<string, number>();
      for (const fixture of regularFixtures) {
        regularMembers.add(fixture.homeClubId);
        regularMembers.add(fixture.awayClubId);
        if (fixture.status !== 'FINISHED') continue;
        for (const id of [fixture.homeClubId, fixture.awayClubId]) {
          finishedPerClub.set(id, (finishedPerClub.get(id) ?? 0) + 1);
        }
      }
      if (
        members.size !== 6 ||
        regularMembers.size !== 12 ||
        [...regularMembers].some((id) => finishedPerClub.get(id) !== 22)
      ) {
        throw conflict(
          'STANDING_CALC_SPLIT_NOT_READY',
          'Für die Gruppenberechnung müssen sechs Vereine je Gruppe und alle 22 Grunddurchgangsspiele pro Verein feststehen.',
        );
      }
      if ([...members].some((id) => !regularMembers.has(id))) {
        throw conflict(
          'STANDING_CALC_GROUP_INVALID',
          'Eine Gruppe enthält einen Verein außerhalb des Grunddurchgangs.',
        );
      }
      countMatches = [...regularFixtures, ...inStage];
      allowExternalOpponents = true;
      regularRows = await tx.standing.findMany({
        where: { seasonId, stageId: parent.id },
        select: standingSelect,
        orderBy: { id: 'asc' },
      });
      const regularPoints = earnedPointsFor(regularFixtures, [...members]);
      const regDeductions = Object.fromEntries(
        regularRows.map((row) => [row.clubId, row.deductionPoints]),
      ) as Record<string, number>;
      adjustments = Object.fromEntries(
        [...members].map((id) => {
          const earned = regularPoints[id] ?? 0;
          const net = earned - (regDeductions[id] ?? 0);
          const carry = profile === 'AUSTRIAN_BUNDESLIGA_LEGACY' ? Math.floor(net / 2) : net;
          roundedDown[id] = profile === 'AUSTRIAN_BUNDESLIGA_LEGACY' && net % 2 !== 0;
          return [id, carry - earned - (deductions[id] ?? 0)];
        }),
      );
    } else {
      adjustments = Object.fromEntries([...members].map((id) => [id, -(deductions[id] ?? 0)]));
    }

    let calculation;
    try {
      calculation = calculateStandings(countMatches, [...members], {
        profile,
        pointsAdjustments: adjustments,
        deductionPoints: deductions,
        legacyRoundedDown: roundedDown,
        allowExternalOpponents,
      });
    } catch (error) {
      throw conflict(
        'STANDING_CALC_INVALID_MATCH_DATA',
        error instanceof Error ? error.message : 'Inconsistent source matches',
      );
    }

    const previewHash = digest({
      version: calculationVersion,
      seasonId,
      stageId,
      regularStageId,
      profile,
      matches: countMatches.map((fixture) => ({
        id: fixture.id,
        stageId: fixture.stageId,
        homeClubId: fixture.homeClubId,
        awayClubId: fixture.awayClubId,
        status: fixture.status,
        homeScore: fixture.homeScore,
        awayScore: fixture.awayScore,
        updatedAt: fixture.updatedAt.toISOString(),
      })),
      existingRows: existingRows.map((row) => ({
        id: row.id,
        clubId: row.clubId,
        updatedAt: row.updatedAt.toISOString(),
        ...previousStats(row),
      })),
      regularRows: regularRows.map((row) => ({
        id: row.id,
        clubId: row.clubId,
        updatedAt: row.updatedAt.toISOString(),
        deductionPoints: row.deductionPoints,
      })),
    });

    return {
      season,
      stageId,
      profile,
      rows: calculation.rows,
      existingRows,
      finishedMatches: calculation.finishedMatches,
      excludedMatches: calculation.excludedMatches,
      unresolvedTies: calculation.unresolvedTies,
      previewHash,
    };
  }

  async preview(seasonId: string, stageId: string | null) {
    const preview = await this.database.$transaction((tx) =>
      this.buildPreview(tx, seasonId, stageId),
    );
    return this.publicPreview(preview);
  }

  private publicPreview(preview: InternalPreview) {
    const existing = new Map(preview.existingRows.map((row) => [row.clubId, row]));
    const rows = preview.rows.map((row) => ({
      ...row,
      existingId: existing.get(row.clubId)?.id ?? null,
      changed:
        !existing.has(row.clubId) ||
        JSON.stringify(statData(row)) !== JSON.stringify(previousStats(existing.get(row.clubId)!)),
    }));
    return {
      seasonId: preview.season.id,
      stageId: preview.stageId,
      profile: preview.profile,
      finishedMatches: preview.finishedMatches,
      excludedMatches: preview.excludedMatches,
      unresolvedTies: preview.unresolvedTies,
      existingCount: preview.existingRows.length,
      previewHash: preview.previewHash,
      canApply:
        preview.finishedMatches > 0 && rows.length > 0 && preview.unresolvedTies.length === 0,
      rows,
    };
  }

  async apply(
    seasonId: string,
    stageId: string | null,
    expectedPreviewHash: string,
    overwriteExisting: boolean,
    actorUserId: string,
  ) {
    try {
      return await this.database.$transaction(
        async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${seasonId + ':' + (stageId ?? 'season')}, 198))`;
          const preview = await this.buildPreview(tx, seasonId, stageId);
          if (expectedPreviewHash !== preview.previewHash) {
            throw conflict(
              'STANDING_CALC_STALE_PREVIEW',
              'Spiele oder Tabellen wurden geändert. Vorschau neu laden.',
            );
          }
          if (preview.finishedMatches === 0 || preview.rows.length === 0) {
            throw conflict(
              'STANDING_CALC_NO_RESULTS',
              'Keine abgeschlossenen Spiele für diese Tabelle vorhanden.',
            );
          }
          if (preview.unresolvedTies.length) {
            throw conflict(
              'STANDING_CALC_TIES_UNRESOLVED',
              'Offizielle Tabellenreihenfolge bei Gleichstand nicht eindeutig.',
            );
          }
          if (preview.existingRows.length && !overwriteExisting) {
            throw conflict(
              'STANDING_CALC_OVERWRITE_CONFIRMATION_REQUIRED',
              'Bestehende Tabellenwerte nur nach ausdrücklicher Bestätigung ersetzen.',
            );
          }
          const existing = new Map(preview.existingRows.map((row) => [row.clubId, row]));
          let created = 0;
          let updated = 0;
          let unchanged = 0;
          for (const row of preview.rows) {
            const previous = existing.get(row.clubId);
            const data = statData(row);
            if (!previous) {
              const record = await tx.standing.create({
                data: {
                  competitionId: preview.season.competitionId,
                  seasonId,
                  stageId,
                  clubId: row.clubId,
                  ...data,
                  sortOrder: null,
                },
                select: { id: true },
              });
              created++;
              await tx.auditLog.create({
                data: {
                  actorType: 'USER',
                  actorUserId,
                  action: 'ADMIN_CORRECTION',
                  category: 'SYSTEM',
                  targetType: 'SYSTEM',
                  targetId: record.id,
                  metadata: {
                    entity: 'STANDING_CALCULATION',
                    operation: 'CREATE',
                    seasonId,
                    stageId,
                    profile: preview.profile,
                    sourceHash: preview.previewHash,
                    after: data,
                  },
                },
              });
            } else if (JSON.stringify(data) === JSON.stringify(previousStats(previous))) {
              unchanged++;
            } else {
              const changed = await tx.standing.updateMany({
                where: { id: previous.id, updatedAt: previous.updatedAt },
                data: {
                  ...data,
                  updatedAt: new Date(Math.max(Date.now(), previous.updatedAt.getTime() + 1)),
                },
              });
              if (changed.count !== 1) {
                throw conflict('STANDING_CALC_STALE_PREVIEW', 'Tabellenzeile wurde geändert.');
              }
              updated++;
              await tx.auditLog.create({
                data: {
                  actorType: 'USER',
                  actorUserId,
                  action: 'ADMIN_CORRECTION',
                  category: 'SYSTEM',
                  targetType: 'SYSTEM',
                  targetId: previous.id,
                  metadata: {
                    entity: 'STANDING_CALCULATION',
                    operation: 'UPDATE',
                    seasonId,
                    stageId,
                    profile: preview.profile,
                    sourceHash: preview.previewHash,
                    before: previousStats(previous),
                    after: data,
                  },
                },
              });
            }
          }
          return {
            seasonId,
            stageId,
            profile: preview.profile,
            created,
            updated,
            unchanged,
            previewHash: preview.previewHash,
          };
        },
        { isolationLevel: 'Serializable', timeout: 30000 },
      );
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error.code === 'P2034' || error.code === 'P2002')
      ) {
        throw conflict(
          'STANDING_CALC_CONCURRENT_CHANGE',
          'Konkurrierende Tabellenänderung. Vorschau neu laden.',
        );
      }
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
