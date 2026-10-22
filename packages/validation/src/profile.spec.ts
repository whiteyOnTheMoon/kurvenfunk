import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BIO_MAX_LENGTH, DISPLAY_NAME_MAX_LENGTH, updateProfileSchema } from './profile.ts';

describe('updateProfileSchema', () => {
  it('accepts and trims profile values', () => {
    assert.deepEqual(
      updateProfileSchema.parse({
        displayName: '  Kurvenfan  ',
        bio: '  Fußball und Kurve.  ',
      }),
      {
        displayName: 'Kurvenfan',
        bio: 'Fußball und Kurve.',
      },
    );
  });

  it('normalizes empty values to null', () => {
    assert.deepEqual(
      updateProfileSchema.parse({
        displayName: '   ',
        bio: '',
      }),
      {
        displayName: null,
        bio: null,
      },
    );
  });

  it('accepts explicit null values', () => {
    assert.deepEqual(
      updateProfileSchema.parse({
        displayName: null,
        bio: null,
      }),
      {
        displayName: null,
        bio: null,
      },
    );
  });

  it('rejects an overly long display name', () => {
    assert.throws(() =>
      updateProfileSchema.parse({
        displayName: 'a'.repeat(DISPLAY_NAME_MAX_LENGTH + 1),
        bio: null,
      }),
    );
  });

  it('rejects an overly long bio', () => {
    assert.throws(() =>
      updateProfileSchema.parse({
        displayName: null,
        bio: 'a'.repeat(BIO_MAX_LENGTH + 1),
      }),
    );
  });
});
