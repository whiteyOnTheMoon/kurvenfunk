import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getArticleLeadMediaSrc } from './article-media.ts';

describe('public article lead media', () => {
  it('uses the public media API for a stored lead image', () => {
    const source = getArticleLeadMediaSrc('https://api-dev.kurvenfunk.at/', {
      id: '9ceda631-1a37-4133-a1f5-83f4afac23ad',
      storageKey: 'media/2026/11/photo.webp',
      externalUrl: 'https://example.invalid/legacy.png',
    });
    assert.equal(
      source,
      'https://api-dev.kurvenfunk.at/api/v1/media/9ceda631-1a37-4133-a1f5-83f4afac23ad/content',
    );
    assert.ok(!source.includes('media/2026/11'));
  });

  it('keeps HTTPS and HTTP external media URLs if no object is stored', () => {
    assert.equal(
      getArticleLeadMediaSrc('https://api.invalid', {
        id: 'external',
        storageKey: null,
        externalUrl: 'https://news.example.test/photo.jpg',
      }),
      'https://news.example.test/photo.jpg',
    );
  });

  it('does not render unknown or unsafe external image protocols', () => {
    assert.equal(
      getArticleLeadMediaSrc('https://api.invalid', {
        id: 'bad',
        storageKey: null,
        externalUrl: 'javascript:alert(1)',
      }),
      null,
    );
    assert.equal(getArticleLeadMediaSrc('https://api.invalid', null), null);
  });
});
