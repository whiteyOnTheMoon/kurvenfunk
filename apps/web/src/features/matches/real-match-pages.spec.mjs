import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const schedule = readFileSync(new URL('./match-schedule-page.tsx', import.meta.url), 'utf8');
const detail = readFileSync(new URL('./match-detail.tsx', import.meta.url), 'utf8');
const page = readFileSync(new URL('../../app/spiele/[id]/page.tsx', import.meta.url), 'utf8');

describe('Phase 21.207 real match pages', () => {
  it('never presents fabricated fixtures or mock match links on API failure', () => {
    assert.doesNotMatch(schedule, /mockData|mockClubs|mock-match|Vorschau/);
    assert.match(schedule, /response\.status === 404/);
    assert.match(schedule, /Spielplan derzeit nicht verfügbar/);
    assert.match(schedule, /Noch kein Spielplan vorhanden/);
  });

  it('uses canonical match IDs, truthful status and no guessed logo URLs', () => {
    assert.match(schedule, /href=\{\`\/spiele\/\$\{match\.id\}\`\}/);
    assert.match(detail, /getClubLogoSrc/);
    assert.match(schedule, /getClubLogoSrc/);
    assert.match(schedule, /logoFallback/);
    assert.match(detail, /match\.status === 'LIVE'/);
    assert.match(detail, /Spielstand/);
    assert.match(detail, /Kein Spielstand/);
    assert.doesNotMatch(detail, /src=\{\`\/clubs\//);
  });

  it('keeps the server route 404-aware and describes real participating clubs', () => {
    assert.match(page, /response\.status === 404/);
    assert.match(page, /notFound\(\)/);
    assert.match(page, /generateMetadata/);
    assert.match(page, /cache: 'no-store'/);
  });
});
