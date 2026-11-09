import { createPrismaClient, type DatabaseClient, type Prisma } from '@kurvenfunk/database';
import type { CreateFixtureInput, UpdateFixtureInput } from '@kurvenfunk/validation';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

const fixtureSelect = {
  id: true,
  competitionId: true,
  seasonId: true,
  stageId: true,
  homeClubId: true,
  awayClubId: true,
  kickoff: true,
  matchday: true,
  status: true,
  homeScore: true,
  awayScore: true,
  createdAt: true,
  updatedAt: true,
  stage: { select: { id: true, name: true, slug: true } },
  homeClub: { select: { id: true, name: true, shortName: true, slug: true } },
  awayClub: { select: { id: true, name: true, shortName: true, slug: true } },
} as const;

function invalid(code: string, message: string): BadRequestException {
  return new BadRequestException({ code, message });
}

function conflict(code: string, message: string): ConflictException {
  return new ConflictException({ code, message });
}

function matchNotFound(): NotFoundException {
  return new NotFoundException({ code: 'MATCH_NOT_FOUND', message: 'Spiel wurde nicht gefunden.' });
}

function seasonNotFound(): NotFoundException {
  return new NotFoundException({ code: 'SEASON_NOT_FOUND', message: 'Saison wurde nicht gefunden.' });
}

function databaseCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

function snapshot(fixture: {
  competitionId: string;
  seasonId: string;
  stageId: string | null;
  homeClubId: string;
  awayClubId: string;
  kickoff: Date;
  matchday: number | null;
  status: string;
}) {
  return {
    competitionId: fixture.competitionId,
    seasonId: fixture.seasonId,
    stageId: fixture.stageId,
    homeClubId: fixture.homeClubId,
    awayClubId: fixture.awayClubId,
    kickoff: fixture.kickoff.toISOString(),
    matchday: fixture.matchday,
    status: fixture.status,
  };
}

@Injectable()
export class MatchManagementService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async findForSeason(seasonId: string) {
    const season = await this.database.season.findUnique({
      where: { id: seasonId },
      select: {
        id: true,
        name: true,
        slug: true,
        competitionId: true,
        status: true,
        competition: { select: { id: true, name: true, slug: true } },
        stages: {
          orderBy: [{ sequence: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, slug: true },
        },
      },
    });
    if (!season) throw seasonNotFound();

    const matches = await this.database.match.findMany({
      where: { seasonId },
      orderBy: [{ matchday: 'asc' }, { kickoff: 'asc' }, { id: 'asc' }],
      select: fixtureSelect,
    });
    return { season, matches };
  }

  private async assertStage(
    tx: Prisma.TransactionClient,
    stageId: string | null | undefined,
    seasonId: string,
  ): Promise<void> {
    if (!stageId) return;
    const stage = await tx.stage.findUnique({
      where: { id: stageId },
      select: { seasonId: true },
    });
    if (!stage || stage.seasonId !== seasonId) {
      throw invalid('MATCH_STAGE_SEASON_MISMATCH', 'Spielphase gehört nicht zur Saison.');
    }
  }

  private async assertActiveClubs(
    tx: Prisma.TransactionClient,
    homeClubId: string,
    awayClubId: string,
  ): Promise<void> {
    if (homeClubId === awayClubId) {
      throw invalid('MATCH_SAME_CLUB', 'Heim- und Auswärtsverein müssen verschieden sein.');
    }
    const count = await tx.club.count({
      where: { id: { in: [homeClubId, awayClubId] }, active: true },
    });
    if (count !== 2) {
      throw invalid('MATCH_CLUB_INVALID', 'Beide Vereine müssen existieren und aktiv sein.');
    }
  }

  async create(input: CreateFixtureInput, actorUserId: string) {
    try {
      return await this.database.$transaction(async (tx) => {
        const season = await tx.season.findUnique({
          where: { id: input.seasonId },
          select: { competitionId: true },
        });
        if (!season) throw seasonNotFound();
        if (season.competitionId !== input.competitionId) {
          throw invalid('MATCH_COMPETITION_SEASON_MISMATCH', 'Saison gehört nicht zum Wettbewerb.');
        }
        await this.assertStage(tx, input.stageId, input.seasonId);
        await this.assertActiveClubs(tx, input.homeClubId, input.awayClubId);

        const match = await tx.match.create({
          data: {
            competitionId: input.competitionId,
            seasonId: input.seasonId,
            stageId: input.stageId ?? null,
            homeClubId: input.homeClubId,
            awayClubId: input.awayClubId,
            kickoff: new Date(input.kickoff),
            matchday: input.matchday ?? null,
            status: input.status ?? 'SCHEDULED',
            homeScore: null,
            awayScore: null,
          },
          select: fixtureSelect,
        });
        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId,
            action: 'ADMIN_CORRECTION',
            category: 'SYSTEM',
            targetType: 'SYSTEM',
            targetId: match.id,
            metadata: { entity: 'MATCH', operation: 'CREATE', after: snapshot(match) },
          },
        });
        return match;
      });
    } catch (error) {
      if (databaseCode(error, 'P2002')) {
        throw conflict('MATCH_DUPLICATE_FIXTURE', 'Diese Spielansetzung existiert bereits.');
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateFixtureInput, actorUserId: string) {
    try {
      return await this.database.$transaction(async (tx) => {
        const previous = await tx.match.findUnique({ where: { id }, select: fixtureSelect });
        if (!previous) throw matchNotFound();

        if (
          !['SCHEDULED', 'POSTPONED', 'CANCELLED'].includes(previous.status) ||
          previous.homeScore !== null ||
          previous.awayScore !== null
        ) {
          throw conflict(
            'MATCH_RESULT_LOCKED',
            'Ergebnis- oder Live-Spiele sind in der Spielverwaltung gesperrt.',
          );
        }

        const homeClubId = input.homeClubId ?? previous.homeClubId;
        const awayClubId = input.awayClubId ?? previous.awayClubId;
        if (input.homeClubId !== undefined || input.awayClubId !== undefined) {
          await this.assertActiveClubs(tx, homeClubId, awayClubId);
        }
        if (input.stageId !== undefined) {
          await this.assertStage(tx, input.stageId, previous.seasonId);
        }

        const match = await tx.match.update({
          where: { id },
          data: {
            ...(input.homeClubId !== undefined ? { homeClubId: input.homeClubId } : {}),
            ...(input.awayClubId !== undefined ? { awayClubId: input.awayClubId } : {}),
            ...(input.stageId !== undefined ? { stageId: input.stageId } : {}),
            ...(input.kickoff !== undefined ? { kickoff: new Date(input.kickoff) } : {}),
            ...(input.matchday !== undefined ? { matchday: input.matchday } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
          },
          select: fixtureSelect,
        });
        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId,
            action: 'ADMIN_CORRECTION',
            category: 'SYSTEM',
            targetType: 'SYSTEM',
            targetId: match.id,
            metadata: {
              entity: 'MATCH',
              operation: 'UPDATE',
              before: snapshot(previous),
              after: snapshot(match),
            },
          },
        });
        return match;
      });
    } catch (error) {
      if (databaseCode(error, 'P2002')) {
        throw conflict('MATCH_DUPLICATE_FIXTURE', 'Diese Spielansetzung existiert bereits.');
      }
      if (databaseCode(error, 'P2025')) throw matchNotFound();
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
