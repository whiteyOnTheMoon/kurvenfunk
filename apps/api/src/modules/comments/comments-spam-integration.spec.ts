const articleFindUnique = jest.fn();
const commentFindUnique = jest.fn();
const commentCreate = jest.fn();
const transaction = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    article: {
      findUnique: articleFindUnique,
    },
    comment: {
      findUnique: commentFindUnique,
      create: commentCreate,
    },
    $transaction: transaction,
    $disconnect: disconnect,
  }),
}));

import { BadRequestException } from '@nestjs/common';

import type { CommentSpamProtectionService } from './comment-spam-protection.service';
import { CommentsService } from './comments.service';

describe('CommentsService spam integration', () => {
  const articleId = '11111111-1111-4111-8111-111111111111';
  const authorId = '22222222-2222-4222-8222-222222222222';
  const parentId = '33333333-3333-4333-8333-333333333333';

  const command = {
    articleId,
    authorId,
    body: 'Rapid gewinnt!',
    userStatus: 'ACTIVE' as const,
  };

  const reservation = {
    keys: ['rate', 'cooldown', 'duplicate'] as [string, string, string],
    token: 'test-reservation',
  };

  const spamReserve = jest.fn();
  const spamRelease = jest.fn();
  const spamValidateLinks = jest.fn();

  let service: CommentsService;

  beforeEach(() => {
    jest.resetAllMocks();

    articleFindUnique.mockResolvedValue({
      id: articleId,
      status: 'PUBLISHED',
      deletedAt: null,
    });

    commentFindUnique.mockResolvedValue({
      id: parentId,
      articleId,
      authorId,
      depth: 0,
      body: 'Originalkommentar',
      status: 'VISIBLE',
      deletedAt: null,
      article: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    commentCreate.mockResolvedValue({
      id: 'created-comment',
    });

    spamReserve.mockResolvedValue(reservation);
    spamRelease.mockResolvedValue(undefined);

    service = new CommentsService({
      reserve: spamReserve,
      release: spamRelease,
      validateLinks: spamValidateLinks,
    } as unknown as CommentSpamProtectionService);
  });

  it('protects normal comment creation', async () => {
    await service.create(command);

    expect(spamReserve).toHaveBeenCalledWith(authorId, command.body);

    expect(commentCreate).toHaveBeenCalledTimes(1);
    expect(spamRelease).not.toHaveBeenCalled();
  });

  it('rejects invalid articles before reserving', async () => {
    articleFindUnique.mockResolvedValue(null);

    await expect(service.create(command)).rejects.toMatchObject({
      response: {
        code: 'ARTICLE_NOT_FOUND',
      },
    });

    expect(spamReserve).not.toHaveBeenCalled();
    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('rejects banned users before reserving', async () => {
    await expect(
      service.create({
        ...command,
        userStatus: 'BANNED',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_CREATE_FORBIDDEN',
      },
    });

    expect(spamReserve).not.toHaveBeenCalled();
    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('does not save comments rejected by spam protection', async () => {
    spamReserve.mockRejectedValueOnce(
      new BadRequestException({
        code: 'COMMENT_LINK_LIMIT',
      }),
    );

    await expect(service.create(command)).rejects.toMatchObject({
      response: {
        code: 'COMMENT_LINK_LIMIT',
      },
    });

    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('releases reservation when database creation fails', async () => {
    const databaseError = new Error('Database unavailable');

    commentCreate.mockRejectedValueOnce(databaseError);

    await expect(service.create(command)).rejects.toBe(databaseError);

    expect(spamRelease).toHaveBeenCalledWith(reservation);
  });

  it('preserves database error when release also fails', async () => {
    const databaseError = new Error('Database unavailable');

    commentCreate.mockRejectedValueOnce(databaseError);

    spamRelease.mockRejectedValueOnce(new Error('Redis unavailable'));

    await expect(service.create(command)).rejects.toBe(databaseError);
  });

  it('protects replies using the same spam service', async () => {
    await service.createReply({
      ...command,
      parentId,
    });

    expect(spamReserve).toHaveBeenCalledWith(authorId, command.body);

    const createCall = commentCreate.mock.calls[0] as unknown[];

    expect(createCall[0]).toMatchObject({
      data: {
        articleId,
        authorId,
        parentId,
        depth: 1,
      },
    });
  });

  it('rejects invalid reply parents before reserving', async () => {
    commentFindUnique.mockResolvedValue(null);

    await expect(
      service.createReply({
        ...command,
        parentId,
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_PARENT_NOT_FOUND',
      },
    });

    expect(spamReserve).not.toHaveBeenCalled();
    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('releases reservation when reply creation fails', async () => {
    commentCreate.mockRejectedValueOnce(new Error('Database unavailable'));

    await expect(
      service.createReply({
        ...command,
        parentId,
      }),
    ).rejects.toThrow('Database unavailable');

    expect(spamRelease).toHaveBeenCalledWith(reservation);
  });

  it('validates links before editing an existing comment', async () => {
    spamValidateLinks.mockImplementationOnce(() => {
      throw new BadRequestException({
        code: 'COMMENT_LINK_LIMIT',
      });
    });

    await expect(
      service.update({
        ...command,
        commentId: parentId,
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_LINK_LIMIT',
      },
    });

    expect(spamValidateLinks).toHaveBeenCalledWith(command.body);

    expect(transaction).not.toHaveBeenCalled();
  });
});
