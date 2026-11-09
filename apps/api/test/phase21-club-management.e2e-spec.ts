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

describe('Task 194 Club Management isolated HTTP and PostgreSQL E2E', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwks: Server;
  let signingKey: KeyLike;
  let clubId: string | undefined;
  let logoId: string | undefined;
  let blockedMediaId: string | undefined;
  const ids = new Map<string, string>();
  const marker = randomUUID().slice(0, 8);
  const slug = 'p194-test-' + marker;
  const subjects = {
    admin: 'p194-admin-' + marker,
    superadmin: 'p194-superadmin-' + marker,
    editor: 'p194-editor-' + marker,
    moderator: 'p194-moderator-' + marker,
    limited: 'p194-limited-' + marker,
    banned: 'p194-banned-' + marker,
  };
  const previousJwks = process.env.KEYCLOAK_JWKS_URL;

  async function tokenFor(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p194-' + marker })
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
      throw new Error('TASK194_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }

    const pair = await generateKeyPair('RS256');
    signingKey = pair.privateKey;
    const publicKey = {
      ...(await exportJWK(pair.publicKey)),
      kid: 'p194-' + marker,
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
      { subject: subjects.moderator, role: 'MODERATOR', status: 'ACTIVE' },
      { subject: subjects.limited, role: 'ADMIN', status: 'LIMITED' },
      { subject: subjects.banned, role: 'ADMIN', status: 'BANNED' },
    ] as const) {
      const user = await database.user.create({
        data: {
          keycloakSubject: fixture.subject,
          nickname: 'p194-' + marker + '-' + fixture.role + '-' + fixture.status,
          status: fixture.status,
          onboardingCompleted: true,
          roleAssignments: { create: { role: fixture.role } },
        },
        select: { id: true },
      });
      ids.set(fixture.subject, user.id);
    }

    const logo = await database.media.create({
      data: {
        storageType: 'EXTERNAL',
        externalUrl: 'https://example.org/p194-test-logo.png',
        mimeType: 'image/png',
        sizeBytes: BigInt(12),
        copyright: 'Synthetic owned E2E fixture',
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    logoId = logo.id;
    const blocked = await database.media.create({
      data: {
        storageType: 'EXTERNAL',
        externalUrl: 'https://example.org/p194-test-pdf.pdf',
        mimeType: 'application/pdf',
        sizeBytes: BigInt(12),
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    blockedMediaId = blocked.id;

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
        if (clubId) {
          await database.auditLog.deleteMany({
            where: { targetType: 'SYSTEM', targetId: clubId },
          });
          await database.club.delete({ where: { id: clubId } });
        }
        if (logoId) await database.media.delete({ where: { id: logoId } });
        if (blockedMediaId) await database.media.delete({ where: { id: blockedMediaId } });
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

  const validCreate = {
    name: 'Testverein Phase 194',
    slug,
    shortName: 'P194',
    color1Hex: '#12ab34',
    color2Hex: '#ffffff',
    accentColorHex: '#0000ff',
    website: 'https://example.org',
  };

  it('protects admin reads and writes with active ADMIN/SUPERADMIN permissions', async () => {
    await request(app.getHttpServer()).get('/api/v1/clubs/admin/all').expect(401);
    await request(app.getHttpServer()).post('/api/v1/clubs').send(validCreate).expect(401);
    for (const subject of [
      subjects.editor,
      subjects.moderator,
      subjects.limited,
      subjects.banned,
    ]) {
      const token = await tokenFor(subject);
      await request(app.getHttpServer())
        .get('/api/v1/clubs/admin/all')
        .set('Authorization', 'Bearer ' + token)
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/v1/clubs')
        .set('Authorization', 'Bearer ' + token)
        .send(validCreate)
        .expect(403);
    }
  });

  it('rejects invalid colors, websites, immutable fields and unsuitable logos', async () => {
    const token = await tokenFor(subjects.admin);
    for (const invalid of [
      { ...validCreate, color1Hex: '#123' },
      { ...validCreate, color1Rgba: 'rgba(1, 2, 3, 1)' },
      { ...validCreate, color1Hex: 'red' },
      { ...validCreate, color2Hex: 'blue' },
      { ...validCreate, website: 'javascript:alert(1)' },
      { ...validCreate, slug: 'Invalid SLUG' },
      { ...validCreate, logoMediaId: randomUUID() },
      { ...validCreate, logoMediaId: blockedMediaId },
    ]) {
      const status = invalid.logoMediaId && /^[0-9a-f-]{36}$/.test(invalid.logoMediaId) ? 400 : 400;
      await request(app.getHttpServer())
        .post('/api/v1/clubs')
        .set('Authorization', 'Bearer ' + token)
        .send(invalid)
        .expect(status);
    }
    await request(app.getHttpServer())
      .patch('/api/v1/clubs/' + randomUUID())
      .set('Authorization', 'Bearer ' + token)
      .send({ slug: 'immutable' })
      .expect(400);
  });

  it('creates a club with consistent HEX/RGBA branding, media and audit', async () => {
    const token = await tokenFor(subjects.admin);
    const response = await request(app.getHttpServer())
      .post('/api/v1/clubs')
      .set('Authorization', 'Bearer ' + token)
      .send({ ...validCreate, logoMediaId: logoId })
      .expect(201);
    const club = responseData(response) as {
      id: string;
      color1Hex: string;
      color1Rgba: string;
      color2Hex: string;
      color2Rgba: string;
      accentColorHex: string;
      logoMediaId: string;
    };
    clubId = club.id;
    expect(club.color1Hex).toBe('#12AB34');
    expect(club.color1Rgba).toBe('rgba(18, 171, 52, 1)');
    expect(club.color2Hex).toBe('#FFFFFF');
    expect(club.color2Rgba).toBe('rgba(255, 255, 255, 1)');
    expect(club.accentColorHex).toBe('#0000FF');
    expect(club.logoMediaId).toBe(logoId);

    const publicList = await request(app.getHttpServer()).get('/api/v1/clubs').expect(200);
    expect((responseData(publicList) as { id: string }[]).some((item) => item.id === club.id)).toBe(true);
    const publicDetail = await request(app.getHttpServer())
      .get('/api/v1/clubs/' + slug)
      .expect(200);
    expect((responseData(publicDetail) as { id: string }).id).toBe(club.id);

    await request(app.getHttpServer())
      .post('/api/v1/clubs')
      .set('Authorization', 'Bearer ' + token)
      .send(validCreate)
      .expect(409);
  });

  it('updates branding, rejects invalid media, deactivates without deleting history', async () => {
    const token = await tokenFor(subjects.superadmin);
    const invalidLogo = await request(app.getHttpServer())
      .patch('/api/v1/clubs/' + clubId)
      .set('Authorization', 'Bearer ' + token)
      .send({ logoMediaId: blockedMediaId })
      .expect(400);
    expect(invalidLogo.status).toBe(400);
    await request(app.getHttpServer())
      .patch('/api/v1/clubs/' + clubId)
      .set('Authorization', 'Bearer ' + token)
      .send({ color2Rgba: 'rgba(0, 0, 0, 1)' })
      .expect(400);

    const response = await request(app.getHttpServer())
      .patch('/api/v1/clubs/' + clubId)
      .set('Authorization', 'Bearer ' + token)
      .send({
        name: 'Testverein Korrigiert',
        color1Hex: '#abcdef',
        color2Hex: null,
        color3Hex: '#001122',
        accentColorHex: null,
        website: null,
        logoMediaId: null,
        active: false,
      })
      .expect(200);
    const updated = responseData(response) as {
      id: string;
      slug: string;
      color1Hex: string;
      color1Rgba: string;
      color2Rgba: string | null;
      color3Rgba: string;
      accentColorRgba: string | null;
      logoMediaId: string | null;
    };
    expect(updated.id).toBe(clubId);
    expect(updated.slug).toBe(slug);
    expect(updated.color1Hex).toBe('#ABCDEF');
    expect(updated.color1Rgba).toBe('rgba(171, 205, 239, 1)');
    expect(updated.color2Rgba).toBeNull();
    expect(updated.color3Rgba).toBe('rgba(0, 17, 34, 1)');
    expect(updated.accentColorRgba).toBeNull();
    expect(updated.logoMediaId).toBeNull();

    const list = await request(app.getHttpServer()).get('/api/v1/clubs').expect(200);
    expect((responseData(list) as { id: string }[]).some((item) => item.id === clubId)).toBe(false);
    await request(app.getHttpServer()).get('/api/v1/clubs/' + slug).expect(404);

    const admin = await request(app.getHttpServer())
      .get('/api/v1/clubs/admin/all')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    expect((responseData(admin) as { id: string }[]).some((item) => item.id === clubId)).toBe(true);
    expect(await database.club.count({ where: { id: clubId } })).toBe(1);

    const audit = await database.auditLog.findMany({
      where: { targetType: 'SYSTEM', targetId: clubId },
      select: { metadata: true, actorUserId: true },
    });
    expect(audit).toHaveLength(2);
    expect(audit.every((item) => item.actorUserId !== null)).toBe(true);

    await request(app.getHttpServer()).delete('/api/v1/clubs/' + clubId).expect(404);
  });
});
