import assert from 'node:assert/strict';
import test from 'node:test';

import { ensureFreshToken } from './token-refresh.ts';

test('renews an expiring token before returning the credential', async () => {
  const client = {
    token: 'expired-token',
    updateToken: async (validity) => {
      assert.equal(validity, 60);
      client.token = 'fresh-token';
      return true;
    },
  };

  assert.equal(await ensureFreshToken(client), 'fresh-token');
});

test('de-duplicates concurrent Keycloak refreshes', async () => {
  let refreshCount = 0;
  let release;
  const client = {
    token: 'old-token',
    updateToken: () => {
      refreshCount++;
      return new Promise((resolve) => {
        release = () => {
          client.token = 'rotated-token';
          resolve(true);
        };
      });
    },
  };

  const first = ensureFreshToken(client);
  const second = ensureFreshToken(client);
  assert.equal(refreshCount, 1);
  release();

  assert.deepEqual(await Promise.all([first, second]), ['rotated-token', 'rotated-token']);
});

test('does not silently reuse a missing or expired token on refresh failure', async () => {
  const client = {
    token: 'expired-token',
    updateToken: async () => {
      throw new Error('refresh rejected');
    },
  };

  await assert.rejects(ensureFreshToken(client), /refresh rejected/);
  client.token = undefined;
  client.updateToken = async () => false;
  await assert.rejects(ensureFreshToken(client), /AUTHENTICATION_REQUIRED/);
});

test('allows a retry after refresh failure', async () => {
  let attempt = 0;
  const client = {
    token: 'old',
    updateToken: async () => {
      if (++attempt === 1) throw new Error('first attempt fails');
      client.token = 'new';
      return true;
    },
  };

  await assert.rejects(ensureFreshToken(client));
  assert.equal(await ensureFreshToken(client), 'new');
  assert.equal(attempt, 2);
});
