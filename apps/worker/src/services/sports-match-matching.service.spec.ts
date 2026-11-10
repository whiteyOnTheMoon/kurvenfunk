/* eslint-disable @typescript-eslint/no-unsafe-assignment */
jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
  Prisma: {},
}));

import { createHash } from 'node:crypto';
import type { SportsProviderMatch } from '@kurvenfunk/types';
import type { DatabaseClient } from '@kurvenfunk/database';
import type { DatabaseService } from '../database/database.service';
import type { SportsImportSession } from './sports-import.store';
import { SportsMatchMatchingService } from './sports-match-matching.service';

const session: SportsImportSession = {
  providerId: '11111111-1111-4111-8111-111111111111',
  importJobId: '22222222-2222-4222-8222-222222222222',
  alreadyCompleted: false,
};
const scope = { competitionExternalId: 'external-comp', seasonExternalId: 'external-season' };
const incoming: SportsProviderMatch = {
  kind: 'match',
  externalId: 'external-match-001',
  homeClubExternalId: 'external-home',
  awayClubExternalId: 'external-away',
  kickoff: '2026-08-01T15:00:00Z',
  matchday: 1,
  status: 'FINISHED',
  homeScore: 2,
  awayScore: 1,
};
const homeId = '33333333-3333-4333-8333-333333333333';
const awayId = '44444444-4444-4444-8444-444444444444';
const competitionId = '55555555-5555-4555-8555-555555555555';
const seasonId = '66666666-6666-4666-8666-666666666666';
const matchId = '77777777-7777-4777-8777-777777777777';
const canonical = {
  id: matchId,
  homeClubId: homeId,
  awayClubId: awayId,
  competitionId,
  seasonId,
  kickoff: new Date(incoming.kickoff),
  matchday: incoming.matchday ?? null,
};

describe('SportsMatchMatchingService', () => {
  function setup() {
    const recordFind = jest.fn().mockResolvedValue({
      id: '88888888-8888-4888-8888-888888888888',
      contentHash: createHash('sha256').update(JSON.stringify(incoming)).digest('hex'),
      status: 'REVIEW_REQUIRED',
      canonicalEntityId: null,
      canonicalEntityType: null,
      reviewedAt: null,
    });
    const recordUpdate = jest.fn().mockResolvedValue({});
    const mappings: Record<string, unknown> = {
      'CLUB:external-home': { status: 'MATCHED', clubId: homeId },
      'CLUB:external-away': { status: 'MATCHED', clubId: awayId },
      'COMPETITION:external-comp': { status: 'MATCHED', competitionId },
      'SEASON:external-season': { status: 'MATCHED', seasonId },
      'MATCH:external-match-001': null,
    };
    const mappingFind = jest.fn().mockImplementation((args: {
      where: { providerId_entityType_externalId: { entityType: string; externalId: string } };
    }) => {
      const key = args.where.providerId_entityType_externalId;
      return Promise.resolve(mappings[key.entityType + ':' + key.externalId] ?? null);
    });
    const mappingUpsert = jest.fn().mockResolvedValue({});
    const mappingConflict = jest.fn().mockResolvedValue(null);
    const matchFind = jest.fn().mockResolvedValue(canonical);
    const matchFindMany = jest.fn().mockResolvedValue([canonical]);
    const competitionFind = jest.fn().mockResolvedValue({ id: competitionId });
    const seasonFind = jest.fn().mockResolvedValue({ competitionId });
    const clubCount = jest.fn().mockResolvedValue(2);
    const lock = jest.fn().mockResolvedValue(0);
    const tx = {
      $executeRaw: lock,
      importRecord: { findFirst: recordFind, update: recordUpdate },
      entityMatch: { findUnique: mappingFind, findFirst: mappingConflict, upsert: mappingUpsert },
      match: { findUnique: matchFind, findMany: matchFindMany },
      competition: { findUnique: competitionFind },
      season: { findUnique: seasonFind },
      club: { count: clubCount },
    };
    const transaction = jest.fn((callback: (db: typeof tx) => Promise<unknown>) => callback(tx));
    const database = { $transaction: transaction } as unknown as DatabaseClient;
    return {
      matcher: new SportsMatchMatchingService({ client: database } as DatabaseService),
      mappings,
      recordFind,
      recordUpdate,
      mappingFind,
      mappingUpsert,
      mappingConflict,
      matchFind,
      matchFindMany,
      seasonFind,
      clubCount,
      lock,
      transaction,
    };
  }

  it('links a unique match after verifying provider-scoped season and club bindings', async () => {
    const m = setup();
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'MATCHED',
      matchId,
      method: 'COMPOSITE',
    });
    expect(m.recordFind).toHaveBeenCalledWith({
      where: {
        importJobId: session.importJobId,
        providerId: session.providerId,
        recordType: 'SPORTS_MATCH',
        externalId: incoming.externalId,
      },
      select: expect.any(Object),
    });
    expect(m.mappingFind).toHaveBeenCalledWith({
      where: {
        providerId_entityType_externalId: {
          providerId: session.providerId,
          entityType: 'MATCH',
          externalId: incoming.externalId,
        },
      },
      select: expect.any(Object),
    });
    expect(m.matchFindMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        homeClubId: homeId,
        awayClubId: awayId,
        competitionId,
        seasonId,
        matchday: 1,
      }),
      select: expect.any(Object),
    });
    expect(m.mappingConflict).toHaveBeenCalledWith({
      where: {
        providerId: session.providerId,
        entityType: 'MATCH',
        status: 'MATCHED',
        matchId,
        externalId: { not: incoming.externalId },
      },
      select: { id: true },
    });
    expect(m.mappingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          providerId: session.providerId,
          entityType: 'MATCH',
          status: 'MATCHED',
          matchId,
          method: 'COMPOSITE',
          confidence: 'HIGH',
        }),
      }),
    );
    expect(m.recordUpdate).toHaveBeenCalledWith({
      where: { id: '88888888-8888-4888-8888-888888888888' },
      data: { status: 'MATCHED', canonicalEntityType: 'MATCH', canonicalEntityId: matchId },
    });
    expect(m.lock).toHaveBeenCalledTimes(1);
    expect(m.matchFind).not.toHaveBeenCalled();
  });

  it('stages results and live identity separately without publishing scores', async () => {
    const m = setup();
    for (const resource of ['results', 'live'] as const) {
      await expect(m.matcher.matchStaged(session, resource, incoming, scope)).resolves.toEqual({
        status: 'MATCHED',
        matchId,
        method: 'COMPOSITE',
      });
    }
    expect(m.recordFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ recordType: 'SPORTS_RESULT' }),
      }),
    );
  });

  it('cannot match without explicitly approved competition and season bindings', async () => {
    const m = setup();
    delete m.mappings['SEASON:external-season'];
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'UNRESOLVED_SCOPE',
    });
    expect(m.matchFindMany).not.toHaveBeenCalled();
    expect(m.mappingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          status: 'REVIEW_REQUIRED',
          matchId: null,
        }),
      }),
    );
    expect(m.recordUpdate).not.toHaveBeenCalled();
  });

  it('cannot match when either club lacks an active provider-ID mapping', async () => {
    const m = setup();
    m.mappings['CLUB:external-away'] = { status: 'AMBIGUOUS', clubId: null };
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'UNRESOLVED_CLUB',
    });
    expect(m.matchFindMany).not.toHaveBeenCalled();
  });

  it('holds conflicting scope or inactive target clubs for review', async () => {
    const m = setup();
    m.seasonFind.mockResolvedValue({ competitionId: 'another-competition' });
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'INCONSISTENT_MAPPING',
    });
    expect(m.matchFindMany).not.toHaveBeenCalled();
    m.seasonFind.mockResolvedValue({ competitionId });
    m.clubCount.mockResolvedValue(1);
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'INCONSISTENT_MAPPING',
    });
  });

  it('records ambiguous fixtures without choosing a candidate', async () => {
    const m = setup();
    m.matchFindMany.mockResolvedValue([canonical, { ...canonical, id: 'other-match' }]);
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'AMBIGUOUS',
    });
    expect(m.mappingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: 'AMBIGUOUS', matchId: null }),
      }),
    );
  });

  it('refuses to bind two provider match IDs to one canonical match', async () => {
    const m = setup();
    m.mappingConflict.mockResolvedValue({ id: 'existing-provider-binding' });
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'INCONSISTENT_MAPPING',
    });
    expect(m.mappingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: 'REVIEW_REQUIRED', matchId: null }),
      }),
    );
  });

  it('records missing canonical fixtures for review instead of creating one', async () => {
    const m = setup();
    m.matchFindMany.mockResolvedValue([]);
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'UNMATCHED',
    });
    expect(m.mappingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: 'UNMATCHED', matchId: null }),
      }),
    );
  });

  it('preserves prior manual mapping when the target identity still agrees', async () => {
    const m = setup();
    m.mappings['MATCH:external-match-001'] = {
      status: 'MATCHED',
      matchId,
      method: 'MANUAL',
      reviewedAt: new Date(),
    };
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'MATCHED',
      matchId,
      method: 'MANUAL',
    });
    expect(m.matchFind).toHaveBeenCalledTimes(1);
    expect(m.matchFindMany).not.toHaveBeenCalled();
    expect(m.mappingUpsert).not.toHaveBeenCalled();
  });

  it('does not silently rebind a previously mapped external match after identity drift', async () => {
    const m = setup();
    m.mappings['MATCH:external-match-001'] = {
      status: 'MATCHED',
      matchId,
      method: 'MANUAL',
      reviewedAt: new Date(),
    };
    m.matchFind.mockResolvedValue({ ...canonical, homeClubId: awayId });
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'INCONSISTENT_MAPPING',
    });
    expect(m.mappingUpsert).not.toHaveBeenCalled();
    expect(m.recordUpdate).not.toHaveBeenCalled();
  });

  it('preserves explicit rejection and reviewed import decisions', async () => {
    const m = setup();
    m.mappings['MATCH:external-match-001'] = {
      status: 'REJECTED',
      matchId: null,
      reviewedAt: null,
    };
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'REJECTED',
    });
    expect(m.mappingUpsert).not.toHaveBeenCalled();
    m.recordFind.mockResolvedValue({
      contentHash: createHash('sha256').update(JSON.stringify(incoming)).digest('hex'),
      reviewedAt: new Date(),
      status: 'REVIEW_REQUIRED',
    });
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'MANUAL_REVIEW',
    });
  });

  it('refuses invalid or mismatched staging evidence before linking a match', async () => {
    const m = setup();
    m.recordFind.mockResolvedValue(null);
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).rejects.toThrow(
      'SPORTS_MATCH_STAGING_MISMATCH',
    );
    await expect(
      m.matcher.matchStaged(session, 'fixtures', { ...incoming, externalId: ' ' }, scope),
    ).rejects.toThrow('SPORTS_MATCH_INVALID_RECORD');
    expect(m.mappingUpsert).not.toHaveBeenCalled();
  });

  it('retries idempotently when the import record is already linked', async () => {
    const m = setup();
    m.mappings['MATCH:external-match-001'] = {
      status: 'MATCHED',
      matchId,
      method: 'COMPOSITE',
      reviewedAt: null,
    };
    m.recordFind.mockResolvedValue({
      id: 'record-1',
      contentHash: createHash('sha256').update(JSON.stringify(incoming)).digest('hex'),
      status: 'MATCHED',
      canonicalEntityType: 'MATCH',
      canonicalEntityId: matchId,
      reviewedAt: null,
    });
    await expect(m.matcher.matchStaged(session, 'fixtures', incoming, scope)).resolves.toEqual({
      status: 'MATCHED',
      matchId,
      method: 'EXTERNAL_ID',
    });
    expect(m.mappingUpsert).not.toHaveBeenCalled();
    expect(m.recordUpdate).not.toHaveBeenCalled();
  });
});
