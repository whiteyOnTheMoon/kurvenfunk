import {
  calculateStandings,
  earnedPointsFor,
  profileForCompetition,
  type CalculationMatch,
} from './standing-calculator';

const a = 'a';
const b = 'b';
const c = 'c';
function match(
  homeClubId: string,
  awayClubId: string,
  homeScore: number | null,
  awayScore: number | null,
  status = 'FINISHED',
): CalculationMatch {
  return { homeClubId, awayClubId, homeScore, awayScore, status };
}

describe('Phase 21.198 deterministic standings', () => {
  it('counts only finished results, 0:0 and home/away stats; rejects bad final scores', () => {
    const result = calculateStandings(
      [match(a, b, 2, 1), match(b, a, 0, 0), match(a, c, null, null, 'LIVE')],
      [a, b, c],
      { profile: 'STANDARD' },
    );
    expect(result.finishedMatches).toBe(2);
    expect(result.excludedMatches).toBe(1);
    expect(
      result.rows.map((r) => [r.clubId, r.position, r.played, r.points, r.goalDifference]),
    ).toEqual([
      [a, 1, 2, 4, 1],
      [b, 2, 2, 1, -1],
      [c, 3, 0, 0, 0],
    ]);
    expect(result.rows.find((r) => r.clubId === a)?.awayGoals).toBe(0);
    expect(earnedPointsFor([match(a, b, 2, 1)], [a, b])).toEqual({ a: 3, b: 0 });
    expect(() =>
      calculateStandings([match(a, b, null, 0)], [a, b], { profile: 'STANDARD' }),
    ).toThrow('CALCULATION_INVALID_FINAL_SCORE');
  });

  it('uses Austrian 2026 direct-duel tiebreak before overall goal difference', () => {
    const d = 'd';
    const fixtures = [
      match(a, b, 1, 0), // a wins the direct duel
      match(a, c, 0, 1),
      match(b, c, 5, 0),
      match(a, d, 1, 0),
      match(b, d, 1, 0),
    ];
    // a and b each get 6 points, but b has much better overall goal difference.
    const result = calculateStandings(fixtures, [a, b, c, d], {
      profile: 'AUSTRIAN_BUNDESLIGA_2026',
    });
    expect(result.rows.map((row) => row.clubId)).toEqual([a, b, c, d]);
    expect(result.rows.find((row) => row.clubId === a)?.goalDifference).toBe(1);
  });

  it('does not treat a remaining fully tied official rank as definitive', () => {
    const preview = calculateStandings([match(a, b, 0, 0)], [a, b], {
      profile: 'AUSTRIAN_BUNDESLIGA_2026',
    });
    expect(preview.unresolvedTies).toEqual([[a, b]]);
  });

  it('preserves independent deductions and legacy rounded-down tiebreak priority', () => {
    const fixtures = [match(a, b, 1, 0), match(b, c, 2, 0), match(c, a, 1, 0)];
    const old = calculateStandings(fixtures, [a, b, c], {
      profile: 'AUSTRIAN_BUNDESLIGA_LEGACY',
      pointsAdjustments: { a: -1, b: -1, c: -1 },
      deductionPoints: { b: 2 },
      legacyRoundedDown: { a: true },
    });
    expect(old.rows[0]?.clubId).toBe(a);
    expect(old.rows.find((r) => r.clubId === b)?.deductionPoints).toBe(2);
  });


  it('carries full 2026 points and all pre-split goals versus other-group clubs', () => {
    const regular = [match(a, c, 2, 0), match(b, c, 1, 0)];
    const group = [match(a, b, 1, 1)];
    expect(earnedPointsFor(regular, [a, b])).toEqual({ a: 3, b: 3 });

    const fresh = calculateStandings([...regular, ...group], [a, b], {
      profile: 'AUSTRIAN_BUNDESLIGA_2026',
      allowExternalOpponents: true,
    });
    expect(fresh.rows.map((row) => [row.clubId, row.played, row.points, row.goalDifference]))
      .toEqual([[a, 2, 4, 2], [b, 2, 4, 1]]);

    const historic = calculateStandings([...regular, ...group], [a, b], {
      profile: 'AUSTRIAN_BUNDESLIGA_LEGACY',
      pointsAdjustments: { a: -2, b: -2 },
      legacyRoundedDown: { a: true, b: true },
      allowExternalOpponents: true,
    });
    expect(historic.rows.map((row) => row.points)).toEqual([2, 2]);
    expect(historic.rows.map((row) => row.played)).toEqual([2, 2]);
  });

  it('selects no-halving from 2026/27 and historic rule versions from 2018/19', () => {
    expect(profileForCompetition('austrian-bundesliga', '2026-27')).toBe(
      'AUSTRIAN_BUNDESLIGA_2026',
    );
    expect(profileForCompetition('austrian-bundesliga', '2025-26')).toBe(
      'AUSTRIAN_BUNDESLIGA_LEGACY',
    );
    expect(profileForCompetition('austrian-2-liga', '2026-27')).toBe('STANDARD');
    expect(() => profileForCompetition('austrian-bundesliga', '2015-16')).toThrow();
  });
});
