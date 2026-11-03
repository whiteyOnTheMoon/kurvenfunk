import type { DatabaseClient } from '@kurvenfunk/database';

import {
  RED_CARD_YELLOW_THRESHOLD,
  countRelevantYellowCards,
  getYellowCardCounterStage,
} from './yellow-card-counter';

const USER_ID = '11111111-1111-4111-8111-111111111111';

describe('Yellow Card Counter', () => {
  it.each([
    [0, 'NONE'],
    [1, 'YELLOW'],
    [2, 'SECOND_YELLOW'],
    [3, 'RED_CARD_REQUIRED'],
    [4, 'RED_CARD_REQUIRED'],
    [12, 'RED_CARD_REQUIRED'],
  ] as const)('maps %i relevant cards to %s', (count, stage) => {
    expect(getYellowCardCounterStage(count)).toBe(stage);
  });

  it('uses the three-yellow threshold', () => {
    expect(RED_CARD_YELLOW_THRESHOLD).toBe(3);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid count %s',
    (count) => {
      expect(() => getYellowCardCounterStage(count)).toThrow(RangeError);
    },
  );

  it('counts only active, non-expired and non-revoked yellow cards', async () => {
    const count = jest.fn().mockResolvedValue(2);
    const database = {
      moderationCard: { count },
    } as unknown as Pick<DatabaseClient, 'moderationCard'>;
    const at = new Date('2026-11-03T14:00:00.000Z');

    await expect(countRelevantYellowCards(database, USER_ID, at)).resolves.toBe(2);

    expect(count).toHaveBeenCalledTimes(1);
    expect(count).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        type: 'YELLOW',
        status: 'ACTIVE',
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: at } }],
      },
    });
  });

  it('propagates a database failure rather than guessing a count', async () => {
    const count = jest.fn().mockRejectedValue(new Error('Database unavailable'));
    const database = {
      moderationCard: { count },
    } as unknown as Pick<DatabaseClient, 'moderationCard'>;

    await expect(
      countRelevantYellowCards(database, USER_ID, new Date()),
    ).rejects.toThrow('Database unavailable');
  });
});
