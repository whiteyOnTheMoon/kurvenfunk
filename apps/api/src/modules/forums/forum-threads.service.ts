import { randomUUID } from 'node:crypto';

import { createPrismaClient, type DatabaseClient, type Prisma } from '@kurvenfunk/database';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import type { CreateForumReplyInput, CreateForumThreadInput } from '@kurvenfunk/validation';

import { CommentSpamProtectionService } from '../comments/comment-spam-protection.service';
import {
  encodeForumCursor,
  parsePostPageCursor,
  parseThreadPageCursor,
  POST_PAGE_SIZE,
  THREAD_PAGE_SIZE,
  threadKeysetAfter,
} from './forum-pagination';

const MAX_REPLY_CONFLICT_RETRIES = 5;

class RetryThreadReplyTransaction extends Error {}

function retryableThreadConflict(error: unknown): boolean {
  if (error instanceof RetryThreadReplyTransaction) return true;
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034';
}

function missingThread(): NotFoundException {
  return new NotFoundException({
    code: 'THREAD_NOT_FOUND',
    message: 'Dieses Diskussionsthema ist nicht verfügbar.',
  });
}

const publicThreadSelect = {
  id: true,
  forumId: true,
  title: true,
  slug: true,
  status: true,
  pinnedAt: true,
  postCount: true,
  lastPostAt: true,
  createdAt: true,
  author: { select: { id: true, nickname: true } },
} satisfies Prisma.ThreadSelect;

function visibleForumWhere(slug: string): Prisma.ForumWhereInput {
  return {
    slug,
    active: true,
    category: { active: true },
    OR: [{ clubId: null }, { club: { is: { active: true } } }],
  };
}

function missingForum(): NotFoundException {
  return new NotFoundException({
    code: 'FORUM_NOT_FOUND',
    message: 'Dieses Forum ist nicht verfügbar.',
  });
}

function threadSlug(title: string): string {
  const readable = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 70)
    .replace(/-+$/gu, '');

  return (readable || 'thema') + '-' + randomUUID();
}

@Injectable()
export class ForumThreadsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  constructor(private readonly spamProtection: CommentSpamProtectionService) {}

  /** Public, bounded keyset page. Ordering is deterministic even for timestamp ties. */
  async listPublicThreads(forumSlug: string, rawCursor?: unknown) {
    const forum = await this.database.forum.findFirst({
      where: visibleForumWhere(forumSlug),
      select: { id: true },
    });
    if (!forum) throw missingForum();
    const cursor = parseThreadPageCursor(rawCursor, forumSlug);

    const rows = await this.database.thread.findMany({
      where: {
        forumId: forum.id,
        status: { in: ['OPEN', 'LOCKED'] },
        mergedIntoThreadId: null,
        ...(cursor ? { AND: [threadKeysetAfter(cursor)] } : {}),
      },
      orderBy: [
        { pinnedAt: { sort: 'desc', nulls: 'last' } },
        { lastPostAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
        { id: 'asc' },
      ],
      take: THREAD_PAGE_SIZE + 1,
      select: publicThreadSelect,
    });

    const items = rows.slice(0, THREAD_PAGE_SIZE);
    const last = items.at(-1);
    const hasMore = rows.length > THREAD_PAGE_SIZE;

    return {
      items,
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeForumCursor({
              version: 1,
              forumSlug,
              id: last.id,
              pinnedAt: last.pinnedAt?.toISOString() ?? null,
              lastPostAt: last.lastPostAt?.toISOString() ?? null,
              createdAt: last.createdAt.toISOString(),
            })
          : null,
    };
  }

  /** Public thread detail and bounded post page (deleted posts stay redacted). */
  async findPublicThread(forumSlug: string, threadSlug: string, rawCursor?: unknown) {
    const thread = await this.database.thread.findFirst({
      where: {
        slug: threadSlug,
        status: { in: ['OPEN', 'LOCKED'] },
        mergedIntoThreadId: null,
        forum: { is: visibleForumWhere(forumSlug) },
      },
      select: {
        ...publicThreadSelect,
        forum: {
          select: {
            name: true,
            slug: true,
            club: { select: { name: true, slug: true } },
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException({
        code: 'THREAD_NOT_FOUND',
        message: 'Dieses Diskussionsthema ist nicht verfügbar.',
      });
    }

    const cursor = parsePostPageCursor(rawCursor, thread.id);
    const rows = await this.database.post.findMany({
      where: {
        threadId: thread.id,
        ...(cursor ? { sequenceNumber: { gt: cursor.sequenceNumber } } : {}),
      },
      orderBy: [{ sequenceNumber: 'asc' }, { id: 'asc' }],
      take: POST_PAGE_SIZE + 1,
      select: {
        id: true,
        parentPostId: true,
        sequenceNumber: true,
        content: true,
        createdAt: true,
        editedAt: true,
        deletedAt: true,
        author: { select: { id: true, nickname: true } },
      },
    });

    const page = rows.slice(0, POST_PAGE_SIZE);
    const lastPost = page.at(-1);
    const hasMorePosts = rows.length > POST_PAGE_SIZE;

    return {
      thread,
      posts: page.map((post) => ({
        id: post.id,
        parentPostId: post.parentPostId,
        sequenceNumber: post.sequenceNumber,
        createdAt: post.createdAt,
        editedAt: post.deletedAt ? null : post.editedAt,
        deleted: post.deletedAt !== null,
        // A deleted post must never leak its original text or author identity.
        content: post.deletedAt ? null : post.content,
        author: post.deletedAt ? null : post.author,
      })),
      hasMorePosts,
      nextPostCursor:
        hasMorePosts && lastPost
          ? encodeForumCursor({
              version: 1,
              threadId: thread.id,
              sequenceNumber: lastPost.sequenceNumber,
            })
          : null,
    };
  }

  /** Resolve only a public OPEN/LOCKED, non-merged thread; never reveal hidden IDs. */
  private async visibleSubscriptionThreadId(forumSlug: string, threadSlugValue: string) {
    const thread = await this.database.thread.findFirst({
      where: {
        slug: threadSlugValue,
        status: { in: ['OPEN', 'LOCKED'] },
        mergedIntoThreadId: null,
        forum: { is: visibleForumWhere(forumSlug) },
      },
      select: { id: true },
    });
    if (!thread) throw missingThread();
    return thread.id;
  }

  /** Personal state is never included in the public thread detail response. */
  async getThreadSubscription(forumSlug: string, threadSlugValue: string, userId: string) {
    const threadId = await this.visibleSubscriptionThreadId(forumSlug, threadSlugValue);
    const subscription = await this.database.threadSubscription.findUnique({
      where: { userId_threadId: { userId, threadId } },
      select: { id: true },
    });
    return { subscribed: subscription !== null };
  }

  /** Database uniqueness + ON CONFLICT DO NOTHING make concurrent PUT requests idempotent. */
  async subscribeToThread(forumSlug: string, threadSlugValue: string, userId: string) {
    const threadId = await this.visibleSubscriptionThreadId(forumSlug, threadSlugValue);
    await this.database.threadSubscription.createMany({
      data: [{ userId, threadId }],
      skipDuplicates: true,
    });
    return { subscribed: true };
  }

  /** A second DELETE is a success and never affects another user's subscription. */
  async unsubscribeFromThread(forumSlug: string, threadSlugValue: string, userId: string) {
    const threadId = await this.visibleSubscriptionThreadId(forumSlug, threadSlugValue);
    await this.database.threadSubscription.deleteMany({ where: { userId, threadId } });
    return { subscribed: false };
  }

  /** Private status only: never expose users' reading habits in public responses. */
  async getThreadUnreadStatus(forumSlug: string, threadSlugValue: string, userId: string) {
    const threadId = await this.visibleSubscriptionThreadId(forumSlug, threadSlugValue);
    const [thread, state] = await Promise.all([
      this.database.thread.findUniqueOrThrow({
        where: { id: threadId },
        select: { lastPostSequenceNumber: true },
      }),
      this.database.threadReadState.findUnique({
        where: { userId_threadId: { userId, threadId } },
        select: { lastReadSequenceNumber: true },
      }),
    ]);
    const lastReadSequenceNumber = state?.lastReadSequenceNumber ?? 0;
    return {
      unread: thread.lastPostSequenceNumber > lastReadSequenceNumber,
      lastReadSequenceNumber,
      latestSequenceNumber: thread.lastPostSequenceNumber,
    };
  }

  /**
   * Explicitly mark the currently known thread as read. Atomic GREATEST prevents
   * older concurrent requests from moving a user's read state backwards.
   * Precise per-post read position is reserved for phase 22.217.
   */
  async markThreadRead(forumSlug: string, threadSlugValue: string, userId: string) {
    const threadId = await this.visibleSubscriptionThreadId(forumSlug, threadSlugValue);
    const thread = await this.database.thread.findUniqueOrThrow({
      where: { id: threadId },
      select: { lastPostSequenceNumber: true },
    });
    const latestSequenceNumber = thread.lastPostSequenceNumber;
    const rows = await this.database.$queryRaw<{ lastReadSequenceNumber: number }[]>`
      INSERT INTO "ThreadReadState"
        ("id", "userId", "threadId", "lastReadSequenceNumber", "lastReadAt", "createdAt", "updatedAt")
      VALUES (
        CAST(${randomUUID()} AS UUID), CAST(${userId} AS UUID), CAST(${threadId} AS UUID),
        ${latestSequenceNumber}, NOW(), NOW(), NOW()
      )
      ON CONFLICT ("userId", "threadId") DO UPDATE SET
        "lastReadSequenceNumber" = GREATEST(
          "ThreadReadState"."lastReadSequenceNumber",
          EXCLUDED."lastReadSequenceNumber"
        ),
        "lastReadAt" = NOW(),
        "updatedAt" = NOW()
      RETURNING "lastReadSequenceNumber"
    `;
    const lastReadSequenceNumber = rows[0]!.lastReadSequenceNumber;
    return {
      unread: latestSequenceNumber > lastReadSequenceNumber,
      lastReadSequenceNumber,
      latestSequenceNumber,
    };
  }

  /**
   * Atomically claim the next sequence number before inserting a post.
   * The conditional increment holds a row lock until the post and
   * lastPost metadata have committed, preventing concurrent duplicates.
   */
  async replyToThread(
    forumSlug: string,
    threadSlugValue: string,
    authorId: string,
    input: CreateForumReplyInput,
  ) {
    const reservation = await this.spamProtection.reserve(authorId, input.body);

    try {
      for (let attempt = 0; attempt < MAX_REPLY_CONFLICT_RETRIES; attempt++) {
        try {
          return await this.database.$transaction(async (tx) => {
            const thread = await tx.thread.findFirst({
              where: {
                slug: threadSlugValue,
                status: { in: ['OPEN', 'LOCKED'] },
                mergedIntoThreadId: null,
                forum: { is: visibleForumWhere(forumSlug) },
              },
              select: { id: true, status: true, lastPostSequenceNumber: true },
            });
            if (!thread) throw missingThread();
            if (thread.status !== 'OPEN') {
              throw new ConflictException({
                code: 'THREAD_LOCKED',
                message: 'Dieses Thema ist für Antworten geschlossen.',
              });
            }

            if (input.parentPostId) {
              const parent = await tx.post.findFirst({
                where: {
                  id: input.parentPostId,
                  threadId: thread.id,
                  deletedAt: null,
                },
                select: { id: true },
              });
              if (!parent) {
                throw new ConflictException({
                  code: 'PARENT_POST_UNAVAILABLE',
                  message: 'Der referenzierte Beitrag ist nicht verfügbar.',
                });
              }
            }

            const claimed = await tx.thread.updateMany({
              where: {
                id: thread.id,
                status: 'OPEN',
                mergedIntoThreadId: null,
                lastPostSequenceNumber: thread.lastPostSequenceNumber,
                forum: { is: visibleForumWhere(forumSlug) },
              },
              data: {
                lastPostSequenceNumber: { increment: 1 },
                postCount: { increment: 1 },
              },
            });
            if (claimed.count !== 1) throw new RetryThreadReplyTransaction();

            const post = await tx.post.create({
              data: {
                threadId: thread.id,
                authorId,
                parentPostId: input.parentPostId ?? null,
                sequenceNumber: thread.lastPostSequenceNumber + 1,
                content: input.body,
              },
              select: {
                id: true,
                threadId: true,
                parentPostId: true,
                sequenceNumber: true,
                content: true,
                createdAt: true,
                author: { select: { id: true, nickname: true } },
              },
            });

            await tx.thread.update({
              where: { id: thread.id },
              data: {
                lastPostId: post.id,
                lastPostAt: post.createdAt,
              },
            });

            return post;
          });
        } catch (error) {
          if (retryableThreadConflict(error)) continue;
          throw error;
        }
      }

      throw new ConflictException({
        code: 'THREAD_REPLY_CONFLICT',
        message: 'Die Diskussion wurde gleichzeitig aktualisiert. Bitte erneut versuchen.',
      });
    } catch (error) {
      try {
        await this.spamProtection.release(reservation);
      } catch {
        // Keep the original transaction or authorization error.
      }
      throw error;
    }
  }

  /** Thread and opening post are committed together or not at all. */
  async createThread(forumSlug: string, authorId: string, input: CreateForumThreadInput) {
    const reservation = await this.spamProtection.reserve(authorId, input.body);

    try {
      return await this.database.$transaction(async (tx) => {
        const forum = await tx.forum.findFirst({
          where: visibleForumWhere(forumSlug),
          select: { id: true, threadCreationEnabled: true },
        });
        if (!forum) throw missingForum();
        if (!forum.threadCreationEnabled) {
          throw new ConflictException({
            code: 'THREAD_CREATION_DISABLED',
            message: 'In diesem Forum können keine Themen eröffnet werden.',
          });
        }

        const thread = await tx.thread.create({
          data: {
            forumId: forum.id,
            authorId,
            title: input.title,
            slug: threadSlug(input.title),
          },
          select: { id: true },
        });

        const firstPost = await tx.post.create({
          data: {
            threadId: thread.id,
            authorId,
            content: input.body,
            sequenceNumber: 1,
          },
          select: { id: true, createdAt: true },
        });

        return tx.thread.update({
          where: { id: thread.id },
          data: {
            postCount: 1,
            lastPostId: firstPost.id,
            lastPostAt: firstPost.createdAt,
            lastPostSequenceNumber: 1,
          },
          select: publicThreadSelect,
        });
      });
    } catch (error) {
      try {
        await this.spamProtection.release(reservation);
      } catch {
        // Preserve the original database or permission error.
      }
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
