import type { DatabaseClient } from '@kurvenfunk/database';

type YellowCardDatabase = Pick<DatabaseClient, 'moderationCard'>;

export const RED_CARD_YELLOW_THRESHOLD = 3;

export type YellowCardCounterStage =
  | 'NONE'
  | 'YELLOW'
  | 'SECOND_YELLOW'
  | 'RED_CARD_REQUIRED';

/**
 * The counter signals escalation; issuing the red card and banning
 * the account belong to Task 176.
 */
export function getYellowCardCounterStage(count: number): YellowCardCounterStage {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError('Yellow card count must be a non-negative integer');
  }

  if (count >= RED_CARD_YELLOW_THRESHOLD) {
    return 'RED_CARD_REQUIRED';
  }

  if (count === 2) {
    return 'SECOND_YELLOW';
  }

  if (count === 1) {
    return 'YELLOW';
  }

  return 'NONE';
}

/**
 * Relevant yellow cards are active, not revoked, and not expired.
 * Run this against the same transaction that created the new card,
 * after obtaining a row lock on the target user.
 */
export function countRelevantYellowCards(
  database: YellowCardDatabase,
  userId: string,
  at: Date,
): Promise<number> {
  return database.moderationCard.count({
    where: {
      userId,
      type: 'YELLOW',
      status: 'ACTIVE',
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: at } }],
    },
  });
}
