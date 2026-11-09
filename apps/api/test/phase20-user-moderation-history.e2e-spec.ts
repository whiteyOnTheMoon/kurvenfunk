import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import request from 'supertest';
import type { App } from 'supertest/types';

describe('Task 188 private moderation history – isolated HTTP RBAC and privacy', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwks: Server;
  let signingKey: KeyLike;
  const suffix = randomUUID().slice(0, 8);
  const subjects = {
    moderator: 'p188-mod-' + suffix,
    admin: 'p188-admin-' + suffix,
    root: 'p188-root-' + suffix,
    editor: 'p188-editor-' + suffix,
    user: 'p188-user-' + suffix,
    restricted: 'p188-limited-' + suffix,
    banned: 'p188-banned-' + suffix,
    target: 'p188-target-' + suffix,
    other: 'p188-other-' + suffix,
  };
  const ids = new Map<string, string>();
  const note = 'SYNTHETIC_PRIVATE_P188_NOTE';
  const otherNote = 'SYNTHETIC_OTHER_USER_PRIVATE_P188_NOTE';
  const hiddenAuditIp = '192.0.2.188';
  let reportId: string;
  let otherReportId: string;
  let cardId: string;
  let otherCardId: string;
  let banId: string;
  let limitedId: string;
  let ipSanctionId: string;
  let auditId: string;
  const oldJwksUrl = process.env.KEYCLOAK_JWKS_URL;

  async function token(subject: string) {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p188-' + suffix })
      .setSubject(subject)
      .setIssuer(process.env.KEYCLOAK_ISSUER!)
      .setAudience(process.env.KEYCLOAK_AUDIENCE!)
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(signingKey);
  }

  const endpoint = (userId: string) =>
    '/api/v1/moderation/users/' + encodeURIComponent(userId) + '/history';

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      url.hostname !== '127.0.0.1' ||
      url.pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('P188_REQUIRES_DISPOSABLE_POSTGRES_REDIS');
    }

    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    jwks = createServer((_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          keys: [
            {
              ...(publicKey as object),
              kid: 'p188-' + suffix,
              use: 'sig',
              alg: 'RS256',
            },
          ],
        }),
      );
    });
    const publicKey = await exportJWK(pair.publicKey);
    await new Promise<void>((resolve) => jwks.listen(0, '127.0.0.1', resolve));
    process.env.KEYCLOAK_JWKS_URL =
      'http://127.0.0.1:' + (jwks.address() as AddressInfo).port + '/jwks';

    database = createPrismaClient();
    for (const [subject, role, status] of [
      [subjects.moderator, 'MODERATOR', 'ACTIVE'],
      [subjects.admin, 'ADMIN', 'ACTIVE'],
      [subjects.root, 'SUPERADMIN', 'ACTIVE'],
      [subjects.editor, 'EDITOR', 'ACTIVE'],
      [subjects.user, 'USER', 'ACTIVE'],
      [subjects.restricted, 'MODERATOR', 'LIMITED'],
      [subjects.banned, 'SUPERADMIN', 'BANNED'],
      [subjects.target, 'USER', 'ACTIVE'],
      [subjects.other, 'USER', 'ACTIVE'],
    ] as const) {
      const item = await database.user.create({
        data: {
          keycloakSubject: subject,
          nickname: 'fixture-' + subject,
          status,
          onboardingCompleted: true,
          roleAssignments: { create: { role } },
        },
        select: { id: true },
      });
      ids.set(subject, item.id);
    }
    const targetId = ids.get(subjects.target)!;
    const otherId = ids.get(subjects.other)!;
    reportId = (
      await database.moderationReport.create({
        data: {
          reporterId: ids.get(subjects.user)!,
          reportedUserId: targetId,
          targetType: 'USER',
          reason: 'HARASSMENT',
          status: 'IN_REVIEW',
          details: note,
          moderatorNote: note,
          assignedModeratorId: ids.get(subjects.moderator),
        },
        select: { id: true },
      })
    ).id;
    otherReportId = (
      await database.moderationReport.create({
        data: {
          reporterId: ids.get(subjects.user)!,
          reportedUserId: otherId,
          targetType: 'USER',
          reason: 'SPAM',
          details: otherNote,
          status: 'OPEN',
        },
        select: { id: true },
      })
    ).id;
    cardId = (
      await database.moderationCard.create({
        data: {
          userId: targetId,
          moderatorId: ids.get(subjects.admin),
          type: 'RED',
          status: 'REVOKED',
          revokedAt: new Date(),
          reasonCode: 'P188_PRIOR_BAN',
          moderatorNote: note,
          revocationReason: 'P188_RECONSIDERED',
        },
        select: { id: true },
      })
    ).id;
    otherCardId = (
      await database.moderationCard.create({
        data: {
          userId: otherId,
          moderatorId: ids.get(subjects.admin),
          type: 'YELLOW',
          reasonCode: 'P188_UNRELATED',
          moderatorNote: otherNote,
        },
        select: { id: true },
      })
    ).id;
    banId = (
      await database.sanction.create({
        data: {
          userId: targetId,
          createdById: ids.get(subjects.admin),
          type: 'ACCOUNT_BAN',
          status: 'REVOKED',
          reasonCode: 'P188_PRIOR_BAN',
          internalNote: note,
          startsAt: new Date(Date.now() - 86400000),
          revokedAt: new Date(),
        },
        select: { id: true },
      })
    ).id;
    limitedId = (
      await database.sanction.create({
        data: {
          userId: targetId,
          createdById: ids.get(subjects.moderator),
          type: 'LIMITED',
          status: 'EXPIRED',
          reasonCode: 'P188_LIMIT',
          internalNote: note,
          startsAt: new Date(Date.now() - 172800000),
          expiresAt: new Date(Date.now() - 86400000),
        },
        select: { id: true },
      })
    ).id;
    ipSanctionId = (
      await database.sanction.create({
        data: {
          userId: targetId,
          createdById: ids.get(subjects.root),
          type: 'IP_BLOCK',
          status: 'REVOKED',
          reasonCode: 'P188_NETWORK_SECRET',
          internalNote: hiddenAuditIp,
        },
        select: { id: true },
      })
    ).id;
    auditId = (
      await database.auditLog.create({
        data: {
          actorType: 'USER',
          actorUserId: ids.get(subjects.admin),
          action: 'USER_STATUS_CHANGED',
          category: 'ACCOUNT',
          targetType: 'USER',
          targetId,
          targetUserId: targetId,
          reason: hiddenAuditIp,
          metadata: { rawAddress: hiddenAuditIp, privateNote: otherNote },
        },
        select: { id: true },
      })
    ).id;

    const { AppModule } =
      (await import('../src/app.module')) as unknown as typeof import('../src/app.module');
    const { configureApplication } =
      (await import('../src/bootstrap')) as unknown as typeof import('../src/bootstrap');
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    configureApplication(app);
    await app.init();
  }, 30000);

  afterAll(async () => {
    try {
      await app?.close();
      if (database) {
        if (auditId) await database.auditLog.delete({ where: { id: auditId } });
        for (const id of [banId, limitedId, ipSanctionId]) {
          if (id) await database.sanction.delete({ where: { id } });
        }
        for (const id of [cardId, otherCardId]) {
          if (id) await database.moderationCard.delete({ where: { id } });
        }
        for (const id of [reportId, otherReportId]) {
          if (id) await database.moderationReport.delete({ where: { id } });
        }
        if (ids.size) {
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
      if (oldJwksUrl === undefined) delete process.env.KEYCLOAK_JWKS_URL;
      else process.env.KEYCLOAK_JWKS_URL = oldJwksUrl;
    }
  });

  it('denies anonymous, community, editor, restricted and banned sessions', async () => {
    const path = endpoint(ids.get(subjects.target)!);
    await request(app.getHttpServer()).get(path).expect(401);
    for (const subject of [
      subjects.user,
      subjects.editor,
      subjects.restricted,
      subjects.banned,
    ]) {
      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', 'Bearer ' + (await token(subject)))
        .expect(403);
    }
  }, 30000);

  it('permits only eligible staff and returns redacted, target-bound records with notes', async () => {
    const targetId = ids.get(subjects.target)!;
    for (const subject of [subjects.moderator, subjects.admin, subjects.root]) {
      const response = await request(app.getHttpServer())
        .get(endpoint(targetId))
        .set('Authorization', 'Bearer ' + (await token(subject)))
        .expect(200);
      expect(response.headers['cache-control']).toContain('no-store');
      const body = response.body as {
        data: {
          user: { id: string; status: string };
          reports: { items: Array<{ id: string; moderatorNote: string }>; hasMore: boolean };
          cards: { items: Array<{ id: string; status: string }>; hasMore: boolean };
          sanctions: { items: Array<{ id: string; type: string }>; hasMore: boolean };
          statusEvents: { items: Array<{ action: string }>; hasMore: boolean };
        };
      };
      expect(body.data.user).toMatchObject({ id: targetId, status: 'ACTIVE' });
      expect(body.data.reports.items.some((x) => x.id === reportId && x.moderatorNote === note))
        .toBe(true);
      expect(body.data.cards.items.some((x) => x.id === cardId && x.status === 'REVOKED'))
        .toBe(true);
      expect(body.data.sanctions.items.some((x) => x.id === banId && x.type === 'ACCOUNT_BAN'))
        .toBe(true);
      expect(body.data.sanctions.items.some((x) => x.id === limitedId)).toBe(true);
      expect(body.data.sanctions.items.some((x) => x.id === ipSanctionId)).toBe(false);
      expect(body.data.statusEvents.items.some((x) => x.action === 'USER_STATUS_CHANGED'))
        .toBe(true);
      const json = JSON.stringify(response.body);
      expect(json).toContain(note);
      expect(json).not.toContain(otherNote);
      expect(json).not.toContain(hiddenAuditIp);
      expect(json).not.toContain('ipHash');
      expect(json).not.toContain('hashKeyVersion');
      expect(json).not.toContain('metadata');
      expect(json).not.toContain('keycloakSubject');
      for (const segment of [
        body.data.reports,
        body.data.cards,
        body.data.sanctions,
        body.data.statusEvents,
      ]) {
        expect(segment.items.length).toBeLessThanOrEqual(50);
      }
    }
  }, 30000);

  it('rejects unknown and invalid UUIDs without disclosure, and never changes stored history', async () => {
    const auth = 'Bearer ' + (await token(subjects.moderator));
    await request(app.getHttpServer()).get(endpoint('not-a-uuid')).set('Authorization', auth)
      .expect(400);
    await request(app.getHttpServer()).get(endpoint(randomUUID())).set('Authorization', auth)
      .expect(404);
    const result = await request(app.getHttpServer())
      .get(endpoint(ids.get(subjects.other)!))
      .set('Authorization', auth)
      .expect(200);
    expect(JSON.stringify(result.body)).not.toContain(note);
    expect(JSON.stringify(result.body)).toContain(otherNote);
    expect((await database.sanction.findUniqueOrThrow({ where: { id: banId } })).status)
      .toBe('REVOKED');
    expect((await database.moderationCard.findUniqueOrThrow({ where: { id: cardId } })).status)
      .toBe('REVOKED');
  }, 30000);
});
