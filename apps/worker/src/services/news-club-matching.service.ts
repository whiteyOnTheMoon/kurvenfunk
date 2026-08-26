import type { NormalizedNewsArticle } from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface NewsClubMatch {
  clubId: string;
  clubName: string;
  matchedName: string;
  matchedAlias: string;
}

export interface NewsClubMatchingResult {
  matches: NewsClubMatch[];
  unmatchedNames: string[];
}

@Injectable()
export class NewsClubMatchingService {
  constructor(private readonly databaseService: DatabaseService) {}

  async matchClubs(
    _importRecordId: string,
    article: NormalizedNewsArticle,
  ): Promise<NewsClubMatchingResult> {
    const names = [...new Set(article.clubNames.map((name) => name.trim()).filter(Boolean))];

    if (names.length === 0) {
      return {
        matches: [],
        unmatchedNames: [],
      };
    }

    const aliases = await this.databaseService.client.clubAlias.findMany({
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

    const aliasesByNormalizedName = new Map<
      string,
      Array<{
        alias: string;
        club: {
          id: string;
          name: string;
        };
      }>
    >();

    for (const alias of aliases) {
      const entries = aliasesByNormalizedName.get(alias.normalizedAlias) ?? [];

      entries.push({
        alias: alias.alias,
        club: alias.club,
      });

      aliasesByNormalizedName.set(alias.normalizedAlias, entries);
    }

    const matches: NewsClubMatch[] = [];
    const unmatchedNames: string[] = [];
    const matchedClubIds = new Set<string>();

    for (const name of names) {
      const normalizedName = this.normalizeClubName(name);
      const candidates = aliasesByNormalizedName.get(normalizedName) ?? [];

      if (candidates.length !== 1) {
        unmatchedNames.push(name);
        continue;
      }

      const candidate = candidates[0];

      if (matchedClubIds.has(candidate.club.id)) {
        continue;
      }

      matchedClubIds.add(candidate.club.id);

      matches.push({
        clubId: candidate.club.id,
        clubName: candidate.club.name,
        matchedName: name,
        matchedAlias: candidate.alias,
      });
    }

    return {
      matches,
      unmatchedNames,
    };
  }

  private normalizeClubName(name: string): string {
    return name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('de')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }
}
