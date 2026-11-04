import { ConfigService } from '@nestjs/config';
import { OtsNewsProvider } from './ots-news-provider';

describe('OtsNewsProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function createProvider(overrides: Record<string, unknown> = {}): OtsNewsProvider {
    const config: Record<string, unknown> = {
      NEWS_OTS_API_KEY: 'test-secret-key',
      NEWS_OTS_API_BASE_URL: 'https://www.ots.at/api',
      NEWS_OTS_QUERY: 'Fußball',
      NEWS_OTS_PAGE_SIZE: 2,
      ...overrides,
    };

    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) =>
        key in config ? config[key] : defaultValue,
      ),
      getOrThrow: jest.fn((key: string) => {
        if (!(key in config)) {
          throw new Error(`Missing config: ${key}`);
        }

        return config[key];
      }),
    } as unknown as ConfigService;

    return new OtsNewsProvider(configService);
  }

  it('fetches and maps an OTS result page', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        meta: {
          maxanz: '2',
          page: 1,
          treffer: 3,
          von: 1,
          bis: 2,
          query: 'Fußball',
        },
        ergebnisse: [
          {
            SCHLUESSEL: 'OTS_20260827_OTS0049',
            TITEL: 'Testmeldung',
            UTL: 'Testuntertitel',
            INHALT: 'Testinhalt',
            ZEITSTEMPEL: '1787819582',
            EMITTENT: 'Test Emittent',
            WEBLINK: 'https://www.ots.at/presseaussendung/OTS_20260827_OTS0049/testmeldung',
          },
          {
            SCHLUESSEL: 'OTS_20260827_OTS0050',
            TITEL: 'Zweite Testmeldung',
            ZEITSTEMPEL: '1787819600',
            WEBLINK: 'https://www.ots.at/presseaussendung/OTS_20260827_OTS0050/testmeldung',
          },
        ],
      }),
    });

    global.fetch = fetchMock as typeof fetch;

    const provider = createProvider();

    const result = await provider.fetch({});

    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toEqual(
      expect.objectContaining({
        externalId: 'OTS_20260827_OTS0049',
        externalUrl: 'https://www.ots.at/presseaussendung/OTS_20260827_OTS0049/testmeldung',
      }),
    );
    expect(result.nextCursor).toBe('2');

    const [requestUrl] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(requestUrl.searchParams.get('app')).toBe('test-secret-key');
    expect(requestUrl.searchParams.get('query')).toBe('Fußball');
    expect(requestUrl.searchParams.get('anz')).toBe('2');
    expect(requestUrl.searchParams.get('page')).toBe('1');
    expect(requestUrl.searchParams.get('markup')).toBe('0');
  });

  it('uses cursor and converts time windows to unix seconds', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        meta: {
          maxanz: '2',
          page: 3,
          treffer: 5,
        },
        ergebnisse: [],
      }),
    });

    global.fetch = fetchMock as typeof fetch;

    const provider = createProvider();

    const result = await provider.fetch({
      cursor: '3',
      windowStart: '2026-08-27T10:00:00.000Z',
      windowEnd: '2026-08-27T12:00:00.000Z',
    });

    expect(result.nextCursor).toBeUndefined();

    const [requestUrl] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(requestUrl.searchParams.get('page')).toBe('3');
    expect(requestUrl.searchParams.get('von')).toBe(
      String(Date.parse('2026-08-27T10:00:00.000Z') / 1_000),
    );
    expect(requestUrl.searchParams.get('bis')).toBe(
      String(Date.parse('2026-08-27T12:00:00.000Z') / 1_000),
    );
  });

  it('stops pagination when the configured max page limit is reached', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        meta: {
          maxanz: '2',
          page: 1,
          treffer: 100,
        },
        ergebnisse: [
          {
            SCHLUESSEL: 'OTS_20260827_OTS0100',
            TITEL: 'Erste begrenzte Testmeldung',
          },
          {
            SCHLUESSEL: 'OTS_20260827_OTS0101',
            TITEL: 'Zweite begrenzte Testmeldung',
          },
        ],
      }),
    });

    global.fetch = fetchMock as typeof fetch;

    const provider = createProvider({
      NEWS_OTS_MAX_PAGES: 1,
    });

    const result = await provider.fetch({});

    expect(result.records).toHaveLength(2);
    expect(result.nextCursor).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid cursors without making a request', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;

    const provider = createProvider();

    await expect(
      provider.fetch({
        cursor: 'invalid',
      }),
    ).rejects.toThrow('Invalid OTS provider cursor: invalid');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws on non-successful API responses without exposing the API key', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as typeof fetch;

    const provider = createProvider();

    await expect(provider.fetch({})).rejects.toThrow('OTS API request failed with status 503');

    await expect(provider.fetch({})).rejects.not.toThrow('test-secret-key');
  });

  it('accepts the documented bare-array response and continues full pages', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([
        {
          SCHLUESSEL: 'OTS_20261104_OTS0100',
          TITEL: 'Erste Presseaussendung',
          WEBLINK: 'https://www.ots.at/presseaussendung/OTS_20261104_OTS0100/test',
        },
        {
          SCHLUESSEL: 'OTS_20261104_OTS0101',
          TITEL: 'Zweite Presseaussendung',
          WEBLINK: 'https://www.ots.at/presseaussendung/OTS_20261104_OTS0101/test',
        },
      ]),
    });
    global.fetch = fetchMock as typeof fetch;

    const result = await createProvider({ NEWS_OTS_MAX_PAGES: 2 }).fetch({});

    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toEqual(
      expect.objectContaining({
        externalId: 'OTS_20261104_OTS0100',
        externalUrl: 'https://www.ots.at/presseaussendung/OTS_20261104_OTS0100/test',
      }),
    );
    expect(result.nextCursor).toBe('2');
  });

  it('stops bare-array pagination on a partial page or max-page limit', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([{ SCHLUESSEL: 'OTS_20261104_OTS0110' }]),
    });
    global.fetch = fetchMock as typeof fetch;

    const partial = await createProvider().fetch({});
    expect(partial.records).toHaveLength(1);
    expect(partial.nextCursor).toBeUndefined();

    const lastPage = await createProvider({
      NEWS_OTS_PAGE_SIZE: 1,
      NEWS_OTS_MAX_PAGES: 1,
    }).fetch({});
    expect(lastPage.nextCursor).toBeUndefined();
  });

  it('rejects an HTTP-200 OTS error response without leaking the key', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        error: 'Error: General Auth Error for test-secret-key',
      }),
    }) as typeof fetch;

    const provider = createProvider();
    await expect(provider.fetch({})).rejects.toThrow(
      'OTS API returned an error; check API access and query parameters',
    );
    await expect(provider.fetch({})).rejects.not.toThrow('test-secret-key');
  });

  it('rejects malformed API responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        meta: {},
      }),
    }) as typeof fetch;

    const provider = createProvider();

    await expect(provider.fetch({})).rejects.toThrow(
      'Invalid OTS API response: ergebnisse must be an array',
    );
  });
});
