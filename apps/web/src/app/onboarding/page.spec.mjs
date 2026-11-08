import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./page.module.css', import.meta.url), 'utf8');
const clubs = readFileSync(new URL('../../features/onboarding/club-selection.tsx', import.meta.url), 'utf8');

test('onboarding provides a searchable, responsive club selection', () => {
  assert.match(clubs, /type="search"/);
  assert.match(clubs, /type="radio"/);
  assert.match(css, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});
