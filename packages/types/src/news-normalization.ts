export type NormalizedNewsArticle = {
  externalId?: string;
  originalUrl?: string;

  title?: string;
  lead?: string;
  body?: string;

  publishedAt?: string;
  authorName?: string;

  clubNames: string[];
  competitionName?: string;
};

export interface NewsRecordNormalizer {
  normalizeNewsRecord(
    record: import('./news-provider.js').NewsProviderRecord,
  ): NormalizedNewsArticle;
}
