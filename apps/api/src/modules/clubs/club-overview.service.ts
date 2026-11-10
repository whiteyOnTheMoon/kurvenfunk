import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';

import { ClubsService } from './clubs.service';

const matchSelect = {
  id: true,
  kickoff: true,
  matchday: true,
  status: true,
  homeScore: true,
  awayScore: true,
  competition: { select: { name: true, slug: true } },
  season: { select: { name: true } },
  homeClub: { select: { name: true, shortName: true, slug: true } },
  awayClub: { select: { name: true, shortName: true, slug: true } },
} as const;

/**
 * Read-only public club overview. Uses canonical, editorially managed data;
 * raw/staged provider imports and unpublished content never reach this route.
 */
@Injectable()
export class ClubOverviewService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  constructor(private readonly clubsService: ClubsService) {}

  async findBySlug(slug: string) {
    // Reuse the existing active-club 404 gate before querying any related data.
    const club = await this.clubsService.findActiveBySlug(slug);
    const now = new Date();
    const relatedMatch = {
      OR: [{ homeClubId: club.id }, { awayClubId: club.id }],
      competition: { active: true },
      season: { active: true },
    };

    const [upcoming, finished, live, news, forumRows, currentStanding] = await Promise.all([
      this.database.match.findMany({
        where: {
          ...relatedMatch,
          kickoff: { gte: now },
          status: { in: ['SCHEDULED', 'POSTPONED'] },
        },
        orderBy: [{ kickoff: 'asc' }, { id: 'asc' }],
        take: 6,
        select: matchSelect,
      }),
      this.database.match.findMany({
        where: {
          ...relatedMatch,
          kickoff: { lte: now },
          status: 'FINISHED',
        },
        orderBy: [{ kickoff: 'desc' }, { id: 'asc' }],
        take: 6,
        select: matchSelect,
      }),
      this.database.match.findMany({
        where: { ...relatedMatch, status: 'LIVE' },
        orderBy: [{ kickoff: 'asc' }, { id: 'asc' }],
        take: 3,
        select: matchSelect,
      }),
      this.database.article.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          publishedAt: { lte: now },
          OR: [
            { clubs: { some: { clubId: club.id } } },
            {
              match: {
                OR: [{ homeClubId: club.id }, { awayClubId: club.id }],
              },
            },
          ],
        },
        orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
        take: 6,
        select: {
          id: true,
          slug: true,
          title: true,
          lead: true,
          publishedAt: true,
          competition: { select: { name: true, shortName: true } },
        },
      }),
      this.database.forum.findMany({
        where: { active: true, clubId: club.id, category: { active: true } },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        take: 3,
        select: {
          id: true,
          name: true,
          slug: true,
          threads: {
            where: { status: { in: ['OPEN', 'LOCKED'] } },
            orderBy: [{ lastPostAt: 'desc' }, { createdAt: 'desc' }],
            take: 4,
            select: {
              id: true,
              title: true,
              slug: true,
              postCount: true,
              lastPostAt: true,
            },
          },
        },
      }),
      this.database.standing.findFirst({
        where: {
          clubId: club.id,
          competition: { active: true },
          season: { active: true },
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: {
          competitionId: true,
          seasonId: true,
          stageId: true,
          position: true,
          played: true,
          points: true,
          competition: { select: { name: true, slug: true } },
          season: { select: { name: true } },
        },
      }),
    ]);

    // Use exactly the same competition, season and stage as the selected
    // actual club standing; never blend stages or unrelated competitions.
    const standings = currentStanding
      ? await this.database.standing.findMany({
          where: {
            competitionId: currentStanding.competitionId,
            seasonId: currentStanding.seasonId,
            stageId: currentStanding.stageId,
            club: { active: true },
          },
          orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
          take: 30,
          select: {
            id: true,
            position: true,
            played: true,
            goalDifference: true,
            points: true,
            club: {
              select: { id: true, name: true, shortName: true, slug: true },
            },
          },
        })
      : [];

    return {
      club,
      nextMatch: upcoming[0] ?? null,
      lastMatch: finished[0] ?? null,
      matches: [...live, ...upcoming, ...finished],
      news,
      standingContext: currentStanding
        ? {
            competition: currentStanding.competition,
            season: currentStanding.season,
            position: currentStanding.position,
            played: currentStanding.played,
            points: currentStanding.points,
          }
        : null,
      standings,
      forums: forumRows,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
