const articleFindUnique = jest.fn();
const commentCreate = jest.fn();
const commentFindMany = jest.fn();
const commentFindUnique = jest.fn();
const txCommentFindUniqueOrThrow = jest.fn();
const commentUpdateMany = jest.fn();
const commentRevisionCreate = jest.fn();
const transaction = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    article: {
      findUnique: articleFindUnique,
    },
    comment: {
      create: commentCreate,
      findMany: commentFindMany,
      findUnique: commentFindUnique,
      updateMany: commentUpdateMany,
    },
    $transaction: transaction,
    $disconnect: disconnect,
  }),
}));

import type { CommentSpamProtectionService } from './comment-spam-protection.service';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;

  beforeEach(() => {
    jest.clearAllMocks();

    transaction.mockImplementation(
      (
        callback: (client: {
          comment: {
            updateMany: typeof commentUpdateMany;
            findUniqueOrThrow: typeof txCommentFindUniqueOrThrow;
          };
          commentRevision: { create: typeof commentRevisionCreate };
        }) => unknown,
      ) =>
        callback({
          comment: {
            updateMany: commentUpdateMany,
            findUniqueOrThrow: txCommentFindUniqueOrThrow,
          },
          commentRevision: {
            create: commentRevisionCreate,
          },
        }),
    );

    service = new CommentsService({
      reserve: jest.fn().mockResolvedValue({
        keys: ['rate', 'cooldown', 'duplicate'],
        token: 'unit-test',
      }),
      release: jest.fn().mockResolvedValue(undefined),
      validateLinks: jest.fn(),
    } as unknown as CommentSpamProtectionService);
  });

  describe('remove', () => {
    const articleId = '11111111-1111-4111-8111-111111111111';
    const commentId = '22222222-2222-4222-8222-222222222222';
    const authorId = '33333333-3333-4333-8333-333333333333';

    const command = {
      articleId,
      commentId,
      authorId,
      userStatus: 'ACTIVE' as const,
    };

    const existingComment = {
      id: commentId,
      articleId,
      authorId,
      status: 'VISIBLE',
      deletedAt: null,
      article: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
    };

    it('soft deletes an own visible comment', async () => {
      commentFindUnique.mockResolvedValue(existingComment);
      commentUpdateMany.mockResolvedValue({ count: 1 });

      const result = await service.remove(command);

      expect(result).toEqual({
        id: commentId,
        deleted: true,
      });

      expect(commentUpdateMany).toHaveBeenCalledTimes(1);

      expect(commentUpdateMany).toHaveBeenCalledTimes(1);

      const mockCalls = commentUpdateMany.mock.calls as unknown[][];
      const updateArgument = mockCalls[0]?.[0] as
        | {
            where: {
              id: string;
              articleId: string;
              authorId: string;
              status: string;
              deletedAt: null;
            };
            data: {
              status: string;
              deletedAt: Date;
            };
          }
        | undefined;

      expect(updateArgument).toBeDefined();

      expect(updateArgument?.where).toEqual({
        id: commentId,
        articleId,
        authorId,
        status: 'VISIBLE',
        deletedAt: null,
      });

      expect(updateArgument?.data.status).toBe('DELETED');
      expect(updateArgument?.data.deletedAt).toBeInstanceOf(Date);
    });

    it('rejects deleting another users comment', async () => {
      commentFindUnique.mockResolvedValue({
        ...existingComment,
        authorId: '44444444-4444-4444-8444-444444444444',
      });

      await expect(service.remove(command)).rejects.toMatchObject({
        response: {
          code: 'COMMENT_DELETE_FORBIDDEN',
        },
      });

      expect(commentUpdateMany).not.toHaveBeenCalled();
    });

    it('rejects BANNED users before database access', async () => {
      await expect(
        service.remove({
          ...command,
          userStatus: 'BANNED',
        }),
      ).rejects.toMatchObject({
        response: {
          code: 'COMMENT_DELETE_FORBIDDEN',
        },
      });

      expect(commentFindUnique).not.toHaveBeenCalled();
      expect(commentUpdateMany).not.toHaveBeenCalled();
    });

    it('rejects already deleted comments', async () => {
      commentFindUnique.mockResolvedValue({
        ...existingComment,
        status: 'DELETED',
        deletedAt: new Date(),
      });

      await expect(service.remove(command)).rejects.toMatchObject({
        response: {
          code: 'COMMENT_NOT_FOUND',
        },
      });

      expect(commentUpdateMany).not.toHaveBeenCalled();
    });

    it('rejects comments belonging to another article', async () => {
      commentFindUnique.mockResolvedValue({
        ...existingComment,
        articleId: '55555555-5555-4555-8555-555555555555',
      });

      await expect(service.remove(command)).rejects.toMatchObject({
        response: {
          code: 'COMMENT_NOT_FOUND',
        },
      });

      expect(commentUpdateMany).not.toHaveBeenCalled();
    });

    it('rejects a concurrent delete when the conditional update affects no rows', async () => {
      commentFindUnique.mockResolvedValue(existingComment);
      commentUpdateMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(command)).rejects.toMatchObject({
        response: {
          code: 'COMMENT_NOT_FOUND',
        },
      });

      expect(commentUpdateMany).toHaveBeenCalledTimes(1);
    });
  });

  it('lists visible comments and eligible deleted ancestors for an article', async () => {
    commentFindMany.mockResolvedValue([]);

    const result = await service.listForArticle('11111111-1111-4111-8111-111111111111');

    expect(commentFindMany).toHaveBeenCalledWith({
      where: {
        articleId: '11111111-1111-4111-8111-111111111111',
        OR: [
          {
            status: 'VISIBLE',
            deletedAt: null,
          },
          {
            status: 'DELETED',
            deletedAt: {
              not: null,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
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
    expect(result).toEqual([]);
  });

  describe('deleted comment listing', () => {
    const articleId = '11111111-1111-4111-8111-111111111111';
    const createdAt = new Date('2026-08-28T20:00:00.000Z');
    const deletedAt = new Date('2026-08-29T20:00:00.000Z');

    function makeComment(id: string, parentId: string | null, status: 'VISIBLE' | 'DELETED') {
      return {
        id,
        articleId,
        authorId: '33333333-3333-4333-8333-333333333333',
        parentId,
        body: 'Vertraulicher Kommentartext',
        depth: parentId ? 1 : 0,
        status,
        editedAt: null,
        createdAt,
        updatedAt: createdAt,
        author: {
          id: '33333333-3333-4333-8333-333333333333',
          nickname: 'BlockWest',
        },
      };
    }

    it('omits deleted comments without visible descendants', async () => {
      const deleted = {
        ...makeComment('deleted-root', null, 'DELETED'),
        deletedAt,
      };

      commentFindMany.mockResolvedValue([deleted]);

      const result = await service.listForArticle(articleId);

      expect(result).toEqual([]);
    });

    it('keeps deleted parents as anonymized placeholders when replies exist', async () => {
      const deleted = {
        ...makeComment('deleted-root', null, 'DELETED'),
        deletedAt,
      };

      const reply = makeComment('visible-reply', 'deleted-root', 'VISIBLE');

      commentFindMany.mockResolvedValue([reply, deleted]);

      const result = await service.listForArticle(articleId);

      expect(result).toHaveLength(2);

      const placeholder = result.find((comment) => comment.id === 'deleted-root');

      expect(placeholder).toBeDefined();
      expect(placeholder?.status).toBe('DELETED');
      expect(placeholder?.body).toBe('');
      expect(placeholder?.authorId).toBeNull();
      expect(placeholder?.author).toBeNull();
      expect(placeholder?.editedAt).toBeNull();

      expect(result.find((comment) => comment.id === 'visible-reply')).toEqual(reply);
    });

    it('preserves nested reply chains through multiple deleted ancestors', async () => {
      const root = {
        ...makeComment('deleted-root', null, 'DELETED'),
        deletedAt,
      };

      const middle = {
        ...makeComment('deleted-middle', 'deleted-root', 'DELETED'),
        deletedAt,
      };

      const reply = makeComment('visible-reply', 'deleted-middle', 'VISIBLE');

      commentFindMany.mockResolvedValue([reply, middle, root]);

      const result = await service.listForArticle(articleId);

      expect(result.map((comment) => comment.id)).toEqual([
        'visible-reply',
        'deleted-middle',
        'deleted-root',
      ]);

      for (const comment of result.filter((entry) => entry.status === 'DELETED')) {
        expect(comment.body).toBe('');
        expect(comment.authorId).toBeNull();
        expect(comment.author).toBeNull();
      }

      expect(result.find((comment) => comment.id === 'visible-reply')?.body).toBe(
        'Vertraulicher Kommentartext',
      );
    });
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
    ).rejects.toMatchObject({
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
    ).rejects.toMatchObject({
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
    ).rejects.toMatchObject({
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
    ).rejects.toMatchObject({
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
    ).rejects.toMatchObject({
      response: {
        code: 'ARTICLE_NOT_FOUND',
      },
    });

    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('edits an own visible comment and stores the previous body as a revision', async () => {
    commentFindUnique.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      articleId: '11111111-1111-4111-8111-111111111111',
      authorId: '33333333-3333-4333-8333-333333333333',
      body: 'Rapid spielt heute stark.',
      status: 'VISIBLE',
      deletedAt: null,
      article: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    commentRevisionCreate.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
    });

    commentUpdateMany.mockResolvedValue({ count: 1 });
    txCommentFindUniqueOrThrow.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      articleId: '11111111-1111-4111-8111-111111111111',
      authorId: '33333333-3333-4333-8333-333333333333',
      parentId: null,
      body: 'Rapid spielt heute sehr stark.',
      depth: 0,
      status: 'VISIBLE',
      editedAt: new Date('2026-09-06T20:00:00.000Z'),
      createdAt: new Date('2026-09-06T19:00:00.000Z'),
      updatedAt: new Date('2026-09-06T20:00:00.000Z'),
      author: {
        id: '33333333-3333-4333-8333-333333333333',
        nickname: 'BlockWest',
      },
    });

    const result = await service.update({
      articleId: '11111111-1111-4111-8111-111111111111',
      commentId: '22222222-2222-4222-8222-222222222222',
      authorId: '33333333-3333-4333-8333-333333333333',
      body: 'Rapid spielt heute sehr stark.',
      userStatus: 'ACTIVE',
    });

    expect(commentRevisionCreate).toHaveBeenCalledWith({
      data: {
        commentId: '22222222-2222-4222-8222-222222222222',
        body: 'Rapid spielt heute stark.',
      },
    });

    expect(commentUpdateMany).toHaveBeenCalledTimes(1);

    const updateCalls = commentUpdateMany.mock.calls as Array<
      [
        {
          where: {
            id: string;
            articleId: string;
            authorId: string;
            body: string;
            status: string;
            deletedAt: null;
            article: { status: string; deletedAt: null };
          };
          data: { body: string; editedAt: Date };
        },
      ]
    >;

    const updateArgument = updateCalls[0]?.[0];
    expect(updateArgument?.where).toEqual({
      id: '22222222-2222-4222-8222-222222222222',
      articleId: '11111111-1111-4111-8111-111111111111',
      authorId: '33333333-3333-4333-8333-333333333333',
      body: 'Rapid spielt heute stark.',
      status: 'VISIBLE',
      deletedAt: null,
      article: { status: 'PUBLISHED', deletedAt: null },
    });
    expect(updateArgument?.data.body).toBe('Rapid spielt heute sehr stark.');
    expect(updateArgument?.data.editedAt).toBeInstanceOf(Date);
    expect(txCommentFindUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: '22222222-2222-4222-8222-222222222222' },
      select: expect.objectContaining({ id: true, body: true, editedAt: true }),
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(result.body).toBe('Rapid spielt heute sehr stark.');
  });

  it('rejects comment edits from LIMITED users before looking up the comment', async () => {
    await expect(
      service.update({
        articleId: '11111111-1111-4111-8111-111111111111',
        commentId: '22222222-2222-4222-8222-222222222222',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Nicht erlaubt.',
        userStatus: 'LIMITED',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_EDIT_FORBIDDEN',
      },
    });

    expect(commentFindUnique).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects comment edits from BANNED users before looking up the comment', async () => {
    await expect(
      service.update({
        articleId: '11111111-1111-4111-8111-111111111111',
        commentId: '22222222-2222-4222-8222-222222222222',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Nicht erlaubt.',
        userStatus: 'BANNED',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_EDIT_FORBIDDEN',
      },
    });

    expect(commentFindUnique).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects editing a comment from another article', async () => {
    commentFindUnique.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      articleId: '77777777-7777-4777-8777-777777777777',
      authorId: '33333333-3333-4333-8333-333333333333',
      body: 'Kommentar in einem anderen Artikel.',
      status: 'VISIBLE',
      deletedAt: null,
      article: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    await expect(
      service.update({
        articleId: '11111111-1111-4111-8111-111111111111',
        commentId: '22222222-2222-4222-8222-222222222222',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Nicht erlaubt.',
        userStatus: 'ACTIVE',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_NOT_FOUND',
      },
    });

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects editing a hidden comment', async () => {
    commentFindUnique.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      articleId: '11111111-1111-4111-8111-111111111111',
      authorId: '33333333-3333-4333-8333-333333333333',
      body: 'Versteckter Kommentar.',
      status: 'HIDDEN',
      deletedAt: null,
      article: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    await expect(
      service.update({
        articleId: '11111111-1111-4111-8111-111111111111',
        commentId: '22222222-2222-4222-8222-222222222222',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Nicht erlaubt.',
        userStatus: 'ACTIVE',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_NOT_FOUND',
      },
    });

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects editing a comment on an unpublished article', async () => {
    commentFindUnique.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      articleId: '11111111-1111-4111-8111-111111111111',
      authorId: '33333333-3333-4333-8333-333333333333',
      body: 'Kommentar auf Entwurfsartikel.',
      status: 'VISIBLE',
      deletedAt: null,
      article: {
        status: 'DRAFT',
        deletedAt: null,
      },
    });

    await expect(
      service.update({
        articleId: '11111111-1111-4111-8111-111111111111',
        commentId: '22222222-2222-4222-8222-222222222222',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Nicht erlaubt.',
        userStatus: 'ACTIVE',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_NOT_FOUND',
      },
    });

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects editing another users comment', async () => {
    commentFindUnique.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      articleId: '11111111-1111-4111-8111-111111111111',
      authorId: '66666666-6666-4666-8666-666666666666',
      body: 'Kommentar eines anderen Users.',
      status: 'VISIBLE',
      deletedAt: null,
      article: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    await expect(
      service.update({
        articleId: '11111111-1111-4111-8111-111111111111',
        commentId: '22222222-2222-4222-8222-222222222222',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Manipulierter Kommentar.',
        userStatus: 'ACTIVE',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_EDIT_FORBIDDEN',
      },
    });

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects editing a deleted comment', async () => {
    commentFindUnique.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      articleId: '11111111-1111-4111-8111-111111111111',
      authorId: '33333333-3333-4333-8333-333333333333',
      body: 'Gelöschter Kommentar.',
      status: 'DELETED',
      deletedAt: new Date(),
      article: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    await expect(
      service.update({
        articleId: '11111111-1111-4111-8111-111111111111',
        commentId: '22222222-2222-4222-8222-222222222222',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Nicht erlaubt.',
        userStatus: 'ACTIVE',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_NOT_FOUND',
      },
    });

    expect(transaction).not.toHaveBeenCalled();
  });

  it('creates a reply to a visible comment for an ACTIVE user', async () => {
    commentFindUnique.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      articleId: '11111111-1111-4111-8111-111111111111',
      depth: 0,
      status: 'VISIBLE',
      deletedAt: null,
      article: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    commentCreate.mockResolvedValue({
      id: '44444444-4444-4444-8444-444444444444',
      articleId: '11111111-1111-4111-8111-111111111111',
      authorId: '33333333-3333-4333-8333-333333333333',
      parentId: '22222222-2222-4222-8222-222222222222',
      body: 'Das sehe ich genauso.',
      depth: 1,
      status: 'VISIBLE',
    });

    const result = await service.createReply({
      articleId: '11111111-1111-4111-8111-111111111111',
      parentId: '22222222-2222-4222-8222-222222222222',
      authorId: '33333333-3333-4333-8333-333333333333',
      body: 'Das sehe ich genauso.',
      userStatus: 'ACTIVE',
    });

    expect(commentFindUnique).toHaveBeenCalledWith({
      where: {
        id: '22222222-2222-4222-8222-222222222222',
      },
      select: {
        id: true,
        articleId: true,
        depth: true,
        status: true,
        deletedAt: true,
        article: {
          select: {
            status: true,
            deletedAt: true,
          },
        },
      },
    });

    expect(commentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          articleId: '11111111-1111-4111-8111-111111111111',
          authorId: '33333333-3333-4333-8333-333333333333',
          parentId: '22222222-2222-4222-8222-222222222222',
          body: 'Das sehe ich genauso.',
          depth: 1,
          status: 'VISIBLE',
        },
      }),
    );

    expect(result.parentId).toBe('22222222-2222-4222-8222-222222222222');
    expect(result.depth).toBe(1);
  });

  it('rejects replies from LIMITED users before looking up the parent', async () => {
    await expect(
      service.createReply({
        articleId: '11111111-1111-4111-8111-111111111111',
        parentId: '22222222-2222-4222-8222-222222222222',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Nicht erlaubt.',
        userStatus: 'LIMITED',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_REPLY_FORBIDDEN',
      },
    });

    expect(commentFindUnique).not.toHaveBeenCalled();
    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('rejects replies from BANNED users', async () => {
    await expect(
      service.createReply({
        articleId: '11111111-1111-4111-8111-111111111111',
        parentId: '22222222-2222-4222-8222-222222222222',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Nicht erlaubt.',
        userStatus: 'BANNED',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_REPLY_FORBIDDEN',
      },
    });

    expect(commentFindUnique).not.toHaveBeenCalled();
    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('rejects a reply when the parent belongs to another article', async () => {
    commentFindUnique.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      articleId: '55555555-5555-4555-8555-555555555555',
      depth: 0,
      status: 'VISIBLE',
      deletedAt: null,
      article: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    await expect(
      service.createReply({
        articleId: '11111111-1111-4111-8111-111111111111',
        parentId: '22222222-2222-4222-8222-222222222222',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Test',
        userStatus: 'ACTIVE',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_PARENT_NOT_FOUND',
      },
    });

    expect(commentCreate).not.toHaveBeenCalled();
  });

  it('rejects a reply to a deleted parent comment', async () => {
    commentFindUnique.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      articleId: '11111111-1111-4111-8111-111111111111',
      depth: 0,
      status: 'DELETED',
      deletedAt: new Date(),
      article: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    await expect(
      service.createReply({
        articleId: '11111111-1111-4111-8111-111111111111',
        parentId: '22222222-2222-4222-8222-222222222222',
        authorId: '33333333-3333-4333-8333-333333333333',
        body: 'Test',
        userStatus: 'ACTIVE',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'COMMENT_PARENT_NOT_FOUND',
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
