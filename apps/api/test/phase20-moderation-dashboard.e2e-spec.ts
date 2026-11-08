import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import request from 'supertest';
import type { App } from 'supertest/types';

describe('Task 187 moderation overview authorization and privacy HTTP E2E', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwks: Server;
  let signingKey: KeyLike;
  let reportId: string;
  let cardId: string;
  let yellowId: string;
  let oldYellowId: string;
  let sanctionId: string;
  let blockId: string;
  const marker = randomUUID().slice(0, 8);
  const subjects = {
    root: 'p187-root-' + marker,
    admin: 'p187-admin-' + marker,
    mod: 'p187-mod-' + marker,
    editor: 'p187-editor-' + marker,
    user: 'p187-user-' + marker,
    target: 'p187-target-' + marker,
    banned: 'p187-banned-' + marker,
  };
  const ids = new Map<string, string>();
  const secretNote = 'INTERNAL_P187_EVIDENCE_MUST_NOT_LEAK';
  const hash = 'a'.repeat(64);
  const previousJwks = process.env.KEYCLOAK_JWKS_URL;

  async function signedToken(subject: string) {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'phase20-187-' + marker })
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
      throw new Error('P187_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }

    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: 'phase20-187-' + marker,
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
    const fixtures = [
      { subject: subjects.root, role: 'SUPERADMIN', status: 'ACTIVE' },
      { subject: subjects.admin, role: 'ADMIN', status: 'ACTIVE' },
      { subject: subjects.mod, role: 'MODERATOR', status: 'ACTIVE' },
      { subject: subjects.editor, role: 'EDITOR', status: 'ACTIVE' },
      { subject: subjects.user, role: 'USER', status: 'ACTIVE' },
      { subject: subjects.target, role: 'USER', status: 'LIMITED' },
      { subject: subjects.banned, role: 'SUPERADMIN', status: 'BANNED' },
    ] as const;
    for (const fixture of fixtures) {
      const user = await database.user.create({
        data: {
          keycloakSubject: fixture.subject,
          nickname: 'p187' + fixture.subject,
          status: fixture.status,
          onboardingCompleted: true,
          roleAssignments: { create: { role: fixture.role } },
        },
        select: { id: true },
      });
      ids.set(fixture.subject, user.id);
    }

    const report = await database.moderationReport.create({
      data: {
        reporterId: ids.get(subjects.user)!,
        reportedUserId: ids.get(subjects.target),
        targetType: 'USER',
        reason: 'HARASSMENT',
        status: 'OPEN',
        details: secretNote,
        moderatorNote: secretNote,
      },
      select: { id: true },
    });
    reportId = report.id;
    const red = await database.moderationCard.create({
      data: {
        userId: ids.get(subjects.banned)!,
        moderatorId: ids.get(subjects.root),
        type: 'RED',
        status: 'ACTIVE',
        reasonCode: 'P187_RED',
        moderatorNote: secretNote,
        escalationSource: 'MANUAL',
      },
      select: { id: true },
    });
    cardId = red.id;
    yellowId = (
      await database.moderationCard.create({
        data: {
          userId: ids.get(subjects.target)!,
          moderatorId: ids.get(subjects.mod),
          type: 'YELLOW',
          status: 'ACTIVE',
          reasonCode: 'P187_YELLOW',
          moderatorNote: secretNote,
          expiresAt: new Date(Date.now() + 3600000),
        },
        select: { id: true },
      })
    ).id;
    oldYellowId = (
      await database.moderationCard.create({
        data: {
          userId: ids.get(subjects.target)!,
          moderatorId: ids.get(subjects.mod),
          type: 'YELLOW',
          status: 'ACTIVE',
          reasonCode: 'P187_OLD',
          expiresAt: new Date(Date.now() - 10000),
        },
        select: { id: true },
      })
    ).id;
    sanctionId = (
      await database.sanction.create({
        data: {
          type: 'LIMITED',
          status: 'ACTIVE',
          userId: ids.get(subjects.target),
          createdById: ids.get(subjects.mod),
          reasonCode: 'P187_LIMIT',
          internalNote: secretNote,
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
        },
        select: { id: true },
      })
    ).id;
    blockId = (
      await database.iPBlock.create({
        data: {
          ipHash: hash,
          hashKeyVersion: 'v1',
          source: 'MANUAL',
          reasonCode: 'P187_NETWORK',
          internalNote: secretNote,
          createdById: ids.get(subjects.root),
          active: true,
          expiresAt: new Date(Date.now() + 600000),
        },
        select: { id: true },
      })
    ).id;

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
        if (blockId) await database.iPBlock.delete({ where: { id: blockId } });
        if (sanctionId) await database.sanction.delete({ where: { id: sanctionId } });
        for (const id of [cardId, yellowId, oldYellowId]) {
          if (id) await database.moderationCard.delete({ where: { id } });
        }
        if (reportId) await database.moderationReport.delete({ where: { id: reportId } });
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

  it('rejects unauthenticated, community/editor, LIMITED and BANNED clients', async () => {
    const http = app.getHttpServer();
    for (const path of ['/api/v1/moderation/dashboard', '/api/v1/moderation/dashboard/ip-blocks']) {
      await request(http).get(path).expect(401);
      for (const subject of [subjects.user, subjects.editor, subjects.target, subjects.banned]) {
        await request(http)
          .get(path)
          .set('Authorization', 'Bearer ' + (await signedToken(subject)))
          .expect(403);
      }
    }
  }, 30000);

  it('allows moderators and admins to see metadata, not IP or private evidence', async () => {
    for (const subject of [subjects.mod, subjects.admin]) {
      const http = app.getHttpServer();
      const authorization = 'Bearer ' + (await signedToken(subject));
      const result = await request(http)
        .get('/api/v1/moderation/dashboard')
        .set('Authorization', authorization)
        .expect(200);
      const data = (
        result.body as {
          data: {
            counts: Record<string, number>;
            recentReports: Array<{ id: string }>;
            recentCards: Array<{ id: string }>;
            appeals: { available: boolean };
          };
        }
      ).data;

      expect(data.counts.pendingReports).toBeGreaterThanOrEqual(1);
      expect(data.counts.activeRedCards).toBeGreaterThanOrEqual(1);
      expect(data.counts.activeYellowCards).toBeGreaterThanOrEqual(1);
      expect(data.counts.limitedUsers).toBeGreaterThanOrEqual(1);
      expect(data.counts.bannedUsers).toBeGreaterThanOrEqual(1);
      expect(data.counts.activeLimitedSanctions).toBeGreaterThanOrEqual(1);
      expect(data.appeals).toMatchObject({ available: false });
      expect(data.counts).not.toHaveProperty('activeIPBlocks');
      expect(data.counts).not.toHaveProperty('openAppeals');
      const serialized = JSON.stringify(result.body);
      expect(serialized).not.toContain(secretNote);
      expect(serialized).not.toContain(hash);
      expect(serialized).not.toContain('ipHash');

      await request(http)
        .get('/api/v1/moderation/dashboard/ip-blocks')
        .set('Authorization', authorization)
        .expect(403);
    }
  }, 30000);

  it('limits network summary to SUPERADMIN, without raw IP or hash leaks', async () => {
    const auth = 'Bearer ' + (await signedToken(subjects.root));
    const result = await request(app.getHttpServer())
      .get('/api/v1/moderation/dashboard/ip-blocks')
      .set('Authorization', auth)
      .expect(200);
    const payload = (
      result.body as {
        data: {
          counts: { activeBlocks: number; activeManual: number };
          recentBlocks: Array<{ id: string; source: string }>;
          note: string;
        };
      }
    ).data;

    expect(payload.counts.activeBlocks).toBeGreaterThanOrEqual(1);
    expect(payload.counts.activeManual).toBeGreaterThanOrEqual(1);
    expect(payload.note).toBe('NETWORK_ADDRESS_NOT_DISPLAYED');
    expect(payload.recentBlocks.some((block) => block.id === blockId)).toBe(true);
    const json = JSON.stringify(result.body);
    expect(json).not.toContain(secretNote);
    expect(json).not.toContain(hash);
    expect(json).not.toContain('ipHash');
    expect(json).not.toContain('hashKeyVersion');
  }, 30000);

  it('counts only unexpired active cards and does not change moderation records', async () => {
    const start = await database.moderationCard.count({
      where: { id: { in: [cardId, yellowId, oldYellowId] } },
    });
    const http = app.getHttpServer();
    const result = await request(http)
      .get('/api/v1/moderation/dashboard')
      .set('Authorization', 'Bearer ' + (await signedToken(subjects.root)))
      .expect(200);
    const data = (
      result.body as {
        data: { recentCards: Array<{ id: string }> };
      }
    ).data;
    expect(data.recentCards.some((card) => card.id === cardId)).toBe(true);
    expect(data.recentCards.some((card) => card.id === yellowId)).toBe(true);
    expect(
      await database.moderationCard.count({
        where: { id: { in: [cardId, yellowId, oldYellowId] } },
      }),
    ).toBe(start);
    expect(await database.moderationReport.findUnique({ where: { id: reportId } })).toMatchObject({
      status: 'OPEN',
      details: secretNote,
    });
  }, 30000);
});
