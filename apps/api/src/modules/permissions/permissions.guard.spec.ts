import { ForbiddenException, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedUser } from '../auth/auth.types';

import {
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
  type Permission,
} from './permissions.constants';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsService } from './permissions.service';

describe('PermissionsGuard', () => {
  const guard = new PermissionsGuard(new Reflector(), new PermissionsService());

  function createUser(
    status: AuthenticatedUser['kurvenfunkUserStatus'] = 'ACTIVE',
  ): AuthenticatedUser {
    return {
      sub: 'test-subject',
      kurvenfunkUserId: 'test-user',
      kurvenfunkUserStatus: status,
      kurvenfunkFanPreference: 'NEUTRAL',
      kurvenfunkFavoriteClubId: null,
      kurvenfunkOnboardingCompleted: true,
      kurvenfunkRoles: ['USER'],
    };
  }

  function createContext(permissions?: Permission[], user?: AuthenticatedUser): ExecutionContext {
    const handler = () => undefined;

    class TestController {}

    if (permissions !== undefined) {
      Reflect.defineMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions, handler);
    }

    return {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows authorized requests', () => {
    expect(guard.canActivate(createContext([PERMISSIONS.COMMENT_CREATE], createUser()))).toBe(true);
  });

  it('rejects missing authentication', () => {
    expect(() => guard.canActivate(createContext([PERMISSIONS.COMMENT_CREATE]))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects missing permission metadata', () => {
    expect(() => guard.canActivate(createContext(undefined, createUser()))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects insufficient permissions', () => {
    expect(() =>
      guard.canActivate(createContext([PERMISSIONS.ARTICLE_PUBLISH], createUser())),
    ).toThrow(ForbiddenException);
  });

  it('rejects LIMITED users when posting', () => {
    expect(() =>
      guard.canActivate(createContext([PERMISSIONS.COMMENT_CREATE], createUser('LIMITED'))),
    ).toThrow(ForbiddenException);
  });

  it('allows LIMITED users to vote', () => {
    expect(
      guard.canActivate(createContext([PERMISSIONS.COMMENT_VOTE], createUser('LIMITED'))),
    ).toBe(true);
  });

  it('rejects BANNED users', () => {
    expect(() =>
      guard.canActivate(createContext([PERMISSIONS.COMMENT_VOTE], createUser('BANNED'))),
    ).toThrow(ForbiddenException);
  });

  it('returns the standard permission error', () => {
    try {
      guard.canActivate(createContext([PERMISSIONS.ARTICLE_PUBLISH], createUser()));

      throw new Error('Expected permission rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);

      expect((error as ForbiddenException).getResponse()).toEqual({
        code: 'PERMISSION_FORBIDDEN',
        message: 'Permission denied',
      });
    }
  });
});
