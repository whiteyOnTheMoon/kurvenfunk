import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';

import { REQUIRED_PERMISSIONS_METADATA_KEY, type Permission } from './permissions.constants';
import { PermissionsGuard } from './permissions.guard';

export function RequirePermissions(...permissions: Permission[]) {
  if (permissions.length === 0) {
    throw new Error('At least one permission is required');
  }

  return applyDecorators(
    SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions),
    UseGuards(AuthGuard, PermissionsGuard),
  );
}
