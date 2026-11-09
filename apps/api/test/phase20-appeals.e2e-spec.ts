import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import request from 'supertest';
import type { App } from 'supertest/types';

describe('Task 189 – BANNED appeal identity, private filing and audited review HTTP E2E', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwks: Server;
  let signingKey: KeyLike;
  const tag = randomUUID().slice(0, 8);
  const subjects = {
    banned: 'p189-banned-' + tag,
    admin: 'p189-admin-' + tag,
    root: 'p189-root-' + tag,
    mod: 'p189-mod-' + tag,
    editor: 'p189-editor-' + tag,
    user: 'p189-user-' + tag,
    other: 'p189-other-' + tag,
    selfAdmin: 'p189-self-admin-' + tag,
  };
  const ids = new Map<string, string>();
  const ownReason = 'I disagree with the original moderation decision for my account.';
  const privateNote = 'P189_PRIVATE_STAFF_DECISION_NOT_FOR_APPELLANT';
  let redId: string;
  let banId: string;
  let selfCardId: string;
  let otherCardId: string;
  let ipSanctionId: string;
  let blockId: string;
  let redAppealId: string;
  let banAppealId: string;
  let selfAppealId: string;
  const previousJwks = process.env.KEYCLOAK_JWKS_URL;

  async function signedToken(subject: string) {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p189-' + tag })
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
      throw new Error('P189_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }

    const keys = await generateKeyPair('RS256');
    signingKey = keys.privateKey;
    const publicKey = {
      ...(await exportJWK(keys.publicKey)),
      kid: 'p189-' + tag,
      use: 'sig',
      alg: 'RS256',
    };
    jwks = createServer((_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ keys: [publicKey] }));
    });
    await new Promise<void>((resolve) => jwks.listen(0, '127.0.0.1', resolve));
    process.env.KEYCLOAK_JWKS_URL =
      'http://127.0.0.1:' + (jwks.address() as AddressInfo).port + '/jwks';

    database = createPrismaClient();
    for (const [subject, role, status] of [
      [subjects.banned, 'USER', 'BANNED'],
      [subjects.admin, 'ADMIN', 'ACTIVE'],
      [subjects.root, 'SUPERADMIN', 'ACTIVE'],
      [subjects.mod, 'MODERATOR', 'ACTIVE'],
      [subjects.editor, 'EDITOR', 'ACTIVE'],
      [subjects.user, 'USER', 'ACTIVE'],
      [subjects.other, 'USER', 'ACTIVE'],
      [subjects.selfAdmin, 'ADMIN', 'ACTIVE'],
    ] as const) {
      const created = await database.user.create({
        data: {
          keycloakSubject: subject,
          nickname: 'p189-' + subject,
          status,
          onboardingCompleted: true,
          roleAssignments: { create: { role } },
        },
        select: { id: true },
      });
      ids.set(subject, created.id);
    }

    const targetId = ids.get(subjects.banned)!;
    redId = (
      await database.moderationCard.create({
        data: {
          userId: targetId,
          moderatorId: ids.get(subjects.mod),
          type: 'RED',
          status: 'ACTIVE',
          reasonCode: 'P189_RED',
          moderatorNote: privateNote,
          escalationSource: 'MANUAL',
        },
        select: { id: true },
      })
    ).id;
    banId = (
      await database.sanction.create({
        data: {
          userId: targetId,
          createdById: ids.get(subjects.admin),
          type: 'ACCOUNT_BAN',
          status: 'ACTIVE',
          reasonCode: 'P189_ACCOUNT_BAN',
          internalNote: privateNote,
          startsAt: new Date(Date.now() - 3600000),
        },
        select: { id: true },
      })
    ).id;
    otherCardId = (
      await database.moderationCard.create({
        data: {
          userId: ids.get(subjects.other)!,
          moderatorId: ids.get(subjects.mod),
          type: 'YELLOW',
          reasonCode: 'P189_OTHER_USER',
          moderatorNote: 'OTHER_USER_ONLY_PRIVATE_NOTE',
        },
        select: { id: true },
      })
    ).id;
    selfCardId = (
      await database.moderationCard.create({
        data: {
          userId: ids.get(subjects.selfAdmin)!,
          moderatorId: ids.get(subjects.mod),
          type: 'YELLOW',
          reasonCode: 'P189_SELF_REVIEW',
        },
        select: { id: true },
      })
    ).id;
    blockId = (
      await database.iPBlock.create({
        data: {
          ipHash: 'b'.repeat(64),
          hashKeyVersion: 'v1',
          source: 'SANCTION',
          reasonCode: 'P189_IP_PRIVATE',
          internalNote: privateNote,
          createdById: ids.get(subjects.root),
          active: true,
        },
        select: { id: true },
      })
    ).id;
    ipSanctionId = (
      await database.sanction.create({
        data: {
          userId: targetId,
          createdById: ids.get(subjects.root),
          type: 'IP_BLOCK',
          status: 'ACTIVE',
          reasonCode: 'P189_IP_NOT_APPEALABLE_HERE',
          internalNote: privateNote,
          ipBlockId: blockId,
        },
        select: { id: true },
      })
    ).id;

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
    try {
      if (app) await app.close();
      if (database) {
        const owners = [...ids.values()];
        if (owners.length) {
          await database.notification.deleteMany({ where: { userId: { in: owners } } });
          await database.auditLog.deleteMany({
            where: {
              OR: [{ actorUserId: { in: owners } }, { targetUserId: { in: owners } }],
            },
          });
          await database.appeal.deleteMany({ where: { userId: { in: owners } } });
          await database.sanction.deleteMany({ where: { userId: { in: owners } } });
          await database.moderationCard.deleteMany({ where: { userId: { in: owners } } });
          if (blockId) await database.iPBlock.delete({ where: { id: blockId } });
          await database.userRoleAssignment.deleteMany({ where: { userId: { in: owners } } });
          await database.user.deleteMany({ where: { id: { in: owners } } });
        }
        await database.$disconnect();
      }
    } finally {
      if (jwks?.listening) {
        await new Promise<void>((resolve, reject) =>
          jwks.close((error) => (error ? reject(error) : resolve())),
        );
      }
      if (previousJwks === undefined) delete process.env.KEYCLOAK_JWKS_URL;
      else process.env.KEYCLOAK_JWKS_URL = previousJwks;
    }
  });

  it('only opens personal appeals via verified JWT, not general BANNED auth', async () => {
    const http = app.getHttpServer();
    await request(http).get('/api/v1/appeals/eligible').expect(401);
    await request(http).get('/api/v1/appeals/mine').expect(401);
    await request(http)
      .post('/api/v1/appeals')
      .send({ reason: ownReason, moderationCardId: redId })
      .expect(401);

    const auth = 'Bearer ' + (await signedToken(subjects.banned));
    await request(http).get('/api/v1/auth/me').set('Authorization', auth).expect(403);
    await request(http).get('/api/v1/moderation/appeals').set('Authorization', auth).expect(403);

    const eligible = await request(http)
      .get('/api/v1/appeals/eligible')
      .set('Authorization', auth)
      .expect(200);
    const data = (
      eligible.body as {
        data: {
          cards: Array<{ id: string }>;
          sanctions: Array<{ id: string; type: string }>;
        };
      }
    ).data;
    expect(eligible.headers['cache-control']).toContain('no-store');
    expect(data.cards.some((item) => item.id === redId)).toBe(true);
    expect(data.sanctions.some((item) => item.id === banId)).toBe(true);
    expect(data.sanctions.some((item) => item.id === ipSanctionId)).toBe(false);
    expect(JSON.stringify(eligible.body)).not.toContain(privateNote);
    expect(JSON.stringify(eligible.body)).not.toContain('ipHash');
  }, 30000);

  it('allows BANNED to file only for owned sanctions/cards, with atomic dedupe', async () => {
    const auth = 'Bearer ' + (await signedToken(subjects.banned));
    const http = app.getHttpServer();

    await request(http)
      .post('/api/v1/appeals')
      .set('Authorization', auth)
      .send({ moderationCardId: otherCardId, reason: ownReason })
      .expect(404);
    await request(http)
      .post('/api/v1/appeals')
      .set('Authorization', auth)
      .send({ sanctionId: ipSanctionId, reason: ownReason })
      .expect(404);
    await request(http)
      .post('/api/v1/appeals')
      .set('Authorization', auth)
      .send({ moderationCardId: redId, sanctionId: banId, reason: ownReason })
      .expect(400);
    await request(http)
      .post('/api/v1/appeals')
      .set('Authorization', auth)
      .send({ moderationCardId: redId, reason: 'short' })
      .expect(400);

    const appeal = await request(http)
      .post('/api/v1/appeals')
      .set('Authorization', auth)
      .send({ moderationCardId: redId, reason: ownReason })
      .expect(201);
    redAppealId = (appeal.body as { data: { id: string } }).data.id;
    expect(appeal.headers['cache-control']).toContain('no-store');
    await request(http)
      .post('/api/v1/appeals')
      .set('Authorization', auth)
      .send({ moderationCardId: redId, reason: ownReason })
      .expect(409);

    const second = await request(http)
      .post('/api/v1/appeals')
      .set('Authorization', auth)
      .send({ sanctionId: banId, reason: ownReason })
      .expect(201);
    banAppealId = (second.body as { data: { id: string } }).data.id;

    const mine = await request(http)
      .get('/api/v1/appeals/mine')
      .set('Authorization', auth)
      .expect(200);
    const serialized = JSON.stringify(mine.body);
    expect(serialized).toContain(redAppealId);
    expect(serialized).toContain(banAppealId);
    expect(serialized).not.toContain(privateNote);
    expect(serialized).not.toContain('reviewedById');
    expect(serialized).not.toContain('decisionNote');

    const otherMine = await request(http)
      .get('/api/v1/appeals/mine')
      .set('Authorization', 'Bearer ' + (await signedToken(subjects.other)))
      .expect(200);
    expect((otherMine.body as { data: unknown[] }).data).toEqual([]);
  }, 30000);

  it('requires staff for queue and ADMIN for decisions, forbids self-review', async () => {
    const http = app.getHttpServer();
    const moderator = 'Bearer ' + (await signedToken(subjects.mod));
    const admin = 'Bearer ' + (await signedToken(subjects.admin));
    const user = 'Bearer ' + (await signedToken(subjects.user));

    await request(http).get('/api/v1/moderation/appeals').set('Authorization', user).expect(403);
    const queue = await request(http)
      .get('/api/v1/moderation/appeals')
      .set('Authorization', moderator)
      .expect(200);
    expect(JSON.stringify(queue.body)).toContain(redAppealId);
    expect(JSON.stringify(queue.body)).not.toContain(privateNote);
    await request(http)
      .patch('/api/v1/moderation/appeals/' + redAppealId + '/decision')
      .set('Authorization', moderator)
      .send({ decision: 'ACCEPTED', decisionNote: privateNote })
      .expect(403);

    const applicant = 'Bearer ' + (await signedToken(subjects.selfAdmin));
    const own = await request(http)
      .post('/api/v1/appeals')
      .set('Authorization', applicant)
      .send({ moderationCardId: selfCardId, reason: ownReason })
      .expect(201);
    selfAppealId = (own.body as { data: { id: string } }).data.id;
    await request(http)
      .patch('/api/v1/moderation/appeals/' + selfAppealId + '/decision')
      .set('Authorization', applicant)
      .send({ decision: 'ACCEPTED', decisionNote: privateNote })
      .expect(403);

    const rejected = await request(http)
      .patch('/api/v1/moderation/appeals/' + selfAppealId + '/decision')
      .set('Authorization', admin)
      .send({ decision: 'REJECTED', decisionNote: privateNote })
      .expect(200);
    expect((rejected.body as { data: { status: string } }).data.status).toBe('REJECTED');
    expect(JSON.stringify(rejected.body)).not.toContain(privateNote);
    expect(
      (await database.moderationCard.findUniqueOrThrow({ where: { id: selfCardId } })).status,
    ).toBe('ACTIVE');
  }, 30000);

  it('accepts only the targeted RED, keeps BANNED while another ban remains, then restores safely', async () => {
    const http = app.getHttpServer();
    const reviewer = 'Bearer ' + (await signedToken(subjects.root));
    const bannedAuth = 'Bearer ' + (await signedToken(subjects.banned));
    const first = await request(http)
      .patch('/api/v1/moderation/appeals/' + redAppealId + '/decision')
      .set('Authorization', reviewer)
      .send({ decision: 'ACCEPTED', decisionNote: privateNote })
      .expect(200);
    expect((first.body as { data: { status: string } }).data.status).toBe('ACCEPTED');
    expect(JSON.stringify(first.body)).not.toContain(privateNote);
    expect((await database.moderationCard.findUniqueOrThrow({ where: { id: redId } })).status).toBe(
      'REVOKED',
    );
    expect(
      (await database.user.findUniqueOrThrow({ where: { id: ids.get(subjects.banned)! } })).status,
    ).toBe('BANNED');
    await request(http).get('/api/v1/auth/me').set('Authorization', bannedAuth).expect(403);
    await request(http)
      .patch('/api/v1/moderation/appeals/' + redAppealId + '/decision')
      .set('Authorization', reviewer)
      .send({ decision: 'ACCEPTED', decisionNote: privateNote })
      .expect(409);

    const second = await request(http)
      .patch('/api/v1/moderation/appeals/' + banAppealId + '/decision')
      .set('Authorization', reviewer)
      .send({ decision: 'ACCEPTED', decisionNote: privateNote })
      .expect(200);
    expect((second.body as { data: { status: string } }).data.status).toBe('ACCEPTED');
    expect((await database.sanction.findUniqueOrThrow({ where: { id: banId } })).status).toBe(
      'REVOKED',
    );
    expect(
      (await database.user.findUniqueOrThrow({ where: { id: ids.get(subjects.banned)! } })).status,
    ).toBe('ACTIVE');

    // A normal appeal review never changes the separate SUPERADMIN IP-block.
    expect((await database.iPBlock.findUniqueOrThrow({ where: { id: blockId } })).active).toBe(
      true,
    );
    expect(
      (await database.sanction.findUniqueOrThrow({ where: { id: ipSanctionId } })).status,
    ).toBe('ACTIVE');

    const own = await request(http)
      .get('/api/v1/appeals/mine')
      .set('Authorization', bannedAuth)
      .expect(200);
    expect(JSON.stringify(own.body)).not.toContain(privateNote);
    expect(
      await database.auditLog.count({
        where: { targetUserId: ids.get(subjects.banned), action: 'APPEAL_RESOLVED' },
      }),
    ).toBe(2);
    expect(
      await database.notification.count({
        where: { userId: ids.get(subjects.banned), type: 'APPEAL' },
      }),
    ).toBe(4);
  }, 30000);
});
