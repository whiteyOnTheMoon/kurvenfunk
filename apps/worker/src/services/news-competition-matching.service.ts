import type { NormalizedNewsArticle } from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface NewsCompetitionMatch {
  competitionId: string;
  competitionName: string;
  matchedName: string;
  matchedField: 'name' | 'shortName' | 'slug';
}

export interface NewsCompetitionMatchingResult {
  match: NewsCompetitionMatch | null;
  unmatchedName: string | null;
}

@Injectable()
export class NewsCompetitionMatchingService {
  constructor(private readonly databaseService: DatabaseService) {}

  async matchCompetition(
    _importRecordId: string,
    article: NormalizedNewsArticle,
  ): Promise<NewsCompetitionMatchingResult> {
    const name = article.competitionName?.trim();

    if (!name) {
      return {
        match: null,
        unmatchedName: null,
      };
    }

    const competitions = await this.databaseService.client.competition.findMany({
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

    const normalizedName = this.normalizeCompetitionName(name);

    const candidates = competitions.flatMap((competition) => {
      const fields: Array<{
        field: 'name' | 'shortName' | 'slug';
        value: string | null;
      }> = [
        { field: 'name', value: competition.name },
        { field: 'shortName', value: competition.shortName },
        { field: 'slug', value: competition.slug },
      ];

      const matchedField = fields.find(
        ({ value }) => value !== null && this.normalizeCompetitionName(value) === normalizedName,
      )?.field;

      return matchedField === undefined
        ? []
        : [
            {
              competition,
              matchedField,
            },
          ];
    });

    if (candidates.length !== 1) {
      return {
        match: null,
        unmatchedName: name,
      };
    }

    const candidate = candidates[0];

    return {
      match: {
        competitionId: candidate.competition.id,
        competitionName: candidate.competition.name,
        matchedName: name,
        matchedField: candidate.matchedField,
      },
      unmatchedName: null,
    };
  }

  private normalizeCompetitionName(name: string): string {
    return name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('de')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }
}
