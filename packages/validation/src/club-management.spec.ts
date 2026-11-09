import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { clubColorSchema, createClubSchema, updateClubSchema } from './club-management.ts';

const sample = {
  name: 'SK Test Wien',
  slug: 'sk-test-wien',
  color1Hex: '#00aBc1',
};

describe('Task 194 club management validation', () => {
  it('normalizes six-digit HEX colors and trims canonical fields', () => {
    const input = createClubSchema.parse({
      ...sample,
      name: '  SK Test Wien  ',
      shortName: ' Test ',
      color2Hex: '#ffffff',
      accentColorHex: null,
    });
    assert.equal(input.name, 'SK Test Wien');
    assert.equal(input.shortName, 'Test');
    assert.equal(input.color1Hex, '#00ABC1');
    assert.equal(input.color2Hex, '#FFFFFF');
    assert.equal(input.accentColorHex, null);
    assert.equal(clubColorSchema.parse('#a1b2c3'), '#A1B2C3');
  });

  it('requires primary color, a name and stable URL-safe slug', () => {
    for (const invalid of [
      { name: 'SK Test', slug: 'sk-test' },
      { ...sample, name: '  ' },
      { ...sample, slug: 'SK TEST' },
      { ...sample, color1Hex: '#FFF' },
      { ...sample, color1Hex: 'rgb(0,0,0)' },
      { ...sample, color2Hex: 'red' },
      { ...sample, color1Rgba: 'rgba(0, 0, 0, 1)' },
    ]) {
      assert.equal(createClubSchema.safeParse(invalid).success, false);
    }
  });

  it('rejects unsafe official URLs and credential-based links', () => {
    for (const website of [
      'javascript:alert(1)',
      'ftp://example.org',
      'https://name:pass@example.org',
      'not a url',
    ]) {
      assert.equal(createClubSchema.safeParse({ ...sample, website }).success, false);
    }
    assert.equal(
      createClubSchema.parse({ ...sample, website: 'https://example.org' }).website,
      'https://example.org',
    );
  });

  it('allows partial lifecycle updates, but never slug, ID or raw RGBA edits', () => {
    assert.deepEqual(updateClubSchema.parse({ active: false }), { active: false });
    assert.deepEqual(updateClubSchema.parse({ color2Hex: null }), { color2Hex: null });
    for (const input of [
      {},
      { slug: 'renamed' },
      { id: 'new-id' },
      { color1Hex: null },
      { color2Rgba: 'rgba(1, 2, 3, 1)' },
    ]) {
      assert.equal(updateClubSchema.safeParse(input).success, false);
    }
  });
});
