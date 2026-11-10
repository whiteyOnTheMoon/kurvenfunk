import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';

export interface StandingListItem {
  id: string;
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
  club: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  };
}

export interface StandingsResponse {
  competition: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  };
  season: {
    id: string;
    name: string;
    slug: string;
  };
  stage: {
    id: string;
    name: string;
    slug: string;
  } | null;
  standings: StandingListItem[];
}

@Injectable()
export class StandingsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async findCurrent(competitionSlug: string): Promise<StandingsResponse | null> {
    const competition = await this.database.competition.findUnique({
      where: {
        slug: competitionSlug,
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
        seasons: {
          where: {
            active: true,
          },
          orderBy: {
            startDate: 'desc',
          },
          take: 1,
          select: {
            id: true,
            name: true,
            slug: true,
            stages: {
              orderBy: {
                sequence: 'desc',
              },
              take: 20,
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    const season = competition?.seasons[0];

    if (!competition || !season) {
      return null;
    }

    // Prefer the latest phase containing actual persisted rows. A new, still
    // empty phase must not hide an existing real table; never blend phases.
    // Season-wide rows are the last fallback, never mixed with phase rows.
    let stage: (typeof season.stages)[number] | null = season.stages[0] ?? null;
    let standings: StandingListItem[] = [];
    for (const candidate of [...season.stages, null]) {
      const rows = await this.database.standing.findMany({
        where: {
          competitionId: competition.id,
          seasonId: season.id,
          stageId: candidate?.id ?? null,
        },
        orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
        take: 30,
        select: {
          id: true,
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
          club: {
            select: {
              id: true,
              name: true,
              shortName: true,
              slug: true,
            },
          },
        },
      });
      if (rows.length > 0) {
        stage = candidate;
        standings = rows;
        break;
      }
    }

    return {
      competition: {
        id: competition.id,
        name: competition.name,
        shortName: competition.shortName,
        slug: competition.slug,
      },
      season: {
        id: season.id,
        name: season.name,
        slug: season.slug,
      },
      stage,
      standings,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
