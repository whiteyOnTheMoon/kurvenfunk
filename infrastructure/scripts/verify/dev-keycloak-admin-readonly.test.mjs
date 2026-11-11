import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shell = readFileSync(new URL('./dev-keycloak-admin-readonly.sh', import.meta.url), 'utf8');
const inventory = readFileSync(new URL('./dev-residual-services-readonly.sh', import.meta.url), 'utf8');

test('read-only DEV Keycloak diagnostic is guarded and reports only aggregates', () => {
  assert.match(shell, /DEV_KEYCLOAK_DIAG_TARGET/);
  assert.match(shell, /get users\/count -r kurvenfunk/);
  assert.match(shell, /get users -r kurvenfunk --offset 0 --limit 200/);
  assert.match(shell, /get users -r kurvenfunk -q first=0 -q max=200/);
  assert.match(shell, /KEYCLOAK_ADMIN_COUNT_ENDPOINT/);
  assert.doesNotMatch(shell, /kcadm\.sh delete|TRUNCATE|DROP DATABASE|FLUSHDB/);
  assert.match(inventory, /KEYCLOAK_DEV_NON_SERVICE_NON_ADMINLIKE_USERS/);
  assert.match(inventory, /DEV_KEYCLOAK_DIAG_TARGET=DEV/);
});
