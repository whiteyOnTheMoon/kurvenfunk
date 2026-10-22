import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createTagSchema, updateTagSchema } from './tag.ts';

describe('tag validation', () => {
  it('accepts a valid tag', () => {
    assert.deepEqual(
      createTagSchema.parse({
        name: 'Transfer',
        slug: 'transfer',
      }),
      {
        name: 'Transfer',
        slug: 'transfer',
      },
    );
  });

  it('trims the tag name', () => {
    assert.deepEqual(
      createTagSchema.parse({
        name: '  Transfer  ',
        slug: 'transfer',
      }),
      {
        name: 'Transfer',
        slug: 'transfer',
      },
    );
  });

  it('accepts the optional active flag', () => {
    assert.deepEqual(
      createTagSchema.parse({
        name: 'Bundesliga',
        slug: 'bundesliga',
        active: false,
      }),
      {
        name: 'Bundesliga',
        slug: 'bundesliga',
        active: false,
      },
    );
  });

  it('rejects an empty tag name', () => {
    assert.throws(() =>
      createTagSchema.parse({
        name: '',
        slug: 'transfer',
      }),
    );
  });

  it('rejects an invalid slug', () => {
    assert.throws(() =>
      createTagSchema.parse({
        name: 'Transfer',
        slug: 'Transfer News',
      }),
    );
  });

  it('allows partial tag updates', () => {
    assert.deepEqual(
      updateTagSchema.parse({
        active: false,
      }),
      {
        active: false,
      },
    );
  });
});
