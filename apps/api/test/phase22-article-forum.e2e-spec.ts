import { randomUUID } from 'node:crypto';

import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

function dataOf<T>(response: { body: unknown }): T {
  return (response.body as { data: T }).data;
}

describe('Phase 22.223 – shared article/forum discussion uses one canonical Comment store', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;

  const suffix = randomUUID().slice(0, 8);
  const prefix = 'p223-' + suffix;
  const slugs = {
    published: prefix + '-published',
    draft: prefix + '-draft',
    scheduled: prefix + '-scheduled',
    archived: prefix + '-archived',
    deleted: prefix + '-deleted',
  };
  let publishedId = '';
  const articleIds: string[] = [];

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      url.hostname !== '127.0.0.1' ||
      url.pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('PHASE22_223_REQUIRES_DISPOSABLE_LOCAL_POSTGRES_AND_REDIS');
    }
    database = createPrismaClient();
    const past = new Date(Date.now() - 60_000);
    const future = new Date(Date.now() + 86_400_000);
    for (const [kind, slug] of Object.entries(slugs)) {
      const article = await database.article.create({
        data: {
          slug,
          title: 'E2E Artikel ' + kind,
          content: { type: 'doc', content: [] },
          status:
            kind === 'draft'
              ? 'DRAFT'
              : kind === 'scheduled'
                ? 'SCHEDULED'
                : kind === 'archived'
                  ? 'ARCHIVED'
                  : 'PUBLISHED',
          publishedAt: kind === 'scheduled' ? future : past,
          deletedAt: kind === 'deleted' ? new Date() : null,
        },
        select: { id: true },
      });
      articleIds.push(article.id);
      if (kind === 'published') publishedId = article.id;
    }
    await database.comment.create({
      data: {
        articleId: publishedId,
        body: 'Dieser Kommentar gehört zum Artikel und zur Forenansicht.',
        status: 'VISIBLE',
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
    if (app) await app.close();
    if (database) {
      await database.comment.deleteMany({ where: { articleId: { in: articleIds } } });
      await database.article.deleteMany({ where: { id: { in: articleIds } } });
      await database.$disconnect();
    }
  });

  it('publishes only genuine visible articles through the forum discovery source', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/articles?limit=100')
      .expect(200);
    const payload = dataOf<{ items: Array<{ id: string; slug: string }> }>(response);
    const ownArticles = payload.items.filter((article) => article.slug.startsWith(prefix));
    expect(ownArticles).toHaveLength(1);
    expect(ownArticles[0]).toMatchObject({ id: publishedId, slug: slugs.published });
  });

  it('returns exactly the original article ID and visible comment count', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/articles/by-slug/' + slugs.published)
      .expect(200);
    const article = dataOf<{ id: string; slug: string; _count: { comments: number } }>(response);
    expect(article).toMatchObject({
      id: publishedId,
      slug: slugs.published,
      _count: { comments: 1 },
    });
    const replies = await request(app.getHttpServer())
      .get('/api/v1/articles/' + article.id + '/comments')
      .expect(200);
    const page = dataOf<{ items: Array<{ articleId: string; body: string }> }>(replies);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.body).toBe('Dieser Kommentar gehört zum Artikel und zur Forenansicht.');
  });

  it('never exposes drafts, scheduled, archived or deleted articles in the discussion route source', async () => {
    for (const slug of [slugs.draft, slugs.scheduled, slugs.archived, slugs.deleted]) {
      await request(app.getHttpServer())
        .get('/api/v1/articles/by-slug/' + slug)
        .expect(404);
    }
  });

  it('does not create a parallel Thread/Post when resolving or reading an article discussion', async () => {
    const before = await Promise.all([database.thread.count(), database.post.count()]);
    await request(app.getHttpServer())
      .get('/api/v1/articles/by-slug/' + slugs.published)
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/articles/' + publishedId + '/comments')
      .expect(200);
    const after = await Promise.all([database.thread.count(), database.post.count()]);
    expect(after).toEqual(before);
  });

  it('removes the discussion from public discovery on archive without copying or deleting comments', async () => {
    await database.article.update({
      where: { id: publishedId },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
    await request(app.getHttpServer())
      .get('/api/v1/articles/by-slug/' + slugs.published)
      .expect(404);
    const response = await request(app.getHttpServer())
      .get('/api/v1/articles?limit=100')
      .expect(200);
    const payload = dataOf<{ items: Array<{ id: string }> }>(response);
    expect(payload.items.some((row) => row.id === publishedId)).toBe(false);
    expect(await database.comment.count({ where: { articleId: publishedId } })).toBe(1);
  });
});
