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
        parentId: null,
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

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
