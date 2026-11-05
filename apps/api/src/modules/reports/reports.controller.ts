import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { OnboardingCompletedGuard } from '../auth/onboarding-completed.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { ReportsService } from './reports.service';

export const resolveCommentReportSchema = z
  .object({
    resolution: z.enum([
      'ACTION_TAKEN',
      'NO_VIOLATION',
      'INSUFFICIENT_EVIDENCE',
      'ALREADY_HANDLED',
      'DUPLICATE',
      'INVALID_REPORT',
      'OTHER',
    ]),
    moderatorNote: z.string().trim().min(3).max(1000),
  })
  .strict();

export const createCommentReportSchema = z
  .object({
    reason: z.enum([
      'SPAM',
      'HARASSMENT',
      'HATE_OR_ABUSE',
      'THREAT_OR_VIOLENCE',
      'PRIVACY',
      'IMPERSONATION',
      'ILLEGAL_CONTENT',
      'OFF_TOPIC',
      'MISINFORMATION',
      'OTHER',
    ]),
    details: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

type CreateCommentReportInput = z.infer<typeof createCommentReportSchema>;

@Controller('comments/:commentId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(AuthGuard, OnboardingCompletedGuard)
  createCommentReport(
    @Param('commentId', new ParseUUIDPipe({ version: '4' }))
    commentId: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createCommentReportSchema))
    input: CreateCommentReportInput,
  ) {
    const user = request.user!;

    return this.reportsService.createCommentReport({
      commentId,
      reporterId: user.kurvenfunkUserId,
      userStatus: user.kurvenfunkUserStatus,
      reason: input.reason,
      details: input.details,
    });
  }
}

/**
 * Phase 19 report processing. The more extensive moderation dashboard,
 * sanctions and appeal workflows belong to Phase 20.
 */
@Controller('moderation/comment-reports')
export class CommentReportsModerationController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.COMMENT_MODERATE)
  listPendingCommentReports() {
    return this.reportsService.listPendingCommentReports();
  }

  @Post(':id/resolve')
  @RequirePermissions(PERMISSIONS.COMMENT_MODERATE)
  resolveCommentReport(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(resolveCommentReportSchema))
    input: z.infer<typeof resolveCommentReportSchema>,
  ) {
    return this.reportsService.resolveCommentReport({
      reportId: id,
      moderatorId: request.user!.kurvenfunkUserId,
      ...input,
    });
  }
}
