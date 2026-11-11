import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shell = readFileSync(
  new URL('./dev-storage-cache-readonly.sh', import.meta.url),
  'utf8',
);

test('DEV deep inventory waits for sibling readers and revalidates the exact SHA', () => {
  assert.match(shell, /DEV_STORAGE_AUDIT_TARGET/);
  assert.match(shell, /kurvenfunk-dev-deploy\.lock/);
  assert.match(shell, /flock -w 180 9/);
  assert.match(shell, /DEV_STORAGE_HEAD_MOVED_DURING_WAIT/);
  assert.match(shell, /origin\/develop/);
  assert.match(shell, /DEV_STORAGE_AUDIT=PASS_READ_ONLY|DEV_STORAGE_CACHE_AUDIT=PASS_READ_ONLY/);
  assert.doesNotMatch(shell, /redis-cli FLUSHALL|redis-cli FLUSHDB|docker volume rm/);
});
