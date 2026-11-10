/**
 * Provider-neutral transport contract for football data.
 *
 * External IDs are opaque and scoped to a provider. They MUST NOT be used as
 * Kurvenfunk Competition/Season/Club/Match UUIDs without explicit matching.
 * Adapters own transport, authentication, rate limits and vendor mappings;
 * consumers only see these normalized records.
 */
export const SPORTS_PROVIDER_RESOURCES = ['clubs', 'fixtures', 'results', 'live'] as const;

export type SportsProviderResource = (typeof SPORTS_PROVIDER_RESOURCES)[number];

export type SportsProviderMatchStatus =
  'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED' | 'ABANDONED';

export type SportsProviderCapabilities = Readonly<Record<SportsProviderResource, boolean>>;

export type SportsProviderFetchInput = Readonly<{
  resource: SportsProviderResource;
  competitionExternalId: string;
  seasonExternalId: string;
  /** UTC RFC3339 timestamps, inclusive. */
  windowStart?: string;
  windowEnd?: string;
  /** Opaque pagination token from this same provider and query. */
  cursor?: string;
}>;

export type SportsProviderClub = Readonly<{
  kind: 'club';
  externalId: string;
  name: string;
  shortName?: string;
}>;

export type SportsProviderMatch = Readonly<{
  kind: 'match';
  externalId: string;
  homeClubExternalId: string;
  awayClubExternalId: string;
  /** UTC RFC3339 kickoff timestamp. */
  kickoff: string;
  status: SportsProviderMatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  matchday?: number;
  stageExternalId?: string;
}>;

export type SportsProviderRecord = SportsProviderClub | SportsProviderMatch;

export type SportsProviderFetchResult = Readonly<{
  records: readonly SportsProviderRecord[];
  nextCursor?: string;
}>;

export interface SportsProvider {
  readonly key: string;
  readonly name: string;
  readonly capabilities: SportsProviderCapabilities;

  /**
   * No database writes, Prisma entities or vendor-specific raw API responses.
   * The caller validates data and performs matching in a separate stage.
   */
  fetch(input: SportsProviderFetchInput): Promise<SportsProviderFetchResult>;
}
