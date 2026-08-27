import type {
  NewsProvider,
  NewsProviderCapabilities,
  NewsProviderFetchInput,
  NewsProviderFetchResult,
  NewsProviderRecord,
} from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';

type FakeNewsPayload = {
  id: string;
  title: string;
  lead: string;
  body: string;
  url: string;
  publishedAt: string;
  clubNames: string[];
  competitionName: string;
  author: string;
};

const PAGE_SIZE = 2;

const FAKE_NEWS: readonly FakeNewsPayload[] = [
  {
    id: 'fake-001',
    title: 'Rapid gewinnt dramatisches Heimspiel',
    lead: 'Ein später Treffer entscheidet die Partie in Wien.',
    body: 'Rapid setzt sich in einer umkämpften Bundesliga-Partie durch.',
    url: 'https://fake-provider.test/news/fake-001',
    publishedAt: '2026-08-25T18:30:00.000Z',
    clubNames: ['SK Rapid Wien'],
    competitionName: 'Österreichische Bundesliga',
    author: 'Fake Provider Redaktion',
  },
  {
    id: 'fake-002',
    title: 'Sturm Graz holt drei Punkte',
    lead: 'Der Meisterschaftsfavorit überzeugt mit einer starken zweiten Hälfte.',
    body: 'Sturm Graz entscheidet das Spiel nach der Pause für sich.',
    url: 'https://fake-provider.test/news/fake-002',
    publishedAt: '2026-08-25T16:00:00.000Z',
    clubNames: ['SK Sturm Graz'],
    competitionName: 'Österreichische Bundesliga',
    author: 'Fake Provider Redaktion',
  },
  {
    id: 'fake-003',
    title: 'Austria Wien bereitet sich auf das Wochenende vor',
    lead: 'Im Training liegt der Fokus auf der Defensive.',
    body: 'Austria Wien absolviert die nächste Einheit vor dem Ligaspiel.',
    url: 'https://fake-provider.test/news/fake-003',
    publishedAt: '2026-08-25T12:15:00.000Z',
    clubNames: ['FK Austria Wien'],
    competitionName: 'Österreichische Bundesliga',
    author: 'Fake Provider Redaktion',
  },
  {
    id: 'fake-004',
    title: 'LASK meldet Neuzugang',
    lead: 'Der Linzer Klub verstärkt seinen Kader.',
    body: 'Der neue Spieler unterschreibt einen mehrjährigen Vertrag.',
    url: 'https://fake-provider.test/news/fake-004',
    publishedAt: '2026-08-24T19:45:00.000Z',
    clubNames: ['LASK'],
    competitionName: 'Österreichische Bundesliga',
    author: 'Fake Provider Redaktion',
  },
  {
    id: 'fake-005',
    title: 'Bundesliga veröffentlicht nächsten Spieltag',
    lead: 'Die Termine für die kommenden Begegnungen stehen fest.',
    body: 'Die Österreichische Bundesliga hat die Ansetzungen veröffentlicht.',
    url: 'https://fake-provider.test/news/fake-005',
    publishedAt: '2026-08-23T10:00:00.000Z',
    clubNames: [],
    competitionName: 'Österreichische Bundesliga',
    author: 'Fake Provider Redaktion',
  },
];

@Injectable()
export class FakeNewsProvider implements NewsProvider {
  readonly key = 'fake';
  readonly name = 'Kurvenfunk Fake News Provider';
  readonly trustedForAutoPublish = true;

  readonly capabilities: NewsProviderCapabilities = {
    supportsCursorPagination: true,
    supportsTimeWindow: true,
  };

  fetch(input: NewsProviderFetchInput): Promise<NewsProviderFetchResult> {
    return Promise.resolve().then(() => {
      const offset = this.parseCursor(input.cursor);

      const filtered = FAKE_NEWS.filter((item) => this.isInsideTimeWindow(item.publishedAt, input));

      const page = filtered.slice(offset, offset + PAGE_SIZE);

      const records: NewsProviderRecord[] = page.map((payload) => ({
        externalId: payload.id,
        externalUrl: payload.url,
        payload: { ...payload },
      }));

      const nextOffset = offset + records.length;

      return {
        records,
        ...(nextOffset < filtered.length ? { nextCursor: String(nextOffset) } : {}),
      };
    });
  }

  private parseCursor(cursor: string | undefined): number {
    if (cursor === undefined) {
      return 0;
    }

    if (!/^\d+$/.test(cursor)) {
      throw new Error(`Invalid fake provider cursor: ${cursor}`);
    }

    return Number(cursor);
  }

  private isInsideTimeWindow(publishedAt: string, input: NewsProviderFetchInput): boolean {
    const timestamp = Date.parse(publishedAt);

    if (input.windowStart !== undefined && timestamp < Date.parse(input.windowStart)) {
      return false;
    }

    if (input.windowEnd !== undefined && timestamp > Date.parse(input.windowEnd)) {
      return false;
    }

    return true;
  }
}
