import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  appendInboxPage,
  fetchInboxPage,
  fetchUnreadCount,
  parseInboxPage,
  parseUnreadCount,
  safeNotificationHref,
} from './notification-inbox-feed.ts';

const recipientMessage = {
  id: '11111111-1111-4111-8111-111111111111',
  type: 'COMMENT_REPLY',
  title: 'Neue Antwort',
  body: 'Jemand hat geantwortet.',
  url: '/artikel/spielbericht#diskussion',
  createdAt: '2026-11-13T20:00:00.000Z',
  readAt: null,
};
const page = {
  data: {
    items: [recipientMessage],
    pagination: { hasNextPage: false, nextCursor: null },
  },
};

describe('23.226 private in-app inbox contract', () => {
  it('requests only authenticated, private and uncached paginated inbox endpoints', async (t) => {
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => (String(url).includes('unread-count') ? { data: { count: 3 } } : page),
      };
    });
    const abort = new AbortController();
    const inbox = await fetchInboxPage(
      'https://api.example.test/',
      'secret-test-token',
      'unread',
      'opaque-cursor',
      abort.signal,
    );
    const count = await fetchUnreadCount(
      'https://api.example.test/',
      'secret-test-token',
      abort.signal,
    );
    assert.equal(inbox.items.length, 1);
    assert.equal(count, 3);
    assert.equal(calls.length, 2);
    const url = new URL(calls[0].url);
    assert.equal(url.pathname, '/api/v1/notifications');
    assert.equal(url.searchParams.get('cursor'), 'opaque-cursor');
    assert.equal(url.searchParams.get('filter'), 'unread');
    assert.equal(url.searchParams.get('limit'), '20');
    assert.equal(url.searchParams.has('userId'), false);
    assert.equal(url.toString().includes('secret-test-token'), false);
    for (const call of calls) {
      assert.equal(call.options.headers.Authorization, 'Bearer secret-test-token');
      assert.equal(call.options.cache, 'no-store');
      assert.equal(call.options.signal, abort.signal);
    }
    assert.equal(new URL(calls[1].url).pathname, '/api/v1/notifications/unread-count');
  });

  it('fails closed on missing token, network failures, malformed or oversized results', async (t) => {
    assert.throws(() => parseInboxPage({}), /NOTIFICATION_RESPONSE_INVALID/);
    assert.throws(
      () => parseInboxPage({ data: { items: [recipientMessage] } }),
      /NOTIFICATION_RESPONSE_INVALID/,
    );
    assert.throws(
      () =>
        parseInboxPage({
          data: {
            items: [{ ...recipientMessage, type: 'UNKNOWN' }],
            pagination: page.data.pagination,
          },
        }),
      /NOTIFICATION_RESPONSE_INVALID/,
    );
    assert.throws(
      () =>
        parseInboxPage({
          data: { items: [recipientMessage], pagination: { hasNextPage: true, nextCursor: null } },
        }),
      /NOTIFICATION_RESPONSE_INVALID/,
    );
    assert.throws(() => parseUnreadCount({ data: { count: -1 } }), /NOTIFICATION_COUNT_INVALID/);
    assert.throws(() => parseUnreadCount({ data: { count: '1' } }), /NOTIFICATION_COUNT_INVALID/);
    await assert.rejects(
      fetchInboxPage('https://api.example.test', '', 'all'),
      /NOTIFICATION_AUTH_REQUIRED/,
    );
    t.mock.method(globalThis, 'fetch', async () => ({ ok: false }));
    await assert.rejects(
      fetchInboxPage('https://api.example.test', 'token', 'all'),
      /NOTIFICATION_REQUEST_FAILED/,
    );
    await assert.rejects(
      fetchUnreadCount('https://api.example.test', 'token'),
      /NOTIFICATION_COUNT_FAILED/,
    );
  });

  it('never turns malicious, external, whitespace or backslash URLs into clickable links', () => {
    for (const href of [
      'https://attacker.example/',
      '//attacker.example/',
      'javascript:alert(1)',
      '/\\attacker.example',
      '/bad path',
      '/bad\npath',
      '/\u007f',
      '',
    ])
      assert.equal(safeNotificationHref(href), null);
    assert.equal(
      safeNotificationHref('/forum/verein/mein-verein/thema/spiel'),
      '/forum/verein/mein-verein/thema/spiel',
    );
    assert.equal(safeNotificationHref('/artikel/name#diskussion'), '/artikel/name#diskussion');
    assert.equal(
      parseInboxPage({
        data: {
          items: [{ ...recipientMessage, url: '//attacker.example' }],
          pagination: page.data.pagination,
        },
      }).items[0].url,
      null,
    );
  });

  it('merges keyset pages without duplicates and does not invent read receipts', () => {
    const other = {
      ...recipientMessage,
      id: '22222222-2222-4222-8222-222222222222',
      readAt: '2026-11-13T21:00:00.000Z',
    };
    assert.deepEqual(
      appendInboxPage([recipientMessage], [recipientMessage, other, other]).map((row) => row.id),
      [recipientMessage.id, other.id],
    );
    assert.equal(parseInboxPage(page).items[0].readAt, null);
    assert.equal(parseUnreadCount({ data: { count: 0 } }), 0);
  });
});
