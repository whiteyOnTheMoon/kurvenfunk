export type NewsProviderKey = string;

export type NewsProviderCapabilities = {
  supportsCursorPagination: boolean;
  supportsTimeWindow: boolean;
};

export type NewsProviderFetchInput = {
  cursor?: string;
  windowStart?: string;
  windowEnd?: string;
};

export type NewsProviderRecord = {
  externalId?: string;
  externalUrl?: string;
  payload: unknown;
};

export type NewsProviderFetchResult = {
  records: NewsProviderRecord[];
  nextCursor?: string;
};

export interface NewsProvider {
  readonly key: NewsProviderKey;
  readonly name: string;
  readonly capabilities: NewsProviderCapabilities;

  fetch(input: NewsProviderFetchInput): Promise<NewsProviderFetchResult>;
}
