import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../../../', import.meta.url);
const schema = readFileSync(new URL('packages/database/prisma/schema.prisma', root), 'utf8');
const source = readFileSync(
  new URL('infrastructure/scripts/verify/dev-phase0-21-data-audit.mjs', root),
  'utf8',
);
const shell = readFileSync(
  new URL('infrastructure/scripts/verify/dev-phase0-21-data-audit.sh', root),
  'utf8',
);

describe('Phase 0-21 read-only DEV inventory', () => {
  it('uses only actual Prisma model delegates, including acronym-cased IPBlock', () => {
    const delegates = new Set(
      [...schema.matchAll(/^model (\w+) \{/gm)].map(
        ([, name]) => name[0].toLowerCase() + name.slice(1),
      ),
    );
    const entries = source.match(/const rowModels = \[([\s\S]*?)\];/)?.[1];
    assert.ok(entries);
    const used = [...entries.matchAll(/'(\w+)'/g)].map(([, name]) => name);
    assert.ok(used.includes('iPBlock'));
    assert.deepEqual(
      used.filter((name) => !delegates.has(name)),
      [],
    );
  });

  it('never runs data writes or opens non-DEV environments', () => {
    assert.match(source, /PHASE021_AUDIT_TARGET/);
    assert.doesNotMatch(
      source,
      /db\.\w+\.(?:create|update|upsert|delete|deleteMany|updateMany|executeRaw)\s*\(/,
    );
    assert.match(shell, /EXPECTED_COMMIT/);
    assert.match(shell, /kurvenfunk-dev/);
    assert.match(shell, /origin\/develop/);
  });
});
