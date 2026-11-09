import 'reflect-metadata';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { AppealsService } from './appeals.service';

jest.mock('@kurvenfunk/database', () => ({ createPrismaClient: jest.fn() }));

const USER = '11111111-1111-4111-8111-111111111111';
const CARD = '22222222-2222-4222-8222-222222222222';

describe('Task 189 appeal security and atomic submission', () => {
  let database: {
    $transaction: jest.Mock;
    $disconnect: jest.Mock;
    moderationCard: { findUnique: jest.Mock; findMany: jest.Mock };
    sanction: { findUnique: jest.Mock; findMany: jest.Mock };
    appeal: { create: jest.Mock; findMany: jest.Mock };
    auditLog: { create: jest.Mock };
    notification: { create: jest.Mock };
  };
  let service: AppealsService;

  beforeEach(() => {
    jest.clearAllMocks();
    database = {
      $transaction: jest.fn(),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      moderationCard: {
        findUnique: jest.fn().mockResolvedValue({ userId: USER }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      sanction: {
        findUnique: jest.fn().mockResolvedValue({ userId: USER, type: 'ACCOUNT_BAN' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      appeal: {
        create: jest.fn().mockResolvedValue({
          id: CARD,
          status: 'OPEN',
          moderationCardId: CARD,
          sanctionId: null,
          createdAt: new Date(),
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      auditLog: { create: jest.fn().mockResolvedValue({ id: CARD }) },
      notification: { create: jest.fn().mockResolvedValue({ id: CARD }) },
    };
    database.$transaction.mockImplementation(
      async (callback: (db: typeof database) => Promise<unknown>) => callback(database),
    );
    jest.mocked(createPrismaClient).mockReturnValue(database as unknown as DatabaseClient);
    service = new AppealsService();
  });

  it('creates only own card appeals and atomically audits plus notifies', async () => {
    const result = await service.create({
      userId: USER,
      moderationCardId: CARD,
      reason: 'Die Moderationsentscheidung ist nicht korrekt.',
    });
    expect(result.status).toBe('OPEN');
    expect(database.$transaction).toHaveBeenCalledTimes(1);
    expect(database.appeal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: USER, moderationCardId: CARD, status: 'OPEN' }),
      }),
    );
    expect(database.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'APPEAL_CREATED' }) }),
    );
    expect(database.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'APPEAL', sourceType: 'APPEAL' }),
      }),
    );
  });

  it('never exposes whether another user owns a card or IP sanction', async () => {
    database.moderationCard.findUnique.mockResolvedValue({ userId: 'someone-else' });
    await expect(
      service.create({ userId: USER, moderationCardId: CARD, reason: 'Eine ungerechte Karte.' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    database.sanction.findUnique.mockResolvedValue({ userId: USER, type: 'IP_BLOCK' });
    await expect(
      service.create({ userId: USER, sanctionId: CARD, reason: 'Eine Netzwerksperre.' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(database.appeal.create).not.toHaveBeenCalled();
    expect(database.notification.create).not.toHaveBeenCalled();
  });

  it('uses the DB unique constraint to reject a repeated appeal', async () => {
    database.appeal.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.create({
        userId: USER,
        moderationCardId: CARD,
        reason: 'Zweiter Versuch für Karte.',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(database.auditLog.create).not.toHaveBeenCalled();
  });

  it('only offers non-IP sanctions and never exposes internal decision notes to owners', async () => {
    await service.eligible(USER);
    const args = (database.sanction.findMany.mock.calls as unknown[][])[0]?.[0] as {
      where: Record<string, unknown>;
      select: Record<string, boolean>;
      take: number;
    };
    expect(args.where).toEqual({ userId: USER, type: { not: 'IP_BLOCK' } });
    expect(args.take).toBe(50);
    expect(args.select).not.toHaveProperty('internalNote');
    expect(args.select).not.toHaveProperty('ipBlock');

    await service.listMine(USER);
    const own = (database.appeal.findMany.mock.calls as unknown[][])[0]?.[0] as {
      where: Record<string, unknown>;
      select: Record<string, boolean>;
    };
    expect(own.where).toEqual({ userId: USER });
    expect(own.select).not.toHaveProperty('decisionNote');
    expect(own.select).not.toHaveProperty('reviewedById');
    expect(own.select).not.toHaveProperty('userId');
  });

  it('does not mutate records when filing invalid target types', async () => {
    await expect(
      service.create({ userId: USER, reason: 'Keine Maßnahme ausgewählt.' }),
    ).rejects.toThrow();
    await expect(
      service.create({
        userId: USER,
        reason: 'Beide Maßnahmen ausgewählt.',
        moderationCardId: CARD,
        sanctionId: CARD,
      }),
    ).rejects.toThrow();
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it('disconnects its own database connection', async () => {
    await service.onModuleDestroy();
    expect(database.$disconnect).toHaveBeenCalledTimes(1);
  });
});
