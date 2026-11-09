import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createStandingSchema, updateStandingSchema } from '../dist/standing-management.js';

const base = {
  clubId: '11111111-1111-4111-8111-111111111111',
  stageId: null,
  position: 1,
  played: 3,
  won: 2,
  drawn: 1,
  lost: 0,
  goalsFor: 6,
  goalsAgainst: 2,
  points: 7,
  deductionPoints: 0,
  sortOrder: null,
};

describe('Task 197 standing row validation', () => {
  it('accepts a season-wide standing and canonical points independent of a formula', () => {
    assert.deepEqual(createStandingSchema.parse({ ...base, points: 4, deductionPoints: 3 }), {
      ...base,
      points: 4,
      deductionPoints: 3,
    });
    assert.equal(
      updateStandingSchema.safeParse({
        position: base.position,
        played: base.played,
        won: base.won,
        drawn: base.drawn,
        lost: base.lost,
        goalsFor: base.goalsFor,
        goalsAgainst: base.goalsAgainst,
        points: base.points,
        deductionPoints: base.deductionPoints,
        sortOrder: base.sortOrder,
        expectedUpdatedAt: '2026-11-09T18:00:00.000Z',
      }).success,
      true,
    );
  });

  it('rejects incoherent games, invalid stats and immutable identity edits', () => {
    for (const candidate of [
      { ...base, played: 4 },
      { ...base, won: -1 },
      { ...base, position: 0 },
      { ...base, goalsFor: -1 },
      { ...base, points: '7' },
      { ...base, goalDifference: 4 },
      { ...base, id: 'new-id' },
    ]) {
      assert.equal(createStandingSchema.safeParse(candidate).success, false);
    }
    assert.equal(
      updateStandingSchema.safeParse({
        ...base,
        expectedUpdatedAt: '2026-11-09T18:00:00',
      }).success,
      false,
    );
    assert.equal(
      updateStandingSchema.safeParse({
        position: 1,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        deductionPoints: 0,
        sortOrder: null,
        seasonId: '11111111-1111-4111-8111-111111111111',
        expectedUpdatedAt: '2026-11-09T18:00:00.000Z',
      }).success,
      false,
    );
  });
});
