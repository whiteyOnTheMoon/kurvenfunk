import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import request from 'supertest';
import type { App } from 'supertest/types';

import { ScheduledPublishingService } from '../../worker/src/services/scheduled-publishing.service';

type ArticleResponse = {
  data: {
    id: string;
    title: string;
    slug: string;
    status: string;
    scheduledAt: string | null;
  };
};

describe('Phase 17 editorial HTTP workflow (disposable PostgreSQL and Redis)', () => {
  let app: INestApplication<App>;
  let db: DatabaseClient;
  let jwksServer: Server;
  let signingKey: KeyLike;
  let scheduler: ScheduledPublishingService;

  const suffix = randomUUID().slice(0, 8);
  const editorSubject = 'editorial-editor-' + suffix;
  const readerSubject = 'editorial-reader-' + suffix;
  const slug = 'editorial-e2e-' + suffix;
  const endpoint = '/api/v1/articles';

  const document = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Editorial E2E body' }] }],
  };

  async function token(subject: string): Promise<string> {
    return new SignJWT({ email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'editorial-' + suffix })
      .setSubject(subject)
      .setIssuer(process.env.KEYCLOAK_ISSUER!)
      .setAudience(process.env.KEYCLOAK_AUDIENCE!)
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(signingKey);
  }

  beforeAll(async () => {
    const databaseUrl = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      databaseUrl.hostname !== '127.0.0.1' ||
      databaseUrl.pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('Editorial E2E requires disposable local services');
    }

    const keys = await generateKeyPair('RS256');
    signingKey = keys.privateKey;
    const publicKey = {
      ...(await exportJWK(keys.publicKey)),
      kid: 'editorial-' + suffix,
      alg: 'RS256',
      use: 'sig',
    };

    jwksServer = createServer((_req, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ keys: [publicKey] }));
    });
    await new Promise<void>((resolve) => jwksServer.listen(0, '127.0.0.1', resolve));
    const address = jwksServer.address() as AddressInfo;
    process.env.KEYCLOAK_JWKS_URL = 'http://127.0.0.1:' + address.port + '/jwks';

    db = createPrismaClient();
    await Promise.all([
      db.user.create({
        data: {
          keycloakSubject: editorSubject,
          onboardingCompleted: true,
          fanPreference: 'NEUTRAL',
          roleAssignments: { create: { role: 'EDITOR' } },
        },
      }),
      db.user.create({
        data: {
          keycloakSubject: readerSubject,
          onboardingCompleted: true,
          fanPreference: 'NEUTRAL',
          roleAssignments: { create: { role: 'USER' } },
        },
      }),
    ]);

    scheduler = new ScheduledPublishingService({
      client: db,
    } as ConstructorParameters<typeof ScheduledPublishingService>[0]);

    const { AppModule } =
      (await import('../src/app.module')) as unknown as typeof import('../src/app.module');
    const { configureApplication } =
      (await import('../src/bootstrap')) as unknown as typeof import('../src/bootstrap');
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    configureApplication(app);
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
    await db?.$disconnect();
    if (jwksServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        jwksServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }, 30000);

  it('checks permissions and UUIDs, preserves revisions, and publishes only when due', async () => {
    const editorAuth = 'Bearer ' + (await token(editorSubject));
    const readerAuth = 'Bearer ' + (await token(readerSubject));
    const createInput = {
      title: 'Neuer redaktioneller Artikel',
      slug,
      lead: 'Entwurf',
      content: document,
      clubIds: [],
      categoryIds: [],
      tagIds: [],
    };

    await request(app.getHttpServer()).post(endpoint).send(createInput).expect(401);
    await request(app.getHttpServer())
      .post(endpoint)
      .set('Authorization', readerAuth)
      .send(createInput)
      .expect(403);
    await request(app.getHttpServer())
      .get(endpoint + '/editorial')
      .set('Authorization', readerAuth)
      .expect(403);

    await request(app.getHttpServer())
      .get(endpoint + '/editorial/not-a-uuid')
      .set('Authorization', editorAuth)
      .expect(400);
    await request(app.getHttpServer())
      .patch(endpoint + '/not-a-uuid')
      .set('Authorization', editorAuth)
      .send({ title: 'Nicht erlaubt' })
      .expect(400);
    await request(app.getHttpServer())
      .patch(endpoint + '/not-a-uuid/publication')
      .set('Authorization', editorAuth)
      .send({ status: 'REVIEW' })
      .expect(400);
    await request(app.getHttpServer())
      .post(endpoint + '/not-a-uuid/archive')
      .set('Authorization', editorAuth)
      .expect(400);
    await request(app.getHttpServer())
      .delete(endpoint + '/not-a-uuid')
      .set('Authorization', editorAuth)
      .expect(400);
    await request(app.getHttpServer())
      .post(endpoint + '/not-a-uuid/restore')
      .set('Authorization', editorAuth)
      .expect(400);

    const created = await request(app.getHttpServer())
      .post(endpoint)
      .set('Authorization', editorAuth)
      .send(createInput)
      .expect(201);
    const articleId = (created.body as ArticleResponse).data.id;
    expect((created.body as ArticleResponse).data.status).toBe('DRAFT');
    const storedDraft = await db.article.findUniqueOrThrow({ where: { id: articleId } });
    expect(storedDraft.publishedAt).toBeNull();

    await request(app.getHttpServer())
      .post(endpoint)
      .set('Authorization', editorAuth)
      .send(createInput)
      .expect(409);
    expect(await db.article.count({ where: { slug } })).toBe(1);

    await request(app.getHttpServer())
      .get(endpoint + '/editorial/' + articleId)
      .set('Authorization', editorAuth)
      .expect(200);

    const invalidEdit = await request(app.getHttpServer())
      .patch(endpoint + '/' + articleId)
      .set('Authorization', editorAuth)
      .send({ content: { type: 'invalid' } })
      .expect(400);
    expect(invalidEdit.status).toBe(400);
    expect(await db.articleRevision.count({ where: { articleId } })).toBe(0);

    await request(app.getHttpServer())
      .patch(endpoint + '/' + articleId)
      .set('Authorization', editorAuth)
      .send({ title: 'Überarbeiteter Artikel', seoTitle: 'Redaktion SEO' })
      .expect(200);

    const revisions = await db.articleRevision.findMany({ where: { articleId } });
    expect(revisions).toHaveLength(1);
    expect(revisions[0]?.title).toBe(createInput.title);
    expect(revisions[0]?.slug).toBe(slug);

    await request(app.getHttpServer())
      .patch(endpoint + '/' + articleId + '/publication')
      .set('Authorization', readerAuth)
      .send({ status: 'PUBLISHED' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(endpoint + '/' + articleId + '/publication')
      .set('Authorization', editorAuth)
      .send({ status: 'PUBLISHED' })
      .expect(409);

    await request(app.getHttpServer())
      .patch(endpoint + '/' + articleId + '/publication')
      .set('Authorization', editorAuth)
      .send({ status: 'REVIEW' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(endpoint + '/' + articleId + '/publication')
      .set('Authorization', editorAuth)
      .send({ status: 'SCHEDULED', scheduledAt: new Date(Date.now() - 60000).toISOString() })
      .expect(400);

    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await request(app.getHttpServer())
      .patch(endpoint + '/' + articleId + '/publication')
      .set('Authorization', editorAuth)
      .send({ status: 'SCHEDULED', scheduledAt })
      .expect(200);

    const pending = await db.article.findUniqueOrThrow({ where: { id: articleId } });
    expect(pending.status).toBe('SCHEDULED');
    expect(pending.publishedAt).toBeNull();
    expect(await scheduler.publishDueArticles()).toBe(0);
    expect((await db.article.findUniqueOrThrow({ where: { id: articleId } })).status).toBe(
      'SCHEDULED',
    );

    // Simulate the scheduled time elapsing only in the disposable database.
    await db.article.update({
      where: { id: articleId },
      data: { scheduledAt: new Date(Date.now() - 60_000) },
    });
    expect(await scheduler.publishDueArticles()).toBe(1);
    expect(await scheduler.publishDueArticles()).toBe(0);

    const published = await db.article.findUniqueOrThrow({ where: { id: articleId } });
    expect(published.status).toBe('PUBLISHED');
    expect(published.scheduledAt).toBeNull();
    expect(published.publishedAt).not.toBeNull();

    const publicArticle = await request(app.getHttpServer())
      .get(endpoint + '/by-slug/' + slug)
      .expect(200);
    expect((publicArticle.body as ArticleResponse).data.id).toBe(articleId);

    await request(app.getHttpServer())
      .post(endpoint + '/' + articleId + '/archive')
      .set('Authorization', editorAuth)
      .expect(201);
    expect((await db.article.findUniqueOrThrow({ where: { id: articleId } })).status).toBe(
      'ARCHIVED',
    );

    await request(app.getHttpServer())
      .delete(endpoint + '/' + articleId)
      .set('Authorization', editorAuth)
      .expect(200);
    const deleted = await db.article.findUniqueOrThrow({ where: { id: articleId } });
    expect(deleted.deletedAt).not.toBeNull();

    await request(app.getHttpServer())
      .post(endpoint + '/' + articleId + '/restore')
      .set('Authorization', editorAuth)
      .expect(201);

    const restored = await db.article.findUniqueOrThrow({ where: { id: articleId } });
    expect(restored.deletedAt).toBeNull();
    expect(restored.status).toBe('DRAFT');
    expect(restored.archivedAt).toBeNull();
    expect(await db.articleRevision.count({ where: { articleId } })).toBe(1);
  }, 30000);
});
