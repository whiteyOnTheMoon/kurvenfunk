import type {
  NewsProviderRecord,
  NewsRecordNormalizer,
  NormalizedNewsArticle,
} from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';

type OtsNewsPayload = {
  SCHLUESSEL?: unknown;
  TITEL?: unknown;
  UTL?: unknown;
  LEAD?: unknown;
  INHALT?: unknown;
  ZEITSTEMPEL?: unknown;
  EMITTENT?: unknown;
  WEBLINK?: unknown;
};

@Injectable()
export class OtsNewsNormalizer implements NewsRecordNormalizer {
  normalizeNewsRecord(record: NewsProviderRecord): NormalizedNewsArticle {
    const payload = this.toPayload(record.payload);

    return {
      ...this.optionalString('externalId', record.externalId ?? payload.SCHLUESSEL),
      ...this.optionalString('originalUrl', record.externalUrl ?? payload.WEBLINK),
      ...this.optionalString('title', payload.TITEL),
      ...this.optionalString('lead', payload.UTL ?? payload.LEAD),
      ...this.optionalString('body', payload.INHALT),
      ...this.optionalTimestamp(payload.ZEITSTEMPEL),
      ...this.optionalString('authorName', payload.EMITTENT),
      clubNames: [],
    };
  }

  private toPayload(payload: unknown): OtsNewsPayload {
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      return {};
    }

    return payload;
  }

  private optionalTimestamp(value: unknown): Partial<Pick<NormalizedNewsArticle, 'publishedAt'>> {
    const seconds =
      typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : Number.NaN;

    if (!Number.isFinite(seconds) || seconds < 0) {
      return {};
    }

    const date = new Date(seconds * 1_000);

    if (Number.isNaN(date.getTime())) {
      return {};
    }

    return {
      publishedAt: date.toISOString(),
    };
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
