import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/auth.types';

const EDITORIAL_ROLES = new Set(['EDITOR', 'ADMIN', 'SUPERADMIN']);

@Injectable()
export class ArticleEditorialGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || user.kurvenfunkUserStatus !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'ARTICLE_WRITE_FORBIDDEN',
        message: 'Article write access is not allowed',
      });
    }

    if (!user.kurvenfunkRoles.some((role) => EDITORIAL_ROLES.has(role))) {
      throw new ForbiddenException({
        code: 'ARTICLE_WRITE_FORBIDDEN',
        message: 'Article write access is not allowed',
      });
    }

    return true;
  }
}
