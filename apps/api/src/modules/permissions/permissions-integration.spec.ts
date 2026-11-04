import 'reflect-metadata';

import { GUARDS_METADATA } from '@nestjs/common/constants';

jest.mock('../auth/auth.guard', () => ({
  AuthGuard: jest.fn(),
}));

jest.mock('../comments/comments.service', () => ({
  CommentsService: jest.fn(),
}));

jest.mock('../reactions/reactions.service', () => ({
  ReactionsService: jest.fn(),
}));

jest.mock('@kurvenfunk/validation', () => ({
  createCommentSchema: {},
}));

import { AuthGuard } from '../auth/auth.guard';
import { OnboardingCompletedGuard } from '../auth/onboarding-completed.guard';
import { CommentsController } from '../comments/comments.controller';
import { ReactionsController } from '../reactions/reactions.controller';

import {
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
  type Permission,
} from './permissions.constants';

import { PermissionsGuard } from './permissions.guard';

describe('Community permission integration', () => {
  function expectPermission(prototype: object, methodName: string, permission: Permission): void {
    const handler: unknown = Object.getOwnPropertyDescriptor(prototype, methodName)?.value;

    if (typeof handler !== 'function') {
      throw new Error(`Missing controller method: ${methodName}`);
    }
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, handler)).toEqual([permission]);

    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
      AuthGuard,
      OnboardingCompletedGuard,
      PermissionsGuard,
    ]);
  }

  it('protects comment creation', () => {
    expectPermission(CommentsController.prototype, 'create', PERMISSIONS.COMMENT_CREATE);
  });

  it('protects comment replies', () => {
    expectPermission(CommentsController.prototype, 'createReply', PERMISSIONS.COMMENT_CREATE);
  });

  it('protects comment editing', () => {
    expectPermission(CommentsController.prototype, 'update', PERMISSIONS.COMMENT_EDIT);
  });

  it('protects comment deletion', () => {
    expectPermission(CommentsController.prototype, 'remove', PERMISSIONS.COMMENT_DELETE);
  });

  it('protects comment voting', () => {
    expectPermission(ReactionsController.prototype, 'setVote', PERMISSIONS.COMMENT_VOTE);
  });

  it('protects vote removal', () => {
    expectPermission(ReactionsController.prototype, 'removeVote', PERMISSIONS.COMMENT_VOTE);
  });
});
