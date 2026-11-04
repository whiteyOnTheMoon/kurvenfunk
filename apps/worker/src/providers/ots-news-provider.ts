import type {
  NewsProvider,
  NewsProviderCapabilities,
  NewsProviderFetchInput,
  NewsProviderFetchResult,
  NewsProviderRecord,
} from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type OtsResponse = {
  meta?: {
    maxanz?: unknown;
    page?: unknown;
    treffer?: unknown;
    von?: unknown;
    bis?: unknown;
    query?: unknown;
  };
  ergebnisse?: unknown;
};

type OtsRecord = {
  SCHLUESSEL?: unknown;
  TITEL?: unknown;
  UTL?: unknown;
  INHALT?: unknown;
  ZEITSTEMPEL?: unknown;
  EMITTENT?: unknown;
  EMITTENTID?: unknown;
  WEBLINK?: unknown;
};

const DEFAULT_BASE_URL = 'https://www.ots.at/api';
const DEFAULT_QUERY = 'Fußball';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DEFAULT_MAX_PAGES = 5;
const REQUEST_TIMEOUT_MS = 15_000;

@Injectable()
export class OtsNewsProvider implements NewsProvider {
  readonly key = 'ots';
  readonly name = 'APA-OTS';
  readonly trustedForAutoPublish = false;

  readonly capabilities: NewsProviderCapabilities = {
    supportsCursorPagination: true,
    supportsTimeWindow: true,
  };

  constructor(private readonly configService: ConfigService) {}

  async fetch(input: NewsProviderFetchInput): Promise<NewsProviderFetchResult> {
    const apiKey = this.configService.getOrThrow<string>('NEWS_OTS_API_KEY');
    const baseUrl = this.configService.get<string>('NEWS_OTS_API_BASE_URL', DEFAULT_BASE_URL);
    const query = this.configService.get<string>('NEWS_OTS_QUERY', DEFAULT_QUERY);
    const configuredPageSize = this.configService.get<number>(
      'NEWS_OTS_PAGE_SIZE',
      DEFAULT_PAGE_SIZE,
    );
    const configuredMaxPages = this.configService.get<number>(
      'NEWS_OTS_MAX_PAGES',
      DEFAULT_MAX_PAGES,
    );

    const pageSize = Math.min(Math.max(configuredPageSize, 1), MAX_PAGE_SIZE);
    const maxPages = Math.max(configuredMaxPages, 1);
    const page = this.parseCursor(input.cursor);

    const url = new URL(`${baseUrl.replace(/\/+$/, '')}/liste`);

    url.searchParams.set('app', apiKey);
    url.searchParams.set('query', query);
    url.searchParams.set('anz', String(pageSize));
    url.searchParams.set('page', String(page));
    url.searchParams.set('format', 'json');
    url.searchParams.set('markup', '0');
    url.searchParams.set('felder', 'SCHLUESSEL TITEL UTL INHALT ZEITSTEMPEL EMITTENT');

    if (input.windowStart !== undefined) {
      url.searchParams.set('von', String(this.toUnixTimestamp(input.windowStart, 'windowStart')));
    }

    if (input.windowEnd !== undefined) {
      url.searchParams.set('bis', String(this.toUnixTimestamp(input.windowEnd, 'windowEnd')));
    }

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`OTS API request failed with status ${response.status}`);
    }

    const payload: unknown = await response.json();
    const otsResponse = this.parseResponse(payload, page, pageSize);

    const records: NewsProviderRecord[] = otsResponse.records.map((record) => ({
      ...this.optionalString('externalId', record.SCHLUESSEL),
      ...this.optionalString('externalUrl', record.WEBLINK),
      payload: record,
    }));

    return {
      records,
      ...(otsResponse.hasNextPage && page < maxPages ? { nextCursor: String(page + 1) } : {}),
    };
  }

  private parseCursor(cursor: string | undefined): number {
    if (cursor === undefined) {
      return 1;
    }

    if (!/^[1-9]\d*$/.test(cursor)) {
      throw new Error(`Invalid OTS provider cursor: ${cursor}`);
    }

    return Number(cursor);
  }

  private toUnixTimestamp(value: string, field: string): number {
    const milliseconds = Date.parse(value);

    if (!Number.isFinite(milliseconds)) {
      throw new Error(`Invalid OTS provider ${field}: ${value}`);
    }

    return Math.floor(milliseconds / 1_000);
  }

  private parseResponse(
    payload: unknown,
    requestedPage: number,
    pageSize: number,
  ): {
    records: OtsRecord[];
    hasNextPage: boolean;
  } {
    // The official OTS documentation shows a plain JSON array, while older
    // integrations also return { meta, ergebnisse }. Accept both shapes.
    if (Array.isArray(payload)) {
      const records = this.parseRecords(payload);

      return {
        records,
        // Bare arrays expose no total count. A full page warrants one more
        // bounded request; empty/partial pages terminate pagination.
        hasNextPage: records.length === pageSize,
      };
    }

    if (payload === null || typeof payload !== 'object') {
      throw new Error('Invalid OTS API response');
    }

    const response = payload as OtsResponse & { error?: unknown };

    // OTS may return an HTTP 200 with a JSON error object for invalid keys.
    // Do not log the remote error value or the credential-bearing request URL.
    if (response.error !== undefined) {
      throw new Error('OTS API returned an error; check API access and query parameters');
    }

    if (!Array.isArray(response.ergebnisse)) {
      throw new Error('Invalid OTS API response: ergebnisse must be an array');
    }

    const records = this.parseRecords(response.ergebnisse);
    const page = this.toPositiveInteger(response.meta?.page);
    const maxPerPage = this.toPositiveInteger(response.meta?.maxanz);
    const total = this.toNonNegativeInteger(response.meta?.treffer);
    const hasUsableMetadata = page !== undefined && maxPerPage !== undefined && total !== undefined;

    const hasNextPage = hasUsableMetadata
      ? page * maxPerPage < total && records.length > 0
      : requestedPage > 0 && records.length === pageSize;

    return {
      records,
      hasNextPage,
    };
  }

  private parseRecords(items: unknown[]): OtsRecord[] {
    return items.filter(
      (item): item is OtsRecord =>
        item !== null && typeof item === 'object' && !Array.isArray(item),
    );
  }

  private toPositiveInteger(value: unknown): number | undefined {
    const number = typeof value === 'string' ? Number(value) : value;

    return typeof number === 'number' && Number.isInteger(number) && number > 0
      ? number
      : undefined;
  }

  private toNonNegativeInteger(value: unknown): number | undefined {
    const number = typeof value === 'string' ? Number(value) : value;

    return typeof number === 'number' && Number.isInteger(number) && number >= 0
      ? number
      : undefined;
  }

  private optionalString<Key extends string>(
    key: Key,
    value: unknown,
  ): Partial<Record<Key, string>> {
    if (typeof value !== 'string') {
      return {};
    }

    const normalized = value.trim();

    return normalized.length > 0 ? ({ [key]: normalized } as Record<Key, string>) : {};
  }
}
