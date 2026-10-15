const commentFindMany = jest.fn();
const queryRaw = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    comment: {
      findMany: commentFindMany,
    },
    $queryRaw: queryRaw,
  }),
}));

import { CommentsService } from './comments.service';
import { parseCommentPageCursor } from './comment-pagination';

describe('Popular comment pagination', () => {
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

  type TestComment = ReturnType<typeof makeComment>;

  function mockCommentLookup(roots: TestComment[], children: TestComment[] = []) {
    commentFindMany.mockImplementation(
      async (query: {
        where: {
          id?: { in: string[] };
          parentId?: null | { in: string[] };
        };
      }) => {
        const { id, parentId } = query.where;

        if (id?.in) {
          // Deliberately return a different database order.
          // The service must restore popularity ranking.
          return roots.filter((root) => id.in.includes(root.id)).reverse();
        }

        if (parentId && 'in' in parentId) {
          return children.filter(
            (child) => child.parentId !== null && parentId.in.includes(child.parentId),
          );
        }

        throw new Error('Unexpected comment query');
      },
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommentsService();
  });

  it('returns an empty page without matching comments', async () => {
    queryRaw.mockResolvedValue([]);

    const result = await service.listPageForArticle(articleId, 'popular', null);

    expect(result).toEqual({
      items: [],
      pagination: {
        nextCursor: null,
        hasNextPage: false,
      },
    });
  });

  it('uses database popularity ranking including negative scores', async () => {
    const roots = [makeComment(3), makeComment(2), makeComment(1)];

    const scores = [9, 0, -4];

    const ranked = roots.map((root, index) => ({
      id: root.id,
      createdAt: root.createdAt,
      score: scores[index],
    }));

    queryRaw.mockResolvedValue(ranked);
    mockCommentLookup(roots);

    const result = await service.listPageForArticle(articleId, 'popular', null);

    expect(result.items.map((comment) => comment.id)).toEqual(roots.map((root) => root.id));

    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.nextCursor).toBeNull();

    const sqlParts = queryRaw.mock.calls[0]?.[0] as readonly string[] | undefined;

    expect(sqlParts).toBeDefined();

    const sql = sqlParts!.join(' ');

    expect(sql).toContain('UPVOTE');
    expect(sql).toContain('DOWNVOTE');
    expect(sql).toContain('r.score DESC');
    expect(sql).toContain('r."createdAt" DESC');
    expect(sql).toContain('r.id ASC');

    // Article ID must be passed as a bound parameter.
    expect(queryRaw.mock.calls[0]?.slice(1)).toContain(articleId);
  });

  it('loads multiple popular pages without duplicate roots', async () => {
    const roots = Array.from({ length: 21 }, (_, index) => makeComment(40 - index));

    const ranked = roots.map((root, index) => ({
      id: root.id,
      createdAt: root.createdAt,
      score: 100 - index,
    }));

    queryRaw.mockResolvedValueOnce(ranked).mockResolvedValueOnce([ranked[20]]);

    mockCommentLookup(roots);

    const first = await service.listPageForArticle(articleId, 'popular', null);

    expect(first.items).toHaveLength(20);
    expect(first.pagination.hasNextPage).toBe(true);
    expect(first.pagination.nextCursor).not.toBeNull();

    expect(first.items.map((comment) => comment.id)).toEqual(
      roots.slice(0, 20).map((root) => root.id),
    );

    const cursor = parseCommentPageCursor(first.pagination.nextCursor, 'popular');

    expect(cursor).not.toBeNull();
    expect(cursor?.id).toBe(roots[19]!.id);
    expect(cursor?.score).toBe(81);

    const second = await service.listPageForArticle(articleId, 'popular', cursor);

    expect(second.items.map((comment) => comment.id)).toEqual([roots[20]!.id]);

    expect(second.pagination.hasNextPage).toBe(false);
    expect(second.pagination.nextCursor).toBeNull();

    const allIds = [
      ...first.items.map((comment) => comment.id),
      ...second.items.map((comment) => comment.id),
    ];

    expect(new Set(allIds).size).toBe(21);

    // The second database query must receive the cursor score.
    expect(queryRaw.mock.calls[1]?.slice(1)).toContain(81);
    expect(queryRaw.mock.calls[1]?.slice(1)).toContain(roots[19]!.id);
  });

  it('anonymizes deleted parents with visible replies', async () => {
    const root = makeComment(1, null, 'DELETED');
    const reply = makeComment(2, root.id);

    queryRaw.mockResolvedValue([
      {
        id: root.id,
        createdAt: root.createdAt,
        score: 0,
      },
    ]);

    mockCommentLookup([root], [reply]);

    const result = await service.listPageForArticle(articleId, 'popular', null);

    expect(result.items).toHaveLength(2);

    const deleted = result.items.find((comment) => comment.id === root.id);

    expect(deleted?.status).toBe('DELETED');
    expect(deleted?.body).toBe('');
    expect(deleted?.authorId).toBeNull();
    expect(deleted?.author).toBeNull();

    expect(result.items.find((comment) => comment.id === reply.id)?.body).toBe(reply.body);
  });

  it('skips deleted roots without visible descendants', async () => {
    const deletedRoots = Array.from({ length: 21 }, (_, index) =>
      makeComment(index + 1, null, 'DELETED'),
    );

    const visibleRoot = makeComment(40);

    const firstBatch = deletedRoots.map((root) => ({
      id: root.id,
      createdAt: root.createdAt,
      score: 10,
    }));

    queryRaw.mockResolvedValueOnce(firstBatch).mockResolvedValueOnce([
      {
        id: visibleRoot.id,
        createdAt: visibleRoot.createdAt,
        score: 0,
      },
    ]);

    mockCommentLookup([...deletedRoots, visibleRoot]);

    const result = await service.listPageForArticle(articleId, 'popular', null);

    expect(result.items.map((comment) => comment.id)).toEqual([visibleRoot.id]);

    expect(result.pagination.hasNextPage).toBe(false);
    expect(queryRaw).toHaveBeenCalledTimes(2);
  });
});
