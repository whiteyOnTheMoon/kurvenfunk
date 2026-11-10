/* eslint-disable @typescript-eslint/no-unsafe-assignment */
jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
  Prisma: {},
}));

import type { SportsProviderClub } from '@kurvenfunk/types';
import type { DatabaseClient } from '@kurvenfunk/database';
import type { DatabaseService } from '../database/database.service';
import type { SportsImportSession } from './sports-import.store';
import { SportsClubMatchingService } from './sports-club-matching.service';

describe('SportsClubMatchingService', () => {
  const session: SportsImportSession = {
    providerId: '11111111-1111-4111-8111-111111111111',
    importJobId: '22222222-2222-4222-8222-222222222222',
    alreadyCompleted: false,
  };
  const record: SportsProviderClub = {
    kind: 'club',
    externalId: 'external-sports-rapid',
    name: 'Rapid Wien',
  };
  const rapid = {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Sportklub Rapid Wien',
    aliases: [{ normalizedAlias: 'rapid wien' }],
  };
  const austria = {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'FK Austria Wien',
    aliases: [{ normalizedAlias: 'austria wien' }],
  };

  function setup() {
    const findImportRecord = jest.fn().mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
      status: 'REVIEW_REQUIRED',
      canonicalEntityId: null,
      reviewedAt: null,
    });
    const updateImportRecord = jest.fn().mockResolvedValue({});
    const findMapping = jest.fn().mockResolvedValue(null);
    const upsertMapping = jest.fn().mockResolvedValue({});
    const findClubs = jest.fn().mockResolvedValue([rapid, austria]);
    const findClub = jest.fn().mockResolvedValue({ active: true });
    const executeRaw = jest.fn().mockResolvedValue(0);
    const tx = {
      $executeRaw: executeRaw,
      importRecord: { findFirst: findImportRecord, update: updateImportRecord },
      entityMatch: { findUnique: findMapping, upsert: upsertMapping },
      club: { findMany: findClubs, findUnique: findClub },
    };
    const transaction = jest.fn((callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    );
    const db = { $transaction: transaction } as unknown as DatabaseClient;
    const matcher = new SportsClubMatchingService({ client: db } as DatabaseService);
    return {
      matcher,
      findImportRecord,
      updateImportRecord,
      findMapping,
      upsertMapping,
      findClubs,
      findClub,
      executeRaw,
      transaction,
    };
  }

  it('matches a unique active alias and persists an auditable provider-scoped mapping', async () => {
    const mocks = setup();
    await expect(mocks.matcher.matchStaged(session, record)).resolves.toEqual({
      status: 'MATCHED',
      clubId: rapid.id,
      method: 'ALIAS',
    });

    expect(mocks.findImportRecord).toHaveBeenCalledWith({
      where: {
        importJobId: session.importJobId,
        providerId: session.providerId,
        recordType: 'SPORTS_CLUB',
        externalId: record.externalId,
      },
      select: expect.any(Object),
    });
    expect(mocks.findMapping).toHaveBeenCalledWith({
      where: {
        providerId_entityType_externalId: {
          providerId: session.providerId,
          entityType: 'CLUB',
          externalId: record.externalId,
        },
      },
      select: expect.any(Object),
    });
    expect(mocks.findClubs).toHaveBeenCalledWith({
      where: { active: true },
      select: {
        id: true,
        name: true,
        aliases: { where: { active: true }, select: { normalizedAlias: true } },
      },
    });
    expect(mocks.upsertMapping).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          status: 'MATCHED',
          clubId: rapid.id,
          method: 'ALIAS',
          confidence: 'HIGH',
          entityType: 'CLUB',
        }),
      }),
    );
    expect(mocks.updateImportRecord).toHaveBeenCalledWith({
      where: { id: '55555555-5555-4555-8555-555555555555' },
      data: {
        status: 'MATCHED',
        canonicalEntityType: 'CLUB',
        canonicalEntityId: rapid.id,
      },
    });
    // Neither canonical Club nor ClubAlias is ever mutated.
    expect(mocks.findClub).not.toHaveBeenCalled();
    expect(mocks.executeRaw).toHaveBeenCalledTimes(1);
  });

  it('records unique official-name matches separately from alias matches', async () => {
    const mocks = setup();
    const input = { ...record, name: '  SPORTKLUB Rapid Wien ' };
    await expect(mocks.matcher.matchStaged(session, input)).resolves.toEqual({
      status: 'MATCHED',
      clubId: rapid.id,
      method: 'CANONICAL_NAME',
    });
    expect(mocks.upsertMapping).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ method: 'CANONICAL_NAME' }) }),
    );
  });

  it('holds an ambiguous alias for review without creating an unsafe canonical link', async () => {
    const mocks = setup();
    mocks.findClubs.mockResolvedValue([
      rapid,
      {
        ...austria,
        aliases: [{ normalizedAlias: 'rapid wien' }],
      },
    ]);
    await expect(mocks.matcher.matchStaged(session, record)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'AMBIGUOUS',
    });
    expect(mocks.upsertMapping).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          status: 'AMBIGUOUS',
          clubId: null,
          confidence: 'UNKNOWN',
        }),
      }),
    );
    expect(mocks.updateImportRecord).not.toHaveBeenCalled();
  });

  it('marks unknown clubs as unmatched for manual review', async () => {
    const mocks = setup();
    await expect(
      mocks.matcher.matchStaged(session, { ...record, name: 'Unknown Soccer Club' }),
    ).resolves.toEqual({ status: 'REVIEW_REQUIRED', reason: 'UNMATCHED' });
    expect(mocks.upsertMapping).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: 'UNMATCHED', clubId: null }),
      }),
    );
  });

  it('trusts an existing approved provider-ID mapping over a renamed provider club', async () => {
    const mocks = setup();
    mocks.findMapping.mockResolvedValue({
      id: 'mapping-1',
      clubId: rapid.id,
      status: 'MATCHED',
      method: 'MANUAL',
      reviewedAt: new Date(),
    });
    await expect(
      mocks.matcher.matchStaged(session, { ...record, name: 'Changed Provider Name' }),
    ).resolves.toEqual({ status: 'MATCHED', clubId: rapid.id, method: 'MANUAL' });
    expect(mocks.findClub).toHaveBeenCalledWith({
      where: { id: rapid.id },
      select: { active: true },
    });
    expect(mocks.findClubs).not.toHaveBeenCalled();
    expect(mocks.upsertMapping).not.toHaveBeenCalled();
  });

  it('does not link an inactive mapped club or overwrite its reviewed mapping', async () => {
    const mocks = setup();
    mocks.findMapping.mockResolvedValue({
      id: 'mapping-1',
      clubId: rapid.id,
      status: 'MATCHED',
      method: 'MANUAL',
      reviewedAt: new Date(),
    });
    mocks.findClub.mockResolvedValue({ active: false });
    await expect(mocks.matcher.matchStaged(session, record)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'INACTIVE_MAPPING',
    });
    expect(mocks.updateImportRecord).not.toHaveBeenCalled();
    expect(mocks.upsertMapping).not.toHaveBeenCalled();
  });

  it('preserves explicitly rejected or manually reviewed mappings', async () => {
    const mocks = setup();
    mocks.findMapping.mockResolvedValue({
      id: 'mapping-1',
      clubId: null,
      status: 'REJECTED',
      reviewedAt: new Date(),
    });
    await expect(mocks.matcher.matchStaged(session, record)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'REJECTED',
    });
    expect(mocks.findClubs).not.toHaveBeenCalled();
    expect(mocks.upsertMapping).not.toHaveBeenCalled();
  });

  it('does not rewrite an already reviewed import record', async () => {
    const mocks = setup();
    mocks.findImportRecord.mockResolvedValue({
      id: 'record-1',
      status: 'REVIEW_REQUIRED',
      canonicalEntityId: null,
      reviewedAt: new Date(),
    });
    await expect(mocks.matcher.matchStaged(session, record)).resolves.toEqual({
      status: 'REVIEW_REQUIRED',
      reason: 'MANUAL_REVIEW',
    });
    expect(mocks.upsertMapping).not.toHaveBeenCalled();
    expect(mocks.updateImportRecord).not.toHaveBeenCalled();
  });

  it('is idempotent when a previous matching attempt has already succeeded', async () => {
    const mocks = setup();
    mocks.findImportRecord.mockResolvedValue({
      id: 'record-1',
      status: 'MATCHED',
      canonicalEntityId: rapid.id,
      reviewedAt: null,
    });
    mocks.findMapping.mockResolvedValue({
      id: 'mapping-1',
      clubId: rapid.id,
      status: 'MATCHED',
      method: 'ALIAS',
      reviewedAt: null,
    });
    await mocks.matcher.matchStaged(session, record);
    expect(mocks.upsertMapping).not.toHaveBeenCalled();
    expect(mocks.updateImportRecord).not.toHaveBeenCalled();
  });

  it('fails without import history, instead of creating an orphan mapping', async () => {
    const mocks = setup();
    mocks.findImportRecord.mockResolvedValue(null);
    await expect(mocks.matcher.matchStaged(session, record)).rejects.toThrow(
      'SPORTS_CLUB_IMPORT_RECORD_MISSING',
    );
    expect(mocks.upsertMapping).not.toHaveBeenCalled();
  });

  it('rejects missing external ID and name before hitting the database', async () => {
    const mocks = setup();
    await expect(mocks.matcher.matchStaged(session, { ...record, externalId: ' ' })).rejects.toThrow(
      'SPORTS_CLUB_INVALID_RECORD',
    );
    await expect(mocks.matcher.matchStaged(session, { ...record, name: ' ' })).rejects.toThrow(
      'SPORTS_CLUB_INVALID_RECORD',
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
