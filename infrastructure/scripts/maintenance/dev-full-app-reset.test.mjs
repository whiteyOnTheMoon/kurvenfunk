import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../../../', import.meta.url);
const shell = readFileSync(
  new URL('infrastructure/scripts/maintenance/dev-full-app-reset.sh', root),
  'utf8',
);
const sql = readFileSync(
  new URL('infrastructure/scripts/maintenance/dev-full-app-reset.sql', root),
  'utf8',
);
const devCompose = readFileSync(new URL('compose.dev.yml', root), 'utf8');

describe('DEV-only full application data reset', () => {
  it('requires exact DEV commit, explicit confirmation, and exclusive locks', () => {
    assert.match(shell, /DEV_FULL_RESET_TARGET/);
    assert.match(shell, /RESET_ALL_DEV_APPLICATION_DATA/);
    assert.match(shell, /EXPECTED_COMMIT/);
    assert.match(shell, /git rev-parse origin\/develop/);
    assert.match(shell, /kurvenfunk-dev-deploy\.lock/);
    assert.match(shell, /kurvenfunk-dev-full-application-reset\.lock/);
    assert.match(shell, /APPLICATION_AND_KEYCLOAK_DB_IDENTICAL/);
  });

  it('backs up and fully checks both databases before applying SQL', () => {
    assert.match(shell, /for role in application keycloak/);
    assert.match(shell, /pg_dump/);
    assert.match(shell, /pg_restore --list/);
    assert.match(shell, /pg_restore --file \/dev\/null/);
    assert.ok(shell.indexOf('backup_verified=YES') < shell.indexOf('psql_app -q <'));
    assert.match(shell, /stop api worker/);
    assert.match(shell, /trap on_exit EXIT/);
  });

  it('preserves migration history and schema while checking an empty result', () => {
    assert.match(sql, /BEGIN;/);
    assert.match(sql, /TRUNCATE TABLE/);
    assert.match(sql, /RESTART IDENTITY CASCADE/);
    assert.match(sql, /tablename <> '_prisma_migrations'/);
    assert.match(sql, /NONEMPTY_TABLE_AFTER_RESET/);
    assert.match(sql, /COMMIT;/);
    assert.doesNotMatch(sql, /DROP (?:SCHEMA|DATABASE|TABLE)/);
  });

  it('prevents a background news re-import on DEV and clears only DEV Redis', () => {
    assert.match(devCompose, /NEWS_IMPORT_SCHEDULER_ENABLED: 'false'/);
    assert.match(shell, /docker compose -p kurvenfunk-dev/);
    assert.match(shell, /redis-cli FLUSHDB SYNC/);
    assert.doesNotMatch(shell, /(?:compose\.prod\.yml|compose\.staging\.yml)/);
  });
});
