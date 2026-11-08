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

describe('Task 185 â red card + optional bounded IP protection', () => {
  let app: INestApplication<App>;
  let db: DatabaseClient;
  let jwksServer: Server;
  let signingKey: KeyLike;
  let cardId: string;
  let inactiveCardId: string;
  let yellowCardId: string;
  const suffix = randomUUID().slice(0, 8);
  const subjects = {
    root: 'p185-root-' + suffix,
    admin: 'p185-admin-' + suffix,
    moderator: 'p185-mod-' + suffix,
    user: 'p185-user-' + suffix,
    target: 'p185-target-' + suffix,
    limited: 'p185-limited-' + suffix,
    banned: 'p185-banned-' + suffix,
  };
  const ids = new Map<string, string>();
  const address = '192.0.2.185';
  const note = 'Private red-card network evidence';
  const input = {
    ipAddress: address,
    duration: '1H',
    reasonCode: 'REPEATED_BAN_EVASION',
    moderatorNote: note,
    sharedIpRiskAccepted: true,
  };
  const previous = {
    jwks: process.env.KEYCLOAK_JWKS_URL,
    hmac: process.env.IP_HASH_HMAC_SECRET,
    version: process.env.IP_HASH_KEY_VERSION,
    enabled: process.env.IP_TEMP_BLOCK_ENABLED,
    auto: process.env.IP_TEMP_AUTO_BLOCK_ENABLED,
  };

  const endpoint = () => '/api/v1/moderation/red-cards/' + cardId + '/ip-protection';

  async function token(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p185-' + suffix })
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
      throw new Error('TASK_185_REQUIRES_DISPOSABLE_POSTGRES_AND_REDIS');
    }

    process.env.IP_HASH_HMAC_SECRET = randomBytes(32).toString('base64url');
    process.env.IP_HASH_KEY_VERSION = 'v1';
    process.env.IP_TEMP_BLOCK_ENABLED = 'false';
    process.env.IP_TEMP_AUTO_BLOCK_ENABLED = 'false';

    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: 'p185-' + suffix,
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
      { subject: subjects.target, role: 'USER', status: 'BANNED' },
      { subject: subjects.limited, role: 'SUPERADMIN', status: 'LIMITED' },
      { subject: subjects.banned, role: 'SUPERADMIN', status: 'BANNED' },
    ] as const;
    for (const fixture of fixtures) {
      const user = await db.user.create({
        data: {
          keycloakSubject: fixture.subject,
          nickname: fixture.subject.replaceAll('-', ''),
          status: fixture.status,
          onboardingCompleted: true,
          roleAssignments: { create: { role: fixture.role } },
        },
        select: { id: true },
      });
      ids.set(fixture.subject, user.id);
    }

    const red = await db.moderationCard.create({
      data: {
        userId: ids.get(subjects.target)!,
        moderatorId: ids.get(subjects.root),
        type: 'RED',
        status: 'ACTIVE',
        reasonCode: 'REPEATED_BAN_EVASION',
        moderatorNote: 'Isolated synthetic test',
        escalationSource: 'MANUAL',
      },
    });
    cardId = red.id;
    const yellow = await db.moderationCard.create({
      data: {
        userId: ids.get(subjects.target)!,
        moderatorId: ids.get(subjects.root),
        type: 'YELLOW',
        status: 'ACTIVE',
        reasonCode: 'TEST_ONLY',
      },
    });
    yellowCardId = yellow.id;
    const inactive = await db.moderationCard.create({
      data: {
        userId: ids.get(subjects.target)!,
        moderatorId: ids.get(subjects.root),
        type: 'RED',
        status: 'REVOKED',
        reasonCode: 'TEST_ONLY',
        revokedAt: new Date(),
      },
    });
    inactiveCardId = inactive.id;

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

  it('keeps RED cards independent of network protection', async () => {
    expect(await db.iPBlock.count()).toBe(0);
    expect(await db.moderationCard.findUniqueOrThrow({ where: { id: cardId } })).toMatchObject({
      status: 'ACTIVE',
      type: 'RED',
    });
  });

  it('rejects anonymous, lower-role, LIMITED and BANNED actors', async () => {
    await request(app.getHttpServer()).post(endpoint()).send(input).expect(401);
    for (const subject of [
      subjects.user,
      subjects.moderator,
      subjects.admin,
      subjects.limited,
      subjects.banned,
    ]) {
      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', 'Bearer ' + (await token(subject)))
        .send(input)
        .expect(403);
    }
    expect(await db.iPBlock.count()).toBe(0);
  }, 30000);

  it('requires active RED, explicit shared-IP acknowledgement and strict bounded input', async () => {
    const auth = 'Bearer ' + (await token(subjects.root));
    for (const invalid of [
      { ...input, sharedIpRiskAccepted: false },
      { ...input, sharedIpRiskAccepted: undefined },
      { ...input, duration: 'PERMANENT' },
      { ...input, duration: '30D' },
      { ...input, ipAddress: 'not-an-ip' },
      { ...input, ipAddress: '192.0.2.1, 192.0.2.2' },
      { ...input, actorUserId: ids.get(subjects.root) },
      { ...input, moderatorNote: ' ' },
      { ...input, reasonCode: 'invalid reason' },
    ]) {
      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', auth)
        .send(invalid)
        .expect(400);
    }
    await request(app.getHttpServer())
      .post('/api/v1/moderation/red-cards/' + randomUUID() + '/ip-protection')
      .set('Authorization', auth)
      .send(input)
      .expect(404);
    await request(app.getHttpServer())
      .post('/api/v1/moderation/red-cards/' + yellowCardId + '/ip-protection')
      .set('Authorization', auth)
      .send(input)
      .expect(404);
    await request(app.getHttpServer())
      .post('/api/v1/moderation/red-cards/' + inactiveCardId + '/ip-protection')
      .set('Authorization', auth)
      .send(input)
      .expect(409);
    expect(await db.iPBlock.count()).toBe(0);
  }, 30000);

  it('creates an audited SANCTION-sourced block, rejects duplication, revokes only IP', async () => {
    const auth = 'Bearer ' + (await token(subjects.root));
    const issued = await request(app.getHttpServer())
      .post(endpoint())
      .set('Authorization', auth)
      .send(input)
      .expect(201);
    const payload = issued.body as {
      data: { id: string; redCardId: string; sanctionId: string; active: boolean };
    };
    expect(payload.data).toMatchObject({ redCardId: cardId, active: true });
    expect(JSON.stringify(issued.body)).not.toContain(address);
    expect(JSON.stringify(issued.body)).not.toContain(note);
    expect(JSON.stringify(issued.body)).not.toContain('ipHash');

    const block = await db.iPBlock.findUniqueOrThrow({ where: { id: payload.data.id } });
    const sanction = await db.sanction.findUniqueOrThrow({
      where: { id: payload.data.sanctionId },
    });
    expect(block.source).toBe('SANCTION');
    expect(block.hashKeyVersion).toBe('v1');
    expect(block.ipHash).toMatch(/^[0-9a-f]{64}$/u);
    expect(block.createdById).toBe(ids.get(subjects.root));
    expect(block.expiresAt!.getTime() - block.startsAt.getTime()).toBe(60 * 60_000);
    expect(sanction).toMatchObject({
      type: 'IP_BLOCK',
      status: 'ACTIVE',
      sourceCardId: cardId,
      ipBlockId: block.id,
    });
    expect(sanction.userId).toBeNull();
    expect(
      await db.auditLog.count({ where: { moderationCardId: cardId, ipBlockId: block.id } }),
    ).toBe(2);
    expect(JSON.stringify(block)).not.toContain(address);

    // No second active block for the same card, even with another address.
    await request(app.getHttpServer())
      .post(endpoint())
      .set('Authorization', auth)
      .send({ ...input, ipAddress: '2001:db8::185' })
      .expect(409);
    expect(await db.iPBlock.count()).toBe(1);

    const revoke = endpoint() + '/' + block.id + '/revoke';
    await request(app.getHttpServer())
      .post(revoke)
      .set('Authorization', 'Bearer ' + (await token(subjects.admin)))
      .send({ reasonCode: 'FALSE_POSITIVE', moderatorNote: 'Cannot revoke' })
      .expect(403);
    const reversed = await request(app.getHttpServer())
      .post(revoke)
      .set('Authorization', auth)
      .send({ reasonCode: 'FALSE_POSITIVE', moderatorNote: 'Shared network impact' })
      .expect(200);
    expect((reversed.body as { data: { active: boolean } }).data.active).toBe(false);
    await request(app.getHttpServer())
      .post(revoke)
      .set('Authorization', auth)
      .send({ reasonCode: 'FALSE_POSITIVE', moderatorNote: 'Shared network impact' })
      .expect(409);
    expect(await db.auditLog.count({ where: { ipBlockId: block.id } })).toBe(4);
    expect((await db.sanction.findUniqueOrThrow({ where: { id: sanction.id } })).status).toBe(
      'REVOKED',
    );
    expect((await db.moderationCard.findUniqueOrThrow({ where: { id: cardId } })).status).toBe(
      'ACTIVE',
    );
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: ids.get(subjects.target)! } })).status,
    ).toBe('BANNED');
  }, 45000);

  it('expires a subsequent bounded block without restoring the banned account', async () => {
    const auth = 'Bearer ' + (await token(subjects.root));
    const issued = await request(app.getHttpServer())
      .post(endpoint())
      .set('Authorization', auth)
      .send({ ...input, ipAddress: '2001:db8::185', duration: '15M' })
      .expect(201);
    const id = (issued.body as { data: { id: string } }).data.id;
    await db.iPBlock.update({
      where: { id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await db.sanction.update({
      where: { ipBlockId: id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const worker = new SanctionExpirationService({ client: db } as WorkerDatabaseService);
    await worker.expireDueSanctions(new Date());
    const expired = await db.iPBlock.findUniqueOrThrow({ where: { id } });
    expect(expired.active).toBe(false);
    expect(await db.auditLog.count({ where: { ipBlockId: id, action: 'IP_BLOCK_EXPIRED' } })).toBe(
      1,
    );
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: ids.get(subjects.target)! } })).status,
    ).toBe('BANNED');
  }, 30000);
});
