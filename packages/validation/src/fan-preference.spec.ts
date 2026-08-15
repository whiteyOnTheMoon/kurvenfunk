import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fanPreferenceSelectionSchema, neutralFanPreferenceSchema } from './fan-preference.ts';

describe('fan preference validation', () => {
  it('accepts an explicit neutral preference', () => {
    assert.deepEqual(
      neutralFanPreferenceSchema.parse({
        fanPreference: 'NEUTRAL',
        favoriteClubId: null,
      }),
      {
        fanPreference: 'NEUTRAL',
        favoriteClubId: null,
      },
    );
  });

  it('accepts a club preference with a club id', () => {
    assert.deepEqual(
      fanPreferenceSelectionSchema.parse({
        fanPreference: 'CLUB',
        favoriteClubId: '11111111-1111-4111-8111-111111111111',
      }),
      {
        fanPreference: 'CLUB',
        favoriteClubId: '11111111-1111-4111-8111-111111111111',
      },
    );
  });

  it('rejects CLUB without a club id', () => {
    assert.throws(() =>
      fanPreferenceSelectionSchema.parse({
        fanPreference: 'CLUB',
        favoriteClubId: null,
      }),
    );
  });

  it('rejects NEUTRAL with a club id', () => {
    assert.throws(() =>
      fanPreferenceSelectionSchema.parse({
        fanPreference: 'NEUTRAL',
        favoriteClubId: '11111111-1111-4111-8111-111111111111',
      }),
    );
  });

  it('does not accept UNSET as a completed selection', () => {
    assert.throws(() =>
      fanPreferenceSelectionSchema.parse({
        fanPreference: 'UNSET',
        favoriteClubId: null,
      }),
    );
  });
});
