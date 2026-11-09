/**
 * Deterministic, side-effect-free standings calculator.
 * The service owns scopes, permission checks, DB writes and season rules.
 */
export type RankingProfile = 'STANDARD' | 'AUSTRIAN_BUNDESLIGA_2026' | 'AUSTRIAN_BUNDESLIGA_LEGACY';

export interface CalculationMatch {
  homeClubId: string;
  awayClubId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

export interface CalculationRow {
  clubId: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  deductionPoints: number;
  awayWins: number;
  awayGoals: number;
}

export interface CalculationOptions {
  profile: RankingProfile;
  /** Applied after aggregating every FINISHED match in the calculation scope. */
  pointsAdjustments?: Readonly<Record<string, number>>;
  /** Persisted deductions retained in the canonical standing row. */
  deductionPoints?: Readonly<Record<string, number>>;
  /** Pre-2026 Bundesliga only: a halved point was rounded down for this club. */
  legacyRoundedDown?: Readonly<Record<string, boolean>>;
  /** For group standings, include results versus clubs in the other group. */
  allowExternalOpponents?: boolean;
}

export interface CalculationResult {
  rows: CalculationRow[];
  finishedMatches: number;
  excludedMatches: number;
  unresolvedTies: string[][];
}

interface MutableRow extends CalculationRow {
  earnedPoints: number;
}

function zero(clubId: string, deductionPoints: number): MutableRow {
  return {
    clubId,
    position: 0,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    earnedPoints: 0,
    deductionPoints,
    awayWins: 0,
    awayGoals: 0,
  };
}

function countMatch(
  home: MutableRow,
  away: MutableRow,
  homeScore: number,
  awayScore: number,
): void {
  home.played++;
  away.played++;
  home.goalsFor += homeScore;
  home.goalsAgainst += awayScore;
  away.goalsFor += awayScore;
  away.goalsAgainst += homeScore;
  away.awayGoals += awayScore;
  if (homeScore > awayScore) {
    home.won++;
    away.lost++;
    home.earnedPoints += 3;
  } else if (homeScore < awayScore) {
    away.won++;
    home.lost++;
    away.awayWins++;
    away.earnedPoints += 3;
  } else {
    home.drawn++;
    away.drawn++;
    home.earnedPoints++;
    away.earnedPoints++;
  }
}

export function earnedPointsFor(
  matches: readonly CalculationMatch[],
  clubIds: readonly string[],
): Record<string, number> {
  const calculated = calculateStandings(matches, clubIds, { profile: 'STANDARD' });
  // Do not require ties to be resolved when counting regular-phase points.
  return Object.fromEntries(calculated.rows.map((row) => [row.clubId, row.won * 3 + row.drawn]));
}

function compareDescending(left: number, right: number): number {
  return right - left;
}

export function calculateStandings(
  matches: readonly CalculationMatch[],
  clubIds: readonly string[],
  options: CalculationOptions,
): CalculationResult {
  const ids = [...new Set(clubIds)].sort();
  const current = new Map<string, MutableRow>();
  for (const id of ids) current.set(id, zero(id, options.deductionPoints?.[id] ?? 0));
  const finished: CalculationMatch[] = [];
  let excludedMatches = 0;
  for (const fixture of matches) {
    const hasHome = current.has(fixture.homeClubId);
    const hasAway = current.has(fixture.awayClubId);
    if (!hasHome && !hasAway && options.allowExternalOpponents) continue;
    if ((!hasHome || !hasAway) && !options.allowExternalOpponents) {
      throw new Error('CALCULATION_MATCH_OUTSIDE_SCOPE');
    }
    if (fixture.homeClubId === fixture.awayClubId) {
      throw new Error('CALCULATION_SAME_CLUB');
    }
    if (fixture.status !== 'FINISHED') {
      excludedMatches++;
      continue;
    }
    const h = fixture.homeScore;
    const a = fixture.awayScore;
    if (
      !Number.isSafeInteger(h) ||
      !Number.isSafeInteger(a) ||
      h === null ||
      a === null ||
      h < 0 ||
      a < 0
    ) {
      throw new Error('CALCULATION_INVALID_FINAL_SCORE');
    }
    countMatch(
      current.get(fixture.homeClubId) ?? zero(fixture.homeClubId, 0),
      current.get(fixture.awayClubId) ?? zero(fixture.awayClubId, 0),
      h,
      a,
    );
    finished.push(fixture);
  }

  for (const row of current.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    row.points = row.earnedPoints + (options.pointsAdjustments?.[row.clubId] ?? 0);
  }

  // Head-to-head mini-leagues are computed among ALL clubs tied on points
  // (and, for historical final groups, tied on the old rounding priority).
  const cohorts = new Map<string, string[]>();
  for (const row of current.values()) {
    const legacy = options.legacyRoundedDown?.[row.clubId] ? '1' : '0';
    const key = [row.points, options.profile === 'AUSTRIAN_BUNDESLIGA_LEGACY' ? legacy : ''].join(':');
    const idsAtPoints = cohorts.get(key) ?? [];
    idsAtPoints.push(row.clubId);
    cohorts.set(key, idsAtPoints);
  }
  const direct = new Map<string, MutableRow>();
  if (options.profile !== 'STANDARD') {
    for (const idsAtPoints of cohorts.values()) {
      const members = new Set(idsAtPoints);
      if (members.size < 2) continue;
      for (const id of members) direct.set(id, zero(id, 0));
      for (const fixture of finished) {
        if (!members.has(fixture.homeClubId) || !members.has(fixture.awayClubId)) continue;
        countMatch(
          direct.get(fixture.homeClubId)!,
          direct.get(fixture.awayClubId)!,
          fixture.homeScore!,
          fixture.awayScore!,
        );
      }
      for (const id of members) {
        const row = direct.get(id)!;
        row.goalDifference = row.goalsFor - row.goalsAgainst;
      }
    }
  }

  function compare(left: MutableRow, right: MutableRow): number {
    let result = compareDescending(left.points, right.points);
    if (result) return result;
    if (options.profile === 'AUSTRIAN_BUNDESLIGA_LEGACY') {
      // In the old final-group rules, the team that had a half-point
      // rounded DOWN at the split ranks first on equal overall points.
      result = Number(Boolean(options.legacyRoundedDown?.[right.clubId])) -
        Number(Boolean(options.legacyRoundedDown?.[left.clubId]));
      if (result) return result;
    }
    if (options.profile !== 'STANDARD') {
      const l = direct.get(left.clubId);
      const r = direct.get(right.clubId);
      if (l && r) {
        for (const [a, b] of [
          [l.earnedPoints, r.earnedPoints],
          [l.goalDifference, r.goalDifference],
          [l.goalsFor, r.goalsFor],
        ]) {
          result = compareDescending(a, b);
          if (result) return result;
        }
      }
    }
    for (const [a, b] of [
      [left.goalDifference, right.goalDifference],
      [left.goalsFor, right.goalsFor],
      [left.won, right.won],
      [left.awayWins, right.awayWins],
      [left.awayGoals, right.awayGoals],
    ]) {
      result = compareDescending(a, b);
      if (result) return result;
    }
    return 0;
  }

  const sorted = [...current.values()].sort(
    (left, right) => compare(left, right) || left.clubId.localeCompare(right.clubId),
  );
  const unresolvedTies: string[][] = [];
  for (let index = 0; index < sorted.length; ) {
    let end = index + 1;
    while (end < sorted.length && compare(sorted[index]!, sorted[end]!) === 0) end++;
    if (end - index > 1) unresolvedTies.push(sorted.slice(index, end).map((row) => row.clubId));
    index = end;
  }
  const rows = sorted.map((row, index) => ({
    clubId: row.clubId,
    position: index + 1,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
    points: row.points,
    deductionPoints: row.deductionPoints,
    awayWins: row.awayWins,
    awayGoals: row.awayGoals,
  }));
  return { rows, finishedMatches: finished.length, excludedMatches, unresolvedTies };
}

/** Selects historical rules by season, not by the current wall-clock year. */
export function profileForCompetition(
  competitionSlug: string,
  seasonSlug: string,
): RankingProfile {
  if (competitionSlug !== 'austrian-bundesliga') return 'STANDARD';
  const year = Number(seasonSlug.slice(0, 4));
  if (!/^\d{4}-\d{2}$/.test(seasonSlug) || !Number.isInteger(year) || year < 2018) {
    throw new Error('CALCULATION_UNSUPPORTED_BUNDESLIGA_SEASON');
  }
  return year >= 2026 ? 'AUSTRIAN_BUNDESLIGA_2026' : 'AUSTRIAN_BUNDESLIGA_LEGACY';
}
