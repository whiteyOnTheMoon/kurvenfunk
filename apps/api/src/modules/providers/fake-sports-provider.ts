import { createHash } from 'node:crypto';
import type {
  SportsProvider,
  SportsProviderCapabilities,
  SportsProviderClub,
  SportsProviderFetchInput,
  SportsProviderFetchResult,
  SportsProviderMatch,
  SportsProviderRecord,
} from '@kurvenfunk/types';

/**
 * All values are synthetic and intentionally do not map to real Kurvenfunk UUIDs.
 * This scope is reserved for tests; never import it into canonical sport tables.
 */
export const FAKE_SPORTS_SCOPE = {
  competitionExternalId: 'fake-austrian-league',
  seasonExternalId: 'fake-2026-27',
} as const;

const PAGE_SIZE = 2;
const CURSOR_PATTERN = /^f1:([a-f0-9]{24}):([0-9]+)$/;

const CLUBS: readonly SportsProviderClub[] = [
  { kind: 'club', externalId: 'fake-club-nord', name: 'Testverein Nord', shortName: 'Nord' },
  { kind: 'club', externalId: 'fake-club-sued', name: 'Testverein Süd', shortName: 'Süd' },
  { kind: 'club', externalId: 'fake-club-west', name: 'Testverein West', shortName: 'West' },
  { kind: 'club', externalId: 'fake-club-ost', name: 'Testverein Ost', shortName: 'Ost' },
];

const MATCHES: readonly SportsProviderMatch[] = [
  {
    kind: 'match',
    externalId: 'fake-match-001',
    homeClubExternalId: 'fake-club-nord',
    awayClubExternalId: 'fake-club-sued',
    kickoff: '2026-08-01T15:00:00Z',
    status: 'FINISHED',
    homeScore: 2,
    awayScore: 1,
    matchday: 1,
    stageExternalId: 'fake-regular',
  },
  {
    kind: 'match',
    externalId: 'fake-match-002',
    homeClubExternalId: 'fake-club-west',
    awayClubExternalId: 'fake-club-ost',
    kickoff: '2026-08-02T15:00:00Z',
    status: 'FINISHED',
    homeScore: 0,
    awayScore: 0,
    matchday: 1,
    stageExternalId: 'fake-regular',
  },
  {
    kind: 'match',
    externalId: 'fake-match-003',
    homeClubExternalId: 'fake-club-sued',
    awayClubExternalId: 'fake-club-west',
    kickoff: '2026-08-08T15:00:00Z',
    status: 'FINISHED',
    homeScore: 1,
    awayScore: 3,
    matchday: 2,
    stageExternalId: 'fake-regular',
  },
  {
    kind: 'match',
    externalId: 'fake-match-004',
    homeClubExternalId: 'fake-club-ost',
    awayClubExternalId: 'fake-club-nord',
    kickoff: '2026-08-09T15:00:00Z',
    status: 'LIVE',
    homeScore: 1,
    awayScore: 0,
    matchday: 2,
    stageExternalId: 'fake-regular',
  },
  {
    kind: 'match',
    externalId: 'fake-match-005',
    homeClubExternalId: 'fake-club-west',
    awayClubExternalId: 'fake-club-nord',
    kickoff: '2026-08-15T15:00:00Z',
    status: 'SCHEDULED',
    homeScore: null,
    awayScore: null,
    matchday: 3,
    stageExternalId: 'fake-regular',
  },
  {
    kind: 'match',
    externalId: 'fake-match-006',
    homeClubExternalId: 'fake-club-ost',
    awayClubExternalId: 'fake-club-sued',
    kickoff: '2026-08-16T15:00:00Z',
    status: 'POSTPONED',
    homeScore: null,
    awayScore: null,
    matchday: 3,
    stageExternalId: 'fake-regular',
  },
  {
    kind: 'match',
    externalId: 'fake-match-007',
    homeClubExternalId: 'fake-club-nord',
    awayClubExternalId: 'fake-club-west',
    kickoff: '2026-08-22T15:00:00Z',
    status: 'CANCELLED',
    homeScore: null,
    awayScore: null,
    matchday: 4,
    stageExternalId: 'fake-regular',
  },
  {
    kind: 'match',
    externalId: 'fake-match-008',
    homeClubExternalId: 'fake-club-sued',
    awayClubExternalId: 'fake-club-ost',
    kickoff: '2026-08-23T15:00:00Z',
    status: 'ABANDONED',
    homeScore: null,
    awayScore: null,
    matchday: 4,
    stageExternalId: 'fake-regular',
  },
];

export type FakeSportsScenario = 'normal' | 'fail-once';

/**
 * Offline adapter for Phase 21.200. Identical queries produce identical pages
 * without network access, clocks, randomness, secrets, databases or queues.
 */
export class FakeSportsProvider implements SportsProvider {
  readonly key = 'fake-sports';
  readonly name = 'Kurvenfunk Synthetic Sports Data';
  readonly capabilities: SportsProviderCapabilities = {
    clubs: true,
    fixtures: true,
    results: true,
    live: true,
  };

  private attemptCount = 0;

  constructor(private readonly scenario: FakeSportsScenario = 'normal') {}

  fetch(input: SportsProviderFetchInput): Promise<SportsProviderFetchResult> {
    return Promise.resolve().then(() => {
      // The fault is intentional and one-shot for deterministic worker retry tests.
      this.attemptCount += 1;
      if (this.scenario === 'fail-once' && this.attemptCount === 1) {
        throw new Error('FAKE_SPORTS_TRANSIENT_FAILURE');
      }
      if (
        input.competitionExternalId !== FAKE_SPORTS_SCOPE.competitionExternalId ||
        input.seasonExternalId !== FAKE_SPORTS_SCOPE.seasonExternalId
      ) {
        throw new Error('FAKE_SPORTS_UNKNOWN_SCOPE');
      }
      const start = input.windowStart === undefined ? -Infinity : Date.parse(input.windowStart);
      const end = input.windowEnd === undefined ? Infinity : Date.parse(input.windowEnd);
      if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
        throw new Error('FAKE_SPORTS_INVALID_WINDOW');
      }

      let records: readonly SportsProviderRecord[];
      switch (input.resource) {
        case 'clubs':
          // A club has no kickoff. Window filters only apply to match records.
          records = CLUBS;
          break;
        case 'fixtures':
          records = MATCHES;
          break;
        case 'results':
          records = MATCHES.filter((match) => match.status === 'FINISHED');
          break;
        case 'live':
          records = MATCHES.filter((match) => match.status === 'LIVE');
          break;
        default:
          throw new Error('FAKE_SPORTS_UNSUPPORTED_RESOURCE');
      }

      if (input.resource !== 'clubs') {
        records = records.filter((record) => {
          if (record.kind !== 'match') return false;
          const kickoff = Date.parse(record.kickoff);
          return kickoff >= start && kickoff <= end;
        });
      }

      const fingerprint = createHash('sha256')
        .update(
          JSON.stringify({
            resource: input.resource,
            competitionExternalId: input.competitionExternalId,
            seasonExternalId: input.seasonExternalId,
            windowStart: input.windowStart ?? null,
            windowEnd: input.windowEnd ?? null,
          }),
        )
        .digest('hex')
        .slice(0, 24);

      let offset = 0;
      if (input.cursor !== undefined) {
        const parts = CURSOR_PATTERN.exec(input.cursor);
        if (!parts || parts[1] !== fingerprint) {
          throw new Error('FAKE_SPORTS_INVALID_CURSOR');
        }
        offset = Number(parts[2]);
        if (!Number.isSafeInteger(offset) || offset % PAGE_SIZE !== 0 || offset > records.length) {
          throw new Error('FAKE_SPORTS_INVALID_CURSOR');
        }
      }

      const page = records.slice(offset, offset + PAGE_SIZE);
      const nextOffset = offset + page.length;

      return {
        // Clone both array and records so callers cannot mutate future pages.
        records: page.map((record) => ({ ...record })),
        ...(nextOffset < records.length
          ? { nextCursor: `f1:${fingerprint}:${nextOffset}` }
          : {}),
      };
    });
  }
}
