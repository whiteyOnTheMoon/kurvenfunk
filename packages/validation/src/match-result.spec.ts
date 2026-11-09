import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { updateMatchResultSchema } from '../dist/match-result.js';

const lastUpdated = '2026-11-09T18:00:00.000Z';
const data = {
  status: 'FINISHED',
  homeScore: 0,
  awayScore: 0,
  expectedUpdatedAt: lastUpdated,
} as const;

describe('Task 196 score validation', () => {
  it('accepts a scoreless draw, live unknown scores, and partial abandoned match states', () => {
    assert.equal(updateMatchResultSchema.parse(data).homeScore, 0);
    assert.equal(
      updateMatchResultSchema.safeParse({
        ...data,
        status: 'LIVE',
        homeScore: null,
        awayScore: null,
      }).success,
      true,
    );
    assert.equal(
      updateMatchResultSchema.safeParse({
        ...data,
        status: 'ABANDONED',
        homeScore: 1,
        awayScore: 0,
      }).success,
      true,
    );
  });

  it('rejects negative, fractional, partial, ambiguous and nonfinal scores', () => {
    const invalid = [
      { ...data, homeScore: -1 },
      { ...data, awayScore: 1.5 },
      { ...data, homeScore: null },
      { ...data, status: 'FINISHED', homeScore: null, awayScore: null },
      { ...data, status: 'SCHEDULED' },
      { ...data, status: 'CANCELLED' },
      { ...data, score: '0:0' },
      { ...data, expectedUpdatedAt: '2026-11-09T18:00:00' },
      { ...data, expectedUpdatedAt: 'not-a-date' },
      { ...data, awayScore: 1000 },
      { ...data, homeScore: '1' },
    ];
    for (const input of invalid) {
      assert.equal(updateMatchResultSchema.safeParse(input).success, false);
    }
  });
});
