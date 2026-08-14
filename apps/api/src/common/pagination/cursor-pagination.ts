import { z } from 'zod';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const cursorPaginationQuerySchema = z.strictObject({
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

export interface CursorPaginationMeta {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface CursorPaginatedResult<T> {
  items: T[];
  pagination: CursorPaginationMeta;
}

export function createCursorPaginatedResult<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => string,
): CursorPaginatedResult<T> {
  const hasNextPage = items.length > limit;
  const pageItems = hasNextPage ? items.slice(0, limit) : items;

  const lastItem = pageItems.at(-1);
  const nextCursor = hasNextPage && lastItem !== undefined ? getCursor(lastItem) : null;

  return {
    items: pageItems,
    pagination: {
      nextCursor,
      hasNextPage,
    },
  };
}
