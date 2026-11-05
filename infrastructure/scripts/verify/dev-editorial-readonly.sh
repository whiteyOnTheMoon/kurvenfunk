#!/usr/bin/env bash
# Phase 17 DEV acceptance: read-only checks against the deployed system.
# No fixtures are created, no accounts are provisioned and no rows are modified.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:-}"
cd "$PROJECT_DIR"

if [[ "$(git branch --show-current)" != "develop" || ! -f .env.dev ]]; then
  echo "ERROR: This verification can only run in the develop checkout with .env.dev."
  exit 1
fi

if [[ -n "$EXPECTED_COMMIT" && "$(git rev-parse HEAD)" != "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: DEV does not run the tested commit."
  exit 1
fi

compose=(
  docker compose
  -p kurvenfunk-dev
  --env-file .env.dev
  -f compose.yml
  -f compose.dev.yml
)

echo "=== Phase 17: read-only DEV acceptance ==="
curl --fail --silent --show-error http://127.0.0.1:3100/health >/dev/null
curl --fail --silent --show-error http://127.0.0.1:3101/api/v1/health >/dev/null
echo "DEV web/API health: PASS"

# Protected editorial list must not be readable without authentication.
unauthorized_code="$(
  curl --silent --show-error --output /dev/null \
    --write-out '%{http_code}' \
    http://127.0.0.1:3101/api/v1/articles/editorial
)"
if [[ "$unauthorized_code" != "401" ]]; then
  echo "ERROR: Unauthenticated editorial list did not return 401."
  exit 1
fi
echo "Unauthenticated editorial access: PASS"

"${compose[@]}" exec -T worker node --input-type=module - <<'JS'
import { Queue } from 'bullmq';
import { createPrismaClient } from '@kurvenfunk/database';

class AcceptanceFailure extends Error {}
function check(condition, message) {
  if (!condition) throw new AcceptanceFailure(message);
}

const db = createPrismaClient();
const queue = new Queue('scheduled-publishing', {
  connection: {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  },
});

const apiUrl = 'http://api:3000/api/v1/articles/by-slug/';
const requestArticle = async (slug) => {
  const response = await fetch(apiUrl + encodeURIComponent(slug), {
    signal: AbortSignal.timeout(10_000),
    headers: { Accept: 'application/json' },
  });
  await response.body?.cancel();
  return response.status;
};

try {
  const schedulers = await queue.getJobSchedulers(0, 100);
  const scheduler = schedulers.find((entry) => entry.key === 'scheduled-publishing-scan');
  check(Boolean(scheduler), 'Scheduled publishing scheduler is not registered');
  check(
    Number(scheduler.every) === 30_000,
    'Scheduled publishing interval differs from 30 seconds',
  );
  console.log('Publishing scheduler (30s): PASS');

  const staleScheduled = await db.article.count({
    where: {
      deletedAt: null,
      status: 'SCHEDULED',
      scheduledAt: { lt: new Date(Date.now() - 10 * 60_000) },
    },
  });
  console.log('Scheduled articles more than 10 minutes overdue:', staleScheduled);
  check(staleScheduled === 0, 'Scheduled publishing backlog older than 10 minutes');

  const unpublished = await db.article.findMany({
    where: {
      deletedAt: null,
      status: { in: ['DRAFT', 'REVIEW', 'SCHEDULED', 'ARCHIVED'] },
    },
    select: { slug: true },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  });
  for (const article of unpublished) {
    const status = await requestArticle(article.slug);
    check(status === 404, 'Non-public article was accessible over the public API');
  }
  console.log(
    'Non-public article visibility:',
    unpublished.length ? 'PASS (' + unpublished.length + ' checked)' : 'NOT EXERCISED (no sample)',
  );

  const deleted = await db.article.findMany({
    where: { deletedAt: { not: null }, status: 'PUBLISHED' },
    select: { slug: true },
    take: 4,
  });
  for (const article of deleted) {
    const status = await requestArticle(article.slug);
    check(status === 404, 'Deleted article was accessible over the public API');
  }
  console.log(
    'Deleted article visibility:',
    deleted.length ? 'PASS (' + deleted.length + ' checked)' : 'NOT EXERCISED (no sample)',
  );

  const published = await db.article.findFirst({
    where: {
      deletedAt: null,
      status: 'PUBLISHED',
      publishedAt: { not: null, lte: new Date() },
    },
    select: { slug: true },
    orderBy: { publishedAt: 'desc' },
  });
  if (published) {
    const status = await requestArticle(published.slug);
    check(status === 200, 'Published article not reachable over public API');
  }
  console.log('Published article visibility:', published ? 'PASS' : 'NOT EXERCISED (no sample)');

  const storedMedia = await db.media.findFirst({
    where: { storageKey: { not: null }, status: 'ACTIVE' },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  });
  if (storedMedia) {
    const response = await fetch(
      'http://api:3000/api/v1/media/' + encodeURIComponent(storedMedia.id) + '/content',
      { signal: AbortSignal.timeout(15_000) },
    );
    check(response.status === 200, 'Stored media could not be retrieved through API');
    check(
      (response.headers.get('content-type') || '').startsWith('image/'),
      'Stored media did not return an image content type',
    );
    check(
      Number(response.headers.get('content-length')) > 0,
      'Stored media is empty or lacks a valid length',
    );
    await response.body?.cancel();
  }
  console.log('MinIO-backed media retrieval:', storedMedia ? 'PASS' : 'NOT EXERCISED (no sample)');

  const totalRevisions = await db.articleRevision.count();
  console.log('Revision records found:', totalRevisions);
  console.log('Phase 17 DEV read-only acceptance: PASS');
  console.log('No articles, accounts, queue jobs or storage objects were changed.');
} catch (error) {
  const reason = error instanceof AcceptanceFailure
    ? error.message
    : typeof error?.code === 'string'
      ? error.code
      : 'UNEXPECTED_ERROR';
  console.error('Phase 17 DEV read-only acceptance: FAILED (' + reason + ')');
  process.exitCode = 1;
} finally {
  await queue.close();
  await db.$disconnect();
}
JS
