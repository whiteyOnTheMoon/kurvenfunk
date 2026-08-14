import {
  createSortingQuerySchema,
  SORT_ORDERS,
  sortOrderSchema,
} from './api-sorting';

describe('API sorting', () => {
  it('accepts valid sort orders', () => {
    expect(sortOrderSchema.parse('asc')).toBe('asc');
    expect(sortOrderSchema.parse('desc')).toBe('desc');
    expect(SORT_ORDERS).toEqual(['asc', 'desc']);
  });

  it('accepts allowed sort fields', () => {
    const schema = createSortingQuerySchema({
      fields: ['createdAt', 'title'] as const,
    });

    expect(
      schema.parse({
        sortBy: 'title',
        sortOrder: 'asc',
      }),
    ).toEqual({
      sortBy: 'title',
      sortOrder: 'asc',
    });
  });

  it('applies sorting defaults', () => {
    const schema = createSortingQuerySchema({
      fields: ['createdAt', 'title'] as const,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
    });

    expect(schema.parse({})).toEqual({
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('rejects unsupported sort fields', () => {
    const schema = createSortingQuerySchema({
      fields: ['createdAt', 'title'] as const,
    });

    expect(() =>
      schema.parse({
        sortBy: 'unknown',
      }),
    ).toThrow();
  });

  it('rejects invalid sort orders', () => {
    expect(() => sortOrderSchema.parse('ascending')).toThrow();
  });

  it('rejects unknown query parameters', () => {
    const schema = createSortingQuerySchema({
      fields: ['createdAt'] as const,
    });

    expect(() =>
      schema.parse({
        sortBy: 'createdAt',
        direction: 'asc',
      }),
    ).toThrow();
  });
});
