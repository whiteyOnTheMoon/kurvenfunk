/**
 * Baseline browser protections. CSP and HSTS require a separately verified
 * Keycloak/asset/HTTPS policy, so they are intentionally not guessed here.
 */
export const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
