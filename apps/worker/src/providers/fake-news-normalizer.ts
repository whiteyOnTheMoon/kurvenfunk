import type {
  NewsProviderRecord,
  NewsRecordNormalizer,
  NormalizedNewsArticle,
} from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';

type FakeNewsPayload = {
  id?: unknown;
  title?: unknown;
  lead?: unknown;
  body?: unknown;
  url?: unknown;
  publishedAt?: unknown;
  clubNames?: unknown;
  competitionName?: unknown;
  author?: unknown;
};

@Injectable()
export class FakeNewsNormalizer implements NewsRecordNormalizer {
  normalizeNewsRecord(record: NewsProviderRecord): NormalizedNewsArticle {
    const payload = this.toPayload(record.payload);

    return {
      ...this.optionalString('externalId', record.externalId ?? payload.id),
      ...this.optionalString('originalUrl', record.externalUrl ?? payload.url),
      ...this.optionalString('title', payload.title),
      ...this.optionalString('lead', payload.lead),
      ...this.optionalString('body', payload.body),
      ...this.optionalString('publishedAt', payload.publishedAt),
      ...this.optionalString('authorName', payload.author),
      clubNames: this.stringArray(payload.clubNames),
      ...this.optionalString('competitionName', payload.competitionName),
    };
  }

  private toPayload(payload: unknown): FakeNewsPayload {
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      return {};
    }

    return payload;
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

  private stringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}
