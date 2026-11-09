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

type ResultStatus = 'LIVE' | 'FINISHED' | 'ABANDONED';
interface Scores {
  status: ResultStatus;
  homeScore: number | null;
  awayScore: number | null;
}

describe('Task 196 Results isolated HTTP/JWT/PostgreSQL E2E', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwks: Server;
  let signingKey: KeyLike;
  const marker = randomUUID().slice(0, 8);
  const subject = {
    admin: 'p196-admin-' + marker,
    superadmin: 'p196-superadmin-' + marker,
    editor: 'p196-editor-' + marker,
    limited: 'p196-limited-' + marker,
    banned: 'p196-banned-' + marker,
  };
  const userIds: string[] = [];
  const clubIds: string[] = [];
  const matchIds: string[] = [];
  let competitionId: string | undefined;
  let seasonId: string | undefined;
  const fixtureIds: Record<string, string> = {};
  const previousJwks = process.env.KEYCLOAK_JWKS_URL;

  async function tokenFor(keycloakSubject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p196-' + marker })
      .setSubject(keycloakSubject)
      .setIssuer(process.env.KEYCLOAK_ISSUER!)
      .setAudience(process.env.KEYCLOAK_AUDIENCE!)
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(signingKey);
  }

  async function current(id: string) {
    return database.match.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        updatedAt: true,
        status: true,
        homeScore: true,
        awayScore: true,
      },
    });
  }

  async function patch(id: string, scores: Scores, as = subject.admin) {
    const before = await current(id);
    return request(app.getHttpServer())
      .patch('/api/v1/matches/' + id + '/result')
      .set('Authorization', 'Bearer ' + (await tokenFor(as)))
      .send({ ...scores, expectedUpdatedAt: before.updatedAt.toISOString() });
  }

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      url.hostname !== '127.0.0.1' ||
      url.pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('TASK196_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }
    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: 'p196-' + marker,
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
      { keycloakSubject: subject.admin, role: 'ADMIN', status: 'ACTIVE' },
      { keycloakSubject: subject.superadmin, role: 'SUPERADMIN', status: 'ACTIVE' },
      { keycloakSubject: subject.editor, role: 'EDITOR', status: 'ACTIVE' },
      { keycloakSubject: subject.limited, role: 'ADMIN', status: 'LIMITED' },
      { keycloakSubject: subject.banned, role: 'ADMIN', status: 'BANNED' },
    ] as const) {
      const user = await database.user.create({
        data: {
          keycloakSubject: fixture.keycloakSubject,
          nickname: 'p196-' + marker + '-' + fixture.role + '-' + fixture.status,
          status: fixture.status,
          onboardingCompleted: true,
          roleAssignments: { create: { role: fixture.role } },
        },
        select: { id: true },
      });
      userIds.push(user.id);
    }

    const competition = await database.competition.create({
      data: {
        slug: 'p196-' + marker,
        name: 'P196 Synthetic League',
        type: 'LEAGUE',
        countryCode: 'AT',
        active: true,
      },
      select: { id: true },
    });
    competitionId = competition.id;
    const season = await database.season.create({
      data: {
        competitionId: competition.id,
        slug: '2026-27',
        name: '2026/27',
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2027-06-30T00:00:00.000Z'),
        status: 'ACTIVE',
        active: true,
      },
      select: { id: true },
    });
    seasonId = season.id;

    for (const name of ['P196 Home', 'P196 Away']) {
      const club = await database.club.create({
        data: {
          slug: name.toLowerCase().replaceAll(' ', '-') + '-' + marker,
          name: name + ' ' + marker,
          color1Hex: '#112233',
          color1Rgba: 'rgba(17, 34, 51, 1)',
          active: true,
        },
        select: { id: true },
      });
      clubIds.push(club.id);
    }

    for (const [index, fixture] of (
      [
        { key: 'scheduled', status: 'SCHEDULED', homeScore: null, awayScore: null },
        { key: 'finished', status: 'FINISHED', homeScore: 2, awayScore: 1 },
        { key: 'live', status: 'LIVE', homeScore: null, awayScore: null },
        { key: 'abandoned', status: 'ABANDONED', homeScore: 1, awayScore: 0 },
        { key: 'postponed', status: 'POSTPONED', homeScore: null, awayScore: null },
        { key: 'cancelled', status: 'CANCELLED', homeScore: null, awayScore: null },
        { key: 'concurrent', status: 'LIVE', homeScore: 0, awayScore: 0 },
      ] as const
    ).entries()) {
      const match = await database.match.create({
        data: {
          competitionId: competition.id,
          seasonId: season.id,
          homeClubId: clubIds[0],
          awayClubId: clubIds[1],
          kickoff: new Date('2026-10-' + String(11 + index) + 'T17:30:00.000Z'),
          matchday: index + 1,
          status: fixture.status,
          homeScore: fixture.homeScore,
          awayScore: fixture.awayScore,
        },
        select: { id: true },
      });
      matchIds.push(match.id);
      fixtureIds[fixture.key] = match.id;
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
        if (matchIds.length) {
          await database.auditLog.deleteMany({
            where: { targetType: 'SYSTEM', targetId: { in: matchIds } },
          });
          await database.match.deleteMany({ where: { id: { in: matchIds } } });
        }
        if (seasonId) await database.season.delete({ where: { id: seasonId } });
        if (competitionId) await database.competition.delete({ where: { id: competitionId } });
        if (clubIds.length) await database.club.deleteMany({ where: { id: { in: clubIds } } });
        if (userIds.length) {
          await database.userRoleAssignment.deleteMany({ where: { userId: { in: userIds } } });
          await database.user.deleteMany({ where: { id: { in: userIds } } });
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

  it('protects result writes by role and account status', async () => {
    const id = fixtureIds.scheduled;
    const before = await current(id);
    const body = {
      status: 'FINISHED',
      homeScore: 0,
      awayScore: 0,
      expectedUpdatedAt: before.updatedAt.toISOString(),
    };
    await request(app.getHttpServer())
      .patch('/api/v1/matches/' + id + '/result')
      .send(body)
      .expect(401);
    for (const keycloakSubject of [subject.editor, subject.limited, subject.banned]) {
      await request(app.getHttpServer())
        .patch('/api/v1/matches/' + id + '/result')
        .set('Authorization', 'Bearer ' + (await tokenFor(keycloakSubject)))
        .send(body)
        .expect(403);
    }
  });

  it('rejects invalid scores, missing revision, unknown fields and unsupported status', async () => {
    const id = fixtureIds.scheduled;
    const token = await tokenFor(subject.admin);
    const before = await current(id);
    const input = {
      status: 'FINISHED',
      homeScore: 0,
      awayScore: 0,
      expectedUpdatedAt: before.updatedAt.toISOString(),
    };
    for (const bad of [
      { ...input, homeScore: -1 },
      { ...input, awayScore: 1.5 },
      { ...input, homeScore: null },
      { ...input, homeScore: null, awayScore: null },
      { ...input, homeScore: '2' },
      { ...input, status: 'CANCELLED' },
      { ...input, expectedUpdatedAt: '2026-11-09T18:00:00' },
      { ...input, expectedUpdatedAt: undefined },
      { ...input, kickoff: '2026-11-09T18:00:00Z' },
    ]) {
      await request(app.getHttpServer())
        .patch('/api/v1/matches/' + id + '/result')
        .set('Authorization', 'Bearer ' + token)
        .send(bad)
        .expect(400);
    }
    await request(app.getHttpServer())
      .patch('/api/v1/matches/' + randomUUID() + '/result')
      .set('Authorization', 'Bearer ' + token)
      .send(input)
      .expect(404);
  });

  it('backfills a scheduled match to a final 0:0 and exposes it publicly', async () => {
    const id = fixtureIds.scheduled;
    const result = await patch(id, {
      status: 'FINISHED',
      homeScore: 0,
      awayScore: 0,
    });
    expect(result.status).toBe(200);
    const changed = responseData(result) as { id: string; status: string; homeScore: number };
    expect(changed.id).toBe(id);
    expect(changed.status).toBe('FINISHED');
    expect(changed.homeScore).toBe(0);

    const detail = await request(app.getHttpServer())
      .get('/api/v1/matches/' + id)
      .expect(200);
    const data = responseData(detail) as { status: string; homeScore: number; awayScore: number };
    expect(data.status).toBe('FINISHED');
    expect(data.homeScore).toBe(0);
    expect(data.awayScore).toBe(0);

    const schedule = await request(app.getHttpServer())
      .get('/api/v1/matches?competition=p196-' + marker)
      .expect(200);
    const scheduleData = responseData(schedule) as {
      matches: { id: string; homeScore: number | null; status: string }[];
    };
    expect(scheduleData.matches.find((match) => match.id === id)).toMatchObject({
      status: 'FINISHED',
      homeScore: 0,
    });
  });

  it('corrects a finished result, rejects a stale revision and locks fixture editing', async () => {
    const id = fixtureIds.finished;
    const previous = await current(id);
    const result = await patch(
      id,
      { status: 'FINISHED', homeScore: 3, awayScore: 2 },
      subject.superadmin,
    );
    expect(result.status).toBe(200);

    const stale = await request(app.getHttpServer())
      .patch('/api/v1/matches/' + id + '/result')
      .set('Authorization', 'Bearer ' + (await tokenFor(subject.admin)))
      .send({
        status: 'FINISHED',
        homeScore: 9,
        awayScore: 9,
        expectedUpdatedAt: previous.updatedAt.toISOString(),
      });
    expect(stale.status).toBe(409);

    const after = await current(id);
    expect(after.homeScore).toBe(3);
    expect(after.awayScore).toBe(2);

    await request(app.getHttpServer())
      .patch('/api/v1/matches/' + id)
      .set('Authorization', 'Bearer ' + (await tokenFor(subject.admin)))
      .send({ status: 'CANCELLED' })
      .expect(409);

    const audit = await database.auditLog.findMany({
      where: { targetType: 'SYSTEM', targetId: id },
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]?.actorUserId).not.toBeNull();
    expect(audit[0]?.metadata).toMatchObject({
      entity: 'MATCH_RESULT',
      before: { status: 'FINISHED', homeScore: 2, awayScore: 1 },
      after: { status: 'FINISHED', homeScore: 3, awayScore: 2 },
    });
  });

  it('records a live score, finalizes the game, then forbids reversing the final result', async () => {
    const id = fixtureIds.live;
    expect((await patch(id, { status: 'LIVE', homeScore: 1, awayScore: 0 })).status).toBe(200);
    expect((await patch(id, { status: 'FINISHED', homeScore: 1, awayScore: 1 })).status).toBe(200);
    expect((await patch(id, { status: 'LIVE', homeScore: 1, awayScore: 0 })).status).toBe(409);

    const noOp = await patch(id, { status: 'FINISHED', homeScore: 1, awayScore: 1 });
    expect(noOp.status).toBe(200);
    const audit = await database.auditLog.count({
      where: { targetType: 'SYSTEM', targetId: id },
    });
    expect(audit).toBe(2);
  });

  it('supports abandoned-score correction but never turns an abandoned match into a final', async () => {
    const id = fixtureIds.abandoned;
    expect((await patch(id, { status: 'ABANDONED', homeScore: 1, awayScore: 1 })).status).toBe(200);
    expect((await patch(id, { status: 'FINISHED', homeScore: 1, awayScore: 1 })).status).toBe(409);
  });

  it('does not create a score for postponed or cancelled games', async () => {
    for (const key of ['postponed', 'cancelled']) {
      expect(
        (await patch(fixtureIds[key], { status: 'FINISHED', homeScore: 1, awayScore: 0 })).status,
      ).toBe(409);
    }
  });

  it('serializes concurrent results: only one write to the same revision succeeds', async () => {
    const id = fixtureIds.concurrent;
    const before = await current(id);
    const token = await tokenFor(subject.admin);
    const results = await Promise.all(
      [
        { status: 'LIVE', homeScore: 1, awayScore: 0 },
        { status: 'LIVE', homeScore: 0, awayScore: 1 },
      ].map((data) =>
        request(app.getHttpServer())
          .patch('/api/v1/matches/' + id + '/result')
          .set('Authorization', 'Bearer ' + token)
          .send({ ...data, expectedUpdatedAt: before.updatedAt.toISOString() }),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    expect(
      await database.auditLog.count({
        where: { targetType: 'SYSTEM', targetId: id },
      }),
    ).toBe(1);
    const currentMatch = await current(id);
    expect(
      [`${currentMatch.homeScore}:${currentMatch.awayScore}`].some((score) =>
        ['1:0', '0:1'].includes(score),
      ),
    ).toBe(true);
  });
});
