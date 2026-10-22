import type { NewsProviderRecord } from '@kurvenfunk/types';
import { FakeNewsNormalizer } from './fake-news-normalizer';

describe('FakeNewsNormalizer', () => {
  const normalizer = new FakeNewsNormalizer();

  it('maps fake provider data to the Kurvenfunk news format', () => {
    const record: NewsProviderRecord = {
      externalId: 'fake-001',
      externalUrl: 'https://fake-provider.test/news/fake-001',
      payload: {
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
    };

    expect(normalizer.normalizeNewsRecord(record)).toEqual({
      externalId: 'fake-001',
      originalUrl: 'https://fake-provider.test/news/fake-001',
      title: 'Rapid gewinnt dramatisches Heimspiel',
      lead: 'Ein später Treffer entscheidet die Partie in Wien.',
      body: 'Rapid setzt sich in einer umkämpften Bundesliga-Partie durch.',
      publishedAt: '2026-08-25T18:30:00.000Z',
      authorName: 'Fake Provider Redaktion',
      clubNames: ['SK Rapid Wien'],
      competitionName: 'Österreichische Bundesliga',
    });
  });

  it('normalizes surrounding whitespace', () => {
    const record: NewsProviderRecord = {
      externalId: ' fake-002 ',
      payload: {
        title: '  Sturm Graz holt drei Punkte  ',
        clubNames: [' SK Sturm Graz ', '  '],
        competitionName: ' Österreichische Bundesliga ',
      },
    };

    expect(normalizer.normalizeNewsRecord(record)).toEqual({
      externalId: 'fake-002',
      title: 'Sturm Graz holt drei Punkte',
      clubNames: ['SK Sturm Graz'],
      competitionName: 'Österreichische Bundesliga',
    });
  });

  it('does not perform validation during normalization', () => {
    const record: NewsProviderRecord = {
      payload: {
        title: '',
        publishedAt: 'not-a-date',
        clubNames: 'SK Rapid Wien',
      },
    };

    expect(normalizer.normalizeNewsRecord(record)).toEqual({
      publishedAt: 'not-a-date',
      clubNames: [],
    });
  });

  it('handles non-object payloads without throwing', () => {
    expect(
      normalizer.normalizeNewsRecord({
        payload: null,
      }),
    ).toEqual({
      clubNames: [],
    });
  });

  it('prefers provider record identity over duplicate payload fields', () => {
    const record: NewsProviderRecord = {
      externalId: 'record-id',
      externalUrl: 'https://provider.test/from-record',
      payload: {
        id: 'payload-id',
        url: 'https://provider.test/from-payload',
        clubNames: [],
      },
    };

    expect(normalizer.normalizeNewsRecord(record)).toEqual({
      externalId: 'record-id',
      originalUrl: 'https://provider.test/from-record',
      clubNames: [],
    });
  });
});
