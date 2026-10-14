import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';

type VoteType = 'UPVOTE' | 'DOWNVOTE';
type UserStatus = 'ACTIVE' | 'LIMITED' | 'BANNED';

interface VoteCommand {
  commentId: string;
  userId: string;
  userStatus: UserStatus;
}

interface SetVoteCommand extends VoteCommand {
  type: VoteType;
}

@Injectable()
export class ReactionsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  private async requireVisibleComment(commentId: string) {
    const comment = await this.database.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        status: true,
        deletedAt: true,
        article: {
          select: {
            status: true,
            deletedAt: true,
          },
        },
      },
    });

    if (
      !comment ||
      comment.status !== 'VISIBLE' ||
      comment.deletedAt !== null ||
      comment.article.status !== 'PUBLISHED' ||
      comment.article.deletedAt !== null
    ) {
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: 'Kommentar wurde nicht gefunden.',
      });
    }

    return comment;
  }

  private assertCanVote(status: UserStatus) {
    if (status !== 'ACTIVE' && status !== 'LIMITED') {
      throw new ForbiddenException({
        code: 'VOTE_FORBIDDEN',
        message: 'Mit diesem Accountstatus ist Voting nicht erlaubt.',
      });
    }
  }

  async getSummaries(commentIds: string[], userId?: string) {
    const uniqueIds = [...new Set(commentIds)];

    if (uniqueIds.length === 0 || uniqueIds.length > 100) {
      return [];
    }

    const visibleComments = await this.database.comment.findMany({
      where: {
        id: { in: uniqueIds },
        status: 'VISIBLE',
        deletedAt: null,
        article: {
          status: 'PUBLISHED',
          deletedAt: null,
        },
      },
      select: {
        id: true,
      },
    });

    const visibleIds = visibleComments.map((comment) => comment.id);

    if (visibleIds.length === 0) {
      return [];
    }

    const [counts, ownVotes] = await Promise.all([
      this.database.reaction.groupBy({
        by: ['commentId', 'type'],
        where: {
          commentId: { in: visibleIds },
          type: { in: ['UPVOTE', 'DOWNVOTE'] },
        },
        _count: { _all: true },
      }),
      userId
        ? this.database.reaction.findMany({
            where: {
              userId,
              commentId: { in: visibleIds },
            },
            select: {
              commentId: true,
              type: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const summaries = new Map(
      visibleIds.map((commentId) => [
        commentId,
        {
          commentId,
          upvotes: 0,
          downvotes: 0,
          score: 0,
          viewerVote: null as 'UPVOTE' | 'DOWNVOTE' | null,
        },
      ]),
    );

    for (const count of counts) {
      const summary = count.commentId ? summaries.get(count.commentId) : undefined;

      if (!summary) {
        continue;
      }

      if (count.type === 'UPVOTE') {
        summary.upvotes = count._count._all;
      } else if (count.type === 'DOWNVOTE') {
        summary.downvotes = count._count._all;
      }
    }

    for (const vote of ownVotes) {
      const summary = vote.commentId ? summaries.get(vote.commentId) : undefined;

      if (summary && (vote.type === 'UPVOTE' || vote.type === 'DOWNVOTE')) {
        summary.viewerVote = vote.type;
      }
    }

    return uniqueIds
      .map((commentId) => summaries.get(commentId))
      .filter((summary) => summary !== undefined)
      .map((summary) => ({
        ...summary,
        score: summary.upvotes - summary.downvotes,
      }));
  }

  async getSummary(commentId: string, userId?: string) {
    await this.requireVisibleComment(commentId);

    const [upvotes, downvotes, ownVote] = await Promise.all([
      this.database.reaction.count({
        where: { commentId, type: 'UPVOTE' },
      }),
      this.database.reaction.count({
        where: { commentId, type: 'DOWNVOTE' },
      }),
      userId
        ? this.database.reaction.findUnique({
            where: {
              userId_commentId: {
                userId,
                commentId,
              },
            },
            select: { type: true },
          })
        : Promise.resolve(null),
    ]);

    return {
      commentId,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      viewerVote: ownVote?.type === 'UPVOTE' || ownVote?.type === 'DOWNVOTE' ? ownVote.type : null,
    };
  }

  async setVote(command: SetVoteCommand) {
    this.assertCanVote(command.userStatus);

    const comment = await this.requireVisibleComment(command.commentId);

    if (comment.authorId === command.userId) {
      throw new ForbiddenException({
        code: 'SELF_VOTE_FORBIDDEN',
        message: 'Eigene Kommentare können nicht bewertet werden.',
      });
    }

    await this.database.reaction.upsert({
      where: {
        userId_commentId: {
          userId: command.userId,
          commentId: command.commentId,
        },
      },
      create: {
        userId: command.userId,
        commentId: command.commentId,
        type: command.type,
      },
      update: {
        type: command.type,
      },
    });

    return this.getSummary(command.commentId, command.userId);
  }

  async removeVote(command: VoteCommand) {
    this.assertCanVote(command.userStatus);

    await this.requireVisibleComment(command.commentId);

    await this.database.reaction.deleteMany({
      where: {
        userId: command.userId,
        commentId: command.commentId,
      },
    });

    return this.getSummary(command.commentId, command.userId);
  }

  async getVoters(commentId: string, type: VoteType, limit: number, cursor?: string) {
    await this.requireVisibleComment(commentId);

    if (cursor) {
      const cursorReaction = await this.database.reaction.findFirst({
        where: {
          id: cursor,
          commentId,
          type,
        },
        select: { id: true },
      });

      if (!cursorReaction) {
        throw new BadRequestException({
          code: 'INVALID_VOTE_CURSOR',
          message: 'Ungültiger Pagination-Cursor.',
        });
      }
    }

    const reactions = await this.database.reaction.findMany({
      where: {
        commentId,
        type,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    const hasMore = reactions.length > limit;
    const page = reactions.slice(0, limit);
    const last = page.at(-1);

    return {
      commentId,
      type,
      items: page.map((reaction) => ({
        userId: reaction.user.id,
        nickname: reaction.user.nickname,
      })),
      nextCursor: hasMore && last ? last.id : null,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
