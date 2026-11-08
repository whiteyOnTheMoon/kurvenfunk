import { randomBytes, randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import request from 'supertest';
import type { App } from 'supertest/types';

import type { DatabaseService as WorkerDatabaseService } from '../../worker/src/database/database.service';
import { SanctionExpirationService } from '../../worker/src/services/sanction-expiration.service';

describe('Task 184 – manual IP bans: authorization, privacy, audit and revocation', () => {
  let app: INestApplication<App>;
  let db: DatabaseClient;
  let jwksServer: Server;
  let signingKey: KeyLike;
  const suffix = randomUUID().slice(0, 8);
  const subjects = {
    root: 'p184-root-' + suffix,
    admin: 'p184-admin-' + suffix,
    moderator: 'p184-mod-' + suffix,
    user: 'p184-user-' + suffix,
    limited: 'p184-limited-' + suffix,
    banned: 'p184-banned-' + suffix,
  };
  const subjectIds = new Map<string, string>();
  const endpoint = '/api/v1/moderation/ip-blocks';
  const address = '192.0.2.184';
  const secondAddress = '2001:db8::184';
  const note = 'Private manual evidence; do not include in API responses';
  const input = {
    ipAddress: address,
    duration: '3D',
    reasonCode: 'REPEATED_ABUSE',
    moderatorNote: note,
  };
  const previous = {
    jwks: process.env.KEYCLOAK_JWKS_URL,
    hmac: process.env.IP_HASH_HMAC_SECRET,
    version: process.env.IP_HASH_KEY_VERSION,
    enabled: process.env.IP_TEMP_BLOCK_ENABLED,
    auto: process.env.IP_TEMP_AUTO_BLOCK_ENABLED,
  };

  async function token(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p184-' + suffix })
      .setSubject(subject)
      .setIssuer(process.env.KEYCLOAK_ISSUER!)
      .setAudience(process.env.KEYCLOAK_AUDIENCE!)
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(signingKey);
  }

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      url.hostname !== '127.0.0.1' ||
      url.pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('TASK_184_REQUIRES_DISPOSABLE_POSTGRES_AND_REDIS');
    }

    process.env.IP_HASH_HMAC_SECRET = randomBytes(32).toString('base64url');
    process.env.IP_HASH_KEY_VERSION = 'v1';
    // Production and DEV remain untouched. This suite never enables live bans.
    process.env.IP_TEMP_BLOCK_ENABLED = 'false';
    process.env.IP_TEMP_AUTO_BLOCK_ENABLED = 'false';

    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: 'p184-' + suffix,
      alg: 'RS256',
      use: 'sig',
    };
    jwksServer = createServer((_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ keys: [publicKey] }));
    });
    await new Promise<void>((resolve) => jwksServer.listen(0, '127.0.0.1', resolve));
    const listen = jwksServer.address() as AddressInfo;
    process.env.KEYCLOAK_JWKS_URL = 'http://127.0.0.1:' + listen.port + '/jwks';

    db = createPrismaClient();
    const fixtures = [
      { subject: subjects.root, role: 'SUPERADMIN', status: 'ACTIVE' },
      { subject: subjects.admin, role: 'ADMIN', status: 'ACTIVE' },
      { subject: subjects.moderator, role: 'MODERATOR', status: 'ACTIVE' },
      { subject: subjects.user, role: 'USER', status: 'ACTIVE' },
      { subject: subjects.limited, role: 'SUPERADMIN', status: 'LIMITED' },
      { subject: subjects.banned, role: 'SUPERADMIN', status: 'BANNED' },
    ] as const;
    for (const fixture of fixtures) {
      const created = await db.user.create({
        data: {
          keycloakSubject: fixture.subject,
          nickname: fixture.subject.replaceAll('-', ''),
          status: fixture.status,
          onboardingCompleted: true,
          roleAssignments: { create: { role: fixture.role } },
        },
        select: { id: true },
      });
      subjectIds.set(fixture.subject, created.id);
    }

    const { AppModule } =
      (await import('../src/app.module')) as unknown as typeof import('../src/app.module');
    const { configureApplication } =
      (await import('../src/bootstrap')) as unknown as typeof import('../src/bootstrap');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
    await db?.$disconnect();
    if (jwksServer?.listening) {
      await new Promise<void>((resolve, reject) =>
        jwksServer.close((error) => (error ? reject(error) : resolve())),
      );
    }
    for (const [key, value] of Object.entries({
      KEYCLOAK_JWKS_URL: previous.jwks,
      IP_HASH_HMAC_SECRET: previous.hmac,
      IP_HASH_KEY_VERSION: previous.version,
      IP_TEMP_BLOCK_ENABLED: previous.enabled,
      IP_TEMP_AUTO_BLOCK_ENABLED: previous.auto,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('rejects unauthenticated, USER, MODERATOR, ADMIN, LIMITED and BANNED issuers', async () => {
    await request(app.getHttpServer()).post(endpoint).send(input).expect(401);
    for (const subject of [
      subjects.user,
      subjects.moderator,
      subjects.admin,
      subjects.limited,
      subjects.banned,
    ]) {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', 'Bearer ' + (await token(subject)))
        .send(input)
        .expect(403);
    }
    expect(await db.iPBlock.count({ where: { createdById: subjectIds.get(subjects.root) } })).toBe(
      0,
    );
    expect(
      await db.sanction.count({
        where: { type: 'IP_BLOCK', createdById: subjectIds.get(subjects.root) },
      }),
    ).toBe(0);
  }, 30000);

  it('rejects forged actor fields, permanent bans, invalid IP and bad justification', async () => {
    const auth = 'Bearer ' + (await token(subjects.root));
    for (const invalid of [
      { ...input, actorUserId: subjectIds.get(subjects.user) },
      { ...input, source: 'RATE_LIMIT_ESCALATION' },
      { ...input, duration: 'PERMANENT' },
      { ...input, ipAddress: '192.0.2.184, 203.0.113.10' },
      { ...input, ipAddress: 'not-an-ip' },
      { ...input, moderatorNote: ' ' },
      { ...input, reasonCode: 'secret in reason' },
    ]) {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', auth)
        .send(invalid)
        .expect(400);
    }
    expect(await db.iPBlock.count({ where: { createdById: subjectIds.get(subjects.root) } })).toBe(
      0,
    );
  }, 30000);

  it('creates a private bounded manual ban and linked audited sanction', async () => {
    const auth = 'Bearer ' + (await token(subjects.root));
    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('Authorization', auth)
      .send(input)
      .expect(201);
    const body = result.body as {
      data: { id: string; sanctionId: string; active: boolean; expiresAt: string };
    };
    expect(body.data.active).toBe(true);
    expect(body.data.sanctionId).toBeTruthy();
    expect(JSON.stringify(result.body)).not.toContain(address);
    expect(JSON.stringify(result.body)).not.toContain(note);
    expect(JSON.stringify(result.body)).not.toContain('ipHash');

    const block = await db.iPBlock.findUniqueOrThrow({ where: { id: body.data.id } });
    const sanction = await db.sanction.findUniqueOrThrow({
      where: { id: body.data.sanctionId },
    });
    expect(block.ipHash).toMatch(/^[0-9a-f]{64}$/u);
    expect(block.hashKeyVersion).toBe('v1');
    expect(block.source).toBe('MANUAL');
    expect(block.createdById).toBe(subjectIds.get(subjects.root));
    expect(block.reasonCode).toBe(input.reasonCode);
    expect(block.internalNote).toBe(note);
    expect(block.expiresAt!.getTime() - block.startsAt.getTime()).toBe(3 * 24 * 60 * 60_000);
    expect(JSON.stringify(block)).not.toContain(address);
    expect(sanction).toMatchObject({
      id: body.data.sanctionId,
      ipBlockId: body.data.id,
      status: 'ACTIVE',
      type: 'IP_BLOCK',
      createdById: subjectIds.get(subjects.root),
      reasonCode: input.reasonCode,
      internalNote: note,
    });
    expect(
      await db.auditLog.count({
        where: { ipBlockId: body.data.id, actorUserId: subjectIds.get(subjects.root) },
      }),
    ).toBe(2);
    expect(
      (
        await db.user.findUniqueOrThrow({
          where: { id: subjectIds.get(subjects.user)! },
        })
      ).status,
    ).toBe('ACTIVE');

    await request(app.getHttpServer())
      .post(endpoint)
      .set('Authorization', auth)
      .send(input)
      .expect(409);
    expect(await db.iPBlock.count({
      where: { source: 'MANUAL', createdById: subjectIds.get(subjects.root) },
    })).toBe(1);

    const revoke = endpoint + '/' + body.data.id + '/revoke';
    const reverse = {
      reasonCode: 'FALSE_POSITIVE',
      moderatorNote: 'Private reason to reverse ban',
    };
    for (const subject of [subjects.user, subjects.moderator, subjects.admin, subjects.limited]) {
      await request(app.getHttpServer())
        .post(revoke)
        .set('Authorization', 'Bearer ' + (await token(subject)))
        .send(reverse)
        .expect(403);
    }
    const revoked = await request(app.getHttpServer())
      .post(revoke)
      .set('Authorization', auth)
      .send(reverse)
      .expect(200);
    expect(revoked.body.data).toMatchObject({
      id: block.id,
      sanctionId: sanction.id,
      active: false,
    });
    expect(JSON.stringify(revoked.body)).not.toContain(address);
    expect(JSON.stringify(revoked.body)).not.toContain(reverse.moderatorNote);
    const ended = await db.iPBlock.findUniqueOrThrow({ where: { id: block.id } });
    expect(ended.active).toBe(false);
    expect(ended.deactivatedById).toBe(subjectIds.get(subjects.root));
    expect(ended.deactivationReason).toBe('FALSE_POSITIVE');
    const endedSanction = await db.sanction.findUniqueOrThrow({ where: { id: sanction.id } });
    expect(endedSanction.status).toBe('REVOKED');
    expect(endedSanction.revokedById).toBe(subjectIds.get(subjects.root));
    expect(await db.auditLog.count({ where: { ipBlockId: block.id } })).toBe(4);
    await request(app.getHttpServer())
      .post(revoke)
      .set('Authorization', auth)
      .send(reverse)
      .expect(409);
    expect(await db.auditLog.count({ where: { ipBlockId: block.id } })).toBe(4);
  }, 45000);

  it('rejects revocation of an expired manual ban and leaves its worker history intact', async () => {
    const auth = 'Bearer ' + (await token(subjects.root));
    const result = await request(app.getHttpServer())
      .post(endpoint)
      .set('Authorization', auth)
      .send({ ...input, ipAddress: secondAddress, duration: '24H' })
      .expect(201);
    const blockId = (result.body as { data: { id: string } }).data.id;
    await db.iPBlock.update({
      where: { id: blockId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const worker = new SanctionExpirationService({ client: db } as WorkerDatabaseService);
    await worker.expireDueSanctions(new Date());
    const after = await db.iPBlock.findUniqueOrThrow({ where: { id: blockId } });
    expect(after.active).toBe(false);
    await request(app.getHttpServer())
      .post(endpoint + '/' + blockId + '/revoke')
      .set('Authorization', auth)
      .send({ reasonCode: 'EXPIRED', moderatorNote: 'Already expired' })
      .expect(409);
    expect(
      await db.auditLog.count({
        where: { ipBlockId: blockId, action: 'IP_BLOCK_EXPIRED' },
      }),
    ).toBe(1);
    expect(
      await db.auditLog.count({
        where: { ipBlockId: blockId, action: 'IP_BLOCK_DEACTIVATED' },
      }),
    ).toBe(0);
  }, 30000);
});
