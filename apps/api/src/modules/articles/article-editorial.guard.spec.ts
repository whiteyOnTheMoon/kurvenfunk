import { ForbiddenException, type ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest, AuthenticatedUser } from '../auth/auth.types';
import { PermissionsService } from '../permissions/permissions.service';
import { ArticleEditorialGuard } from './article-editorial.guard';

describe('ArticleEditorialGuard', () => {
  const guard = new ArticleEditorialGuard(new PermissionsService());

  function createUser(
    roles: AuthenticatedUser['kurvenfunkRoles'],
    status: AuthenticatedUser['kurvenfunkUserStatus'] = 'ACTIVE',
  ): AuthenticatedUser {
    return {
      sub: 'keycloak-user',
      kurvenfunkUserId: 'kurvenfunk-user',
      kurvenfunkUserStatus: status,
      kurvenfunkFanPreference: 'NEUTRAL',
      kurvenfunkFavoriteClubId: null,
      kurvenfunkOnboardingCompleted: true,
      kurvenfunkRoles: roles,
    };
  }

  function createContext(user?: AuthenticatedUser): ExecutionContext {
    const request = {
      user,
    } as AuthenticatedRequest;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it.each(['EDITOR', 'ADMIN', 'SUPERADMIN'] as const)('allows an active %s', (role) => {
    expect(guard.canActivate(createContext(createUser([role])))).toBe(true);
  });

  it.each(['USER', 'TRUSTED_USER', 'MODERATOR'] as const)(
    'rejects an active %s without an editorial role',
    (role) => {
      expect(() => guard.canActivate(createContext(createUser([role])))).toThrow(
        ForbiddenException,
      );
    },
  );

  it('rejects a limited editor', () => {
    expect(() => guard.canActivate(createContext(createUser(['EDITOR'], 'LIMITED')))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a banned superadmin', () => {
    expect(() => guard.canActivate(createContext(createUser(['SUPERADMIN'], 'BANNED')))).toThrow(
      ForbiddenException,
    );
  });

  it('allows an active user with multiple roles including EDITOR', () => {
    expect(guard.canActivate(createContext(createUser(['USER', 'EDITOR'])))).toBe(true);
  });

  it('rejects a request without an authenticated user', () => {
    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
  });

  it('returns the article write error code for forbidden access', () => {
    try {
      guard.canActivate(createContext(createUser(['USER'])));
      throw new Error('Expected guard to reject access');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toEqual({
        code: 'ARTICLE_WRITE_FORBIDDEN',
        message: 'Article write access is not allowed',
      });
    }
  });
});
