import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../../../', import.meta.url);
function source(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

describe('Phase 21 DEV sport data provenance', () => {
  it('removes the Prisma seed entry and the old bulk fake data script', () => {
    assert.equal(existsSync(new URL('packages/database/prisma/seed.ts', root)), false);
    assert.doesNotMatch(source('packages/database/prisma.config.ts'), /seed:.*seed\.ts/);
    assert.doesNotMatch(source('packages/database/package.json'), /"seed":/);
  });

  it('never enables synthetic sports producers in DEV Compose even if .env.dev opted in', () => {
    const dev = source('compose.dev.yml');
    const switches = ['SPORTS_FAKE_PROVIDER_ENABLED', 'SPORTS_IMPORT_SCHEDULER_ENABLED', 'SPORTS_IMPORT_LIVE_ENABLED'];
    for (const key of switches) {
      assert.match(dev, new RegExp(key + ": 'false'"));
      assert.doesNotMatch(dev, new RegExp(key + ': \\$\\{'));
    }
  });

  it('requires an explicit marker and read-only audit after a successful DEV deploy', () => {
    const ci = source('.github/workflows/ci.yml');
    assert.match(ci, /\[phase21-dev-seed-audit\]/);
    assert.match(ci, /dev-phase21-seed-audit\.sh/);
    const script = source('infrastructure/scripts/verify/dev-phase21-seed-audit.mjs');
    assert.doesNotMatch(script, /\.(delete|deleteMany|update|updateMany|create|createMany|upsert)\(/);
  });
});
