import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { CreateStandingInput, UpdateStandingInput } from '@kurvenfunk/validation';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

const rowSelect = {
  id: true,
  competitionId: true,
  seasonId: true,
  stageId: true,
  clubId: true,
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
  createdAt: true,
  updatedAt: true,
  club: { select: { id: true, name: true, shortName: true, slug: true, active: true } },
} as const;

function invalid(code: string, message: string): BadRequestException {
  return new BadRequestException({ code, message });
}
function conflict(code: string, message: string): ConflictException {
  return new ConflictException({ code, message });
}
function notFound(code: string, message: string): NotFoundException {
  return new NotFoundException({ code, message });
}
function isDbError(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}
function statSnapshot(row: {
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
}) {
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
    sortOrder: row.sortOrder,
  };
}

@Injectable()
export class StandingManagementService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  private async seasonOrThrow(seasonId: string) {
    const season = await this.database.season.findUnique({
      where: { id: seasonId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        competitionId: true,
        competition: { select: { id: true, name: true, shortName: true, slug: true } },
        stages: {
          orderBy: [{ sequence: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, slug: true, sequence: true },
        },
      },
    });
    if (!season) throw notFound('SEASON_NOT_FOUND', 'Saison wurde nicht gefunden.');
    return season;
  }

  async readSeason(seasonId: string, stageId?: string) {
    const season = await this.seasonOrThrow(seasonId);
    // An omitted stageId is season-wide. Callers choose a stage explicitly;
    // never silently return a different phase (or mix multiple phases).
    if (stageId && !season.stages.some((stage) => stage.id === stageId)) {
      throw invalid('STANDING_STAGE_SEASON_MISMATCH', 'Die Phase gehört nicht zur Saison.');
    }
    const stage = stageId ? season.stages.find((item) => item.id === stageId) ?? null : null;
    const rows = await this.database.standing.findMany({
      where: { seasonId, stageId: stageId ?? null },
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      select: rowSelect,
    });
    return { season, stage, standings: rows };
  }

  private async assertStage(
    tx: Parameters<Parameters<DatabaseClient['$transaction']>[0]>[0],
    seasonId: string,
    stageId: string | null,
  ) {
    if (stageId === null) return;
    const stage = await tx.stage.findUnique({
      where: { id: stageId },
      select: { seasonId: true },
    });
    if (!stage || stage.seasonId !== seasonId) {
      throw invalid('STANDING_STAGE_SEASON_MISMATCH', 'Die Phase gehört nicht zur Saison.');
    }
  }

  async create(seasonId: string, input: CreateStandingInput, actorUserId: string) {
    try {
      return await this.database.$transaction(async (tx) => {
        const season = await tx.season.findUnique({
          where: { id: seasonId },
          select: { competitionId: true },
        });
        if (!season) throw notFound('SEASON_NOT_FOUND', 'Saison wurde nicht gefunden.');
        await this.assertStage(tx, seasonId, input.stageId);
        const club = await tx.club.findUnique({
          where: { id: input.clubId },
          select: { id: true },
        });
        if (!club) throw invalid('STANDING_CLUB_NOT_FOUND', 'Verein wurde nicht gefunden.');

        const standing = await tx.standing.create({
          data: {
            competitionId: season.competitionId,
            seasonId,
            clubId: input.clubId,
            stageId: input.stageId,
            position: input.position,
            played: input.played,
            won: input.won,
            drawn: input.drawn,
            lost: input.lost,
            goalsFor: input.goalsFor,
            goalsAgainst: input.goalsAgainst,
            goalDifference: input.goalsFor - input.goalsAgainst,
            points: input.points,
            deductionPoints: input.deductionPoints,
            sortOrder: input.sortOrder,
          },
          select: rowSelect,
        });
        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId,
            action: 'ADMIN_CORRECTION',
            category: 'SYSTEM',
            targetType: 'SYSTEM',
            targetId: standing.id,
            metadata: {
              entity: 'STANDING',
              operation: 'CREATE',
              competitionId: standing.competitionId,
              seasonId,
              stageId: standing.stageId,
              clubId: standing.clubId,
              after: statSnapshot(standing),
            },
          },
        });
        return standing;
      });
    } catch (error) {
      if (isDbError(error, 'P2002')) {
        throw conflict('STANDING_DUPLICATE_CLUB', 'Der Verein hat bereits eine Tabellenzeile in dieser Phase.');
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateStandingInput, actorUserId: string) {
    return this.database.$transaction(async (tx) => {
      const previous = await tx.standing.findUnique({ where: { id }, select: rowSelect });
      if (!previous) throw notFound('STANDING_NOT_FOUND', 'Tabellenzeile wurde nicht gefunden.');
      if (previous.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime()) {
        throw conflict('STANDING_STALE', 'Tabellenzeile wurde zwischenzeitlich geändert. Bitte neu laden.');
      }
      const changed = await tx.standing.updateMany({
        where: { id, updatedAt: previous.updatedAt },
        data: {
          position: input.position,
          played: input.played,
          won: input.won,
          drawn: input.drawn,
          lost: input.lost,
          goalsFor: input.goalsFor,
          goalsAgainst: input.goalsAgainst,
          goalDifference: input.goalsFor - input.goalsAgainst,
          points: input.points,
          deductionPoints: input.deductionPoints,
          sortOrder: input.sortOrder,
          updatedAt: new Date(Math.max(Date.now(), previous.updatedAt.getTime() + 1)),
        },
      });
      if (changed.count !== 1) {
        throw conflict('STANDING_STALE', 'Tabellenzeile wurde zwischenzeitlich geändert. Bitte neu laden.');
      }
      const standing = await tx.standing.findUniqueOrThrow({ where: { id }, select: rowSelect });
      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorUserId,
          action: 'ADMIN_CORRECTION',
          category: 'SYSTEM',
          targetType: 'SYSTEM',
          targetId: standing.id,
          metadata: {
            entity: 'STANDING',
            operation: 'UPDATE',
            competitionId: standing.competitionId,
            seasonId: standing.seasonId,
            stageId: standing.stageId,
            clubId: standing.clubId,
            before: statSnapshot(previous),
            after: statSnapshot(standing),
          },
        },
      });
      return standing;
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
