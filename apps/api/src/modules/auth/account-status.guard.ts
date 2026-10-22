import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthenticatedRequest } from './auth.types';

@Injectable()
export class AccountStatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      });
    }

    switch (user.kurvenfunkUserStatus) {
      case 'ACTIVE':
        return true;

      case 'LIMITED':
        // Individual permissions determine allowed actions.
        return true;

      case 'BANNED':
        throw new ForbiddenException({
          code: 'ACCOUNT_BANNED',
          message: 'Account is banned',
        });

      default:
        throw new ForbiddenException({
          code: 'ACCOUNT_STATUS_INVALID',
          message: 'Account status is invalid',
        });
    }
  }
}
