import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import request from 'supertest';
import type { App } from 'supertest/types';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  createdAt: string;
  readAt: string | null;
}
interface InboxResponse {
  items: NotificationRow[];
  pagination: { nextCursor: string | null; hasNextPage: boolean };
}
function dataOf<T>(response: { body: unknown }): T {
  return (response.body as { data: T }).data;
}

describe('Phase 23.226 – authenticated recipient-only inbox HTTP with disposable PostgreSQL', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwks: Server;
  let signingKey: KeyLike;
  const marker = randomUUID().slice(0, 8);
  const previousJwks = process.env.KEYCLOAK_JWKS_URL;
  const subjects = {
    first: 'p226-first-' + marker,
    second: 'p226-second-' + marker,
    limited: 'p226-limited-' + marker,
    banned: 'p226-banned-' + marker,
  };
  const owners = new Map<string, string>();
  const privateBody = 'P226_PRIVATE_ONLY_FIRST_USER_' + marker;
  const privateMetadata = 'P226_PRIVATE_INTERNAL_MODERATION_' + marker;
  let oldestId = '';

  async function tokenFor(subject: string) {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'p226-' + marker })
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
      throw new Error('PHASE23_226_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS_REQUIRED');
    }
    const keys = await generateKeyPair('RS256');
    signingKey = keys.privateKey;
    const publicJwk = {
      ...(await exportJWK(keys.publicKey)),
      kid: 'p226-' + marker,
      alg: 'RS256',
      use: 'sig',
    };
    jwks = createServer((_req, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ keys: [publicJwk] }));
    });
    await new Promise<void>((resolve) => jwks.listen(0, '127.0.0.1', resolve));
    process.env.KEYCLOAK_JWKS_URL =
      'http://127.0.0.1:' + (jwks.address() as AddressInfo).port + '/jwks';

    database = createPrismaClient();
    for (const entry of [
      { subject: subjects.first, status: 'ACTIVE' },
      { subject: subjects.second, status: 'ACTIVE' },
      { subject: subjects.limited, status: 'LIMITED' },
      { subject: subjects.banned, status: 'BANNED' },
    ] as const) {
      const user = await database.user.create({
        data: {
          keycloakSubject: entry.subject,
          status: entry.status,
          onboardingCompleted: true,
        },
        select: { id: true },
      });
      owners.set(entry.subject, user.id);
    }
    const userId = owners.get(subjects.first)!;
    const reference = new Date('2026-11-13T17:00:00.000Z');
    // 55 visible notifications force three seek pages; one is already read.
    for (let index = 0; index < 55; index += 1) {
      const result = await database.notification.create({
        data: {
          userId,
          type: index === 0 ? 'YELLOW_CARD' : 'COMMENT_REPLY',
          title: 'Hinweis ' + index,
          body: index === 0 ? privateBody : 'E2E Hinweis ' + index,
          createdAt: new Date(reference.getTime() - index * 60_000),
          readAt: index === 0 ? new Date(reference.getTime() + 30_000) : null,
          metadata: index === 0 ? { privateModeratorNote: privateMetadata } : undefined,
          url: '/forum',
        },
        select: { id: true },
      });
      if (index === 54) oldestId = result.id;
    }
    // An expired message must be excluded from both inbox and unread count.
    await database.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Expired',
        body: 'Already expired',
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    await database.notification.create({
      data: {
        userId: owners.get(subjects.second)!,
        type: 'SYSTEM',
        title: 'Second user private',
        body: 'P226_SECOND_USER_SECRET_' + marker,
      },
    });

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
        const ids = [...owners.values()];
        if (ids.length) {
          await database.notification.deleteMany({ where: { userId: { in: ids } } });
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

  it('denies anonymous/invalid tokens before any private data and disallows account bans', async () => {
    for (const endpoint of ['/api/v1/notifications', '/api/v1/notifications/unread-count']) {
      const anonymous = await request(app.getHttpServer()).get(endpoint).expect(401);
      expect(JSON.stringify(anonymous.body)).not.toContain(privateBody);
      await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', 'Bearer not-valid')
        .expect(401);
      await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', 'Bearer ' + (await tokenFor(subjects.banned)))
        .expect(403);
    }
  });

  it('paginates only the own notifications in stable date/UUID order and with private no-store headers', async () => {
    const token = await tokenFor(subjects.first);
    let cursor: string | null = null;
    const seen: string[] = [];
    for (const expectedSize of [20, 20, 15]) {
      const endpoint = cursor
        ? '/api/v1/notifications?limit=20&cursor=' + encodeURIComponent(cursor)
        : '/api/v1/notifications?limit=20';
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', 'Bearer ' + token)
        .expect(200);
      expect(response.headers['cache-control']).toBe('private, no-store');
      const result = dataOf<InboxResponse>(response);
      expect(result.items).toHaveLength(expectedSize);
      expect(result.items.every((row) => row.url === '/forum')).toBe(true);
      for (const item of result.items) {
        expect(Object.keys(item).sort()).toEqual([
          'body',
          'createdAt',
          'id',
          'readAt',
          'title',
          'type',
          'url',
        ]);
        expect(JSON.stringify(item)).not.toContain(privateMetadata);
        seen.push(item.id);
      }
      cursor = result.pagination.nextCursor;
      expect(result.pagination.hasNextPage).toBe(expectedSize !== 15);
    }
    expect(cursor).toBeNull();
    expect(seen).toHaveLength(55);
    expect(new Set(seen).size).toBe(55);
    expect(seen.at(-1)).toBe(oldestId);
    expect(seen.some((id) => id === owners.get(subjects.second))).toBe(false);
  });

  it('counts only own unexpired unread rows, without changing readAt', async () => {
    const firstToken = await tokenFor(subjects.first);
    const count = await request(app.getHttpServer())
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', 'Bearer ' + firstToken)
      .expect(200);
    expect(count.headers['cache-control']).toBe('private, no-store');
    expect(dataOf<{ count: number }>(count)).toEqual({ count: 54 });
    const unread = await request(app.getHttpServer())
      .get('/api/v1/notifications?filter=unread&limit=50')
      .set('Authorization', 'Bearer ' + firstToken)
      .expect(200);
    expect(dataOf<InboxResponse>(unread).items).toHaveLength(50);
    expect(dataOf<InboxResponse>(unread).items.every((item) => item.readAt === null)).toBe(true);
    const after = await database.notification.count({
      where: { userId: owners.get(subjects.first)!, readAt: null },
    });
    expect(after).toBe(55); // The expired message remains unread in DB but not in API.
  });

  it('never leaks another account when query parameters or cursors are reused', async () => {
    const firstToken = await tokenFor(subjects.first);
    const secondToken = await tokenFor(subjects.second);
    const first = await request(app.getHttpServer())
      .get('/api/v1/notifications?limit=1')
      .set('Authorization', 'Bearer ' + firstToken)
      .expect(200);
    const firstCursor = dataOf<InboxResponse>(first).pagination.nextCursor!;
    const injected = await request(app.getHttpServer())
      .get('/api/v1/notifications?limit=50&userId=' + owners.get(subjects.first))
      .set('Authorization', 'Bearer ' + secondToken)
      .expect(200);
    const own = dataOf<InboxResponse>(injected);
    expect(own.items).toHaveLength(1);
    expect(own.items[0].title).toBe('Second user private');
    const cursorReplay = await request(app.getHttpServer())
      .get('/api/v1/notifications?cursor=' + encodeURIComponent(firstCursor))
      .set('Authorization', 'Bearer ' + secondToken)
      .expect(200);
    expect(dataOf<InboxResponse>(cursorReplay).items).toHaveLength(0);
    expect(JSON.stringify(cursorReplay.body)).not.toContain(privateBody);
    const limited = await request(app.getHttpServer())
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', 'Bearer ' + (await tokenFor(subjects.limited)))
      .expect(200);
    expect(dataOf<{ count: number }>(limited)).toEqual({ count: 0 });
  });

  it('rejects malformed cursor, unknown filter and unbounded limit before database lookup', async () => {
    const token = await tokenFor(subjects.first);
    for (const input of [
      '?limit=0',
      '?limit=51',
      '?limit=1000',
      '?filter=archived',
      '?cursor=invalid',
      '?filter=unread&cursor=AA',
    ]) {
      await request(app.getHttpServer())
        .get('/api/v1/notifications' + input)
        .set('Authorization', 'Bearer ' + token)
        .expect(400);
    }
  });
});
