import { randomUUID } from 'node:crypto';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import { NewsAutoPublishingService } from '../../worker/src/services/news-auto-publishing.service';

type PublishArgs = Parameters<NewsAutoPublishingService['publish']>;

describe('Trusted news publication with disposable PostgreSQL', () => {
  let database: DatabaseClient;
  let service: NewsAutoPublishingService;
  let providerId: string;
  let jobId: string;

  const provider = {
    key: 'e2e-trusted',
    name: 'Isolated trusted test provider',
    trustedForAutoPublish: true,
    capabilities: {
      supportsCursorPagination: true,
      supportsTimeWindow: true,
    },
    fetch: async () => {
      throw new Error('E2E must never contact a real provider');
    },
  } as unknown as PublishArgs[0];

  const clubs = { matches: [], unmatchedNames: [] } as PublishArgs[3];
  const competition = { match: null, unmatchedName: null } as PublishArgs[4];
  const match = { match: null, ambiguous: false } as PublishArgs[5];

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      url.hostname !== '127.0.0.1' ||
      url.pathname !== '/kurvenfunk_e2e'
    ) {
      throw new Error('A disposable local PostgreSQL instance is required');
    }

    database = createPrismaClient();
    service = new NewsAutoPublishingService({
      client: database,
    } as ConstructorParameters<typeof NewsAutoPublishingService>[0]);

    const suffix = randomUUID();
    providerId = (
      await database.provider.create({
        data: {
          name: 'Auto-publishing atomic E2E',
          key: 'auto-publish-' + suffix,
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
  });

  afterAll(async () => {
    await database?.$disconnect();
  });

  async function createRecord() {
    return (
      await database.importRecord.create({
        data: {
          importJobId: jobId,
          providerId,
          recordType: 'NEWS_ARTICLE',
          status: 'MATCHED',
        },
        select: { id: true },
      })
    ).id;
  }

  function input(title: string): PublishArgs[2] {
    return {
      title,
      body: 'Trusted news body content',
      lead: 'News introduction',
      authorName: 'Isolated E2E',
      originalUrl: 'https://example.invalid/trusted',
      clubNames: [],
    };
  }

  it('publishes exactly one article from concurrent retries of the same record', async () => {
    const recordId = await createRecord();
    const args = [
      provider,
      recordId,
      input('Concurrent trusted news'),
      clubs,
      competition,
      match,
    ] as const;

    const outcomes = await Promise.all([
      service.publish(...args),
      service.publish(...args),
    ]);

    expect(outcomes.every((result) => result.articleId === outcomes[0].articleId)).toBe(true);
    expect(outcomes.filter((result) => result.created)).toHaveLength(1);

    const storedArticle = await database.article.findUniqueOrThrow({
      where: { importRecordId: recordId },
    });
    expect(storedArticle.status).toBe('PUBLISHED');
    expect(storedArticle.id).toBe(outcomes[0].articleId);
    expect(await database.article.count({ where: { importRecordId: recordId } })).toBe(1);

    const storedRecord = await database.importRecord.findUniqueOrThrow({
      where: { id: recordId },
    });
    expect(storedRecord.status).toBe('CREATED');
    expect(storedRecord.canonicalEntityId).toBe(storedArticle.id);
    expect(
      (await database.importJob.findUniqueOrThrow({ where: { id: jobId } })).createdCount,
    ).toBe(1);

    const retry = await service.publish(...args);
    expect(retry).toEqual({ articleId: storedArticle.id, created: false });
  }, 30000);

  it('publishes different records with identical headlines without slug races', async () => {
    const first = await createRecord();
    const second = await createRecord();
    const news = input('Two records share this headline');

    const [a, b] = await Promise.all([
      service.publish(provider, first, news, clubs, competition, match),
      service.publish(provider, second, news, clubs, competition, match),
    ]);

    expect(a.created).toBe(true);
    expect(b.created).toBe(true);
    expect(a.articleId).not.toBe(b.articleId);

    const originals = await database.article.findMany({
      where: { importRecordId: { in: [first, second] } },
      select: { id: true, slug: true },
    });

    expect(originals).toHaveLength(2);
    expect(new Set(originals.map((article) => article.slug)).size).toBe(2);
    expect(
      (await database.importJob.findUniqueOrThrow({ where: { id: jobId } })).createdCount,
    ).toBe(3);
  }, 30000);
});
