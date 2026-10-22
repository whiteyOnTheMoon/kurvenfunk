import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createCategorySchema, updateCategorySchema } from './category.ts';

describe('category validation', () => {
  it('accepts a valid category', () => {
    const result = createCategorySchema.parse({
      name: 'Transfers',
      slug: 'transfers',
    });

    assert.deepEqual(result, {
      name: 'Transfers',
      slug: 'transfers',
    });
  });

  it('trims the category name', () => {
    const result = createCategorySchema.parse({
      name: '  Bundesliga  ',
      slug: 'bundesliga',
    });

    assert.equal(result.name, 'Bundesliga');
  });

  it('accepts the optional active flag', () => {
    const result = createCategorySchema.parse({
      name: 'Analyse',
      slug: 'analyse',
      active: false,
    });

    assert.equal(result.active, false);
  });

  it('rejects an empty category name', () => {
    assert.throws(() =>
      createCategorySchema.parse({
        name: '   ',
        slug: 'test',
      }),
    );
  });

  it('rejects an invalid slug', () => {
    assert.throws(() =>
      createCategorySchema.parse({
        name: 'Transfers',
        slug: 'Transfers!',
      }),
    );
  });

  it('allows partial category updates', () => {
    const result = updateCategorySchema.parse({
      active: false,
    });

    assert.deepEqual(result, {
      active: false,
    });
  });
});
