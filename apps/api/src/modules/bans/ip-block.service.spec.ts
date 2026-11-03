import { ConflictException, NotFoundException } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import { IpBlockService, type CreateIpBlockCommand, IP_BLOCK_DURATION_MS } from './ip-block.service';
import type { IpIdentityService } from './ip-identity.service';

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

const ACTOR = '11111111-1111-4111-8111-111111111111';
const USER = '22222222-2222-4222-8222-222222222222';
const CARD = '33333333-3333-4333-8333-333333333333';
const BLOCK = '44444444-4444-4444-8444-444444444444';
const SANCTION = '55555555-5555-4555-8555-555555555555';

const input = (extra: Partial<CreateIpBlockCommand> = {}): CreateIpBlockCommand => ({
  ipAddress: '203.0.113.10',
  duration: '24H',
  reasonCode: 'SPAM_ATTACK',
  moderatorNote: 'Internal IP abuse evidence',
  actorId: ACTOR,
  ...extra,
});

function txClient() {
  return {
    iPBlock: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((value: { data: { startsAt: Date; expiresAt: Date } }) =>
        Promise.resolve({
          id: BLOCK, active: true,
          startsAt: value.data.startsAt, expiresAt: value.data.expiresAt,
        }),
      ),
    },
    sanction: {
      create: jest.fn().mockResolvedValue({ id: SANCTION }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit' }),
    },
    moderationCard: {
      findUnique: jest.fn().mockResolvedValue({
        type: 'RED', status: 'ACTIVE', userId: USER,
      }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ status: 'BANNED' }),
    },
  };
}

describe('IpBlockService – manual and RED-linked protection', () => {
  let tx: ReturnType<typeof txClient>;
  let transaction: jest.Mock;
  let service: IpBlockService;
  let hashed: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    tx = txClient();
    transaction = jest.fn((callback: (db: typeof tx) => Promise<unknown>) => callback(tx));
    jest.mocked(createPrismaClient).mockReturnValue({
      $transaction: transaction,
      $disconnect: jest.fn().mockResolvedValue(undefined),
    } as unknown as DatabaseClient);

    hashed = jest.fn().mockReturnValue({
      ipHash: 'f'.repeat(64),
      hashKeyVersion: 'v1',
    });
    service = new IpBlockService({
      hash: hashed,
    } as unknown as IpIdentityService);
  });

  it.each(Object.entries(IP_BLOCK_DURATION_MS))(
    'creates an expiring IP block for %s without storing a raw IP',
    async (duration, ms) => {
      const result = await service.create(input({
        duration: duration as CreateIpBlockCommand['duration'],
      }));

      expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: 'Serializable',
      });
      expect(result.id).toBe(BLOCK);
      expect(result.sanctionId).toBe(SANCTION);
      expect(result.expiresAt.getTime() - result.startsAt.getTime()).toBe(ms);
      expect(tx.iPBlock.create).toHaveBeenCalledTimes(1);
      const calls = tx.iPBlock.create.mock.calls as unknown[][];
      expect(calls[0]?.[0]).toMatchObject({
        data: {
          ipHash: 'f'.repeat(64),
          hashKeyVersion: 'v1',
          source: 'MANUAL',
          createdById: ACTOR,
          active: true,
        },
      });
      expect(JSON.stringify(calls)).not.toContain('203.0.113.10');
      expect(result).not.toHaveProperty('ipAddress');
      expect(result).not.toHaveProperty('internalNote');
    },
  );

  it('links an explicit RED card and persists the resulting IP protection sanction', async () => {
    await service.create(input({ sourceCardId: CARD }));

    expect(tx.moderationCard.findUnique).toHaveBeenCalledWith({
      where: { id: CARD },
      select: { type: true, userId: true, status: true },
    });
    const calls = tx.sanction.create.mock.calls as unknown[][];
    expect(calls[0]?.[0]).toMatchObject({
      data: {
        type: 'IP_BLOCK',
        status: 'ACTIVE',
        ipBlockId: BLOCK,
        userId: USER,
        sourceCardId: CARD,
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledTimes(2);
  });

  it('rejects a duplicate active hash', async () => {
    tx.iPBlock.findFirst.mockResolvedValueOnce({ id: 'existing' });
    await expect(service.create(input())).rejects.toBeInstanceOf(ConflictException);
    expect(tx.iPBlock.create).not.toHaveBeenCalled();
  });

  it('rejects a nonexistent RED card without IP writes', async () => {
    tx.moderationCard.findUnique.mockResolvedValueOnce(null);
    await expect(service.create(input({ sourceCardId: CARD })))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(tx.iPBlock.create).not.toHaveBeenCalled();
  });

  it('rejects an unbanned RED-card target', async () => {
    tx.user.findUnique.mockResolvedValueOnce({ status: 'ACTIVE' });
    await expect(service.create(input({ sourceCardId: CARD })))
      .rejects.toBeInstanceOf(ConflictException);
    expect(tx.iPBlock.create).not.toHaveBeenCalled();
  });

  it('rejects a user ID that does not match the associated RED card', async () => {
    await expect(service.create(input({ userId: ACTOR, sourceCardId: CARD })))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('treats a concurrent serializable transaction conflict as a safe 409', async () => {
    transaction.mockRejectedValueOnce({ code: 'P2034' });
    await expect(service.create(input())).rejects.toBeInstanceOf(ConflictException);
  });

  it('fails the sanction transaction if audit logging cannot be recorded', async () => {
    tx.auditLog.create.mockRejectedValueOnce(new Error('Audit unavailable'));
    await expect(service.create(input())).rejects.toThrow('Audit unavailable');
  });
});
