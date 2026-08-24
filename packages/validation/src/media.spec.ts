import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mediaUploadMetadataSchema } from './media.ts';

describe('media upload metadata validation', () => {
  it('accepts valid media metadata', () => {
    const result = mediaUploadMetadataSchema.parse({
      altText: 'Rapid-Spieler vor der Westtribüne',
      copyright: 'Kurvenfunk',
      source: 'Kurvenfunk Redaktion',
      sourceUrl: 'https://kurvenfunk.at',
    });

    assert.deepEqual(result, {
      altText: 'Rapid-Spieler vor der Westtribüne',
      copyright: 'Kurvenfunk',
      source: 'Kurvenfunk Redaktion',
      sourceUrl: 'https://kurvenfunk.at',
    });
  });

  it('normalizes omitted metadata to null', () => {
    const result = mediaUploadMetadataSchema.parse({});

    assert.deepEqual(result, {
      altText: null,
      copyright: null,
      source: null,
      sourceUrl: null,
    });
  });

  it('normalizes empty metadata to null', () => {
    const result = mediaUploadMetadataSchema.parse({
      altText: '   ',
      copyright: '',
      source: '',
      sourceUrl: '',
    });

    assert.deepEqual(result, {
      altText: null,
      copyright: null,
      source: null,
      sourceUrl: null,
    });
  });

  it('rejects an invalid source URL', () => {
    const result = mediaUploadMetadataSchema.safeParse({
      sourceUrl: 'not-a-url',
    });

    assert.equal(result.success, false);
  });

  it('rejects overly long alt text', () => {
    const result = mediaUploadMetadataSchema.safeParse({
      altText: 'a'.repeat(501),
    });

    assert.equal(result.success, false);
  });
});
