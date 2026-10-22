import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'HATE_OR_ABUSE'
  | 'THREAT_OR_VIOLENCE'
  | 'PRIVACY'
  | 'IMPERSONATION'
  | 'ILLEGAL_CONTENT'
  | 'OFF_TOPIC'
  | 'MISINFORMATION'
  | 'OTHER';

export interface CreateCommentReportCommand {
  commentId: string;
  reporterId: string;
  userStatus: 'ACTIVE' | 'LIMITED' | 'BANNED';
  reason: ReportReason;
  details?: string;
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

@Injectable()
export class ReportsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async createCommentReport(command: CreateCommentReportCommand) {
    if (command.userStatus !== 'ACTIVE' && command.userStatus !== 'LIMITED') {
      throw new ForbiddenException({
        code: 'REPORT_FORBIDDEN',
        message: 'Mit diesem Accountstatus sind Meldungen nicht erlaubt.',
      });
    }

    const comment = await this.database.comment.findUnique({
      where: {
        id: command.commentId,
      },
      select: {
        id: true,
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

    try {
      return await this.database.moderationReport.create({
        data: {
          reporterId: command.reporterId,
          targetType: 'COMMENT',
          commentId: command.commentId,
          reason: command.reason,
          details: command.details ?? null,
          status: 'OPEN',
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: 'COMMENT_ALREADY_REPORTED',
          message: 'Du hast diesen Kommentar bereits gemeldet.',
        });
      }

      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
