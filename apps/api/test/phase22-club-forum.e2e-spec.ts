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
  };
  const clubs: string[] = [];
  const forums: string[] = [];
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
});
