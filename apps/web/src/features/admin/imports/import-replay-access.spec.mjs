import assert from 'node:assert/strict';
import test from 'node:test';

import { canReplayImportJobs } from './import-replay-access.ts';

test('only ADMIN and SUPERADMIN can see an import dead-letter replay action', () => {
  for (const roles of [undefined, [], ['USER'], ['TRUSTED_USER'], ['EDITOR'], ['MODERATOR']]) {
    assert.equal(canReplayImportJobs(roles), false);
  }

  for (const roles of [['ADMIN'], ['SUPERADMIN'], ['EDITOR', 'ADMIN']]) {
    assert.equal(canReplayImportJobs(roles), true);
  }
});
