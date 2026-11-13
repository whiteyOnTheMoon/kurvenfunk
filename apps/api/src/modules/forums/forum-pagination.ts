import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@kurvenfunk/database';

export const THREAD_PAGE_SIZE = 20;
export const POST_PAGE_SIZE = 30;

export interface ThreadPageCursor {
  version: 1;
  forumSlug: string;
  id: string;
  pinnedAt: string | null;
  lastPostAt: string | null;
  createdAt: string;
}

export interface PostPageCursor {
  version: 1;
  threadId: string;
  sequenceNumber: number;
}

const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu;

function invalidCursor(): never {
  throw new BadRequestException({
    code: 'INVALID_FORUM_CURSOR',
    message: 'Ungültiger oder nicht zu dieser Diskussion passender Seiten-Cursor.',
  });
}

function decodedCursor(value: unknown): Record<string, unknown> | null {
  if (value === undefined) return null;
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 1024 ||
    !/^[A-Za-z0-9_-]+$/u.test(value)
  ) {
    return invalidCursor();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return invalidCursor();
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return invalidCursor();
  }
  return parsed as Record<string, unknown>;
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

export function encodeForumCursor(value: ThreadPageCursor | PostPageCursor): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function parseThreadPageCursor(value: unknown, forumSlug: string): ThreadPageCursor | null {
  const raw = decodedCursor(value);
  if (!raw) return null;
  if (
    Object.keys(raw).sort().join(',') !==
      'createdAt,forumSlug,id,lastPostAt,pinnedAt,version' ||
    raw.version !== 1 ||
    raw.forumSlug !== forumSlug ||
    typeof raw.id !== 'string' ||
    !uuidPattern.test(raw.id) ||
    !validDate(raw.createdAt) ||
    (raw.pinnedAt !== null && !validDate(raw.pinnedAt)) ||
    (raw.lastPostAt !== null && !validDate(raw.lastPostAt))
  ) {
    return invalidCursor();
  }
  return raw as unknown as ThreadPageCursor;
}

export function parsePostPageCursor(value: unknown, threadId: string): PostPageCursor | null {
  const raw = decodedCursor(value);
  if (!raw) return null;
  if (
    Object.keys(raw).sort().join(',') !== 'sequenceNumber,threadId,version' ||
    raw.version !== 1 ||
    raw.threadId !== threadId ||
    typeof raw.sequenceNumber !== 'number' ||
    !Number.isSafeInteger(raw.sequenceNumber) ||
    raw.sequenceNumber < 1
  ) {
    return invalidCursor();
  }
  return raw as unknown as PostPageCursor;
}

function afterTimestampAndId(cursor: ThreadPageCursor): Prisma.ThreadWhereInput[] {
  const createdAt = new Date(cursor.createdAt);
  return [
    { createdAt: { lt: createdAt } },
    { createdAt, id: { gt: cursor.id } },
  ];
}

function afterLastPost(cursor: ThreadPageCursor): Prisma.ThreadWhereInput[] {
  const tie = afterTimestampAndId(cursor);
  if (cursor.lastPostAt === null) {
    return [{ lastPostAt: null, OR: tie }];
  }
  const lastPostAt = new Date(cursor.lastPostAt);
  return [
    { lastPostAt: { lt: lastPostAt } },
    { lastPostAt: null },
    { lastPostAt, OR: tie },
  ];
}

/** Strict keyset for: pinnedAt DESC NULLS LAST, lastPostAt DESC NULLS LAST,
 * createdAt DESC, id ASC. Never trust raw query values as database filters. */
export function threadKeysetAfter(cursor: ThreadPageCursor): Prisma.ThreadWhereInput {
  const afterLast = afterLastPost(cursor);
  if (cursor.pinnedAt === null) {
    return { pinnedAt: null, OR: afterLast };
  }
  const pinnedAt = new Date(cursor.pinnedAt);
  return {
    OR: [
      { pinnedAt: { lt: pinnedAt } },
      { pinnedAt: null },
      { pinnedAt, OR: afterLast },
    ],
  };
}
