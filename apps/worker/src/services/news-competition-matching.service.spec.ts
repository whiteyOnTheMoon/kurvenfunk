jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

import type { NormalizedNewsArticle } from '@kurvenfunk/types';
import type { DatabaseService } from '../database/database.service';
import { NewsCompetitionMatchingService } from './news-competition-matching.service';

describe('NewsCompetitionMatchingService', () => {
  const findManyCompetition = jest.fn();

  let service: NewsCompetitionMatchingService;

  const article = (competitionName?: string): NormalizedNewsArticle => ({
    originalUrl: 'https://provider.test/news/1',
    title: 'Test article',
    clubNames: [],
    ...(competitionName !== undefined ? { competitionName } : {}),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    const databaseService = {
      client: {
        competition: {
          findMany: findManyCompetition,
        },
      },
    } as unknown as DatabaseService;

    service = new NewsCompetitionMatchingService(databaseService);

    findManyCompetition.mockResolvedValue([]);
  });

  it('matches the canonical competition name', async () => {
    findManyCompetition.mockResolvedValue([
      {
        id: 'bundesliga-id',
        name: 'Österreichische Bundesliga',
        shortName: 'Bundesliga',
        slug: 'austrian-bundesliga',
      },
    ]);

    await expect(
      service.matchCompetition('record-1', article('Österreichische Bundesliga')),
    ).resolves.toEqual({
      match: {
        competitionId: 'bundesliga-id',
        competitionName: 'Österreichische Bundesliga',
        matchedName: 'Österreichische Bundesliga',
        matchedField: 'name',
      },
      unmatchedName: null,
    });
  });

  it('matches a competition short name', async () => {
    findManyCompetition.mockResolvedValue([
      {
        id: 'bundesliga-id',
        name: 'Österreichische Bundesliga',
        shortName: 'Bundesliga',
        slug: 'austrian-bundesliga',
      },
    ]);

    const result = await service.matchCompetition('record-1', article('Bundesliga'));

    expect(result.match).toEqual(
      expect.objectContaining({
        competitionId: 'bundesliga-id',
        matchedField: 'shortName',
      }),
    );
    expect(result.unmatchedName).toBeNull();
  });

  it('matches a competition slug', async () => {
    findManyCompetition.mockResolvedValue([
      {
        id: 'cup-id',
        name: 'ÖFB Cup',
        shortName: 'ÖFB Cup',
        slug: 'oefb-cup',
      },
    ]);

    const result = await service.matchCompetition('record-1', article('oefb-cup'));

    expect(result.match).toEqual(
      expect.objectContaining({
        competitionId: 'cup-id',
        matchedField: 'slug',
      }),
    );
    expect(result.unmatchedName).toBeNull();
  });

  it('normalizes case, whitespace, punctuation and diacritics', async () => {
    findManyCompetition.mockResolvedValue([
      {
        id: 'cup-id',
        name: 'ÖFB Cup',
        shortName: 'ÖFB Cup',
        slug: 'oefb-cup',
      },
    ]);

    const result = await service.matchCompetition('record-1', article('  ÖFB---CUP  '));

    expect(result.match).toEqual(
      expect.objectContaining({
        competitionId: 'cup-id',
      }),
    );
    expect(result.unmatchedName).toBeNull();
  });

  it('returns an unknown competition as unmatched', async () => {
    const result = await service.matchCompetition('record-1', article('Champions League'));

    expect(result).toEqual({
      match: null,
      unmatchedName: 'Champions League',
    });
  });

  it('does not guess when the same normalized name resolves to multiple competitions', async () => {
    findManyCompetition.mockResolvedValue([
      {
        id: 'competition-1',
        name: 'Bundesliga',
        shortName: null,
        slug: 'competition-1',
      },
      {
        id: 'competition-2',
        name: 'Other Competition',
        shortName: 'Bundesliga',
        slug: 'competition-2',
      },
    ]);

    const result = await service.matchCompetition('record-1', article('Bundesliga'));

    expect(result).toEqual({
      match: null,
      unmatchedName: 'Bundesliga',
    });
  });

  it('handles articles without a competition name', async () => {
    await expect(service.matchCompetition('record-1', article())).resolves.toEqual({
      match: null,
      unmatchedName: null,
    });

    expect(findManyCompetition).not.toHaveBeenCalled();
  });

  it('handles an empty competition name', async () => {
    await expect(service.matchCompetition('record-1', article('   '))).resolves.toEqual({
      match: null,
      unmatchedName: null,
    });

    expect(findManyCompetition).not.toHaveBeenCalled();
  });

  it('only loads active competitions', async () => {
    await service.matchCompetition('record-1', article('Bundesliga'));

    expect(findManyCompetition).toHaveBeenCalledWith({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
      },
    });
  });
});
