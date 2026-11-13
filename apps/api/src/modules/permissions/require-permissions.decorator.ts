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

  // Moderator-only thread moderation also requires completed onboarding.
  // Never add these to COMMUNITY_PERMISSIONS: ordinary users must not moderate.
  const requiresOnboarding = permissions.some(
    (permission) =>
      COMMUNITY_PERMISSIONS.includes(permission) ||
      permission === PERMISSIONS.THREAD_PIN ||
      permission === PERMISSIONS.THREAD_LOCK ||
      permission === PERMISSIONS.THREAD_MOVE,
  );

  return applyDecorators(
    SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions),
    requiresOnboarding
      ? UseGuards(AuthGuard, OnboardingCompletedGuard, PermissionsGuard)
      : UseGuards(AuthGuard, PermissionsGuard),
  );
}
