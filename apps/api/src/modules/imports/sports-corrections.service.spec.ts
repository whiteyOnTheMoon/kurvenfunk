/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConflictException, NotFoundException } from '@nestjs/common';

const db = {
  entityMatch: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  club: { findMany: jest.fn(), findUnique: jest.fn() },
  match: { findMany: jest.fn(), findUnique: jest.fn() },
  importRecord: { updateMany: jest.fn() },
  auditLog: { create: jest.fn() },
  $executeRaw: jest.fn(),
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
};

jest.mock('@kurvenfunk/database', () => ({ createPrismaClient: () => db }));

import { SportsCorrectionsService } from './sports-corrections.service';

describe('SportsCorrectionsService', () => {
  const mappingId = '11111111-1111-4111-8111-111111111111';
  const providerId = '22222222-2222-4222-8222-222222222222';
  const clubId = '33333333-3333-4333-8333-333333333333';
  const matchId = '44444444-4444-4444-8444-444444444444';
  const actorId = '55555555-5555-4555-8555-555555555555';
  const revision = new Date('2026-11-09T18:00:00.000Z');
  let service: SportsCorrectionsService;

  const clubMapping = {
    id: mappingId,
    providerId,
    entityType: 'CLUB',
    externalId: 'external-club-1',
    status: 'AMBIGUOUS',
    clubId: null,
    matchId: null,
    updatedAt: revision,
    provider: { type: 'SPORTS' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    db.$transaction.mockImplementation((callback: (transaction: typeof db) => Promise<unknown>) =>
      callback(db),
    );
    db.entityMatch.findUnique.mockResolvedValue(clubMapping);
    db.entityMatch.findUniqueOrThrow.mockResolvedValue(clubMapping);
    db.entityMatch.findFirst.mockResolvedValue(null);
    db.club.findUnique.mockResolvedValue({ active: true });
    db.importRecord.updateMany.mockResolvedValue({ count: 2 });
    db.entityMatch.update.mockResolvedValue({
      id: mappingId,
      status: 'MATCHED',
      clubId,
      matchId: null,
    });
    db.auditLog.create.mockResolvedValue({ id: 'audit-row' });
    db.$executeRaw.mockResolvedValue(0);
    service = new SportsCorrectionsService();
  });

  it('lists only sports club and match mappings with a bounded review filter', async () => {
    db.entityMatch.findMany.mockResolvedValue([]);
    await expect(service.list('review', 250)).resolves.toEqual([]);
    expect(db.entityMatch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          provider: { type: 'SPORTS' },
          entityType: { in: ['CLUB', 'MATCH'] },
          status: { in: ['PENDING', 'UNMATCHED', 'AMBIGUOUS', 'REVIEW_REQUIRED'] },
        },
        take: 50,
      }),
    );
    await service.list('all', 5);
    expect(db.entityMatch.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { provider: { type: 'SPORTS' }, entityType: { in: ['CLUB', 'MATCH'] } },
        take: 5,
      }),
    );
  });

  it('searches only active clubs and provides readable match candidates', async () => {
    await service.candidates('CLUB', 'Rapid');
    expect(db.club.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { active: true, name: { contains: 'Rapid', mode: 'insensitive' } },
        take: 20,
      }),
    );
    await service.candidates('MATCH', 'Austria');
    expect(db.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { homeClub: { name: { contains: 'Austria', mode: 'insensitive' } } },
          ]),
        }),
        take: 20,
      }),
    );
  });

  it('manually binds an active club, updates staged records and creates a durable audit', async () => {
    await expect(
      service.correct(mappingId, actorId, {
        decision: 'MATCH',
        targetId: clubId,
        expectedUpdatedAt: revision.toISOString(),
        reason: 'Identität anhand des Vereinsregisters geprüft',
      }),
    ).resolves.toMatchObject({ status: 'MATCHED', clubId });

    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(db.$executeRaw).toHaveBeenCalledTimes(2);
    expect(db.club.findUnique).toHaveBeenCalledWith({
      where: { id: clubId },
      select: { active: true },
    });
    expect(db.entityMatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mappingId },
        data: expect.objectContaining({
          status: 'MATCHED',
          method: 'MANUAL',
          clubId,
          matchId: null,
          reviewedById: actorId,
        }),
      }),
    );
    expect(db.importRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          providerId,
          externalId: 'external-club-1',
          recordType: 'SPORTS_CLUB',
          reviewDecision: null,
        }),
        data: expect.objectContaining({
          reviewDecision: 'APPROVED',
          canonicalEntityId: clubId,
          reviewedById: actorId,
        }),
      }),
    );
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorType: 'USER',
        actorUserId: actorId,
        action: 'ADMIN_CORRECTION',
        category: 'SYSTEM',
        targetType: 'CLUB',
        targetId: clubId,
        reason: 'Identität anhand des Vereinsregisters geprüft',
        metadata: expect.objectContaining({
          source: 'sports-correction-v1',
          previousStatus: 'AMBIGUOUS',
          decision: 'MATCH',
          reviewedRecords: 2,
        }),
      }),
    });
  });

  it('rejects a mapping and does not change canonical data', async () => {
    await service.correct(mappingId, actorId, {
      decision: 'REJECT',
      expectedUpdatedAt: revision.toISOString(),
      reason: 'Diese ID gehört einem anderen Vereinsdatensatz',
    });
    expect(db.club.findUnique).not.toHaveBeenCalled();
    expect(db.match.findUnique).not.toHaveBeenCalled();
    expect(db.entityMatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'REJECTED',
          clubId: null,
          matchId: null,
          method: null,
          reviewedById: actorId,
        }),
      }),
    );
    expect(db.importRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SKIPPED', reviewDecision: 'REJECTED' }),
      }),
    );
    expect(db.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('rejects stale revisions without writing a mapping or audit', async () => {
    await expect(
      service.correct(mappingId, actorId, {
        decision: 'MATCH',
        targetId: clubId,
        expectedUpdatedAt: '2026-11-09T17:00:00.000Z',
        reason: 'Identität wurde anhand des Vereinsregisters geprüft',
      }),
    ).rejects.toEqual(
      new ConflictException({
        code: 'SPORTS_CORRECTION_STALE',
        message: 'Diese Zuordnung wurde inzwischen geändert. Bitte neu laden.',
      }),
    );
    expect(db.entityMatch.update).not.toHaveBeenCalled();
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });

  it('requires an active target club', async () => {
    db.club.findUnique.mockResolvedValue({ active: false });
    await expect(
      service.correct(mappingId, actorId, {
        decision: 'MATCH',
        targetId: clubId,
        expectedUpdatedAt: revision.toISOString(),
        reason: 'Diese manuelle Zuordnung wurde überprüft',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(db.entityMatch.update).not.toHaveBeenCalled();
  });

  it('rejects non-sports providers even with a valid mapping UUID', async () => {
    db.entityMatch.findUniqueOrThrow.mockResolvedValue({
      ...clubMapping,
      provider: { type: 'NEWS' },
    });
    await expect(
      service.correct(mappingId, actorId, {
        decision: 'REJECT',
        expectedUpdatedAt: revision.toISOString(),
        reason: 'Diese Zuordnung ist fehlerhaft gespeichert',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });

  it('rejects missing mappings before any mutation', async () => {
    db.entityMatch.findUnique.mockResolvedValue(null);
    await expect(
      service.correct(mappingId, actorId, {
        decision: 'REJECT',
        expectedUpdatedAt: revision.toISOString(),
        reason: 'Diese Zuordnung muss gelöscht werden',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.entityMatch.update).not.toHaveBeenCalled();
  });

  it('corrects a match only when target season and clubs remain consistent', async () => {
    const matchMapping = { ...clubMapping, entityType: 'MATCH', externalId: 'external-match-1' };
    db.entityMatch.findUnique.mockResolvedValue(matchMapping);
    db.entityMatch.findUniqueOrThrow.mockResolvedValue(matchMapping);
    db.match.findUnique.mockResolvedValue({
      competitionId: 'competition-1',
      homeClubId: 'home-1',
      awayClubId: 'away-1',
      homeClub: { active: true },
      awayClub: { active: true },
      season: { competitionId: 'competition-1' },
    });
    await service.correct(mappingId, actorId, {
      decision: 'MATCH',
      targetId: matchId,
      expectedUpdatedAt: revision.toISOString(),
      reason: 'Spielansetzung und beteiligte Teams manuell abgeglichen',
    });
    expect(db.entityMatch.findFirst).toHaveBeenCalledWith({
      where: {
        providerId,
        entityType: 'MATCH',
        status: 'MATCHED',
        matchId,
        id: { not: mappingId },
      },
      select: { id: true },
    });
    expect(db.importRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recordType: { in: ['SPORTS_MATCH', 'SPORTS_RESULT'] },
        }),
        data: expect.objectContaining({
          canonicalEntityType: 'MATCH',
          canonicalEntityId: matchId,
        }),
      }),
    );
  });

  it('rejects already bound canonical match targets', async () => {
    const matchMapping = { ...clubMapping, entityType: 'MATCH' };
    db.entityMatch.findUnique.mockResolvedValue(matchMapping);
    db.entityMatch.findUniqueOrThrow.mockResolvedValue(matchMapping);
    db.match.findUnique.mockResolvedValue({
      competitionId: 'competition-1',
      homeClubId: 'home-1',
      awayClubId: 'away-1',
      homeClub: { active: true },
      awayClub: { active: true },
      season: { competitionId: 'competition-1' },
    });
    db.entityMatch.findFirst.mockResolvedValue({ id: 'conflict-id' });
    await expect(
      service.correct(mappingId, actorId, {
        decision: 'MATCH',
        targetId: matchId,
        expectedUpdatedAt: revision.toISOString(),
        reason: 'Spielpaarung wurde eindeutig manuell geprüft',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });

  it('retries serializable transaction conflicts, then commits once', async () => {
    db.$transaction
      .mockRejectedValueOnce({ code: 'P2034' })
      .mockImplementationOnce((callback: (transaction: typeof db) => Promise<unknown>) =>
        callback(db),
      );
    await service.correct(mappingId, actorId, {
      decision: 'REJECT',
      expectedUpdatedAt: revision.toISOString(),
      reason: 'Ein externer Vereinsdatensatz stimmt nicht überein',
    });
    expect(db.$transaction).toHaveBeenCalledTimes(2);
    expect(db.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('does not persist a correction when an audit insert fails', async () => {
    // The production implementation runs inside a single PostgreSQL
    // transaction: rejecting the audit insert rejects the entire operation.
    db.auditLog.create.mockRejectedValue({ code: 'P2003' });
    await expect(
      service.correct(mappingId, actorId, {
        decision: 'REJECT',
        expectedUpdatedAt: revision.toISOString(),
        reason: 'Der vorherige Provider-Treffer ist nicht korrekt',
      }),
    ).rejects.toEqual({ code: 'P2003' });
  });
});
