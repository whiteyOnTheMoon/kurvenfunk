import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../../../', import.meta.url);
const shell = readFileSync(new URL('infrastructure/scripts/maintenance/dev-phase21-seed-cleanup.sh', root), 'utf8');
const code = readFileSync(new URL('infrastructure/scripts/maintenance/dev-phase21-seed-cleanup.mjs', root), 'utf8');
const ci = readFileSync(new URL('.github/workflows/ci.yml', root), 'utf8');

describe('Phase21 DEV seed cleanup safety', () => {
  it('requires develop+expected SHA, DEV-only compose, private full archive, and verified restore read', () => {
    assert.match(shell, /git branch --show-current/);
    assert.match(shell, /origin\/develop/);
    assert.match(shell, /PHASE21_CLEANUP_MODE/);
    assert.match(shell, /pg_dump/);
    assert.match(shell, /pg_restore --list/);
    assert.match(shell, /pg_restore --file \/dev\/null/);
    assert.match(shell, /PHASE21_VERIFIED_BACKUP/);
    assert.match(shell, /flock -n 8/);
  });

  it('never deletes real comments, standings, providers or user identities', () => {
    assert.doesNotMatch(code, /tx\.(comment|standing|provider|user)\.(delete|deleteMany|updateMany)\(/);
    assert.match(code, /comments: \{ none: \{\} \}/);
    assert.match(code, /isOriginalSeedMatch\(/);
    assert.match(code, /isOriginalSeedArticle\(/);
    assert.match(code, /isOriginalSeedClub\(/);
    assert.match(code, /SEED_MATCH_CONCURRENT_CHANGE/);
    assert.match(code, /editorialMismatchSlug/);
  });

  it('has a separate explicit marker, successful DEV deploy and no automatic production cleanup', () => {
    assert.match(ci, /\[phase21-dev-seed-cleanup\]/);
    assert.match(ci, /needs\.deploy-dev\.result == 'success'/);
    assert.match(ci, /dev-phase21-seed-cleanup\.sh/);
  });
});
