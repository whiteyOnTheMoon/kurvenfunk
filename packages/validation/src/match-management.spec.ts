import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createFixtureSchema, updateFixtureSchema } from '../dist/match-management.js';

const idA = '22222222-2222-4222-8222-222222222222';
const idB = '33333333-3333-4333-8333-333333333333';
const idC = '44444444-4444-4444-8444-444444444444';

const sample = {
  competitionId: idA,
  seasonId: idB,
  homeClubId: idA,
  awayClubId: idC,
  kickoff: '2026-10-23T19:30:00.000+02:00',
};

describe('Task 195 match fixture validation', () => {
  it('allows scheduled fixture kickoff with explicit offset and optional matchday', () => {
    const input = createFixtureSchema.parse({ ...sample, matchday: null, status: 'POSTPONED' });
    assert.equal(input.kickoff, '2026-10-23T19:30:00.000+02:00');
    assert.equal(input.matchday, null);
    assert.equal(input.status, 'POSTPONED');
  });

  it('rejects ambiguous timezones, invalid matches and result fields', () => {
    for (const invalid of [
      { ...sample, kickoff: '2026-10-23T19:30:00' },
      { ...sample, homeClubId: idC },
      { ...sample, homeClubId: 'not-a-uuid' },
      { ...sample, matchday: -1 },
      { ...sample, matchday: 1000 },
      { ...sample, status: 'FINISHED' },
      { ...sample, homeScore: 0, awayScore: 0 },
    ]) {
      assert.equal(createFixtureSchema.safeParse(invalid).success, false);
    }
  });

  it('never permits modifying result, competition or season identity via patch', () => {
    for (const invalid of [
      {},
      { seasonId: idC },
      { competitionId: idB },
      { homeScore: 2 },
      { status: 'LIVE' },
      { matchday: 0 },
    ]) {
      assert.equal(updateFixtureSchema.safeParse(invalid).success, false);
    }
    assert.deepEqual(updateFixtureSchema.parse({ status: 'SCHEDULED' }), {
      status: 'SCHEDULED',
    });
  });
});
