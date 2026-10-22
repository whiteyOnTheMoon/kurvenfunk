import type { NormalizedNewsArticle } from '@kurvenfunk/types';

jest.mock('../database/database.service', () => ({
  DatabaseService: class DatabaseService {},
}));

import type { DatabaseService } from '../database/database.service';
import { NewsDuplicateDetectionService } from './news-duplicate-detection.service';

describe('NewsDuplicateDetectionService', () => {
  const article: NormalizedNewsArticle = {
    externalId: 'fake-001',
    originalUrl: 'https://provider.test/news/rapid',
    title: 'Rapid gewinnt dramatisches Heimspiel',
    clubNames: ['SK Rapid Wien'],
  };

  function createService() {
    const findUnique = jest.fn();
    const findFirst = jest.fn();
    const findMany = jest.fn();
    const importRecordUpdate = jest.fn().mockResolvedValue({});
    const importJobUpdate = jest.fn().mockResolvedValue({});
    const transaction = jest.fn().mockResolvedValue([]);

    const databaseService = {
      client: {
        importRecord: {
          findUnique,
          findFirst,
          findMany,
          update: importRecordUpdate,
        },
        importJob: {
          update: importJobUpdate,
        },
        $transaction: transaction,
      },
    } as unknown as DatabaseService;

    findUnique.mockResolvedValue({
      id: 'current-record',
      importJobId: 'job-1',
      providerId: 'provider-1',
      recordType: 'NEWS_ARTICLE',
      externalId: 'fake-001',
      externalUrl: 'https://provider.test/news/rapid',
      contentHash: 'hash-1',
    });

    findFirst.mockResolvedValue(null);
    findMany.mockResolvedValue([]);

    return {
      service: new NewsDuplicateDetectionService(databaseService),
      findFirst,
      findMany,
      importRecordUpdate,
      importJobUpdate,
      transaction,
    };
  }

  it('detects a duplicate by provider external ID first', async () => {
    const { service, findFirst, importRecordUpdate, importJobUpdate } = createService();

    findFirst.mockResolvedValueOnce({
      id: 'original-record',
      duplicateOfRecordId: null,
    });

    await expect(service.detectDuplicate('current-record', article)).resolves.toEqual({
      duplicate: true,
      duplicateOfRecordId: 'original-record',
      method: 'PROVIDER_ID',
    });

    expect(importRecordUpdate).toHaveBeenCalledWith({
      where: {
        id: 'current-record',
      },
      data: {
        status: 'DUPLICATE',
        duplicateOfRecordId: 'original-record',
        errorCode: null,
        errorMessage: null,
      },
    });

    expect(importJobUpdate).toHaveBeenCalledWith({
      where: {
        id: 'job-1',
      },
      data: {
        duplicateCount: {
          increment: 1,
        },
      },
    });
  });

  it('treats an existing REVIEW_REQUIRED record as a duplicate', async () => {
    const { service, findFirst, importRecordUpdate, importJobUpdate } = createService();

    findFirst.mockResolvedValueOnce({
      id: 'original-record',
      duplicateOfRecordId: null,
    });

    await expect(service.detectDuplicate('current-record', article)).resolves.toEqual({
      duplicate: true,
      duplicateOfRecordId: 'original-record',
      method: 'PROVIDER_ID',
    });

    expect(importRecordUpdate).toHaveBeenCalledWith({
      where: {
        id: 'current-record',
      },
      data: {
        status: 'DUPLICATE',
        duplicateOfRecordId: 'original-record',
        errorCode: null,
        errorMessage: null,
      },
    });

    expect(importJobUpdate).toHaveBeenCalledWith({
      where: {
        id: 'job-1',
      },
      data: {
        duplicateCount: {
          increment: 1,
        },
      },
    });
  });

  it('falls back to exact URL detection', async () => {
    const { service, findFirst } = createService();

    findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'url-record',
      duplicateOfRecordId: null,
    });

    await expect(service.detectDuplicate('current-record', article)).resolves.toEqual({
      duplicate: true,
      duplicateOfRecordId: 'url-record',
      method: 'URL',
    });
  });

  it('falls back to exact content hash detection', async () => {
    const { service, findFirst } = createService();

    findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'hash-record',
      duplicateOfRecordId: null,
    });

    await expect(service.detectDuplicate('current-record', article)).resolves.toEqual({
      duplicate: true,
      duplicateOfRecordId: 'hash-record',
      method: 'HASH',
    });
  });

  it('detects an exact normalized title', async () => {
    const { service, findMany } = createService();

    findMany.mockResolvedValue([
      {
        id: 'title-record',
        duplicateOfRecordId: null,
        normalizedPayload: {
          title: 'Rapid gewinnt dramatisches Heimspiel!',
        },
      },
    ]);

    await expect(service.detectDuplicate('current-record', article)).resolves.toEqual({
      duplicate: true,
      duplicateOfRecordId: 'title-record',
      method: 'TITLE',
    });
  });

  it('detects a highly similar title', async () => {
    const { service, findMany } = createService();

    findMany.mockResolvedValue([
      {
        id: 'similar-record',
        duplicateOfRecordId: null,
        normalizedPayload: {
          title: 'Rapid gewinnt dramatisches Heimspiel in Wien',
        },
      },
    ]);

    const result = await service.detectDuplicate('current-record', {
      ...article,
      title: 'Rapid gewinnt dramatisches Heimspiel in Wien!',
    });

    expect(result.duplicate).toBe(true);

    if (!result.duplicate) {
      throw new Error('Expected duplicate');
    }

    expect(result.method).toBe('TITLE');
  });

  it('allows a genuinely new article to continue', async () => {
    const { service, findMany, transaction } = createService();

    findMany.mockResolvedValue([
      {
        id: 'other-record',
        duplicateOfRecordId: null,
        normalizedPayload: {
          title: 'Sturm verpflichtet neuen Torhüter',
        },
      },
    ]);

    await expect(service.detectDuplicate('current-record', article)).resolves.toEqual({
      duplicate: false,
    });

    expect(transaction).not.toHaveBeenCalled();
  });

  it('points duplicate chains at the original record', async () => {
    const { service, findFirst } = createService();

    findFirst.mockResolvedValueOnce({
      id: 'previous-duplicate',
      duplicateOfRecordId: 'original-record',
    });

    await expect(service.detectDuplicate('current-record', article)).resolves.toEqual({
      duplicate: true,
      duplicateOfRecordId: 'original-record',
      method: 'PROVIDER_ID',
    });
  });
});
