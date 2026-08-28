import type { NewsProviderRecord } from '@kurvenfunk/types';
import { OtsNewsNormalizer } from './ots-news-normalizer';

describe('OtsNewsNormalizer', () => {
  const normalizer = new OtsNewsNormalizer();

  it('normalizes an OTS record', () => {
    const record: NewsProviderRecord = {
      externalId: 'OTS_20260827_OTS0049',
      externalUrl: 'https://www.ots.at/presseaussendung/OTS_20260827_OTS0049/testmeldung',
      payload: {
        SCHLUESSEL: 'OTS_20260827_OTS0049',
        TITEL: ' Testmeldung ',
        UTL: ' Testuntertitel ',
        INHALT: ' Testinhalt ',
        ZEITSTEMPEL: '1787819582',
        EMITTENT: ' PULS 4 ',
        WEBLINK: 'https://www.ots.at/presseaussendung/OTS_20260827_OTS0049/testmeldung',
      },
    };

    expect(normalizer.normalizeNewsRecord(record)).toEqual({
      externalId: 'OTS_20260827_OTS0049',
      originalUrl: 'https://www.ots.at/presseaussendung/OTS_20260827_OTS0049/testmeldung',
      title: 'Testmeldung',
      lead: 'Testuntertitel',
      body: 'Testinhalt',
      publishedAt: new Date(1787819582 * 1_000).toISOString(),
      authorName: 'PULS 4',
      clubNames: [],
    });
  });

  it('falls back to payload identifiers and LEAD', () => {
    const record: NewsProviderRecord = {
      payload: {
        SCHLUESSEL: 'OTS_TEST',
        TITEL: 'Titel',
        LEAD: 'Lead',
        WEBLINK: 'https://www.ots.at/test',
      },
    };

    expect(normalizer.normalizeNewsRecord(record)).toEqual({
      externalId: 'OTS_TEST',
      originalUrl: 'https://www.ots.at/test',
      title: 'Titel',
      lead: 'Lead',
      clubNames: [],
    });
  });

  it('ignores an invalid timestamp', () => {
    const result = normalizer.normalizeNewsRecord({
      payload: {
        TITEL: 'Titel',
        ZEITSTEMPEL: 'invalid',
      },
    });

    expect(result).toEqual({
      title: 'Titel',
      clubNames: [],
    });
  });
});
