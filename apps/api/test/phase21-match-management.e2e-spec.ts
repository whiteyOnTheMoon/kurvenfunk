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

describe('Task 195 Match Management isolated HTTP and PostgreSQL E2E', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwks: Server;
  let signingKey: KeyLike;
  const createdMatchIds: string[] = [];
  const clubIds: string[] = [];
  const competitionIds: string[] = [];
  const seasonIds: string[] = [];
  const stageIds: string[] = [];
  const userIds: string[] = [];
  const marker = randomUUID().slice(0, 8);
  const competitionSlug = 'p195-league-' + marker;
  const subjects = {
    admin: 'p195-admin-' + marker,
    superadmin: 'p195-superadmin-' + marker,
    editor: 'p195-editor-' + marker,
    limited: 'p195-limited-' + marker,
    banned: 'p195-banned-' + marker,
  };
  let competitionId: string;
  let seasonId: string;
  let stageId: string;
  let otherSeasonId: string;
  let otherStageId: string;
  let homeClubId: string;
  let awayClubId: string;
  let inactiveClubId: string;
  let matchId: string;
  const previousJwks = process.env.KEYCLOAK_JWKS_URL;

  async function tokenFor(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p195-' + marker })
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
      throw new Error('TASK195_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }
    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: 'p195-' + marker,
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
          nickname: 'p195-' + marker + '-' + fixture.role + '-' + fixture.status,
          status: fixture.status,
          onboardingCompleted: true,
          roleAssignments: { create: { role: fixture.role } },
        },
        select: { id: true },
      });
      userIds.push(user.id);
    }

    for (const name of ['Primary P195 League', 'Secondary P195 League']) {
      const competition = await database.competition.create({
        data: {
          name,
          slug: (name.startsWith('Primary') ? 'p195-primary-' : 'p195-secondary-') + marker,
          type: 'LEAGUE',
          countryCode: 'AT',
        },
        select: { id: true },
      });
      competitionIds.push(competition.id);
    }
    competitionId = competitionIds[0]!;
    for (const id of competitionIds) {
      const season = await database.season.create({
        data: {
          competitionId: id,
          name: '2026/27',
          slug: '2026-27',
          status: 'ACTIVE',
          active: true,
          startDate: new Date('2026-07-01T00:00:00.000Z'),
          endDate: new Date('2027-06-30T00:00:00.000Z'),
        },
        select: { id: true },
      });
      seasonIds.push(season.id);
      const stage = await database.stage.create({
        data: {
          seasonId: season.id,
          slug: 'p195-regular',
          name: 'P195 Grunddurchgang',
          type: 'REGULAR',
          sequence: 1,
        },
        select: { id: true },
      });
      stageIds.push(stage.id);
    }
    seasonId = seasonIds[0]!;
    stageId = stageIds[0]!;
    otherSeasonId = seasonIds[1]!;
    otherStageId = stageIds[1]!;

    for (const [index, name] of ['P195 Home', 'P195 Away', 'P195 Inactive'].entries()) {
      const club = await database.club.create({
        data: {
          name: name + ' ' + marker,
          slug: 'p195-club-' + index + '-' + marker,
          color1Hex: '#112233',
          color1Rgba: 'rgba(17, 34, 51, 1)',
          active: index !== 2,
        },
        select: { id: true },
      });
      clubIds.push(club.id);
    }
    homeClubId = clubIds[0]!;
    awayClubId = clubIds[1]!;
    inactiveClubId = clubIds[2]!;

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
        if (createdMatchIds.length > 0) {
          await database.auditLog.deleteMany({
            where: { targetType: 'SYSTEM', targetId: { in: createdMatchIds } },
          });
          await database.match.deleteMany({ where: { id: { in: createdMatchIds } } });
        }
        if (stageIds.length) await database.stage.deleteMany({ where: { id: { in: stageIds } } });
        if (seasonIds.length)
          await database.season.deleteMany({ where: { id: { in: seasonIds } } });
        if (competitionIds.length) {
          await database.competition.deleteMany({ where: { id: { in: competitionIds } } });
        }
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

  function sample(overrides: Record<string, unknown> = {}) {
    return {
      competitionId,
      seasonId,
      stageId,
      homeClubId,
      awayClubId,
      kickoff: '2026-10-20T17:30:00.000Z',
      matchday: 12,
      status: 'SCHEDULED',
      ...overrides,
    };
  }

  it('restricts admin fixture writes and reads to active ADMIN/SUPERADMIN', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/matches/admin/season/' + seasonId)
      .expect(401);
    await request(app.getHttpServer()).post('/api/v1/matches').send(sample()).expect(401);
    for (const subject of [subjects.editor, subjects.limited, subjects.banned]) {
      const token = await tokenFor(subject);
      await request(app.getHttpServer())
        .get('/api/v1/matches/admin/season/' + seasonId)
        .set('Authorization', 'Bearer ' + token)
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/v1/matches')
        .set('Authorization', 'Bearer ' + token)
        .send(sample())
        .expect(403);
    }
    await request(app.getHttpServer())
      .get('/api/v1/matches/admin/season/' + randomUUID())
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.admin)))
      .expect(404);
  });

  it('validates pairs, identities, UTC kickoff, season, stage and active clubs', async () => {
    const token = await tokenFor(subjects.admin);
    for (const invalid of [
      sample({ homeClubId: awayClubId }),
      sample({ kickoff: '2026-10-20T17:30:00' }),
      sample({ matchday: 0 }),
      sample({ matchday: -1 }),
      sample({ homeScore: 2 }),
      sample({ status: 'FINISHED' }),
      sample({ competitionId: competitionIds[1] }),
      sample({ stageId: otherStageId }),
      sample({ seasonId: otherSeasonId }),
      sample({ awayClubId: inactiveClubId }),
    ]) {
      await request(app.getHttpServer())
        .post('/api/v1/matches')
        .set('Authorization', 'Bearer ' + token)
        .send(invalid)
        .expect(400);
    }
    await request(app.getHttpServer())
      .patch('/api/v1/matches/' + randomUUID())
      .set('Authorization', 'Bearer ' + token)
      .send({ homeScore: 1 })
      .expect(400);
  });

  it('creates a fixture with null scores, unique key, audit and public read compatibility', async () => {
    const token = await tokenFor(subjects.admin);
    const response = await request(app.getHttpServer())
      .post('/api/v1/matches')
      .set('Authorization', 'Bearer ' + token)
      .send(sample())
      .expect(201);
    const fixture = responseData(response) as {
      id: string;
      competitionId: string;
      seasonId: string;
      homeScore: number | null;
      awayScore: number | null;
      status: string;
    };
    matchId = fixture.id;
    createdMatchIds.push(matchId);
    expect(fixture.homeScore).toBeNull();
    expect(fixture.awayScore).toBeNull();
    expect(fixture.status).toBe('SCHEDULED');
    expect(fixture.competitionId).toBe(competitionId);
    expect(fixture.seasonId).toBe(seasonId);

    await request(app.getHttpServer())
      .post('/api/v1/matches')
      .set('Authorization', 'Bearer ' + token)
      .send(sample())
      .expect(409);

    const admin = await request(app.getHttpServer())
      .get('/api/v1/matches/admin/season/' + seasonId)
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    const adminData = responseData(admin) as {
      season: { id: string; stages: { id: string }[] };
      matches: { id: string }[];
    };
    expect(adminData.season.id).toBe(seasonId);
    expect(adminData.season.stages[0]?.id).toBe(stageId);
    expect(adminData.matches.map((value) => value.id)).toContain(matchId);

    const schedule = await request(app.getHttpServer())
      .get('/api/v1/matches?competition=p195-primary-' + marker)
      .expect(200);
    const scheduleData = responseData(schedule) as { matches: { id: string }[] };
    expect(scheduleData.matches.map((value) => value.id)).toContain(matchId);
    const detail = await request(app.getHttpServer())
      .get('/api/v1/matches/' + matchId)
      .expect(200);
    expect((responseData(detail) as { id: string }).id).toBe(matchId);
  });

  it('reschedules the same UUID, preserves scorelessness and prevents duplicate updates', async () => {
    const token = await tokenFor(subjects.superadmin);
    const reschedule = await request(app.getHttpServer())
      .patch('/api/v1/matches/' + matchId)
      .set('Authorization', 'Bearer ' + token)
      .send({
        kickoff: '2026-10-22T17:30:00.000Z',
        status: 'POSTPONED',
        matchday: null,
      })
      .expect(200);
    const match = responseData(reschedule) as {
      id: string;
      status: string;
      matchday: number | null;
      kickoff: string;
      homeScore: number | null;
    };
    expect(match.id).toBe(matchId);
    expect(match.status).toBe('POSTPONED');
    expect(match.matchday).toBeNull();
    expect(match.kickoff).toBe('2026-10-22T17:30:00.000Z');
    expect(match.homeScore).toBeNull();

    const reopened = await request(app.getHttpServer())
      .patch('/api/v1/matches/' + matchId)
      .set('Authorization', 'Bearer ' + token)
      .send({ status: 'SCHEDULED', kickoff: '2026-10-23T17:30:00.000Z' })
      .expect(200);
    expect((responseData(reopened) as { id: string }).id).toBe(matchId);
    expect(await database.match.count({ where: { id: matchId } })).toBe(1);

    const extraResponse = await request(app.getHttpServer())
      .post('/api/v1/matches')
      .set('Authorization', 'Bearer ' + token)
      .send(sample({ kickoff: '2026-10-30T17:30:00.000Z', matchday: 13 }))
      .expect(201);
    const extraId = (responseData(extraResponse) as { id: string }).id;
    createdMatchIds.push(extraId);

    await request(app.getHttpServer())
      .patch('/api/v1/matches/' + extraId)
      .set('Authorization', 'Bearer ' + token)
      .send({ kickoff: '2026-10-23T17:30:00.000Z' })
      .expect(409);
    expect(await database.match.count({ where: { seasonId } })).toBe(2);

    const audits = await database.auditLog.findMany({
      where: { targetType: 'SYSTEM', targetId: { in: createdMatchIds } },
      select: { metadata: true, actorUserId: true },
    });
    expect(audits).toHaveLength(4);
    expect(audits.every((audit) => audit.actorUserId !== null)).toBe(true);
  });

  it('locks live and finished results and exposes no destructive delete route', async () => {
    const token = await tokenFor(subjects.admin);
    await database.match.update({
      where: { id: matchId },
      data: { status: 'FINISHED', homeScore: 2, awayScore: 1 },
    });

    await request(app.getHttpServer())
      .patch('/api/v1/matches/' + matchId)
      .set('Authorization', 'Bearer ' + token)
      .send({ kickoff: '2026-10-24T17:30:00.000Z' })
      .expect(409);
    const persisted = await database.match.findUniqueOrThrow({ where: { id: matchId } });
    expect(persisted.kickoff.toISOString()).toBe('2026-10-23T17:30:00.000Z');
    expect(persisted.homeScore).toBe(2);

    await request(app.getHttpServer())
      .delete('/api/v1/matches/' + matchId)
      .expect(404);
  });
});
