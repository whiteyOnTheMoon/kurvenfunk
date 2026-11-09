#!/usr/bin/env bash
# Task 20.187 – read-only DEV runtime and role/privacy dashboard acceptance.
set -Eeuo pipefail
set +x
umask 077

cd /home/ap/www/kurvenfunk || exit 1
if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ]]; then
  echo "PHASE20_187_DEV_PRECHECK: WRONG_CHECKOUT" >&2
  exit 1
fi
if [[ ! -f .env.dev || -z "$EXPECTED_COMMIT" ||
      "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
      -n "$(git status --porcelain)" ||
      "$(stat -c %a .env.dev)" != 600 ]]; then
  echo "PHASE20_187_DEV_PRECHECK: INVALID_ENV_OR_COMMIT" >&2
  exit 1
fi

docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml exec -T api node --input-type=module <<'JS'
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('reflect-metadata');
const { ModerationDashboardService } =
  require('./dist/modules/moderation/moderation-dashboard.service.js');
const { ModerationDashboardController } =
  require('./dist/modules/moderation/moderation-dashboard.controller.js');
const { PermissionsService } =
  require('./dist/modules/permissions/permissions.service.js');
const { PERMISSIONS, REQUIRED_PERMISSIONS_METADATA_KEY } =
  require('./dist/modules/permissions/permissions.constants.js');

const assert = (condition) => {
  if (!condition) throw new Error('PHASE20_187_DEV_ASSERTION');
};
if (process.env.IP_TEMP_BLOCK_ENABLED === 'true' ||
    process.env.IP_TEMP_AUTO_BLOCK_ENABLED === 'true') {
  throw new Error('PHASE20_187_DEV_UNSAFE_NETWORK_FLAGS');
}

const policies = new PermissionsService();
const perm = (roles, permission, status = 'ACTIVE') =>
  policies.hasPermission({ roles, status }, permission);
assert(perm(['MODERATOR'], PERMISSIONS.USER_WARN));
assert(perm(['ADMIN'], PERMISSIONS.USER_WARN));
assert(perm(['SUPERADMIN'], PERMISSIONS.USER_WARN));
assert(perm(['SUPERADMIN'], PERMISSIONS.USER_IPBAN));
assert(!perm(['MODERATOR'], PERMISSIONS.USER_IPBAN));
assert(!perm(['ADMIN'], PERMISSIONS.USER_IPBAN));
assert(!perm(['EDITOR'], PERMISSIONS.USER_WARN));
assert(!perm(['USER'], PERMISSIONS.USER_WARN));
assert(!perm(['SUPERADMIN'], PERMISSIONS.USER_WARN, 'LIMITED'));
assert(!perm(['SUPERADMIN'], PERMISSIONS.USER_IPBAN, 'BANNED'));

function metadata(handler) {
  return Reflect.getMetadata(
    REQUIRED_PERMISSIONS_METADATA_KEY,
    Object.getOwnPropertyDescriptor(ModerationDashboardController.prototype, handler)?.value,
  );
}
assert(JSON.stringify(metadata('overview')) === JSON.stringify([PERMISSIONS.USER_WARN]));
assert(JSON.stringify(metadata('ipBlocksSummary')) === JSON.stringify([PERMISSIONS.USER_IPBAN]));

const service = new ModerationDashboardService();
let failed = false;
try {
  // No changes, test data creation or personal-data output. All data remain
  // inside the DEV API process and only boolean assertions leave the server.
  const overview = await service.overview();
  assert(overview.appeals?.available === true);
  assert(overview.ipBlocks?.access === 'SUPERADMIN_ONLY');
  for (const count of Object.values(overview.counts)) {
    assert(Number.isSafeInteger(count) && count >= 0);
  }
  for (const records of [
    overview.recentReports,
    overview.recentCards,
    overview.recentLimitedSanctions,
  ]) {
    assert(Array.isArray(records) && records.length <= 12);
  }
  const network = await service.ipBlocksSummary();
  assert(network.note === 'NETWORK_ADDRESS_NOT_DISPLAYED');
  for (const count of Object.values(network.counts)) {
    assert(Number.isSafeInteger(count) && count >= 0);
  }
  assert(Array.isArray(network.recentBlocks) && network.recentBlocks.length <= 12);
  for (const item of network.recentBlocks) {
    const allowedFields = new Set([
      'id', 'source', 'reasonCode', 'active', 'startsAt', 'expiresAt', 'deactivatedAt',
    ]);
    assert(Object.keys(item).every((key) => allowedFields.has(key)));
  }
  const sensitive = ['moderatorNote', 'internalNote', 'ipHash', 'hashKeyVersion',
    'createdById', 'deactivationReason', 'details', 'metadata'];
  const payload = JSON.stringify({ overview, network });
  for (const key of sensitive) {
    assert(!payload.includes('"' + key + '":'));
  }
  assert(process.env.IP_TEMP_BLOCK_ENABLED !== 'true' &&
    process.env.IP_TEMP_AUTO_BLOCK_ENABLED !== 'true');
} catch {
  failed = true;
} finally {
  try { await service.onModuleDestroy(); } catch { failed = true; }
}
if (failed) {
  console.error('PHASE20_187_DEV_DASHBOARD: FAIL');
  process.exitCode = 1;
} else {
  console.log('PHASE20_187_DEV_DASHBOARD: PASS (real read-only compiled service, role split, privacy and bounds)');
}
JS
