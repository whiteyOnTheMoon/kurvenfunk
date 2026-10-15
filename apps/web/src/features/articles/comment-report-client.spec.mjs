import assert from 'node:assert/strict';
import test from 'node:test';

import { REPORT_REASONS, submitCommentReport } from './comment-report-client.ts';

const command = {
  apiUrl: 'https://api-dev.kurvenfunk.at',
  commentId: '11111111-1111-4111-8111-111111111111',
  token: 'test-token',
  reason: 'SPAM',
};

async function simulateReport(status, overrides = {}) {
  let captured;

  const result = await submitCommentReport({ ...command, ...overrides }, async (url, options) => {
    captured = { url, options };
    return new Response(null, { status });
  });

  return { result, captured };
}

test('provides all ten report reasons', () => {
  assert.deepEqual(
    REPORT_REASONS.map((reason) => reason.value),
    [
      'SPAM',
      'HARASSMENT',
      'HATE_OR_ABUSE',
      'THREAT_OR_VIOLENCE',
      'PRIVACY',
      'IMPERSONATION',
      'ILLEGAL_CONTENT',
      'OFF_TOPIC',
      'MISINFORMATION',
      'OTHER',
    ],
  );
});

test('creates a report successfully', async () => {
  const { result } = await simulateReport(201);

  assert.equal(result, 'created');
});

test('uses the correct API endpoint', async () => {
  const { captured } = await simulateReport(201);

  assert.equal(
    captured.url,
    'https://api-dev.kurvenfunk.at/api/v1/comments/11111111-1111-4111-8111-111111111111/reports',
  );

  assert.equal(captured.options.method, 'POST');
});

test('sends authentication and JSON headers', async () => {
  const { captured } = await simulateReport(201);

  assert.equal(captured.options.headers.Authorization, 'Bearer test-token');

  assert.equal(captured.options.headers['Content-Type'], 'application/json');
});

test('sends the selected reason', async () => {
  const { captured } = await simulateReport(201, {
    reason: 'PRIVACY',
  });

  assert.deepEqual(JSON.parse(captured.options.body), { reason: 'PRIVACY' });
});

test('sends trimmed optional details', async () => {
  const { captured } = await simulateReport(201, {
    details: '  Problematischer Inhalt  ',
  });

  assert.deepEqual(JSON.parse(captured.options.body), {
    reason: 'SPAM',
    details: 'Problematischer Inhalt',
  });
});

test('omits empty optional details', async () => {
  const { captured } = await simulateReport(201, {
    details: '   ',
  });

  assert.deepEqual(JSON.parse(captured.options.body), { reason: 'SPAM' });
});

test('recognizes duplicate reports', async () => {
  const { result } = await simulateReport(409);

  assert.equal(result, 'already_reported');
});

test('recognizes unauthenticated requests', async () => {
  const { result } = await simulateReport(401);

  assert.equal(result, 'forbidden');
});

test('recognizes forbidden requests', async () => {
  const { result } = await simulateReport(403);

  assert.equal(result, 'forbidden');
});

test('handles server errors', async () => {
  const { result } = await simulateReport(500);

  assert.equal(result, 'failed');
});

test('propagates network errors to the UI', async () => {
  await assert.rejects(
    submitCommentReport(command, async () => {
      throw new Error('NETWORK_ERROR');
    }),
    /NETWORK_ERROR/,
  );
});
