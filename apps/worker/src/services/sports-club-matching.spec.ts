import {
  normalizeSportsClubName,
  resolveSportsClubName,
  type SportsClubCandidate,
} from './sports-club-matching';

describe('resolveSportsClubName', () => {
  const clubs: SportsClubCandidate[] = [
    {
      id: 'rapid',
      name: 'Sportklub Rapid Wien',
      aliases: [{ normalizedAlias: 'rapid wien' }, { normalizedAlias: 'sk rapid' }],
    },
    {
      id: 'austria',
      name: 'FK Austria Wien',
      aliases: [{ normalizedAlias: 'austria wien' }, { normalizedAlias: 'sk rapid' }],
    },
    {
      id: 'linz',
      name: 'Blau-Weiß Linz',
      aliases: [{ normalizedAlias: 'blau weiss linz' }],
    },
  ];

  it('normalizes case, whitespace, punctuation and accents conservatively', () => {
    expect(normalizeSportsClubName('  BLAU   WEISS – Linz  ')).toBe('blau weiss linz');
    expect(normalizeSportsClubName('Blau-Weiß Linz')).toBe('blau weiss linz');
    expect(normalizeSportsClubName('SK RAPID WIEN')).toBe('sk rapid wien');
    expect(normalizeSportsClubName('')).toBe('');
  });

  it('matches a single canonical full name', () => {
    expect(resolveSportsClubName('  SPORTKLUB  Rapid Wien ', clubs)).toEqual({
      kind: 'MATCHED',
      clubId: 'rapid',
      method: 'CANONICAL_NAME',
    });
  });

  it('matches a unique active alias, but never a fuzzy substring', () => {
    expect(resolveSportsClubName(' Rapid   Wien ', clubs)).toEqual({
      kind: 'MATCHED',
      clubId: 'rapid',
      method: 'ALIAS',
    });
    expect(resolveSportsClubName('Rapid', clubs)).toEqual({
      kind: 'UNMATCHED',
      candidateCount: 0,
    });
  });

  it('rejects an alias shared across clubs instead of picking the first result', () => {
    expect(resolveSportsClubName('SK Rapid', clubs)).toEqual({
      kind: 'AMBIGUOUS',
      candidateCount: 2,
    });
    expect(resolveSportsClubName('sk rapid', [...clubs].reverse())).toEqual({
      kind: 'AMBIGUOUS',
      candidateCount: 2,
    });
  });

  it('treats canonical name and another club alias as ambiguous', () => {
    expect(
      resolveSportsClubName('Rapid Wien', [
        ...clubs,
        { id: 'different', name: 'Another Club', aliases: [{ normalizedAlias: 'rapid wien' }] },
      ]),
    ).toEqual({ kind: 'AMBIGUOUS', candidateCount: 2 });
  });

  it('rejects empty, too short and unknown values without guessing', () => {
    for (const name of ['', ' ', 'SK', 'unknown club']) {
      expect(resolveSportsClubName(name, clubs).kind).toBe('UNMATCHED');
    }
  });

  it('counts a matching canonical name and alias of one club only once', () => {
    expect(
      resolveSportsClubName('FC Test', [
        {
          id: 'one',
          name: 'FC Test',
          aliases: [{ normalizedAlias: 'fc test' }, { normalizedAlias: 'fc test' }],
        },
      ]),
    ).toEqual({ kind: 'MATCHED', clubId: 'one', method: 'CANONICAL_NAME' });
  });
});
