import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { OnboardingCompletedGuard } from '../auth/onboarding-completed.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { createCommentReportSchema, resolveCommentReportSchema } from './reports.controller';
import { ForumPostReportsService } from './forum-post-reports.service';

export const removeForumPostSchema = z
  .object({ reason: z.string().trim().min(5).max(500) })
  .strict();

@Controller('forums/by-slug/:forumSlug/threads/:threadSlug/posts/:postId/reports')
export class ForumPostReportsController {
  constructor(private readonly reports: ForumPostReportsService) {}

  @Post()
  @UseGuards(AuthGuard, OnboardingCompletedGuard)
  createReport(
    @Param('forumSlug') forumSlug: string,
    @Param('threadSlug') threadSlug: string,
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createCommentReportSchema))
    input: z.infer<typeof createCommentReportSchema>,
  ) {
    const user = request.user!;
    return this.reports.createReport({
      forumSlug,
      threadSlug,
      postId,
      reporterId: user.kurvenfunkUserId,
      userStatus: user.kurvenfunkUserStatus,
      ...input,
    });
  }
}

@Controller('moderation/forum-post-reports')
export class ForumPostReportsModerationController {
  constructor(private readonly reports: ForumPostReportsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.FORUM_POST_MODERATE)
  listPendingReports() {
    return this.reports.listPendingReports();
  }

  @Post(':id/resolve')
  @RequirePermissions(PERMISSIONS.FORUM_POST_MODERATE)
  resolveReport(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(resolveCommentReportSchema))
    input: z.infer<typeof resolveCommentReportSchema>,
  ) {
    return this.reports.resolveReport({
      reportId: id,
      moderatorId: request.user!.kurvenfunkUserId,
      ...input,
    });
  }
}

@Controller('moderation/forum-posts')
export class ForumPostModerationController {
  constructor(private readonly reports: ForumPostReportsService) {}

  @Post(':id/remove')
  @RequirePermissions(PERMISSIONS.FORUM_POST_MODERATE)
  removePost(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(removeForumPostSchema))
    input: z.infer<typeof removeForumPostSchema>,
  ) {
    return this.reports.removePost({
      postId: id,
      moderatorId: request.user!.kurvenfunkUserId,
      reason: input.reason,
    });
  }
}
