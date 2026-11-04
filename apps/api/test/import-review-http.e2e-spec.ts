import { createServer, type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import request from 'supertest';
import type { App } from 'supertest/types';

type ReviewResult = {
  data: {
    id: string;
    status: string;
    reviewDecision: string | null;
    reviewedById: string | null;
    reviewedAt: string | null;
    canonicalEntityId: string | null;
  };
};

describe('Import review HTTP, real guards and isolated PostgreSQL', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let jwksServer: Server;
  let signingKey: KeyLike;

  const suffix = randomUUID();
  const editorSubject = `e2e-review-editor-${suffix}`;
  const otherEditorSubject = `e2e-review-editor-other-${suffix}`;
  const readerSubject = `e2e-review-reader-${suffix}`;
  let editorId: string;
  let providerId: string;
  let jobId: string;

  async function signToken(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'e2e-review' })
      .setSubject(subject)
      .setIssuer(process.env.KEYCLOAK_ISSUER!)
      .setAudience(process.env.KEYCLOAK_AUDIENCE!)
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(signingKey);
  }

  async function createReview(title: string | null) {
    return database.importRecord.create({
      data: {
        providerId,
        importJobId: jobId,
        recordType: 'NEWS_ARTICLE',
        status: 'REVIEW_REQUIRED',
        externalUrl: 'https://news.example.test/story',
        errorCode: 'NEWS_REVIEW_REQUIRED',
        errorMessage: 'Manual review required',
        normalizedPayload: {
          title,
          lead: 'Headline lead',
          body: 'News body for the review',
          authorName: 'News provider',
        },
      },
      select: { id: true },
    });
  }

  beforeAll(async () => {
    const databaseUrl = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      databaseUrl.hostname !== '127.0.0.1' ||
      databaseUrl.pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('Only disposable PostgreSQL and Redis are permitted');
    }

    const keyPair = await generateKeyPair('RS256');
    signingKey = keyPair.privateKey;
    const publicKey = {
      ...(await exportJWK(keyPair.publicKey)),
      kid: 'e2e-review',
      alg: 'RS256',
      use: 'sig',
    };

    jwksServer = createServer((_req, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ keys: [publicKey] }));
    });
    await new Promise<void>((resolve) => jwksServer.listen(0, '127.0.0.1', resolve));
    const address = jwksServer.address() as AddressInfo;
    process.env.KEYCLOAK_JWKS_URL = `http://127.0.0.1:${address.port}/jwks`;

    const { AppModule } =
      (await import('../src/app.module')) as unknown as typeof import('../src/app.module');
    const { configureApplication } =
      (await import('../src/bootstrap')) as unknown as typeof import('../src/bootstrap');

    database = createPrismaClient();
    const editor = await database.user.create({
      data: {
        keycloakSubject: editorSubject,
        roleAssignments: { create: { role: 'EDITOR' } },
      },
      select: { id: true },
    });
    editorId = editor.id;
    await database.user.create({
      data: {
        keycloakSubject: otherEditorSubject,
        roleAssignments: { create: { role: 'EDITOR' } },
      },
    });

    providerId = (
      await database.provider.create({
        data: {
          key: `review-http-${suffix}`,
          name: 'Isolated HTTP review provider',
          type: 'NEWS',
        },
        select: { id: true },
      })
    ).id;
    jobId = (
      await database.importJob.create({
        data: { providerId, kind: 'NEWS_FETCH', trigger: 'MANUAL' },
        select: { id: true },
      })
    ).id;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
    await database?.$disconnect();
    if (jwksServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        jwksServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }, 30000);

  it('enforces JWT authentication, editorial role and UUID validation', async () => {
    const record = await createReview('Protected review');

    await request(app.getHttpServer())
      .post(`/api/v1/imports/review/${record.id}/approve`)
      .expect(401);

    await request(app.getHttpServer())
      .post(`/api/v1/imports/review/${record.id}/approve`)
      .set('Authorization', `Bearer ${await signToken(readerSubject)}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/imports/review/invalid-id/approve')
      .set('Authorization', `Bearer ${await signToken(editorSubject)}`)
      .expect(400);

    const unchanged = await database.importRecord.findUniqueOrThrow({
      where: { id: record.id },
    });
    expect(unchanged.status).toBe('REVIEW_REQUIRED');
    expect(unchanged.reviewDecision).toBeNull();
    expect(await database.article.count({ where: { importRecordId: record.id } })).toBe(0);
  }, 30000);

  it('creates one unpublished draft and reuses it for a second editor over HTTP', async () => {
    const record = await createReview('Sturm gegen Rapid');
    const original = await request(app.getHttpServer())
      .post(`/api/v1/imports/review/${record.id}/approve`)
      .set('Authorization', `Bearer ${await signToken(editorSubject)}`)
      .expect(201);

    const first = (original.body as ReviewResult).data;
    expect(first.reviewDecision).toBe('APPROVED');
    expect(first.status).toBe('CREATED');
    expect(first.reviewedById).toBe(editorId);
    expect(first.canonicalEntityId).toBeTruthy();

    const again = await request(app.getHttpServer())
      .post(`/api/v1/imports/review/${record.id}/approve`)
      .set('Authorization', `Bearer ${await signToken(otherEditorSubject)}`)
      .expect(201);
    expect((again.body as ReviewResult).data).toEqual(first);

    const persisted = await database.importRecord.findUniqueOrThrow({ where: { id: record.id } });
    expect(persisted.canonicalEntityType).toBe('ARTICLE');
    expect(persisted.errorCode).toBeNull();
    expect(persisted.errorMessage).toBeNull();

    const article = await database.article.findUniqueOrThrow({
      where: { importRecordId: record.id },
    });
    expect(article.id).toBe(first.canonicalEntityId);
    expect(article.status).toBe('DRAFT');
    expect(article.publishedAt).toBeNull();
    expect(article.authorId).toBe(editorId);
    expect(article.originalUrl).toBe('https://news.example.test/story');

    await request(app.getHttpServer())
      .post(`/api/v1/imports/review/${record.id}/reject`)
      .set('Authorization', `Bearer ${await signToken(editorSubject)}`)
      .expect(400);

    expect(await database.article.count({ where: { importRecordId: record.id } })).toBe(1);
    expect(
      await database.auditLog.count({
        where: { targetType: 'ARTICLE', targetId: article.id, action: 'ADMIN_CORRECTION' },
      }),
    ).toBe(1);
  }, 30000);

  it('handles concurrent approvals without duplicate drafts, counters or audit entries', async () => {
    const record = await createReview('Conference League: aktuelle Ergebnisse');
    const authorization = `Bearer ${await signToken(editorSubject)}`;
    const attempts = await Promise.allSettled(
      Array.from({ length: 4 }, () =>
        request(app.getHttpServer())
          .post(`/api/v1/imports/review/${record.id}/approve`)
          .set('Authorization', authorization),
      ),
    );

    const results = attempts
      .filter((attempt) => attempt.status === 'fulfilled')
      .map((attempt) => attempt.value);
    expect(results.length).toBe(4);
    expect(results.every((result) => result.status === 201)).toBe(true);

    const ids = results.map((result) => (result.body as ReviewResult).data.canonicalEntityId);
    expect(new Set(ids).size).toBe(1);
    expect(ids[0]).toBeTruthy();

    const article = await database.article.findUniqueOrThrow({
      where: { importRecordId: record.id },
    });
    expect(article.id).toBe(ids[0]);
    expect(article.status).toBe('DRAFT');
    expect(await database.article.count({ where: { importRecordId: record.id } })).toBe(1);
    expect(
      await database.auditLog.count({
        where: { targetType: 'ARTICLE', targetId: article.id, action: 'ADMIN_CORRECTION' },
      }),
    ).toBe(1);
    const job = await database.importJob.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.createdCount).toBe(2);
  }, 30000);

  it('rejects invalid article content atomically and keeps the review open', async () => {
    const record = await createReview(null);
    await request(app.getHttpServer())
      .post(`/api/v1/imports/review/${record.id}/approve`)
      .set('Authorization', `Bearer ${await signToken(editorSubject)}`)
      .expect(400);

    const unchanged = await database.importRecord.findUniqueOrThrow({ where: { id: record.id } });
    expect(unchanged.status).toBe('REVIEW_REQUIRED');
    expect(unchanged.reviewDecision).toBeNull();
    expect(unchanged.errorCode).toBe('NEWS_REVIEW_REQUIRED');
    expect(await database.article.count({ where: { importRecordId: record.id } })).toBe(0);
  }, 30000);

  it('records a rejection, clears stale review errors and never creates a draft', async () => {
    const record = await createReview('Discard this news');
    const authorization = `Bearer ${await signToken(editorSubject)}`;
    await request(app.getHttpServer())
      .post(`/api/v1/imports/review/${record.id}/reject`)
      .set('Authorization', authorization)
      .expect(201);

    const rejected = await database.importRecord.findUniqueOrThrow({ where: { id: record.id } });
    expect(rejected.status).toBe('SKIPPED');
    expect(rejected.reviewDecision).toBe('REJECTED');
    expect(rejected.errorCode).toBeNull();
    expect(rejected.errorMessage).toBeNull();

    await request(app.getHttpServer())
      .post(`/api/v1/imports/review/${record.id}/approve`)
      .set('Authorization', authorization)
      .expect(400);
    expect(await database.article.count({ where: { importRecordId: record.id } })).toBe(0);
  }, 30000);
});
