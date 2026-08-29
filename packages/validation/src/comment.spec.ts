import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { COMMENT_BODY_MAX_LENGTH, createCommentSchema } from './comment.ts';

describe('comment validation', () => {
  it('accepts and trims a valid comment', () => {
    const result = createCommentSchema.parse({
      body: '  Rapid spielt heute stark.  ',
    });

    assert.deepEqual(result, {
      body: 'Rapid spielt heute stark.',
    });
  });

  it('rejects an empty comment', () => {
    assert.throws(() =>
      createCommentSchema.parse({
        body: '   ',
      }),
    );
  });

  it('rejects comments above the maximum length', () => {
    assert.throws(() =>
      createCommentSchema.parse({
        body: 'a'.repeat(COMMENT_BODY_MAX_LENGTH + 1),
      }),
    );
  });
});
