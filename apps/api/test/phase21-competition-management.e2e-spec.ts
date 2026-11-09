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

describe('Task 192 Competition Management HTTP and PostgreSQL E2E', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwks: Server;
  let signingKey: KeyLike;
  let competitionId: string | undefined;
  const marker = randomUUID().slice(0, 8);
  const slug = `p192-test-${marker}`;
  const subjects = {
    admin: `p192-admin-${marker}`,
    superadmin: `p192-superadmin-${marker}`,
    moderator: `p192-moderator-${marker}`,
    editor: `p192-editor-${marker}`,
    limited: `p192-limited-${marker}`,
    banned: `p192-banned-${marker}`,
  };
  const ids = new Map<string, string>();
  const previousJwks = process.env.KEYCLOAK_JWKS_URL;

  async function tokenFor(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: `p192-${marker}` })
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
      throw new Error('TASK192_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }

    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: `p192-${marker}`,
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
      { subject: subjects.moderator, role: 'MODERATOR', status: 'ACTIVE' },
      { subject: subjects.editor, role: 'EDITOR', status: 'ACTIVE' },
      { subject: subjects.limited, role: 'ADMIN', status: 'LIMITED' },
      { subject: subjects.banned, role: 'ADMIN', status: 'BANNED' },
    ] as const) {
      const user = await database.user.create({
        data: {
          keycloakSubject: fixture.subject,
          nickname: `p192-${marker}-${fixture.role}-${fixture.status}`,
          status: fixture.status,
          onboardingCompleted: true,
          roleAssignments: { create: { role: fixture.role } },
        },
        select: { id: true },
      });
      ids.set(fixture.subject, user.id);
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
    try {
      if (app) await app.close();
      if (database) {
        if (competitionId) {
          await database.auditLog.deleteMany({
            where: { targetType: 'SYSTEM', targetId: competitionId },
          });
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

  it('denies anonymous, ordinary and limited users competition writes and admin reads', async () => {
    await request(app.getHttpServer()).post('/api/v1/competitions').send({}).expect(401);
    await request(app.getHttpServer()).get('/api/v1/competitions/admin/all').expect(401);

    for (const subject of [
      subjects.moderator,
      subjects.editor,
      subjects.limited,
      subjects.banned,
    ]) {
      const token = await tokenFor(subject);
      await request(app.getHttpServer())
        .post('/api/v1/competitions')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Not permitted', slug: `${slug}-other`, type: 'LEAGUE' })
        .expect(403);
      await request(app.getHttpServer())
        .get('/api/v1/competitions/admin/all')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    }
  });

  it('validates canonical fields and prohibits provider or season-specific input', async () => {
    const token = await tokenFor(subjects.admin);
    for (const input of [
      { name: 'Test', slug: 'Invalid Slug', type: 'LEAGUE' },
      { name: 'Test', slug, type: 'LEAGUE', countryCode: 'AUT' },
      { name: 'Test', slug, type: 'LEAGUE', hasSplit: true },
      { name: 'Test', slug, type: 'INVALID' },
    ]) {
      await request(app.getHttpServer())
        .post('/api/v1/competitions')
        .set('Authorization', `Bearer ${token}`)
        .send(input)
        .expect(400);
    }
  });

  it('creates a league with stable slug and a durable audit record', async () => {
    const token = await tokenFor(subjects.admin);
    const created = await request(app.getHttpServer())
      .post('/api/v1/competitions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Bundesliga',
        shortName: 'Test BL',
        slug,
        type: 'LEAGUE',
        countryCode: 'AT',
      })
      .expect(201);

    competitionId = (responseData(created) as { id: string }).id;
    expect(responseData(created)).toMatchObject({
      id: competitionId,
      name: 'Test Bundesliga',
      slug,
      type: 'LEAGUE',
      countryCode: 'AT',
      active: true,
    });

    const publicList = await request(app.getHttpServer()).get('/api/v1/competitions').expect(200);
    expect(responseData(publicList)).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: competitionId, slug })]),
    );
    await request(app.getHttpServer()).get(`/api/v1/competitions/${slug}`).expect(200);

    const audit = await database.auditLog.findMany({
      where: { actorUserId: ids.get(subjects.admin), targetId: competitionId },
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      action: 'ADMIN_CORRECTION',
      category: 'SYSTEM',
      targetType: 'SYSTEM',
    });
    expect(audit[0].metadata).toMatchObject({
      entity: 'COMPETITION',
      operation: 'CREATE',
      slug,
    });
  });

  it('rejects duplicate competition slugs without creating duplicates', async () => {
    const token = await tokenFor(subjects.superadmin);
    await request(app.getHttpServer())
      .post('/api/v1/competitions')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Second record', slug, type: 'CUP' })
      .expect(409);
    expect(await database.competition.count({ where: { slug } })).toBe(1);
  });

  it('updates metadata and deactivates without deleting historical identity', async () => {
    const token = await tokenFor(subjects.admin);
    const invalidUpdates = [{ slug: `${slug}-changed` }, { type: 'CUP' }, {}];
    for (const input of invalidUpdates) {
      await request(app.getHttpServer())
        .patch(`/api/v1/competitions/${competitionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(input)
        .expect(400);
    }
    await request(app.getHttpServer())
      .patch('/api/v1/competitions/not-a-uuid')
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false })
      .expect(400);

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/competitions/${competitionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed Bundesliga', shortName: null, active: false })
      .expect(200);

    expect(responseData(updated)).toMatchObject({
      id: competitionId,
      slug,
      type: 'LEAGUE',
      name: 'Renamed Bundesliga',
      shortName: null,
      active: false,
    });
    const publicList = await request(app.getHttpServer()).get('/api/v1/competitions').expect(200);
    expect(responseData(publicList)).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: competitionId })]),
    );
    await request(app.getHttpServer()).get(`/api/v1/competitions/${slug}`).expect(404);

    const privateList = await request(app.getHttpServer())
      .get('/api/v1/competitions/admin/all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(responseData(privateList)).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: competitionId, slug, active: false })]),
    );
    const saved = await database.competition.findUnique({ where: { id: competitionId } });
    expect(saved).toMatchObject({ slug, active: false });
    const audit = await database.auditLog.findMany({ where: { targetId: competitionId } });
    expect(audit).toHaveLength(2);
    expect(
      audit.some((row) => row.metadata && JSON.stringify(row.metadata).includes('UPDATE')),
    ).toBe(true);
  });

  it('does not expose a destructive competition delete operation', async () => {
    const token = await tokenFor(subjects.admin);
    await request(app.getHttpServer())
      .delete(`/api/v1/competitions/${competitionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    expect(await database.competition.count({ where: { id: competitionId } })).toBe(1);
  });
});
