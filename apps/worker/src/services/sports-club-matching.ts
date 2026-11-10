/**
 * Phase 21.202: conservative, provider-independent text matching.
 * No fuzzy matching or implicit use of presentation-only shortName.
 * Multiple active clubs sharing a name/alias must never be chosen arbitrarily.
 */
export interface SportsClubCandidate {
  id: string;
  name: string;
  aliases: readonly { normalizedAlias: string }[];
}

export type SportsClubResolution =
  | { kind: 'MATCHED'; clubId: string; method: 'CANONICAL_NAME' | 'ALIAS' }
  | { kind: 'UNMATCHED' | 'AMBIGUOUS'; candidateCount: number };

export function normalizeSportsClubName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('de')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function resolveSportsClubName(
  providerName: string,
  clubs: readonly SportsClubCandidate[],
): SportsClubResolution {
  const name = normalizeSportsClubName(providerName);
  // Do not auto-resolve vague abbreviations or empty names.
  if (name.length < 3) return { kind: 'UNMATCHED', candidateCount: 0 };

  const candidates = new Map<string, 'CANONICAL_NAME' | 'ALIAS'>();
  for (const club of clubs) {
    if (normalizeSportsClubName(club.name) === name) {
      candidates.set(club.id, 'CANONICAL_NAME');
      continue;
    }

    if (club.aliases.some((alias) => normalizeSportsClubName(alias.normalizedAlias) === name)) {
      candidates.set(club.id, 'ALIAS');
    }
  }

  if (candidates.size === 0) return { kind: 'UNMATCHED', candidateCount: 0 };
  if (candidates.size > 1) return { kind: 'AMBIGUOUS', candidateCount: candidates.size };

  for (const [clubId, method] of candidates) {
    return { kind: 'MATCHED', clubId, method };
  }
  return { kind: 'UNMATCHED', candidateCount: 0 };
}
