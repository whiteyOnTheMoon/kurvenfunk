import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthenticatedRequest } from './auth.types';

/**
 * Applied only to community writes after AuthGuard. Authentication, onboarding,
 * public reads and account recovery remain accessible before completion.
 */
@Injectable()
export class OnboardingCompletedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      });
    }

    if (user.kurvenfunkOnboardingCompleted !== true) {
      throw new ForbiddenException({
        code: 'ONBOARDING_REQUIRED',
        message: 'Complete onboarding before participating in the community',
      });
    }

    return true;
  }
}
