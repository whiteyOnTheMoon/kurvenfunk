import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import {
  LIMITED_DURATION_MS,
  LimitedSanctionsService,
  type IssueLimitedSanctionCommand,
} from './limited-sanctions.service';

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

const TARGET = '11111111-1111-4111-8111-111111111111';
const ACTOR = '22222222-2222-4222-8222-222222222222';
const SANCTION = '33333333-3333-4333-8333-333333333333';

function command(
  overrides: Partial<IssueLimitedSanctionCommand> = {},
): IssueLimitedSanctionCommand {
  return {
    userId: TARGET,
    moderatorId: ACTOR,
    duration: '3D',
    reasonCode: 'REPEATED_SPAM',
    moderatorNote: 'Private investigation evidence',
    ...overrides,
  };
}

function transactionClient() {
  return {
    $queryRaw: jest.fn().mockResolvedValue([{ id: TARGET, status: 'ACTIVE' }]),
    sanction: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation(async ({ data }: { data: { expiresAt: Date; startsAt: Date } }) => ({
          id: SANCTION,
          type: 'LIMITED',
          status: 'ACTIVE',
          userId: TARGET,
          startsAt: data.startsAt,
          expiresAt: data.expiresAt,
        })),
    },
    user: {
      update: jest.fn().mockResolvedValue({ id: TARGET, status: 'LIMITED' }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-id' }),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notification-id' }),
    },
  };
}

describe('LimitedSanctionsService', () => {
  let service: LimitedSanctionsService;
  let tx: ReturnType<typeof transactionClient>;
  let transaction: jest.Mock;
  let disconnect: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    tx = transactionClient();
    transaction = jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
    disconnect = jest.fn().mockResolvedValue(undefined);

    jest.mocked(createPrismaClient).mockReturnValue({
      $transaction: transaction,
      $disconnect: disconnect,
    } as unknown as DatabaseClient);

    service = new LimitedSanctionsService();
  });

  it.each(Object.entries(LIMITED_DURATION_MS))(
    'creates an expiring LIMITED sanction for %s',
    async (duration, durationMs) => {
      const result = await service.issue(
        command({ duration: duration as IssueLimitedSanctionCommand['duration'] }),
      );

      expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: 'ReadCommitted',
      });
      expect(result.type).toBe('LIMITED');
      expect(result.status).toBe('ACTIVE');
      expect(result.expiresAt.getTime() - result.startsAt.getTime()).toBe(durationMs);
      expect(tx.sanction.create).toHaveBeenCalledTimes(1);
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: TARGET },
        data: { status: 'LIMITED' },
      });
      expect(tx.auditLog.create).toHaveBeenCalledTimes(2);
      expect(tx.notification.create).toHaveBeenCalledTimes(1);
    },
  );

  it('persists the internal note on the sanction, but never returns it or notifies it', async () => {
    const issued = await service.issue(command({ userMessage: 'Bitte beachte die Regeln.' }));

    expect(tx.sanction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          internalNote: 'Private investigation evidence',
          userMessage: 'Bitte beachte die Regeln.',
          createdById: ACTOR,
          type: 'LIMITED',
        }),
      }),
    );
    expect(issued).not.toHaveProperty('internalNote');
    expect(issued).not.toHaveProperty('moderatorNote');
    expect(tx.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'LIMITED',
          sourceType: 'SANCTION',
          sourceId: SANCTION,
        }),
      }),
    );
  });

  it('records sanction creation and account status change before notifying', async () => {
    await service.issue(command());

    const auditCalls = tx.auditLog.create.mock.calls;
    expect(auditCalls).toHaveLength(2);
    expect(auditCalls[0]).toEqual({
      data: expect.objectContaining({
        actorType: 'USER',
        actorUserId: ACTOR,
        action: 'SANCTION_CREATED',
        category: 'SANCTION',
        targetType: 'SANCTION',
        targetUserId: TARGET,
        sanctionId: SANCTION,
      }),
    });
    expect(auditCalls[1]).toEqual({
      data: expect.objectContaining({
        actorType: 'USER',
        actorUserId: ACTOR,
        action: 'USER_STATUS_CHANGED',
        category: 'ACCOUNT',
        metadata: { previousStatus: 'ACTIVE', newStatus: 'LIMITED' },
      }),
    });
  });

  it('does not emit a redundant status change if the user is already LIMITED with only expired sanctions', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ id: TARGET, status: 'LIMITED' }]);
    await service.issue(command());

    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('rejects a self-sanction without writing', async () => {
    await expect(service.issue(command({ userId: ACTOR }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects a missing account', async () => {
    tx.$queryRaw.mockResolvedValueOnce([]);
    await expect(service.issue(command())).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.sanction.create).not.toHaveBeenCalled();
  });

  it('rejects a BANNED account without modifying its status', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ id: TARGET, status: 'BANNED' }]);
    await expect(service.issue(command())).rejects.toBeInstanceOf(ConflictException);
    expect(tx.sanction.create).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('rejects an overlapping active LIMITED sanction', async () => {
    tx.sanction.findFirst.mockResolvedValueOnce({ id: SANCTION });
    await expect(service.issue(command())).rejects.toBeInstanceOf(ConflictException);
    expect(tx.sanction.create).not.toHaveBeenCalled();
  });

  it('locks the target account before reading or writing sanctions', async () => {
    await service.issue(command());

    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.sanction.findFirst.mock.invocationCallOrder[0],
    );
    expect(tx.sanction.findFirst.mock.invocationCallOrder[0]).toBeLessThan(
      tx.sanction.create.mock.invocationCallOrder[0],
    );
  });

  it('fails safely if audit logging fails', async () => {
    tx.auditLog.create.mockRejectedValueOnce(new Error('Audit unavailable'));
    await expect(service.issue(command())).rejects.toThrow('Audit unavailable');
    expect(tx.notification.create).not.toHaveBeenCalled();
  });

  it('fails if notification creation fails', async () => {
    tx.notification.create.mockRejectedValueOnce(new Error('Notice unavailable'));
    await expect(service.issue(command())).rejects.toThrow('Notice unavailable');
  });

  it('disconnects from Prisma on module shutdown', async () => {
    await service.onModuleDestroy();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
