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

describe('22.210 real club forum reconciliation – disposable PostgreSQL + HTTP', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwks: Server;
  let signingKey: KeyLike;
  const marker = randomUUID().slice(0, 8);
  const users = new Map<string, string>();
  const subjects = {
    admin: 'p210-admin-' + marker,
    moderator: 'p210-moderator-' + marker,
    limited: 'p210-limited-' + marker,
    replyA: 'p213-reply-a-' + marker,
    replyB: 'p213-reply-b-' + marker,
    replyC: 'p213-reply-c-' + marker,
    replyD: 'p213-reply-d-' + marker,
  };
  const clubs: string[] = [];
  const forums: string[] = [];
  const threads: string[] = [];
  let categoryId: string | undefined;
  const firstSlug = 'p210-existing-' + marker;
  const secondSlug = 'p210-new-' + marker;
  const previousJwks = process.env.KEYCLOAK_JWKS_URL;

  async function tokenFor(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p210-' + marker })
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
      throw new Error('PHASE22_210_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }
    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: 'p210-' + marker,
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
      { subject: subjects.admin, role: 'ADMIN', status: 'ACTIVE' },
      { subject: subjects.moderator, role: 'MODERATOR', status: 'ACTIVE' },
      { subject: subjects.limited, role: 'ADMIN', status: 'LIMITED' },
      { subject: subjects.replyA, role: 'USER', status: 'ACTIVE' },
      { subject: subjects.replyB, role: 'USER', status: 'ACTIVE' },
      { subject: subjects.replyC, role: 'USER', status: 'ACTIVE' },
      { subject: subjects.replyD, role: 'USER', status: 'ACTIVE' },
    ] as const) {
      const user = await database.user.create({
        data: {
          keycloakSubject: member.subject,
          nickname: 'p210-' + marker + '-' + member.role + '-' + member.status,
          status: member.status,
          onboardingCompleted: true,
          roleAssignments: { create: { role: member.role } },
        },
        select: { id: true },
      });
      users.set(member.subject, user.id);
    }

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
        // Clean only this suite's records, and only in disposable local E2E PostgreSQL.
        if (threads.length) {
          await database.thread.updateMany({
            where: { id: { in: threads } },
            data: { lastPostId: null },
          });
          await database.post.deleteMany({ where: { threadId: { in: threads } } });
          await database.thread.deleteMany({ where: { id: { in: threads } } });
        }
        await database.auditLog.deleteMany({
          where: {
            targetType: 'SYSTEM',
            targetId: { in: [...forums, ...clubs, ...(categoryId ? [categoryId] : [])] },
          },
        });
        if (forums.length) await database.forum.deleteMany({ where: { id: { in: forums } } });
        if (clubs.length) await database.club.deleteMany({ where: { id: { in: clubs } } });
        if (categoryId) await database.forumCategory.delete({ where: { id: categoryId } });
        const ids = [...users.values()];
        if (ids.length) {
          await database.userRoleAssignment.deleteMany({ where: { userId: { in: ids } } });
          await database.user.deleteMany({ where: { id: { in: ids } } });
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

  const clubInput = (slug: string) => ({
    name: 'Verein Test ' + slug,
    slug,
    color1Hex: '#123456',
  });

  it('does not create a forum or a category for a club on a clean database', async () => {
    const admin = await tokenFor(subjects.admin);
    const response = await request(app.getHttpServer())
      .post('/api/v1/clubs')
      .set('Authorization', 'Bearer ' + admin)
      .send(clubInput(firstSlug))
      .expect(201);
    const club = dataOf<{ id: string }>(response);
    clubs.push(club.id);

    expect(await database.forumCategory.count()).toBe(0);
    expect(await database.forum.count({ where: { clubId: club.id } })).toBe(0);
    await request(app.getHttpServer())
      .post('/api/v1/forums/clubs/' + club.id + '/ensure')
      .set('Authorization', 'Bearer ' + admin)
      .expect(409);
    await request(app.getHttpServer())
      .get('/api/v1/forums/clubs/' + firstSlug)
      .expect(404);
  });

  it('denies anonymous and non-admin provisioning', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/forums/clubs/' + clubs[0] + '/ensure')
      .expect(401);
    for (const subject of [subjects.moderator, subjects.limited]) {
      await request(app.getHttpServer())
        .post('/api/v1/forums/clubs/' + clubs[0] + '/ensure')
        .set('Authorization', 'Bearer ' + (await tokenFor(subject)))
        .expect(403);
    }
  });

  it('reconciles an older real club after the admin creates the category, without duplicates', async () => {
    const admin = await tokenFor(subjects.admin);
    const result = await request(app.getHttpServer())
      .post('/api/v1/forums/categories')
      .set('Authorization', 'Bearer ' + admin)
      .send({ name: 'Vereine', slug: 'vereine', sortOrder: 20 })
      .expect(201);
    categoryId = dataOf<{ id: string }>(result).id;

    const target = '/api/v1/forums/clubs/' + clubs[0] + '/ensure';
    const created = await request(app.getHttpServer())
      .post(target)
      .set('Authorization', 'Bearer ' + admin)
      .expect(201);
    const forum = dataOf<{ id: string; slug: string; clubId: string }>(created);
    forums.push(forum.id);
    expect(forum.slug).toBe('verein-' + firstSlug);
    expect(forum.clubId).toBe(clubs[0]);

    const second = await request(app.getHttpServer())
      .post(target)
      .set('Authorization', 'Bearer ' + admin)
      .expect(201);
    expect(dataOf<{ id: string }>(second).id).toBe(forum.id);
    expect(await database.forum.count({ where: { clubId: clubs[0] } })).toBe(1);

    const publicForum = await request(app.getHttpServer())
      .get('/api/v1/forums/clubs/' + firstSlug)
      .expect(200);
    expect(dataOf<{ slug: string }>(publicForum).slug).toBe('verein-' + firstSlug);

    const publicCategories = await request(app.getHttpServer())
      .get('/api/v1/forums/categories')
      .expect(200);
    expect(
      dataOf<{ forums: { club: { id: string } }[] }[]>(publicCategories)[0]?.forums[0]?.club.id,
    ).toBe(clubs[0]);
    const audit = await database.auditLog.count({
      where: {
        targetType: 'SYSTEM',
        targetId: forum.id,
      },
    });
    expect(audit).toBe(1);
  });

  it('automatically connects newly administrated real clubs transactionally', async () => {
    const admin = await tokenFor(subjects.admin);
    const created = await request(app.getHttpServer())
      .post('/api/v1/clubs')
      .set('Authorization', 'Bearer ' + admin)
      .send(clubInput(secondSlug))
      .expect(201);
    const clubId = dataOf<{ id: string }>(created).id;
    clubs.push(clubId);
    const rows = await database.forum.findMany({
      where: { clubId },
      select: { id: true, slug: true, categoryId: true },
    });
    expect(rows).toHaveLength(1);
    forums.push(rows[0].id);
    expect(rows[0]?.slug).toBe('verein-' + secondSlug);
    expect(rows[0]?.categoryId).toBe(categoryId);
  });

  it('hides a real club forum when the club is deactivated without removing its history', async () => {
    const admin = await tokenFor(subjects.admin);
    await request(app.getHttpServer())
      .patch('/api/v1/clubs/' + clubs[1])
      .set('Authorization', 'Bearer ' + admin)
      .send({ active: false })
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/forums/clubs/' + secondSlug)
      .expect(404);
    expect(await database.forum.count({ where: { clubId: clubs[1] } })).toBe(1);
    const publicCategories = await request(app.getHttpServer())
      .get('/api/v1/forums/categories')
      .expect(200);
    const items = dataOf<{ forums: { club: { id: string } }[] }[]>(publicCategories);
    expect(
      items.flatMap((category) => category.forums).some((item) => item.club.id === clubs[1]),
    ).toBe(false);
  });

  it('hides the club forum when its category is inactive and restores visibility when reactivated', async () => {
    const admin = await tokenFor(subjects.admin);
    expect(categoryId).toBeDefined();

    await request(app.getHttpServer())
      .patch('/api/v1/forums/categories/' + categoryId)
      .set('Authorization', 'Bearer ' + admin)
      .send({ active: false })
      .expect(200);

    await request(app.getHttpServer()).get('/api/v1/forums/categories/vereine').expect(404);
    await request(app.getHttpServer())
      .get('/api/v1/forums/clubs/' + firstSlug)
      .expect(404);
    const hidden = await request(app.getHttpServer()).get('/api/v1/forums/categories').expect(200);
    const visibleCategorySlugs = dataOf<{ slug: string }[]>(hidden).map((item) => item.slug);
    expect(visibleCategorySlugs).not.toContain('vereine');
    expect(await database.forum.count({ where: { id: forums[0] } })).toBe(1);

    await request(app.getHttpServer())
      .patch('/api/v1/forums/categories/' + categoryId)
      .set('Authorization', 'Bearer ' + admin)
      .send({ active: true })
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/forums/clubs/' + firstSlug)
      .expect(200);
  });

  it('keeps an inactive club forum private without deleting its record', async () => {
    await database.forum.update({
      where: { id: forums[0] },
      data: { active: false },
    });
    try {
      await request(app.getHttpServer())
        .get('/api/v1/forums/clubs/' + firstSlug)
        .expect(404);
      const visible = await request(app.getHttpServer())
        .get('/api/v1/forums/categories')
        .expect(200);
      expect(
        dataOf<{ forums: { id: string }[] }[]>(visible)
          .flatMap((category) => category.forums)
          .some((forum) => forum.id === forums[0]),
      ).toBe(false);
      expect(await database.forum.count({ where: { id: forums[0] } })).toBe(1);
    } finally {
      await database.forum.update({
        where: { id: forums[0] },
        data: { active: true },
      });
    }
  });

  it('22.211 reads a genuine empty thread list and hides unknown forums', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/forums/by-slug/verein-' + firstSlug + '/threads')
      .expect(200);
    expect(dataOf<{ items: unknown[]; hasMore: boolean }>(response)).toEqual({
      items: [],
      hasMore: false,
    });
    await request(app.getHttpServer())
      .get('/api/v1/forums/by-slug/verein-unknown-forum/threads')
      .expect(404);
  });

  it('22.211 enforces auth, LIMITED status, onboarding and request validation', async () => {
    const target = '/api/v1/forums/by-slug/verein-' + firstSlug + '/threads';
    const body = { title: 'Gespräch über unseren Verein', body: 'Sachlicher Testbeitrag.' };
    await request(app.getHttpServer()).post(target).send(body).expect(401);
    await request(app.getHttpServer())
      .post(target)
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.limited)))
      .send(body)
      .expect(403);

    const adminId = users.get(subjects.admin)!;
    await database.user.update({
      where: { id: adminId },
      data: { onboardingCompleted: false },
    });
    try {
      await request(app.getHttpServer())
        .post(target)
        .set('Authorization', 'Bearer ' + (await tokenFor(subjects.admin)))
        .send(body)
        .expect(403);
    } finally {
      await database.user.update({
        where: { id: adminId },
        data: { onboardingCompleted: true },
      });
    }

    await request(app.getHttpServer())
      .post(target)
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.admin)))
      .send({ title: 'Kurz', body: 'Testbeitrag' })
      .expect(400);
    expect(await database.thread.count({ where: { forumId: forums[0] } })).toBe(0);
  });

  it('22.211 creates a thread and the first post atomically, visible in the forum', async () => {
    const target = '/api/v1/forums/by-slug/verein-' + firstSlug + '/threads';
    const body = 'Sachlicher Eröffnungsbeitrag aus dem isolierten Test ' + marker;
    const response = await request(app.getHttpServer())
      .post(target)
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.admin)))
      .send({ title: 'Vereinsdiskussion zum Saisonstart', body })
      .expect(201);
    const thread = dataOf<{
      id: string;
      slug: string;
      forumId: string;
      postCount: number;
    }>(response);
    threads.push(thread.id);
    expect(thread.forumId).toBe(forums[0]);
    expect(thread.postCount).toBe(1);
    expect(thread.slug).toMatch(/^vereinsdiskussion-zum-saisonstart-/u);

    const firstPost = await database.post.findFirst({
      where: { threadId: thread.id, sequenceNumber: 1 },
    });
    expect(firstPost?.authorId).toBe(users.get(subjects.admin));
    expect(firstPost?.content).toBe(body);
    const stored = await database.thread.findUnique({ where: { id: thread.id } });
    expect(stored?.lastPostId).toBe(firstPost?.id);
    expect(stored?.lastPostSequenceNumber).toBe(1);

    const list = await request(app.getHttpServer()).get(target).expect(200);
    const items = dataOf<{ items: { id: string }[]; hasMore: boolean }>(list);
    expect(items.hasMore).toBe(false);
    expect(items.items.map((item) => item.id)).toContain(thread.id);
  });

  it('22.211 rejects thread creation in a read-only forum without new records', async () => {
    const target = '/api/v1/forums/by-slug/verein-' + firstSlug + '/threads';
    const before = await database.thread.count({ where: { forumId: forums[0] } });
    await database.forum.update({
      where: { id: forums[0] },
      data: { threadCreationEnabled: false },
    });
    try {
      await request(app.getHttpServer())
        .post(target)
        .set('Authorization', 'Bearer ' + (await tokenFor(subjects.moderator)))
        .send({ title: 'Kein neues Thema erlaubt', body: 'Noch ein isolierter Testbeitrag.' })
        .expect(409);
      expect(await database.thread.count({ where: { forumId: forums[0] } })).toBe(before);
    } finally {
      await database.forum.update({
        where: { id: forums[0] },
        data: { threadCreationEnabled: true },
      });
    }
  });

  it('22.212 serves a public thread detail with its actual first post', async () => {
    const thread = await database.thread.findUnique({
      where: { id: threads[0] },
      select: { slug: true },
    });
    expect(thread).not.toBeNull();
    const response = await request(app.getHttpServer())
      .get('/api/v1/forums/by-slug/verein-' + firstSlug + '/threads/' + thread!.slug)
      .expect(200);
    const detail = dataOf<{
      thread: { id: string; title: string; forum: { slug: string } };
      posts: { sequenceNumber: number; content: string | null; deleted: boolean }[];
      hasMorePosts: boolean;
    }>(response);
    expect(detail.thread.id).toBe(threads[0]);
    expect(detail.thread.forum.slug).toBe('verein-' + firstSlug);
    expect(detail.posts).toHaveLength(1);
    expect(detail.posts[0]?.sequenceNumber).toBe(1);
    expect(detail.posts[0]?.content).toContain('Sachlicher Eröffnungsbeitrag');
    expect(detail.posts[0]?.deleted).toBe(false);
    expect(detail.hasMorePosts).toBe(false);
  });

  it('22.212 does not leak deleted post text or its author in the public API', async () => {
    const firstPost = await database.post.findFirstOrThrow({
      where: { threadId: threads[0], sequenceNumber: 1 },
      select: { id: true, content: true },
    });
    const thread = await database.thread.findUniqueOrThrow({
      where: { id: threads[0] },
      select: { slug: true },
    });
    await database.post.update({
      where: { id: firstPost.id },
      data: { deletedAt: new Date() },
    });
    try {
      const response = await request(app.getHttpServer())
        .get('/api/v1/forums/by-slug/verein-' + firstSlug + '/threads/' + thread.slug)
        .expect(200);
      const detail = dataOf<{
        posts: {
          deleted: boolean;
          content: string | null;
          author: unknown;
          editedAt: string | null;
        }[];
      }>(response);
      expect(detail.posts[0]).toMatchObject({
        deleted: true,
        content: null,
        author: null,
        editedAt: null,
      });
      expect(JSON.stringify(detail.posts)).not.toContain(firstPost.content);
      expect(JSON.stringify(detail.posts)).not.toContain(users.get(subjects.admin));
    } finally {
      await database.post.update({ where: { id: firstPost.id }, data: { deletedAt: null } });
    }
  });

  it('22.212 hides missing, archived and hidden-category thread details', async () => {
    const thread = await database.thread.findUniqueOrThrow({
      where: { id: threads[0] },
      select: { slug: true },
    });
    const target = '/api/v1/forums/by-slug/verein-' + firstSlug + '/threads/' + thread.slug;
    await request(app.getHttpServer())
      .get('/api/v1/forums/by-slug/verein-' + firstSlug + '/threads/not-a-real-thread')
      .expect(404);
    await request(app.getHttpServer())
      .get('/api/v1/forums/by-slug/verein-does-not-exist/threads/' + thread.slug)
      .expect(404);

    await database.thread.update({ where: { id: threads[0] }, data: { status: 'ARCHIVED' } });
    try {
      await request(app.getHttpServer()).get(target).expect(404);
    } finally {
      await database.thread.update({ where: { id: threads[0] }, data: { status: 'OPEN' } });
    }

    await database.forumCategory.update({
      where: { id: categoryId! },
      data: { active: false },
    });
    try {
      await request(app.getHttpServer()).get(target).expect(404);
    } finally {
      await database.forumCategory.update({
        where: { id: categoryId! },
        data: { active: true },
      });
    }
  });

  it('22.213 rejects anonymous, LIMITED, unfinished onboarding and invalid reply bodies', async () => {
    const thread = await database.thread.findUniqueOrThrow({
      where: { id: threads[0] },
      select: { slug: true },
    });
    const target =
      '/api/v1/forums/by-slug/verein-' + firstSlug + '/threads/' + thread.slug + '/posts';
    await request(app.getHttpServer()).post(target).send({ body: 'No auth' }).expect(401);
    await request(app.getHttpServer())
      .post(target)
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.limited)))
      .send({ body: 'No permissions' })
      .expect(403);
    const userId = users.get(subjects.replyA)!;
    await database.user.update({
      where: { id: userId },
      data: { onboardingCompleted: false },
    });
    try {
      await request(app.getHttpServer())
        .post(target)
        .set('Authorization', 'Bearer ' + (await tokenFor(subjects.replyA)))
        .send({ body: 'No onboarding' })
        .expect(403);
    } finally {
      await database.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      });
    }
    await request(app.getHttpServer())
      .post(target)
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.replyA)))
      .send({ body: '   ' })
      .expect(400);
    await request(app.getHttpServer())
      .post(target)
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.replyA)))
      .send({ body: 'Hello', parentPostId: 'not-a-uuid' })
      .expect(400);
    expect(await database.post.count({ where: { threadId: threads[0] } })).toBe(1);
  });

  it('22.213 atomically posts a reply and advances thread metadata exactly once', async () => {
    const thread = await database.thread.findUniqueOrThrow({
      where: { id: threads[0] },
      select: { slug: true },
    });
    const target =
      '/api/v1/forums/by-slug/verein-' + firstSlug + '/threads/' + thread.slug + '/posts';
    const response = await request(app.getHttpServer())
      .post(target)
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.replyA)))
      .send({ body: 'Eine echte isolierte Forumsantwort ' + marker })
      .expect(201);
    const post = dataOf<{
      id: string;
      sequenceNumber: number;
      parentPostId: string | null;
      content: string;
    }>(response);
    expect(post.sequenceNumber).toBe(2);
    expect(post.parentPostId).toBeNull();
    const stored = await database.thread.findUniqueOrThrow({ where: { id: threads[0] } });
    expect(stored.postCount).toBe(2);
    expect(stored.lastPostSequenceNumber).toBe(2);
    expect(stored.lastPostId).toBe(post.id);
    const detail = await request(app.getHttpServer())
      .get('/api/v1/forums/by-slug/verein-' + firstSlug + '/threads/' + thread.slug)
      .expect(200);
    expect(
      dataOf<{ posts: { id: string; sequenceNumber: number }[] }>(detail).posts.some(
        (item) => item.id === post.id && item.sequenceNumber === 2,
      ),
    ).toBe(true);
  });

  it('22.213 supports replies to non-deleted posts in the same thread', async () => {
    const thread = await database.thread.findUniqueOrThrow({
      where: { id: threads[0] },
      select: { slug: true },
    });
    const original = await database.post.findFirstOrThrow({
      where: { threadId: threads[0], sequenceNumber: 1 },
      select: { id: true },
    });
    const response = await request(app.getHttpServer())
      .post('/api/v1/forums/by-slug/verein-' + firstSlug + '/threads/' + thread.slug + '/posts')
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.replyB)))
      .send({ body: 'Bezug auf den ersten Beitrag ' + marker, parentPostId: original.id })
      .expect(201);
    expect(dataOf<{ sequenceNumber: number; parentPostId: string }>(response)).toMatchObject({
      sequenceNumber: 3,
      parentPostId: original.id,
    });
  });

  it('22.213 rejects locked threads and inaccessible parents without partial writes', async () => {
    const thread = await database.thread.findUniqueOrThrow({
      where: { id: threads[0] },
      select: { slug: true },
    });
    const target =
      '/api/v1/forums/by-slug/verein-' + firstSlug + '/threads/' + thread.slug + '/posts';
    const baseline = await database.thread.findUniqueOrThrow({
      where: { id: threads[0] },
      select: { postCount: true, lastPostSequenceNumber: true },
    });
    await database.thread.update({ where: { id: threads[0] }, data: { status: 'LOCKED' } });
    try {
      await request(app.getHttpServer())
        .post(target)
        .set('Authorization', 'Bearer ' + (await tokenFor(subjects.replyC)))
        .send({ body: 'Gesperrter Thread ' + marker })
        .expect(409);
    } finally {
      await database.thread.update({ where: { id: threads[0] }, data: { status: 'OPEN' } });
    }
    await request(app.getHttpServer())
      .post(target)
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.replyC)))
      .send({ body: 'Ungültiger Elternbeitrag ' + marker, parentPostId: randomUUID() })
      .expect(409);

    const first = await database.post.findFirstOrThrow({
      where: { threadId: threads[0], sequenceNumber: 1 },
      select: { id: true },
    });
    await database.post.update({ where: { id: first.id }, data: { deletedAt: new Date() } });
    try {
      await request(app.getHttpServer())
        .post(target)
        .set('Authorization', 'Bearer ' + (await tokenFor(subjects.replyC)))
        .send({ body: 'Gelöschter Elternbeitrag ' + marker, parentPostId: first.id })
        .expect(409);
    } finally {
      await database.post.update({ where: { id: first.id }, data: { deletedAt: null } });
    }

    const current = await database.thread.findUniqueOrThrow({
      where: { id: threads[0] },
      select: { postCount: true, lastPostSequenceNumber: true },
    });
    expect(current).toEqual(baseline);
    expect(await database.post.count({ where: { threadId: threads[0] } })).toBe(baseline.postCount);
  });

  it('22.213 prevents writes to archived, merged and hidden-category topics', async () => {
    const thread = await database.thread.findUniqueOrThrow({
      where: { id: threads[0] },
      select: { slug: true },
    });
    const target =
      '/api/v1/forums/by-slug/verein-' + firstSlug + '/threads/' + thread.slug + '/posts';
    const auth = 'Bearer ' + (await tokenFor(subjects.replyC));
    const before = await database.post.count({ where: { threadId: threads[0] } });

    for (const status of ['ARCHIVED', 'MERGED'] as const) {
      await database.thread.update({ where: { id: threads[0] }, data: { status } });
      try {
        await request(app.getHttpServer())
          .post(target)
          .set('Authorization', auth)
          .send({ body: 'Unsichtbarer Thread ' + status + ' ' + marker })
          .expect(404);
      } finally {
        await database.thread.update({ where: { id: threads[0] }, data: { status: 'OPEN' } });
      }
    }

    await database.forumCategory.update({
      where: { id: categoryId! },
      data: { active: false },
    });
    try {
      await request(app.getHttpServer())
        .post(target)
        .set('Authorization', auth)
        .send({ body: 'Unsichtbare Kategorie ' + marker })
        .expect(404);
    } finally {
      await database.forumCategory.update({
        where: { id: categoryId! },
        data: { active: true },
      });
    }

    expect(await database.post.count({ where: { threadId: threads[0] } })).toBe(before);
  });

  it('22.213 allocates different sequences for concurrent authors', async () => {
    const thread = await database.thread.findUniqueOrThrow({
      where: { id: threads[0] },
      select: { slug: true },
    });
    const target =
      '/api/v1/forums/by-slug/verein-' + firstSlug + '/threads/' + thread.slug + '/posts';
    const tokens = await Promise.all([tokenFor(subjects.replyC), tokenFor(subjects.replyD)]);
    const results = await Promise.all(
      tokens.map((token, index) =>
        request(app.getHttpServer())
          .post(target)
          .set('Authorization', 'Bearer ' + token)
          .send({ body: 'Parallele echte Forumsantwort ' + index + ' ' + marker }),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([201, 201]);
    const created = results.map((result) => dataOf<{ id: string; sequenceNumber: number }>(result));
    expect(created.map((item) => item.sequenceNumber).sort((a, b) => a - b)).toEqual([4, 5]);
    const stored = await database.thread.findUniqueOrThrow({ where: { id: threads[0] } });
    expect(stored.postCount).toBe(5);
    expect(stored.lastPostSequenceNumber).toBe(5);
    expect(created.map((item) => item.id)).toContain(stored.lastPostId);
  });

  it('22.212 bounds public posts and exposes an honest hasMorePosts marker', async () => {
    const thread = await database.thread.findUniqueOrThrow({
      where: { id: threads[0] },
      select: { slug: true },
    });
    await database.post.createMany({
      data: Array.from({ length: 31 }, (_, index) => ({
        threadId: threads[0],
        authorId: users.get(subjects.moderator)!,
        sequenceNumber: index + 2,
        content: 'Disposable post ' + (index + 2) + ' ' + marker,
      })),
    });
    const response = await request(app.getHttpServer())
      .get('/api/v1/forums/by-slug/verein-' + firstSlug + '/threads/' + thread.slug)
      .expect(200);
    const detail = dataOf<{
      posts: { sequenceNumber: number }[];
      hasMorePosts: boolean;
    }>(response);
    expect(detail.posts).toHaveLength(30);
    expect(detail.posts[0]?.sequenceNumber).toBe(1);
    expect(detail.posts[29]?.sequenceNumber).toBe(30);
    expect(detail.hasMorePosts).toBe(true);
  });
});
