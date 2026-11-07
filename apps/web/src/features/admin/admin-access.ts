// The backend remains authoritative for API permissions. This policy prevents
// unprivileged users from rendering the client-side /admin workspace.
export type AdminRole = 'USER' | 'TRUSTED_USER' | 'MODERATOR' | 'EDITOR' | 'ADMIN' | 'SUPERADMIN';

export interface AdminIdentity {
  status: 'ACTIVE' | 'LIMITED' | 'BANNED';
  onboardingCompleted: boolean;
  roles: readonly AdminRole[];
}

const editorialRoles: readonly AdminRole[] = ['EDITOR', 'ADMIN', 'SUPERADMIN'];
const moderatorRoles: readonly AdminRole[] = ['MODERATOR', 'ADMIN', 'SUPERADMIN'];
const administratorRoles: readonly AdminRole[] = ['ADMIN', 'SUPERADMIN'];
const workspaceRoles: readonly AdminRole[] = ['EDITOR', 'MODERATOR', 'ADMIN', 'SUPERADMIN'];

export const adminNavigation = [
  { href: '/admin', label: 'Dashboard', shortLabel: 'DB', roles: workspaceRoles },
  { href: '/admin/artikel', label: 'Artikel', shortLabel: 'AR', roles: editorialRoles },
  { href: '/admin/kategorien', label: 'Kategorien', shortLabel: 'KA', roles: editorialRoles },
  { href: '/admin/tags', label: 'Tags', shortLabel: 'TA', roles: editorialRoles },
  { href: '/admin/medien', label: 'Medien', shortLabel: 'ME', roles: editorialRoles },
  { href: '/admin/importe', label: 'Importe', shortLabel: 'IM', roles: editorialRoles },
  { href: '/admin/sportdaten', label: 'Sportdaten', shortLabel: 'SP', roles: administratorRoles },
  { href: '/admin/benutzer', label: 'Benutzer', shortLabel: 'BE', roles: administratorRoles },
  { href: '/admin/moderation', label: 'Moderation', shortLabel: 'MO', roles: moderatorRoles },
  { href: '/admin/forum', label: 'Forum', shortLabel: 'FO', roles: moderatorRoles },
  { href: '/admin/system', label: 'System', shortLabel: 'SY', roles: administratorRoles },
] as const;

function hasAnyRole(user: AdminIdentity, allowed: readonly AdminRole[]): boolean {
  return Array.isArray(user.roles) && user.roles.some((role) => allowed.includes(role));
}

export function canEnterAdmin(user: AdminIdentity | undefined): boolean {
  return Boolean(
    user &&
    user.status === 'ACTIVE' &&
    user.onboardingCompleted &&
    hasAnyRole(user, workspaceRoles),
  );
}

export function canAccessAdminPath(user: AdminIdentity | undefined, pathname: string): boolean {
  if (!user || !canEnterAdmin(user)) return false;

  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/admin') return true;

  const entry = adminNavigation.find(
    (item) => item.href !== '/admin' && (path === item.href || path.startsWith(item.href + '/')),
  );

  // Unknown /admin routes are not implicitly available, and /adminfoo must
  // not be mistaken for the /admin dashboard.
  return Boolean(entry && hasAnyRole(user, entry.roles));
}

export function getAdminNavigation(user: AdminIdentity | undefined) {
  if (!canEnterAdmin(user) || !user) return [];
  return adminNavigation.filter((item) => hasAnyRole(user, item.roles));
}

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

export function getAdminMenuDestination(user: AdminIdentity | undefined): string | null {
  return user && canEnterAdmin(user) ? getPostLoginDestination(user) : null;
}
