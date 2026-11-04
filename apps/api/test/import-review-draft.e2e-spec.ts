import { randomUUID } from 'node:crypto';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import { ImportsService } from '../src/modules/imports/imports.service';

describe('Import review to editorial draft with disposable PostgreSQL', () => {
  let database: DatabaseClient;
  let service: ImportsService;
  let reviewerId: string;
  let providerId: string;
  let jobId: string;

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      url.hostname !== '127.0.0.1' ||
      url.pathname !== '/kurvenfunk_e2e'
    ) {
      throw new Error('A disposable local database is required');
    }

    database = createPrismaClient();
    service = new ImportsService();
    const uniqueId = randomUUID();

    reviewerId = (
      await database.user.create({
        data: { keycloakSubject: `draft-reviewer-${uniqueId}` },
        select: { id: true },
      })
    ).id;

    providerId = (
      await database.provider.create({
        data: { name: 'Isolated Review Test Provider', key: `review-${uniqueId}`, type: 'NEWS' },
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
    await service?.onModuleDestroy();
    await database?.$disconnect();
  });

  async function createReview(title: string | null) {
    return database.importRecord.create({
      data: {
        importJobId: jobId,
        providerId,
        recordType: 'NEWS_ARTICLE',
        status: 'REVIEW_REQUIRED',
        externalUrl: 'https://news.example.test/article',
        normalizedPayload: {
          title,
          lead: 'A short introduction',
          body: 'News content awaiting editorial approval',
          authorName: 'Agency',
          clubNames: [],
        },
      },
      select: { id: true },
    });
  }

  it('creates exactly one durable non-published draft during competing approvals', async () => {
    const record = await createReview('Rapid gegen Sturm');
    const attempts = await Promise.allSettled([
      service.approveReview(record.id, reviewerId),
      service.approveReview(record.id, reviewerId),
    ]);

    expect(attempts.some((attempt) => attempt.status === 'fulfilled')).toBe(true);

    const repeated = await service.approveReview(record.id, reviewerId);
    expect(repeated.status).toBe('CREATED');
    expect(repeated.reviewDecision).toBe('APPROVED');

    const article = await database.article.findUniqueOrThrow({
      where: { importRecordId: record.id },
    });
    expect(repeated.canonicalEntityId).toBe(article.id);
    expect(article.status).toBe('DRAFT');
    expect(article.publishedAt).toBeNull();
    expect(article.originalUrl).toBe('https://news.example.test/article');
    expect(article.authorId).toBe(reviewerId);

    expect(await database.article.count({ where: { importRecordId: record.id } })).toBe(1);
    const job = await database.importJob.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.createdCount).toBe(1);
    expect(
      await database.auditLog.count({
        where: { action: 'ADMIN_CORRECTION', targetId: article.id },
      }),
    ).toBe(1);
  }, 30000);

  it('refuses invalid normalized news without a draft or status update', async () => {
    const record = await createReview(null);
    await expect(service.approveReview(record.id, reviewerId)).rejects.toThrow();

    const persisted = await database.importRecord.findUniqueOrThrow({
      where: { id: record.id },
    });
    expect(persisted.status).toBe('REVIEW_REQUIRED');
    expect(persisted.reviewDecision).toBeNull();
    expect(await database.article.count({ where: { importRecordId: record.id } })).toBe(0);
  });

  it('keeps rejected news out of the editorial drafts', async () => {
    const record = await createReview('Rejected news');
    const rejected = await service.rejectReview(record.id, reviewerId);
    expect(rejected.status).toBe('SKIPPED');
    expect(await database.article.count({ where: { importRecordId: record.id } })).toBe(0);
    await expect(service.approveReview(record.id, reviewerId)).rejects.toThrow();
  });
});
