import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { CreateSeasonInput, UpdateSeasonInput } from '@kurvenfunk/validation';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

const seasonDetailsSelect = {
  id: true,
  competitionId: true,
  name: true,
  slug: true,
  startDate: true,
  endDate: true,
  status: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

const seasonNotFound = () =>
  new NotFoundException({
    code: 'SEASON_NOT_FOUND',
    message: 'Saison wurde nicht gefunden.',
  });

const competitionNotFound = () =>
  new NotFoundException({
    code: 'COMPETITION_NOT_FOUND',
    message: 'Wettbewerb wurde nicht gefunden.',
  });

function isDatabaseError(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

function utcDate(date: string): Date {
  return new Date(date + 'T00:00:00.000Z');
}

function dateText(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function activeConflict(): ConflictException {
  return new ConflictException({
    code: 'SEASON_ACTIVE_CONFLICT',
    message: 'Für diesen Wettbewerb ist bereits eine andere Saison aktiv.',
  });
}

@Injectable()
export class SeasonsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  private async competitionIdForSlug(slug: string): Promise<string> {
    const competition = await this.database.competition.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!competition) throw competitionNotFound();
    return competition.id;
  }

  async findByCompetition(competitionSlug: string) {
    const competitionId = await this.competitionIdForSlug(competitionSlug);
    return this.database.season.findMany({
      where: { competitionId },
      orderBy: [{ startDate: 'desc' }, { slug: 'desc' }],
      select: seasonDetailsSelect,
    });
  }

  async findCurrent(competitionSlug: string) {
    const competitionId = await this.competitionIdForSlug(competitionSlug);
    const season = await this.database.season.findFirst({
      where: { competitionId, status: 'ACTIVE', active: true },
      select: seasonDetailsSelect,
    });
    if (!season) {
      throw new NotFoundException({
        code: 'SEASON_CURRENT_NOT_FOUND',
        message: 'Für diesen Wettbewerb ist keine Saison aktiv.',
      });
    }
    return season;
  }

  async findBySlug(competitionSlug: string, seasonSlug: string) {
    const competitionId = await this.competitionIdForSlug(competitionSlug);
    const season = await this.database.season.findUnique({
      where: { competitionId_slug: { competitionId, slug: seasonSlug } },
      select: seasonDetailsSelect,
    });
    if (!season) throw seasonNotFound();
    return season;
  }

  async create(competitionSlug: string, input: CreateSeasonInput, actorUserId: string) {
    const competitionId = await this.competitionIdForSlug(competitionSlug);
    const status = input.status ?? 'PLANNED';
    try {
      return await this.database.$transaction(async (tx) => {
        // Serialize season lifecycle writes for one competition, including concurrent admins.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${competitionId}, 193))`;
        const competition = await tx.competition.findUnique({
          where: { id: competitionId },
          select: { id: true },
        });
        if (!competition) throw competitionNotFound();
        if (status === 'ACTIVE') {
          const current = await tx.season.findFirst({
            where: { competitionId, active: true },
            select: { id: true },
          });
          if (current) throw activeConflict();
        }
        const season = await tx.season.create({
          data: {
            competitionId,
            name: input.name,
            slug: input.slug,
            startDate: utcDate(input.startDate),
            endDate: utcDate(input.endDate),
            status,
            active: status === 'ACTIVE',
          },
          select: seasonDetailsSelect,
        });
        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId,
            action: 'ADMIN_CORRECTION',
            category: 'SYSTEM',
            targetType: 'SYSTEM',
            targetId: season.id,
            metadata: {
              entity: 'SEASON',
              operation: 'CREATE',
              competitionSlug,
              after: {
                name: season.name,
                slug: season.slug,
                startDate: dateText(season.startDate),
                endDate: dateText(season.endDate),
                status: season.status,
                active: season.active,
              },
            },
          },
        });
        return season;
      });
    } catch (error) {
      if (isDatabaseError(error, 'P2002')) {
        const target = (error as { meta?: { target?: unknown } }).meta?.target;
        if (typeof target === 'string' && target.includes('active')) throw activeConflict();
        if (Array.isArray(target) && target.some((item) => String(item).includes('active'))) {
          throw activeConflict();
        }
        throw new ConflictException({
          code: 'SEASON_SLUG_TAKEN',
          message: 'Die Saisonkennung ist in diesem Wettbewerb bereits vergeben.',
        });
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateSeasonInput, actorUserId: string) {
    const existing = await this.database.season.findUnique({
      where: { id },
      select: { competitionId: true },
    });
    if (!existing) throw seasonNotFound();

    try {
      return await this.database.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${existing.competitionId}, 193))`;
        const previous = await tx.season.findUnique({
          where: { id },
          select: seasonDetailsSelect,
        });
        if (!previous) throw seasonNotFound();
        const startDate = input.startDate ?? dateText(previous.startDate);
        const endDate = input.endDate ?? dateText(previous.endDate);
        if (startDate > endDate) {
          throw new BadRequestException({
            code: 'SEASON_INVALID_DATE_RANGE',
            message: 'Das Ende der Saison darf nicht vor ihrem Beginn liegen.',
          });
        }
        const status = input.status ?? previous.status;
        const active = status === 'ACTIVE';
        if (active) {
          const current = await tx.season.findFirst({
            where: { competitionId: previous.competitionId, active: true, id: { not: id } },
            select: { id: true },
          });
          if (current) throw activeConflict();
        }
        const season = await tx.season.update({
          where: { id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.startDate !== undefined ? { startDate: utcDate(input.startDate) } : {}),
            ...(input.endDate !== undefined ? { endDate: utcDate(input.endDate) } : {}),
            status,
            active,
          },
          select: seasonDetailsSelect,
        });
        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId,
            action: 'ADMIN_CORRECTION',
            category: 'SYSTEM',
            targetType: 'SYSTEM',
            targetId: season.id,
            metadata: {
              entity: 'SEASON',
              operation: 'UPDATE',
              before: {
                name: previous.name,
                startDate: dateText(previous.startDate),
                endDate: dateText(previous.endDate),
                status: previous.status,
                active: previous.active,
              },
              after: {
                name: season.name,
                startDate: dateText(season.startDate),
                endDate: dateText(season.endDate),
                status: season.status,
                active: season.active,
              },
            },
          },
        });
        return season;
      });
    } catch (error) {
      if (isDatabaseError(error, 'P2002')) throw activeConflict();
      if (isDatabaseError(error, 'P2025')) throw seasonNotFound();
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
