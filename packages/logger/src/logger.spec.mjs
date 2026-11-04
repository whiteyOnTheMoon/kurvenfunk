import assert from 'node:assert/strict';
import test from 'node:test';

import { createLogEntry, redactSensitiveText, sanitizeMetadata } from './logger.ts';

test('redacts URL OAuth codes and tokens while preserving benign path and state', () => {
  const sanitized = redactSensitiveText(
    '/api/v1/callback?code=private-code&access_token=private-token&state=ok',
  );

  assert.equal(sanitized.includes('private-code'), false);
  assert.equal(sanitized.includes('private-token'), false);
  assert.match(sanitized, /state=ok/);
});

test('redacts Bearer credentials from log messages', () => {
  const log = createLogEntry('api', 'error', 'failed Bearer ey.token.signature');

  assert.equal(log.message.includes('ey.token.signature'), false);
  assert.match(log.message, /Bearer \[REDACTED\]/);
});

test('recursively redacts keys, free text and Error stacks without logging secrets', () => {
  const problem = new Error('unexpected token=error-secret on callback');
  const data = sanitizeMetadata({
    password: 'plain-password',
    nested: {
      url: 'https://idp.invalid?client_secret=hidden-secret&trace=ok',
      issue: problem,
      message: 'Authorization: Bearer risky.payload.value',
      array: ['api_key=key-value', { refresh_token: 'nested-secret' }],
    },
  });

  const serialized = JSON.stringify(data);
  for (const secret of [
    'plain-password',
    'error-secret',
    'hidden-secret',
    'risky.payload.value',
    'key-value',
    'nested-secret',
  ]) {
    assert.equal(serialized.includes(secret), false, secret);
  }

  assert.match(serialized, /trace=ok/);
});
