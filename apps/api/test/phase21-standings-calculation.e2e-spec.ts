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

interface CalcRow {
  clubId: string;
  position: number;
  played: number;
  points: number;
  goalDifference: number;
  deductionPoints: number;
  existingId: string | null;
  changed: boolean;
}

interface Preview {
  seasonId: string;
  stageId: string | null;
  profile: string;
  previewHash: string;
  finishedMatches: number;
  excludedMatches: number;
  existingCount: number;
  canApply: boolean;
  unresolvedTies: string[][];
  rows: CalcRow[];
}

describe('Phase 21.198 Standings Calculation HTTP/Postgres/JWT E2E', () => {
  let app: INestApplication<App>;
  let db: DatabaseClient;
  let jwks: Server;
  let signingKey: KeyLike;
  const marker = randomUUID().slice(0, 8);
  const subjects = {
    admin: 'p198-admin-' + marker,
    superadmin: 'p198-superadmin-' + marker,
    editor: 'p198-editor-' + marker,
    limited: 'p198-limited-' + marker,
    banned: 'p198-banned-' + marker,
  };
  const userIds: string[] = [];
  const clubIds: string[] = [];
  const matchIds: string[] = [];
  let competitionId: string | undefined;
  let cupCompetitionId: string | undefined;
  let seasonId: string | undefined;
  let emptySeasonId: string | undefined;
  let cupSeasonId: string | undefined;
  let stageId: string | undefined;
  let otherStageId: string | undefined;
  const previousJwks = process.env.KEYCLOAK_JWKS_URL;
  const competitionSlug = 'p198-league-' + marker;

  async function tokenFor(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p198-' + marker })
      .setSubject(subject)
      .setIssuer(process.env.KEYCLOAK_ISSUER!)
      .setAudience(process.env.KEYCLOAK_AUDIENCE!)
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(signingKey);
  }

  async function preview(stage: string | null = stageId!, subject = subjects.admin) {
    return request(app.getHttpServer())
      .post('/api/v1/standings/admin/season/' + seasonId + '/calculate/preview')
      .set('Authorization', 'Bearer ' + (await tokenFor(subject)))
      .send({ stageId: stage })
      .expect(201);
  }

  async function apply(
    source: Preview,
    overwriteExisting: boolean,
    status: number,
    subject = subjects.admin,
  ) {
    return request(app.getHttpServer())
      .post('/api/v1/standings/admin/season/' + seasonId + '/calculate/apply')
      .set('Authorization', 'Bearer ' + (await tokenFor(subject)))
      .send({
        stageId: source.stageId,
        expectedPreviewHash: source.previewHash,
        overwriteExisting,
      })
      .expect(status);
  }

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      url.hostname !== '127.0.0.1' ||
      url.pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('TASK198_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }
    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: 'p198-' + marker,
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
    for (const user of [
      { subject: subjects.admin, role: 'ADMIN', status: 'ACTIVE' },
      { subject: subjects.superadmin, role: 'SUPERADMIN', status: 'ACTIVE' },
      { subject: subjects.editor, role: 'EDITOR', status: 'ACTIVE' },
      { subject: subjects.limited, role: 'ADMIN', status: 'LIMITED' },
      { subject: subjects.banned, role: 'ADMIN', status: 'BANNED' },
    ] as const) {
      const saved = await db.user.create({
        data: {
          keycloakSubject: user.subject,
          nickname: 'p198-' + marker + '-' + user.role + '-' + user.status,
          status: user.status,
          onboardingCompleted: true,
          roleAssignments: { create: { role: user.role } },
        },
        select: { id: true },
      });
      userIds.push(saved.id);
    }

    const competition = await db.competition.create({
      data: {
        slug: competitionSlug,
        name: 'P198 Synthetic League',
        type: 'LEAGUE',
        countryCode: 'AT',
      },
      select: { id: true },
    });
    competitionId = competition.id;
    const cup = await db.competition.create({
      data: {
        slug: 'p198-cup-' + marker,
        name: 'P198 Synthetic Cup',
        type: 'CUP',
        countryCode: 'AT',
      },
      select: { id: true },
    });
    cupCompetitionId = cup.id;

    for (const [index, group] of [
      { compId: competitionId, slug: '2026-27', active: true },
      { compId: competitionId, slug: '2025-26', active: false },
      { compId: cupCompetitionId, slug: '2026-27', active: true },
    ].entries()) {
      const season = await db.season.create({
        data: {
          competitionId: group.compId!,
          name: group.slug,
          slug: group.slug,
          status: group.active ? 'ACTIVE' : 'PLANNED',
          active: group.active,
          startDate: new Date('2026-07-01T00:00:00.000Z'),
          endDate: new Date('2027-06-30T00:00:00.000Z'),
        },
        select: { id: true },
      });
      if (index === 0) seasonId = season.id;
      if (index === 1) emptySeasonId = season.id;
      if (index === 2) cupSeasonId = season.id;
    }

    const regular = await db.stage.create({
      data: {
        seasonId: seasonId!,
        slug: 'grunddurchgang',
        name: 'Grunddurchgang',
        type: 'REGULAR',
        sequence: 1,
      },
      select: { id: true },
    });
    stageId = regular.id;
    const foreign = await db.stage.create({
      data: {
        seasonId: emptySeasonId!,
        slug: 'other',
        name: 'Other Season',
        type: 'REGULAR',
        sequence: 1,
      },
      select: { id: true },
    });
    otherStageId = foreign.id;

    for (const [index, club] of ['A', 'B', 'C'].entries()) {
      const saved = await db.club.create({
        data: {
          slug: 'p198-club-' + club.toLowerCase() + '-' + marker,
          name: 'P198 Team ' + club,
          color1Hex: '#123456',
          color1Rgba: 'rgba(18, 52, 86, 1)',
          active: index !== 2,
        },
        select: { id: true },
      });
      clubIds.push(saved.id);
    }
    for (const [index, match] of (
      [
        { h: 0, a: 1, status: 'FINISHED', hs: 2, as: 0 },
        { h: 1, a: 2, status: 'FINISHED', hs: 0, as: 0 },
        { h: 2, a: 0, status: 'FINISHED', hs: 1, as: 0 },
        { h: 1, a: 0, status: 'SCHEDULED', hs: null, as: null },
      ] as const
    ).entries()) {
      const saved = await db.match.create({
        data: {
          competitionId: competitionId!,
          seasonId: seasonId!,
          stageId: stageId!,
          homeClubId: clubIds[match.h]!,
          awayClubId: clubIds[match.a]!,
          kickoff: new Date('2026-10-' + String(11 + index) + 'T17:30:00.000Z'),
          matchday: index + 1,
          status: match.status,
          homeScore: match.hs,
          awayScore: match.as,
        },
        select: { id: true },
      });
      matchIds.push(saved.id);
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
        const rows = await db.standing.findMany({
          where: { seasonId },
          select: { id: true },
        });
        const rowIds = rows.map((row) => row.id);
        await db.auditLog.deleteMany({
          where: {
            targetType: 'SYSTEM',
            targetId: { in: [...rowIds, seasonId!].filter(Boolean) },
          },
        });
        if (rowIds.length) await db.standing.deleteMany({ where: { id: { in: rowIds } } });
        if (matchIds.length) await db.match.deleteMany({ where: { id: { in: matchIds } } });
        if (stageId) await db.stage.delete({ where: { id: stageId } });
        if (otherStageId) await db.stage.delete({ where: { id: otherStageId } });
        if (seasonId) await db.season.delete({ where: { id: seasonId } });
        if (emptySeasonId) await db.season.delete({ where: { id: emptySeasonId } });
        if (cupSeasonId) await db.season.delete({ where: { id: cupSeasonId } });
        if (competitionId) await db.competition.delete({ where: { id: competitionId } });
        if (cupCompetitionId) await db.competition.delete({ where: { id: cupCompetitionId } });
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

  it('protects preview/apply from unauthenticated and non-admin callers', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/standings/admin/season/' + seasonId + '/calculate/preview')
      .send({ stageId })
      .expect(401);
    for (const user of [subjects.editor, subjects.limited, subjects.banned]) {
      await request(app.getHttpServer())
        .post('/api/v1/standings/admin/season/' + seasonId + '/calculate/preview')
        .set('Authorization', 'Bearer ' + (await tokenFor(user)))
        .send({ stageId })
        .expect(403);
    }
    await request(app.getHttpServer())
      .post('/api/v1/standings/admin/season/' + seasonId + '/calculate/apply')
      .send({ stageId, expectedPreviewHash: 'a'.repeat(64), overwriteExisting: false })
      .expect(401);
  });

  it('checks explicit scope and forbids cup and other-season stages', async () => {
    const token = await tokenFor(subjects.admin);
    for (const body of [{}, { stageId: 'abc' }, { stageId: otherStageId }]) {
      await request(app.getHttpServer())
        .post('/api/v1/standings/admin/season/' + seasonId + '/calculate/preview')
        .set('Authorization', 'Bearer ' + token)
        .send(body)
        .expect(400);
    }
    await request(app.getHttpServer())
      .post('/api/v1/standings/admin/season/' + cupSeasonId + '/calculate/preview')
      .set('Authorization', 'Bearer ' + token)
      .send({ stageId: null })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/standings/admin/season/' + randomUUID() + '/calculate/preview')
      .set('Authorization', 'Bearer ' + token)
      .send({ stageId: null })
      .expect(404);
  });

  it('previews a league table without persisting it and ignores scheduled games', async () => {
    const result = await preview();
    const data = unwrap(result) as Preview;
    expect(data.profile).toBe('STANDARD');
    expect(data.existingCount).toBe(0);
    expect(data.finishedMatches).toBe(3);
    expect(data.excludedMatches).toBe(1);
    expect(data.canApply).toBe(true);
    expect(data.unresolvedTies).toEqual([]);
    expect(data.previewHash).toMatch(/^[a-f0-9]{64}$/);
    expect(data.rows.map((row) => [row.clubId, row.position, row.points])).toEqual([
      [clubIds[2], 1, 4],
      [clubIds[0], 2, 3],
      [clubIds[1], 3, 1],
    ]);
    expect(await db.standing.count({ where: { seasonId } })).toBe(0);
  });

  it('requires explicit preview hash and creates auditable, stable identities', async () => {
    const first = unwrap(await preview()) as Preview;
    await apply({ ...first, previewHash: '0'.repeat(64) }, false, 409);
    const applied = unwrap(await apply(first, false, 201)) as {
      created: number;
      updated: number;
      unchanged: number;
    };
    expect(applied).toMatchObject({ created: 3, updated: 0, unchanged: 0 });
    const rows = await db.standing.findMany({ where: { seasonId, stageId } });
    expect(rows).toHaveLength(3);
    expect(rows.find((row) => row.clubId === clubIds[2])?.points).toBe(4);
    expect(
      await db.auditLog.count({
        where: {
          targetType: 'SYSTEM',
          targetId: { in: rows.map((row) => row.id) },
        },
      }),
    ).toBe(3);

    const second = unwrap(await preview()) as Preview;
    expect(second.existingCount).toBe(3);
    await apply(second, false, 409);
    const replay = unwrap(await apply(second, true, 201)) as {
      created: number;
      updated: number;
      unchanged: number;
    };
    expect(replay).toMatchObject({ created: 0, updated: 0, unchanged: 3 });
  });

  it('rejects stale previews after score changes; updates existing Standing UUIDs', async () => {
    const before = unwrap(await preview()) as Preview;
    const saved = await db.standing.findFirstOrThrow({
      where: { seasonId, clubId: clubIds[0], stageId },
      select: { id: true },
    });
    await db.match.update({
      where: { id: matchIds[0] },
      data: { homeScore: 3 },
    });
    await apply(before, true, 409);
    expect((await db.standing.findUniqueOrThrow({ where: { id: saved.id } })).goalsFor).toBe(2);
    const next = unwrap(await preview()) as Preview;
    expect(next.rows.find((row) => row.clubId === clubIds[0])?.goalDifference).toBe(2);
    const result = unwrap(await apply(next, true, 201)) as { updated: number };
    expect(result.updated).toBeGreaterThan(0);
    expect((await db.standing.findUniqueOrThrow({ where: { id: saved.id } })).goalsFor).toBe(3);
    expect(await db.standing.count({ where: { seasonId } })).toBe(3);
  });

  it('preserves canonical manual deductions and handles zero-result tables safely', async () => {
    const row = await db.standing.findFirstOrThrow({
      where: { seasonId, clubId: clubIds[1], stageId },
    });
    await db.standing.update({
      where: { id: row.id },
      data: { deductionPoints: 1, points: 0 },
    });
    const next = unwrap(await preview()) as Preview;
    const forB = next.rows.find((item) => item.clubId === clubIds[1]);
    expect(forB).toMatchObject({ points: 0, deductionPoints: 1 });
    await apply(next, true, 201);
    const persisted = await db.standing.findUniqueOrThrow({ where: { id: row.id } });
    expect(persisted.points).toBe(0);
    expect(persisted.deductionPoints).toBe(1);

    const empty = await request(app.getHttpServer())
      .post('/api/v1/standings/admin/season/' + emptySeasonId + '/calculate/preview')
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.superadmin)))
      .send({ stageId: null })
      .expect(201);
    const emptyData = unwrap(empty) as Preview;
    expect(emptyData.canApply).toBe(false);
    await request(app.getHttpServer())
      .post('/api/v1/standings/admin/season/' + emptySeasonId + '/calculate/apply')
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.superadmin)))
      .send({
        stageId: null,
        expectedPreviewHash: emptyData.previewHash,
        overwriteExisting: false,
      })
      .expect(409);
  });

  it('keeps public/current standings backwards compatible after calculation', async () => {
    const current = await request(app.getHttpServer())
      .get('/api/v1/standings/' + competitionSlug)
      .expect(200);
    const data = unwrap(current) as {
      season: { id: string };
      stage: { id: string } | null;
      standings: { position: number; club: { id: string } }[];
    };
    expect(data.season.id).toBe(seasonId);
    expect(data.stage?.id).toBe(stageId);
    expect(data.standings).toHaveLength(3);
    expect(data.standings.map((row) => row.position)).toEqual([1, 2, 3]);
  });
});
