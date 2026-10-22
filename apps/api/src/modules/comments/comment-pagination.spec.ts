import {
  COMMENT_PAGE_SIZE,
  encodeCommentPageCursor,
  parseCommentPageCursor,
  parseCommentPageSort,
} from './comment-pagination';

describe('Comment Pagination', () => {
  const id = '11111111-1111-4111-8111-111111111111';

  const cursor = {
    version: 1 as const,
    sort: 'newest' as const,
    id,
    createdAt: '2026-10-14T12:00:00.000Z',
  };

  it('uses a page size of 20', () => {
    expect(COMMENT_PAGE_SIZE).toBe(20);
  });

  it('defaults to newest sorting', () => {
    expect(parseCommentPageSort(undefined)).toBe('newest');
  });

  it('accepts all supported sorting modes', () => {
    expect(parseCommentPageSort('newest')).toBe('newest');
    expect(parseCommentPageSort('oldest')).toBe('oldest');
    expect(parseCommentPageSort('popular')).toBe('popular');
  });

  it('rejects invalid sorting modes', () => {
    expect(() => parseCommentPageSort('random')).toThrow();
    expect(() => parseCommentPageSort(['newest'])).toThrow();
  });

  it('accepts an absent cursor', () => {
    expect(parseCommentPageCursor(undefined, 'newest')).toBeNull();
  });

  it('encodes and decodes a valid cursor', () => {
    const encoded = encodeCommentPageCursor(cursor);

    expect(parseCommentPageCursor(encoded, 'newest')).toEqual(cursor);
  });

  it('rejects a cursor from another sorting mode', () => {
    const encoded = encodeCommentPageCursor(cursor);

    expect(() => parseCommentPageCursor(encoded, 'oldest')).toThrow();
  });

  it('supports popular sorting scores', () => {
    const popularCursor = {
      ...cursor,
      sort: 'popular' as const,
      score: 5,
    };

    const encoded = encodeCommentPageCursor(popularCursor);

    expect(parseCommentPageCursor(encoded, 'popular')).toEqual(popularCursor);
  });

  it('supports negative popularity scores', () => {
    const popularCursor = {
      ...cursor,
      sort: 'popular' as const,
      score: -3,
    };

    const encoded = encodeCommentPageCursor(popularCursor);

    expect(parseCommentPageCursor(encoded, 'popular')).toEqual(popularCursor);
  });

  it('rejects malformed cursors', () => {
    expect(() => parseCommentPageCursor('invalid!', 'newest')).toThrow();
    expect(() => parseCommentPageCursor('abc', 'newest')).toThrow();
  });

  it('rejects invalid cursor IDs', () => {
    const encoded = encodeCommentPageCursor({
      ...cursor,
      id: 'invalid',
    });

    expect(() => parseCommentPageCursor(encoded, 'newest')).toThrow();
  });

  it('rejects non-integer popularity scores', () => {
    const encoded = encodeCommentPageCursor({
      ...cursor,
      sort: 'popular',
      score: 1.5,
    });

    expect(() => parseCommentPageCursor(encoded, 'popular')).toThrow();
  });

  it('rejects invalid timestamps', () => {
    const encoded = encodeCommentPageCursor({
      ...cursor,
      createdAt: 'invalid',
    });

    expect(() => parseCommentPageCursor(encoded, 'newest')).toThrow();
  });
});
