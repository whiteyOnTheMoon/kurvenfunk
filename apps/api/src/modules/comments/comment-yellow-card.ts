import type { DatabaseClient } from '@kurvenfunk/database';

interface CommentBadgeCandidate {
  id: string;
  authorId: string | null;
  status: string;
}

export interface YellowCardBadge {
  hasYellowCard: boolean;
}

type YellowCardDatabase = Pick<DatabaseClient, 'moderationCard'>;

/**
 * Adds public yellow-card indicators to an already selected
 * collection of comments.
 *
 * Only active, non-expired yellow cards issued specifically
 * for the comment and its author are considered.
 *
 * Private moderation information is never returned.
 */
export async function addCommentYellowCardBadges<T extends CommentBadgeCandidate>(
  database: YellowCardDatabase,
  comments: readonly T[],
): Promise<Array<T & YellowCardBadge>> {
  const eligibleComments = comments.filter(
    (comment) => comment.status === 'VISIBLE' && comment.authorId !== null,
  );

  if (eligibleComments.length === 0) {
    return comments.map((comment) => ({
      ...comment,
      hasYellowCard: false,
    }));
  }

  const now = new Date();

  const cards = await database.moderationCard.findMany({
    where: {
      type: 'YELLOW',
      status: 'ACTIVE',
      sourceType: 'COMMENT',

      sourceId: {
        in: eligibleComments.map((comment) => comment.id),
      },

      OR: [
        {
          expiresAt: null,
        },
        {
          expiresAt: {
            gt: now,
          },
        },
      ],
    },

    select: {
      sourceId: true,
      userId: true,
    },
  });

  const warnedComments = new Set(cards.map((card) => `${card.sourceId}:${card.userId}`));

  return comments.map((comment) => ({
    ...comment,

    hasYellowCard:
      comment.status === 'VISIBLE' &&
      comment.authorId !== null &&
      warnedComments.has(`${comment.id}:${comment.authorId}`),
  }));
}
