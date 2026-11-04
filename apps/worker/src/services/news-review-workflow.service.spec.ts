jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

import type { DatabaseService } from '../database/database.service';
import type { NewsClubMatchingResult } from './news-club-matching.service';
import type { NewsCompetitionMatchingResult } from './news-competition-matching.service';
import type { NewsConfidenceScoreResult } from './news-confidence-score.service';
import type { NewsMatchMatchingResult } from './news-match-matching.service';
import { NewsReviewWorkflowService } from './news-review-workflow.service';

describe('NewsReviewWorkflowService', () => {
  const updateImportRecord = jest.fn();

  let service: NewsReviewWorkflowService;

  const clubs: NewsClubMatchingResult = {
    matches: [],
    unmatchedNames: [],
  };

  const competition: NewsCompetitionMatchingResult = {
    match: null,
    unmatchedName: null,
  };

  const noMatch: NewsMatchMatchingResult = {
    match: null,
    ambiguous: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const databaseService = {
      client: {
        importRecord: {
          update: updateImportRecord,
        },
      },
    } as unknown as DatabaseService;

    service = new NewsReviewWorkflowService(databaseService);

    updateImportRecord.mockResolvedValue({
      id: 'record-1',
    });
  });

  it.each(['EXACT', 'HIGH'] as const)(
    'marks %s confidence as matched without manual review',
    async (confidence) => {
      const result = await service.apply(
        'record-1',
        {
          confidence,
          reasons: ['safe_match'],
        },
        clubs,
        competition,
        noMatch,
      );

      expect(result).toEqual({
        status: 'MATCHED',
        reviewRequired: false,
      });

      expect(updateImportRecord).toHaveBeenCalledWith({
        where: {
          id: 'record-1',
        },
        data: {
          status: 'MATCHED',
          canonicalEntityType: null,
          canonicalEntityId: null,
          errorCode: null,
          errorMessage: null,
        },
      });
    },
  );

  it.each(['MEDIUM', 'LOW', 'UNKNOWN'] as const)(
    'marks %s confidence as requiring manual review',
    async (confidence) => {
      const score: NewsConfidenceScoreResult = {
        confidence,
        reasons: ['needs_review'],
      };

      const result = await service.apply('record-1', score, clubs, competition, noMatch);

      expect(result).toEqual({
        status: 'REVIEW_REQUIRED',
        reviewRequired: true,
      });

      expect(updateImportRecord).toHaveBeenCalledWith({
        where: {
          id: 'record-1',
        },
        data: {
          status: 'REVIEW_REQUIRED',
          canonicalEntityType: null,
          canonicalEntityId: null,
          errorCode: 'NEWS_REVIEW_REQUIRED',
          errorMessage: `Manual review required (${confidence}: needs_review)`,
        },
      });
    },
  );

  it.each(['EXACT', 'HIGH'] as const)(
    'requires editorial review for untrusted providers even with %s confidence',
    async (confidence) => {
      const result = await service.apply(
        'record-1',
        { confidence, reasons: ['trusted_match'] },
        clubs,
        competition,
        noMatch,
        true,
      );

      expect(result).toEqual({
        status: 'REVIEW_REQUIRED',
        reviewRequired: true,
      });
      expect(updateImportRecord).toHaveBeenCalledWith({
        where: { id: 'record-1' },
        data: {
          status: 'REVIEW_REQUIRED',
          canonicalEntityType: null,
          canonicalEntityId: null,
          errorCode: 'NEWS_REVIEW_REQUIRED',
          errorMessage:
            'Manual review required (provider not trusted for automatic publishing)',
        },
      });
    },
  );

  it('stores a unique matched fixture as the canonical entity', async () => {
    const kickoff = new Date('2026-08-23T15:00:00.000Z');

    const matchMatching: NewsMatchMatchingResult = {
      match: {
        matchId: 'match-id',
        homeClubId: 'rapid-id',
        awayClubId: 'austria-id',
        competitionId: 'bundesliga-id',
        kickoff,
      },
      ambiguous: false,
    };

    await service.apply(
      'record-1',
      {
        confidence: 'EXACT',
        reasons: ['match_exact'],
      },
      clubs,
      competition,
      matchMatching,
    );

    expect(updateImportRecord).toHaveBeenCalledWith({
      where: {
        id: 'record-1',
      },
      data: {
        status: 'MATCHED',
        canonicalEntityType: 'MATCH',
        canonicalEntityId: 'match-id',
        errorCode: null,
        errorMessage: null,
      },
    });
  });
});
