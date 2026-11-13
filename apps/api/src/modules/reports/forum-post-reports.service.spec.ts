/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest mock matchers return dynamic values. */
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ForumPostReportsService } from './forum-post-reports.service';

const database = {
  post: { findFirst: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
  moderationReport: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
  },
  auditLog: { create: jest.fn(), findFirst: jest.fn() },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
  $disconnect: jest.fn(),
};

jest.mock('@kurvenfunk/database', () => ({ createPrismaClient: () => database }));

describe('Phase 22.222 ForumPostReportsService', () => {
  const reporterId = '11111111-1111-4111-8111-111111111111';
  const postId = '22222222-2222-4222-8222-222222222222';
  const reportId = '33333333-3333-4333-8333-333333333333';
  const moderatorId = '44444444-4444-4444-8444-444444444444';
  const createCommand = {
    forumSlug: 'verein-wien',
    threadSlug: 'match-bericht',
    postId,
    reporterId,
    userStatus: 'ACTIVE' as const,
    reason: 'SPAM' as const,
  };

  let service: ForumPostReportsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ForumPostReportsService();
    database.$transaction.mockImplementation((handler: (db: typeof database) => unknown) =>
      Promise.resolve(handler(database)),
    );
    database.$queryRaw.mockResolvedValue([{ pg_advisory_xact_lock: null }]);
    database.post.findFirst.mockResolvedValue({
      id: postId,
      authorId: '55555555-5555-4555-8555-555555555555',
    });
    database.post.findUnique.mockResolvedValue({
      id: postId,
      threadId: '66666666-6666-4666-8666-666666666666',
      deletedAt: null,
    });
    database.post.updateMany.mockResolvedValue({ count: 1 });
    database.moderationReport.findFirst.mockResolvedValue(null);
    database.moderationReport.create.mockResolvedValue({ id: reportId, status: 'OPEN' });
    database.moderationReport.findUnique.mockResolvedValue({
      id: reportId,
      targetType: 'FORUM_POST',
      postId,
      status: 'OPEN',
    });
    database.moderationReport.findUniqueOrThrow.mockResolvedValue({
      id: reportId,
      status: 'DISMISSED',
    });
    database.moderationReport.updateMany.mockResolvedValue({ count: 1 });
  });

  it('creates private report on a visible OPEN/LOCKED forum post within a transaction', async () => {
    expect(await service.createReport(createCommand)).toMatchObject({ status: 'OPEN' });
    expect(database.$queryRaw).toHaveBeenCalledTimes(1);
    expect(database.post.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: postId,
        deletedAt: null,
        thread: {
          is: expect.objectContaining({
            slug: createCommand.threadSlug,
            status: { in: ['OPEN', 'LOCKED'] },
            mergedIntoThreadId: null,
          }),
        },
      }),
      select: { id: true, authorId: true },
    });
    expect(database.moderationReport.create).toHaveBeenCalledWith({
      data: {
        reporterId,
        targetType: 'FORUM_POST',
        postId,
        reportedUserId: '55555555-5555-4555-8555-555555555555',
        reason: 'SPAM',
        details: null,
        status: 'OPEN',
      },
      select: { id: true, status: true, createdAt: true },
    });
    expect(database.$transaction).toHaveBeenCalledTimes(1);
  });

  it('accepts LIMITED reporters but denies BANNED', async () => {
    await service.createReport({ ...createCommand, userStatus: 'LIMITED' });
    await expect(
      service.createReport({ ...createCommand, userStatus: 'BANNED' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(database.moderationReport.create).toHaveBeenCalledTimes(1);
  });

  it('refuses invisible/deleted targets and self reports', async () => {
    database.post.findFirst.mockResolvedValueOnce(null);
    await expect(service.createReport(createCommand)).rejects.toBeInstanceOf(NotFoundException);
    database.post.findFirst.mockResolvedValueOnce({ id: postId, authorId: reporterId });
    await expect(service.createReport(createCommand)).rejects.toBeInstanceOf(ForbiddenException);
    expect(database.moderationReport.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate reports by the same user (including already resolved reports)', async () => {
    database.moderationReport.findFirst.mockResolvedValue({ id: reportId });
    await expect(service.createReport(createCommand)).rejects.toBeInstanceOf(ConflictException);
    expect(database.moderationReport.create).not.toHaveBeenCalled();
  });

  it('returns bounded pending reports and redacts deleted post content', async () => {
    database.moderationReport.findMany.mockResolvedValue([
      {
        id: reportId,
        postId,
        post: {
          id: postId,
          deletedAt: new Date(),
          content: 'private deleted text',
          author: { nickname: 'secret' },
          thread: { slug: 'topic' },
        },
      },
    ]);
    const reports = await service.listPendingReports();
    expect(reports[0].post).toMatchObject({ content: null, author: null, deleted: true });
    expect(database.moderationReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { targetType: 'FORUM_POST', status: { in: ['OPEN', 'IN_REVIEW'] } },
        take: 100,
      }),
    );
  });

  it('removes a post once and audits the moderator action atomically', async () => {
    const result = await service.removePost({ postId, moderatorId, reason: 'Verstoß gegen Regeln' });
    expect(result).toEqual({ postId, removed: true });
    expect(database.post.updateMany).toHaveBeenCalledWith({
      where: { id: postId, deletedAt: null },
      data: { deletedAt: expect.any(Date), deletedByUserId: moderatorId },
    });
    expect(database.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: moderatorId,
        action: 'POST_DELETED_BY_MODERATOR',
        targetType: 'FORUM_POST',
        targetId: postId,
      }),
    });
  });

  it('does not issue a second removal audit on concurrent loser', async () => {
    database.post.updateMany.mockResolvedValue({ count: 0 });
    expect(await service.removePost({ postId, moderatorId, reason: 'Regelverstoß' })).toMatchObject({
      removed: false,
    });
    expect(database.auditLog.create).not.toHaveBeenCalled();
  });

  it('requires recorded moderator action before ACTION_TAKEN resolution', async () => {
    const command = {
      reportId,
      moderatorId,
      resolution: 'ACTION_TAKEN' as const,
      moderatorNote: 'Regelwidriger Beitrag wurde entfernt.',
    };
    await expect(service.resolveReport(command)).rejects.toBeInstanceOf(ConflictException);
    expect(database.moderationReport.updateMany).not.toHaveBeenCalled();
    database.post.findUnique.mockResolvedValue({ deletedAt: new Date() });
    database.auditLog.findFirst.mockResolvedValue({ id: '77777777-7777-4777-8777-777777777777' });
    await service.resolveReport(command);
    expect(database.moderationReport.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: reportId,
          targetType: 'FORUM_POST',
          status: { in: ['OPEN', 'IN_REVIEW'] },
        },
        data: expect.objectContaining({ status: 'RESOLVED' }),
      }),
    );
    expect(database.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'MODERATION_REPORT_RESOLVED',
        targetType: 'MODERATION_REPORT',
        moderationReportId: reportId,
      }),
    });
  });

  it('dismisses without claiming a moderation action and blocks double decisions', async () => {
    const command = {
      reportId,
      moderatorId,
      resolution: 'NO_VIOLATION' as const,
      moderatorNote: 'Es liegt kein Verstoß vor.',
    };
    await service.resolveReport(command);
    expect(database.moderationReport.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DISMISSED' }) }),
    );
    database.moderationReport.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.resolveReport(command)).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses to resolve comment reports in the forum queue', async () => {
    database.moderationReport.findUnique.mockResolvedValue({
      id: reportId,
      targetType: 'COMMENT',
      status: 'OPEN',
    });
    await expect(
      service.resolveReport({
        reportId,
        moderatorId,
        resolution: 'DUPLICATE',
        moderatorNote: 'Keine Forumsache',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(database.moderationReport.updateMany).not.toHaveBeenCalled();
  });

  it('disconnects its Prisma client at shutdown', async () => {
    await service.onModuleDestroy();
    expect(database.$disconnect).toHaveBeenCalledTimes(1);
  });
});
