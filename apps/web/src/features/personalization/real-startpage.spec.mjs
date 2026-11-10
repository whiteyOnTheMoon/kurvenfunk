import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('./personalized-startpage.tsx', import.meta.url), 'utf8');

describe('Real startpage sport data', () => {
  it('does not ship the fake sports and community dataset', () => {
    assert.equal(existsSync(new URL('./startpage-mock-data.ts', import.meta.url)), false);
    assert.doesNotMatch(source, /startpage-mock-data|clubNextMatch|clubLastMatch|currentMatches|mockMatches|MockMatch/);
    assert.doesNotMatch(source, /9 Punkte|3 Spielen|4\. Spieltag|Diskussionen|replies: 84/);
  });

  it('uses genuine match and standings endpoints with truthful empty states', () => {
    assert.match(source, /api\/v1\/matches\?competition=austrian-bundesliga/);
    assert.match(source, /api\/v1\/standings\/austrian-bundesliga/);
    assert.match(source, /Noch keine bestätigte Tabelle vorhanden/);
    assert.match(source, /Noch kein bestätigtes Endergebnis vorhanden/);
    assert.match(source, /Noch kein kommendes Spiel hinterlegt/);
  });
});
