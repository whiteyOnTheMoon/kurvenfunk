import assert from 'node:assert/strict';
import test from 'node:test';

import { securityHeaders } from './security-headers.ts';

test('provides unique baseline browser security headers', () => {
  const names = securityHeaders.map(({ key }) => key.toLowerCase());
  assert.equal(new Set(names).size, names.length);

  const values = new Map(securityHeaders.map(({ key, value }) => [key, value]));
  assert.equal(values.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(values.get('X-Frame-Options'), 'DENY');
  assert.equal(values.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.equal(
    values.get('Permissions-Policy'),
    'camera=(), microphone=(), geolocation=()',
  );
});
