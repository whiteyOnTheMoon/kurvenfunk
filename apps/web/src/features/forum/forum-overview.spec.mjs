import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const overview = readFileSync(new URL('./forum-overview.tsx', import.meta.url), 'utf8');
const moduleCss = readFileSync(new URL('./forum-overview.module.css', import.meta.url), 'utf8');

describe('Phase 22.209 forum navigation', () => {
  it('fetches only real public categories from the API', () => {
    assert.match(overview, /api\/v1\/forums\/categories/);
    assert.match(overview, /cache: 'no-store'/);
    assert.doesNotMatch(overview, /mockCategories|fakeCategories|demoForums|seedForums/);
  });

  it('shows empty and error states rather than invented categories or threads', () => {
    assert.match(overview, /Noch keine freigegebenen Forenkategorien vorhanden/);
    assert.match(overview, /In dieser Kategorie sind noch keine Foren eingerichtet/);
    assert.match(overview, /Die Forenübersicht ist derzeit nicht erreichbar/);
  });

  it('supports smaller screens and category detail URLs', () => {
    assert.match(moduleCss, /@media \(max-width: 640px\)/);
    assert.match(overview, /\/forum\/kategorie\//);
  });
});
