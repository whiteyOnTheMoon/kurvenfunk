import { canEnterAdmin, type AdminIdentity } from '../admin/admin-access';

// The API-backed identity is authoritative; Keycloak login alone does not
// determine the landing route or grant access to the admin workspace.
export function getPostLoginDestination(user: AdminIdentity): string {
  if (!user.onboardingCompleted) {
    return '/onboarding';
  }

  if (!canEnterAdmin(user)) {
    return '/';
  }

  if (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN')) {
    return '/admin';
  }

  if (user.roles.includes('EDITOR')) {
    return '/admin/artikel';
  }

  if (user.roles.includes('MODERATOR')) {
    return '/admin/moderation';
  }

  return '/';
}
