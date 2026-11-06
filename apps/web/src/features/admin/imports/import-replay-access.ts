// Replay is an administrative repair action, not part of editorial review.
// The API permission guard remains the authoritative security boundary.
export function canReplayImportJobs(roles: readonly string[] | undefined): boolean {
  return Boolean(roles?.some((role) => role === 'ADMIN' || role === 'SUPERADMIN'));
}
