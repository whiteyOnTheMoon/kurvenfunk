#!/usr/bin/env bash
# Phase 23.225 read-only DEV PostgreSQL outbox schema verification.
set -Eeuo pipefail
set +x

PROJECT_DIR="${PROJECT_DIR:-$HOME/www/kurvenfunk}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:?Exact tested develop SHA required}"
cd "$PROJECT_DIR"
[[ "$(git branch --show-current)" == develop && -f .env.dev && ! -L .env.dev ]] || {
  echo 'ERROR: PHASE23_225_NOT_DEV'; exit 1;
}
[[ "$(git rev-parse HEAD)" == "$EXPECTED_COMMIT" && -z "$(git status --porcelain)" ]] || {
  echo 'ERROR: PHASE23_225_COMMIT_MISMATCH'; exit 1;
}

docker compose -p kurvenfunk-dev --env-file .env.dev \
  -f compose.yml -f compose.dev.yml exec -T worker node --input-type=module <<'JS'
import { createPrismaClient } from '@kurvenfunk/database';
const db = createPrismaClient();
try {
  // Do not log IDs, counts, email addresses or other user data.
  await db.notificationOutbox.findFirst({
    select: { notificationId: true, processedAt: true, nextAttemptAt: true },
  });
  console.log('DEV_PHASE23_225_OUTBOX_SCHEMA=PASS');
} finally {
  await db.$disconnect();
}
JS
echo 'DEV_PHASE23_225_READONLY_RESULT=PASS'
