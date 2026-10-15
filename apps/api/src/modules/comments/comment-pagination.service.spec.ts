const commentFindMany = jest.fn();
const queryRaw = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    $queryRaw: queryRaw,
    comment: {
      findMany: commentFindMany,
    },
  }),
}));

import type { CommentSpamProtectionService } from './comment-spam-protection.service';
import { CommentsService } from './comments.service';
import { COMMENT_PAGE_SIZE, parseCommentPageCursor } from './comment-pagination';

describe('Comment database pagination', () => {
  const articleId = '11111111-1111-4111-8111-111111111111';

  let service: CommentsService;

  function makeComment(
    index: number,
    parentId: string | null = null,
    status: 'VISIBLE' | 'DELETED' = 'VISIBLE',
  ) {
    const id = `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

    const createdAt = new Date(Date.UTC(2026, 9, 14, 12, 0, index));

    return {
      id,
      articleId,
      authorId: '33333333-3333-4333-8333-333333333333',
      parentId,
      body: `Kommentar ${index}`,
      depth: parentId ? 1 : 0,
      status,
      editedAt: null,
      createdAt,
      updatedAt: createdAt,
      author: {
        id: '33333333-3333-4333-8333-333333333333',
        nickname: 'Testuser',
      },
    };
  }

  beforeEach(() => {
    commentFindMany.mockReset();
    queryRaw.mockReset();
    service = new CommentsService({
      reserve: jest.fn().mockResolvedValue({
        keys: ['rate', 'cooldown', 'duplicate'],
        token: 'unit-test',
      }),
      release: jest.fn().mockResolvedValue(undefined),
      validateLinks: jest.fn(),
    } as unknown as CommentSpamProtectionService);
  });

  it('returns an empty page when no comments exist', async () => {
    commentFindMany.mockResolvedValue([]);

    const result = await service.listPageForArticle(articleId, 'newest', null);

    expect(result).toEqual({
      items: [],
      pagination: {
        nextCursor: null,
        hasNextPage: false,
      },
    });

    expect(commentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: COMMENT_PAGE_SIZE + 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
    );
  });

  it('loads two pages without duplicate roots', async () => {
    const roots = Array.from({ length: 21 }, (_, index) => makeComment(40 - index));

    commentFindMany.mockImplementation(
      (query: {
        where: {
          parentId: null | { in: string[] };
          AND?: unknown;
        };
      }) => {
        if (query.where.parentId !== null) {
          return [];
        }

        if (query.where.AND) {
          return roots.slice(20);
        }

        return roots;
      },
    );

    const first = await service.listPageForArticle(articleId, 'newest', null);

    expect(first.items).toHaveLength(20);
    expect(first.pagination.hasNextPage).toBe(true);
    expect(first.pagination.nextCursor).not.toBeNull();

    expect(first.items.map((item) => item.id)).toEqual(roots.slice(0, 20).map((item) => item.id));

    const cursor = parseCommentPageCursor(first.pagination.nextCursor, 'newest');

    expect(cursor?.id).toBe(roots[19].id);

    const second = await service.listPageForArticle(articleId, 'newest', cursor);

    expect(second.items.map((item) => item.id)).toEqual([roots[20].id]);

    expect(second.pagination.hasNextPage).toBe(false);
    expect(second.pagination.nextCursor).toBeNull();

    const allIds = [...first.items.map((item) => item.id), ...second.items.map((item) => item.id)];

    expect(new Set(allIds).size).toBe(21);
  });

  it('uses ascending database order for oldest', async () => {
    commentFindMany.mockResolvedValue([]);

    await service.listPageForArticle(articleId, 'oldest', null);

    expect(commentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('includes nested replies and anonymizes deleted ancestors', async () => {
    const root = makeComment(1, null, 'DELETED');
    const middle = makeComment(2, root.id, 'DELETED');
    const reply = makeComment(3, middle.id);

    commentFindMany.mockImplementation(
      (query: {
        where: {
          parentId: null | { in: string[] };
        };
      }) => {
        const parentId = query.where.parentId;

        if (parentId === null) {
          return [root];
        }

        if (parentId.in.includes(root.id)) {
          return [middle];
        }

        if (parentId.in.includes(middle.id)) {
          return [reply];
        }

        return [];
      },
    );

    const result = await service.listPageForArticle(articleId, 'newest', null);

    expect(result.items).toHaveLength(3);

    const deletedComments = result.items.filter((comment) => comment.status === 'DELETED');

    expect(deletedComments).toHaveLength(2);

    for (const comment of deletedComments) {
      expect(comment.body).toBe('');
      expect(comment.authorId).toBeNull();
      expect(comment.author).toBeNull();
      expect(comment.editedAt).toBeNull();
    }

    expect(result.items.find((item) => item.id === reply.id)?.body).toBe(reply.body);

    expect(result.pagination.hasNextPage).toBe(false);
  });

  it('omits deleted discussions without visible descendants', async () => {
    const deletedRoot = makeComment(1, null, 'DELETED');

    commentFindMany.mockImplementation(
      (query: {
        where: {
          parentId: null | { in: string[] };
        };
      }) => {
        if (query.where.parentId === null) {
          return [deletedRoot];
        }

        return [];
      },
    );

    const result = await service.listPageForArticle(articleId, 'newest', null);

    expect(result.items).toEqual([]);
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.nextCursor).toBeNull();
  });
});
