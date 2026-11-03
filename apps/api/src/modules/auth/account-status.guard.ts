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
        // Log rejected authenticated access without tokens, IPs or query-string content.
        this.logger.warn(
          `BANNED_ACCESS_DENIED userId=${user.kurvenfunkUserId} method=${request.method ?? 'UNKNOWN'}`,
        );
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
