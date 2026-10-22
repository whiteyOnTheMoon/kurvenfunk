import type { NormalizedNewsArticle } from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { NewsClubMatchingResult } from './news-club-matching.service';
import type { NewsCompetitionMatchingResult } from './news-competition-matching.service';

const MATCH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface NewsMatchMatch {
  matchId: string;
  homeClubId: string;
  awayClubId: string;
  competitionId: string;
  kickoff: Date;
}

export interface NewsMatchMatchingResult {
  match: NewsMatchMatch | null;
  ambiguous: boolean;
}

@Injectable()
export class NewsMatchMatchingService {
  constructor(private readonly databaseService: DatabaseService) {}

  async matchMatch(
    _importRecordId: string,
    article: NormalizedNewsArticle,
    clubMatching: NewsClubMatchingResult,
    competitionMatching: NewsCompetitionMatchingResult,
  ): Promise<NewsMatchMatchingResult> {
    if (
      clubMatching.matches.length !== 2 ||
      clubMatching.unmatchedNames.length > 0 ||
      competitionMatching.match === null ||
      competitionMatching.unmatchedName !== null ||
      article.publishedAt === undefined
    ) {
      return {
        match: null,
        ambiguous: false,
      };
    }

    const publishedAt = new Date(article.publishedAt);

    if (Number.isNaN(publishedAt.getTime())) {
      return {
        match: null,
        ambiguous: false,
      };
    }

    const [firstClub, secondClub] = clubMatching.matches;

    if (firstClub === undefined || secondClub === undefined) {
      return {
        match: null,
        ambiguous: false,
      };
    }

    const windowStart = new Date(publishedAt.getTime() - MATCH_WINDOW_MS);
    const windowEnd = new Date(publishedAt.getTime() + MATCH_WINDOW_MS);

    const matches = await this.databaseService.client.match.findMany({
      where: {
        competitionId: competitionMatching.match.competitionId,
        kickoff: {
          gte: windowStart,
          lte: windowEnd,
        },
        OR: [
          {
            homeClubId: firstClub.clubId,
            awayClubId: secondClub.clubId,
          },
          {
            homeClubId: secondClub.clubId,
            awayClubId: firstClub.clubId,
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

    if (matches.length !== 1) {
      return {
        match: null,
        ambiguous: matches.length > 1,
      };
    }

    const match = matches[0];

    if (match === undefined) {
      return {
        match: null,
        ambiguous: false,
      };
    }

    return {
      match: {
        matchId: match.id,
        homeClubId: match.homeClubId,
        awayClubId: match.awayClubId,
        competitionId: match.competitionId,
        kickoff: match.kickoff,
      },
      ambiguous: false,
    };
  }
}
