#!/usr/bin/env bash
# DEV-only Task 185: ephemerally keyed documentation IP; synthetic RED and actor.
set -Eeuo pipefail
set +x
umask 077
cd /home/ap/www/kurvenfunk || exit 1
if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ]]; then
  echo "PHASE20_185_DEV_PRECHECK: WRONG_CHECKOUT" >&2; exit 1
fi
if [[ ! -f .env.dev || -z "$EXPECTED_COMMIT" ||
      "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
      -n "$(git status --porcelain)" ||
      "$(stat -c %a .env.dev)" != 600 ]]; then
  echo "PHASE20_185_DEV_PRECHECK: INVALID_ENV_OR_COMMIT" >&2; exit 1
fi

docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml exec -T api node --input-type=module <<'JS'
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { createPrismaClient } from '@kurvenfunk/database';

const require = createRequire(import.meta.url);
const { IpIdentityService } = require('./dist/modules/bans/ip-identity.service.js');
const { RedCardIpProtectionService } = require('./dist/modules/bans/red-card-ip-protection.service.js');
const { PermissionsService } = require('./dist/modules/permissions/permissions.service.js');
const { PERMISSIONS } = require('./dist/modules/permissions/permissions.constants.js');
const assert = (x) => { if (!x) throw new Error('PHASE20_185_DEV_ASSERT'); };
const flagsOff = () => process.env.IP_TEMP_BLOCK_ENABLED !== 'true' &&
  process.env.IP_TEMP_AUTO_BLOCK_ENABLED !== 'true';
if (!flagsOff()) throw new Error('PHASE20_185_DEV_FLAGS_MUST_BE_OFF');

const testSecret = randomBytes(32).toString('base64url');
const config = { get: (k, fallback) => ({
  IP_HASH_HMAC_SECRET: testSecret,
  IP_HASH_KEY_VERSION: 'v1',
  IP_HASH_PREVIOUS_KEYS_JSON: '',
})[k] ?? fallback };
const identity = new IpIdentityService(config);
const permissions = new PermissionsService();
const allowed = (role, status = 'ACTIVE') =>
  permissions.hasPermission({ roles: [role], status }, PERMISSIONS.USER_IPBAN);
assert(allowed('SUPERADMIN'));
for (const role of ['USER', 'TRUSTED_USER', 'EDITOR', 'MODERATOR', 'ADMIN'])
  assert(!allowed(role));
assert(!allowed('SUPERADMIN', 'LIMITED'));
assert(!allowed('SUPERADMIN', 'BANNED'));

const db = createPrismaClient();
const protection = new RedCardIpProtectionService(identity);
const marker = randomBytes(8).toString('hex');
const reason = 'SYNTHETIC_P185';
let actorId = null;
let targetId = null;
let cardId = null;
let failed = false;
let cleaned = false;
try {
  actorId = (await db.user.create({
    data: {
      keycloakSubject: 'p185-dev-admin-' + marker,
      nickname: 'p185root' + marker,
      status: 'ACTIVE',
      onboardingCompleted: true,
      roleAssignments: { create: { role: 'SUPERADMIN' } },
    },
    select: { id: true },
  })).id;
  targetId = (await db.user.create({
    data: {
      keycloakSubject: 'p185-dev-target-' + marker,
      nickname: 'p185test' + marker,
      status: 'BANNED',
      onboardingCompleted: true,
      roleAssignments: { create: { role: 'USER' } },
    },
    select: { id: true },
  })).id;
  cardId = (await db.moderationCard.create({
    data: {
      userId: targetId,
      moderatorId: actorId,
      type: 'RED',
      status: 'ACTIVE',
      reasonCode: reason,
      moderatorNote: 'Synthetic example; no actual user/IP',
      escalationSource: 'MANUAL',
    },
    select: { id: true },
  })).id;
  assert(await db.sanction.count({ where: { sourceCardId: cardId, type: 'IP_BLOCK' } }) === 0);

  const issued = await protection.issue({
    cardId, actorUserId: actorId,
    address: '192.0.2.185',
    duration: '15M',
    reasonCode: reason,
    moderatorNote: 'Synthetic evidence, shared IP impact acknowledged',
    sharedIpRiskAccepted: true,
  });
  assert(issued.redCardId === cardId && issued.active);
  assert(issued.expiresAt.getTime() - issued.startsAt.getTime() === 900000);
  assert(!JSON.stringify(issued).includes('192.0.2.185'));
  const block = await db.iPBlock.findUniqueOrThrow({ where: { id: issued.id } });
  const sanction = await db.sanction.findUniqueOrThrow({ where: { id: issued.sanctionId } });
  assert(block.active && block.source === 'SANCTION' && block.createdById === actorId);
  assert(block.hashKeyVersion === 'v1' && block.ipHash.length === 64);
  assert(sanction.type === 'IP_BLOCK' && sanction.status === 'ACTIVE');
  assert(sanction.sourceCardId === cardId && sanction.ipBlockId === issued.id);
  assert(sanction.userId === null);
  assert(await db.auditLog.count({ where: { ipBlockId: issued.id } }) === 2);

  let conflict = false;
  try {
    await protection.issue({
      cardId, actorUserId: actorId,
      address: '2001:db8::185',
      duration: '15M', reasonCode: reason,
      moderatorNote: 'Duplicate synthetic attempt', sharedIpRiskAccepted: true,
    });
  } catch (e) { conflict = e?.status === 409; }
  assert(conflict);
  const reversed = await protection.revoke({
    cardId, blockId: issued.id, actorUserId: actorId,
    reasonCode: 'SYNTHETIC_REVOKED', moderatorNote: 'Synthetic reversal',
  });
  assert(!reversed.active && reversed.sanctionId === sanction.id);
  assert(!(await db.iPBlock.findUniqueOrThrow({ where: { id: issued.id } })).active);
  assert((await db.sanction.findUniqueOrThrow({ where: { id: issued.sanctionId } })).status === 'REVOKED');
  assert(await db.auditLog.count({ where: { ipBlockId: issued.id } }) === 4);
  assert((await db.moderationCard.findUniqueOrThrow({ where: { id: cardId } })).status === 'ACTIVE');
  assert((await db.user.findUniqueOrThrow({ where: { id: targetId } })).status === 'BANNED');
  assert(flagsOff());
} catch {
  failed = true;
} finally {
  // Unique synthetic creator IDs bound the cleanup. Fail on any incomplete cleanup.
  try {
    if (actorId) {
      const blocks = await db.iPBlock.findMany({
        where: { createdById: actorId, source: 'SANCTION', reasonCode: reason },
        select: { id: true },
      });
      for (const b of blocks) {
        await db.auditLog.deleteMany({ where: { ipBlockId: b.id, actorUserId: actorId } });
        await db.sanction.deleteMany({ where: { ipBlockId: b.id, createdById: actorId } });
        await db.iPBlock.delete({ where: { id: b.id } });
      }
    }
    if (cardId) {
      await db.auditLog.deleteMany({ where: { moderationCardId: cardId, actorUserId: actorId } });
      await db.moderationCard.delete({ where: { id: cardId } });
    }
    if (actorId) await db.userRoleAssignment.deleteMany({ where: { userId: actorId } });
    if (targetId) await db.userRoleAssignment.deleteMany({ where: { userId: targetId } });
    if (targetId) await db.user.delete({ where: { id: targetId } });
    if (actorId) await db.user.delete({ where: { id: actorId } });
    cleaned = true;
  } catch { failed = true; }
  try { await protection.onModuleDestroy(); } catch { failed = true; }
  try { await db.$disconnect(); } catch { failed = true; }
}
if (failed || !cleaned || !flagsOff()) {
  console.error('PHASE20_185_DEV_SMOKE: FAIL (check synthetic cleanup)');
  process.exitCode = 1;
} else {
  console.log('PHASE20_185_DEV_SMOKE: PASS (RED association, short HMAC block, reversal, audit, cleanup)');
}
JS
