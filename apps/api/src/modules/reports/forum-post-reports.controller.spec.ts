import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { AuthGuard } from '../auth/auth.guard';
import { OnboardingCompletedGuard } from '../auth/onboarding-completed.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import {
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
} from '../permissions/permissions.constants';
import {
  ForumPostModerationController,
  ForumPostReportsController,
  ForumPostReportsModerationController,
  removeForumPostSchema,
} from './forum-post-reports.controller';
import { createCommentReportSchema } from './reports.controller';
import { ForumPostReportsService } from './forum-post-reports.service';

jest.mock('../auth/auth.guard', () => ({ AuthGuard: jest.fn() }));
jest.mock('./forum-post-reports.service', () => ({ ForumPostReportsService: jest.fn() }));

describe('Phase 22.222 forum report routes', () => {
  const postId = '11111111-1111-4111-8111-111111111111';
  const reportId = '22222222-2222-4222-8222-222222222222';
  const userId = '33333333-3333-4333-8333-333333333333';
  const request = {
    user: { kurvenfunkUserId: userId, kurvenfunkUserStatus: 'LIMITED' },
  } as unknown as AuthenticatedRequest;

  it('strictly validates shared report reason and moderator removal', () => {
    expect(createCommentReportSchema.safeParse({ reason: 'SPAM' }).success).toBe(true);
    expect(createCommentReportSchema.safeParse({ reason: 'UNKNOWN' }).success).toBe(false);
    expect(removeForumPostSchema.safeParse({ reason: ' Regelwidriger Inhalt ' }).success).toBe(
      true,
    );
    expect(removeForumPostSchema.safeParse({ reason: 'no' }).success).toBe(false);
    expect(removeForumPostSchema.safeParse({ reason: 'Ein Grund', userId }).success).toBe(false);
  });

  it('requires authenticated, onboarded users for post reports', async () => {
    const createReport = jest.fn().mockResolvedValue({ id: reportId });
    const controller = new ForumPostReportsController({
      createReport,
    } as unknown as ForumPostReportsService);
    const handler = Reflect.get(ForumPostReportsController.prototype, 'createReport') as object;
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(PATH_METADATA, ForumPostReportsController)).toContain(
      ':postId/reports',
    );
    const guards: unknown = Reflect.getMetadata(GUARDS_METADATA, handler);
    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(OnboardingCompletedGuard);
    await controller.createReport('verein-wien', 'topic', postId, request, { reason: 'SPAM' });
    expect(createReport).toHaveBeenCalledWith({
      forumSlug: 'verein-wien',
      threadSlug: 'topic',
      postId,
      reporterId: userId,
      userStatus: 'LIMITED',
      reason: 'SPAM',
    });
  });

  it('gates moderator queue, decisions and removal through the central permission', async () => {
    for (const [controller, method] of [
      [ForumPostReportsModerationController, 'listPendingReports'],
      [ForumPostReportsModerationController, 'resolveReport'],
      [ForumPostModerationController, 'removePost'],
    ] as const) {
      const handler = Reflect.get(controller.prototype, method) as object;
      const permissions: unknown = Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, handler);
      expect(permissions).toContain(PERMISSIONS.FORUM_POST_MODERATE);
      const guards: unknown = Reflect.getMetadata(GUARDS_METADATA, handler);
      expect(guards).toContain(AuthGuard);
      expect(guards).toContain(OnboardingCompletedGuard);
    }

    const listPendingReports = jest.fn().mockResolvedValue([]);
    const resolveReport = jest.fn().mockResolvedValue({ id: reportId });
    const removePost = jest.fn().mockResolvedValue({ removed: true });
    const service = {
      listPendingReports,
      resolveReport,
      removePost,
    } as unknown as ForumPostReportsService;
    const moderation = new ForumPostReportsModerationController(service);
    const removal = new ForumPostModerationController(service);
    await moderation.listPendingReports();
    await moderation.resolveReport(reportId, request, {
      resolution: 'NO_VIOLATION',
      moderatorNote: 'Keine Regelverletzung',
    });
    await removal.removePost(postId, request, { reason: 'Regelwidrig' });
    expect(resolveReport).toHaveBeenCalledWith({
      reportId,
      moderatorId: userId,
      resolution: 'NO_VIOLATION',
      moderatorNote: 'Keine Regelverletzung',
    });
    expect(removePost).toHaveBeenCalledWith({
      postId,
      moderatorId: userId,
      reason: 'Regelwidrig',
    });
  });
});
