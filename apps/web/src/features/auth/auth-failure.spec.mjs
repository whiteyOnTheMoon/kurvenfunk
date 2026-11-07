import assert from 'node:assert/strict';
import test from 'node:test';

import { isTemporaryIdentityFailure } from './auth-failure.ts';

test('transient upstream failures allow a protected session revalidation', () => {
  for (const status of [429, 500, 502, 503, 504]) {
    assert.equal(isTemporaryIdentityFailure(status), true, String(status));
  }
});

test('unauthorized and forbidden statuses remain definitive auth failures', () => {
  for (const status of [400, 401, 403, 404]) {
    assert.equal(isTemporaryIdentityFailure(status), false, String(status));
  }
});
