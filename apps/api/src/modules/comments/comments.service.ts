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
    return this.database.comment.findMany({
      where: {
        articleId,
        status: 'VISIBLE',
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: createdCommentSelect,
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
