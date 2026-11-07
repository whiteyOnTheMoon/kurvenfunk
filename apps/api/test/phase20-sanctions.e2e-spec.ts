import { randomUUID } from 'node:crypto';
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

describe('Phase 20 LIMITED/BANNED/expiration isolated HTTP acceptance', () => {
  let app: INestApplication<App>;
  let db: DatabaseClient;
  let jwksServer: Server;
  let signingKey: KeyLike;
  let moderatorId: string;
  let limitedUserId: string;
  let bannedUserId: string;
  let articleId: string;
  let commentId: string;

  const suffix = randomUUID().slice(0, 8);
  const moderatorSubject = `phase20-mod-${suffix}`;
  const limitedSubject = `phase20-limited-${suffix}`;
  const bannedSubject = `phase20-banned-${suffix}`;
  const editorSubject = `phase20-editor-${suffix}`;

  async function token(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: `phase20-${suffix}` })
      .setSubject(subject)
      .setIssuer(process.env.KEYCLOAK_ISSUER!)
      .setAudience(process.env.KEYCLOAK_AUDIENCE!)
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(signingKey);
  }

  beforeAll(async () => {
    const databaseUrl = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      databaseUrl.hostname !== '127.0.0.1' ||
      databaseUrl.pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('Phase 20 test requires disposable local PostgreSQL and Redis');
    }

    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: `phase20-${suffix}`,
      alg: 'RS256',
      use: 'sig',
    };

    jwksServer = createServer((_req, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ keys: [publicKey] }));
    });
    await new Promise<void>((resolve) => jwksServer.listen(0, '127.0.0.1', resolve));
    const jwksAddress = jwksServer.address() as AddressInfo;
    process.env.KEYCLOAK_JWKS_URL = `http://127.0.0.1:${jwksAddress.port}/jwks`;

    db = createPrismaClient();
    const [moderator, limitedUser, bannedUser, editor, article] = await Promise.all([
      db.user.create({
        data: {
          keycloakSubject: moderatorSubject,
          nickname: `p20mod${suffix}`,
          status: 'ACTIVE',
          onboardingCompleted: true,
          roleAssignments: { create: { role: 'MODERATOR' } },
        },
        select: { id: true },
      }),
      db.user.create({
        data: {
          keycloakSubject: limitedSubject,
          nickname: `p20limited${suffix}`,
          status: 'ACTIVE',
          onboardingCompleted: true,
          roleAssignments: { create: { role: 'USER' } },
        },
        select: { id: true },
      }),
      db.user.create({
        data: {
          keycloakSubject: bannedSubject,
          nickname: `p20banned${suffix}`,
          status: 'BANNED',
          onboardingCompleted: true,
          roleAssignments: { create: { role: 'MODERATOR' } },
        },
        select: { id: true },
      }),
      db.user.create({
        data: {
          keycloakSubject: editorSubject,
          nickname: `p20editor${suffix}`,
          status: 'ACTIVE',
          onboardingCompleted: true,
          roleAssignments: { create: { role: 'EDITOR' } },
        },
        select: { id: true },
      }),
      db.article.create({
        data: {
          title: 'Phase 20 disposable authorization test',
          slug: `phase20-e2e-${suffix}`,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          content: { type: 'doc', content: [] },
        },
        select: { id: true },
      }),
    ]);
    moderatorId = moderator.id;
    limitedUserId = limitedUser.id;
    bannedUserId = bannedUser.id;
    expect(editor.id).toBeTruthy();
    articleId = article.id;

    commentId = (
      await db.comment.create({
        data: {
          articleId,
          authorId: moderatorId,
          body: 'Isolated Phase 20 voting and report target',
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
    await app?.close();
    await db?.$disconnect();
    if (jwksServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        jwksServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('enforces LIMITED permission matrix and restores ACTIVE on expiry', async () => {
    const moderatorToken = await token(moderatorSubject);
    const userToken = await token(limitedSubject);
    const editorToken = await token(editorSubject);
    const path = '/api/v1/moderation/limited-sanctions';
    const sanction = {
      userId: limitedUserId,
      duration: '24H',
      reasonCode: 'TEST_POLICY',
      moderatorNote: 'Private isolated evidence, never return this to the user',
      userMessage: 'Automated acceptance fixture',
    };

    await request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${userToken}`)
      .send(sanction)
      .expect(403);
    await request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${editorToken}`)
      .send(sanction)
      .expect(403);
    expect(await db.sanction.count({ where: { userId: limitedUserId } })).toBe(0);

    const created = await request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send(sanction)
      .expect(201);
    const response = created.body as {
      data: { id: string; accountStatus: string; expiresAt: string };
    };
    const sanctionId = response.data.id;
    expect(response.data.accountStatus).toBe('LIMITED');
    expect(new Date(response.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(JSON.stringify(created.body)).not.toContain(sanction.moderatorNote);

    expect((await db.user.findUniqueOrThrow({ where: { id: limitedUserId } })).status).toBe(
      'LIMITED',
    );
    expect(await db.sanction.count({ where: { userId: limitedUserId, type: 'LIMITED' } })).toBe(1);
    expect(
      await db.notification.count({
        where: { userId: limitedUserId, sourceId: sanctionId, type: 'LIMITED' },
      }),
    ).toBe(1);
    expect(
      await db.auditLog.count({
        where: { sanctionId, action: 'SANCTION_CREATED', actorUserId: moderatorId },
      }),
    ).toBe(1);

    await request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send(sanction)
      .expect(409);
    expect(await db.sanction.count({ where: { userId: limitedUserId } })).toBe(1);

    await request(app.getHttpServer())
      .post(`/api/v1/articles/${articleId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ body: 'This LIMITED comment must be rejected.' })
      .expect(403);
    await request(app.getHttpServer())
      .put(`/api/v1/comments/${commentId}/votes`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'UPVOTE' })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/comments/${commentId}/reports`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'SPAM' })
      .expect(201);

    const start = new Date(Date.now() - 3600000);
    await db.sanction.update({
      where: { id: sanctionId },
      data: { startsAt: start, expiresAt: new Date(Date.now() - 1000) },
    });
    const worker = new SanctionExpirationService({ client: db } as WorkerDatabaseService);
    await worker.expireDueSanctions(new Date());

    expect((await db.sanction.findUniqueOrThrow({ where: { id: sanctionId } })).status).toBe(
      'EXPIRED',
    );
    expect((await db.user.findUniqueOrThrow({ where: { id: limitedUserId } })).status).toBe(
      'ACTIVE',
    );
    expect(await db.auditLog.count({ where: { sanctionId, action: 'SANCTION_EXPIRED' } })).toBe(1);
    expect(
      await db.auditLog.count({
        where: { sanctionId, action: 'USER_STATUS_CHANGED', reason: 'LIMITED_EXPIRED' },
      }),
    ).toBe(1);

    await worker.expireDueSanctions(new Date());
    expect(await db.auditLog.count({ where: { sanctionId, action: 'SANCTION_EXPIRED' } })).toBe(1);

    const restored = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect((restored.body as { data: { status: string } }).data.status).toBe('ACTIVE');
  }, 30000);

  it('blocks BANNED tokens and never reactivates after LIMITED expiry', async () => {
    const bannedToken = await token(bannedSubject);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${bannedToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/moderation/limited-sanctions')
      .set('Authorization', `Bearer ${bannedToken}`)
      .send({
        userId: limitedUserId,
        duration: '24H',
        reasonCode: 'TEST_POLICY',
        moderatorNote: 'Must not be accepted from a banned moderator',
      })
      .expect(403);

    const expired = await db.sanction.create({
      data: {
        userId: bannedUserId,
        createdById: moderatorId,
        type: 'LIMITED',
        status: 'ACTIVE',
        reasonCode: 'OLDER_TEST_LIMIT',
        startsAt: new Date(Date.now() - 7200000),
        expiresAt: new Date(Date.now() - 1000),
      },
      select: { id: true },
    });

    const worker = new SanctionExpirationService({ client: db } as WorkerDatabaseService);
    await worker.expireDueSanctions(new Date());

    expect((await db.sanction.findUniqueOrThrow({ where: { id: expired.id } })).status).toBe(
      'EXPIRED',
    );
    expect((await db.user.findUniqueOrThrow({ where: { id: bannedUserId } })).status).toBe(
      'BANNED',
    );
    expect(
      await db.auditLog.count({
        where: { sanctionId: expired.id, reason: 'LIMITED_EXPIRED' },
      }),
    ).toBe(0);
  }, 25000);
  it.each([
    ['24H', 24],
    ['3D', 72],
    ['7D', 168],
    ['30D', 720],
  ] as const)(
    'stores %s LIMITED duration with audit and notification',
    async (duration, hours) => {
      const suffix178 = randomUUID().slice(0, 8);
      const subject = `phase20-duration-${suffix178}`;
      const target = await db.user.create({
        data: {
          keycloakSubject: subject,
          nickname: `p178${suffix178}`,
          status: 'ACTIVE',
          onboardingCompleted: true,
          roleAssignments: { create: { role: 'USER' } },
        },
        select: { id: true },
      });
      const moderatorToken = await token(moderatorSubject);
      const internalNote = 'Private evidence for the isolated duration acceptance test';
      const userMessage = 'Your account is temporarily limited.';

      const response = await request(app.getHttpServer())
        .post('/api/v1/moderation/limited-sanctions')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          userId: target.id,
          duration,
          reasonCode: 'TEST_POLICY',
          moderatorNote: internalNote,
          userMessage,
        })
        .expect(201);

      const body = response.body as {
        data: { id: string; userId: string; accountStatus: string; expiresAt: string };
      };
      expect(body.data).toMatchObject({
        userId: target.id,
        accountStatus: 'LIMITED',
      });
      expect(JSON.stringify(response.body)).not.toContain(internalNote);

      const sanction = await db.sanction.findUniqueOrThrow({
        where: { id: body.data.id },
        select: {
          type: true,
          status: true,
          userId: true,
          createdById: true,
          reasonCode: true,
          internalNote: true,
          userMessage: true,
          startsAt: true,
          expiresAt: true,
        },
      });
      expect(sanction).toMatchObject({
        userId: target.id,
        type: 'LIMITED',
        status: 'ACTIVE',
        createdById: moderatorId,
        reasonCode: 'TEST_POLICY',
        internalNote,
        userMessage,
      });
      expect(sanction.expiresAt!.getTime() - sanction.startsAt.getTime()).toBe(
        hours * 60 * 60 * 1000,
      );
      expect(new Date(body.data.expiresAt).getTime()).toBe(sanction.expiresAt!.getTime());
      expect((await db.user.findUniqueOrThrow({ where: { id: target.id } })).status).toBe(
        'LIMITED',
      );

      const notification = await db.notification.findFirstOrThrow({
        where: { userId: target.id, type: 'LIMITED', sourceId: body.data.id },
        select: { body: true, dedupeKey: true },
      });
      expect(notification.dedupeKey).toBe(`limited-sanction:${body.data.id}`);
      expect(notification.body).toContain(userMessage);
      expect(notification.body).not.toContain(internalNote);
      expect(
        await db.auditLog.count({
          where: {
            sanctionId: body.data.id,
            actorUserId: moderatorId,
            action: { in: ['SANCTION_CREATED', 'USER_STATUS_CHANGED'] },
          },
        }),
      ).toBe(2);
    },
    30000,
  );

  it('serializes concurrent LIMITED attempts', async () => {
    const suffix178 = randomUUID().slice(0, 8);
    const target = await db.user.create({
      data: {
        keycloakSubject: `phase20-race-${suffix178}`,
        nickname: `p178race${suffix178}`,
        status: 'ACTIVE',
        onboardingCompleted: true,
        roleAssignments: { create: { role: 'USER' } },
      },
      select: { id: true },
    });
    const moderatorToken = await token(moderatorSubject);
    const input = {
      userId: target.id,
      duration: '3D',
      reasonCode: 'TEST_POLICY',
      moderatorNote: 'Concurrency test, private note',
    };
    const outcomes = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/moderation/limited-sanctions')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send(input),
      request(app.getHttpServer())
        .post('/api/v1/moderation/limited-sanctions')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send(input),
    ]);

    expect(outcomes.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(
      await db.sanction.count({
        where: { userId: target.id, type: 'LIMITED', status: 'ACTIVE' },
      }),
    ).toBe(1);
    expect(await db.notification.count({ where: { userId: target.id, type: 'LIMITED' } })).toBe(1);
    expect(
      await db.auditLog.count({
        where: { targetUserId: target.id, action: 'SANCTION_CREATED' },
      }),
    ).toBe(1);
  }, 30000);

  it('rejects invalid, self and banned targets', async () => {
    const moderatorToken = await token(moderatorSubject);
    const input = {
      userId: randomUUID(),
      duration: '24H',
      reasonCode: 'TEST_POLICY',
      moderatorNote: 'Private validation fixture',
    };
    const path = '/api/v1/moderation/limited-sanctions';
    const previousBannedLimits = await db.sanction.count({
      where: { userId: bannedUserId, type: 'LIMITED' },
    });

    await request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ ...input, duration: 'FOREVER' })
      .expect(400);
    await request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ ...input, moderatorId })
      .expect(400);
    await request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ ...input, userId: moderatorId })
      .expect(400);
    await request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ ...input, userId: bannedUserId })
      .expect(409);
    await request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send(input)
      .expect(404);
    expect(await db.sanction.count({ where: { userId: bannedUserId, type: 'LIMITED' } })).toBe(
      previousBannedLimits,
    );
  }, 30000);

  it('Task 179: LIMITED can read and vote but cannot create, reply, edit or moderate', async () => {
    const idSuffix = randomUUID().slice(0, 8);
    const targetSubject = 'phase20-matrix-' + idSuffix;
    const target = await db.user.create({
      data: {
        keycloakSubject: targetSubject,
        nickname: 'p20matrix' + idSuffix,
        status: 'ACTIVE',
        onboardingCompleted: true,
        roleAssignments: { create: { role: 'USER' } },
      },
      select: { id: true },
    });
    const moderatorToken = await token(moderatorSubject);
    const userToken = await token(targetSubject);
    await request(app.getHttpServer())
      .post('/api/v1/moderation/limited-sanctions')
      .set('Authorization', 'Bearer ' + moderatorToken)
      .send({
        userId: target.id,
        duration: '24H',
        reasonCode: 'MATRIX_TEST',
        moderatorNote: 'Private isolated task179 acceptance',
      })
      .expect(201);

    const profile = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer ' + userToken)
      .expect(200);
    expect((profile.body as { data: { status: string } }).data.status).toBe('LIMITED');

    await request(app.getHttpServer()).get('/api/v1/articles?limit=10').expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/articles/by-slug/phase20-e2e-' + suffix)
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/articles/' + articleId + '/comments')
      .expect(200);
    await request(app.getHttpServer()).get('/api/v1/matches').expect(200);
    await request(app.getHttpServer()).get('/api/v1/competitions').expect(200);
    await request(app.getHttpServer()).get('/api/v1/clubs').expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/reactions/comments?ids=' + commentId)
      .expect(200);

    await request(app.getHttpServer())
      .put('/api/v1/comments/' + commentId + '/votes')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ type: 'UPVOTE' })
      .expect(200);
    const ownVote = await request(app.getHttpServer())
      .get('/api/v1/comments/' + commentId + '/votes/me')
      .set('Authorization', 'Bearer ' + userToken)
      .expect(200);
    expect((ownVote.body as { data: { viewerVote: string } }).data.viewerVote).toBe('UPVOTE');
    await request(app.getHttpServer())
      .delete('/api/v1/comments/' + commentId + '/votes')
      .set('Authorization', 'Bearer ' + userToken)
      .expect(200);

    const commentPath = '/api/v1/articles/' + articleId + '/comments';
    await request(app.getHttpServer())
      .post(commentPath)
      .set('Authorization', 'Bearer ' + userToken)
      .send({ body: 'LIMITED must not post' })
      .expect(403);
    await request(app.getHttpServer())
      .post(commentPath + '/' + commentId + '/replies')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ body: 'LIMITED must not reply' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(commentPath + '/' + commentId)
      .set('Authorization', 'Bearer ' + userToken)
      .send({ body: 'LIMITED must not edit' })
      .expect(403);
    await request(app.getHttpServer())
      .delete(commentPath + '/' + commentId)
      .set('Authorization', 'Bearer ' + userToken)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/moderation/comment-reports')
      .set('Authorization', 'Bearer ' + userToken)
      .expect(403);
    expect(
      await db.comment.count({
        where: { articleId, authorId: target.id },
      }),
    ).toBe(0);
  }, 30000);

  it('Task 179: LIMITED elevated moderator cannot use moderation or posting permissions', async () => {
    const idSuffix = randomUUID().slice(0, 8);
    const subject = 'phase20-matrix-moderator-' + idSuffix;
    await db.user.create({
      data: {
        keycloakSubject: subject,
        nickname: 'p20matrixmod' + idSuffix,
        status: 'LIMITED',
        onboardingCompleted: true,
        roleAssignments: { create: { role: 'MODERATOR' } },
      },
    });
    const accessToken = await token(subject);
    await request(app.getHttpServer())
      .post('/api/v1/articles/' + articleId + '/comments')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ body: 'Must not bypass with MODERATOR role' })
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/moderation/comment-reports')
      .set('Authorization', 'Bearer ' + accessToken)
      .expect(403);
    await request(app.getHttpServer())
      .put('/api/v1/comments/' + commentId + '/votes')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ type: 'DOWNVOTE' })
      .expect(200);
  }, 30000);
});
