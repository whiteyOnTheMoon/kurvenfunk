import {
  createCursorPaginatedResult,
  cursorPaginationQuerySchema,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from './cursor-pagination';

describe('cursor pagination', () => {
  describe('cursorPaginationQuerySchema', () => {
    it('uses the default limit when no query parameters are provided', () => {
      expect(cursorPaginationQuerySchema.parse({})).toEqual({
        limit: DEFAULT_PAGE_SIZE,
      });
    });

    it('accepts a cursor and coerces the limit from a query string', () => {
      expect(
        cursorPaginationQuerySchema.parse({
          cursor: 'item-20',
          limit: '25',
        }),
      ).toEqual({
        cursor: 'item-20',
        limit: 25,
      });
    });

    it('rejects an empty cursor', () => {
      expect(() =>
        cursorPaginationQuerySchema.parse({
          cursor: '',
        }),
      ).toThrow();
    });

    it('rejects a limit below one', () => {
      expect(() =>
        cursorPaginationQuerySchema.parse({
          limit: '0',
        }),
      ).toThrow();
    });

    it('rejects a limit above the maximum', () => {
      expect(() =>
        cursorPaginationQuerySchema.parse({
          limit: String(MAX_PAGE_SIZE + 1),
        }),
      ).toThrow();
    });

    it('rejects unknown query parameters', () => {
      expect(() =>
        cursorPaginationQuerySchema.parse({
          page: '2',
        }),
      ).toThrow();
    });
  });

  describe('createCursorPaginatedResult', () => {
    const items = [{ id: '1' }, { id: '2' }, { id: '3' }];

    it('returns all items when there is no next page', () => {
      expect(createCursorPaginatedResult(items.slice(0, 2), 2, (item) => item.id)).toEqual({
        items: [{ id: '1' }, { id: '2' }],
        pagination: {
          nextCursor: null,
          hasNextPage: false,
        },
      });
    });

    it('removes the lookahead item and exposes the next cursor', () => {
      expect(createCursorPaginatedResult(items, 2, (item) => item.id)).toEqual({
        items: [{ id: '1' }, { id: '2' }],
        pagination: {
          nextCursor: '2',
          hasNextPage: true,
        },
      });
    });

    it('returns an empty page without a cursor', () => {
      expect(createCursorPaginatedResult([], 20, (item: { id: string }) => item.id)).toEqual({
        items: [],
        pagination: {
          nextCursor: null,
          hasNextPage: false,
        },
      });
    });
  });
});
