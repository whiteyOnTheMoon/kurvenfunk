import type { DatabaseClient } from '@kurvenfunk/database';

import { addCommentYellowCardBadges } from './comment-yellow-card';

type BadgeDatabase = Pick<DatabaseClient, 'moderationCard'>;

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';

function comment(id: string, status = 'VISIBLE', authorId: string | null = USER_ID) {
  return {
    id,
    authorId,
    status,
  };
}

function createDatabase(
  cards: Array<{
    sourceId: string | null;
    userId: string;
  }> = [],
) {
  const findMany = jest.fn().mockResolvedValue(cards);

  const database = {
    moderationCard: {
      findMany,
    },
  } as unknown as BadgeDatabase;

  return {
    database,
    findMany,
  };
}

describe('Comment Yellow Card Badges', () => {
  it('shows a yellow card for the warned comment', async () => {
    const { database } = createDatabase([
      {
        sourceId: 'comment-1',
        userId: USER_ID,
      },
    ]);

    const result = await addCommentYellowCardBadges(database, [comment('comment-1')]);

    expect(result[0].hasYellowCard).toBe(true);
  });

  it('does not mark unrelated comments', async () => {
    const { database } = createDatabase([
      {
        sourceId: 'comment-1',
        userId: USER_ID,
      },
    ]);

    const result = await addCommentYellowCardBadges(database, [
      comment('comment-1'),
      comment('comment-2'),
    ]);

    expect(result[0].hasYellowCard).toBe(true);
    expect(result[1].hasYellowCard).toBe(false);
  });

  it('checks that the card belongs to the author', async () => {
    const { database } = createDatabase([
      {
        sourceId: 'comment-1',
        userId: OTHER_USER_ID,
      },
    ]);

    const result = await addCommentYellowCardBadges(database, [comment('comment-1')]);

    expect(result[0].hasYellowCard).toBe(false);
  });

  it('never marks deleted comments', async () => {
    const { database, findMany } = createDatabase();

    const result = await addCommentYellowCardBadges(database, [comment('comment-1', 'DELETED')]);

    expect(result[0].hasYellowCard).toBe(false);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('never marks comments without an author', async () => {
    const { database, findMany } = createDatabase();

    const result = await addCommentYellowCardBadges(database, [
      comment('comment-1', 'VISIBLE', null),
    ]);

    expect(result[0].hasYellowCard).toBe(false);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('does not query an empty comment page', async () => {
    const { database, findMany } = createDatabase();

    const result = await addCommentYellowCardBadges(database, []);

    expect(result).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('only queries active non-expired yellow cards', async () => {
    const { database, findMany } = createDatabase();

    const fixedNow = new Date('2026-10-16T12:00:00.000Z');

    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);

    try {
      await addCommentYellowCardBadges(database, [comment('comment-1')]);

      expect(findMany).toHaveBeenCalledTimes(1);

      expect(findMany).toHaveBeenCalledWith({
        where: {
          type: 'YELLOW',
          status: 'ACTIVE',
          sourceType: 'COMMENT',

          sourceId: {
            in: ['comment-1'],
          },

          OR: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                gt: fixedNow,
              },
            },
          ],
        },

        select: {
          sourceId: true,
          userId: true,
        },
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('never returns private moderation information', async () => {
    const { database } = createDatabase([
      {
        sourceId: 'comment-1',
        userId: USER_ID,
      },
    ]);

    const result = await addCommentYellowCardBadges(database, [comment('comment-1')]);

    expect(result[0]).toEqual({
      id: 'comment-1',
      authorId: USER_ID,
      status: 'VISIBLE',
      hasYellowCard: true,
    });

    expect(result[0]).not.toHaveProperty('moderatorNote');
    expect(result[0]).not.toHaveProperty('reasonCode');
  });
});
