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

const THREAD_PREVIEW_LIMIT = 20;
const POST_DETAIL_LIMIT = 30;

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

  /** Bounded public preview until cursor pagination is introduced in task 214. */
  async listPublicThreads(forumSlug: string) {
    const forum = await this.database.forum.findFirst({
      where: visibleForumWhere(forumSlug),
      select: { id: true },
    });
    if (!forum) throw missingForum();

    const rows = await this.database.thread.findMany({
      where: {
        forumId: forum.id,
        status: { in: ['OPEN', 'LOCKED'] },
        mergedIntoThreadId: null,
      },
      orderBy: [{ pinnedAt: 'desc' }, { lastPostAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
      take: THREAD_PREVIEW_LIMIT + 1,
      select: publicThreadSelect,
    });

    return {
      items: rows.slice(0, THREAD_PREVIEW_LIMIT),
      hasMore: rows.length > THREAD_PREVIEW_LIMIT,
    };
  }

  /** Public detail is bounded until phase 22.214 introduces post pagination. */
  async findPublicThread(forumSlug: string, threadSlug: string) {
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

    const rows = await this.database.post.findMany({
      where: { threadId: thread.id },
      orderBy: [{ sequenceNumber: 'asc' }, { id: 'asc' }],
      take: POST_DETAIL_LIMIT + 1,
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

    return {
      thread,
      posts: rows.slice(0, POST_DETAIL_LIMIT).map((post) => ({
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
      hasMorePosts: rows.length > POST_DETAIL_LIMIT,
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
