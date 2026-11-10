import assert from 'node:assert/strict';
import test from 'node:test';

import { canCorrectSports } from './sports-correction-access.ts';

test('sports corrections are shown only to ADMIN or SUPERADMIN', () => {
  for (const roles of [undefined, [], ['USER'], ['EDITOR'], ['MODERATOR'], ['TRUSTED_USER']]) {
    assert.equal(canCorrectSports(roles), false);
  }
  for (const roles of [['ADMIN'], ['SUPERADMIN'], ['EDITOR', 'ADMIN']]) {
    assert.equal(canCorrectSports(roles), true);
  }
});
