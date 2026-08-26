jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

import type { NormalizedNewsArticle } from '@kurvenfunk/types';
import type { DatabaseService } from '../database/database.service';
import { NewsClubMatchingService } from './news-club-matching.service';

describe('NewsClubMatchingService', () => {
  const findManyClubAlias = jest.fn();

  let service: NewsClubMatchingService;

  const article = (clubNames: string[]): NormalizedNewsArticle => ({
    originalUrl: 'https://provider.test/news/1',
    title: 'Test article',
    clubNames,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    const databaseService = {
      client: {
        clubAlias: {
          findMany: findManyClubAlias,
        },
      },
    } as unknown as DatabaseService;

    service = new NewsClubMatchingService(databaseService);

    findManyClubAlias.mockResolvedValue([]);
  });

  it('matches a normalized club alias', async () => {
    findManyClubAlias.mockResolvedValue([
      {
        alias: 'Rapid Wien',
        normalizedAlias: 'rapid wien',
        club: {
          id: 'rapid-id',
          name: 'SK Rapid Wien',
        },
      },
    ]);

    await expect(service.matchClubs('record-1', article(['Rapid Wien']))).resolves.toEqual({
      matches: [
        {
          clubId: 'rapid-id',
          clubName: 'SK Rapid Wien',
          matchedName: 'Rapid Wien',
          matchedAlias: 'Rapid Wien',
        },
      ],
      unmatchedNames: [],
    });
  });

  it('normalizes case, whitespace, punctuation and diacritics', async () => {
    findManyClubAlias.mockResolvedValue([
      {
        alias: 'Blau-Weiß Linz',
        normalizedAlias: 'blau weiss linz',
        club: {
          id: 'bwl-id',
          name: 'FC Blau-Weiß Linz',
        },
      },
    ]);

    const result = await service.matchClubs('record-1', article(['  BLAU-WEISS   LINZ  ']));

    expect(result.matches).toEqual([
      expect.objectContaining({
        clubId: 'bwl-id',
      }),
    ]);
    expect(result.unmatchedNames).toEqual([]);
  });

  it('returns unknown names as unmatched', async () => {
    const result = await service.matchClubs('record-1', article(['Unknown FC']));

    expect(result).toEqual({
      matches: [],
      unmatchedNames: ['Unknown FC'],
    });
  });

  it('does not guess when the same alias resolves to multiple clubs', async () => {
    findManyClubAlias.mockResolvedValue([
      {
        alias: 'Austria',
        normalizedAlias: 'austria',
        club: {
          id: 'austria-wien-id',
          name: 'FK Austria Wien',
        },
      },
      {
        alias: 'Austria',
        normalizedAlias: 'austria',
        club: {
          id: 'austria-salzburg-id',
          name: 'SV Austria Salzburg',
        },
      },
    ]);

    const result = await service.matchClubs('record-1', article(['Austria']));

    expect(result.matches).toEqual([]);
    expect(result.unmatchedNames).toEqual(['Austria']);
  });

  it('deduplicates multiple aliases resolving to the same club', async () => {
    findManyClubAlias.mockResolvedValue([
      {
        alias: 'SK Rapid',
        normalizedAlias: 'sk rapid',
        club: {
          id: 'rapid-id',
          name: 'SK Rapid Wien',
        },
      },
      {
        alias: 'Rapid Wien',
        normalizedAlias: 'rapid wien',
        club: {
          id: 'rapid-id',
          name: 'SK Rapid Wien',
        },
      },
    ]);

    const result = await service.matchClubs('record-1', article(['SK Rapid', 'Rapid Wien']));

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]?.clubId).toBe('rapid-id');
    expect(result.unmatchedNames).toEqual([]);
  });

  it('handles articles without club names', async () => {
    await expect(service.matchClubs('record-1', article([]))).resolves.toEqual({
      matches: [],
      unmatchedNames: [],
    });

    expect(findManyClubAlias).not.toHaveBeenCalled();
  });

  it('only loads active aliases belonging to active clubs', async () => {
    await service.matchClubs('record-1', article(['Rapid Wien']));

    expect(findManyClubAlias).toHaveBeenCalledWith({
      where: {
        active: true,
        club: {
          active: true,
        },
      },
      select: {
        alias: true,
        normalizedAlias: true,
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  });
});
