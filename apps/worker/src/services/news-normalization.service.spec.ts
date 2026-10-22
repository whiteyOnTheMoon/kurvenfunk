import type {
  NewsProviderRecord,
  NewsRecordNormalizer,
  NormalizedNewsArticle,
} from '@kurvenfunk/types';

jest.mock('../database/database.service', () => ({
  DatabaseService: class DatabaseService {},
}));
import type { DatabaseService } from '../database/database.service';
import { NewsNormalizationService } from './news-normalization.service';

describe('NewsNormalizationService', () => {
  it('persists the normalized provider record and advances its status', async () => {
    type UpdateInput = {
      where: {
        id: string;
      };
      data: {
        status: string;
        normalizedPayload: NormalizedNewsArticle;
        normalizedAt: Date;
      };
    };

    let updateInput: UpdateInput | undefined;

    const update = jest.fn((input: UpdateInput) => {
      updateInput = input;

      return Promise.resolve({
        id: 'import-record-1',
      });
    });

    const databaseService = {
      client: {
        importRecord: {
          update,
        },
      },
    } as unknown as DatabaseService;

    const normalized: NormalizedNewsArticle = {
      externalId: 'fake-001',
      originalUrl: 'https://fake-provider.test/news/fake-001',
      title: 'Rapid gewinnt dramatisches Heimspiel',
      clubNames: ['SK Rapid Wien'],
      competitionName: 'Österreichische Bundesliga',
    };

    const normalizeNewsRecord = jest.fn().mockReturnValue(normalized);

    const normalizer: NewsRecordNormalizer = {
      normalizeNewsRecord,
    };

    const record: NewsProviderRecord = {
      externalId: 'fake-001',
      payload: {
        title: 'Rapid gewinnt dramatisches Heimspiel',
      },
    };

    const service = new NewsNormalizationService(databaseService);

    await expect(service.normalizeRecord('import-record-1', record, normalizer)).resolves.toEqual(
      normalized,
    );

    expect(normalizeNewsRecord).toHaveBeenCalledWith(record);

    expect(update).toHaveBeenCalledTimes(1);
    expect(updateInput).toBeDefined();

    if (updateInput === undefined) {
      throw new Error('Expected import record update');
    }

    expect(updateInput.where).toEqual({
      id: 'import-record-1',
    });

    expect(updateInput.data.status).toBe('NORMALIZED');
    expect(updateInput.data.normalizedPayload).toEqual(normalized);
    expect(updateInput.data.normalizedAt).toBeInstanceOf(Date);
  });
});
