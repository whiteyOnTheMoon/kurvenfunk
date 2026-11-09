import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import request from 'supertest';
import type { App } from 'supertest/types';

function responseData(response: { body: unknown }): unknown {
  return (response.body as { data: unknown }).data;
}

describe('Task 193 Season Management isolated HTTP and PostgreSQL E2E', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwks: Server;
  let signingKey: KeyLike;
  let competitionId: string | undefined;
  const seasonIds: string[] = [];
  const ids = new Map<string, string>();
  const marker = randomUUID().slice(0, 8);
  const competitionSlug = 'p193-competition-' + marker;
  const baseUrl = '/api/v1/seasons/competition/' + competitionSlug;
  const subjects = {
    admin: 'p193-admin-' + marker,
    superadmin: 'p193-superadmin-' + marker,
    editor: 'p193-editor-' + marker,
    limited: 'p193-limited-' + marker,
    banned: 'p193-banned-' + marker,
  };
  const previousJwks = process.env.KEYCLOAK_JWKS_URL;

  async function tokenFor(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p193-' + marker })
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
      throw new Error('TASK193_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }

    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: 'p193-' + marker,
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
    for (const fixture of [
      { subject: subjects.admin, role: 'ADMIN', status: 'ACTIVE' },
      { subject: subjects.superadmin, role: 'SUPERADMIN', status: 'ACTIVE' },
      { subject: subjects.editor, role: 'EDITOR', status: 'ACTIVE' },
      { subject: subjects.limited, role: 'ADMIN', status: 'LIMITED' },
      { subject: subjects.banned, role: 'ADMIN', status: 'BANNED' },
    ] as const) {
      const user = await database.user.create({
        data: {
          keycloakSubject: fixture.subject,
          nickname: 'p193-' + marker + '-' + fixture.role + '-' + fixture.status,
          status: fixture.status,
          onboardingCompleted: true,
          roleAssignments: { create: { role: fixture.role } },
        },
        select: { id: true },
      });
      ids.set(fixture.subject, user.id);
    }

    const competition = await database.competition.create({
      data: {
        slug: competitionSlug,
        name: 'P193 Isolated Competition',
        type: 'LEAGUE',
        countryCode: 'AT',
        active: true,
      },
      select: { id: true },
    });
    competitionId = competition.id;

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
        if (seasonIds.length > 0) {
          await database.auditLog.deleteMany({
            where: { targetType: 'SYSTEM', targetId: { in: seasonIds } },
          });
          await database.season.deleteMany({ where: { id: { in: seasonIds } } });
        }
        if (competitionId) {
          await database.competition.delete({ where: { id: competitionId } });
        }
        if (ids.size > 0) {
          await database.userRoleAssignment.deleteMany({
            where: { userId: { in: [...ids.values()] } },
          });
          await database.user.deleteMany({ where: { id: { in: [...ids.values()] } } });
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

  it('requires admin rights for season writes, including account status restrictions', async () => {
    const sample = {
      name: '2026/27',
      slug: '2026-27',
      startDate: '2026-07-01',
      endDate: '2027-06-30',
    };
    await request(app.getHttpServer()).post(baseUrl).send(sample).expect(401);
    for (const subject of [subjects.editor, subjects.limited, subjects.banned]) {
      await request(app.getHttpServer())
        .post(baseUrl)
        .set('Authorization', 'Bearer ' + (await tokenFor(subject)))
        .send(sample)
        .expect(403);
    }
    await request(app.getHttpServer())
      .patch('/api/v1/seasons/' + randomUUID())
      .send({})
      .expect(401);
  });

  it('validates calendar dates, immutable fields, slugs and unknown competitions', async () => {
    const adminToken = await tokenFor(subjects.admin);
    const create = {
      name: '2026/27',
      slug: '2026-27',
      startDate: '2026-07-01',
      endDate: '2027-06-30',
    };
    for (const bad of [
      { ...create, startDate: '2026-13-01' },
      { ...create, startDate: '2026-02-30' },
      { ...create, endDate: '2025-06-30' },
      { ...create, slug: '2026/27' },
      { ...create, active: true },
    ]) {
      await request(app.getHttpServer())
        .post(baseUrl)
        .set('Authorization', 'Bearer ' + adminToken)
        .send(bad)
        .expect(400);
    }
    await request(app.getHttpServer())
      .post('/api/v1/seasons/competition/nonexistent-p193-' + marker)
      .set('Authorization', 'Bearer ' + adminToken)
      .send(create)
      .expect(404);
  });

  it('creates a canonical season and returns public current and historical lookups', async () => {
    const adminToken = await tokenFor(subjects.admin);
    const create = {
      name: '2026/27',
      slug: '2026-27',
      startDate: '2026-07-01',
      endDate: '2027-06-30',
      status: 'ACTIVE',
    };
    const response = await request(app.getHttpServer())
      .post(baseUrl)
      .set('Authorization', 'Bearer ' + adminToken)
      .send(create)
      .expect(201);
    const first = responseData(response) as { id: string; active: boolean; status: string };
    seasonIds.push(first.id);
    expect(first.active).toBe(true);
    expect(first.status).toBe('ACTIVE');

    const current = await request(app.getHttpServer())
      .get(baseUrl + '/current')
      .expect(200);
    expect((responseData(current) as { id: string }).id).toBe(first.id);
    const bySlug = await request(app.getHttpServer())
      .get(baseUrl + '/2026-27')
      .expect(200);
    expect((responseData(bySlug) as { id: string }).id).toBe(first.id);

    await request(app.getHttpServer())
      .post(baseUrl)
      .set('Authorization', 'Bearer ' + adminToken)
      .send(create)
      .expect(409);
  });

  it('rejects multiple active seasons and preserves data when activation conflicts', async () => {
    const adminToken = await tokenFor(subjects.superadmin);
    const create = {
      name: '2027/28',
      slug: '2027-28',
      startDate: '2027-07-01',
      endDate: '2028-06-30',
      status: 'PLANNED',
    };
    const plannedResponse = await request(app.getHttpServer())
      .post(baseUrl)
      .set('Authorization', 'Bearer ' + adminToken)
      .send(create)
      .expect(201);
    const planned = responseData(plannedResponse) as {
      id: string;
      status: string;
      active: boolean;
    };
    seasonIds.push(planned.id);
    expect(planned.status).toBe('PLANNED');
    expect(planned.active).toBe(false);

    await request(app.getHttpServer())
      .patch('/api/v1/seasons/' + planned.id)
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ status: 'ACTIVE' })
      .expect(409);
    const unchanged = await database.season.findUniqueOrThrow({ where: { id: planned.id } });
    expect(unchanged.status).toBe('PLANNED');
    expect(unchanged.active).toBe(false);

    await expect(
      database.season.create({
        data: {
          competitionId: competitionId!,
          name: 'Invalid duplicate current season',
          slug: 'another-active',
          startDate: new Date('2028-07-01T00:00:00.000Z'),
          endDate: new Date('2029-06-30T00:00:00.000Z'),
          status: 'ACTIVE',
          active: true,
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('closes one season, activates the next, keeps the archive and writes audit logs', async () => {
    const adminToken = await tokenFor(subjects.admin);
    const first = seasonIds[0]!;
    const next = seasonIds[1]!;

    await request(app.getHttpServer())
      .patch('/api/v1/seasons/' + first)
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ endDate: '2026-06-01' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/v1/seasons/' + first)
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ slug: 'changed-identity' })
      .expect(400);

    const closeResponse = await request(app.getHttpServer())
      .patch('/api/v1/seasons/' + first)
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ status: 'COMPLETED' })
      .expect(200);
    expect((responseData(closeResponse) as { active: boolean }).active).toBe(false);

    await request(app.getHttpServer())
      .get(baseUrl + '/current')
      .expect(404);
    await request(app.getHttpServer())
      .get(baseUrl + '/2026-27')
      .expect(200);

    const activateResponse = await request(app.getHttpServer())
      .patch('/api/v1/seasons/' + next)
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ status: 'ACTIVE', name: '2027/28 - Korrigiert' })
      .expect(200);
    expect((responseData(activateResponse) as { active: boolean }).active).toBe(true);

    const archive = await request(app.getHttpServer()).get(baseUrl).expect(200);
    const seasons = responseData(archive) as { id: string; slug: string }[];
    expect(seasons).toHaveLength(2);
    expect(seasons.map((item) => item.slug)).toEqual(['2027-28', '2026-27']);
    const current = await request(app.getHttpServer())
      .get(baseUrl + '/current')
      .expect(200);
    expect((responseData(current) as { id: string }).id).toBe(next);

    const audit = await database.auditLog.findMany({
      where: { targetType: 'SYSTEM', targetId: { in: seasonIds } },
      select: { metadata: true, actorUserId: true },
    });
    expect(audit).toHaveLength(4);
    expect(audit.every((item) => item.actorUserId !== null)).toBe(true);

    await request(app.getHttpServer())
      .delete('/api/v1/seasons/' + next)
      .expect(404);
  });
});
