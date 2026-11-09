import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import request from 'supertest';
import type { App } from 'supertest/types';

function unwrap(response: { body: unknown }): unknown {
  return (response.body as { data: unknown }).data;
}

describe('Phase 21.197 Standings PostgreSQL/Redis and signed JWT E2E', () => {
  let app: INestApplication<App>;
  let db: DatabaseClient;
  let jwks: Server;
  let key: KeyLike;
  const marker = randomUUID().slice(0, 8);
  const actorSubjects = {
    admin: 'p197-admin-' + marker,
    superadmin: 'p197-superadmin-' + marker,
    editor: 'p197-editor-' + marker,
    limited: 'p197-limited-' + marker,
    banned: 'p197-banned-' + marker,
  };
  const userIds: string[] = [];
  const clubIds: string[] = [];
  const rowIds: string[] = [];
  const stageIds: string[] = [];
  let competitionId: string | undefined;
  let seasonId: string | undefined;
  let otherSeasonId: string | undefined;
  let otherStageId: string | undefined;
  let otherCompetitionId: string | undefined;
  const previousJwks = process.env.KEYCLOAK_JWKS_URL;

  async function jwt(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p197-' + marker })
      .setSubject(subject)
      .setIssuer(process.env.KEYCLOAK_ISSUER!)
      .setAudience(process.env.KEYCLOAK_AUDIENCE!)
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(key);
  }

  function sample(overrides: Record<string, unknown> = {}) {
    return {
      clubId: clubIds[0],
      stageId: null,
      position: 1,
      played: 3,
      won: 2,
      drawn: 1,
      lost: 0,
      goalsFor: 7,
      goalsAgainst: 2,
      points: 5,
      deductionPoints: 2,
      sortOrder: null,
      ...overrides,
    };
  }

  async function create(input: Record<string, unknown>, as = actorSubjects.admin) {
    return request(app.getHttpServer())
      .post('/api/v1/standings/admin/season/' + seasonId + '/rows')
      .set('Authorization', 'Bearer ' + (await jwt(as)))
      .send(input);
  }

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      url.hostname !== '127.0.0.1' ||
      url.pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('TASK197_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }

    const pair = await generateKeyPair('RS256');
    key = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: 'p197-' + marker,
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

    db = createPrismaClient();
    for (const person of [
      { subject: actorSubjects.admin, role: 'ADMIN', status: 'ACTIVE' },
      { subject: actorSubjects.superadmin, role: 'SUPERADMIN', status: 'ACTIVE' },
      { subject: actorSubjects.editor, role: 'EDITOR', status: 'ACTIVE' },
      { subject: actorSubjects.limited, role: 'ADMIN', status: 'LIMITED' },
      { subject: actorSubjects.banned, role: 'ADMIN', status: 'BANNED' },
    ] as const) {
      const user = await db.user.create({
        data: {
          keycloakSubject: person.subject,
          nickname: 'p197-' + marker + '-' + person.role + '-' + person.status,
          status: person.status,
          onboardingCompleted: true,
          roleAssignments: { create: { role: person.role } },
        },
        select: { id: true },
      });
      userIds.push(user.id);
    }

    for (const name of ['Main P197 League', 'Other P197 League']) {
      const competition = await db.competition.create({
        data: {
          slug: 'p197-' + name.toLowerCase().replaceAll(' ', '-') + '-' + marker,
          name,
          type: 'LEAGUE',
          countryCode: 'AT',
          active: true,
        },
        select: { id: true },
      });
      const season = await db.season.create({
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
      if (!competitionId) {
        competitionId = competition.id;
        seasonId = season.id;
      } else {
        otherCompetitionId = competition.id;
        otherSeasonId = season.id;
      }
    }

    for (const [index, scopeSeason] of [seasonId, seasonId, otherSeasonId].entries()) {
      const stage = await db.stage.create({
        data: {
          seasonId: scopeSeason!,
          name: 'P197 Stage ' + index,
          slug: 'p197-stage-' + index,
          type: 'REGULAR',
          sequence: index + 1,
        },
        select: { id: true },
      });
      stageIds.push(stage.id);
    }
    otherStageId = stageIds[2];

    for (const [index, name] of ['P197 Club A', 'P197 Club B', 'P197 Historic Club'].entries()) {
      const club = await db.club.create({
        data: {
          slug: 'p197-club-' + index + '-' + marker,
          name: name + ' ' + marker,
          color1Hex: '#112233',
          color1Rgba: 'rgba(17, 34, 51, 1)',
          active: index !== 2,
        },
        select: { id: true },
      });
      clubIds.push(club.id);
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
      if (db) {
        if (rowIds.length) {
          await db.auditLog.deleteMany({
            where: { targetType: 'SYSTEM', targetId: { in: rowIds } },
          });
          await db.standing.deleteMany({ where: { id: { in: rowIds } } });
        }
        if (stageIds.length) await db.stage.deleteMany({ where: { id: { in: stageIds } } });
        if (seasonId) await db.season.delete({ where: { id: seasonId } });
        if (otherSeasonId) await db.season.delete({ where: { id: otherSeasonId } });
        if (competitionId) await db.competition.delete({ where: { id: competitionId } });
        if (otherCompetitionId) {
          await db.competition.delete({ where: { id: otherCompetitionId } });
        }
        if (clubIds.length) await db.club.deleteMany({ where: { id: { in: clubIds } } });
        if (userIds.length) {
          await db.userRoleAssignment.deleteMany({ where: { userId: { in: userIds } } });
          await db.user.deleteMany({ where: { id: { in: userIds } } });
        }
        await db.$disconnect();
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

  it('protects admin reads and writes from anonymous, editor and limited accounts', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/standings/admin/season/' + seasonId)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/standings/admin/season/' + seasonId + '/rows')
      .send(sample())
      .expect(401);
    for (const actor of [actorSubjects.editor, actorSubjects.limited, actorSubjects.banned]) {
      const token = await jwt(actor);
      await request(app.getHttpServer())
        .get('/api/v1/standings/admin/season/' + seasonId)
        .set('Authorization', 'Bearer ' + token)
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/v1/standings/admin/season/' + seasonId + '/rows')
        .set('Authorization', 'Bearer ' + token)
        .send(sample())
        .expect(403);
    }
  });

  it('rejects incomplete counters, calculated field overrides and foreign stages/clubs', async () => {
    for (const input of [
      sample({ played: 4 }),
      sample({ goalsFor: -1 }),
      sample({ position: 0 }),
      sample({ goalDifference: 999 }),
      sample({ clubId: randomUUID() }),
      sample({ stageId: otherStageId }),
      sample({ stageId: 'not-a-uuid' }),
    ]) {
      await create(input).expect(400);
    }
    const token = await jwt(actorSubjects.admin);
    await request(app.getHttpServer())
      .get('/api/v1/standings/season/' + seasonId + '?stageId=' + otherStageId)
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/standings/season/' + randomUUID())
      .expect(404);
    await request(app.getHttpServer())
      .patch('/api/v1/standings/admin/rows/' + randomUUID())
      .set('Authorization', 'Bearer ' + token)
      .send({ position: 1 })
      .expect(400);
  });

  it('creates a season-wide row and blocks the second row for the same club and null stage', async () => {
    const response = await create(sample()).expect(201);
    const row = unwrap(response) as {
      id: string;
      position: number;
      goalDifference: number;
      points: number;
      deductionPoints: number;
      stageId: string | null;
    };
    rowIds.push(row.id);
    expect(row.goalDifference).toBe(5);
    expect(row.points).toBe(5);
    expect(row.deductionPoints).toBe(2);
    expect(row.stageId).toBeNull();

    await create(sample({ position: 2 })).expect(409);
    expect(await db.standing.count({ where: { seasonId, stageId: null, clubId: clubIds[0] } }))
      .toBe(1);

    const publicResponse = await request(app.getHttpServer())
      .get('/api/v1/standings/season/' + seasonId)
      .expect(200);
    const data = unwrap(publicResponse) as {
      stage: unknown;
      standings: { id: string; goalDifference: number }[];
    };
    expect(data.stage).toBeNull();
    expect(data.standings[0]?.id).toBe(row.id);
  });

  it('separates stages and preserves historic inactive clubs', async () => {
    const first = await create(sample({ stageId: stageIds[0] })).expect(201);
    const second = await create(sample({ stageId: stageIds[1], clubId: clubIds[2] }))
      .expect(201);
    const firstId = (unwrap(first) as { id: string }).id;
    const secondId = (unwrap(second) as { id: string }).id;
    rowIds.push(firstId, secondId);
    await create(sample({ stageId: stageIds[0] })).expect(409);

    const firstRead = await request(app.getHttpServer())
      .get('/api/v1/standings/season/' + seasonId + '?stageId=' + stageIds[0])
      .expect(200);
    const firstRows = (unwrap(firstRead) as { standings: { id: string }[] }).standings;
    expect(firstRows.map((row) => row.id)).toEqual([firstId]);

    const secondRead = await request(app.getHttpServer())
      .get('/api/v1/standings/season/' + seasonId + '?stageId=' + stageIds[1])
      .expect(200);
    const secondRows = (unwrap(secondRead) as { standings: { id: string; club: { active: boolean } }[] })
      .standings;
    expect(secondRows.map((row) => row.id)).toEqual([secondId]);
    expect(secondRows[0]?.club.active).toBe(false);
  });

  it('updates a row in place, audits before/after and rejects stale revisions', async () => {
    const id = rowIds[0];
    const admin = await jwt(actorSubjects.superadmin);
    const before = await db.standing.findUniqueOrThrow({
      where: { id },
      select: { updatedAt: true, position: true },
    });
    const correction = {
      position: 2,
      played: 4,
      won: 2,
      drawn: 1,
      lost: 1,
      goalsFor: 8,
      goalsAgainst: 4,
      points: 4,
      deductionPoints: 3,
      sortOrder: null,
      expectedUpdatedAt: before.updatedAt.toISOString(),
    };
    const response = await request(app.getHttpServer())
      .patch('/api/v1/standings/admin/rows/' + id)
      .set('Authorization', 'Bearer ' + admin)
      .send(correction)
      .expect(200);
    const updated = unwrap(response) as {
      id: string;
      goalDifference: number;
      points: number;
      stageId: string | null;
      clubId: string;
    };
    expect(updated.id).toBe(id);
    expect(updated.clubId).toBe(clubIds[0]);
    expect(updated.stageId).toBeNull();
    expect(updated.goalDifference).toBe(4);
    expect(updated.points).toBe(4);

    await request(app.getHttpServer())
      .patch('/api/v1/standings/admin/rows/' + id)
      .set('Authorization', 'Bearer ' + admin)
      .send({ ...correction, position: 3 })
      .expect(409);

    const audit = await db.auditLog.findMany({
      where: { targetType: 'SYSTEM', targetId: id },
      select: { metadata: true, actorUserId: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    expect(audit).toHaveLength(2);
    expect(audit[1]?.actorUserId).not.toBeNull();
    expect(audit[1]?.metadata).toMatchObject({
      entity: 'STANDING',
      before: { position: 1, points: 5, goalDifference: 5 },
      after: { position: 2, points: 4, goalDifference: 4 },
    });
  });

  it('keeps legacy active-season standings API working', async () => {
    const legacy = await request(app.getHttpServer())
      .get('/api/v1/standings/p197-main-p197-league-' + marker)
      .expect(200);
    const standings = unwrap(legacy) as {
      season: { id: string };
      stage: { id: string } | null;
      standings: { id: string }[];
    };
    expect(standings.season.id).toBe(seasonId);
    expect(standings.stage?.id).toBe(stageIds[1]);
    expect(standings.standings.map((row) => row.id)).toContain(rowIds[2]);
  });
});
