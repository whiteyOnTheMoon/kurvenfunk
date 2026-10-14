import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReactionsService } from './reactions.service';

const database = {
  comment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  reaction: {
    findFirst: jest.fn(),
    groupBy: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => database,
}));

describe('ReactionsService', () => {
  let service: ReactionsService;

  const commentId = '11111111-1111-4111-8111-111111111111';
  const authorId = '22222222-2222-4222-8222-222222222222';
  const voterId = '33333333-3333-4333-8333-333333333333';

  const visibleComment = {
    id: commentId,
    authorId,
    status: 'VISIBLE',
    deletedAt: null,
    article: {
      status: 'PUBLISHED',
      deletedAt: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ReactionsService();

    database.comment.findUnique.mockResolvedValue(visibleComment);

    database.reaction.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);

    database.reaction.findUnique.mockResolvedValue(null);
    database.reaction.upsert.mockResolvedValue({});
    database.reaction.deleteMany.mockResolvedValue({ count: 1 });
    database.reaction.findMany.mockResolvedValue([]);
  });

  it('calculates the voting score correctly', async () => {
    const result = await service.getSummary(commentId);

    expect(result).toEqual({
      commentId,
      upvotes: 3,
      downvotes: 1,
      score: 2,
      viewerVote: null,
    });
  });

  it('allows ACTIVE users to upvote', async () => {
    await service.setVote({
      commentId,
      userId: voterId,
      userStatus: 'ACTIVE',
      type: 'UPVOTE',
    });

    expect(database.reaction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_commentId: {
            userId: voterId,
            commentId,
          },
        },
        create: {
          userId: voterId,
          commentId,
          type: 'UPVOTE',
        },
        update: {
          type: 'UPVOTE',
        },
      }),
    );
  });

  it('allows LIMITED users to downvote', async () => {
    await service.setVote({
      commentId,
      userId: voterId,
      userStatus: 'LIMITED',
      type: 'DOWNVOTE',
    });

    expect(database.reaction.upsert).toHaveBeenCalled();
  });

  it('rejects votes from BANNED users', async () => {
    await expect(
      service.setVote({
        commentId,
        userId: voterId,
        userStatus: 'BANNED',
        type: 'UPVOTE',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(database.reaction.upsert).not.toHaveBeenCalled();
  });

  it('prevents users from voting on their own comments', async () => {
    await expect(
      service.setVote({
        commentId,
        userId: authorId,
        userStatus: 'ACTIVE',
        type: 'UPVOTE',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(database.reaction.upsert).not.toHaveBeenCalled();
  });

  it('rejects votes on deleted comments', async () => {
    database.comment.findUnique.mockResolvedValue({
      ...visibleComment,
      status: 'DELETED',
      deletedAt: new Date(),
    });

    await expect(
      service.setVote({
        commentId,
        userId: voterId,
        userStatus: 'ACTIVE',
        type: 'UPVOTE',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(database.reaction.upsert).not.toHaveBeenCalled();
  });

  it('allows users to remove their own votes', async () => {
    await service.removeVote({
      commentId,
      userId: voterId,
      userStatus: 'ACTIVE',
    });

    expect(database.reaction.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: voterId,
        commentId,
      },
    });
  });

  it('rejects vote removal by banned users', async () => {
    await expect(
      service.removeVote({
        commentId,
        userId: voterId,
        userStatus: 'BANNED',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(database.reaction.deleteMany).not.toHaveBeenCalled();
  });

  it('returns chronological votes with nicknames, avatars and types', async () => {
    database.reaction.findMany.mockResolvedValue([
      {
        id: '44444444-4444-4444-8444-444444444444',
        type: 'UPVOTE',
        user: {
          id: voterId,
          nickname: 'RapidFan',
          profile: {
            avatarMedia: {
              status: 'ACTIVE',
              externalUrl: 'https://example.test/avatar.jpg',
            },
          },
        },
      },
      {
        id: '55555555-5555-4555-8555-555555555555',
        type: 'DOWNVOTE',
        user: {
          id: authorId,
          nickname: 'SturmFan',
          profile: null,
        },
      },
    ]);

    const result = await service.getVoters(commentId, 20);

    expect(result).toEqual({
      commentId,
      items: [
        {
          userId: voterId,
          nickname: 'RapidFan',
          avatarUrl: 'https://example.test/avatar.jpg',
          type: 'UPVOTE',
        },
        {
          userId: authorId,
          nickname: 'SturmFan',
          avatarUrl: null,
          type: 'DOWNVOTE',
        },
      ],
      nextCursor: null,
    });

    expect(database.reaction.findMany).toHaveBeenCalledWith({
      where: {
        commentId,
        type: {
          in: ['UPVOTE', 'DOWNVOTE'],
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 21,
      select: {
        id: true,
        type: true,
        user: {
          select: {
            id: true,
            nickname: true,
            profile: {
              select: {
                avatarMedia: {
                  select: {
                    externalUrl: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  it('rejects votes on unpublished articles', async () => {
    database.comment.findUnique.mockResolvedValue({
      ...visibleComment,
      article: {
        status: 'DRAFT',
        deletedAt: null,
      },
    });

    await expect(
      service.setVote({
        commentId,
        userId: voterId,
        userStatus: 'ACTIVE',
        type: 'UPVOTE',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a voter cursor belonging to another comment', async () => {
    database.reaction.findFirst.mockResolvedValue(null);

    await expect(
      service.getVoters(commentId, 20, '44444444-4444-4444-8444-444444444444'),
    ).rejects.toMatchObject({
      response: {
        code: 'INVALID_VOTE_CURSOR',
      },
    });

    expect(database.reaction.findMany).not.toHaveBeenCalled();
  });

  it('validates cursor ownership before fetching more voters', async () => {
    const cursor = '44444444-4444-4444-8444-444444444444';

    database.reaction.findFirst.mockResolvedValue({
      id: cursor,
    });

    await service.getVoters(commentId, 20, cursor);

    expect(database.reaction.findFirst).toHaveBeenCalledWith({
      where: {
        id: cursor,
        commentId,
        type: {
          in: ['UPVOTE', 'DOWNVOTE'],
        },
      },
      select: {
        id: true,
      },
    });

    expect(database.reaction.findMany).toHaveBeenCalled();
  });

  describe('batch voting summaries', () => {
    const secondCommentId = '55555555-5555-4555-8555-555555555555';

    beforeEach(() => {
      database.comment.findMany.mockResolvedValue([{ id: commentId }, { id: secondCommentId }]);

      database.reaction.groupBy.mockResolvedValue([
        {
          commentId,
          type: 'UPVOTE',
          _count: { _all: 7 },
        },
        {
          commentId,
          type: 'DOWNVOTE',
          _count: { _all: 2 },
        },
        {
          commentId: secondCommentId,
          type: 'DOWNVOTE',
          _count: { _all: 3 },
        },
      ]);

      database.reaction.findMany.mockResolvedValue([]);
    });

    it('calculates summaries for multiple comments', async () => {
      const result = await service.getSummaries([commentId, secondCommentId]);

      expect(result).toEqual([
        {
          commentId,
          upvotes: 7,
          downvotes: 2,
          score: 5,
          viewerVote: null,
        },
        {
          commentId: secondCommentId,
          upvotes: 0,
          downvotes: 3,
          score: -3,
          viewerVote: null,
        },
      ]);
    });

    it('does not query personal votes for guests', async () => {
      await service.getSummaries([commentId]);

      expect(database.reaction.findMany).not.toHaveBeenCalled();
    });

    it('includes the authenticated users own vote', async () => {
      database.reaction.findMany.mockResolvedValue([
        {
          commentId,
          type: 'UPVOTE',
        },
      ]);

      const result = await service.getSummaries([commentId], voterId);

      expect(result[0].viewerVote).toBe('UPVOTE');

      expect(database.reaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: voterId,
          commentId: { in: [commentId, secondCommentId] },
        },
        select: {
          commentId: true,
          type: true,
        },
      });
    });

    it('excludes comments that are not publicly visible', async () => {
      database.comment.findMany.mockResolvedValue([{ id: commentId }]);

      const result = await service.getSummaries([commentId, secondCommentId]);

      expect(result).toHaveLength(1);
      expect(result[0].commentId).toBe(commentId);

      expect(database.comment.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [commentId, secondCommentId] },
          status: 'VISIBLE',
          deletedAt: null,
          article: {
            status: 'PUBLISHED',
            deletedAt: null,
          },
        },
        select: {
          id: true,
        },
      });
    });

    it('deduplicates requested comment IDs', async () => {
      database.comment.findMany.mockResolvedValue([{ id: commentId }]);

      const result = await service.getSummaries([commentId, commentId]);

      expect(result).toHaveLength(1);

      expect(database.comment.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [commentId] },
          status: 'VISIBLE',
          deletedAt: null,
          article: {
            status: 'PUBLISHED',
            deletedAt: null,
          },
        },
        select: {
          id: true,
        },
      });
    });

    it('returns no personal data in public summaries', async () => {
      const result = await service.getSummaries([commentId]);

      expect(result[0]).not.toHaveProperty('userId');
      expect(result[0]).not.toHaveProperty('nickname');
      expect(result[0]).not.toHaveProperty('email');
      expect(result[0].viewerVote).toBeNull();
    });
  });
});
