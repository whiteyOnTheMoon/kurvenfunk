jest.mock('@kurvenfunk/database', () => ({
  Prisma: {},
  createPrismaClient: jest.fn(),
}));

import type { NewsProvider, NormalizedNewsArticle } from '@kurvenfunk/types';

import type { DatabaseService } from '../database/database.service';
import type { NewsClubMatchingResult } from './news-club-matching.service';
import type { NewsCompetitionMatchingResult } from './news-competition-matching.service';
import type { NewsMatchMatchingResult } from './news-match-matching.service';
import { NewsAutoPublishingService } from './news-auto-publishing.service';

describe('NewsAutoPublishingService', () => {
  const findImportRecord = jest.fn();
  const findArticle = jest.fn();
  const transaction = jest.fn();

  const txFindImportRecord = jest.fn();
  const createArticle = jest.fn();
  const updateImportRecord = jest.fn();
  const claimImportRecord = jest.fn();
  const updateImportJob = jest.fn();

  let service: NewsAutoPublishingService;

  const provider = {
    key: 'trusted',
    name: 'Trusted Provider',
    trustedForAutoPublish: true,
    capabilities: {
      supportsCursorPagination: true,
      supportsTimeWindow: true,
    },
    fetch: jest.fn(),
  } as unknown as NewsProvider;

  const article: NormalizedNewsArticle = {
    originalUrl: 'https://provider.test/rapid-austria',
    title: 'Rapid schlägt Austria im Wiener Derby',
    lead: 'Rapid gewinnt das Derby.',
    body: 'Rapid setzt sich in einer umkämpften Partie gegen Austria durch.',
    authorName: 'Provider Redaktion',
    publishedAt: '2026-08-23T18:00:00.000Z',
    clubNames: ['SK Rapid Wien', 'FK Austria Wien'],
    competitionName: 'Bundesliga',
  };

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

  const match: NewsMatchMatchingResult = {
    match: {
      matchId: 'match-id',
      homeClubId: 'rapid-id',
      awayClubId: 'austria-id',
      competitionId: 'bundesliga-id',
      kickoff: new Date('2026-08-23T15:00:00.000Z'),
    },
    ambiguous: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const tx = {
      importRecord: {
        findUniqueOrThrow: txFindImportRecord,
        update: updateImportRecord,
        updateMany: claimImportRecord,
      },
      article: {
        create: createArticle,
      },
      importJob: {
        update: updateImportJob,
      },
    };

    const databaseService = {
      client: {
        importRecord: {
          findUniqueOrThrow: findImportRecord,
        },
        article: {
          findUnique: findArticle,
        },
        $transaction: transaction,
      },
    } as unknown as DatabaseService;

    service = new NewsAutoPublishingService(databaseService);

    findImportRecord.mockResolvedValue({
      id: 'record-1',
      status: 'MATCHED',
      canonicalEntityType: 'MATCH',
      canonicalEntityId: 'match-id',
    });

    findArticle.mockResolvedValue(null);

    txFindImportRecord.mockResolvedValue({
      importJobId: 'job-1',
      status: 'MATCHED',
      canonicalEntityType: 'MATCH',
      canonicalEntityId: 'match-id',
    });

    createArticle.mockResolvedValue({
      id: 'article-id',
    });

    claimImportRecord.mockResolvedValue({ count: 1 });

    updateImportRecord.mockResolvedValue({
      id: 'record-1',
    });

    updateImportJob.mockResolvedValue({
      id: 'job-1',
    });

    transaction.mockImplementation(
      async (callback: (transactionClient: typeof tx) => Promise<unknown>) => callback(tx),
    );
  });

  it('creates a published article from a matched import record', async () => {
    const result = await service.publish(provider, 'record-1', article, clubs, competition, match);

    expect(result).toEqual({
      articleId: 'article-id',
      created: true,
    });

    expect(createArticle).toHaveBeenCalledWith({
      data: {
        importRecordId: 'record-1',
        title: 'Rapid schlägt Austria im Wiener Derby',
        slug: 'rapid-schlagt-austria-im-wiener-derby',
        lead: 'Rapid gewinnt das Derby.',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Rapid setzt sich in einer umkämpften Partie gegen Austria durch.',
                },
              ],
            },
          ],
        },
        status: 'PUBLISHED',
        externalAuthorName: 'Provider Redaktion',
        originalUrl: 'https://provider.test/rapid-austria',
        competitionId: 'bundesliga-id',
        matchId: 'match-id',
        publishedAt: new Date('2026-08-23T18:00:00.000Z'),
        clubs: {
          create: [
            {
              clubId: 'rapid-id',
            },
            {
              clubId: 'austria-id',
            },
          ],
        },
      },
      select: {
        id: true,
      },
    });

    expect(updateImportRecord).toHaveBeenCalledWith({
      where: {
        id: 'record-1',
      },
      data: {
        status: 'CREATED',
        canonicalEntityType: 'ARTICLE',
        canonicalEntityId: 'article-id',
        errorCode: null,
        errorMessage: null,
      },
    });

    expect(updateImportJob).toHaveBeenCalledWith({
      where: {
        id: 'job-1',
      },
      data: {
        createdCount: {
          increment: 1,
        },
      },
    });
  });

  it('does not publish records from an untrusted provider', async () => {
    const untrustedProvider: NewsProvider = {
      key: provider.key,
      name: provider.name,
      capabilities: provider.capabilities,
      trustedForAutoPublish: false,
      fetch: (input) => provider.fetch(input),
    };

    const result = await service.publish(
      untrustedProvider,
      'record-1',
      article,
      clubs,
      competition,
      match,
    );

    expect(result).toEqual({
      articleId: null,
      created: false,
      skippedReason: 'PROVIDER_NOT_TRUSTED',
    });

    expect(findImportRecord).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
    expect(createArticle).not.toHaveBeenCalled();
  });

  it('does not create another article when the record was already created', async () => {
    findImportRecord.mockResolvedValue({
      id: 'record-1',
      status: 'CREATED',
      canonicalEntityType: 'ARTICLE',
      canonicalEntityId: 'existing-article-id',
    });

    const result = await service.publish(provider, 'record-1', article, clubs, competition, match);

    expect(result).toEqual({
      articleId: 'existing-article-id',
      created: false,
    });

    expect(transaction).not.toHaveBeenCalled();
    expect(createArticle).not.toHaveBeenCalled();
    expect(updateImportJob).not.toHaveBeenCalled();
  });

  it('rejects records that are still waiting for review', async () => {
    findImportRecord.mockResolvedValue({
      id: 'record-1',
      status: 'REVIEW_REQUIRED',
      canonicalEntityType: null,
      canonicalEntityId: null,
    });

    await expect(
      service.publish(provider, 'record-1', article, clubs, competition, match),
    ).rejects.toThrow('Import record record-1 cannot be published from status REVIEW_REQUIRED');

    expect(createArticle).not.toHaveBeenCalled();
  });

  it('claims a matched record before article creation in a serializable transaction', async () => {
    await service.publish(provider, 'record-1', article, clubs, competition, match);

    expect(claimImportRecord).toHaveBeenCalledWith({
      where: { id: 'record-1', status: 'MATCHED' },
      data: { status: 'CREATED' },
    });
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(claimImportRecord.mock.invocationCallOrder[0]).toBeLessThan(
      createArticle.mock.invocationCallOrder[0],
    );
  });

  it('returns the already-created article if another worker won the claim', async () => {
    claimImportRecord.mockResolvedValueOnce({ count: 0 });
    txFindImportRecord
      .mockResolvedValueOnce({
        importJobId: 'job-1',
        status: 'MATCHED',
        canonicalEntityType: null,
        canonicalEntityId: null,
      })
      .mockResolvedValueOnce({
        status: 'CREATED',
        canonicalEntityType: 'ARTICLE',
        canonicalEntityId: 'winner-id',
      });

    const result = await service.publish(provider, 'record-1', article, clubs, competition, match);

    expect(result).toEqual({ articleId: 'winner-id', created: false });
    expect(createArticle).not.toHaveBeenCalled();
    expect(updateImportJob).not.toHaveBeenCalled();
  });

  it('retries serializable write conflicts without losing the import record', async () => {
    transaction.mockRejectedValueOnce({ code: 'P2034' });

    const result = await service.publish(provider, 'record-1', article, clubs, competition, match);

    expect(result).toEqual({ articleId: 'article-id', created: true });
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(createArticle).toHaveBeenCalledTimes(1);
  });

  it('uses a stable record-ID slug if concurrent imports collide', async () => {
    createArticle.mockRejectedValueOnce({ code: 'P2002' });

    await service.publish(provider, 'record-1', article, clubs, competition, match);

    expect(createArticle).toHaveBeenCalledTimes(2);
    const secondCall = createArticle.mock.calls[1]?.[0] as {
      data: { slug: string };
    };
    expect(secondCall.data.slug).toBe(
      'rapid-schlagt-austria-im-wiener-derby-record-1',
    );
  });

  it('creates a unique slug when the base slug already exists', async () => {
    findArticle
      .mockResolvedValueOnce({
        id: 'existing-1',
      })
      .mockResolvedValueOnce(null);

    await service.publish(provider, 'record-1', article, clubs, competition, match);

    expect(createArticle).toHaveBeenCalledTimes(1);

    const createCalls = createArticle.mock.calls as Array<
      [
        {
          data: {
            slug: string;
          };
        },
      ]
    >;

    expect(createCalls[0]?.[0].data.slug).toBe('rapid-schlagt-austria-im-wiener-derby-2');
  });
});
