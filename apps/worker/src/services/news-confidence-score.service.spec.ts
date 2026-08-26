import { NewsConfidenceScoreService } from './news-confidence-score.service';

describe('NewsConfidenceScoreService', () => {
  const service = new NewsConfidenceScoreService();

  const clubsExact = {
    matches: [
      {
        clubId: 'club-1',
        clubName: 'Club One',
        matchedName: 'Club One',
        matchedAlias: 'Club One',
      },
      {
        clubId: 'club-2',
        clubName: 'Club Two',
        matchedName: 'Club Two',
        matchedAlias: 'Club Two',
      },
    ],
    unmatchedNames: [],
  };

  const competitionExact = {
    match: {
      competitionId: 'competition-1',
      competitionName: 'Bundesliga',
      matchedName: 'Bundesliga',
      matchedField: 'name' as const,
    },
    unmatchedName: null,
  };

  const noMatch = {
    match: null,
    ambiguous: false,
  };

  it('returns EXACT for an unambiguous match', () => {
    expect(
      service.score(clubsExact, competitionExact, {
        match: {
          matchId: 'match-1',
          homeClubId: 'club-1',
          awayClubId: 'club-2',
          competitionId: 'competition-1',
          kickoff: new Date('2026-08-23T15:00:00.000Z'),
        },
        ambiguous: false,
      }),
    ).toEqual({
      confidence: 'EXACT',
      reasons: ['match_exact'],
    });
  });

  it('returns HIGH when clubs and competition match exactly', () => {
    expect(service.score(clubsExact, competitionExact, noMatch)).toEqual({
      confidence: 'HIGH',
      reasons: ['clubs_exact', 'competition_exact'],
    });
  });

  it('returns MEDIUM when clubs match and competition was not supplied', () => {
    expect(
      service.score(
        clubsExact,
        {
          match: null,
          unmatchedName: null,
        },
        noMatch,
      ),
    ).toEqual({
      confidence: 'MEDIUM',
      reasons: ['clubs_exact', 'competition_missing'],
    });
  });

  it('returns LOW for partial club matching', () => {
    expect(
      service.score(
        {
          matches: [clubsExact.matches[0]],
          unmatchedNames: ['Unknown FC'],
        },
        {
          match: null,
          unmatchedName: null,
        },
        noMatch,
      ),
    ).toEqual({
      confidence: 'LOW',
      reasons: ['clubs_partial', 'clubs_unmatched'],
    });
  });

  it('returns LOW for an ambiguous match', () => {
    expect(
      service.score(clubsExact, competitionExact, {
        match: null,
        ambiguous: true,
      }),
    ).toEqual({
      confidence: 'LOW',
      reasons: ['match_ambiguous'],
    });
  });

  it('returns UNKNOWN when no matching evidence exists', () => {
    expect(
      service.score(
        {
          matches: [],
          unmatchedNames: [],
        },
        {
          match: null,
          unmatchedName: null,
        },
        noMatch,
      ),
    ).toEqual({
      confidence: 'UNKNOWN',
      reasons: ['no_match_evidence'],
    });
  });

  it('returns UNKNOWN when supplied entities are completely unmatched', () => {
    expect(
      service.score(
        {
          matches: [],
          unmatchedNames: ['Unknown FC'],
        },
        {
          match: null,
          unmatchedName: 'Unknown League',
        },
        noMatch,
      ),
    ).toEqual({
      confidence: 'UNKNOWN',
      reasons: ['clubs_unmatched', 'competition_unmatched', 'no_match_evidence'],
    });
  });
});
