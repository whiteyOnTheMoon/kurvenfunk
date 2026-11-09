import type {
  SportsProvider,
  SportsProviderClub,
  SportsProviderFetchInput,
  SportsProviderFetchResult,
  SportsProviderMatch,
  SportsProviderRecord,
  SportsProviderResource,
} from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';

const RESOURCES: readonly SportsProviderResource[] = ['clubs', 'fixtures', 'results', 'live'];
const STATUSES = [
  'SCHEDULED',
  'LIVE',
  'FINISHED',
  'POSTPONED',
  'CANCELLED',
  'ABANDONED',
] as const;
const MAX_PAGE_RECORDS = 500;
const KEY_PATTERN = /^[a-z][a-z0-9-]{1,39}$/;
const UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

function invalid(code: string): never {
  // Never expose raw provider responses or credentials in error messages.
  throw new Error(code);
}

function text(value: unknown, max = 200): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    return invalid('SPORTS_PROVIDER_INVALID_RESPONSE');
  }
  return value;
}

function timestamp(value: unknown): string {
  if (typeof value !== 'string' || !UTC_TIMESTAMP.test(value)) {
    return invalid('SPORTS_PROVIDER_INVALID_TIMESTAMP');
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 19) !== value.slice(0, 19)) {
    return invalid('SPORTS_PROVIDER_INVALID_TIMESTAMP');
  }
  return value;
}

function nonNegativeScore(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    return invalid('SPORTS_PROVIDER_INVALID_SCORE');
  }
  return value;
}

function optionalPositiveInt(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    return invalid('SPORTS_PROVIDER_INVALID_MATCHDAY');
  }
  return value;
}

function normalizedRecord(raw: unknown, resource: SportsProviderResource): SportsProviderRecord {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return invalid('SPORTS_PROVIDER_INVALID_RESPONSE');
  }
  const item = raw as Record<string, unknown>;
  const externalId = text(item.externalId, 160);

  if (resource === 'clubs') {
    if (item.kind !== 'club') return invalid('SPORTS_PROVIDER_INVALID_RECORD_KIND');
    const club: SportsProviderClub = {
      kind: 'club',
      externalId,
      name: text(item.name),
      ...(item.shortName === undefined ? {} : { shortName: text(item.shortName) }),
    };
    return club;
  }

  if (item.kind !== 'match') return invalid('SPORTS_PROVIDER_INVALID_RECORD_KIND');
  if (!STATUSES.some((status) => status === item.status)) {
    return invalid('SPORTS_PROVIDER_INVALID_STATUS');
  }
  const homeClubExternalId = text(item.homeClubExternalId, 160);
  const awayClubExternalId = text(item.awayClubExternalId, 160);
  if (homeClubExternalId === awayClubExternalId) {
    return invalid('SPORTS_PROVIDER_IDENTICAL_OPPONENTS');
  }
  const homeScore = nonNegativeScore(item.homeScore);
  const awayScore = nonNegativeScore(item.awayScore);
  if ((homeScore === null) !== (awayScore === null)) {
    return invalid('SPORTS_PROVIDER_INCOMPLETE_SCORE');
  }
  if (item.status === 'FINISHED' && homeScore === null) {
    return invalid('SPORTS_PROVIDER_MISSING_FINAL_SCORE');
  }
  if (item.status !== 'FINISHED' && item.status !== 'LIVE' && homeScore !== null) {
    return invalid('SPORTS_PROVIDER_UNEXPECTED_SCORE');
  }
  const matchday = optionalPositiveInt(item.matchday);
  const match: SportsProviderMatch = {
    kind: 'match',
    externalId,
    homeClubExternalId,
    awayClubExternalId,
    kickoff: timestamp(item.kickoff),
    status: item.status as SportsProviderMatch['status'],
    homeScore,
    awayScore,
    ...(matchday === undefined ? {} : { matchday }),
    ...(item.stageExternalId === undefined
      ? {}
      : { stageExternalId: text(item.stageExternalId, 160) }),
  };
  return match;
}

/**
 * Explicit registry and input/output firewall for external sports adapters.
 *
 * An adapter is registered by trusted application composition, never by an
 * HTTP request. Registry outputs carry provider-scoped external IDs only.
 * No import, matching, persistence, queue or automatic standings mutation.
 */
@Injectable()
export class SportsProviderRegistry {
  private readonly providers = new Map<string, SportsProvider>();

  register(provider: SportsProvider): void {
    if (!KEY_PATTERN.test(provider.key) || !provider.name?.trim()) {
      return invalid('SPORTS_PROVIDER_INVALID_REGISTRATION');
    }
    if (
      !provider.capabilities ||
      RESOURCES.some((resource) => typeof provider.capabilities[resource] !== 'boolean') ||
      typeof provider.fetch !== 'function'
    ) {
      return invalid('SPORTS_PROVIDER_INVALID_REGISTRATION');
    }
    if (this.providers.has(provider.key)) return invalid('SPORTS_PROVIDER_DUPLICATE_KEY');
    this.providers.set(provider.key, provider);
  }

  list(): ReadonlyArray<{
    key: string;
    name: string;
    capabilities: SportsProvider['capabilities'];
  }> {
    return [...this.providers.values()].map((provider) => ({
      key: provider.key,
      name: provider.name,
      capabilities: { ...provider.capabilities },
    }));
  }

  async fetch(key: string, input: SportsProviderFetchInput): Promise<SportsProviderFetchResult> {
    const provider = this.providers.get(key);
    if (!provider) return invalid('SPORTS_PROVIDER_NOT_FOUND');
    if (!RESOURCES.includes(input.resource)) return invalid('SPORTS_PROVIDER_INVALID_RESOURCE');
    text(input.competitionExternalId, 160);
    text(input.seasonExternalId, 160);
    if (input.cursor !== undefined) text(input.cursor, 512);
    const start = input.windowStart === undefined ? undefined : timestamp(input.windowStart);
    const end = input.windowEnd === undefined ? undefined : timestamp(input.windowEnd);
    if (start && end && Date.parse(start) > Date.parse(end)) {
      return invalid('SPORTS_PROVIDER_INVALID_WINDOW');
    }
    if (!provider.capabilities[input.resource]) return invalid('SPORTS_PROVIDER_UNSUPPORTED_RESOURCE');

    // Copy inputs so adapters cannot mutate the caller's query.
    const response = await provider.fetch({ ...input });
    if (
      !response ||
      !Array.isArray(response.records) ||
      response.records.length > MAX_PAGE_RECORDS
    ) {
      return invalid('SPORTS_PROVIDER_INVALID_PAGE');
    }
    if (
      response.nextCursor !== undefined &&
      (typeof response.nextCursor !== 'string' ||
        !response.nextCursor.trim() ||
        response.nextCursor.length > 512 ||
        response.nextCursor === input.cursor)
    ) {
      return invalid('SPORTS_PROVIDER_INVALID_CURSOR');
    }

    const seen = new Set<string>();
    const records = response.records.map((record) => {
      const normalized = normalizedRecord(record, input.resource);
      if (seen.has(normalized.externalId)) return invalid('SPORTS_PROVIDER_DUPLICATE_EXTERNAL_ID');
      seen.add(normalized.externalId);
      return normalized;
    });
    return {
      records,
      ...(response.nextCursor === undefined ? {} : { nextCursor: response.nextCursor }),
    };
  }
}
