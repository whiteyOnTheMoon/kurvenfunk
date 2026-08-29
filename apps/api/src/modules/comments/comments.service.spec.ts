const articleFindUnique = jest.fn();
const commentCreate = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    article: {
      findUnique: articleFindUnique,
    },
    comment: {
      create: commentCreate,
    },
    $disconnect: disconnect,
  }),
}));

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommentsService();
  });

  it('creates a visible top-level comment for an ACTIVE user', async () => {
    articleFindUnique.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      status: 'PUBLISHED',
      deletedAt: null,
    });

    commentCreate.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      articleId: '11111111-1111-4111-8111-111111111111',
      authorId: '33333333-3333-4333-8333-333333333333',
      parentId: null,
      body: 'Rapid spielt heute stark.',
      depth: 0,
      status: 'VISIBLE',
      editedAt: null,
      createdAt: new Date('2026-08-28T20:00:00.000Z'),
      updatedAt: new Date('2026-08-28T20:00:00.000Z'),
      author: {
        id: '33333333-3333-4333-8333-333333333333',
        nickname: 'BlockWest',
      },
    });

    const result = await service.create({
      articleId: '11111111-1111-4111-8111-111111111111',
      authorId: '33333333-3333-4333-8333-333333333333',
      body: 'Rapid spielt heute stark.',
      userStatus: 'ACTIVE',
    });

    expect(articleFindUnique).toHaveBeenCalledWith({
      where: {
        id: '11111111-1111-4111-8111-111111111111',
      },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    expect(commentCreate).toHaveBeenCalledWith({
      data: {
        articleId: '11111111-1111-4111-8111-111111111111',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Rapid spielt heute stark.',
        depth: 0,
        status: 'VISIBLE',
      },
      select: {
        id: true,
        articleId: true,
        authorId: true,
        parentId: true,
        body: true,
        depth: true,
        status: true,
        editedAt: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    expect(result.status).toBe('VISIBLE');
    expect(result.depth).toBe(0);
  });

  it('rejects a LIMITED user before accessing the article', async () => {
    await expect(
      service.create({
        articleId: '11111111-1111-4111-8111-111111111111',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Dieser Kommentar darf nicht erstellt werden.',
        userStatus: 'LIMITED',
      }),
    ).rejects.toMatchObject<ForbiddenException>({
      response: {
        code: 'COMMENT_CREATE_FORBIDDEN',
      },
    });

    expect(articleFindUnique).not.toHaveBeenCalled();
    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('rejects a BANNED user defensively in the service', async () => {
    await expect(
      service.create({
        articleId: '11111111-1111-4111-8111-111111111111',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Dieser Kommentar darf nicht erstellt werden.',
        userStatus: 'BANNED',
      }),
    ).rejects.toMatchObject<ForbiddenException>({
      response: {
        code: 'COMMENT_CREATE_FORBIDDEN',
      },
    });

    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('rejects an unknown article', async () => {
    articleFindUnique.mockResolvedValue(null);

    await expect(
      service.create({
        articleId: '11111111-1111-4111-8111-111111111111',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Test',
        userStatus: 'ACTIVE',
      }),
    ).rejects.toMatchObject<NotFoundException>({
      response: {
        code: 'ARTICLE_NOT_FOUND',
      },
    });

    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('rejects a non-published article', async () => {
    articleFindUnique.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      status: 'DRAFT',
      deletedAt: null,
    });

    await expect(
      service.create({
        articleId: '11111111-1111-4111-8111-111111111111',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Test',
        userStatus: 'ACTIVE',
      }),
    ).rejects.toMatchObject<NotFoundException>({
      response: {
        code: 'ARTICLE_NOT_FOUND',
      },
    });

    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('rejects a deleted article', async () => {
    articleFindUnique.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      status: 'PUBLISHED',
      deletedAt: new Date(),
    });

    await expect(
      service.create({
        articleId: '11111111-1111-4111-8111-111111111111',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Test',
        userStatus: 'ACTIVE',
      }),
    ).rejects.toMatchObject<NotFoundException>({
      response: {
        code: 'ARTICLE_NOT_FOUND',
      },
    });

    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
