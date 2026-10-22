jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

import type { NormalizedNewsArticle } from '@kurvenfunk/types';
import type { DatabaseService } from '../database/database.service';
import type { NewsClubMatchingResult } from './news-club-matching.service';
import type { NewsCompetitionMatchingResult } from './news-competition-matching.service';
import { NewsMatchMatchingService } from './news-match-matching.service';

describe('NewsMatchMatchingService', () => {
  const findManyMatch = jest.fn();

  let service: NewsMatchMatchingService;

  const article = (publishedAt?: string): NormalizedNewsArticle => ({
    originalUrl: 'https://provider.test/news/1',
    title: 'Rapid gegen Austria',
    clubNames: ['SK Rapid Wien', 'FK Austria Wien'],
    competitionName: 'Bundesliga',
    ...(publishedAt !== undefined ? { publishedAt } : {}),
  });

  const clubs: NewsClubMatchingResult = {
    matches: [
      {
        clubId: 'rapid-id',
        clubName: 'SK Rapid Wien',
        matchedName: 'SK Rapid Wien',
        matchedAlias: 'SK Rapid Wien',
      },
      {
        clubId: 'austria-id',
        clubName: 'FK Austria Wien',
        matchedName: 'FK Austria Wien',
        matchedAlias: 'FK Austria Wien',
      },
    ],
    unmatchedNames: [],
  };

  const competition: NewsCompetitionMatchingResult = {
    match: {
      competitionId: 'bundesliga-id',
      competitionName: 'Österreichische Bundesliga',
      matchedName: 'Bundesliga',
      matchedField: 'shortName',
    },
    unmatchedName: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const databaseService = {
      client: {
        match: {
          findMany: findManyMatch,
        },
      },
    } as unknown as DatabaseService;

    service = new NewsMatchMatchingService(databaseService);
    findManyMatch.mockResolvedValue([]);
  });

  it('matches a unique fixture for two clubs in the matched competition', async () => {
    const kickoff = new Date('2026-08-23T15:00:00.000Z');

    findManyMatch.mockResolvedValue([
      {
        id: 'match-id',
        homeClubId: 'rapid-id',
        awayClubId: 'austria-id',
        competitionId: 'bundesliga-id',
        kickoff,
      },
    ]);

    await expect(
      service.matchMatch('record-1', article('2026-08-23T18:00:00.000Z'), clubs, competition),
    ).resolves.toEqual({
      match: {
        matchId: 'match-id',
        homeClubId: 'rapid-id',
        awayClubId: 'austria-id',
        competitionId: 'bundesliga-id',
        kickoff,
      },
      ambiguous: false,
    });
  });

  it('matches regardless of which club is home or away', async () => {
    findManyMatch.mockResolvedValue([
      {
        id: 'match-id',
        homeClubId: 'austria-id',
        awayClubId: 'rapid-id',
        competitionId: 'bundesliga-id',
        kickoff: new Date('2026-08-23T15:00:00.000Z'),
      },
    ]);

    const result = await service.matchMatch(
      'record-1',
      article('2026-08-23T18:00:00.000Z'),
      clubs,
      competition,
    );

    expect(result.match?.matchId).toBe('match-id');
  });

  it('restricts candidates to the matched competition and seven-day publication window', async () => {
    await service.matchMatch('record-1', article('2026-08-23T18:00:00.000Z'), clubs, competition);

    expect(findManyMatch).toHaveBeenCalledWith({
      where: {
        competitionId: 'bundesliga-id',
        kickoff: {
          gte: new Date('2026-08-16T18:00:00.000Z'),
          lte: new Date('2026-08-30T18:00:00.000Z'),
        },
        OR: [
          {
            homeClubId: 'rapid-id',
            awayClubId: 'austria-id',
          },
          {
            homeClubId: 'austria-id',
            awayClubId: 'rapid-id',
          },
        ],
      },
      select: {
        id: true,
        homeClubId: true,
        awayClubId: true,
        competitionId: true,
        kickoff: true,
      },
      orderBy: {
        kickoff: 'asc',
      },
    });
  });

  it('returns no match when no fixture exists', async () => {
    await expect(
      service.matchMatch('record-1', article('2026-08-23T18:00:00.000Z'), clubs, competition),
    ).resolves.toEqual({
      match: null,
      ambiguous: false,
    });
  });

  it('does not guess when multiple fixtures are plausible', async () => {
    findManyMatch.mockResolvedValue([
      {
        id: 'match-1',
        homeClubId: 'rapid-id',
        awayClubId: 'austria-id',
        competitionId: 'bundesliga-id',
        kickoff: new Date('2026-08-20T15:00:00.000Z'),
      },
      {
        id: 'match-2',
        homeClubId: 'austria-id',
        awayClubId: 'rapid-id',
        competitionId: 'bundesliga-id',
        kickoff: new Date('2026-08-27T15:00:00.000Z'),
      },
    ]);

    await expect(
      service.matchMatch('record-1', article('2026-08-23T18:00:00.000Z'), clubs, competition),
    ).resolves.toEqual({
      match: null,
      ambiguous: true,
    });
  });

  it('does not attempt matching with fewer than two matched clubs', async () => {
    const result = await service.matchMatch(
      'record-1',
      article('2026-08-23T18:00:00.000Z'),
      {
        matches: [clubs.matches[0]],
        unmatchedNames: [],
      },
      competition,
    );

    expect(result).toEqual({
      match: null,
      ambiguous: false,
    });
    expect(findManyMatch).not.toHaveBeenCalled();
  });

  it('does not attempt matching with more than two matched clubs', async () => {
    const result = await service.matchMatch(
      'record-1',
      article('2026-08-23T18:00:00.000Z'),
      {
        matches: [
          ...clubs.matches,
          {
            clubId: 'sturm-id',
            clubName: 'SK Sturm Graz',
            matchedName: 'SK Sturm Graz',
            matchedAlias: 'SK Sturm Graz',
          },
        ],
        unmatchedNames: [],
      },
      competition,
    );

    expect(result.match).toBeNull();
    expect(findManyMatch).not.toHaveBeenCalled();
  });

  it('does not attempt matching when a club name is unresolved', async () => {
    const result = await service.matchMatch(
      'record-1',
      article('2026-08-23T18:00:00.000Z'),
      {
        matches: clubs.matches,
        unmatchedNames: ['Unknown FC'],
      },
      competition,
    );

    expect(result.match).toBeNull();
    expect(findManyMatch).not.toHaveBeenCalled();
  });

  it('does not attempt matching without a competition match', async () => {
    const result = await service.matchMatch(
      'record-1',
      article('2026-08-23T18:00:00.000Z'),
      clubs,
      {
        match: null,
        unmatchedName: 'Unknown League',
      },
    );

    expect(result.match).toBeNull();
    expect(findManyMatch).not.toHaveBeenCalled();
  });

  it('does not attempt matching without a publication timestamp', async () => {
    const result = await service.matchMatch('record-1', article(), clubs, competition);

    expect(result.match).toBeNull();
    expect(findManyMatch).not.toHaveBeenCalled();
  });

  it('does not attempt matching with an invalid publication timestamp', async () => {
    const result = await service.matchMatch('record-1', article('not-a-date'), clubs, competition);

    expect(result.match).toBeNull();
    expect(findManyMatch).not.toHaveBeenCalled();
  });
});
