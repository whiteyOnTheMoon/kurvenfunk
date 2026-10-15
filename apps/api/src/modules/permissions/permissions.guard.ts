import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedRequest } from '../auth/auth.types';

import { REQUIRED_PERMISSIONS_METADATA_KEY, type Permission } from './permissions.constants';
import { PermissionsService } from './permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<readonly Permission[]>(
      REQUIRED_PERMISSIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissions?.length) {
      throw new ForbiddenException({
        code: 'PERMISSION_NOT_CONFIGURED',
        message: 'No permissions configured',
      });
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      });
    }

    const allowed = this.permissionsService.hasAllPermissions(
      {
        roles: user.kurvenfunkRoles,
        status: user.kurvenfunkUserStatus,
      },
      permissions,
    );

    if (!allowed) {
      throw new ForbiddenException({
        code: 'PERMISSION_FORBIDDEN',
        message: 'Permission denied',
      });
    }

    return true;
  }
}
