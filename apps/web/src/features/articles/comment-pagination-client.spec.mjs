import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fetchCommentPage, mergeCommentPages } from './comment-pagination-client.ts';

test('loads the first page with the selected sorting mode', async (t) => {
  let requestedUrl;
  let requestedOptions;

  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requestedUrl = url;
    requestedOptions = options;

    return {
      ok: true,
      json: async () => ({
        data: {
          items: [{ id: 'first' }],
          pagination: {
            nextCursor: null,
            hasNextPage: false,
          },
        },
      }),
    };
  });

  const result = await fetchCommentPage('https://api-dev.kurvenfunk.at', 'article-1', 'newest');

  const url = new URL(requestedUrl);

  assert.equal(url.searchParams.get('sort'), 'newest');
  assert.equal(url.searchParams.has('cursor'), false);

  assert.equal(requestedOptions.cache, 'no-store');

  assert.deepEqual(
    result.items.map((item) => item.id),
    ['first'],
  );
});

test('passes cursor and popular sorting to the API', async (t) => {
  let requestedUrl;

  t.mock.method(globalThis, 'fetch', async (url) => {
    requestedUrl = url;

    return {
      ok: true,
      json: async () => ({
        data: {
          items: [],
          pagination: {
            nextCursor: null,
            hasNextPage: false,
          },
        },
      }),
    };
  });

  await fetchCommentPage('https://api-dev.kurvenfunk.at', 'article-1', 'popular', 'cursor-123');

  const url = new URL(requestedUrl);

  assert.equal(url.searchParams.get('sort'), 'popular');
  assert.equal(url.searchParams.get('cursor'), 'cursor-123');
});

test('accepts a page with another cursor', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({
      data: {
        items: [{ id: 'comment-1' }],
        pagination: {
          nextCursor: 'next-page',
          hasNextPage: true,
        },
      },
    }),
  }));

  const result = await fetchCommentPage('https://api-dev.kurvenfunk.at', 'article-1', 'oldest');

  assert.equal(result.pagination.hasNextPage, true);
  assert.equal(result.pagination.nextCursor, 'next-page');
});

test('rejects failed HTTP responses', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: false,
  }));

  await assert.rejects(
    fetchCommentPage('https://api-dev.kurvenfunk.at', 'article-1', 'newest'),
    /COMMENT_PAGE_FAILED/,
  );
});

test('rejects invalid API response structures', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({
      data: [],
    }),
  }));

  await assert.rejects(
    fetchCommentPage('https://api-dev.kurvenfunk.at', 'article-1', 'newest'),
    /INVALID_COMMENT_PAGE/,
  );
});

test('rejects missing next cursor when more pages exist', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({
      data: {
        items: [],
        pagination: {
          nextCursor: null,
          hasNextPage: true,
        },
      },
    }),
  }));

  await assert.rejects(
    fetchCommentPage('https://api-dev.kurvenfunk.at', 'article-1', 'popular'),
    /INVALID_COMMENT_PAGE/,
  );
});

test('passes abort signals to fetch', async (t) => {
  const controller = new AbortController();

  let receivedSignal;

  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    receivedSignal = options.signal;

    return {
      ok: true,
      json: async () => ({
        data: {
          items: [],
          pagination: {
            nextCursor: null,
            hasNextPage: false,
          },
        },
      }),
    };
  });

  await fetchCommentPage(
    'https://api-dev.kurvenfunk.at',
    'article-1',
    'newest',
    undefined,
    controller.signal,
  );

  assert.equal(receivedSignal, controller.signal);
});

test('merges pages without duplicate comments', () => {
  const first = [{ id: 'a' }, { id: 'b' }];

  const second = [{ id: 'b' }, { id: 'c' }, { id: 'd' }];

  const merged = mergeCommentPages(first, second);

  assert.deepEqual(
    merged.map((comment) => comment.id),
    ['a', 'b', 'c', 'd'],
  );

  assert.deepEqual(
    first.map((comment) => comment.id),
    ['a', 'b'],
  );
});

test('preserves the server ordering across pages', () => {
  const first = [{ id: 'popular-1' }, { id: 'popular-2' }];

  const second = [{ id: 'popular-3' }, { id: 'popular-4' }];

  const merged = mergeCommentPages(first, second);

  assert.deepEqual(
    merged.map((comment) => comment.id),
    ['popular-1', 'popular-2', 'popular-3', 'popular-4'],
  );
});

test('handles repeated IDs in an incoming page', () => {
  const merged = mergeCommentPages([{ id: 'a' }], [{ id: 'b' }, { id: 'b' }, { id: 'c' }]);

  assert.deepEqual(
    merged.map((comment) => comment.id),
    ['a', 'b', 'c'],
  );
});
