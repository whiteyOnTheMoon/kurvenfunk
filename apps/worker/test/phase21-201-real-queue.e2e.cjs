/* Phase 21.201 operational gate: real BullMQ + Nest worker + PostgreSQL.
 * ONLY execute against throwaway CI containers. No DEV/PROD connection.
 */
'use strict';

const assert = require('node:assert/strict');
const { createHash, randomUUID } = require('node:crypto');
const { spawn } = require('node:child_process');
const { setTimeout: sleep } = require('node:timers/promises');
const path = require('node:path');
const { Queue, QueueEvents } = require('bullmq');

async function until(check, label, timeoutMs = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await check();
    if (value) return value;
    await sleep(250);
  }
  throw new Error('SPORTS_CI_TIMEOUT_' + label);
}

async function main() {
  assert.equal(process.env.NODE_ENV, 'test', 'Isolated test runtime required');
  assert.equal(process.env.SPORTS_FAKE_PROVIDER_ENABLED, 'true');
  assert.match(process.env.DATABASE_URL || '', /127\.0\.0\.1:55432\/sports_ci$/);
  assert.equal(process.env.REDIS_HOST, '127.0.0.1');
  assert.equal(process.env.REDIS_PORT, '56379');

  const [
    { createPrismaClient },
    { QUEUE_NAMES, FAKE_SPORTS_SCOPE, SPORTS_IMPORT_JOB_NAME, NOTIFICATION_DISPATCH_JOB_NAME },
  ] = await Promise.all([import('@kurvenfunk/database'), import('@kurvenfunk/types')]);
  const { SportsImportQueueService } = require('../dist/jobs/sports-import-queue.service.js');
  const db = createPrismaClient();
  const connection = {
    host: '127.0.0.1',
    port: 56379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  };
  const queue = new Queue(QUEUE_NAMES.SPORTS_IMPORT, { connection });
  const events = new QueueEvents(QUEUE_NAMES.SPORTS_IMPORT, { connection });
  const deadLetters = new Queue(QUEUE_NAMES.SPORTS_IMPORT_DEAD_LETTER, { connection });
  const notificationsQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, { connection });
  const notificationUsers = [];
  let notificationId = null;
  const config = {
    get: (key, fallback) =>
      key === 'NODE_ENV' ? 'test' : key === 'SPORTS_FAKE_PROVIDER_ENABLED' ? true : fallback,
  };
  const producer = new SportsImportQueueService(queue, config);
  const child = spawn(process.execPath, [path.join(__dirname, '../dist/main.js')], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SPORTS_FAKE_PROVIDER_ENABLED: 'true',
      SPORTS_IMPORT_SCHEDULER_ENABLED: 'false',
      SPORTS_IMPORT_LIVE_ENABLED: 'false',
      NEWS_IMPORT_SCHEDULER_ENABLED: 'false',
      WORKER_RUN_STARTUP_TEST: 'false',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', (chunk) => {
      output = (output + String(chunk)).slice(-12_000);
    });
  }
  child.on('error', (err) => {
    output = (output + String(err)).slice(-12_000);
  });

  const counts = async () => ({
    clubs: await db.club.count(),
    matches: await db.match.count(),
    standings: await db.standing.count(),
  });

  try {
    await events.waitUntilReady();
    const baseline = await counts();
    assert.deepEqual(baseline, { clubs: 0, matches: 0, standings: 0 });
    await queue.waitUntilReady();
    assert.equal(child.exitCode, null, 'Worker must be running');

    const expected = { clubs: 4, fixtures: 8, results: 3, live: 1 };
    const jobIds = {};
    for (const [resource, size] of Object.entries(expected)) {
      const payload = { providerKey: 'fake-sports', resource, ...FAKE_SPORTS_SCOPE };
      const id = await producer.enqueue(payload);
      jobIds[resource] = id;
      const job = await queue.getJob(id);
      assert.ok(job, 'BullMQ job must exist in real Redis');
      await job.waitUntilFinished(events, 90_000);
      const imported = await db.importJob.findFirst({
        where: { queueJobId: id },
        select: {
          status: true,
          receivedCount: true,
          processedCount: true,
          cursor: true,
          records: { select: { status: true, externalId: true } },
          rawPayloads: { select: { id: true } },
        },
      });
      assert.ok(imported, 'Worker must persist import history in PostgreSQL');
      assert.equal(imported.status, 'SUCCEEDED');
      assert.equal(imported.receivedCount, size);
      assert.equal(imported.processedCount, size);
      assert.equal(imported.records.length, size);
      assert.equal(imported.rawPayloads.length, size);
      assert.equal(imported.cursor, null);
      assert.ok(imported.records.every((record) => record.status === 'REVIEW_REQUIRED'));
      assert.equal(await producer.enqueue(payload), id, 'Producer deduplication must be stable');
      assert.deepEqual(await counts(), baseline, 'No synthetic canonical rows');
    }

    const provider = await db.provider.findUnique({ where: { key: 'fake-sports' } });
    assert.ok(provider);
    assert.equal(provider.type, 'SPORTS');
    assert.equal(await db.importJob.count({ where: { providerId: provider.id } }), 4);
    assert.equal(await db.importRecord.count({ where: { providerId: provider.id } }), 16);
    assert.equal(await db.rawPayload.count({ where: { providerId: provider.id } }), 16);
    assert.deepEqual(await counts(), baseline);

    // Real negative path: valid queue payload, provider rejects unknown scope.
    // Three actual worker attempts must persist a sanitized DEAD_LETTER job.
    const bad = {
      providerKey: 'fake-sports',
      resource: 'fixtures',
      competitionExternalId: 'ci-nonexistent-scope',
      seasonExternalId: 'ci-unknown-season',
    };
    const badId = await producer.enqueue(bad);
    const badJob = await queue.getJob(badId);
    assert.ok(badJob);
    await assert.rejects(badJob.waitUntilFinished(events, 90_000), /FAKE_SPORTS_UNKNOWN_SCOPE/);
    await until(
      () =>
        db.importJob.findFirst({
          where: { queueJobId: badId, status: 'DEAD_LETTER' },
          select: { id: true, errorCode: true, status: true },
        }),
      'DLQ_DATABASE',
    );
    const letters = await deadLetters.getJobs(['waiting', 'completed', 'failed', 'delayed']);
    const letter = letters.find((j) => j.data.originalJobId === badId);
    assert.ok(letter, 'Redacted dead-letter summary must be in real Redis');
    assert.equal(letter.data.errorCode, 'FAKE_SPORTS_UNKNOWN_SCOPE');
    assert.equal(letter.data.attemptsMade, 3);
    assert.equal((await queue.getJob(badId)).attemptsMade, 3);
    assert.deepEqual(await counts(), baseline);

    // Phase 23.225: the real Nest worker consumes a durable, isolated
    // PostgreSQL event without emailing users or touching the DEV database.
    const recipient = await db.user.create({
      data: { keycloakSubject: 'p225-queue-ci-' + randomUUID() },
      select: { id: true },
    });
    notificationUsers.push(recipient.id);
    const event = await db.$transaction(async (tx) => {
      const stored = await tx.notification.create({
        data: {
          userId: recipient.id,
          type: 'SYSTEM',
          title: 'Isolated queue handshake',
          body: 'Only CI disposable data',
          dedupeKey: 'p225-ci-' + randomUUID(),
        },
        select: { id: true },
      });
      await tx.notificationOutbox.create({ data: { notificationId: stored.id } });
      return stored;
    });
    notificationId = event.id;

    const delivered = await until(
      async () => {
        const row = await db.notificationOutbox.findUnique({
          where: { notificationId },
          select: { processedAt: true, attemptCount: true },
        });
        return row?.processedAt ? row : null;
      },
      'NOTIFICATION_OUTBOX_CONSUMED_BY_REAL_WORKER',
      90_000,
    );
    assert.ok(delivered.attemptCount >= 1, 'PostgreSQL dispatcher must claim the event');

    const jobId = 'notification_' + notificationId.replaceAll('-', '');
    // A second queue delivery must not overwrite the durable first receipt.
    const timestamp = delivered.processedAt.getTime();
    const repeated = await notificationsQueue.add(
      NOTIFICATION_DISPATCH_JOB_NAME,
      { notificationId },
      { jobId, attempts: 3, removeOnComplete: true, removeOnFail: true },
    );
    assert.equal(repeated.id, jobId);
    await until(async () => !(await notificationsQueue.getJob(jobId)), 'REPEATED_DELIVERY_DONE');
    const after = await db.notificationOutbox.findUniqueOrThrow({
      where: { notificationId },
    });
    assert.equal(after.processedAt.getTime(), timestamp);
    assert.equal(await db.notification.count({ where: { id: notificationId } }), 1);
    console.log('PHASE 23.225 REAL NOTIFICATION OUTBOX QUEUE: PASS');

    console.log('PHASE 21.201 REAL QUEUE E2E: PASS');
    console.log(
      'PostgreSQL: 4 successful staged feeds (16 records); real Redis deduplication: PASS',
    );
    console.log('Worker retries: 3; final dead-letter and redacted error: PASS');
    console.log('Canonical Club/Match/Standing changed: NONE');
  } catch (error) {
    console.error(
      'PHASE 21.201 REAL QUEUE E2E: FAILED',
      error instanceof Error ? error.message : 'UNKNOWN',
    );
    console.error('Worker last output:', output.replace(/sports_ci_only/g, '[REDACTED]'));
    process.exitCode = 1;
  } finally {
    // Cleanup only the disposable Phase 23 CI fixture, also on test failure.
    try {
      if (notificationId) {
        await db.notification.deleteMany({ where: { id: notificationId } });
      }
      if (notificationUsers.length > 0) {
        await db.user.deleteMany({ where: { id: { in: notificationUsers } } });
      }
    } catch {
      process.exitCode = 1;
    }
    child.kill('SIGTERM');
    await Promise.race([new Promise((resolve) => child.once('exit', resolve)), sleep(8_000)]);
    if (child.exitCode === null) child.kill('SIGKILL');
    await Promise.allSettled([
      events.close(),
      queue.close(),
      deadLetters.close(),
      notificationsQueue.close(),
      db.$disconnect(),
    ]);
  }
}

main().catch((error) => {
  console.error('PHASE 21.201 HARNESS FAILED', error instanceof Error ? error.message : 'UNKNOWN');
  process.exitCode = 1;
});
