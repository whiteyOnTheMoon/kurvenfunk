import {
  resolveSportsMatch,
  SPORTS_MATCH_KICKOFF_TOLERANCE_MS,
  type SportsMatchCandidate,
} from './sports-match-matching';

const fixture: SportsMatchCandidate = {
  id: 'match-a',
  homeClubId: 'home-a',
  awayClubId: 'away-b',
  competitionId: 'competition-a',
  seasonId: 'season-a',
  kickoff: new Date('2026-08-01T15:00:00.000Z'),
  matchday: 1,
};
const identity = {
  competitionId: fixture.competitionId,
  seasonId: fixture.seasonId,
  homeClubId: fixture.homeClubId,
  awayClubId: fixture.awayClubId,
  kickoff: fixture.kickoff,
  matchday: 1,
};

describe('resolveSportsMatch', () => {
  it('resolves one canonical fixture matching the full identity', () => {
    expect(resolveSportsMatch([fixture], identity)).toEqual({
      kind: 'MATCHED',
      matchId: fixture.id,
    });
  });

  it('allows up to 15 minutes timestamp skew, inclusive', () => {
    const start = new Date(fixture.kickoff.getTime() - SPORTS_MATCH_KICKOFF_TOLERANCE_MS);
    const end = new Date(fixture.kickoff.getTime() + SPORTS_MATCH_KICKOFF_TOLERANCE_MS);
    expect(resolveSportsMatch([{ ...fixture, kickoff: start }], identity).kind).toBe('MATCHED');
    expect(resolveSportsMatch([{ ...fixture, kickoff: end }], identity).kind).toBe('MATCHED');
    expect(
      resolveSportsMatch([{ ...fixture, kickoff: new Date(end.getTime() + 1) }], identity).kind,
    ).toBe('UNMATCHED');
  });

  it('does not reverse home/away or use matches from another competition or season', () => {
    const candidates = [
      { ...fixture, homeClubId: fixture.awayClubId, awayClubId: fixture.homeClubId },
      { ...fixture, competitionId: 'competition-b' },
      { ...fixture, seasonId: 'season-b' },
    ];
    expect(resolveSportsMatch(candidates, identity)).toEqual({
      kind: 'UNMATCHED',
      candidateCount: 0,
    });
  });

  it('does not ignore matchday when provided, but accepts it when omitted', () => {
    expect(resolveSportsMatch([{ ...fixture, matchday: 2 }], identity).kind).toBe('UNMATCHED');
    const withoutMatchday = {
      competitionId: identity.competitionId,
      seasonId: identity.seasonId,
      homeClubId: identity.homeClubId,
      awayClubId: identity.awayClubId,
      kickoff: identity.kickoff,
    };
    expect(resolveSportsMatch([{ ...fixture, matchday: 2 }], withoutMatchday).kind).toBe('MATCHED');
  });

  it('marks two matching fixtures ambiguous without choosing the first', () => {
    const candidates = [fixture, { ...fixture, id: 'match-b' }];
    expect(resolveSportsMatch(candidates, identity)).toEqual({
      kind: 'AMBIGUOUS',
      candidateCount: 2,
    });
    expect(resolveSportsMatch([...candidates].reverse(), identity).kind).toBe('AMBIGUOUS');
  });

  it('deduplicates a repeated candidate UUID', () => {
    expect(resolveSportsMatch([fixture, { ...fixture }], identity)).toEqual({
      kind: 'MATCHED',
      matchId: 'match-a',
    });
  });

  it('rejects invalid kickoff dates and self-play', () => {
    expect(resolveSportsMatch([fixture], { ...identity, kickoff: new Date(NaN) }).kind).toBe(
      'UNMATCHED',
    );
    expect(
      resolveSportsMatch([fixture], { ...identity, awayClubId: identity.homeClubId }).kind,
    ).toBe('UNMATCHED');
  });
});
