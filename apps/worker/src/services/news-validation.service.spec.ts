import type { NormalizedNewsArticle } from '@kurvenfunk/types';

jest.mock('../database/database.service', () => ({
  DatabaseService: class DatabaseService {},
}));

import type { DatabaseService } from '../database/database.service';
import { NewsValidationService } from './news-validation.service';

describe('NewsValidationService', () => {
  type UpdateInput = {
    where: {
      id: string;
    };
    data: {
      status: string;
      errorCode: string | null;
      errorMessage: string | null;
    };
  };

  function createService() {
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

    return {
      service: new NewsValidationService(databaseService),
      update,
      getUpdateInput: () => updateInput,
    };
  }

  function createValidArticle(
    overrides: Partial<NormalizedNewsArticle> = {},
  ): NormalizedNewsArticle {
    return {
      externalId: 'fake-001',
      originalUrl: 'https://fake-provider.test/news/fake-001',
      title: 'Rapid gewinnt dramatisches Heimspiel',
      lead: 'Rapid entscheidet die Partie spät.',
      body: 'Ein gültiger Nachrichtentext.',
      publishedAt: '2026-08-26T18:30:00+02:00',
      authorName: 'Fake Redaktion',
      clubNames: ['SK Rapid Wien'],
      competitionName: 'Österreichische Bundesliga',
      ...overrides,
    };
  }

  it('marks a valid normalized article as validated', async () => {
    const { service, update } = createService();
    const article = createValidArticle();

    await expect(service.validateRecord('import-record-1', article)).resolves.toEqual({
      valid: true,
      article,
    });

    expect(update).toHaveBeenCalledWith({
      where: {
        id: 'import-record-1',
      },
      data: {
        status: 'VALIDATED',
        errorCode: null,
        errorMessage: null,
      },
    });
  });

  it('rejects a missing title', async () => {
    const { service, update, getUpdateInput } = createService();
    const article = createValidArticle({
      title: undefined,
    });

    const result = await service.validateRecord('import-record-1', article);

    expect(result.valid).toBe(false);

    if (result.valid) {
      throw new Error('Expected validation failure');
    }

    expect(result.code).toBe('NEWS_VALIDATION_FAILED');
    expect(result.errors.some((error) => error.startsWith('title:'))).toBe(true);

    expect(update).toHaveBeenCalledTimes(1);

    const updateInput = getUpdateInput();

    expect(updateInput).toBeDefined();

    if (updateInput === undefined) {
      throw new Error('Expected import record update');
    }

    expect(updateInput.where).toEqual({
      id: 'import-record-1',
    });
    expect(updateInput.data.status).toBe('FAILED');
    expect(updateInput.data.errorCode).toBe('NEWS_VALIDATION_FAILED');
    expect(typeof updateInput.data.errorMessage).toBe('string');
    expect(updateInput.data.errorMessage).toContain('title:');
  });

  it('rejects a missing original URL', async () => {
    const { service } = createService();
    const article = createValidArticle({
      originalUrl: undefined,
    });

    const result = await service.validateRecord('import-record-1', article);

    expect(result.valid).toBe(false);

    if (result.valid) {
      throw new Error('Expected validation failure');
    }

    expect(result.errors.some((error) => error.startsWith('originalUrl:'))).toBe(true);
  });

  it('rejects a non-http original URL', async () => {
    const { service } = createService();
    const article = createValidArticle({
      originalUrl: 'ftp://fake-provider.test/news/fake-001',
    });

    const result = await service.validateRecord('import-record-1', article);

    expect(result.valid).toBe(false);

    if (result.valid) {
      throw new Error('Expected validation failure');
    }

    expect(result.errors).toContain('originalUrl: Must be an HTTP(S) URL');
  });

  it('rejects an invalid publication timestamp', async () => {
    const { service } = createService();
    const article = createValidArticle({
      publishedAt: 'not-a-date',
    });

    const result = await service.validateRecord('import-record-1', article);

    expect(result.valid).toBe(false);

    if (result.valid) {
      throw new Error('Expected validation failure');
    }

    expect(result.errors.some((error) => error.startsWith('publishedAt:'))).toBe(true);
  });

  it('allows optional metadata and empty club assignments', async () => {
    const { service } = createService();

    const article: NormalizedNewsArticle = {
      originalUrl: 'https://fake-provider.test/news/minimal',
      title: 'Minimal gültige Nachricht',
      clubNames: [],
    };

    await expect(service.validateRecord('import-record-1', article)).resolves.toEqual({
      valid: true,
      article,
    });
  });

  it('rejects unreasonable field lengths', async () => {
    const { service } = createService();
    const article = createValidArticle({
      title: 'x'.repeat(301),
      lead: 'x'.repeat(1001),
    });

    const result = await service.validateRecord('import-record-1', article);

    expect(result.valid).toBe(false);

    if (result.valid) {
      throw new Error('Expected validation failure');
    }

    expect(result.errors.some((error) => error.startsWith('title:'))).toBe(true);
    expect(result.errors.some((error) => error.startsWith('lead:'))).toBe(true);
  });
});
