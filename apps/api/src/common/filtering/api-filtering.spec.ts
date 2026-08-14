import {
  createEnumFilterSchema,
  filterBooleanSchema,
  filterTextSchema,
  filterValuesSchema,
} from './api-filtering';

describe('API filtering', () => {
  it('trims text filters', () => {
    expect(filterTextSchema.parse('  rapid  ')).toBe('rapid');
  });

  it('parses boolean filters', () => {
    expect(filterBooleanSchema.parse('true')).toBe(true);
    expect(filterBooleanSchema.parse('false')).toBe(false);
  });

  it('parses comma-separated values', () => {
    expect(filterValuesSchema.parse('rapid,sturm')).toEqual(['rapid', 'sturm']);
  });

  it('rejects empty filter values', () => {
    expect(() => filterValuesSchema.parse('rapid,,sturm')).toThrow();
  });

  it('validates enum filters', () => {
    const schema = createEnumFilterSchema(['active', 'inactive'] as const);

    expect(schema.parse('active')).toBe('active');
    expect(() => schema.parse('unknown')).toThrow();
  });
});
