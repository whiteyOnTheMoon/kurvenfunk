import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Injectable, NotFoundException, type OnModuleDestroy } from '@nestjs/common';

export interface MatchDetailClub {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
}

export interface MatchDetailArticle {
  id: string;
  title: string;
  slug: string;
  lead: string | null;
  publishedAt: Date | null;
}

export interface MatchDetail {
  id: string;
  kickoff: Date;
  matchday: number | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeClub: MatchDetailClub;
  awayClub: MatchDetailClub;
  competition: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  };
  season: {
    id: string;
    name: string;
  };
  stage: {
    id: string;
    name: string;
  } | null;
  news: MatchDetailArticle[];
}

@Injectable()
export class MatchesService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async findById(id: string): Promise<MatchDetail> {
    const match = await this.database.match.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        kickoff: true,
        matchday: true,
        status: true,
        homeScore: true,
        awayScore: true,
        homeClub: {
          select: {
            id: true,
            name: true,
            shortName: true,
            slug: true,
          },
        },
        awayClub: {
          select: {
            id: true,
            name: true,
            shortName: true,
            slug: true,
          },
        },
        competition: {
          select: {
            id: true,
            name: true,
            shortName: true,
            slug: true,
          },
        },
        season: {
          select: {
            id: true,
            name: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
          },
        },
        articles: {
          where: {
            status: 'PUBLISHED',
            deletedAt: null,
          },
          orderBy: {
            publishedAt: 'desc',
          },
          take: 6,
          select: {
            id: true,
            title: true,
            slug: true,
            lead: true,
            publishedAt: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException({
        code: 'MATCH_NOT_FOUND',
        message: 'Spiel wurde nicht gefunden.',
      });
    }

    const { articles, ...data } = match;

    return {
      ...data,
      news: articles,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
