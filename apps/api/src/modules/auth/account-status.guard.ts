import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthenticatedRequest } from './auth.types';

@Injectable()
export class AccountStatusGuard implements CanActivate {
  private readonly logger = new Logger(AccountStatusGuard.name);

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
        // Log every attempted authenticated action without recording IPs,
        // bearer tokens, request bodies or other sensitive credentials.
        this.logger.warn(`ACCOUNT_BANNED_ACCESS_DENIED userId=${user.kurvenfunkUserId}`);
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
