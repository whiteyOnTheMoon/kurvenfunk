import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shell = readFileSync(new URL('./dev-residual-reset.sh', import.meta.url), 'utf8');
const keycloak = readFileSync(new URL('./dev-residual-clear-keycloak.sh', import.meta.url), 'utf8');
const media = readFileSync(new URL('./dev-residual-clear-media.mjs', import.meta.url), 'utf8');
const http = readFileSync(new URL('./dev-residual-clear-http.py', import.meta.url), 'utf8');

test('apply requires exact develop SHA, explicit DEV, confirmation and locks', () => {
  for (const marker of [
    'DEV_RESIDUAL_RESET_TARGET:-',
    'DEV_RESIDUAL_RESET_CONFIRM:-',
    'CLEAR_DEV_ONLY_RESIDUAL_DATA',
    'EXPECTED_COMMIT',
    'origin/develop',
    'kurvenfunk-dev',
    '.env.dev',
    'kurvenfunk-dev-deploy.lock',
    'kurvenfunk-dev-full-application-reset.lock',
  ]) {
    assert.ok(shell.includes(marker), marker);
  }
  assert.match(shell, /DEV_RESIDUAL_RESULT=PLAN_ONLY_NO_MUTATION/);
  assert.match(shell, /DEV_RESIDUAL_ALL_BACKUPS=PRIVATE_AND_VERIFIED/);
  assert.match(shell, /stop cloudflared api worker/);
  assert.match(shell, /start cloudflared/);
});

test('all affected stores have verified backups and no schema/realm wipes', () => {
  for (const store of ['postgres', 'keycloak', 'minio', 'redis', 'meilisearch', 'mailpit']) {
    assert.ok(shell.includes(store), store);
  }
  assert.match(shell, /pg_restore --file \/dev\/null/);
  assert.match(shell, /gzip -t/);
  assert.match(shell, /tar -tzf/);
  assert.match(shell, /dev-full-app-reset\.sql/);
  assert.doesNotMatch(shell, /DROP DATABASE|DROP SCHEMA|docker volume rm|redis-cli FLUSHALL/i);
});

test('Keycloak preserves service and privileged users using Admin API', () => {
  assert.match(keycloak, /service-account-/);
  assert.match(keycloak, /realm-management/);
  assert.match(keycloak, /manage-users/);
  assert.match(keycloak, /kcadm\.sh/);
  assert.match(keycloak, /--realm master/);
  assert.match(keycloak, /delete "users\/\$id" -r kurvenfunk/);
  assert.doesNotMatch(keycloak, /delete realms\/|TRUNCATE/i);
});

test('MinIO cleanup handles object versions and incomplete uploads without buckets deletion', () => {
  for (const command of [
    'ListObjectsV2Command',
    'ListObjectVersionsCommand',
    'DeleteObjectsCommand',
    'ListMultipartUploadsCommand',
    'AbortMultipartUploadCommand',
  ]) {
    assert.ok(media.includes(command), command);
  }
  assert.match(media, /STORAGE_BUCKET/);
  assert.doesNotMatch(media, /DeleteBucketCommand|PutBucketPolicyCommand/);
});

test('Meilisearch and Mailpit deletion preserve service configuration', () => {
  assert.match(http, /\/indexes\/.*\/documents/);
  assert.match(http, /\/api\/v1\/messages/);
  assert.match(http, /"IDs": \[\]/);
  assert.doesNotMatch(http, /delete index|DROP TABLE/i);
});

// Keep the quoted Bash argument simple: escaped SQL quote characters once made
// to_regclass() look for a non-existent table and blocked a valid DEV preflight.
test('DEV Prisma migration history preflight uses an unescaped literal relation name', () => {
  assert.ok(shell.includes("to_regclass('public._prisma_migrations') IS NOT NULL"));
  const checkLine = shell.split('\n').find((line) => line.includes('to_regclass('));
  assert.ok(checkLine);
  assert.doesNotMatch(checkLine, /\\\\/);
});

test('Keycloak fails closed when SQL, Admin count or both listings disagree', () => {
  assert.match(keycloak, /DEV_KEYCLOAK_SQL_REGULAR_BEFORE/);
  assert.match(keycloak, /get users\/count -r kurvenfunk/);
  assert.match(keycloak, /get users -r kurvenfunk --offset/);
  assert.match(keycloak, /get users -r kurvenfunk -q first=0 -q max=200/);
  assert.match(keycloak, /KEYCLOAK_ENUMERATION_NOT_COMPLETE/);
  assert.match(keycloak, /KEYCLOAK_REGULAR_USERS_REMAIN_AFTER_DELETE/);
  assert.match(keycloak, /DEV_KEYCLOAK_CLEAR_RESULT=PASS_VERIFIED/);
});

test('Keycloak supports a no-delete plan with SHA and DEV locks', () => {
  assert.match(keycloak, /DEV_KEYCLOAK_CLEAR_MODE/);
  assert.match(keycloak, /DEV_KEYCLOAK_PLAN_RESULT=PASS_READ_ONLY_NO_MUTATION/);
  assert.match(keycloak, /EXPECTED_COMMIT/);
  assert.match(keycloak, /origin\/develop/);
  assert.match(keycloak, /DEV_RESIDUAL_DELETE_CONFIRM/);
});
