jest.mock('@kurvenfunk/database', () => ({
  Prisma: {},
  createPrismaClient: jest.fn(),
}));

jest.mock('@kurvenfunk/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('@kurvenfunk/types', () => ({
  QUEUE_NAMES: {
    NEWS_IMPORT: 'news-import',
  },
}));

import type { NewsImportJobPayload, NewsProviderRecord } from '@kurvenfunk/types';
import type { Job } from 'bullmq';
import { FakeNewsNormalizer } from '../providers/fake-news-normalizer';
import { FakeNewsProvider } from '../providers/fake-news-provider';
import type { OtsNewsNormalizer } from '../providers/ots-news-normalizer';
import type { OtsNewsProvider } from '../providers/ots-news-provider';
import type { NewsAutoPublishingService } from '../services/news-auto-publishing.service';
import type { NewsClubMatchingService } from '../services/news-club-matching.service';
import type { NewsCompetitionMatchingService } from '../services/news-competition-matching.service';
import type { NewsConfidenceScoreService } from '../services/news-confidence-score.service';
import type { NewsDuplicateDetectionService } from '../services/news-duplicate-detection.service';
import type { NewsImportDeadLetterService } from '../services/news-import-dead-letter.service';
import type { NewsMatchMatchingService } from '../services/news-match-matching.service';
import type { NewsReviewWorkflowService } from '../services/news-review-workflow.service';
import type { NewsNormalizationService } from '../services/news-normalization.service';
import type { NewsValidationService } from '../services/news-validation.service';
import type { RawPayloadImportSession, RawPayloadService } from '../services/raw-payload.service';
import { NewsImportProcessor } from './news-import.processor';

describe('NewsImportProcessor', () => {
  let provider: FakeNewsProvider;
  let processor: NewsImportProcessor;

  const startNewsImport = jest.fn();
  const storeRecord = jest.fn();
  const normalizeRecord = jest.fn();
  const validateRecord = jest.fn();
  const detectDuplicate = jest.fn();
  const matchClubs = jest.fn();
  const matchCompetition = jest.fn();
  const matchMatch = jest.fn();
  const scoreConfidence = jest.fn();
  const applyReviewWorkflow = jest.fn();
  const autoPublish = jest.fn();
  const completeNewsImport = jest.fn();
  const failNewsImport = jest.fn();
  const moveToDeadLetter = jest.fn();

  const importSession = {
    providerId: '11111111-1111-4111-8111-111111111111',
    importJobId: '22222222-2222-4222-8222-222222222222',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    provider = new FakeNewsProvider();
    const normalizer = new FakeNewsNormalizer();

    startNewsImport.mockResolvedValue(importSession);
    storeRecord.mockImplementation(
      (_session: RawPayloadImportSession, record: NewsProviderRecord) =>
        Promise.resolve({
          rawPayloadId: `raw-${record.externalId ?? 'unknown'}`,
          importRecordId: `import-${record.externalId ?? 'unknown'}`,
        }),
    );
    normalizeRecord.mockImplementation((_importRecordId: string, record: NewsProviderRecord) =>
      Promise.resolve({
        externalId: record.externalId,
        originalUrl: record.externalUrl,
        title:
          typeof record.payload === 'object' &&
          record.payload !== null &&
          'title' in record.payload &&
          typeof record.payload.title === 'string'
            ? record.payload.title
            : 'Normalized title',
        clubNames: [],
      }),
    );

    validateRecord.mockResolvedValue({
      valid: true,
      article: {
        originalUrl: 'https://fake-provider.test/news/fake',
        title: 'Normalized title',
        clubNames: [],
      },
    });

    detectDuplicate.mockResolvedValue({
      duplicate: false,
    });

    matchClubs.mockResolvedValue({
      matches: [],
      unmatchedNames: [],
    });

    matchCompetition.mockResolvedValue({
      match: null,
      unmatchedName: null,
    });

    matchMatch.mockResolvedValue({
      match: null,
      ambiguous: false,
    });

    scoreConfidence.mockReturnValue({
      confidence: 'UNKNOWN',
      reasons: ['no_match_evidence'],
    });

    applyReviewWorkflow.mockResolvedValue({
      status: 'REVIEW_REQUIRED',
      reviewRequired: true,
    });

    autoPublish.mockResolvedValue({
      articleId: 'article-id',
      created: true,
    });

    completeNewsImport.mockResolvedValue(undefined);
    failNewsImport.mockResolvedValue(undefined);

    const rawPayloadService = {
      startNewsImport,
      storeRecord,
      completeNewsImport,
      failNewsImport,
    } as unknown as RawPayloadService;

    const newsNormalizationService = {
      normalizeRecord,
    } as unknown as NewsNormalizationService;

    const newsValidationService = {
      validateRecord,
    } as unknown as NewsValidationService;

    const newsDuplicateDetectionService = {
      detectDuplicate,
    } as unknown as NewsDuplicateDetectionService;

    const newsClubMatchingService = {
      matchClubs,
    } as unknown as NewsClubMatchingService;

    const newsCompetitionMatchingService = {
      matchCompetition,
    } as unknown as NewsCompetitionMatchingService;

    const newsMatchMatchingService = {
      matchMatch,
    } as unknown as NewsMatchMatchingService;

    const newsConfidenceScoreService = {
      score: scoreConfidence,
    } as unknown as NewsConfidenceScoreService;

    const newsReviewWorkflowService = {
      apply: applyReviewWorkflow,
    } as unknown as NewsReviewWorkflowService;

    const newsAutoPublishingService = {
      publish: autoPublish,
    } as unknown as NewsAutoPublishingService;

    const newsImportDeadLetterService = {
      moveToDeadLetter,
    } as unknown as NewsImportDeadLetterService;

    const otsProvider = {
      key: 'ots',
    } as unknown as OtsNewsProvider;

    const otsNormalizer = {
      normalizeNewsRecord: jest.fn(),
    } as unknown as OtsNewsNormalizer;

    processor = new NewsImportProcessor(
      provider,
      normalizer,
      otsProvider,
      otsNormalizer,
      rawPayloadService,
      newsNormalizationService,
      newsValidationService,
      newsDuplicateDetectionService,
      newsClubMatchingService,
      newsCompetitionMatchingService,
      newsMatchMatchingService,
      newsConfidenceScoreService,
      newsReviewWorkflowService,
      newsAutoPublishingService,
      newsImportDeadLetterService,
    );
  });

  function createJob(
    data: NewsImportJobPayload = {
      providerKey: 'fake',
    },
    name = 'fetch-provider',
  ): Job<NewsImportJobPayload> {
    return {
      id: 'news-import-job-1',
      name,
      data,
    } as Job<NewsImportJobPayload>;
  }

  it('fetches all pages from the selected provider', async () => {
    const fetch = jest.spyOn(provider, 'fetch');

    await processor.process(createJob());

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenNthCalledWith(1, {});
    expect(fetch).toHaveBeenNthCalledWith(2, {
      cursor: '2',
    });
    expect(fetch).toHaveBeenNthCalledWith(3, {
      cursor: '4',
    });
  });

  it('passes a runtime lookback window to every provider page', async () => {
    const fetch = jest
      .spyOn(provider, 'fetch')
      .mockResolvedValueOnce({
        records: [],
        nextCursor: '2',
      })
      .mockResolvedValueOnce({
        records: [],
        nextCursor: '3',
      })
      .mockResolvedValueOnce({
        records: [],
      });

    await processor.process(
      createJob({
        providerKey: 'fake',
        lookbackMinutes: 15,
      }),
    );

    expect(fetch).toHaveBeenCalledTimes(3);

    const firstInput = fetch.mock.calls[0]?.[0];
    const secondInput = fetch.mock.calls[1]?.[0];
    const thirdInput = fetch.mock.calls[2]?.[0];

    expect(firstInput?.windowStart).toBeDefined();
    expect(firstInput?.windowEnd).toBeDefined();

    expect(startNewsImport).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        windowStart: firstInput?.windowStart,
        windowEnd: firstInput?.windowEnd,
      }),
    );

    if (firstInput?.windowStart === undefined || firstInput.windowEnd === undefined) {
      throw new Error('Expected runtime import window');
    }

    expect(Date.parse(firstInput.windowEnd) - Date.parse(firstInput.windowStart)).toBe(15 * 60_000);

    expect(secondInput).toEqual({
      cursor: '2',
      windowStart: firstInput.windowStart,
      windowEnd: firstInput.windowEnd,
    });

    expect(thirdInput).toEqual({
      cursor: '3',
      windowStart: firstInput.windowStart,
      windowEnd: firstInput.windowEnd,
    });
  });

  it('persists every provider record as raw payload', async () => {
    await processor.process(createJob());

    expect(startNewsImport).toHaveBeenCalledTimes(1);
    expect(startNewsImport).toHaveBeenCalledWith(provider, {
      queueJobId: 'news-import-job-1',
    });

    expect(storeRecord).toHaveBeenCalledTimes(5);

    expect(storeRecord).toHaveBeenNthCalledWith(
      1,
      importSession,
      expect.objectContaining({
        externalId: 'fake-001',
      }),
    );

    expect(storeRecord).toHaveBeenNthCalledWith(
      5,
      importSession,
      expect.objectContaining({
        externalId: 'fake-005',
      }),
    );

    expect(completeNewsImport).toHaveBeenCalledTimes(1);
    expect(completeNewsImport).toHaveBeenCalledWith(importSession);
    expect(failNewsImport).not.toHaveBeenCalled();
  });

  it('normalizes every persisted provider record', async () => {
    await processor.process(createJob());

    expect(normalizeRecord).toHaveBeenCalledTimes(5);

    expect(normalizeRecord).toHaveBeenNthCalledWith(
      1,
      'import-fake-001',
      expect.objectContaining({
        externalId: 'fake-001',
      }),
      expect.any(FakeNewsNormalizer),
    );

    expect(normalizeRecord).toHaveBeenNthCalledWith(
      5,
      'import-fake-005',
      expect.objectContaining({
        externalId: 'fake-005',
      }),
      expect.any(FakeNewsNormalizer),
    );
  });

  it('validates every normalized provider record', async () => {
    await processor.process(createJob());

    expect(validateRecord).toHaveBeenCalledTimes(5);

    expect(validateRecord).toHaveBeenNthCalledWith(
      1,
      'import-fake-001',
      expect.objectContaining({
        externalId: 'fake-001',
      }),
    );

    expect(validateRecord).toHaveBeenNthCalledWith(
      5,
      'import-fake-005',
      expect.objectContaining({
        externalId: 'fake-005',
      }),
    );
  });

  it('runs duplicate detection for every valid record', async () => {
    await processor.process(createJob());

    expect(detectDuplicate).toHaveBeenCalledTimes(5);

    expect(detectDuplicate).toHaveBeenNthCalledWith(
      1,
      'import-fake-001',
      expect.objectContaining({
        title: 'Normalized title',
      }),
    );

    expect(detectDuplicate).toHaveBeenNthCalledWith(
      5,
      'import-fake-005',
      expect.objectContaining({
        title: 'Normalized title',
      }),
    );
  });

  it('runs club matching for every valid non-duplicate record', async () => {
    await processor.process(createJob());

    expect(matchClubs).toHaveBeenCalledTimes(5);

    expect(matchClubs).toHaveBeenNthCalledWith(
      1,
      'import-fake-001',
      expect.objectContaining({
        title: 'Normalized title',
        clubNames: [],
      }),
    );

    expect(matchClubs).toHaveBeenNthCalledWith(
      5,
      'import-fake-005',
      expect.objectContaining({
        title: 'Normalized title',
        clubNames: [],
      }),
    );
  });

  it('runs competition matching for every valid non-duplicate record', async () => {
    await processor.process(createJob());

    expect(matchCompetition).toHaveBeenCalledTimes(5);

    expect(matchCompetition).toHaveBeenNthCalledWith(
      1,
      'import-fake-001',
      expect.objectContaining({
        title: 'Normalized title',
        clubNames: [],
      }),
    );

    expect(matchCompetition).toHaveBeenNthCalledWith(
      5,
      'import-fake-005',
      expect.objectContaining({
        title: 'Normalized title',
        clubNames: [],
      }),
    );
  });

  it('runs match matching with the club and competition matching results', async () => {
    const clubMatchingResult = {
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

    const competitionMatchingResult = {
      match: {
        competitionId: 'bundesliga-id',
        competitionName: 'Österreichische Bundesliga',
        matchedName: 'Bundesliga',
        matchedField: 'shortName' as const,
      },
      unmatchedName: null,
    };

    matchClubs.mockResolvedValue(clubMatchingResult);
    matchCompetition.mockResolvedValue(competitionMatchingResult);

    await processor.process(createJob());

    expect(matchMatch).toHaveBeenCalledTimes(5);

    expect(matchMatch).toHaveBeenNthCalledWith(
      1,
      'import-fake-001',
      expect.objectContaining({
        title: 'Normalized title',
        clubNames: [],
      }),
      clubMatchingResult,
      competitionMatchingResult,
    );
  });

  it('calculates confidence from the entity matching results', async () => {
    const clubMatchingResult = {
      matches: [],
      unmatchedNames: [],
    };

    const competitionMatchingResult = {
      match: null,
      unmatchedName: null,
    };

    const matchMatchingResult = {
      match: null,
      ambiguous: false,
    };

    matchClubs.mockResolvedValue(clubMatchingResult);
    matchCompetition.mockResolvedValue(competitionMatchingResult);
    matchMatch.mockResolvedValue(matchMatchingResult);

    await processor.process(createJob());

    expect(scoreConfidence).toHaveBeenCalledTimes(5);
    expect(scoreConfidence).toHaveBeenNthCalledWith(
      1,
      clubMatchingResult,
      competitionMatchingResult,
      matchMatchingResult,
    );
  });

  it('applies the review workflow with the calculated confidence and matching results', async () => {
    const clubMatchingResult = {
      matches: [],
      unmatchedNames: [],
    };

    const competitionMatchingResult = {
      match: null,
      unmatchedName: null,
    };

    const matchMatchingResult = {
      match: null,
      ambiguous: false,
    };

    const confidenceResult = {
      confidence: 'UNKNOWN' as const,
      reasons: ['no_match_evidence'],
    };

    matchClubs.mockResolvedValue(clubMatchingResult);
    matchCompetition.mockResolvedValue(competitionMatchingResult);
    matchMatch.mockResolvedValue(matchMatchingResult);
    scoreConfidence.mockReturnValue(confidenceResult);

    await processor.process(createJob());

    expect(applyReviewWorkflow).toHaveBeenCalledTimes(5);
    expect(applyReviewWorkflow).toHaveBeenNthCalledWith(
      1,
      'import-fake-001',
      confidenceResult,
      clubMatchingResult,
      competitionMatchingResult,
      matchMatchingResult,
    );
  });

  it('auto publishes records that pass review without manual intervention', async () => {
    const clubMatchingResult = {
      matches: [],
      unmatchedNames: [],
    };

    const competitionMatchingResult = {
      match: null,
      unmatchedName: null,
    };

    const matchMatchingResult = {
      match: null,
      ambiguous: false,
    };

    matchClubs.mockResolvedValue(clubMatchingResult);
    matchCompetition.mockResolvedValue(competitionMatchingResult);
    matchMatch.mockResolvedValue(matchMatchingResult);

    applyReviewWorkflow.mockResolvedValue({
      status: 'MATCHED',
      reviewRequired: false,
    });

    await processor.process(createJob());

    expect(autoPublish).toHaveBeenCalledTimes(5);
    expect(autoPublish).toHaveBeenNthCalledWith(
      1,
      provider,
      'import-fake-001',
      expect.objectContaining({
        title: 'Normalized title',
      }),
      clubMatchingResult,
      competitionMatchingResult,
      matchMatchingResult,
    );
  });

  it('does not auto publish records requiring manual review', async () => {
    applyReviewWorkflow.mockResolvedValue({
      status: 'REVIEW_REQUIRED',
      reviewRequired: true,
    });

    await processor.process(createJob());

    expect(autoPublish).not.toHaveBeenCalled();
  });

  it('skips club matching when duplicate detection finds a duplicate', async () => {
    detectDuplicate.mockResolvedValueOnce({
      duplicate: true,
      duplicateOfRecordId: 'existing-record-id',
      method: 'PROVIDER_ID',
    });

    await processor.process(createJob());

    expect(detectDuplicate).toHaveBeenCalledTimes(5);
    expect(matchClubs).toHaveBeenCalledTimes(4);
    expect(matchCompetition).toHaveBeenCalledTimes(4);
    expect(matchMatch).toHaveBeenCalledTimes(4);
    expect(scoreConfidence).toHaveBeenCalledTimes(4);
    expect(applyReviewWorkflow).toHaveBeenCalledTimes(4);

    expect(matchClubs).not.toHaveBeenCalledWith('import-fake-001', expect.anything());
    expect(matchCompetition).not.toHaveBeenCalledWith('import-fake-001', expect.anything());
    expect(matchMatch).not.toHaveBeenCalledWith(
      'import-fake-001',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );

    expect(completeNewsImport).toHaveBeenCalledTimes(1);
    expect(failNewsImport).not.toHaveBeenCalled();
  });

  it('continues the import when an individual record fails validation', async () => {
    validateRecord.mockResolvedValueOnce({
      valid: false,
      code: 'NEWS_VALIDATION_FAILED',
      errors: ['title: Invalid input'],
    });

    await expect(processor.process(createJob())).resolves.toBeUndefined();

    expect(normalizeRecord).toHaveBeenCalledTimes(5);
    expect(validateRecord).toHaveBeenCalledTimes(5);
    expect(detectDuplicate).toHaveBeenCalledTimes(4);
    expect(matchClubs).toHaveBeenCalledTimes(4);
    expect(matchCompetition).toHaveBeenCalledTimes(4);
    expect(matchMatch).toHaveBeenCalledTimes(4);
    expect(completeNewsImport).toHaveBeenCalledTimes(1);
    expect(failNewsImport).not.toHaveBeenCalled();
  });

  it('rejects an unknown provider without creating an import job', async () => {
    await expect(
      processor.process(
        createJob({
          providerKey: 'unknown',
        }),
      ),
    ).rejects.toThrow('Unknown news provider: unknown');

    expect(startNewsImport).not.toHaveBeenCalled();
    expect(storeRecord).not.toHaveBeenCalled();
    expect(failNewsImport).not.toHaveBeenCalled();
  });

  it('rejects an unsupported job name without creating an import job', async () => {
    await expect(processor.process(createJob(undefined, 'unknown-job'))).rejects.toThrow(
      'Unsupported news import job: unknown-job',
    );

    expect(startNewsImport).not.toHaveBeenCalled();
    expect(storeRecord).not.toHaveBeenCalled();
    expect(failNewsImport).not.toHaveBeenCalled();
  });

  it('marks the durable import job failed and propagates provider failures', async () => {
    jest.spyOn(provider, 'fetch').mockRejectedValueOnce(new Error('Provider unavailable'));

    await expect(processor.process(createJob())).rejects.toThrow('Provider unavailable');

    expect(startNewsImport).toHaveBeenCalledTimes(1);
    expect(failNewsImport).toHaveBeenCalledTimes(1);
    expect(failNewsImport).toHaveBeenCalledWith(importSession, expect.any(Error));
    expect(completeNewsImport).not.toHaveBeenCalled();
  });

  it('propagates raw payload persistence failures', async () => {
    storeRecord.mockRejectedValueOnce(new Error('Raw payload write failed'));

    await expect(processor.process(createJob())).rejects.toThrow('Raw payload write failed');

    expect(failNewsImport).toHaveBeenCalledWith(importSession, expect.any(Error));
    expect(completeNewsImport).not.toHaveBeenCalled();
  });

  it('forwards failed jobs to the dead letter service', async () => {
    const job = createJob();
    const error = new Error('Provider failure');

    await processor.onFailed(job, error);

    expect(moveToDeadLetter).toHaveBeenCalledTimes(1);
    expect(moveToDeadLetter).toHaveBeenCalledWith(job, error);
  });

  it('ignores failed events without a job', async () => {
    await processor.onFailed(undefined, new Error('Missing job'));

    expect(moveToDeadLetter).not.toHaveBeenCalled();
  });
});
