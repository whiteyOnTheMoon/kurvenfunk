import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

import { CommentSpamProtectionService } from './comment-spam-protection.service';

import {
  COMMENT_PAGE_SIZE,
  encodeCommentPageCursor,
  type CommentPageCursor,
  type CommentPageSort,
} from './comment-pagination';

export type CommentCreateUserStatus = 'ACTIVE' | 'LIMITED' | 'BANNED';

export interface CreateCommentCommand {
  articleId: string;
  authorId: string;
  body: string;
  userStatus: CommentCreateUserStatus;
}

export interface CreateCommentReplyCommand extends CreateCommentCommand {
  parentId: string;
}

export interface UpdateCommentCommand extends CreateCommentCommand {
  commentId: string;
}

export interface RemoveCommentCommand {
  articleId: string;
  commentId: string;
  authorId: string;
  userStatus: CommentCreateUserStatus;
}

const createdCommentSelect = {
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
} as const;

export interface PaginatedComment {
  id: string;
  articleId: string;
  authorId: string | null;
  parentId: string | null;
  body: string;
  depth: number;
  status: string;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    nickname: string | null;
  } | null;
}

@Injectable()
export class CommentsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  constructor(private readonly spamProtection: CommentSpamProtectionService) {}

  async listForArticle(articleId: string) {
    const comments = await this.database.comment.findMany({
      where: {
        articleId,
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
      select: createdCommentSelect,
    });

    // Only visible comments and their deleted ancestors are needed.
    // Deleted comments without visible descendants are omitted.
    const commentsById = new Map(comments.map((comment) => [comment.id, comment]));

    const includedIds = new Set<string>();

    for (const comment of comments) {
      if (comment.status !== 'VISIBLE') {
        continue;
      }

      includedIds.add(comment.id);

      const visited = new Set<string>();
      let parentId = comment.parentId;

      while (parentId && !visited.has(parentId)) {
        visited.add(parentId);

        const parent = commentsById.get(parentId);

        if (!parent) {
          break;
        }

        includedIds.add(parent.id);
        parentId = parent.parentId;
      }
    }

    return comments
      .filter((comment) => includedIds.has(comment.id))
      .map((comment) => {
        if (comment.status !== 'DELETED') {
          return comment;
        }

        // Never expose deleted content or author information.
        return {
          ...comment,
          authorId: null,
          author: null,
          body: '',
          editedAt: null,
        };
      });
  }

  async listPageForArticle(
    articleId: string,
    sort: CommentPageSort,
    cursor: CommentPageCursor | null,
  ) {
    const eligibleStatus = [
      {
        status: 'VISIBLE' as const,
        deletedAt: null,
      },
      {
        status: 'DELETED' as const,
        deletedAt: {
          not: null,
        },
      },
    ];

    const groups: Array<{
      root: PaginatedComment;
      comments: PaginatedComment[];
    }> = [];

    const popularityScores = new Map<string, number>();

    let searchAfter = cursor;
    let moreCandidates = true;

    // Scan root comments in bounded batches. Deleted roots without
    // visible descendants do not consume a displayed page slot.
    while (groups.length <= COMMENT_PAGE_SIZE && moreCandidates) {
      let rootCandidates: PaginatedComment[];
      let batchCount = 0;
      let batchLastCursor: CommentPageCursor | null = null;

      if (sort === 'popular') {
        // Rank roots in PostgreSQL before applying pagination.
        // All user-controlled values are bound parameters.
        const rankedRoots = await this.database.$queryRaw<
          Array<{
            id: string;
            createdAt: Date;
            score: number;
          }>
        >`
          WITH params AS (
            SELECT
              ${articleId}::uuid AS article_id,
              ${searchAfter?.score ?? null}::integer AS cursor_score,
              ${
                searchAfter ? new Date(searchAfter.createdAt) : null
              }::timestamptz AS cursor_created_at,
              ${searchAfter?.id ?? null}::uuid AS cursor_id
          ),
          ranked_roots AS (
            SELECT
              c.id,
              c."createdAt",
              COALESCE(
                SUM(
                  CASE
                    WHEN r.type = 'UPVOTE' THEN 1
                    WHEN r.type = 'DOWNVOTE' THEN -1
                    ELSE 0
                  END
                ),
                0
              )::integer AS score
            FROM "Comment" c
            CROSS JOIN params p
            LEFT JOIN "Reaction" r
              ON r."commentId" = c.id
            WHERE
              c."articleId" = p.article_id
              AND c."parentId" IS NULL
              AND (
                (
                  c.status = 'VISIBLE'
                  AND c."deletedAt" IS NULL
                )
                OR (
                  c.status = 'DELETED'
                  AND c."deletedAt" IS NOT NULL
                )
              )
            GROUP BY c.id
          )
          SELECT
            r.id,
            r."createdAt",
            r.score
          FROM ranked_roots r
          CROSS JOIN params p
          WHERE
            p.cursor_score IS NULL
            OR r.score < p.cursor_score
            OR (
              r.score = p.cursor_score
              AND (
                r."createdAt" < p.cursor_created_at
                OR (
                  r."createdAt" = p.cursor_created_at
                  AND r.id > p.cursor_id
                )
              )
            )
          ORDER BY
            r.score DESC,
            r."createdAt" DESC,
            r.id ASC
          LIMIT ${COMMENT_PAGE_SIZE + 1}
        `;

        batchCount = rankedRoots.length;

        const lastRanked = rankedRoots.at(-1);

        if (lastRanked) {
          batchLastCursor = {
            version: 1,
            sort,
            id: lastRanked.id,
            createdAt: lastRanked.createdAt.toISOString(),
            score: lastRanked.score,
          };
        }

        const matchingRoots =
          rankedRoots.length > 0
            ? await this.database.comment.findMany({
                where: {
                  articleId,
                  parentId: null,
                  id: {
                    in: rankedRoots.map((root) => root.id),
                  },
                  OR: eligibleStatus,
                },
                select: createdCommentSelect,
              })
            : [];

        const rootsById = new Map(matchingRoots.map((root) => [root.id, root]));

        rootCandidates = rankedRoots.flatMap((ranked) => {
          const root = rootsById.get(ranked.id);

          if (!root) {
            return [];
          }

          popularityScores.set(root.id, ranked.score);

          return [root];
        });
      } else {
        const cursorFilter = searchAfter
          ? {
              AND: [
                {
                  OR: [
                    sort === 'newest'
                      ? {
                          createdAt: {
                            lt: new Date(searchAfter.createdAt),
                          },
                        }
                      : {
                          createdAt: {
                            gt: new Date(searchAfter.createdAt),
                          },
                        },
                    {
                      createdAt: new Date(searchAfter.createdAt),
                      id: {
                        gt: searchAfter.id,
                      },
                    },
                  ],
                },
              ],
            }
          : {};

        rootCandidates = await this.database.comment.findMany({
          where: {
            articleId,
            parentId: null,
            OR: eligibleStatus,
            ...cursorFilter,
          },
          orderBy: [
            {
              createdAt: sort === 'newest' ? 'desc' : 'asc',
            },
            {
              id: 'asc',
            },
          ],
          take: COMMENT_PAGE_SIZE + 1,
          select: createdCommentSelect,
        });

        batchCount = rootCandidates.length;

        const lastRoot = rootCandidates.at(-1);

        if (lastRoot) {
          batchLastCursor = {
            version: 1,
            sort,
            id: lastRoot.id,
            createdAt: lastRoot.createdAt.toISOString(),
          };
        }
      }

      if (rootCandidates.length === 0) {
        if (batchCount === COMMENT_PAGE_SIZE + 1 && batchLastCursor) {
          searchAfter = batchLastCursor;
          continue;
        }

        break;
      }

      const childrenByParent = new Map<string, PaginatedComment[]>();

      const seen = new Set(rootCandidates.map((comment) => comment.id));

      let frontier = rootCandidates.map((comment) => comment.id);

      // Fetch descendants one tree level at a time.
      // This avoids loading unrelated article discussions.
      while (frontier.length > 0) {
        const descendants = await this.database.comment.findMany({
          where: {
            articleId,
            parentId: {
              in: frontier,
            },
            OR: eligibleStatus,
          },
          select: createdCommentSelect,
        });

        const nextFrontier: string[] = [];

        for (const comment of descendants) {
          if (seen.has(comment.id) || !comment.parentId) {
            continue;
          }

          seen.add(comment.id);

          const siblings = childrenByParent.get(comment.parentId) ?? [];

          siblings.push(comment);

          childrenByParent.set(comment.parentId, siblings);

          nextFrontier.push(comment.id);
        }

        frontier = nextFrontier;
      }

      for (const root of rootCandidates) {
        const branch: PaginatedComment[] = [root];
        const stack = [root.id];

        while (stack.length > 0) {
          const parentId = stack.pop()!;

          for (const child of childrenByParent.get(parentId) ?? []) {
            branch.push(child);
            stack.push(child.id);
          }
        }

        const branchById = new Map(branch.map((comment) => [comment.id, comment]));

        const includedIds = new Set<string>();

        for (const comment of branch) {
          if (comment.status !== 'VISIBLE') {
            continue;
          }

          let ancestor: PaginatedComment | undefined = comment;

          while (ancestor && !includedIds.has(ancestor.id)) {
            includedIds.add(ancestor.id);

            ancestor = ancestor.parentId ? branchById.get(ancestor.parentId) : undefined;
          }
        }

        // Entirely deleted branches are excluded.
        if (!includedIds.has(root.id)) {
          continue;
        }

        const includedComments = branch
          .filter((comment) => includedIds.has(comment.id))
          .map((comment) => {
            if (comment.status !== 'DELETED') {
              return comment;
            }

            return {
              ...comment,
              authorId: null,
              author: null,
              body: '',
              editedAt: null,
            };
          });

        groups.push({
          root,
          comments: includedComments,
        });
      }

      searchAfter = batchLastCursor;
      moreCandidates = batchCount === COMMENT_PAGE_SIZE + 1;
    }

    const hasNextPage = groups.length > COMMENT_PAGE_SIZE;

    const selectedGroups = groups.slice(0, COMMENT_PAGE_SIZE);

    const lastRoot = selectedGroups.at(-1)?.root;

    const nextCursor =
      hasNextPage && lastRoot
        ? encodeCommentPageCursor({
            version: 1,
            sort,
            id: lastRoot.id,
            createdAt: lastRoot.createdAt.toISOString(),
            ...(sort === 'popular' ? { score: popularityScores.get(lastRoot.id) ?? 0 } : {}),
          })
        : null;

    return {
      items: selectedGroups.flatMap((group) => group.comments),
      pagination: {
        nextCursor,
        hasNextPage,
      },
    };
  }

  async create(command: CreateCommentCommand) {
    if (command.userStatus !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'COMMENT_CREATE_FORBIDDEN',
        message: 'Kommentare können mit diesem Accountstatus nicht erstellt werden.',
      });
    }

    const article = await this.database.article.findUnique({
      where: {
        id: command.articleId,
      },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!article || article.deletedAt !== null || article.status !== 'PUBLISHED') {
      throw new NotFoundException({
        code: 'ARTICLE_NOT_FOUND',
        message: 'Artikel wurde nicht gefunden.',
      });
    }

    const reservation = await this.spamProtection.reserve(command.authorId, command.body);

    try {
      return await this.database.comment.create({
        data: {
          articleId: command.articleId,
          authorId: command.authorId,
          body: command.body,
          depth: 0,
          status: 'VISIBLE',
        },
        select: createdCommentSelect,
      });
    } catch (error) {
      try {
        await this.spamProtection.release(reservation);
      } catch {
        // Preserve the original database error.
      }
      throw error;
    }
  }

  async update(command: UpdateCommentCommand) {
    if (command.userStatus !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'COMMENT_EDIT_FORBIDDEN',
        message: 'Kommentare können mit diesem Accountstatus nicht bearbeitet werden.',
      });
    }

    const comment = await this.database.comment.findUnique({
      where: {
        id: command.commentId,
      },
      select: {
        id: true,
        articleId: true,
        authorId: true,
        body: true,
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

    if (
      !comment ||
      comment.articleId !== command.articleId ||
      comment.status !== 'VISIBLE' ||
      comment.deletedAt !== null ||
      comment.article.status !== 'PUBLISHED' ||
      comment.article.deletedAt !== null
    ) {
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: 'Kommentar wurde nicht gefunden.',
      });
    }

    if (comment.authorId !== command.authorId) {
      throw new ForbiddenException({
        code: 'COMMENT_EDIT_FORBIDDEN',
        message: 'Du kannst nur deine eigenen Kommentare bearbeiten.',
      });
    }

    this.spamProtection.validateLinks(command.body);

    return this.database.$transaction(async (transaction) => {
      await transaction.commentRevision.create({
        data: {
          commentId: comment.id,
          body: comment.body,
        },
      });

      return transaction.comment.update({
        where: {
          id: comment.id,
        },
        data: {
          body: command.body,
          editedAt: new Date(),
        },
        select: createdCommentSelect,
      });
    });
  }

  async remove(command: RemoveCommentCommand) {
    if (command.userStatus === 'BANNED') {
      throw new ForbiddenException({
        code: 'COMMENT_DELETE_FORBIDDEN',
        message: 'Kommentare können mit diesem Accountstatus nicht gelöscht werden.',
      });
    }

    const comment = await this.database.comment.findUnique({
      where: {
        id: command.commentId,
      },
      select: {
        id: true,
        articleId: true,
        authorId: true,
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

    if (
      !comment ||
      comment.articleId !== command.articleId ||
      comment.status !== 'VISIBLE' ||
      comment.deletedAt !== null ||
      comment.article.status !== 'PUBLISHED' ||
      comment.article.deletedAt !== null
    ) {
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: 'Kommentar wurde nicht gefunden.',
      });
    }

    if (comment.authorId !== command.authorId) {
      throw new ForbiddenException({
        code: 'COMMENT_DELETE_FORBIDDEN',
        message: 'Du kannst nur deine eigenen Kommentare löschen.',
      });
    }

    const result = await this.database.comment.updateMany({
      where: {
        id: comment.id,
        articleId: command.articleId,
        authorId: command.authorId,
        status: 'VISIBLE',
        deletedAt: null,
      },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    if (result.count !== 1) {
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: 'Kommentar wurde nicht gefunden.',
      });
    }

    return {
      id: comment.id,
      deleted: true,
    };
  }

  async createReply(command: CreateCommentReplyCommand) {
    if (command.userStatus !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'COMMENT_REPLY_FORBIDDEN',
        message: 'Antworten können mit diesem Accountstatus nicht erstellt werden.',
      });
    }

    const parent = await this.database.comment.findUnique({
      where: {
        id: command.parentId,
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

    if (
      !parent ||
      parent.articleId !== command.articleId ||
      parent.status !== 'VISIBLE' ||
      parent.deletedAt !== null ||
      parent.article.status !== 'PUBLISHED' ||
      parent.article.deletedAt !== null
    ) {
      throw new NotFoundException({
        code: 'COMMENT_PARENT_NOT_FOUND',
        message: 'Kommentar wurde nicht gefunden.',
      });
    }

    const reservation = await this.spamProtection.reserve(command.authorId, command.body);

    try {
      return await this.database.comment.create({
        data: {
          articleId: command.articleId,
          authorId: command.authorId,
          parentId: parent.id,
          body: command.body,
          depth: parent.depth + 1,
          status: 'VISIBLE',
        },
        select: createdCommentSelect,
      });
    } catch (error) {
      try {
        await this.spamProtection.release(reservation);
      } catch {
        // Preserve the original database error.
      }
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
