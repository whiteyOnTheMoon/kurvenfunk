import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import request from 'supertest';
import type { App } from 'supertest/types';

function dataOf<T>(response: { body: unknown }): T {
  return (response.body as { data: T }).data;
}

describe('Phase 22.222 – isolated forum report lifecycle HTTP/PostgreSQL', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwks: Server;
  let signingKey: KeyLike;
  const marker = randomUUID().slice(0, 8);
  const previousJwks = process.env.KEYCLOAK_JWKS_URL;
  const users = new Map<string, string>();
  const subjects = {
    author: 'p222-author-' + marker,
    reporter: 'p222-reporter-' + marker,
    limited: 'p222-limited-' + marker,
    moderator: 'p222-moderator-' + marker,
  };
  let categoryId = '';
  let forumId = '';
  let threadId = '';
  let postId = '';
  let secondPostId = '';
  const forumSlug = 'p222-forum-' + marker;
  const threadSlug = 'p222-topic-' + marker;
  const target = '/api/v1/forums/by-slug/' + forumSlug + '/threads/' + threadSlug;
  const queue = '/api/v1/moderation/forum-post-reports';

  async function tokenFor(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p222-' + marker })
      .setSubject(subject)
      .setIssuer(process.env.KEYCLOAK_ISSUER!)
      .setAudience(process.env.KEYCLOAK_AUDIENCE!)
      .setIssuedAt()
      .setExpirationTime('15m')
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
      throw new Error('PHASE22_222_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }

    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: 'p222-' + marker,
      use: 'sig',
      alg: 'RS256',
    };
    jwks = createServer((_req, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ keys: [publicKey] }));
    });
    await new Promise<void>((resolve) => jwks.listen(0, '127.0.0.1', resolve));
    process.env.KEYCLOAK_JWKS_URL =
      'http://127.0.0.1:' + (jwks.address() as AddressInfo).port + '/jwks';

    database = createPrismaClient();
    for (const member of [
      { subject: subjects.author, role: 'USER', status: 'ACTIVE' },
      { subject: subjects.reporter, role: 'USER', status: 'ACTIVE' },
      { subject: subjects.limited, role: 'USER', status: 'LIMITED' },
      { subject: subjects.moderator, role: 'MODERATOR', status: 'ACTIVE' },
    ] as const) {
      const user = await database.user.create({
        data: {
          keycloakSubject: member.subject,
          nickname: member.subject,
          status: member.status,
          onboardingCompleted: true,
          roleAssignments: { create: { role: member.role } },
        },
        select: { id: true },
      });
      users.set(member.subject, user.id);
    }

    const category = await database.forumCategory.create({
      data: { name: 'Test ' + marker, slug: 'p222-category-' + marker },
      select: { id: true },
    });
    categoryId = category.id;
    const forum = await database.forum.create({
      data: { categoryId, name: 'Test ' + marker, slug: forumSlug },
      select: { id: true },
    });
    forumId = forum.id;
    const thread = await database.thread.create({
      data: {
        forumId,
        authorId: users.get(subjects.author)!,
        title: 'Phase 222 Test',
        slug: threadSlug,
      },
      select: { id: true },
    });
    threadId = thread.id;
    const first = await database.post.create({
      data: {
        threadId,
        authorId: users.get(subjects.author)!,
        sequenceNumber: 1,
        content: 'Ein öffentlicher Beispielbeitrag in einer isolierten Datenbank',
      },
      select: { id: true },
    });
    postId = first.id;
    const second = await database.post.create({
      data: {
        threadId,
        authorId: users.get(subjects.author)!,
        sequenceNumber: 2,
        content: 'Ein zweiter isolierter Beitrag',
      },
      select: { id: true },
    });
    secondPostId = second.id;
    await database.thread.update({
      where: { id: threadId },
      data: {
        postCount: 2,
        lastPostSequenceNumber: 2,
        lastPostId: secondPostId,
        lastPostAt: new Date(),
      },
    });

    const { AppModule } =
      (await import('../src/app.module')) as unknown as typeof import('../src/app.module');
    const { configureApplication } =
      (await import('../src/bootstrap')) as unknown as typeof import('../src/bootstrap');
    const ref = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = ref.createNestApplication();
    configureApplication(app);
    await app.init();
  }, 30000);

  afterAll(async () => {
    try {
      if (app) await app.close();
      if (database) {
        // All mutations belong exclusively to this disposable E2E database.
        await database.moderationReport.deleteMany({ where: { postId: { in: [postId, secondPostId] } } });
        await database.auditLog.deleteMany({
          where: {
            OR: [
              { targetId: { in: [postId, secondPostId] } },
              { targetType: 'MODERATION_REPORT', moderationReportId: { not: null } },
            ],
          },
        });
        if (threadId) {
          await database.thread.update({ where: { id: threadId }, data: { lastPostId: null } });
          await database.post.deleteMany({ where: { threadId } });
          await database.thread.delete({ where: { id: threadId } });
        }
        if (forumId) await database.forum.delete({ where: { id: forumId } });
        if (categoryId) await database.forumCategory.delete({ where: { id: categoryId } });
        const ids = [...users.values()];
        await database.userRoleAssignment.deleteMany({ where: { userId: { in: ids } } });
        await database.user.deleteMany({ where: { id: { in: ids } } });
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

  it('refuses anonymous reporting and moderator queue access to members', async () => {
    await request(app.getHttpServer()).post(target + '/posts/' + postId + '/reports')
      .send({ reason: 'SPAM' }).expect(401);
    await request(app.getHttpServer()).get(queue).expect(401);
    await request(app.getHttpServer()).get(queue)
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.reporter))).expect(403);
    await request(app.getHttpServer()).post('/api/v1/moderation/forum-posts/' + postId + '/remove')
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.reporter)))
      .send({ reason: 'Regelwidrig' }).expect(403);
  });

  it('validates reason, own-post protection and public scope', async () => {
    const reporter = await tokenFor(subjects.reporter);
    const author = await tokenFor(subjects.author);
    const route = target + '/posts/' + postId + '/reports';
    await request(app.getHttpServer()).post(route)
      .set('Authorization', 'Bearer ' + reporter)
      .send({ reason: 'INVALID' }).expect(400);
    await request(app.getHttpServer()).post(route)
      .set('Authorization', 'Bearer ' + reporter)
      .send({ reason: 'SPAM', details: '   ' }).expect(400);
    await request(app.getHttpServer()).post(route)
      .set('Authorization', 'Bearer ' + author)
      .send({ reason: 'SPAM' }).expect(403);
    await request(app.getHttpServer()).post(target + '/posts/' + randomUUID() + '/reports')
      .set('Authorization', 'Bearer ' + reporter)
      .send({ reason: 'SPAM' }).expect(404);

    await database.forumCategory.update({ where: { id: categoryId }, data: { active: false } });
    try {
      await request(app.getHttpServer()).post(route)
        .set('Authorization', 'Bearer ' + reporter)
        .send({ reason: 'SPAM' }).expect(404);
    } finally {
      await database.forumCategory.update({ where: { id: categoryId }, data: { active: true } });
    }
  });

  it('creates exactly one report for parallel submissions with same user/post', async () => {
    const token = await tokenFor(subjects.reporter);
    const route = target + '/posts/' + postId + '/reports';
    const results = await Promise.all(
      [0, 1].map(() => request(app.getHttpServer()).post(route)
        .set('Authorization', 'Bearer ' + token).send({ reason: 'SPAM' })),
    );
    expect(results.map((response) => response.status).sort()).toEqual([201, 409]);
    const reports = await database.moderationReport.findMany({
      where: { postId, reporterId: users.get(subjects.reporter) },
    });
    expect(reports).toHaveLength(1);
    expect(reports[0]?.targetType).toBe('FORUM_POST');
    expect(reports[0]?.reportedUserId).toBe(users.get(subjects.author));

    await request(app.getHttpServer()).post(route)
      .set('Authorization', 'Bearer ' + token).send({ reason: 'PRIVACY' }).expect(409);
  });

  it('allows LIMITED user reports and lists only private, pending forum reports', async () => {
    const token = await tokenFor(subjects.limited);
    await request(app.getHttpServer()).post(target + '/posts/' + secondPostId + '/reports')
      .set('Authorization', 'Bearer ' + token).send({ reason: 'PRIVACY' }).expect(201);
    const moderator = await tokenFor(subjects.moderator);
    const queueResponse = await request(app.getHttpServer()).get(queue)
      .set('Authorization', 'Bearer ' + moderator).expect(200);
    const items = dataOf<Array<{ postId: string; reason: string; post: { content: string | null } }>>(queueResponse);
    expect(items.map((row) => row.postId).sort()).toEqual([postId, secondPostId].sort());
    expect(items[0]?.post.content).toBeTruthy();
    expect(JSON.stringify(items)).not.toContain(subjects.reporter);
  });

  it('requires real removal before ACTION_TAKEN and keeps public deleted posts redacted', async () => {
    const moderator = await tokenFor(subjects.moderator);
    const report = await database.moderationReport.findFirstOrThrow({
      where: { postId, reporterId: users.get(subjects.reporter) },
      select: { id: true },
    });
    const decision = queue + '/' + report.id + '/resolve';
    await request(app.getHttpServer()).post(decision).set('Authorization', 'Bearer ' + moderator)
      .send({ resolution: 'ACTION_TAKEN', moderatorNote: 'Beitrag wurde moderiert' })
      .expect(409);

    const removal = '/api/v1/moderation/forum-posts/' + postId + '/remove';
    await request(app.getHttpServer()).post(removal)
      .set('Authorization', 'Bearer ' + moderator)
      .send({ reason: 'Regelwidriger öffentlicher Beitrag' }).expect(201);
    const second = await request(app.getHttpServer()).post(removal)
      .set('Authorization', 'Bearer ' + moderator)
      .send({ reason: 'Bereits moderiert' }).expect(201);
    expect(dataOf<{ removed: boolean }>(second).removed).toBe(false);
    expect(await database.auditLog.count({
      where: { action: 'POST_DELETED_BY_MODERATOR', targetId: postId },
    })).toBe(1);

    const publicThread = dataOf<{ posts: Array<{ id: string; content: string | null; author: unknown }> }>(
      await request(app.getHttpServer()).get(target).expect(200),
    );
    expect(publicThread.posts.find((post) => post.id === postId)).toMatchObject({
      content: null,
      author: null,
    });
    const pending = dataOf<Array<{ postId: string; post: { content: string | null } }>>(
      await request(app.getHttpServer()).get(queue).set('Authorization', 'Bearer ' + moderator).expect(200),
    );
    expect(pending.find((item) => item.postId === postId)?.post.content).toBeNull();

    await request(app.getHttpServer()).post(decision).set('Authorization', 'Bearer ' + moderator)
      .send({ resolution: 'ACTION_TAKEN', moderatorNote: 'Der Beitrag wurde entfernt.' })
      .expect(201);
    await request(app.getHttpServer()).post(decision).set('Authorization', 'Bearer ' + moderator)
      .send({ resolution: 'ACTION_TAKEN', moderatorNote: 'Erneuter Abschlussversuch' })
      .expect(409);
    expect(await database.auditLog.count({
      where: { action: 'MODERATION_REPORT_RESOLVED', moderationReportId: report.id },
    })).toBe(1);
  });

  it('dismisses a separate report with an atomic moderation audit', async () => {
    const moderator = await tokenFor(subjects.moderator);
    const report = await database.moderationReport.findFirstOrThrow({
      where: { postId: secondPostId, reporterId: users.get(subjects.limited) },
      select: { id: true },
    });
    await request(app.getHttpServer()).post(queue + '/' + report.id + '/resolve')
      .set('Authorization', 'Bearer ' + moderator)
      .send({ resolution: 'NO_VIOLATION', moderatorNote: 'Kein Verstoß feststellbar.' })
      .expect(201);
    expect(await database.auditLog.count({
      where: { action: 'MODERATION_REPORT_DISMISSED', moderationReportId: report.id },
    })).toBe(1);
    const pending = dataOf<Array<{ id: string }>>(
      await request(app.getHttpServer()).get(queue)
        .set('Authorization', 'Bearer ' + moderator).expect(200),
    );
    expect(pending).toHaveLength(0);
  });
});
