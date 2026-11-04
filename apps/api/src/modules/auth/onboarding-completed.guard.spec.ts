import {
  ForbiddenException,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthenticatedUser } from './auth.types';
import { OnboardingCompletedGuard } from './onboarding-completed.guard';

describe('OnboardingCompletedGuard', () => {
  const guard = new OnboardingCompletedGuard();

  function context(
    completed?: boolean,
    status: AuthenticatedUser['kurvenfunkUserStatus'] = 'ACTIVE',
  ): ExecutionContext {
    const user =
      completed === undefined
        ? undefined
        : ({
            kurvenfunkUserId: 'test-user',
            kurvenfunkUserStatus: status,
            kurvenfunkOnboardingCompleted: completed,
          } as AuthenticatedUser);

    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('rejects an unauthenticated request', () => {
    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
  });

  it('rejects community mutations before onboarding with a stable error', () => {
    try {
      guard.canActivate(context(false));
      throw new Error('Expected onboarding denial');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toEqual({
        code: 'ONBOARDING_REQUIRED',
        message: 'Complete onboarding before participating in the community',
      });
    }
  });

  it('allows an ACTIVE user after onboarding', () => {
    expect(guard.canActivate(context(true))).toBe(true);
  });

  it('allows a completed LIMITED user through to the separate permissions check', () => {
    expect(guard.canActivate(context(true, 'LIMITED'))).toBe(true);
  });

  it('rejects an incomplete LIMITED user', () => {
    expect(() => guard.canActivate(context(false, 'LIMITED'))).toThrow(ForbiddenException);
  });
});
