import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';

const database = {
  comment: {
    findUnique: jest.fn(),
  },
  moderationReport: {
    create: jest.fn(),
  },
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

  it('disconnects the database on shutdown', async () => {
    await service.onModuleDestroy();

    expect(database.$disconnect).toHaveBeenCalledTimes(1);
  });
});
