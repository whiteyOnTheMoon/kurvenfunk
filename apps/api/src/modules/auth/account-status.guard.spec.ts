import { ForbiddenException, type ExecutionContext, UnauthorizedException } from '@nestjs/common';

import type { AuthenticatedUser } from './auth.types';
import { AccountStatusGuard } from './account-status.guard';

describe('AccountStatusGuard', () => {
  const guard = new AccountStatusGuard();

  function createContext(
    status?: AuthenticatedUser['kurvenfunkUserStatus'] | 'UNKNOWN',
  ): ExecutionContext {
    const user =
      status === undefined
        ? undefined
        : {
            sub: 'test-subject',
            kurvenfunkUserId: 'test-user',
            kurvenfunkUserStatus: status,
            kurvenfunkFanPreference: 'NEUTRAL',
            kurvenfunkFavoriteClubId: null,
            kurvenfunkOnboardingCompleted: true,
            kurvenfunkRoles: ['USER'],
          };

    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows ACTIVE accounts', () => {
    expect(guard.canActivate(createContext('ACTIVE'))).toBe(true);
  });

  it('allows LIMITED accounts for subsequent permission checks', () => {
    expect(guard.canActivate(createContext('LIMITED'))).toBe(true);
  });

  it('rejects BANNED accounts', () => {
    expect(() => guard.canActivate(createContext('BANNED'))).toThrow(ForbiddenException);
  });

  it('returns ACCOUNT_BANNED for banned accounts', () => {
    try {
      guard.canActivate(createContext('BANNED'));

      throw new Error('Expected account rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);

      expect((error as ForbiddenException).getResponse()).toEqual({
        code: 'ACCOUNT_BANNED',
        message: 'Account is banned',
      });
    }
  });

  it('logs BANNED access denial without any bearer token or IP address', () => {
    const warn = jest.spyOn(guard['logger'], 'warn').mockImplementation();

    try {
      expect(() => guard.canActivate(createContext('BANNED'))).toThrow(ForbiddenException);
      expect(warn).toHaveBeenCalledWith('ACCOUNT_BANNED_ACCESS_DENIED userId=test-user');
      expect(warn.mock.calls.flat().join(' ')).not.toContain('Bearer ');
    } finally {
      warn.mockRestore();
    }
  });

  it('rejects missing authentication', () => {
    expect(() => guard.canActivate(createContext())).toThrow(UnauthorizedException);
  });

  it('returns AUTHENTICATION_REQUIRED without user', () => {
    try {
      guard.canActivate(createContext());

      throw new Error('Expected authentication rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);

      expect((error as UnauthorizedException).getResponse()).toEqual({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      });
    }
  });

  it('rejects unknown account status', () => {
    expect(() => guard.canActivate(createContext('UNKNOWN'))).toThrow(ForbiddenException);
  });

  it('returns ACCOUNT_STATUS_INVALID for unknown status', () => {
    try {
      guard.canActivate(createContext('UNKNOWN'));

      throw new Error('Expected invalid status rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);

      expect((error as ForbiddenException).getResponse()).toEqual({
        code: 'ACCOUNT_STATUS_INVALID',
        message: 'Account status is invalid',
      });
    }
  });
});
