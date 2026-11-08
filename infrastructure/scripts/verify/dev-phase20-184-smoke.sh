#!/usr/bin/env bash
# Task 20.184 – DEV only, synthetic actor and documentation IP, strict cleanup.
set -Eeuo pipefail
set +x
umask 077

cd /home/ap/www/kurvenfunk || exit 1
if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ]]; then
  echo "PHASE20_184_DEV_PRECHECK: WRONG_CHECKOUT" >&2
  exit 1
fi
if [[ ! -f .env.dev || -z "${EXPECTED_COMMIT:-}" ||
      "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
      -n "$(git status --porcelain)" ]]; then
  echo "PHASE20_184_DEV_PRECHECK: COMMIT_OR_ENV_MISMATCH" >&2
  exit 1
fi
if [[ "$(stat -c %a .env.dev)" != 600 ]]; then
  echo "PHASE20_184_DEV_PRECHECK: ENV_PERMISSIONS" >&2
  exit 1
fi

docker compose \
  -p kurvenfunk-dev \
  --env-file .env.dev \
  -f compose.yml \
  -f compose.dev.yml \
  exec -T api node --input-type=module <<'JS'
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { createPrismaClient } from '@kurvenfunk/database';

const require = createRequire(import.meta.url);
const { IpIdentityService } = require('./dist/modules/bans/ip-identity.service.js');
const { TemporaryIpBlockService } = require('./dist/modules/bans/temporary-ip-block.service.js');
const { PermissionsService } = require('./dist/modules/permissions/permissions.service.js');
const { PERMISSIONS } = require('./dist/modules/permissions/permissions.constants.js');
const assert = (valid) => { if (!valid) throw new Error('PHASE20_184_SMOKE_ASSERTION'); };

if (process.env.IP_TEMP_BLOCK_ENABLED === 'true' ||
    process.env.IP_TEMP_AUTO_BLOCK_ENABLED === 'true') {
  throw new Error('PHASE20_184_UNSAFE_TEST_ENV');
}

const secret = randomBytes(32).toString('base64url');
const config = { get: (key, fallback) => ({
  IP_HASH_HMAC_SECRET: secret,
  IP_HASH_KEY_VERSION: 'v1',
  IP_HASH_PREVIOUS_KEYS_JSON: '',
})[key] ?? fallback };
const identity = new IpIdentityService(config);
const permissions = new PermissionsService();
const permitted = (role, status = 'ACTIVE') =>
  permissions.hasPermission({ roles: [role], status }, PERMISSIONS.USER_IPBAN);
assert(permitted('SUPERADMIN'));
for (const role of ['USER', 'TRUSTED_USER', 'MODERATOR', 'EDITOR', 'ADMIN']) {
  assert(!permitted(role));
}
assert(!permitted('SUPERADMIN', 'LIMITED'));
assert(!permitted('SUPERADMIN', 'BANNED'));

const db = createPrismaClient();
const blocks = new TemporaryIpBlockService(identity);
let actorId = null;
let failed = false;
let cleaned = false;
try {
  const marker = randomBytes(8).toString('hex');
  const actor = await db.user.create({
    data: {
      keycloakSubject: 'p184-dev-smoke-' + marker,
      nickname: 'p184smk' + marker,
      status: 'ACTIVE',
      onboardingCompleted: true,
      roleAssignments: { create: { role: 'SUPERADMIN' } },
    },
    select: { id: true },
  });
  actorId = actor.id;

  // RFC 5737 documentation IP and fresh ephemeral HMAC key; never a real user IP.
  const created = await blocks.issueManual(
    '192.0.2.184', '24H', actorId, 'SYNTHETIC_TEST', 'Temporary private DEV test note',
  );
  assert(created.sanctionId && created.active);
  const stored = await db.iPBlock.findUniqueOrThrow({ where: { id: created.id } });
  assert(stored.source === 'MANUAL' && stored.active);
  assert(stored.ipHash.length === 64 && stored.hashKeyVersion === 'v1');
  assert(stored.createdById === actorId);
  assert(await db.auditLog.count({ where: { ipBlockId: created.id } }) === 2);

  let duplicateRejected = false;
  try {
    await blocks.issueManual('192.0.2.184', '24H', actorId, 'SYNTHETIC_TEST', 'Duplicate');
  } catch (error) {
    duplicateRejected = error?.status === 409;
  }
  assert(duplicateRejected);

  const revoked = await blocks.revokeManual(
    created.id, actorId, 'TEST_REVERSED', 'Reversal of synthetic test',
  );
  assert(!revoked.active && revoked.sanctionId === created.sanctionId);
  const after = await db.iPBlock.findUniqueOrThrow({ where: { id: created.id } });
  assert(!after.active && after.deactivatedById === actorId);
  const sanction = await db.sanction.findUniqueOrThrow({
    where: { id: created.sanctionId },
  });
  assert(sanction.status === 'REVOKED' && sanction.revokedById === actorId);
  assert(await db.auditLog.count({ where: { ipBlockId: created.id } }) === 4);
} catch {
  failed = true;
} finally {
  // Always delete every record scoped to the unique test actor. Never query
  // or mutate other users or their IP blocks. A cleanup failure fails the job.
  try {
    if (actorId) {
      const records = await db.iPBlock.findMany({
        where: { createdById: actorId, source: 'MANUAL', reasonCode: 'SYNTHETIC_TEST' },
        select: { id: true },
      });
      for (const record of records) {
        await db.auditLog.deleteMany({ where: { ipBlockId: record.id } });
        await db.sanction.deleteMany({ where: { ipBlockId: record.id } });
        await db.iPBlock.delete({ where: { id: record.id } });
      }
      await db.userRoleAssignment.deleteMany({ where: { userId: actorId } });
      await db.user.delete({ where: { id: actorId } });
    }
    cleaned = true;
  } catch {
    failed = true;
  } finally {
    try { await blocks.onModuleDestroy(); } catch { failed = true; }
    try { await db.$disconnect(); } catch { failed = true; }
  }
}
if (failed || !cleaned) {
  console.error('PHASE20_184_DEV_SMOKE: FAIL (verify synthetic cleanup)');
  process.exitCode = 1;
} else {
  console.log('PHASE20_184_DEV_SMOKE: PASS (SUPERADMIN-only, synthetic ban/revoke/audit/cleanup)');
}
JS
