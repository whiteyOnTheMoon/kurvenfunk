import { randomUUID } from 'node:crypto';

import { createPrismaClient, type DatabaseClient, type Prisma } from '@kurvenfunk/database';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import type { CreateForumThreadInput } from '@kurvenfunk/validation';

import { CommentSpamProtectionService } from '../comments/comment-spam-protection.service';

const THREAD_PREVIEW_LIMIT = 20;

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
