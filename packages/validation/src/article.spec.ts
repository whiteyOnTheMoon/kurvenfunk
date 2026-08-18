import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createArticleSchema, updateArticleSchema } from './article.ts';

describe('article validation', () => {
  it('accepts a valid article draft', () => {
    const result = createArticleSchema.parse({
      title: '  Test article  ',
      slug: 'test-article',
      lead: '  Test lead  ',
      content: {
        type: 'doc',
        content: [],
      },
    });

    assert.equal(result.title, 'Test article');
    assert.equal(result.lead, 'Test lead');
    assert.equal(result.slug, 'test-article');
  });

  it('accepts JSON null as article content', () => {
    const result = createArticleSchema.parse({
      title: 'Test article',
      slug: 'test-article',
      content: null,
    });

    assert.equal(result.content, null);
  });

  it('rejects an invalid slug', () => {
    assert.throws(() =>
      createArticleSchema.parse({
        title: 'Test article',
        slug: 'Not A Valid Slug',
        content: {},
      }),
    );
  });

  it('allows partial article updates', () => {
    const result = updateArticleSchema.parse({
      title: 'Updated title',
    });

    assert.deepEqual(result, {
      title: 'Updated title',
    });
  });
});
