import assert from 'node:assert/strict';
import test from 'node:test';

import { clubThemeToCssProperties, getReadableTextColor, resolveClubTheme } from './club-theme.ts';

test('resolves valid club colors', () => {
  assert.deepEqual(
    resolveClubTheme({
      primaryColor: '#007A3D',
      secondaryColor: '#FFFFFF',
      accentColor: '#D4AF37',
    }),
    {
      primary: '#007A3D',
      secondary: '#FFFFFF',
      accent: '#D4AF37',
      onPrimary: '#FFFFFF',
      onSecondary: '#000000',
      onAccent: '#000000',
    },
  );
});

test('normalizes lowercase club colors', () => {
  const theme = resolveClubTheme({
    primaryColor: '#5b2c83',
    secondaryColor: '#ffffff',
    accentColor: '#d4af37',
  });

  assert.equal(theme.primary, '#5B2C83');
  assert.equal(theme.secondary, '#FFFFFF');
  assert.equal(theme.accent, '#D4AF37');
});

test('uses safe fallback colors for missing and invalid values', () => {
  assert.deepEqual(
    resolveClubTheme({
      primaryColor: null,
      secondaryColor: 'invalid',
      accentColor: null,
    }),
    {
      primary: '#171717',
      secondary: '#FFFFFF',
      accent: '#171717',
      onPrimary: '#FFFFFF',
      onSecondary: '#000000',
      onAccent: '#FFFFFF',
    },
  );
});

test('chooses a readable black or white foreground', () => {
  assert.equal(getReadableTextColor('#FFFFFF'), '#000000');
  assert.equal(getReadableTextColor('#000000'), '#FFFFFF');
  assert.equal(getReadableTextColor('#FFFF00'), '#000000');
  assert.equal(getReadableTextColor('#000080'), '#FFFFFF');
});

test('converts a resolved theme to CSS custom properties', () => {
  const theme = resolveClubTheme({
    primaryColor: '#007A3D',
    secondaryColor: '#FFFFFF',
    accentColor: '#D4AF37',
  });

  assert.deepEqual(clubThemeToCssProperties(theme), {
    '--kf-club-primary': '#007A3D',
    '--kf-club-secondary': '#FFFFFF',
    '--kf-club-accent': '#D4AF37',
    '--kf-club-on-primary': '#FFFFFF',
    '--kf-club-on-secondary': '#000000',
    '--kf-club-on-accent': '#000000',
  });
});
