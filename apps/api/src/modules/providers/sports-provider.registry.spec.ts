import type {
  SportsProvider,
  SportsProviderFetchInput,
  SportsProviderMatch,
} from '@kurvenfunk/types';
import { Test } from '@nestjs/testing';

import { ProvidersModule } from './providers.module';
import { SportsProviderRegistry } from './sports-provider.registry';

const request: SportsProviderFetchInput = {
  resource: 'fixtures',
  competitionExternalId: 'at-1',
  seasonExternalId: '2026-27',
  windowStart: '2026-08-01T00:00:00Z',
  windowEnd: '2027-05-31T23:59:59Z',
};

const fixture: SportsProviderMatch = {
  kind: 'match',
  externalId: 'match-42',
  homeClubExternalId: 'club-1',
  awayClubExternalId: 'club-2',
  kickoff: '2026-11-08T16:30:00Z',
  status: 'SCHEDULED',
  homeScore: null,
  awayScore: null,
  matchday: 12,
};

function provider(fetch = jest.fn().mockResolvedValue({ records: [fixture] })): SportsProvider {
  return {
    key: 'test-provider',
    name: 'Test Provider',
    capabilities: { clubs: true, fixtures: true, results: true, live: false },
    fetch,
  };
}

describe('SportsProviderRegistry (Phase 21.199)', () => {
  let registry: SportsProviderRegistry;

  beforeEach(() => {
    registry = new SportsProviderRegistry();
  });

  it('is exported by ProvidersModule for future adapters/import consumers', async () => {
    const module = await Test.createTestingModule({ imports: [ProvidersModule] }).compile();
    expect(module.get(SportsProviderRegistry)).toBeInstanceOf(SportsProviderRegistry);
    await module.close();
  });

  it('registers one adapter and exposes only safe descriptive metadata', () => {
    registry.register(provider());
    const listed = registry.list();
    expect(listed).toEqual([
      {
        key: 'test-provider',
        name: 'Test Provider',
        capabilities: { clubs: true, fixtures: true, results: true, live: false },
      },
    ]);
    (listed[0].capabilities as { live: boolean }).live = true;
    expect(registry.list()[0].capabilities.live).toBe(false);
  });

  it('prevents duplicate keys and invalid adapter registrations', () => {
    registry.register(provider());
    expect(() => registry.register(provider())).toThrow('SPORTS_PROVIDER_DUPLICATE_KEY');
    expect(() => registry.register({ ...provider(), key: 'Invalid Key' })).toThrow(
      'SPORTS_PROVIDER_INVALID_REGISTRATION',
    );
    expect(() =>
      registry.register({
        ...provider(),
        capabilities: { clubs: true } as SportsProvider['capabilities'],
      }),
    ).toThrow('SPORTS_PROVIDER_INVALID_REGISTRATION');
  });

  it('delivers normalized provider-scoped fixture IDs without raw vendor properties', async () => {
    const fetch = jest.fn().mockResolvedValue({
      records: [{ ...fixture, apiToken: 'should-never-leak' }],
      nextCursor: 'opaque-next',
    });
    registry.register(provider(fetch));
    const response = await registry.fetch('test-provider', request);
    expect(response).toEqual({ records: [fixture], nextCursor: 'opaque-next' });
    expect(fetch).toHaveBeenCalledWith(request);
    expect(fetch).toHaveBeenCalledTimes(1);
    // The interface does not match external IDs to local UUIDs or write to DB.
    expect(response.records[0].externalId).toBe('match-42');
  });

  it('normalizes club pages separately from match pages', async () => {
    registry.register(
      provider(
        jest.fn().mockResolvedValue({
          records: [
            {
              kind: 'club',
              externalId: 'rapid-vienna',
              name: 'SK Rapid Wien',
              shortName: 'Rapid',
              rawInternalStuff: 'discarded',
            },
          ],
        }),
      ),
    );
    await expect(
      registry.fetch('test-provider', { ...request, resource: 'clubs' }),
    ).resolves.toEqual({
      records: [
        {
          kind: 'club',
          externalId: 'rapid-vienna',
          name: 'SK Rapid Wien',
          shortName: 'Rapid',
        },
      ],
    });
  });

  it('fails closed for missing providers and unsupported resource capability', async () => {
    const fetch = jest.fn();
    registry.register(provider(fetch));
    await expect(registry.fetch('missing', request)).rejects.toThrow('SPORTS_PROVIDER_NOT_FOUND');
    await expect(registry.fetch('test-provider', { ...request, resource: 'live' })).rejects.toThrow(
      'SPORTS_PROVIDER_UNSUPPORTED_RESOURCE',
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [{ ...request, competitionExternalId: ' ' }, 'SPORTS_PROVIDER_INVALID_RESPONSE'],
    [{ ...request, cursor: ' ' }, 'SPORTS_PROVIDER_INVALID_RESPONSE'],
    [{ ...request, windowStart: '2026-02-31T00:00:00Z' }, 'SPORTS_PROVIDER_INVALID_TIMESTAMP'],
    [{ ...request, windowEnd: '2020-01-01T00:00:00Z' }, 'SPORTS_PROVIDER_INVALID_WINDOW'],
  ])('rejects invalid input before fetching', async (input, error) => {
    const fetch = jest.fn();
    registry.register(provider(fetch));
    await expect(registry.fetch('test-provider', input)).rejects.toThrow(error);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [{ ...fixture, kind: 'club' }, 'SPORTS_PROVIDER_INVALID_RECORD_KIND'],
    [{ ...fixture, homeClubExternalId: 'club-2' }, 'SPORTS_PROVIDER_IDENTICAL_OPPONENTS'],
    [{ ...fixture, status: 'UNKNOWN' }, 'SPORTS_PROVIDER_INVALID_STATUS'],
    [{ ...fixture, kickoff: 'not-a-date' }, 'SPORTS_PROVIDER_INVALID_TIMESTAMP'],
    [{ ...fixture, homeScore: 3 }, 'SPORTS_PROVIDER_INCOMPLETE_SCORE'],
    [{ ...fixture, homeScore: -1, awayScore: 0 }, 'SPORTS_PROVIDER_INVALID_SCORE'],
    [{ ...fixture, homeScore: 3, awayScore: 2 }, 'SPORTS_PROVIDER_UNEXPECTED_SCORE'],
    [{ ...fixture, status: 'FINISHED' }, 'SPORTS_PROVIDER_MISSING_FINAL_SCORE'],
    [{ ...fixture, matchday: -1 }, 'SPORTS_PROVIDER_INVALID_MATCHDAY'],
  ])('rejects malformed match data from third-party adapters', async (record, error) => {
    registry.register(provider(jest.fn().mockResolvedValue({ records: [record] })));
    await expect(registry.fetch('test-provider', request)).rejects.toThrow(error);
  });

  it('accepts complete results and live scores without persisting anything', async () => {
    const completed = { ...fixture, status: 'FINISHED', homeScore: 2, awayScore: 1 };
    registry.register(provider(jest.fn().mockResolvedValue({ records: [completed] })));
    await expect(
      registry.fetch('test-provider', { ...request, resource: 'results' }),
    ).resolves.toEqual({
      records: [completed],
    });
  });

  it('rejects oversized, duplicate and unsafe paginated provider replies', async () => {
    const fetch = jest.fn().mockResolvedValue({ records: [fixture, fixture] });
    registry.register(provider(fetch));
    await expect(registry.fetch('test-provider', request)).rejects.toThrow(
      'SPORTS_PROVIDER_DUPLICATE_EXTERNAL_ID',
    );

    fetch.mockResolvedValue({ records: new Array(501).fill(fixture) });
    await expect(registry.fetch('test-provider', request)).rejects.toThrow(
      'SPORTS_PROVIDER_INVALID_PAGE',
    );

    fetch.mockResolvedValue({ records: [fixture], nextCursor: 'stale-cursor' });
    await expect(
      registry.fetch('test-provider', { ...request, cursor: 'stale-cursor' }),
    ).rejects.toThrow('SPORTS_PROVIDER_INVALID_CURSOR');

    fetch.mockResolvedValue({ records: [{ ...fixture, kind: 'club' }] });
    await expect(registry.fetch('test-provider', request)).rejects.toThrow(
      'SPORTS_PROVIDER_INVALID_RECORD_KIND',
    );
  });
});
