import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

import type { CommentReportResolution, ReportReason } from './reports.service';

export interface CreateForumPostReportCommand {
  forumSlug: string;
  threadSlug: string;
  postId: string;
  reporterId: string;
  userStatus: 'ACTIVE' | 'LIMITED' | 'BANNED';
  reason: ReportReason;
  details?: string;
}

export interface ResolveForumPostReportCommand {
  reportId: string;
  moderatorId: string;
  resolution: CommentReportResolution;
  moderatorNote: string;
}

export interface RemoveForumPostCommand {
  postId: string;
  moderatorId: string;
  reason: string;
}

function missingPost(): NotFoundException {
  return new NotFoundException({
    code: 'FORUM_POST_NOT_FOUND',
    message: 'Dieser Forenbeitrag ist nicht verfügbar.',
  });
}

/**
 * Phase 22.222: forum reports use the existing moderation report table, audit
 * stream and dashboard. No competing report store or DEV demo records.
 */
@Injectable()
export class ForumPostReportsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async createReport(command: CreateForumPostReportCommand) {
    if (command.userStatus === 'BANNED') {
      throw new ForbiddenException({
        code: 'REPORT_FORBIDDEN',
        message: 'Mit diesem Accountstatus sind Meldungen nicht erlaubt.',
      });
    }

    return this.database.$transaction(async (tx) => {
      // There is no unique (reporterId, postId) schema constraint. Serialize
      // competing submissions of exactly this pair within PostgreSQL before
      // the duplicate check. No migration or global locking is required.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`forum-post-report:${command.reporterId}:${command.postId}`}, 0))`;

      const post = await tx.post.findFirst({
        where: {
          id: command.postId,
          deletedAt: null,
          thread: {
            is: {
              slug: command.threadSlug,
              status: { in: ['OPEN', 'LOCKED'] },
              mergedIntoThreadId: null,
              forum: {
                is: {
                  slug: command.forumSlug,
                  active: true,
                  category: { is: { active: true } },
                  OR: [{ clubId: null }, { club: { is: { active: true } } }],
                },
              },
            },
          },
        },
        select: { id: true, authorId: true },
      });
      if (!post) throw missingPost();
      if (post.authorId === command.reporterId) {
        throw new ForbiddenException({
          code: 'SELF_REPORT_FORBIDDEN',
          message: 'Eigene Beiträge können nicht gemeldet werden.',
        });
      }

      const previous = await tx.moderationReport.findFirst({
        where: { reporterId: command.reporterId, postId: post.id, targetType: 'FORUM_POST' },
        select: { id: true },
      });
      if (previous) {
        throw new ConflictException({
          code: 'FORUM_POST_ALREADY_REPORTED',
          message: 'Du hast diesen Beitrag bereits gemeldet.',
        });
      }

      return tx.moderationReport.create({
        data: {
          reporterId: command.reporterId,
          targetType: 'FORUM_POST',
          postId: post.id,
          reportedUserId: post.authorId,
          reason: command.reason,
          details: command.details ?? null,
          status: 'OPEN',
        },
        select: { id: true, status: true, createdAt: true },
      });
    });
  }

  async listPendingReports() {
    const reports = await this.database.moderationReport.findMany({
      where: { targetType: 'FORUM_POST', status: { in: ['OPEN', 'IN_REVIEW'] } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 100,
      select: {
        id: true,
        status: true,
        reason: true,
        details: true,
        createdAt: true,
        postId: true,
        post: {
          select: {
            id: true,
            content: true,
            deletedAt: true,
            author: { select: { nickname: true } },
            thread: {
              select: {
                title: true,
                slug: true,
                forum: { select: { slug: true, club: { select: { slug: true } } } },
              },
            },
          },
        },
      },
    });

    // Do not resurrect removed text or author identity even in queue output.
    return reports.map((report) => ({
      ...report,
      post: report.post
        ? {
            ...report.post,
            content: report.post.deletedAt ? null : report.post.content,
            author: report.post.deletedAt ? null : report.post.author,
            deleted: report.post.deletedAt !== null,
            deletedAt: undefined,
          }
        : null,
    }));
  }

  async removePost(command: RemoveForumPostCommand) {
    return this.database.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: command.postId },
        select: { id: true, threadId: true, deletedAt: true },
      });
      if (!post) throw missingPost();
      if (post.deletedAt) return { removed: false, postId: post.id };

      const removed = await tx.post.updateMany({
        where: { id: post.id, deletedAt: null },
        data: { deletedAt: new Date(), deletedByUserId: command.moderatorId },
      });
      if (removed.count === 0) return { removed: false, postId: post.id };

      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorUserId: command.moderatorId,
          action: 'POST_DELETED_BY_MODERATOR',
          category: 'FORUM',
          targetType: 'FORUM_POST',
          targetId: post.id,
          reason: command.reason,
          metadata: { threadId: post.threadId },
        },
      });
      return { removed: true, postId: post.id };
    });
  }

  async resolveReport(command: ResolveForumPostReportCommand) {
    return this.database.$transaction(async (tx) => {
      const report = await tx.moderationReport.findUnique({
        where: { id: command.reportId },
        select: { id: true, targetType: true, postId: true, status: true },
      });
      if (!report || report.targetType !== 'FORUM_POST') {
        throw new NotFoundException({
          code: 'FORUM_POST_REPORT_NOT_FOUND',
          message: 'Forenmeldung wurde nicht gefunden.',
        });
      }
      if (report.status !== 'OPEN' && report.status !== 'IN_REVIEW') {
        throw new ConflictException({
          code: 'FORUM_POST_REPORT_ALREADY_RESOLVED',
          message: 'Diese Meldung wurde bereits abgeschlossen.',
        });
      }

      if (command.resolution === 'ACTION_TAKEN') {
        const post = report.postId
          ? await tx.post.findUnique({
              where: { id: report.postId },
              select: { deletedAt: true },
            })
          : null;
        const removalAudit = report.postId
          ? await tx.auditLog.findFirst({
              where: {
                action: 'POST_DELETED_BY_MODERATOR',
                targetType: 'FORUM_POST',
                targetId: report.postId,
              },
              select: { id: true },
            })
          : null;
        if (!post?.deletedAt || !removalAudit) {
          throw new ConflictException({
            code: 'FORUM_POST_REPORT_ACTION_MISSING',
            message: 'Vor dem Abschluss muss eine Moderationsmaßnahme nachgewiesen sein.',
          });
        }
      }

      const taken = command.resolution === 'ACTION_TAKEN';
      const updated = await tx.moderationReport.updateMany({
        where: {
          id: report.id,
          targetType: 'FORUM_POST',
          status: { in: ['OPEN', 'IN_REVIEW'] },
        },
        data: {
          status: taken ? 'RESOLVED' : 'DISMISSED',
          resolution: command.resolution,
          moderatorNote: command.moderatorNote,
          assignedModeratorId: command.moderatorId,
          assignedAt: new Date(),
          resolvedAt: new Date(),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException({
          code: 'FORUM_POST_REPORT_ALREADY_RESOLVED',
          message: 'Diese Meldung wurde bereits abgeschlossen.',
        });
      }
      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorUserId: command.moderatorId,
          action: taken ? 'MODERATION_REPORT_RESOLVED' : 'MODERATION_REPORT_DISMISSED',
          category: 'MODERATION',
          targetType: 'MODERATION_REPORT',
          targetId: report.id,
          moderationReportId: report.id,
          reason: command.moderatorNote,
          metadata: { resolution: command.resolution, postId: report.postId },
        },
      });
      return tx.moderationReport.findUniqueOrThrow({
        where: { id: report.id },
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
