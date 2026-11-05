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

export type CommentReportResolution =
  | 'ACTION_TAKEN'
  | 'NO_VIOLATION'
  | 'INSUFFICIENT_EVIDENCE'
  | 'ALREADY_HANDLED'
  | 'DUPLICATE'
  | 'INVALID_REPORT'
  | 'OTHER';

export interface ResolveCommentReportCommand {
  reportId: string;
  moderatorId: string;
  resolution: CommentReportResolution;
  moderatorNote: string;
}

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

    if (comment.authorId === command.reporterId) {
      throw new ForbiddenException({
        code: 'SELF_REPORT_FORBIDDEN',
        message: 'Eigene Kommentare können nicht gemeldet werden.',
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

  async listPendingCommentReports() {
    return this.database.moderationReport.findMany({
      where: {
        targetType: 'COMMENT',
        status: { in: ['OPEN', 'IN_REVIEW'] },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 100,
      select: {
        id: true,
        status: true,
        reason: true,
        details: true,
        createdAt: true,
        commentId: true,
        comment: {
          select: {
            id: true,
            body: true,
            status: true,
            deletedAt: true,
            author: { select: { nickname: true } },
            article: { select: { title: true, slug: true } },
          },
        },
      },
    });
  }

  async resolveCommentReport(command: ResolveCommentReportCommand) {
    return this.database.$transaction(async (tx) => {
      const report = await tx.moderationReport.findUnique({
        where: { id: command.reportId },
        select: { id: true, targetType: true, status: true, commentId: true },
      });

      if (!report || report.targetType !== 'COMMENT') {
        throw new NotFoundException({
          code: 'COMMENT_REPORT_NOT_FOUND',
          message: 'Kommentarmeldung wurde nicht gefunden.',
        });
      }

      if (report.status !== 'OPEN' && report.status !== 'IN_REVIEW') {
        throw new ConflictException({
          code: 'COMMENT_REPORT_ALREADY_RESOLVED',
          message: 'Diese Meldung wurde bereits abgeschlossen.',
        });
      }

      if (command.resolution === 'ACTION_TAKEN') {
        const comment = report.commentId
          ? await tx.comment.findUnique({
              where: { id: report.commentId },
              select: { status: true, deletedAt: true },
            })
          : null;

        if (comment && comment.status === 'VISIBLE' && comment.deletedAt === null) {
          throw new ConflictException({
            code: 'COMMENT_REPORT_ACTION_MISSING',
            message: 'Vor dem Abschluss muss der gemeldete Kommentar moderiert werden.',
          });
        }
      }

      const actionTaken = command.resolution === 'ACTION_TAKEN';
      const nextStatus = actionTaken ? 'RESOLVED' : 'DISMISSED';

      // Atomic claim: two moderators cannot close the same report twice.
      const updated = await tx.moderationReport.updateMany({
        where: {
          id: command.reportId,
          targetType: 'COMMENT',
          status: { in: ['OPEN', 'IN_REVIEW'] },
        },
        data: {
          status: nextStatus,
          resolution: command.resolution,
          moderatorNote: command.moderatorNote,
          assignedModeratorId: command.moderatorId,
          assignedAt: new Date(),
          resolvedAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException({
          code: 'COMMENT_REPORT_ALREADY_RESOLVED',
          message: 'Diese Meldung wurde bereits abgeschlossen.',
        });
      }

      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorUserId: command.moderatorId,
          action: actionTaken ? 'MODERATION_REPORT_RESOLVED' : 'MODERATION_REPORT_DISMISSED',
          category: 'MODERATION',
          targetType: 'MODERATION_REPORT',
          targetId: command.reportId,
          moderationReportId: command.reportId,
          reason: command.moderatorNote,
          metadata: {
            resolution: command.resolution,
            commentId: report.commentId,
          },
        },
      });

      return tx.moderationReport.findUniqueOrThrow({
        where: { id: command.reportId },
        select: {
          id: true,
          status: true,
          resolution: true,
          assignedModeratorId: true,
          resolvedAt: true,
        },
      });
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
