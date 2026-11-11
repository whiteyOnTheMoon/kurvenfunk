#!/usr/bin/env bash
# Read-only APA-OTS verification; never run on STAGING or PROD.
set -Eeuo pipefail
set +x
cd /home/ap/www/kurvenfunk || exit 1
test "$(git branch --show-current)" = "develop"
if [[ -n "${EXPECTED_COMMIT:-}" ]]; then
  test "$(git rev-parse HEAD)" = "$EXPECTED_COMMIT" || {
    echo "DEV-Commit entspricht nicht dem getesteten SHA" >&2
    exit 1
  }
fi

# Following the authorized DEV reset, scheduled imports deliberately remain off.
# In that state, verify the absence of old repeat schedules instead of requiring
# a provider row, successful feed jobs or new application data.
scheduler_enabled="$(docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml exec -T worker printenv NEWS_IMPORT_SCHEDULER_ENABLED | tr -d '\r')"
if [[ "$scheduler_enabled" == false ]]; then
  docker compose -p kurvenfunk-dev --env-file .env.dev \
    -f compose.yml -f compose.dev.yml exec -T worker node --input-type=module - <<'JS'
import { Queue } from 'bullmq';
const queue = new Queue('news-import', {
  connection: {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  },
});
try {
  const schedulers = await queue.getJobSchedulers(0, 100);
  if (schedulers.some(s => s.key === 'news-import-ots' || s.key === 'news-import-fake')) {
    throw new Error('STALE_NEWS_REPEAT_SCHEDULER');
  }
  console.log('DEV_OTS_MODE=DISABLED_AS_CONFIGURED');
  console.log('DEV_OTS_REPEAT_SCHEDULERS=NONE');
  console.log('DEV_OTS_ACCEPTANCE=PASS_DISABLED_MODE');
} finally {
  await queue.close();
}
JS
  exit 0
fi
[[ "$scheduler_enabled" == true ]] || { echo "ERROR: INVALID_NEWS_SCHEDULER_MODE"; exit 1; }

docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml config --format json | python3 -c '
import json
import sys
env = json.load(sys.stdin)["services"]["worker"]["environment"]
for key, value in {
    "NEWS_IMPORT_PROVIDER": "ots",
    "NEWS_IMPORT_SCHEDULER_ENABLED": "true",
    "NEWS_IMPORT_SCHEDULER_INTERVAL_MS": "900000",
}.items():
    if str(env.get(key, "")) != value:
        raise SystemExit("DEV-Konfiguration unerwartet: " + key)
if not env.get("NEWS_OTS_API_KEY"):
    raise SystemExit("APA-OTS API-Zugang fehlt")
print("DEV-Konfiguration: OK")
'

docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml \
  exec -T worker node --input-type=module - <<'JS'
import { Queue } from 'bullmq';
import { createPrismaClient } from '@kurvenfunk/database';

const db = createPrismaClient();
const queue = new Queue('news-import', {
  connection: {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null
  }
});

class VerificationError extends Error {}

function check(ok, message) {
  if (!ok) throw new VerificationError(message);
}

try {
  const schedulers = await queue.getJobSchedulers(0, 100);
  const otsScheduler = schedulers.find(s => s.key === 'news-import-ots');
  check(otsScheduler && Number(otsScheduler.every) === 900000, 'OTS-Scheduler fehlerhaft');
  check(!schedulers.some(s => s.key === 'news-import-fake'), 'Fake-Scheduler vorhanden');

  const ots = await db.provider.findUnique({ where: { key: 'ots' } });
  check(ots, 'APA-OTS Provider fehlt');
  check(!(await db.provider.findUnique({ where: { key: 'fake' } })),
    'Fake-Provider vorhanden');

  const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const where = {
    providerId: ots.id,
    kind: 'NEWS_FETCH',
    windowStart: { not: null },
    createdAt: { gte: since }
  };
  const count = await db.importJob.count({ where });
  check(count <= 200, 'Mehr als 200 Jobs im Sechs-Stunden-Fenster');

  const jobs = await db.importJob.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, createdAt: true, status: true,
      receivedCount: true, processedCount: true,
      duplicateCount: true, failedCount: true, errorCode: true
    }
  });

  const grouped = jobs.length
    ? await db.importRecord.groupBy({
        by: ['status'],
        where: { importJobId: { in: jobs.map(job => job.id) } },
        _count: { _all: true }
      })
    : [];

  const unreviewedPublished = await db.article.count({
    where: {
      status: 'PUBLISHED',
      importRecord: {
        is: {
          providerId: ots.id,
          importJob: { is: { windowStart: { not: null } } },
          OR: [{ reviewDecision: null }, { reviewDecision: 'REJECTED' }]
        }
      }
    }
  });

  const redis = await queue.getJobCounts('failed', 'waiting', 'active', 'delayed');
  const succeeded = jobs.filter(job => job.status === 'SUCCEEDED').length;
  const failed = jobs.filter(job =>
    ['FAILED', 'PARTIALLY_SUCCEEDED', 'DEAD_LETTER'].includes(job.status)
  ).length;
  const received = jobs.reduce((n, job) => n + job.receivedCount, 0);

  console.log('==========================================');
  console.log('APA-OTS DEV – AUTOMATIK-ABNAHME (LESEND)');
  console.log('==========================================');
  console.log('Beginn:', since.toISOString());
  console.log('Zeitfenster-Importjobs:', count);
  console.log('Erfolgreich:', succeeded);
  console.log('Fehlgeschlagen:', failed);
  console.log('Empfangene Meldungen:', received);
  console.log('Recordstatus:', JSON.stringify(
    Object.fromEntries(grouped.map(row => [row.status, row._count._all]))
  ));
  console.log('Redis:', JSON.stringify(redis));
  console.log('Veröffentlichungen ohne Review:', unreviewedPublished);

  for (const job of jobs.slice(0, 8)) {
    console.log(
      job.createdAt.toISOString(), job.status,
      'Eingang:', job.receivedCount,
      'Dubletten:', job.duplicateCount,
      'Fehler:', job.failedCount,
      'Code:', job.errorCode ?? '-'
    );
  }

  check(succeeded > 0, 'Kein erfolgreicher automatischer Abruf im Prüfzeitraum');
  check(failed === 0 && redis.failed === 0, 'Importfehler vorhanden');
  check(unreviewedPublished === 0, 'Ungeprüfte Artikel wurden veröffentlicht');

  console.log('Scheduler und Sicherheitsprüfung: BESTANDEN');
  console.log('Datensatz-E2E:', received > 0
    ? 'EINGANG NACHGEWIESEN'
    : 'NOCH OFFEN – im Zeitraum keine Meldungen');
  console.log('Es wurden keine Daten verändert.');
} catch (error) {
  const reason = error instanceof VerificationError
    ? error.message
    : (typeof error?.code === 'string' ? error.code : 'UNEXPECTED_ERROR');
  console.error('ABNAHME NICHT BESTANDEN:', reason);
  process.exitCode = 1;
} finally {
  await queue.close();
  await db.$disconnect();
}
JS
