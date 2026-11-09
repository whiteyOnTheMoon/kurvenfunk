#!/usr/bin/env bash
# Phase 20.190 – read-only DEV verification; never access real appeals or modify users.
set -Eeuo pipefail
set +x
umask 077
cd /home/ap/www/kurvenfunk || exit 1
if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ]]; then
  echo "PHASE20_190_DEV_PRECHECK: WRONG_CHECKOUT" >&2
  exit 1
fi
if [[ ! -f .env.dev || -z "${EXPECTED_COMMIT:-}" ||
      "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
      -n "$(git status --porcelain)" ||
      "$(stat -c %a .env.dev)" != 600 ]]; then
  echo "PHASE20_190_DEV_PRECHECK: INVALID_ENV_OR_COMMIT" >&2
  exit 1
fi

docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml exec -T api node --input-type=module <<'JS'
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('reflect-metadata');
const { AppealsService } = require('./dist/modules/appeals/appeals.service.js');
const { ModerationAppealsController } = require('./dist/modules/appeals/appeals.controller.js');
const { PermissionsService } = require('./dist/modules/permissions/permissions.service.js');
const { PERMISSIONS, REQUIRED_PERMISSIONS_METADATA_KEY } =
  require('./dist/modules/permissions/permissions.constants.js');
const assert = (ok) => { if (!ok) throw new Error('PHASE20_190_DEV_ASSERTION'); };
assert(process.env.APPEAL_FOUR_EYES_ENABLED !== 'true');
assert(process.env.IP_TEMP_BLOCK_ENABLED !== 'true');
assert(process.env.IP_TEMP_AUTO_BLOCK_ENABLED !== 'true');
const service = new AppealsService();
try {
  assert(service.isFourEyesEnabled() === false);
  const permissions = new PermissionsService();
  const has = (roles, permission, status = 'ACTIVE') =>
    permissions.hasPermission({ roles, status }, permission);
  assert(has(['ADMIN'], PERMISSIONS.USER_BAN));
  assert(has(['SUPERADMIN'], PERMISSIONS.USER_BAN));
  assert(!has(['MODERATOR'], PERMISSIONS.USER_BAN));
  assert(!has(['ADMIN'], PERMISSIONS.USER_BAN, 'BANNED'));
  const metadata = (method) => Reflect.getMetadata(
    REQUIRED_PERMISSIONS_METADATA_KEY,
    Object.getOwnPropertyDescriptor(ModerationAppealsController.prototype, method)?.value,
  );
  assert(JSON.stringify(metadata('policy')) === JSON.stringify([PERMISSIONS.USER_WARN]));
  for (const method of ['listPending', 'approve', 'decide']) {
    assert(JSON.stringify(metadata(method)) === JSON.stringify([PERMISSIONS.USER_BAN]));
  }
  for (const endpoint of [
    '/api/v1/moderation/appeals/policy',
    '/api/v1/moderation/appeals/pending',
  ]) {
    const response = await fetch('http://127.0.0.1:3000' + endpoint);
    assert(response.status === 401);
  }
  const attempt = await fetch(
    'http://127.0.0.1:3000/api/v1/moderation/appeals/11111111-1111-4111-8111-111111111111/approval',
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' },
  );
  assert(attempt.status === 401);
  console.log('PHASE20_190_DEV_FOUR_EYES: PASS (default OFF, compiled RBAC, anonymous HTTP 401, no user/appeal reads or writes)');
} finally {
  await service.onModuleDestroy();
}
JS
