import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { CreateCompetitionInput, UpdateCompetitionInput } from '@kurvenfunk/validation';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

export interface CompetitionListItem {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
}

const competitionDetailsSelect = {
  id: true,
  name: true,
  shortName: true,
  slug: true,
  type: true,
  countryCode: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

function isDatabaseError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

@Injectable()
export class CompetitionsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async findAll(): Promise<CompetitionListItem[]> {
    return this.database.competition.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, shortName: true, slug: true },
    });
  }

  async findActiveBySlug(slug: string) {
    const competition = await this.database.competition.findFirst({
      where: { slug, active: true },
      select: competitionDetailsSelect,
    });

    if (!competition) {
      throw new NotFoundException({
        code: 'COMPETITION_NOT_FOUND',
        message: 'Wettbewerb wurde nicht gefunden.',
      });
    }

    return competition;
  }

  /** Includes inactive competitions for authorized administrators only. */
  findAllForAdmin() {
    return this.database.competition.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      select: competitionDetailsSelect,
    });
  }

  async create(input: CreateCompetitionInput, actorUserId: string) {
    try {
      return await this.database.$transaction(async (tx) => {
        const competition = await tx.competition.create({
          data: {
            name: input.name,
            shortName: input.shortName ?? null,
            slug: input.slug,
            type: input.type,
            countryCode: input.countryCode ?? null,
            active: input.active ?? true,
          },
          select: competitionDetailsSelect,
        });

        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId,
            action: 'ADMIN_CORRECTION',
            category: 'SYSTEM',
            targetType: 'SYSTEM',
            targetId: competition.id,
            metadata: {
              entity: 'COMPETITION',
              operation: 'CREATE',
              slug: competition.slug,
              after: {
                name: competition.name,
                shortName: competition.shortName,
                type: competition.type,
                countryCode: competition.countryCode,
                active: competition.active,
              },
            },
          },
        });
        return competition;
      });
    } catch (error) {
      if (isDatabaseError(error, 'P2002')) {
        throw new ConflictException({
          code: 'COMPETITION_SLUG_TAKEN',
          message: 'Der Wettbewerbs-Slug ist bereits vergeben.',
        });
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateCompetitionInput, actorUserId: string) {
    try {
      return await this.database.$transaction(async (tx) => {
        const previous = await tx.competition.findUnique({
          where: { id },
          select: competitionDetailsSelect,
        });
        if (!previous) {
          throw new NotFoundException({
            code: 'COMPETITION_NOT_FOUND',
            message: 'Wettbewerb wurde nicht gefunden.',
          });
        }

        const competition = await tx.competition.update({
          where: { id },
          data: input,
          select: competitionDetailsSelect,
        });

        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId,
            action: 'ADMIN_CORRECTION',
            category: 'SYSTEM',
            targetType: 'SYSTEM',
            targetId: competition.id,
            metadata: {
              entity: 'COMPETITION',
              operation: 'UPDATE',
              slug: competition.slug,
              before: {
                name: previous.name,
                shortName: previous.shortName,
                countryCode: previous.countryCode,
                active: previous.active,
              },
              after: {
                name: competition.name,
                shortName: competition.shortName,
                countryCode: competition.countryCode,
                active: competition.active,
              },
            },
          },
        });
        return competition;
      });
    } catch (error) {
      if (isDatabaseError(error, 'P2025')) {
        throw new NotFoundException({
          code: 'COMPETITION_NOT_FOUND',
          message: 'Wettbewerb wurde nicht gefunden.',
        });
      }
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
