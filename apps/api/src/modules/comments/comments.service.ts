import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

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

@Injectable()
export class CommentsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

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

    return this.database.comment.create({
      data: {
        articleId: command.articleId,
        authorId: command.authorId,
        body: command.body,
        depth: 0,
        status: 'VISIBLE',
      },
      select: createdCommentSelect,
    });
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

    return this.database.comment.create({
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
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
