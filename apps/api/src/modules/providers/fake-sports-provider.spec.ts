import type { SportsProviderFetchInput, SportsProviderRecord } from '@kurvenfunk/types';
import { Test } from '@nestjs/testing';

import { FAKE_SPORTS_SCOPE, FakeSportsProvider } from './fake-sports-provider';
import { ProvidersModule } from './providers.module';
import { SportsProviderRegistry } from './sports-provider.registry';

const baseInput: SportsProviderFetchInput = {
  ...FAKE_SPORTS_SCOPE,
  resource: 'fixtures',
};

async function allPages(
  registry: SportsProviderRegistry,
  input: SportsProviderFetchInput,
): Promise<SportsProviderRecord[]> {
  const records: SportsProviderRecord[] = [];
  let cursor: string | undefined;
  do {
    const result = await registry.fetch('fake-sports', { ...input, ...(cursor ? { cursor } : {}) });
    records.push(...result.records);
    cursor = result.nextCursor;
  } while (cursor);
  return records;
}

describe('FakeSportsProvider – Phase 21.200', () => {
  const registry = new SportsProviderRegistry();
  const fake = new FakeSportsProvider();

  beforeAll(() => registry.register(fake));

  it('uses explicit namespaced synthetic IDs and supports all sport capabilities', () => {
    expect(fake.key).toBe('fake-sports');
    expect(registry.list()).toEqual([
      {
        key: 'fake-sports',
        name: 'Kurvenfunk Synthetic Sports Data',
        capabilities: { clubs: true, fixtures: true, results: true, live: true },
      },
    ]);
    expect(FAKE_SPORTS_SCOPE.competitionExternalId).toMatch(/^fake-/);
    expect(FAKE_SPORTS_SCOPE.seasonExternalId).toMatch(/^fake-/);
  });

  it('paginates synthetic clubs deterministically and isolates result objects', async () => {
    const input = { ...baseInput, resource: 'clubs' as const };
    const first = await registry.fetch(fake.key, input);
    expect(first.records).toHaveLength(2);
    expect(first.nextCursor).toMatch(/^f1:[a-f0-9]{24}:2$/);
    const second = await registry.fetch(fake.key, { ...input, cursor: first.nextCursor });
    expect(second.records).toHaveLength(2);
    expect(second.nextCursor).toBeUndefined();
    const clubs = await allPages(registry, input);
    expect(clubs).toHaveLength(4);
    expect(clubs.every((club) => club.kind === 'club')).toBe(true);
    expect(new Set(clubs.map((club) => club.externalId)).size).toBe(4);
    expect(await registry.fetch(fake.key, input)).toEqual(first);

    (first.records[0] as { name: string }).name = 'corrupted';
    expect((await registry.fetch(fake.key, input)).records[0]).toMatchObject({
      name: 'Testverein Nord',
    });
  });

  it('paginates eight fixtures with six canonical sporting statuses', async () => {
    const fixtures = await allPages(registry, baseInput);
    expect(fixtures).toHaveLength(8);
    expect(new Set(fixtures.map((fixture) => fixture.externalId)).size).toBe(8);
    const statuses = fixtures.map((fixture) => (fixture.kind === 'match' ? fixture.status : 'club'));
    expect(new Set(statuses)).toEqual(
      new Set(['FINISHED', 'LIVE', 'SCHEDULED', 'POSTPONED', 'CANCELLED', 'ABANDONED']),
    );
    expect(fixtures.every((fixture) => fixture.externalId.startsWith('fake-'))).toBe(true);
  });

  it('returns distinct finished results and live games without real API or database writes', async () => {
    const results = await allPages(registry, { ...baseInput, resource: 'results' });
    const live = await allPages(registry, { ...baseInput, resource: 'live' });
    expect(results).toHaveLength(3);
    expect(live).toHaveLength(1);
    expect(results.every((r) => r.kind === 'match' && r.status === 'FINISHED')).toBe(true);
    expect(live).toEqual([
      expect.objectContaining({
        kind: 'match',
        status: 'LIVE',
        homeScore: 1,
        awayScore: 0,
      }),
    ]);
  });

  it('filters the kickoff window inclusively, preserving order on each query', async () => {
    const input: SportsProviderFetchInput = {
      ...baseInput,
      windowStart: '2026-08-02T15:00:00Z',
      windowEnd: '2026-08-09T15:00:00Z',
    };
    const fixtures = await allPages(registry, input);
    expect(fixtures.map((fixture) => fixture.externalId)).toEqual([
      'fake-match-002',
      'fake-match-003',
      'fake-match-004',
    ]);
    expect(await allPages(registry, { ...input, resource: 'results' })).toHaveLength(2);
    expect(await allPages(registry, { ...input, resource: 'live' })).toHaveLength(1);
    expect(await allPages(registry, { ...input, resource: 'clubs' })).toHaveLength(4);
  });

  it('rejects malformed, out-of-range and cross-resource / cross-window cursor reuse', async () => {
    const first = await registry.fetch(fake.key, baseInput);
    const cursor = first.nextCursor;
    expect(cursor).toBeDefined();
    await expect(
      registry.fetch(fake.key, { ...baseInput, cursor: 'untrusted' }),
    ).rejects.toThrow('FAKE_SPORTS_INVALID_CURSOR');
    await expect(
      registry.fetch(fake.key, { ...baseInput, cursor: cursor?.replace(/:2$/, ':999999') }),
    ).rejects.toThrow('FAKE_SPORTS_INVALID_CURSOR');
    await expect(
      registry.fetch(fake.key, { ...baseInput, resource: 'results', cursor }),
    ).rejects.toThrow('FAKE_SPORTS_INVALID_CURSOR');
    await expect(
      registry.fetch(fake.key, { ...baseInput, windowStart: '2026-08-01T00:00:00Z', cursor }),
    ).rejects.toThrow('FAKE_SPORTS_INVALID_CURSOR');
    await expect(
      registry.fetch(fake.key, { ...baseInput, cursor: cursor?.replace(/:2$/, ':3') }),
    ).rejects.toThrow('FAKE_SPORTS_INVALID_CURSOR');
  });

  it('rejects wrong scope and invalid window instead of providing real or mixed data', async () => {
    await expect(
      registry.fetch(fake.key, { ...baseInput, seasonExternalId: 'real-2026-27' }),
    ).rejects.toThrow('FAKE_SPORTS_UNKNOWN_SCOPE');
    await expect(
      registry.fetch(fake.key, {
        ...baseInput,
        windowStart: '2026-08-10T00:00:00Z',
        windowEnd: '2026-08-01T00:00:00Z',
      }),
    ).rejects.toThrow('SPORTS_PROVIDER_INVALID_WINDOW');
  });

  it('simulates exactly one transient provider error before succeeding on retry', async () => {
    const faultRegistry = new SportsProviderRegistry();
    faultRegistry.register(new FakeSportsProvider('fail-once'));
    await expect(faultRegistry.fetch('fake-sports', baseInput)).rejects.toThrow(
      'FAKE_SPORTS_TRANSIENT_FAILURE',
    );
    const firstSuccess = await faultRegistry.fetch('fake-sports', baseInput);
    expect(firstSuccess.records).toHaveLength(2);
    await expect(faultRegistry.fetch('fake-sports', baseInput)).resolves.toEqual(firstSuccess);
  });
});

describe('FakeSportsProvider application registration', () => {
  const oldFlag = process.env.SPORTS_FAKE_PROVIDER_ENABLED;
  const oldNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (oldFlag === undefined) delete process.env.SPORTS_FAKE_PROVIDER_ENABLED;
    else process.env.SPORTS_FAKE_PROVIDER_ENABLED = oldFlag;
    if (oldNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = oldNodeEnv;
  });

  it('keeps fake provider unavailable by default', async () => {
    delete process.env.SPORTS_FAKE_PROVIDER_ENABLED;
    process.env.NODE_ENV = 'development';
    const module = await Test.createTestingModule({ imports: [ProvidersModule] }).compile();
    const registry = module.get(SportsProviderRegistry);
    expect(registry.list()).toEqual([]);
    await expect(registry.fetch('fake-sports', baseInput)).rejects.toThrow(
      'SPORTS_PROVIDER_NOT_FOUND',
    );
    await module.close();
  });

  it('supports deliberate DEV/test opt-in with real Nest injection', async () => {
    process.env.SPORTS_FAKE_PROVIDER_ENABLED = 'true';
    process.env.NODE_ENV = 'development';
    const module = await Test.createTestingModule({ imports: [ProvidersModule] }).compile();
    const registry = module.get(SportsProviderRegistry);
    expect(registry.list().map((entry) => entry.key)).toEqual(['fake-sports']);
    expect((await registry.fetch('fake-sports', baseInput)).records).toHaveLength(2);
    await module.close();
  });

  it('fails closed in production even when accidentally opted in', async () => {
    process.env.SPORTS_FAKE_PROVIDER_ENABLED = 'true';
    process.env.NODE_ENV = 'production';
    await expect(Test.createTestingModule({ imports: [ProvidersModule] }).compile()).rejects.toThrow(
      'FAKE_SPORTS_FORBIDDEN_ENVIRONMENT',
    );
  });

  it('never registers in production without an opt-in', async () => {
    process.env.SPORTS_FAKE_PROVIDER_ENABLED = 'false';
    process.env.NODE_ENV = 'production';
    const module = await Test.createTestingModule({ imports: [ProvidersModule] }).compile();
    expect(module.get(SportsProviderRegistry).list()).toEqual([]);
    await module.close();
  });
});
