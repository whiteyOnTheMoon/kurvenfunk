import { FakeNewsProvider } from './fake-news-provider';

describe('FakeNewsProvider', () => {
  let provider: FakeNewsProvider;

  beforeEach(() => {
    provider = new FakeNewsProvider();
  });

  it('exposes the expected provider metadata', () => {
    expect(provider.key).toBe('fake');
    expect(provider.name).toBe('Kurvenfunk Fake News Provider');
    expect(provider.capabilities).toEqual({
      supportsCursorPagination: true,
      supportsTimeWindow: true,
    });
  });

  it('returns the first page with a cursor', async () => {
    const result = await provider.fetch({});

    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({
      externalId: 'fake-001',
      externalUrl: 'https://fake-provider.test/news/fake-001',
    });
    expect(result.records[1]).toMatchObject({
      externalId: 'fake-002',
    });
    expect(result.nextCursor).toBe('2');
  });

  it('returns subsequent pages using the cursor', async () => {
    const secondPage = await provider.fetch({ cursor: '2' });

    expect(secondPage.records.map((record) => record.externalId)).toEqual(['fake-003', 'fake-004']);
    expect(secondPage.nextCursor).toBe('4');

    const finalPage = await provider.fetch({ cursor: '4' });

    expect(finalPage.records.map((record) => record.externalId)).toEqual(['fake-005']);
    expect(finalPage.nextCursor).toBeUndefined();
  });

  it('filters records using a time window', async () => {
    const result = await provider.fetch({
      windowStart: '2026-08-25T12:00:00.000Z',
      windowEnd: '2026-08-25T17:00:00.000Z',
    });

    expect(result.records.map((record) => record.externalId)).toEqual(['fake-002', 'fake-003']);
    expect(result.nextCursor).toBeUndefined();
  });

  it('returns an empty result when no records match', async () => {
    const result = await provider.fetch({
      windowStart: '2027-01-01T00:00:00.000Z',
    });

    expect(result).toEqual({
      records: [],
    });
  });

  it('rejects an invalid cursor', async () => {
    await expect(provider.fetch({ cursor: 'invalid' })).rejects.toThrow(
      'Invalid fake provider cursor: invalid',
    );
  });
});
