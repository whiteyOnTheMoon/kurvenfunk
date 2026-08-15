import assert from 'node:assert/strict';
import test from 'node:test';

import { clubThemeToCssProperties, getReadableTextColor, resolveClubTheme } from './club-theme.ts';

test('resolves all persisted club colors', () => {
  assert.deepEqual(
    resolveClubTheme({
      color1Hex: '#007A3D',
      color1Rgba: 'rgba(0, 122, 61, 1)',
      color2Hex: '#FFFFFF',
      color2Rgba: 'rgba(255, 255, 255, 1)',
      color3Hex: '#000000',
      color3Rgba: 'rgba(0, 0, 0, 1)',
      accentColorHex: '#D4AF37',
      accentColorRgba: 'rgba(212, 175, 55, 1)',
    }),
    {
      color1: '#007A3D',
      color1Rgba: 'rgba(0, 122, 61, 1)',
      color2: '#FFFFFF',
      color2Rgba: 'rgba(255, 255, 255, 1)',
      color3: '#000000',
      color3Rgba: 'rgba(0, 0, 0, 1)',
      accent: '#D4AF37',
      accentRgba: 'rgba(212, 175, 55, 1)',
      onColor1: '#FFFFFF',
      onColor2: '#000000',
      onColor3: '#FFFFFF',
      onAccent: '#000000',
    },
  );
});

test('keeps optional color 2 and color 3 empty', () => {
  const theme = resolveClubTheme({
    color1Hex: '#007A3D',
    color1Rgba: 'rgba(0, 122, 61, 1)',
    color2Hex: null,
    color2Rgba: null,
    color3Hex: null,
    color3Rgba: null,
    accentColorHex: null,
    accentColorRgba: null,
  });

  assert.equal(theme.color2, null);
  assert.equal(theme.color2Rgba, null);
  assert.equal(theme.color3, null);
  assert.equal(theme.color3Rgba, null);
  assert.equal(theme.accent, '#007A3D');
  assert.equal(theme.accentRgba, 'rgba(0, 122, 61, 1)');
});

test('normalizes lowercase hex values', () => {
  const theme = resolveClubTheme({
    color1Hex: '#5b2c83',
    color1Rgba: 'rgba(91, 44, 131, 1)',
    color2Hex: '#ffffff',
    color2Rgba: 'rgba(255, 255, 255, 1)',
    color3Hex: null,
    color3Rgba: null,
    accentColorHex: '#d4af37',
    accentColorRgba: 'rgba(212, 175, 55, 1)',
  });

  assert.equal(theme.color1, '#5B2C83');
  assert.equal(theme.color2, '#FFFFFF');
  assert.equal(theme.accent, '#D4AF37');
});

test('uses safe fallbacks for invalid required values', () => {
  const theme = resolveClubTheme({
    color1Hex: 'invalid',
    color1Rgba: 'invalid',
    color2Hex: null,
    color2Rgba: null,
    color3Hex: null,
    color3Rgba: null,
    accentColorHex: null,
    accentColorRgba: null,
  });

  assert.equal(theme.color1, '#171717');
  assert.equal(theme.color1Rgba, 'rgba(23, 23, 23, 1)');
  assert.equal(theme.accent, '#171717');
  assert.equal(theme.accentRgba, 'rgba(23, 23, 23, 1)');
});

test('chooses a readable black or white foreground', () => {
  assert.equal(getReadableTextColor('#FFFFFF'), '#000000');
  assert.equal(getReadableTextColor('#000000'), '#FFFFFF');
  assert.equal(getReadableTextColor('#FFFF00'), '#000000');
  assert.equal(getReadableTextColor('#000080'), '#FFFFFF');
});

test('converts theme to CSS custom properties', () => {
  const theme = resolveClubTheme({
    color1Hex: '#007A3D',
    color1Rgba: 'rgba(0, 122, 61, 1)',
    color2Hex: '#FFFFFF',
    color2Rgba: 'rgba(255, 255, 255, 1)',
    color3Hex: null,
    color3Rgba: null,
    accentColorHex: '#D4AF37',
    accentColorRgba: 'rgba(212, 175, 55, 1)',
  });

  assert.deepEqual(clubThemeToCssProperties(theme), {
    '--kf-club-color-1': '#007A3D',
    '--kf-club-color-1-rgba': 'rgba(0, 122, 61, 1)',
    '--kf-club-color-2': '#FFFFFF',
    '--kf-club-color-2-rgba': 'rgba(255, 255, 255, 1)',
    '--kf-club-color-3': 'transparent',
    '--kf-club-color-3-rgba': 'rgba(0, 0, 0, 0)',
    '--kf-club-accent': '#D4AF37',
    '--kf-club-accent-rgba': 'rgba(212, 175, 55, 1)',
    '--kf-club-on-color-1': '#FFFFFF',
    '--kf-club-on-color-2': '#000000',
    '--kf-club-on-color-3': 'currentColor',
    '--kf-club-on-accent': '#000000',
  });
});
