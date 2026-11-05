import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';

const database = {
  comment: {
    findUnique: jest.fn(),
  },
  moderationReport: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
  },
  auditLog: { create: jest.fn() },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
};

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => database,
}));

describe('ReportsService', () => {
  let service: ReportsService;

  const commentId = '11111111-1111-4111-8111-111111111111';
  const reporterId = '22222222-2222-4222-8222-222222222222';

  const visibleComment = {
    id: commentId,
    authorId: '55555555-5555-4555-8555-555555555555',
    status: 'VISIBLE',
    deletedAt: null,
    article: {
      status: 'PUBLISHED',
      deletedAt: null,
    },
  };

  const command = {
    commentId,
    reporterId,
    userStatus: 'ACTIVE' as const,
    reason: 'SPAM' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ReportsService();
    database.$transaction.mockImplementation(async (handler: (db: typeof database) => unknown) =>
      handler(database),
    );
    database.moderationReport.updateMany.mockResolvedValue({ count: 1 });
    database.moderationReport.findUnique.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      targetType: 'COMMENT',
      status: 'OPEN',
      commentId,
    });
    database.moderationReport.findUniqueOrThrow.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      status: 'DISMISSED',
      resolution: 'NO_VIOLATION',
    });
    database.comment.findUnique.mockResolvedValue(visibleComment);

    database.comment.findUnique.mockResolvedValue(visibleComment);

    database.moderationReport.create.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      status: 'OPEN',
      createdAt: new Date('2026-10-15T00:00:00.000Z'),
    });
  });

  it('creates a report for an ACTIVE user', async () => {
    const result = await service.createCommentReport(command);

    expect(result.status).toBe('OPEN');

    expect(database.moderationReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          reporterId,
          targetType: 'COMMENT',
          commentId,
          reason: 'SPAM',
          details: null,
          status: 'OPEN',
        },
      }),
    );
  });

  it('allows LIMITED users to report comments', async () => {
    await service.createCommentReport({
      ...command,
      userStatus: 'LIMITED',
    });

    expect(database.moderationReport.create).toHaveBeenCalled();
  });

  it('rejects BANNED users', async () => {
    await expect(
      service.createCommentReport({
        ...command,
        userStatus: 'BANNED',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(database.moderationReport.create).not.toHaveBeenCalled();
  });

  it('rejects reporting ones own comment', async () => {
    database.comment.findUnique.mockResolvedValue({
      ...visibleComment,
      authorId: reporterId,
    });

    await expect(service.createCommentReport(command)).rejects.toMatchObject({
      response: { code: 'SELF_REPORT_FORBIDDEN' },
    });

    expect(database.moderationReport.create).not.toHaveBeenCalled();
  });

  it('rejects nonexistent comments', async () => {
    database.comment.findUnique.mockResolvedValue(null);

    await expect(service.createCommentReport(command)).rejects.toBeInstanceOf(NotFoundException);

    expect(database.moderationReport.create).not.toHaveBeenCalled();
  });

  it('rejects deleted comments', async () => {
    database.comment.findUnique.mockResolvedValue({
      ...visibleComment,
      status: 'DELETED',
      deletedAt: new Date(),
    });

    await expect(service.createCommentReport(command)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects comments on unpublished articles', async () => {
    database.comment.findUnique.mockResolvedValue({
      ...visibleComment,
      article: {
        status: 'DRAFT',
        deletedAt: null,
      },
    });

    await expect(service.createCommentReport(command)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stores optional report details', async () => {
    await service.createCommentReport({
      ...command,
      reason: 'HARASSMENT',
      details: 'Wiederholte persönliche Angriffe.',
    });

    expect(database.moderationReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          reporterId,
          targetType: 'COMMENT',
          commentId,
          reason: 'HARASSMENT',
          details: 'Wiederholte persönliche Angriffe.',
          status: 'OPEN',
        },
      }),
    );
  });

  it('rejects duplicate reports', async () => {
    database.moderationReport.create.mockRejectedValue({
      code: 'P2002',
    });

    await expect(service.createCommentReport(command)).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not hide unexpected database errors', async () => {
    const error = new Error('DATABASE_UNAVAILABLE');

    database.moderationReport.create.mockRejectedValue(error);

    await expect(service.createCommentReport(command)).rejects.toBe(error);
  });

  it('lists only open and in-review comment reports with a bounded query', async () => {
    database.moderationReport.findMany.mockResolvedValue([]);

    expect(await service.listPendingCommentReports()).toEqual([]);
    expect(database.moderationReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { targetType: 'COMMENT', status: { in: ['OPEN', 'IN_REVIEW'] } },
        take: 100,
      }),
    );
  });

  it('dismisses a report and writes an audit event atomically', async () => {
    await service.resolveCommentReport({
      reportId: '33333333-3333-4333-8333-333333333333',
      moderatorId: reporterId,
      resolution: 'NO_VIOLATION',
      moderatorNote: 'Kein Verstoß gegen die Community-Regeln.',
    });

    expect(database.moderationReport.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: '33333333-3333-4333-8333-333333333333',
          targetType: 'COMMENT',
          status: { in: ['OPEN', 'IN_REVIEW'] },
        },
        data: expect.objectContaining({
          status: 'DISMISSED',
          resolution: 'NO_VIOLATION',
          assignedModeratorId: reporterId,
          resolvedAt: expect.any(Date),
        }),
      }),
    );
    expect(database.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: reporterId,
        action: 'MODERATION_REPORT_DISMISSED',
        moderationReportId: '33333333-3333-4333-8333-333333333333',
      }),
    });
    expect(database.$transaction).toHaveBeenCalledTimes(1);
  });

  it('requires actual comment moderation before confirming action taken', async () => {
    await expect(
      service.resolveCommentReport({
        reportId: '33333333-3333-4333-8333-333333333333',
        moderatorId: reporterId,
        resolution: 'ACTION_TAKEN',
        moderatorNote: 'Kommentar war regelwidrig.',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(database.moderationReport.updateMany).not.toHaveBeenCalled();
    expect(database.auditLog.create).not.toHaveBeenCalled();
  });

  it('resolves a report with audit after the comment is deleted', async () => {
    database.comment.findUnique.mockResolvedValue({
      status: 'DELETED',
      deletedAt: new Date(),
    });

    await service.resolveCommentReport({
      reportId: '33333333-3333-4333-8333-333333333333',
      moderatorId: reporterId,
      resolution: 'ACTION_TAKEN',
      moderatorNote: 'Kommentar durch Moderation entfernt.',
    });

    expect(database.moderationReport.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'RESOLVED', resolution: 'ACTION_TAKEN' }),
      }),
    );
    expect(database.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'MODERATION_REPORT_RESOLVED' }),
    });
  });

  it('rejects a second decision without writing a duplicate audit entry', async () => {
    database.moderationReport.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.resolveCommentReport({
        reportId: '33333333-3333-4333-8333-333333333333',
        moderatorId: reporterId,
        resolution: 'NO_VIOLATION',
        moderatorNote: 'Bereits abgeschlossen.',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(database.auditLog.create).not.toHaveBeenCalled();
  });

  it('refuses to manage reports targeting something other than a comment', async () => {
    database.moderationReport.findUnique.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      targetType: 'FORUM_POST',
      status: 'OPEN',
      commentId: null,
    });

    await expect(
      service.resolveCommentReport({
        reportId: '33333333-3333-4333-8333-333333333333',
        moderatorId: reporterId,
        resolution: 'NO_VIOLATION',
        moderatorNote: 'Kein Kommentartarget.',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(database.auditLog.create).not.toHaveBeenCalled();
  });

  it('disconnects the database on shutdown', async () => {
    await service.onModuleDestroy();

    expect(database.$disconnect).toHaveBeenCalledTimes(1);
  });
});
