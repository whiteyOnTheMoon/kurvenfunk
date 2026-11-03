import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import {
  LimitedSanctionsService,
  type CreateLimitedSanctionCommand,
} from './limited-sanctions.service';

jest.mock('@kurvenfunk/database', () => ({ createPrismaClient: jest.fn() }));

const USER_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const SANCTION_ID = '44444444-4444-4444-8444-444444444444';

function command(
  overrides: Partial<CreateLimitedSanctionCommand> = {},
): CreateLimitedSanctionCommand {
  return {
    userId: USER_ID,
    moderatorId: ACTOR_ID,
    duration: '24H',
    reasonCode: 'ABUSE',
    moderatorNote: 'Only moderators may see this evidence',
    ...overrides,
  };
}

function createTx() {
  return {
    $queryRaw: jest.fn().mockResolvedValue([{ id: USER_ID, status: 'ACTIVE' }]),
    sanction: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }: { data: { expiresAt: Date } }) =>
        Promise.resolve({
          id: SANCTION_ID,
          userId: USER_ID,
          type: 'LIMITED',
          status: 'ACTIVE',
          expiresAt: data.expiresAt,
        }),
      ),
    },
    user: { update: jest.fn().mockResolvedValue({ id: USER_ID }) },
    auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-event' }) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notification-event' }) },
  };
}

describe('LimitedSanctionsService', () => {
  let service: LimitedSanctionsService;
  let tx: ReturnType<typeof createTx>;
  let transact: jest.Mock;
  let disconnect: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    tx = createTx();
    transact = jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
    disconnect = jest.fn().mockResolvedValue(undefined);

    jest.mocked(createPrismaClient).mockReturnValue({
      $transaction: transact,
      $disconnect: disconnect,
    } as unknown as DatabaseClient);

    service = new LimitedSanctionsService();
  });

  it.each([
    ['24H', 24],
    ['3D', 72],
    ['7D', 168],
    ['30D', 720],
  ] as const)('issues a %s sanction for %s hours', async (duration, hours) => {
    const before = Date.now();
    const response = await service.create(command({ duration }));
    const after = Date.now();

    expect(transact).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'ReadCommitted',
    });

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.sanction.create).toHaveBeenCalledTimes(1);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { status: 'LIMITED' },
    });
    expect(tx.auditLog.create).toHaveBeenCalledTimes(2);
    expect(tx.notification.create).toHaveBeenCalledTimes(1);

    const expiry = new Date(response.expiresAt).getTime();
    const durationMs = hours * 60 * 60 * 1000;
    expect(expiry).toBeGreaterThanOrEqual(before + durationMs);
    expect(expiry).toBeLessThanOrEqual(after + durationMs);
    expect(response).toEqual({
      id: SANCTION_ID,
      userId: USER_ID,
      type: 'LIMITED',
      status: 'ACTIVE',
      accountStatus: 'LIMITED',
      expiresAt: expect.any(Date),
    });
    expect(response).not.toHaveProperty('moderatorNote');
    expect(response).not.toHaveProperty('internalNote');
  });

  it('persists internal notes but never publishes them in notifications', async () => {
    await service.create(command({ userMessage: 'Bitte beachte unsere Regeln.' }));

    expect(tx.sanction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          internalNote: 'Only moderators may see this evidence',
          userMessage: 'Bitte beachte unsere Regeln.',
          reasonCode: 'ABUSE',
          createdById: ACTOR_ID,
        }),
      }),
    );
    expect(tx.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'LIMITED',
          dedupeKey: `limited-sanction:${SANCTION_ID}`,
          sourceType: 'SANCTION',
          sourceId: SANCTION_ID,
        }),
      }),
    );
  });

  it('locks the target before counting or creating sanctions', async () => {
    await service.create(command());
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.sanction.findFirst.mock.invocationCallOrder[0],
    );
    expect(tx.sanction.findFirst.mock.invocationCallOrder[0]).toBeLessThan(
      tx.sanction.create.mock.invocationCallOrder[0],
    );
  });

  it('rejects self-limiting before any transaction', async () => {
    await expect(service.create(command({ userId: ACTOR_ID }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transact).not.toHaveBeenCalled();
  });

  it('rejects unsupported durations before any transaction', async () => {
    await expect(service.create(command({ duration: 'UNKNOWN' as '24H' }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transact).not.toHaveBeenCalled();
  });

  it('rejects an unknown target', async () => {
    tx.$queryRaw.mockResolvedValueOnce([]);
    await expect(service.create(command())).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.sanction.create).not.toHaveBeenCalled();
  });

  it('does not override BANNED with LIMITED', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ id: USER_ID, status: 'BANNED' }]);
    await expect(service.create(command())).rejects.toBeInstanceOf(ConflictException);
    expect(tx.sanction.create).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('rejects an already-active LIMITED sanction', async () => {
    tx.sanction.findFirst.mockResolvedValueOnce({ id: SANCTION_ID });
    await expect(service.create(command())).rejects.toBeInstanceOf(ConflictException);
    expect(tx.sanction.create).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('permits a new LIMITED sanction after a previous expiry', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ id: USER_ID, status: 'LIMITED' }]);
    await expect(service.create(command())).resolves.toMatchObject({
      accountStatus: 'LIMITED',
    });
  });

  it('does not notify when an audit write fails', async () => {
    tx.auditLog.create.mockRejectedValueOnce(new Error('Audit failed'));
    await expect(service.create(command())).rejects.toThrow('Audit failed');
    expect(tx.notification.create).not.toHaveBeenCalled();
  });

  it('does not proceed when a notification write fails', async () => {
    tx.notification.create.mockRejectedValueOnce(new Error('Notification failed'));
    await expect(service.create(command())).rejects.toThrow('Notification failed');
  });

  it('disconnects from the database on shutdown', async () => {
    await service.onModuleDestroy();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
