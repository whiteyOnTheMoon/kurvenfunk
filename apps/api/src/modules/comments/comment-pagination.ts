import { BadRequestException } from '@nestjs/common';

export const COMMENT_PAGE_SIZE = 20;

export type CommentPageSort = 'newest' | 'oldest' | 'popular';

export interface CommentPageCursor {
  version: 1;
  sort: CommentPageSort;
  id: string;
  createdAt: string;
  score?: number;
}

function invalidPagination(): never {
  throw new BadRequestException({
    code: 'INVALID_COMMENT_PAGINATION',
    message: 'Ungültige Kommentar-Pagination.',
  });
}

export function parseCommentPageSort(value: unknown): CommentPageSort {
  if (value === undefined || value === 'newest') {
    return 'newest';
  }

  if (value === 'oldest' || value === 'popular') {
    return value;
  }

  return invalidPagination();
}

export function encodeCommentPageCursor(cursor: CommentPageCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function parseCommentPageCursor(
  value: unknown,
  sort: CommentPageSort,
): CommentPageCursor | null {
  if (value === undefined) {
    return null;
  }

  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 512 ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    return invalidPagination();
  }

  let decoded: unknown;

  try {
    decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return invalidPagination();
  }

  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
    return invalidPagination();
  }

  const cursor = decoded as Partial<CommentPageCursor>;

  if (
    cursor.version !== 1 ||
    cursor.sort !== sort ||
    typeof cursor.id !== 'string' ||
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(cursor.id) ||
    typeof cursor.createdAt !== 'string'
  ) {
    return invalidPagination();
  }

  const timestamp = Date.parse(cursor.createdAt);

  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== cursor.createdAt) {
    return invalidPagination();
  }

  if (sort === 'popular') {
    if (typeof cursor.score !== 'number' || !Number.isSafeInteger(cursor.score)) {
      return invalidPagination();
    }
  } else if (cursor.score !== undefined) {
    return invalidPagination();
  }

  return {
    version: 1,
    sort,
    id: cursor.id,
    createdAt: cursor.createdAt,
    ...(sort === 'popular' ? { score: cursor.score } : {}),
  };
}
