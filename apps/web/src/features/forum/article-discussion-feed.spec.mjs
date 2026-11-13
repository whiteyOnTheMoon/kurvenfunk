import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  fetchArticleDiscussionPage,
  mergeArticleDiscussionPages,
  parseArticleDiscussionDetail,
  parseArticleDiscussionPage,
} from './article-discussion-feed.ts';

const published = {
  id: '89db5b06-7b17-4832-9bfe-9fa30e1c11b8',
  slug: 'spielbericht',
  title: 'Spielbericht',
  lead: 'Alle Stimmen',
  publishedAt: '2026-11-13T18:00:00.000Z',
};

describe('22.223 published article discussion directory', () => {
  it('uses only public published-article API and forwards bounded cursor and abort signal', async (t) => {
    const received = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      received.push({ url, options });
      return {
        ok: true,
        json: async () => ({
          data: {
            items: [published],
            pagination: { nextCursor: 'another-page', hasNextPage: true },
          },
        }),
      };
    });

    const controller = new AbortController();
    const first = await fetchArticleDiscussionPage(
      'https://api.example.test/',
      undefined,
      controller.signal,
    );
    const more = await fetchArticleDiscussionPage('https://api.example.test/', 'opaque:cursor');

    assert.deepEqual(first.items, [published]);
    assert.equal(more.pagination.nextCursor, 'another-page');
    assert.equal(received.length, 2);
    const url = new URL(received[0].url);
    assert.equal(url.pathname, '/api/v1/articles');
    assert.equal(url.searchParams.get('limit'), '12');
    assert.equal(url.searchParams.has('cursor'), false);
    assert.equal(received[0].options.cache, 'no-store');
    assert.equal(received[0].options.signal, controller.signal);
    assert.equal(new URL(received[1].url).searchParams.get('cursor'), 'opaque:cursor');
  });

  it('fails closed for network failures and invalid pages rather than inventing discussions', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => ({ ok: false }));
    await assert.rejects(
      fetchArticleDiscussionPage('https://api.example.test'),
      /ARTICLE_DISCUSSIONS_UNAVAILABLE/,
    );
    assert.throws(() => parseArticleDiscussionPage({}), /ARTICLE_DISCUSSIONS_INVALID/);
    assert.throws(
      () =>
        parseArticleDiscussionPage({
          data: { items: [published], pagination: { hasNextPage: true, nextCursor: null } },
        }),
      /ARTICLE_DISCUSSIONS_INVALID/,
    );
    assert.throws(
      () =>
        parseArticleDiscussionPage({
          data: {
            items: [{ ...published, publishedAt: 'not-a-date' }],
            pagination: { hasNextPage: false, nextCursor: null },
          },
        }),
      /ARTICLE_DISCUSSIONS_INVALID/,
    );
    assert.throws(
      () =>
        parseArticleDiscussionPage({
          data: {
            items: [{ ...published, title: '' }],
            pagination: { hasNextPage: false, nextCursor: null },
          },
        }),
      /ARTICLE_DISCUSSIONS_INVALID/,
    );
  });

  it('merges cursor pages without duplicate article/discussion IDs', () => {
    const second = {
      ...published,
      id: 'second',
      slug: 'zweiter-artikel',
      title: 'Zweiter Artikel',
    };
    assert.deepEqual(
      mergeArticleDiscussionPages([published], [published, second, second]).map((row) => row.id),
      [published.id, 'second'],
    );
  });
});

describe('22.223 one canonical article comment discussion', () => {
  it('reads the unchanged article ID and visible comment count from published detail', () => {
    assert.deepEqual(
      parseArticleDiscussionDetail({
        data: { ...published, _count: { comments: 7 } },
      }),
      { ...published, _count: { comments: 7 } },
    );
  });

  it('rejects missing/invalid count and unpublished-style absent detail', () => {
    assert.throws(() => parseArticleDiscussionDetail({ data: null }), /ARTICLE_DISCUSSION_INVALID/);
    assert.throws(
      () => parseArticleDiscussionDetail({ data: published }),
      /ARTICLE_DISCUSSION_INVALID/,
    );
    assert.throws(
      () => parseArticleDiscussionDetail({ data: { ...published, _count: { comments: -1 } } }),
      /ARTICLE_DISCUSSION_INVALID/,
    );
    assert.throws(
      () => parseArticleDiscussionDetail({ data: { ...published, _count: { comments: '7' } } }),
      /ARTICLE_DISCUSSION_INVALID/,
    );
  });
});
