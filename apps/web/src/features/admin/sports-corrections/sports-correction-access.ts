// Frontend affordance only. The NestJS permission guard is authoritative.
export function canCorrectSports(roles: readonly string[] | undefined): boolean {
  return Boolean(roles?.some((role) => role === 'ADMIN' || role === 'SUPERADMIN'));
}
