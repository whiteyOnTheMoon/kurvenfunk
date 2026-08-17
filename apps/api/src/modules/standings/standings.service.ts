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
              take: 1,
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

    const stage = season.stages[0] ?? null;

    const standings = await this.database.standing.findMany({
      where: {
        competitionId: competition.id,
        seasonId: season.id,
        ...(stage ? { stageId: stage.id } : { stageId: null }),
      },
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
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
