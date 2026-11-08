import { randomBytes, randomUUID } from 'node:crypto';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import {
  Controller,
  Get,
  type INestApplication,
  Post,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import Redis from 'ioredis';
import request from 'supertest';
import type { App } from 'supertest/types';

import type { DatabaseService as WorkerDatabaseService } from '../../worker/src/database/database.service';
import { SanctionExpirationService } from '../../worker/src/services/sanction-expiration.service';
import { IpIdentityService } from '../src/modules/bans/ip-identity.service';
import { AUTO_ESCALATION_LUA } from '../src/modules/bans/ip-rate-limit.guard';
import { TemporaryIpBlockGuard } from '../src/modules/bans/temporary-ip-block.guard';
import { TemporaryIpBlockService } from '../src/modules/bans/temporary-ip-block.service';
import type { TrustedClientIpService } from '../src/modules/bans/trusted-client-ip.service';

@Controller('api/v1/articles/:id/comments')
class DisposableCommentController {
  @Get()
  list() {
    return { items: [] };
  }

  @Post()
  create() {
    return { ok: true };
  }
}

describe('Task 183 isolated temporary IP block lifecycle and HTTP enforcement', () => {
  let db: DatabaseClient;
  let service: TemporaryIpBlockService;
  let app: INestApplication<App>;
  let identity: IpIdentityService;
  const address = '192.0.2.133';
  const secondAddress = '192.0.2.134';
  const secret = randomBytes(32).toString('base64url');
  const target = randomUUID();

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      url.hostname !== '127.0.0.1' ||
      url.pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('TASK_183_REQUIRES_DISPOSABLE_POSTGRES_AND_REDIS');
    }

    const config = {
      get: (key: string, fallback?: string) => {
        const env: Record<string, string> = {
          IP_HASH_HMAC_SECRET: secret,
          IP_HASH_KEY_VERSION: 'v1',
          IP_TEMP_BLOCK_ENABLED: 'true',
        };
        return env[key] ?? fallback;
      },
    } as ConfigService;

    identity = new IpIdentityService(config);
    service = new TemporaryIpBlockService(identity);
    db = createPrismaClient();

    const trustedIp = {
      fromRequest: jest.fn().mockResolvedValue(address),
    } as unknown as TrustedClientIpService;
    const guard = new TemporaryIpBlockGuard(trustedIp, service, config);
    const moduleRef = await Test.createTestingModule({
      controllers: [DisposableCommentController],
      providers: [{ provide: APP_GUARD, useValue: guard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
    await service?.onModuleDestroy();
    await db?.$disconnect();
  });

  it('enforces an automatic 15min block and restores writes after worker expiry', async () => {
    const endpoint = `/api/v1/articles/${target}/comments`;
    await request(app.getHttpServer()).post(endpoint).send({}).expect(201);
    const created = await service.issueAutomatic(address);
    expect(created.sanctionId).toBeNull();
    expect(created.expiresAt.getTime() - created.startsAt.getTime()).toBe(15 * 60_000);

    const record = await db.iPBlock.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(record.source).toBe('RATE_LIMIT_ESCALATION');
    expect(record.ipHash).toMatch(/^[0-9a-f]{64}$/u);
    expect(JSON.stringify(record)).not.toContain(address);
    expect(await db.auditLog.count({
      where: { ipBlockId: created.id, action: 'IP_BLOCK_CREATED' },
    })).toBe(1);
    expect(await db.sanction.count({ where: { ipBlockId: created.id } })).toBe(0);

    const denied = await request(app.getHttpServer()).post(endpoint).send({}).expect(403);
    expect(JSON.stringify(denied.body)).toContain('IP_TEMPORARILY_BLOCKED');
    await request(app.getHttpServer()).get(endpoint).expect(200);

    await expect(service.issueAutomatic(address)).rejects.toMatchObject({ status: 409 });

    await db.iPBlock.update({
      where: { id: created.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const worker = new SanctionExpirationService({ client: db } as WorkerDatabaseService);
    await worker.expireDueSanctions(new Date());

    await request(app.getHttpServer()).post(endpoint).send({}).expect(201);
    const ended = await db.iPBlock.findUniqueOrThrow({ where: { id: created.id } });
    expect(ended.active).toBe(false);
    expect(ended.deactivationReason).toBe('EXPIRED');
    expect(await db.auditLog.count({
      where: { ipBlockId: created.id, action: 'IP_BLOCK_EXPIRED' },
    })).toBe(1);
  }, 30000);

  it('creates a manual expiring block only for an explicit actor, with linked sanction', async () => {
    const suffix = randomUUID().slice(0, 8);
    const actor = await db.user.create({
      data: {
        keycloakSubject: 'p183-actor-' + suffix,
        nickname: 'p183act' + suffix,
        status: 'ACTIVE',
        onboardingCompleted: true,
        roleAssignments: { create: { role: 'SUPERADMIN' } },
      },
      select: { id: true },
    });

    const result = await service.issueManual(secondAddress, '24H', actor.id);
    expect(result.sanctionId).toBeTruthy();
    expect(result.expiresAt.getTime() - result.startsAt.getTime()).toBe(24 * 60 * 60_000);
    const linked = await db.sanction.findUniqueOrThrow({
      where: { id: result.sanctionId! },
    });
    expect(linked.type).toBe('IP_BLOCK');
    expect(linked.ipBlockId).toBe(result.id);
    expect(await db.auditLog.count({ where: { ipBlockId: result.id } })).toBe(2);

    await db.iPBlock.update({
      where: { id: result.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const worker = new SanctionExpirationService({ client: db } as WorkerDatabaseService);
    await worker.expireDueSanctions(new Date());
    expect((await db.sanction.findUniqueOrThrow({ where: { id: linked.id } })).status).toBe(
      'EXPIRED',
    );
  }, 30000);

  it('records only 3 distinct over-quota minutes and triggers one automatic block', async () => {
    const redis = new Redis({
      host: process.env.REDIS_HOST!,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    const base = 'kurvenfunk:ip-block:e2e:' + randomBytes(16).toString('hex');
    const event = async (timestamp: number) =>
      redis.eval(
        AUTO_ESCALATION_LUA,
        2,
        base,
        base + ':once',
        timestamp,
        30 * 60_000,
        Math.floor(timestamp / 60_000),
        1800,
      );

    try {
      expect(await event(600_000)).toBe(0);
      expect(await event(610_000)).toBe(0);
      expect(await event(660_000)).toBe(0);
      expect(await event(720_000)).toBe(1);
      expect(await event(725_000)).toBe(0);
      expect(await redis.pttl(base)).toBeGreaterThan(0);
    } finally {
      await redis.del(base, base + ':once');
      redis.disconnect();
    }
  }, 30000);
});
