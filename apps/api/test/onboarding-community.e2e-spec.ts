import { createServer, type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import request from 'supertest';
import type { App } from 'supertest/types';

describe('Onboarding community HTTP integration with isolated PostgreSQL and Redis', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwksServer: Server;
  let signingKey: KeyLike;
  let articleId: string;

  const suffix = randomUUID().slice(0, 8);
  const authorSubject = `e2e-onboarding-author-${suffix}`;
  const voterSubject = `e2e-onboarding-voter-${suffix}`;

  async function signToken(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'e2e-onboarding' })
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
      throw new Error('Only disposable local PostgreSQL and Redis are permitted');
    }

    const keyPair = await generateKeyPair('RS256');
    signingKey = keyPair.privateKey;
    const publicJwk = {
      ...(await exportJWK(keyPair.publicKey)),
      kid: 'e2e-onboarding',
      alg: 'RS256',
      use: 'sig',
    };

    jwksServer = createServer((_req, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ keys: [publicJwk] }));
    });

    await new Promise<void>((resolve) => jwksServer.listen(0, '127.0.0.1', resolve));
    const address = jwksServer.address() as AddressInfo;
    process.env.KEYCLOAK_JWKS_URL = `http://127.0.0.1:${address.port}/jwks`;

    const { AppModule } = await import('../src/app.module');
    const { configureApplication } = await import('../src/bootstrap');
    database = createPrismaClient();
    articleId = (
      await database.article.create({
        data: {
          title: 'Isolated onboarding acceptance',
          slug: `e2e-onboarding-${suffix}`,
          status: 'PUBLISHED',
          content: { type: 'doc', content: [] },
        },
        select: { id: true },
      })
    ).id;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
  }, 25000);

  afterAll(async () => {
    await app?.close();
    await database?.$disconnect();
    if (jwksServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        jwksServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('blocks incomplete users before writes, allows completed users and keeps BANNED/LIMITED rules', async () => {
    const authorToken = await signToken(authorSubject);
    const voterToken = await signToken(voterSubject);

    const incompleteAuthor = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authorToken}`)
      .expect(200);
    expect(incompleteAuthor.body.data.onboardingCompleted).toBe(false);

    await request(app.getHttpServer())
      .post(`/api/v1/articles/${articleId}/comments`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ body: 'This must not persist before onboarding.' })
      .expect(403);

    expect(await database.comment.count({ where: { articleId } })).toBe(0);

    await request(app.getHttpServer())
      .get('/api/v1/onboarding/nickname/availability')
      .query({ nickname: `user${suffix}` })
      .set('Authorization', `Bearer ${authorToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch('/api/v1/onboarding/complete')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ nickname: `user${suffix}`, fanPreference: 'NEUTRAL', favoriteClubId: null })
      .expect(200);

    const created = await request(app.getHttpServer())
      .post(`/api/v1/articles/${articleId}/comments`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ body: 'Comment created after successful onboarding.' })
      .expect(201);

    const commentId = created.body.data.id as string;
    expect(await database.comment.count({ where: { articleId } })).toBe(1);

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${voterToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/v1/comments/${commentId}/votes`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ type: 'UPVOTE' })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/comments/${commentId}/reports`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ reason: 'SPAM' })
      .expect(403);

    expect(await database.reaction.count({ where: { commentId } })).toBe(0);
    expect(await database.moderationReport.count({ where: { commentId } })).toBe(0);

    await request(app.getHttpServer())
      .patch('/api/v1/onboarding/complete')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ nickname: `voter${suffix}`, fanPreference: 'NEUTRAL', favoriteClubId: null })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/v1/comments/${commentId}/votes`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ type: 'UPVOTE' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/comments/${commentId}/reports`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ reason: 'SPAM' })
      .expect(201);

    const voter = await database.user.findUniqueOrThrow({
      where: { keycloakSubject: voterSubject },
    });
    await database.user.update({ where: { id: voter.id }, data: { status: 'LIMITED' } });

    await request(app.getHttpServer())
      .put(`/api/v1/comments/${commentId}/votes`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ type: 'DOWNVOTE' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/articles/${articleId}/comments`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ body: 'A LIMITED user cannot comment.' })
      .expect(403);

    await database.user.update({ where: { id: voter.id }, data: { status: 'BANNED' } });
    const banned = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${voterToken}`)
      .expect(403);
    expect(banned.body.code).toBe('ACCOUNT_BANNED');
  }, 25000);
});
