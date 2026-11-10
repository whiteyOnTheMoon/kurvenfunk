import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const page = readFileSync(new URL('./standings-page.tsx', import.meta.url), 'utf8');

describe('Phase 21.208 canonical standings', () => {
  it('loads the real Austrian Bundesliga competition and never exposes fake rows', () => {
    assert.match(page, /api\/v1\/standings\/austrian-bundesliga/);
    assert.doesNotMatch(page, /mockData|mockRows|standingsMockClubs|Vorschau|startpage-mock-data/);
    assert.match(page, /setData\(payload\.data \?\? null\)/);
  });

  it('distinguishes empty persisted rows from an API failure', () => {
    assert.match(page, /Noch keine aktuelle Tabelle/);
    assert.match(page, /Tabelle derzeit nicht verfügbar/);
    assert.match(page, /data && data\.standings\.length > 0/);
    assert.match(page, /cache: 'no-store'/);
  });

  it('does not invent public logos for previously unknown clubs', () => {
    assert.match(page, /getClubLogoSrc/);
    assert.match(page, /clubLogoFallback/);
    assert.doesNotMatch(page, /src=\{\`\/clubs\//);
  });
});
