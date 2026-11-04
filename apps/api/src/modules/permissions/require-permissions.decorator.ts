import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { OnboardingCompletedGuard } from '../auth/onboarding-completed.guard';

import {
  COMMUNITY_PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
  type Permission,
} from './permissions.constants';
import { PermissionsGuard } from './permissions.guard';

export function RequirePermissions(...permissions: Permission[]) {
  if (permissions.length === 0) {
    throw new Error('At least one permission is required');
  }

  const requiresOnboarding = permissions.some((permission) =>
    COMMUNITY_PERMISSIONS.includes(permission),
  );

  return applyDecorators(
    SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions),
    requiresOnboarding
      ? UseGuards(AuthGuard, OnboardingCompletedGuard, PermissionsGuard)
      : UseGuards(AuthGuard, PermissionsGuard),
  );
}
