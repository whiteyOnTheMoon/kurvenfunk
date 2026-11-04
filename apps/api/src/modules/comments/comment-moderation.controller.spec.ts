jest.mock('@kurvenfunk/validation', () => ({
  createCommentSchema: {
    safeParse: (value: unknown) => ({ success: true, data: value }),
  },
}));

jest.mock('../auth/auth.guard', () => ({
  AuthGuard: class AuthGuard {
    canActivate() {
      return true;
    }
  },
}));

jest.mock('./comments.service', () => ({
  CommentsService: class CommentsService {},
}));

import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import type { AuthenticatedRequest } from '../auth/auth.types';
import { AuthGuard } from '../auth/auth.guard';
import { OnboardingCompletedGuard } from '../auth/onboarding-completed.guard';
import {
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
} from '../permissions/permissions.constants';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { CommentModerationController } from './comments.controller';
import type { CommentsService } from './comments.service';

describe('Task 166: privileged comment moderation route', () => {
  const method = Reflect.get(CommentModerationController.prototype, 'moderateRemove');

  it('registers DELETE /moderation/comments/:commentId', () => {
    expect(Reflect.getMetadata(PATH_METADATA, CommentModerationController)).toBe(
      'moderation/comments',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(RequestMethod.DELETE);
    expect(Reflect.getMetadata(PATH_METADATA, method)).toBe(':commentId');
  });

  it('requires authentication and the server-side comment.moderate permission', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, method) as unknown[];
    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(PermissionsGuard);
    expect(guards).not.toContain(OnboardingCompletedGuard);
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, method)).toEqual([
      PERMISSIONS.COMMENT_MODERATE,
    ]);
  });

  it('passes the moderator ID and validated reason to the service', async () => {
    const commentId = '11111111-1111-4111-8111-111111111111';
    const moderatorId = '22222222-2222-4222-8222-222222222222';
    const moderateRemove = jest.fn().mockResolvedValue({ id: commentId, deleted: true });
    const controller = new CommentModerationController({
      moderateRemove,
    } as unknown as CommentsService);

    const request = {
      user: { kurvenfunkUserId: moderatorId },
    } as AuthenticatedRequest;

    await expect(
      controller.moderateRemove(commentId, request, { reason: 'Beleidigung' }),
    ).resolves.toEqual({ id: commentId, deleted: true });

    expect(moderateRemove).toHaveBeenCalledWith({
      commentId,
      moderatorId,
      reason: 'Beleidigung',
    });
  });
});
