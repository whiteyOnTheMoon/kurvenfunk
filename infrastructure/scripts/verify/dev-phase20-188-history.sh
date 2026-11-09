#!/usr/bin/env bash
# Task 20.188: strict read-only DEV verification of private user history.
set -Eeuo pipefail
set +x
umask 077

cd /home/ap/www/kurvenfunk || exit 1
if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ]]; then
  echo "PHASE20_188_DEV_PRECHECK: WRONG_CHECKOUT" >&2
  exit 1
fi
if [[ ! -f .env.dev || -z "$EXPECTED_COMMIT" ||
      "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
      -n "$(git status --porcelain)" ||
      "$(stat -c %a .env.dev)" != 600 ]]; then
  echo "PHASE20_188_DEV_PRECHECK: INVALID_ENV_OR_COMMIT" >&2
  exit 1
fi

docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml exec -T api node --input-type=module <<'JS'
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
require('reflect-metadata');
const { UserModerationHistoryService } =
  require('./dist/modules/moderation/user-moderation-history.service.js');
const { UserModerationHistoryController } =
  require('./dist/modules/moderation/user-moderation-history.controller.js');
const { PermissionsService } =
  require('./dist/modules/permissions/permissions.service.js');
const { PERMISSIONS, REQUIRED_PERMISSIONS_METADATA_KEY } =
  require('./dist/modules/permissions/permissions.constants.js');

const assert = (ok) => {
  if (!ok) throw new Error('PHASE20_188_DEV_ASSERTION_FAILED');
};
assert(process.env.IP_TEMP_BLOCK_ENABLED !== 'true');
assert(process.env.IP_TEMP_AUTO_BLOCK_ENABLED !== 'true');

const policy = new PermissionsService();
const allowed = (roles, status = 'ACTIVE') =>
  policy.hasPermission({ roles, status }, PERMISSIONS.USER_WARN);
assert(allowed(['MODERATOR']) && allowed(['ADMIN']) && allowed(['SUPERADMIN']));
assert(!allowed(['EDITOR']) && !allowed(['USER']) && !allowed(['TRUSTED_USER']));
assert(!allowed(['SUPERADMIN'], 'BANNED') && !allowed(['MODERATOR'], 'LIMITED'));

const descriptor = Object.getOwnPropertyDescriptor(
  UserModerationHistoryController.prototype, 'getUserHistory',
);
assert(typeof descriptor?.value === 'function');
assert(JSON.stringify(Reflect.getMetadata(
  REQUIRED_PERMISSIONS_METADATA_KEY, descriptor.value,
)) === JSON.stringify([PERMISSIONS.USER_WARN]));

const service = new UserModerationHistoryService();
let failed = false;
try {
  // The UUID is brand-new and unassigned. This is an actual database read,
  // but NEVER reads notes for existing DEV users or writes any fixture.
  const syntheticMissingUuid = randomUUID();
  let notFound = false;
  try {
    await service.history(syntheticMissingUuid);
  } catch (error) {
    notFound = typeof error.getStatus === 'function' && error.getStatus() === 404;
  }
  assert(notFound);

  // HTTP must reject unauthenticated callers *before* returning any history.
  const result = await fetch(
    'http://127.0.0.1:3000/api/v1/moderation/users/' + syntheticMissingUuid + '/history',
    { headers: { accept: 'application/json' } },
  );
  assert(result.status === 401);
} catch {
  failed = true;
} finally {
  try { await service.onModuleDestroy(); } catch { failed = true; }
}
if (failed) {
  console.error('PHASE20_188_DEV_HISTORY: FAIL');
  process.exitCode = 1;
} else {
  console.log('PHASE20_188_DEV_HISTORY: PASS (compiled role split, missing-user 404, anonymous HTTP 401, no DEV user-data reads or writes)');
}
JS
