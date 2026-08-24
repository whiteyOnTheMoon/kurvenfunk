import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  mediaListQuerySchema,
  mediaUploadMetadataSchema,
  updateMediaMetadataSchema,
} from './media.ts';

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

describe('media metadata update validation', () => {
  it('accepts and normalizes editable metadata', () => {
    const result = updateMediaMetadataSchema.parse({
      altText: '  Westtribüne beim Heimspiel  ',
      copyright: '',
      source: 'Kurvenfunk',
      sourceUrl: '',
    });

    assert.deepEqual(result, {
      altText: 'Westtribüne beim Heimspiel',
      copyright: null,
      source: 'Kurvenfunk',
      sourceUrl: null,
    });
  });

  it('rejects an invalid source URL', () => {
    const result = updateMediaMetadataSchema.safeParse({
      sourceUrl: 'invalid',
    });

    assert.equal(result.success, false);
  });
});

describe('media list query validation', () => {
  it('provides the default page size', () => {
    const result = mediaListQuerySchema.parse({});

    assert.deepEqual(result, {
      limit: 30,
    });
  });

  it('coerces the page size from query parameters', () => {
    const result = mediaListQuerySchema.parse({
      limit: '50',
    });

    assert.equal(result.limit, 50);
  });

  it('accepts a cursor', () => {
    const result = mediaListQuerySchema.parse({
      cursor: 'b102a9df-1929-4600-b068-c415abb5c937',
    });

    assert.equal(result.cursor, 'b102a9df-1929-4600-b068-c415abb5c937');
  });

  it('rejects invalid cursors and excessive page sizes', () => {
    assert.equal(
      mediaListQuerySchema.safeParse({
        cursor: 'not-a-uuid',
      }).success,
      false,
    );

    assert.equal(
      mediaListQuerySchema.safeParse({
        limit: 101,
      }).success,
      false,
    );
  });
});
