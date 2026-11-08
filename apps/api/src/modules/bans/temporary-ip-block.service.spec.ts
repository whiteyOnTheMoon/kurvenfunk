import { ConflictException } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import type { IpIdentityService } from './ip-identity.service';
import { TemporaryIpBlockService, TEMP_IP_DURATION_MS } from './temporary-ip-block.service';

jest.mock('@kurvenfunk/database', () => ({ createPrismaClient: jest.fn() }));

const RAW_ADDRESS = '192.0.2.33';
const ACTOR = '11111111-1111-4111-8111-111111111111';
const BLOCK = '22222222-2222-4222-8222-222222222222';
const SANCTION = '33333333-3333-4333-8333-333333333333';

function setup() {
  const tx = {
    iPBlock: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((input: { data: { startsAt: Date; expiresAt: Date } }) =>
        Promise.resolve({
          id: BLOCK,
          active: true,
          startsAt: input.data.startsAt,
          expiresAt: input.data.expiresAt,
        }),
      ),
    },
    sanction: { create: jest.fn().mockResolvedValue({ id: SANCTION }) },
    auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit' }) },
  };
  const database = {
    iPBlock: { findFirst: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };
  jest.mocked(createPrismaClient).mockReturnValue(database as unknown as DatabaseClient);
  const identity = {
    hash: jest.fn().mockReturnValue({ ipHash: 'f'.repeat(64), hashKeyVersion: 'v2' }),
    candidateHashes: jest.fn().mockReturnValue([
      { ipHash: 'f'.repeat(64), hashKeyVersion: 'v2' },
      { ipHash: 'e'.repeat(64), hashKeyVersion: 'v1' },
    ]),
  };
  const service = new TemporaryIpBlockService(identity as unknown as IpIdentityService);
  return { service, tx, database, identity };
}

describe('Task 183 temporary IP block service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a 15-minute technical block and audit without raw IP or user sanction', async () => {
    const { service, tx, database } = setup();
    const created = await service.issueAutomatic(RAW_ADDRESS);
    expect(created.active).toBe(true);
    expect(created.sanctionId).toBeNull();
    expect(created.expiresAt.getTime() - created.startsAt.getTime()).toBe(
      TEMP_IP_DURATION_MS['15M'],
    );
    expect(database.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(tx.sanction.create).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
    expect(tx.iPBlock.create.mock.calls).toMatchObject([
      [{
        data: {
          ipHash: 'f'.repeat(64),
          hashKeyVersion: 'v2',
          source: 'RATE_LIMIT_ESCALATION',
          reasonCode: 'REPEATED_WRITE_ABUSE',
          createdById: null,
        },
      }],
    ]);
    expect(tx.auditLog.create.mock.calls).toMatchObject([
      [{ data: { actorType: 'SECURITY_AUTOMATION', action: 'IP_BLOCK_CREATED' } }],
    ]);
    expect(JSON.stringify(tx.iPBlock.create.mock.calls)).not.toContain(RAW_ADDRESS);
    expect(JSON.stringify(tx.auditLog.create.mock.calls)).not.toContain(RAW_ADDRESS);
    await service.onModuleDestroy();
  });

  it.each(['24H', '3D', '7D', '30D'] as const)(
    'permits a bounded %s manual block with a linked sanction and two audits',
    async (duration) => {
      const { service, tx } = setup();
      const created = await service.issueManual(RAW_ADDRESS, duration, ACTOR);
      expect(created.sanctionId).toBe(SANCTION);
      expect(created.expiresAt.getTime() - created.startsAt.getTime()).toBe(
        TEMP_IP_DURATION_MS[duration],
      );
      expect(tx.sanction.create).toHaveBeenCalledTimes(1);
      expect(tx.auditLog.create).toHaveBeenCalledTimes(2);
      expect(tx.iPBlock.create.mock.calls).toMatchObject([
        [{ data: { source: 'MANUAL', createdById: ACTOR } }],
      ]);
    },
  );

  it('rejects an existing active block from either current or previous key version', async () => {
    const { service, tx, identity } = setup();
    tx.iPBlock.findFirst.mockResolvedValueOnce({ id: BLOCK });
    await expect(service.issueAutomatic(RAW_ADDRESS)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.iPBlock.create).not.toHaveBeenCalled();
    expect(identity.candidateHashes).toHaveBeenCalledWith(RAW_ADDRESS);
    expect(tx.iPBlock.findFirst.mock.calls).toMatchObject([
      [{
        where: {
          OR: [
            { ipHash: 'f'.repeat(64), hashKeyVersion: 'v2' },
            { ipHash: 'e'.repeat(64), hashKeyVersion: 'v1' },
          ],
        },
      }],
    ]);
  });

  it('does not duplicate blocks after a serializable transaction race', async () => {
    const { service, database } = setup();
    database.$transaction.mockRejectedValueOnce({ code: 'P2034' });
    await expect(service.issueAutomatic(RAW_ADDRESS)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rolls back the transaction if writing audit fails', async () => {
    const { service, tx } = setup();
    tx.auditLog.create.mockRejectedValueOnce(new Error('Audit store failed'));
    await expect(service.issueAutomatic(RAW_ADDRESS)).rejects.toThrow('Audit store failed');
  });

  it('rejects spoofed commands and invalid manual actor IDs', async () => {
    const { service, database } = setup();
    await expect(service.issueManual(RAW_ADDRESS, '24H', 'invalid')).rejects.toThrow(
      'IP_TEMP_BLOCK_ACTOR_INVALID',
    );
    await expect(
      service.issue({
        address: RAW_ADDRESS,
        duration: '30D',
        reasonCode: 'BAD',
        source: 'RATE_LIMIT_ESCALATION',
        actorUserId: ACTOR,
      }),
    ).rejects.toThrow('IP_TEMP_BLOCK_COMMAND_INVALID');
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it('matches an active nonexpired block with both active and retained HMAC versions', async () => {
    const { service, database } = setup();
    database.iPBlock.findFirst.mockResolvedValueOnce({ id: BLOCK, expiresAt: new Date() });
    const result = await service.findActive(RAW_ADDRESS);
    expect(result?.id).toBe(BLOCK);
    expect(database.iPBlock.findFirst.mock.calls).toMatchObject([
      [{
        where: {
          active: true,
          OR: [
            { ipHash: 'f'.repeat(64), hashKeyVersion: 'v2' },
            { ipHash: 'e'.repeat(64), hashKeyVersion: 'v1' },
          ],
        },
      }],
    ]);
  });
});
