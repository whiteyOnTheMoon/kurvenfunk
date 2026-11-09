#!/usr/bin/env bash
# Task 20.189 – read-only DEV verification of compiled appeals and public 401s.
set -Eeuo pipefail
set +x
umask 077

cd /home/ap/www/kurvenfunk || exit 1
if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ]]; then
  echo "PHASE20_189_DEV_PRECHECK: WRONG_CHECKOUT" >&2
  exit 1
fi
if [[ ! -f .env.dev || -z "$EXPECTED_COMMIT" ||
      "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
      -n "$(git status --porcelain)" ||
      "$(stat -c %a .env.dev)" != 600 ]]; then
  echo "PHASE20_189_DEV_PRECHECK: INVALID_ENV_OR_COMMIT" >&2
  exit 1
fi

docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml exec -T api node --input-type=module <<'JS'
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
require('reflect-metadata');
const { AppealsService } = require('./dist/modules/appeals/appeals.service.js');
const {
  AppealsController,
  ModerationAppealsController,
} = require('./dist/modules/appeals/appeals.controller.js');
const { AppealIdentityGuard } = require('./dist/modules/appeals/appeal-identity.guard.js');
const { PermissionsService } = require('./dist/modules/permissions/permissions.service.js');
const { PERMISSIONS, REQUIRED_PERMISSIONS_METADATA_KEY } =
  require('./dist/modules/permissions/permissions.constants.js');

const assert = (ok) => {
  if (!ok) throw new Error('PHASE20_189_DEV_ASSERTION');
};
assert(process.env.IP_TEMP_BLOCK_ENABLED !== 'true');
assert(process.env.IP_TEMP_AUTO_BLOCK_ENABLED !== 'true');

const policy = new PermissionsService();
const may = (roles, permission, status = 'ACTIVE') =>
  policy.hasPermission({ roles, status }, permission);
assert(may(['MODERATOR'], PERMISSIONS.USER_WARN));
assert(!may(['MODERATOR'], PERMISSIONS.USER_BAN));
assert(may(['ADMIN'], PERMISSIONS.USER_BAN));
assert(may(['SUPERADMIN'], PERMISSIONS.USER_BAN));
assert(!may(['USER'], PERMISSIONS.USER_BAN));
assert(!may(['SUPERADMIN'], PERMISSIONS.USER_BAN, 'BANNED'));

const permission = (controller, name) => Reflect.getMetadata(
  REQUIRED_PERMISSIONS_METADATA_KEY,
  Object.getOwnPropertyDescriptor(controller.prototype, name)?.value,
);
assert(JSON.stringify(permission(ModerationAppealsController, 'listOpen')) ===
  JSON.stringify([PERMISSIONS.USER_WARN]));
assert(JSON.stringify(permission(ModerationAppealsController, 'decide')) ===
  JSON.stringify([PERMISSIONS.USER_BAN]));

const guarded = (name) => Reflect.getMetadata(
  '__guards__',
  Object.getOwnPropertyDescriptor(AppealsController.prototype, name)?.value,
);
for (const name of ['create', 'eligible', 'listMine']) {
  assert(guarded(name)?.includes(AppealIdentityGuard));
}

const service = new AppealsService();
let failed = false;
try {
  // Query only an unassigned UUID; no existing user, private reason,
  // staff note, or notification is read from the shared DEV database.
  const unassigned = randomUUID();
  const [options, mine] = await Promise.all([
    service.eligible(unassigned),
    service.listMine(unassigned),
  ]);
  assert(Array.isArray(options.cards) && options.cards.length === 0);
  assert(Array.isArray(options.sanctions) && options.sanctions.length === 0);
  assert(Array.isArray(mine) && mine.length === 0);

  // Anonymous bearer requirements checked against the actual DEV API.
  for (const endpoint of [
    '/api/v1/appeals/eligible',
    '/api/v1/appeals/mine',
    '/api/v1/moderation/appeals',
  ]) {
    const response = await fetch('http://127.0.0.1:3000' + endpoint);
    assert(response.status === 401);
  }
  const submit = await fetch('http://127.0.0.1:3000/api/v1/appeals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert(submit.status === 401);
} catch {
  failed = true;
} finally {
  try { await service.onModuleDestroy(); } catch { failed = true; }
}
if (failed) {
  console.error('PHASE20_189_DEV_APPEALS: FAIL');
  process.exitCode = 1;
} else {
  console.log('PHASE20_189_DEV_APPEALS: PASS (compiled guards/RBAC, unassigned-only reads, anonymous 401, no real user data writes)');
}
JS
