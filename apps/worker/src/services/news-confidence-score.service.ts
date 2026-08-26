import { Injectable } from '@nestjs/common';
import type { NewsClubMatchingResult } from './news-club-matching.service';
import type { NewsCompetitionMatchingResult } from './news-competition-matching.service';
import type { NewsMatchMatchingResult } from './news-match-matching.service';

export type NewsMatchConfidence = 'EXACT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface NewsConfidenceScoreResult {
  confidence: NewsMatchConfidence;
  reasons: string[];
}

@Injectable()
export class NewsConfidenceScoreService {
  score(
    clubMatching: NewsClubMatchingResult,
    competitionMatching: NewsCompetitionMatchingResult,
    matchMatching: NewsMatchMatchingResult,
  ): NewsConfidenceScoreResult {
    if (matchMatching.match !== null && !matchMatching.ambiguous) {
      return {
        confidence: 'EXACT',
        reasons: ['match_exact'],
      };
    }

    if (matchMatching.ambiguous) {
      return {
        confidence: 'LOW',
        reasons: ['match_ambiguous'],
      };
    }

    const hasClubMatches = clubMatching.matches.length > 0;
    const clubsComplete = hasClubMatches && clubMatching.unmatchedNames.length === 0;

    const competitionMatched =
      competitionMatching.match !== null && competitionMatching.unmatchedName === null;

    const competitionMissing =
      competitionMatching.match === null && competitionMatching.unmatchedName === null;

    if (clubsComplete && competitionMatched) {
      return {
        confidence: 'HIGH',
        reasons: ['clubs_exact', 'competition_exact'],
      };
    }

    if (clubsComplete && competitionMissing) {
      return {
        confidence: 'MEDIUM',
        reasons: ['clubs_exact', 'competition_missing'],
      };
    }

    if (hasClubMatches || competitionMatched) {
      return {
        confidence: 'LOW',
        reasons: [
          ...(hasClubMatches ? ['clubs_partial'] : []),
          ...(competitionMatched ? ['competition_exact'] : []),
          ...(clubMatching.unmatchedNames.length > 0 ? ['clubs_unmatched'] : []),
          ...(competitionMatching.unmatchedName !== null ? ['competition_unmatched'] : []),
        ],
      };
    }

    return {
      confidence: 'UNKNOWN',
      reasons: [
        ...(clubMatching.unmatchedNames.length > 0 ? ['clubs_unmatched'] : []),
        ...(competitionMatching.unmatchedName !== null ? ['competition_unmatched'] : []),
        'no_match_evidence',
      ],
    };
  }
}
