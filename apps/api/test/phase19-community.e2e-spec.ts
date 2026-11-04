import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import type { INestApplication } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Test } from '@nestjs/testing';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import request from 'supertest';
import type { App } from 'supertest/types';

describe('Phase 19 real HTTP community acceptance (disposable PostgreSQL + Redis)', () => {
  let app: INestApplication<App>;
  let db: DatabaseClient;
  let jwksServer: Server;
  let signingKey: KeyLike;

  const suffix = randomUUID().slice(0, 8);
  const authorSubject = `phase19-author-${suffix}`;
  const visitorSubject = `phase19-visitor-${suffix}`;
  const moderatorSubject = `phase19-moderator-${suffix}`;

  let articleId: string;
  let authorId: string;
  let visitorId: string;
  let moderatorId: string;

  async function token(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: `phase19-${suffix}` })
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
      throw new Error('Refusing to run Phase 19 tests outside disposable local services');
    }

    const keyPair = await generateKeyPair('RS256');
    signingKey = keyPair.privateKey;
    const publicKey = {
      ...(await exportJWK(keyPair.publicKey)),
      kid: `phase19-${suffix}`,
      alg: 'RS256',
      use: 'sig',
    };
    jwksServer = createServer((_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ keys: [publicKey] }));
    });
    await new Promise<void>((resolve) => jwksServer.listen(0, '127.0.0.1', resolve));
    process.env.KEYCLOAK_JWKS_URL = `http://127.0.0.1:${(jwksServer.address() as AddressInfo).port}/jwks`;

    db = createPrismaClient();
    const [author, visitor, moderator, article] = await Promise.all([
      db.user.create({
        data: {
          keycloakSubject: authorSubject,
          nickname: `author${suffix}`,
          onboardingCompleted: true,
          fanPreference: 'NEUTRAL',
          roleAssignments: { create: { role: 'USER' } },
        },
        select: { id: true },
      }),
      db.user.create({
        data: {
          keycloakSubject: visitorSubject,
          nickname: `visitor${suffix}`,
          onboardingCompleted: true,
          fanPreference: 'NEUTRAL',
          roleAssignments: { create: { role: 'USER' } },
        },
        select: { id: true },
      }),
      db.user.create({
        data: {
          keycloakSubject: moderatorSubject,
          nickname: `moderator${suffix}`,
          onboardingCompleted: true,
          fanPreference: 'NEUTRAL',
          roleAssignments: { create: { role: 'MODERATOR' } },
        },
        select: { id: true },
      }),
      db.article.create({
        data: {
          title: 'Phase 19 isolated discussion',
          slug: `phase19-${suffix}`,
          status: 'PUBLISHED',
          content: { type: 'doc', content: [] },
        },
        select: { id: true },
      }),
    ]);
    authorId = author.id;
    visitorId = visitor.id;
    moderatorId = moderator.id;
    articleId = article.id;

    const { AppModule } =
      (await import('../src/app.module')) as unknown as typeof import('../src/app.module');
    const { configureApplication } =
      (await import('../src/bootstrap')) as unknown as typeof import('../src/bootstrap');
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    configureApplication(app);
    await app.init();
  }, 25000);

  afterAll(async () => {
    await app?.close();
    await db?.$disconnect();
    if (jwksServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        jwksServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('enforces author ownership, reply permissions and Redis spam guards', async () => {
    const authorToken = await token(authorSubject);
    const visitorToken = await token(visitorSubject);
    const root = await request(app.getHttpServer())
      .post(`/api/v1/articles/${articleId}/comments`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ body: 'Phase 19 root with real Redis spam protection' })
      .expect(201);
    const rootId = (root.body as { data: { id: string } }).data.id;

    // Duplicate check happens before cooldown check.
    const duplicate = await request(app.getHttpServer())
      .post(`/api/v1/articles/${articleId}/comments`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ body: 'Phase 19 root with real Redis spam protection' })
      .expect(409);
    expect((duplicate.body as { code: string }).code).toBe('COMMENT_DUPLICATE_SPAM');

    const cooldown = await request(app.getHttpServer())
      .post(`/api/v1/articles/${articleId}/comments`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ body: 'A different comment during cooldown' })
      .expect(429);
    expect((cooldown.body as { code: string }).code).toBe('COMMENT_POST_COOLDOWN');

    await request(app.getHttpServer())
      .delete(`/api/v1/articles/${articleId}/comments/${rootId}`)
      .set('Authorization', `Bearer ${visitorToken}`)
      .expect(403);

    const reply = await request(app.getHttpServer())
      .post(`/api/v1/articles/${articleId}/comments/${rootId}/replies`)
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ body: 'A reply from a different ACTIVE account' })
      .expect(201);
    expect((reply.body as { data: { parentId: string } }).data.parentId).toBe(rootId);

    await request(app.getHttpServer())
      .patch(`/api/v1/articles/${articleId}/comments/${rootId}`)
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ body: 'Cannot edit another persons comment' })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/v1/articles/${articleId}/comments/${rootId}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ body: 'Phase 19 root edited by original author' })
      .expect(200);
    const persisted = await db.comment.findUniqueOrThrow({ where: { id: rootId } });
    expect(persisted.editedAt).not.toBeNull();
    expect(await db.commentRevision.count({ where: { commentId: rootId } })).toBe(1);

    await request(app.getHttpServer())
      .delete(`/api/v1/articles/${articleId}/comments/${rootId}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .expect(200);
    expect((await db.comment.findUniqueOrThrow({ where: { id: rootId } })).status).toBe(
      'DELETED',
    );
  }, 25000);

  it('verifies up/down votes, report rules, and an audited moderator deletion', async () => {
    const authorToken = await token(authorSubject);
    const visitorToken = await token(visitorSubject);
    const moderatorToken = await token(moderatorSubject);
    const comment = await db.comment.create({
      data: {
        articleId,
        authorId,
        body: 'A seeded comment to vote, report and moderate',
      },
      select: { id: true },
    });
    const endpoint = `/api/v1/comments/${comment.id}`;

    await request(app.getHttpServer())
      .put(`${endpoint}/votes`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ type: 'UPVOTE' })
      .expect(403);

    await request(app.getHttpServer())
      .put(`${endpoint}/votes`)
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ type: 'UPVOTE' })
      .expect(200);
    await request(app.getHttpServer())
      .put(`${endpoint}/votes`)
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ type: 'DOWNVOTE' })
      .expect(200);
    expect(await db.reaction.count({ where: { commentId: comment.id } })).toBe(1);

    await request(app.getHttpServer())
      .post(`${endpoint}/reports`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ reason: 'SPAM' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`${endpoint}/reports`)
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ reason: 'HARASSMENT', details: 'Testmeldung für die Abnahme' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`${endpoint}/reports`)
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ reason: 'SPAM' })
      .expect(409);
    expect(await db.moderationReport.count({ where: { commentId: comment.id } })).toBe(1);

    await request(app.getHttpServer())
      .delete(`/api/v1/moderation/comments/${comment.id}`)
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ reason: 'Beleidigung in der Diskussion' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/v1/moderation/comments/${comment.id}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ reason: 'Beleidigung in der Diskussion' })
      .expect(200);

    const deleted = await db.comment.findUniqueOrThrow({ where: { id: comment.id } });
    expect(deleted.status).toBe('DELETED');
    expect(deleted.moderatedAt).not.toBeNull();
    const audit = await db.auditLog.findFirstOrThrow({
      where: { action: 'COMMENT_DELETED_BY_MODERATOR', targetId: comment.id },
    });
    expect(audit.actorUserId).toBe(moderatorId);
    expect(audit.targetUserId).toBe(authorId);
    expect(audit.reason).toBe('Beleidigung in der Diskussion');

    await request(app.getHttpServer())
      .delete(`/api/v1/moderation/comments/${comment.id}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ reason: 'No duplicate moderation' })
      .expect(404);
    expect(
      await db.auditLog.count({
        where: { action: 'COMMENT_DELETED_BY_MODERATOR', targetId: comment.id },
      }),
    ).toBe(1);
  }, 25000);

  it('paginates discussions by cursor with all three sort modes', async () => {
    await db.comment.createMany({
      data: Array.from({ length: 26 }, (_, index) => ({
        articleId,
        authorId: index % 2 === 0 ? authorId : visitorId,
        body: `Pagination seed ${index}`,
        createdAt: new Date(Date.UTC(2026, 10, 4, 0, index)),
      })),
    });

    const first = await request(app.getHttpServer())
      .get(`/api/v1/articles/${articleId}/comments`)
      .query({ sort: 'newest' })
      .expect(200);
    const page = (first.body as {
      data: {
        items: Array<{ id: string }>;
        pagination: { nextCursor: string | null; hasNextPage: boolean };
      };
    }).data;
    expect(page.pagination.hasNextPage).toBe(true);
    expect(page.items).toHaveLength(20);

    const second = await request(app.getHttpServer())
      .get(`/api/v1/articles/${articleId}/comments`)
      .query({ sort: 'newest', cursor: page.pagination.nextCursor })
      .expect(200);
    const next = (second.body as { data: { items: Array<{ id: string }> } }).data;
    const allIds = [...page.items, ...next.items].map((item) => item.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(allIds.length).toBeGreaterThanOrEqual(26);

    for (const sort of ['oldest', 'popular']) {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/articles/${articleId}/comments`)
        .query({ sort })
        .expect(200);
      expect((response.body as { data: { items: unknown[] } }).data.items.length).toBe(20);
    }
  }, 25000);
});
