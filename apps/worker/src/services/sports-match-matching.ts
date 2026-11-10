/**
 * Phase 21.203 – Conservative fixture identity resolution.
 * The external provider's result/status/score is NOT a matching criterion:
 * they can change without changing the real fixture's identity.
 */
export interface SportsMatchCandidate {
  id: string;
  homeClubId: string;
  awayClubId: string;
  competitionId: string;
  seasonId: string;
  kickoff: Date;
  matchday: number | null;
}

export type SportsMatchResolution =
  | { kind: 'MATCHED'; matchId: string }
  | { kind: 'UNMATCHED' | 'AMBIGUOUS'; candidateCount: number };

export const SPORTS_MATCH_KICKOFF_TOLERANCE_MS = 15 * 60 * 1000;

/** A full tuple match and at most 15 minutes difference are required. */
export function resolveSportsMatch(
  candidates: readonly SportsMatchCandidate[],
  input: {
    competitionId: string;
    seasonId: string;
    homeClubId: string;
    awayClubId: string;
    kickoff: Date;
    matchday?: number;
  },
): SportsMatchResolution {
  const matched = new Set<string>();
  const time = input.kickoff.getTime();
  if (!Number.isFinite(time) || input.homeClubId === input.awayClubId) {
    return { kind: 'UNMATCHED', candidateCount: 0 };
  }

  for (const candidate of candidates) {
    if (
      candidate.competitionId === input.competitionId &&
      candidate.seasonId === input.seasonId &&
      candidate.homeClubId === input.homeClubId &&
      candidate.awayClubId === input.awayClubId &&
      Number.isFinite(candidate.kickoff.getTime()) &&
      Math.abs(candidate.kickoff.getTime() - time) <= SPORTS_MATCH_KICKOFF_TOLERANCE_MS &&
      (input.matchday === undefined || candidate.matchday === input.matchday)
    ) {
      matched.add(candidate.id);
    }
  }

  if (matched.size === 0) return { kind: 'UNMATCHED', candidateCount: 0 };
  if (matched.size > 1) return { kind: 'AMBIGUOUS', candidateCount: matched.size };
  for (const matchId of matched) return { kind: 'MATCHED', matchId };
  return { kind: 'UNMATCHED', candidateCount: 0 };
}
