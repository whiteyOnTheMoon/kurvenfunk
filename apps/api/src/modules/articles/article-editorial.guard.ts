import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class ArticleEditorialGuard implements CanActivate {
  constructor(private readonly permissionsService: PermissionsService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    const allowed =
      user !== undefined &&
      this.permissionsService.hasPermission(
        {
          roles: user.kurvenfunkRoles,
          status: user.kurvenfunkUserStatus,
        },
        PERMISSIONS.ARTICLE_CREATE,
      );

    if (!allowed) {
      throw new ForbiddenException({
        code: 'ARTICLE_WRITE_FORBIDDEN',
        message: 'Article write access is not allowed',
      });
    }

    return true;
  }
}
