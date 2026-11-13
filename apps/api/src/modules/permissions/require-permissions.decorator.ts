import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { OnboardingCompletedGuard } from '../auth/onboarding-completed.guard';

import {
  COMMUNITY_PERMISSIONS,
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
  type Permission,
} from './permissions.constants';
import { PermissionsGuard } from './permissions.guard';

export function RequirePermissions(...permissions: Permission[]) {
  if (permissions.length === 0) {
    throw new Error('At least one permission is required');
  }

  // Moderator-only thread pin actions must also respect completed onboarding.
  // Do not add them to COMMUNITY_PERMISSIONS: that would grant pin access to USER.
  const requiresOnboarding = permissions.some(
    (permission) => COMMUNITY_PERMISSIONS.includes(permission) || permission === PERMISSIONS.THREAD_PIN,
  );

  return applyDecorators(
    SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions),
    requiresOnboarding
      ? UseGuards(AuthGuard, OnboardingCompletedGuard, PermissionsGuard)
      : UseGuards(AuthGuard, PermissionsGuard),
  );
}
