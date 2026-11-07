// A temporary identity-service outage must not be presented as an explicit
// logout. No privileged page should render until the identity is revalidated.
export function isTemporaryIdentityFailure(status: number): boolean {
  return status === 429 || status >= 500;
}
