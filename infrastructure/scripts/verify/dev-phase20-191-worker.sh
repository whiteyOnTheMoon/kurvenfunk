#!/usr/bin/env bash
# Task 20.191 – real DEV worker interval using only disposable synthetic records.
set -Eeuo pipefail
set +x
umask 077

cd /home/ap/www/kurvenfunk || exit 1
if [[ "$(id -un)" != ap || "$(git branch --show-current)" != develop ]]; then
  echo "PHASE20_191_DEV_PRECHECK: WRONG_CHECKOUT" >&2
  exit 1
fi
if [[ ! -f .env.dev || -z "${EXPECTED_COMMIT:-}" ||
      "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ||
      -n "$(git status --porcelain)" ||
      "$(stat -c %a .env.dev)" != 600 ]]; then
  echo "PHASE20_191_DEV_PRECHECK: INVALID_ENV_OR_COMMIT" >&2
  exit 1
fi

# Inspect effective Compose API settings without printing secret-bearing config.
docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml config --format json |
  node -e '
    let s="";
    process.stdin.on("data", x => { s+=x; });
    process.stdin.on("end", () => {
      const env=JSON.parse(s).services.api.environment;
      if(env.IP_TEMP_BLOCK_ENABLED !== "false" ||
         env.IP_TEMP_AUTO_BLOCK_ENABLED !== "false" ||
         env.APPEAL_FOUR_EYES_ENABLED !== "false") {
        console.error("PHASE20_191_DEV_PRECHECK: FLAGS_NOT_OFF");
        process.exitCode=1;
      }
    });
  '

docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml exec -T worker node --input-type=module <<'JS'
import { randomBytes, createHmac } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { createPrismaClient } from '@kurvenfunk/database';

// This script does not invoke the expiration service. It observes the existing
// running DEV worker's natural 60-second interval.
const assert = (v) => { if (!v) throw new Error('PHASE20_191_DEV_ASSERT'); };
const db = createPrismaClient();
const marker = randomBytes(8).toString('hex');
const reason = 'P191_SYNTHETIC_' + marker;
const deadline = new Date(Date.now() - 120_000);
const future = new Date(Date.now() + 3600_000);
let created = null;
let failed = false;
let cleaned = false;
try {
  created = await db.$transaction(async (tx) => {
    const restored = await tx.user.create({
      data: {
        keycloakSubject: 'p191-dev-restore-' + marker,
        nickname: 'p191restore' + marker,
        status: 'LIMITED',
        onboardingCompleted: true,
      },
      select: { id: true },
    });
    const banned = await tx.user.create({
      data: {
        keycloakSubject: 'p191-dev-banned-' + marker,
        nickname: 'p191banned' + marker,
        status: 'BANNED',
        onboardingCompleted: true,
      },
      select: { id: true },
    });
    const overlap = await tx.user.create({
      data: {
        keycloakSubject: 'p191-dev-overlap-' + marker,
        nickname: 'p191overlap' + marker,
        status: 'LIMITED',
        onboardingCompleted: true,
      },
      select: { id: true },
    });
    const limits = {};
    for (const [name,userId,type,expiresAt] of [
      ['limited',restored.id,'LIMITED',deadline],
      ['comment',restored.id,'COMMENT_BLOCK',deadline],
      ['forum',restored.id,'FORUM_BLOCK',deadline],
      ['bannedLimited',banned.id,'LIMITED',deadline],
      ['bannedBan',banned.id,'ACCOUNT_BAN',future],
      ['overlapExpired',overlap.id,'LIMITED',deadline],
      ['overlapFuture',overlap.id,'LIMITED',future],
    ]) {
      limits[name] = (await tx.sanction.create({
        data: {
          userId, type, status: 'ACTIVE',
          startsAt: new Date(deadline.getTime()-10_000),
          expiresAt, reasonCode: reason,
        },
        select: { id:true },
      })).id;
    }
    const block = await tx.iPBlock.create({
      data: {
        // RFC 5737 documentation IP with disposable HMAC key; never store raw IP.
        ipHash: createHmac('sha256',randomBytes(32)).update('192.0.2.191').digest('hex'),
        hashKeyVersion:'v1', reasonCode:reason, source:'MANUAL',
        active:true, expiresAt:deadline,
      },
      select:{id:true},
    });
    const linked = await tx.sanction.create({
      data: {
        ipBlockId:block.id, type:'IP_BLOCK', status:'ACTIVE',
        reasonCode:reason, expiresAt:deadline,
      },
      select:{id:true},
    });
    return {
      userIds:[restored.id,banned.id,overlap.id],
      restored:restored.id,banned:banned.id,overlap:overlap.id,
      sanctions:{...limits,ip:linked.id},blockId:block.id,
    };
  });

  const due = ['limited','comment','forum','bannedLimited','overlapExpired','ip'];
  let complete = false;
  const until = Date.now()+165_000;
  do {
    const [records,ipBlock,restored,banned,overlap] = await Promise.all([
      db.sanction.findMany({
        where:{id:{in:due.map(name=>created.sanctions[name])}},
        select:{id:true,status:true},
      }),
      db.iPBlock.findUniqueOrThrow({where:{id:created.blockId},select:{active:true}}),
      db.user.findUniqueOrThrow({where:{id:created.restored},select:{status:true}}),
      db.user.findUniqueOrThrow({where:{id:created.banned},select:{status:true}}),
      db.user.findUniqueOrThrow({where:{id:created.overlap},select:{status:true}}),
    ]);
    complete=records.length===due.length && records.every(x=>x.status==='EXPIRED')
      && !ipBlock.active && restored.status==='ACTIVE'
      && banned.status==='BANNED' && overlap.status==='LIMITED';
    if(!complete && Date.now()<until) await sleep(3000);
    else break;
  } while(true);
  assert(complete);
  for (const name of due) {
    assert(await db.auditLog.count({
      where:{sanctionId:created.sanctions[name],action:'SANCTION_EXPIRED'},
    })===1);
  }
  assert(await db.auditLog.count({
    where:{ipBlockId:created.blockId,action:'IP_BLOCK_EXPIRED'},
  })===1);
  assert(await db.auditLog.count({
    where:{targetUserId:created.restored,action:'USER_STATUS_CHANGED',reason:'LIMITED_EXPIRED'},
  })===1);
  assert((await db.sanction.findUniqueOrThrow({where:{id:created.sanctions.bannedBan}})).status==='ACTIVE');
  assert((await db.sanction.findUniqueOrThrow({where:{id:created.sanctions.overlapFuture}})).status==='ACTIVE');
} catch {
  failed=true;
} finally {
  try {
    if(created) {
      const sanctionIds=Object.values(created.sanctions);
      await db.auditLog.deleteMany({
        where:{
          OR:[
            {targetUserId:{in:created.userIds}},
            {sanctionId:{in:sanctionIds}},
            {ipBlockId:created.blockId},
          ],
        },
      });
      await db.notification.deleteMany({where:{userId:{in:created.userIds}}});
      await db.sanction.deleteMany({where:{id:{in:sanctionIds}}});
      await db.iPBlock.delete({where:{id:created.blockId}});
      await db.user.deleteMany({where:{id:{in:created.userIds}}});
      assert(await db.user.count({where:{id:{in:created.userIds}}})===0);
      assert(await db.sanction.count({where:{id:{in:sanctionIds}}})===0);
      assert(await db.iPBlock.count({where:{id:created.blockId}})===0);
    }
    cleaned=true;
  } catch { failed=true; }
  try { await db.$disconnect(); } catch { failed=true; }
}
if(failed || !cleaned) {
  console.error('PHASE20_191_DEV_WORKER: FAIL (synthetic worker interval or cleanup)');
  process.exitCode=1;
} else {
  console.log('PHASE20_191_DEV_WORKER: PASS (real interval; LIMITED/COMMENT/FORUM/IP expiry, BANNED/overlap preserved, audit once, synthetic cleanup)');
}
JS
