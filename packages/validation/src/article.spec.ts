import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  articleContentSchema,
  articlePublicationWorkflowSchema,
  createArticleSchema,
  updateArticleSchema,
} from './article.ts';

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

  it('rejects JSON null as article content', () => {
    const result = createArticleSchema.safeParse({
      title: 'Test article',
      slug: 'test-article',
      content: null,
    });

    assert.equal(result.success, false);
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

describe('article publication workflow validation', () => {
  it('accepts moving an article to review', () => {
    const result = articlePublicationWorkflowSchema.safeParse({
      status: 'REVIEW',
    });

    assert.equal(result.success, true);
  });

  it('accepts scheduling with an ISO timestamp', () => {
    const result = articlePublicationWorkflowSchema.safeParse({
      status: 'SCHEDULED',
      scheduledAt: '2026-08-20T12:00:00.000Z',
    });

    assert.equal(result.success, true);
  });

  it('rejects scheduling without scheduledAt', () => {
    const result = articlePublicationWorkflowSchema.safeParse({
      status: 'SCHEDULED',
    });

    assert.equal(result.success, false);
  });

  it('rejects scheduledAt for non-scheduled states', () => {
    const result = articlePublicationWorkflowSchema.safeParse({
      status: 'PUBLISHED',
      scheduledAt: '2026-08-20T12:00:00.000Z',
    });

    assert.equal(result.success, false);
  });

  it('rejects unknown publication states', () => {
    const result = articlePublicationWorkflowSchema.safeParse({
      status: 'UNKNOWN',
    });

    assert.equal(result.success, false);
  });
});

describe('articleContentSchema', () => {
  it('accepts structured article editor content', () => {
    const result = articleContentSchema.safeParse({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Matchbericht' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Kurvenfunk berichtet ' },
            {
              type: 'text',
              text: 'live',
              marks: [{ type: 'bold' }],
            },
          ],
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Ein starkes Spiel.' }],
            },
          ],
        },
        {
          type: 'image',
          attrs: {
            src: 'https://example.test/match.jpg',
            alt: 'Spielszene',
          },
        },
      ],
    });

    assert.equal(result.success, true);
  });

  it('rejects unsupported editor nodes', () => {
    const result = articleContentSchema.safeParse({
      type: 'doc',
      content: [
        {
          type: 'script',
          content: [{ type: 'text', text: 'alert(1)' }],
        },
      ],
    });

    assert.equal(result.success, false);
  });

  it('rejects unsafe image URLs', () => {
    const result = articleContentSchema.safeParse({
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            src: 'javascript:alert(1)',
          },
        },
      ],
    });

    assert.equal(result.success, false);
  });
});
