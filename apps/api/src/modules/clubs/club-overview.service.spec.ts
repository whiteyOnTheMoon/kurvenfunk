/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const clubFind = jest.fn();
const matchFind = jest.fn();
const articleFind = jest.fn();
const forumFind = jest.fn();
const standingFindFirst = jest.fn();
const standingFindMany = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    match: { findMany: matchFind },
    article: { findMany: articleFind },
    forum: { findMany: forumFind },
    standing: { findFirst: standingFindFirst, findMany: standingFindMany },
    $disconnect: disconnect,
  }),
}));

import type { ClubsService } from './clubs.service';
import { ClubOverviewService } from './club-overview.service';

describe('ClubOverviewService', () => {
  const club = {
    id: 'club-a',
    slug: 'club-a',
    name: 'Club A',
    shortName: null,
    website: null,
    logo: null,
  };
  const match = {
    id: 'match-1',
    kickoff: new Date('2026-11-15T15:00:00Z'),
    homeScore: null,
    awayScore: null,
  };
  const standing = {
    competitionId: 'competition-1',
    seasonId: 'season-1',
    stageId: 'stage-1',
    position: 2,
    played: 8,
    points: 17,
    competition: { name: 'Liga A', slug: 'liga-a' },
    season: { name: '2026/27' },
  };

  let overview: ClubOverviewService;

  beforeEach(() => {
    jest.clearAllMocks();
    clubFind.mockResolvedValue(club);
    matchFind
      .mockResolvedValueOnce([match])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    articleFind.mockResolvedValue([]);
    forumFind.mockResolvedValue([]);
    standingFindFirst.mockResolvedValue(null);
    standingFindMany.mockResolvedValue([]);
    disconnect.mockResolvedValue(undefined);
    overview = new ClubOverviewService({ findActiveBySlug: clubFind } as unknown as ClubsService);
  });

  it('enforces the public active-club lookup and returns only canonical data', async () => {
    const response = await overview.findBySlug('club-a');
    expect(clubFind).toHaveBeenCalledWith('club-a');
    expect(response).toMatchObject({
      club,
      nextMatch: match,
      lastMatch: null,
      matches: [match],
      news: [],
      standingContext: null,
      standings: [],
      forums: [],
    });
    expect(matchFind).toHaveBeenCalledTimes(3);
    expect(standingFindMany).not.toHaveBeenCalled();
  });

  it('never queries related content for an inactive or non-existent club', async () => {
    clubFind.mockRejectedValue(new Error('CLUB_NOT_FOUND'));
    await expect(overview.findBySlug('inactive')).rejects.toThrow('CLUB_NOT_FOUND');
    expect(matchFind).not.toHaveBeenCalled();
    expect(articleFind).not.toHaveBeenCalled();
    expect(forumFind).not.toHaveBeenCalled();
  });

  it('restricts fixtures and results to current seasons and active competitions', async () => {
    await overview.findBySlug('club-a');
    expect(matchFind).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ homeClubId: club.id }, { awayClubId: club.id }],
          competition: { active: true },
          season: { active: true },
          kickoff: { gte: expect.any(Date) },
          status: { in: ['SCHEDULED', 'POSTPONED'] },
        }),
        take: 6,
      }),
    );
    expect(matchFind).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          kickoff: { lte: expect.any(Date) },
          status: 'FINISHED',
        }),
        take: 6,
      }),
    );
    expect(matchFind).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: expect.objectContaining({ status: 'LIVE' }),
        take: 3,
      }),
    );
  });

  it('never exposes drafts, unpublished, future-published or deleted articles', async () => {
    await overview.findBySlug('club-a');
    expect(articleFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          publishedAt: { lte: expect.any(Date) },
          OR: [
            { clubs: { some: { clubId: club.id } } },
            { match: { OR: [{ homeClubId: club.id }, { awayClubId: club.id }] } },
          ],
        },
        take: 6,
      }),
    );
  });

  it('returns only real active club forums and public threads', async () => {
    const forum = {
      id: 'forum-a',
      name: 'Fans',
      slug: 'fans-a',
      threads: [{ id: 'thread-1', title: 'Saison', postCount: 12, slug: 'saison' }],
    };
    forumFind.mockResolvedValue([forum]);
    const data = await overview.findBySlug('club-a');
    expect(data.forums).toEqual([forum]);
    expect(forumFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { active: true, clubId: club.id, category: { active: true } },
        select: expect.objectContaining({
          threads: expect.objectContaining({
            where: { status: { in: ['OPEN', 'LOCKED'] } },
            take: 4,
          }),
        }),
      }),
    );
  });

  it('renders the table from exactly one active competition/season/stage', async () => {
    standingFindFirst.mockResolvedValue(standing);
    const tableRow = {
      id: 'standing-a',
      position: 2,
      played: 8,
      goalDifference: 4,
      points: 17,
      club: { id: club.id, slug: club.slug, name: club.name },
    };
    standingFindMany.mockResolvedValue([tableRow]);
    const data = await overview.findBySlug('club-a');
    expect(data.standingContext).toEqual({
      competition: standing.competition,
      season: standing.season,
      position: 2,
      played: 8,
      points: 17,
    });
    expect(data.standings).toEqual([tableRow]);
    expect(standingFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          clubId: club.id,
          competition: { active: true },
          season: { active: true },
        },
      }),
    );
    expect(standingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          competitionId: standing.competitionId,
          seasonId: standing.seasonId,
          stageId: standing.stageId,
          club: { active: true },
        },
        take: 30,
      }),
    );
  });

  it('keeps live, upcoming and finished fixture lists separate and bounded', async () => {
    matchFind.mockReset();
    const upcoming = { id: 'next', kickoff: new Date('2026-12-01') };
    const last = { id: 'last', kickoff: new Date('2026-10-01') };
    const live = { id: 'live', kickoff: new Date('2026-11-10') };
    matchFind
      .mockResolvedValueOnce([upcoming])
      .mockResolvedValueOnce([last])
      .mockResolvedValueOnce([live]);
    const data = await overview.findBySlug('club-a');
    expect(data.nextMatch).toBe(upcoming);
    expect(data.lastMatch).toBe(last);
    expect(data.matches).toEqual([live, upcoming, last]);
  });

  it('releases its database connection on module destroy', async () => {
    await overview.onModuleDestroy();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
