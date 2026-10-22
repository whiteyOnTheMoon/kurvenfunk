import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import type { NewsClubMatchingResult } from './news-club-matching.service';
import type { NewsCompetitionMatchingResult } from './news-competition-matching.service';
import type { NewsConfidenceScoreResult } from './news-confidence-score.service';
import type { NewsMatchMatchingResult } from './news-match-matching.service';

export interface NewsReviewWorkflowResult {
  status: 'MATCHED' | 'REVIEW_REQUIRED';
  reviewRequired: boolean;
}

@Injectable()
export class NewsReviewWorkflowService {
  constructor(private readonly databaseService: DatabaseService) {}

  async apply(
    importRecordId: string,
    confidence: NewsConfidenceScoreResult,
    _clubMatching: NewsClubMatchingResult,
    _competitionMatching: NewsCompetitionMatchingResult,
    matchMatching: NewsMatchMatchingResult,
  ): Promise<NewsReviewWorkflowResult> {
    const reviewRequired = !['EXACT', 'HIGH'].includes(confidence.confidence);
    const status = reviewRequired ? 'REVIEW_REQUIRED' : 'MATCHED';

    await this.databaseService.client.importRecord.update({
      where: {
        id: importRecordId,
      },
      data: {
        status,
        canonicalEntityType: matchMatching.match !== null ? 'MATCH' : null,
        canonicalEntityId: matchMatching.match?.matchId ?? null,
        errorCode: reviewRequired ? 'NEWS_REVIEW_REQUIRED' : null,
        errorMessage: reviewRequired
          ? `Manual review required (${confidence.confidence}: ${confidence.reasons.join(', ')})`
          : null,
      },
    });

    return {
      status,
      reviewRequired,
    };
  }
}
