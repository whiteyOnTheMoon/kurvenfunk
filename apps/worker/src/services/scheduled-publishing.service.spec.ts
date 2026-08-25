import type { DatabaseClient } from '@kurvenfunk/database';
import type { DatabaseService } from '../database/database.service';

jest.mock('@kurvenfunk/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

import { ScheduledPublishingService } from './scheduled-publishing.service';

interface DueArticle {
  id: string;
  scheduledAt: Date | null;
}

interface UpdateResult {
  count: number;
}

interface FindManyArguments {
  where: {
    status: string;
    scheduledAt: {
      lte: Date;
    };
    deletedAt: null;
  };
  orderBy: {
    scheduledAt: string;
  };
  take: number;
}

interface UpdateManyArguments {
  where: {
    id: string;
    status: string;
    scheduledAt: {
      lte: Date;
    };
    deletedAt: null;
  };
  data: {
    status: string;
    scheduledAt: null;
    publishedAt: Date;
    archivedAt: null;
  };
}

describe('ScheduledPublishingService', () => {
  function createService() {
    const findMany = jest.fn<Promise<DueArticle[]>, [unknown]>();
    const updateMany = jest.fn<Promise<UpdateResult>, [unknown]>();

    const database = {
      article: {
        findMany,
        updateMany,
      },
    } as unknown as DatabaseClient;

    const databaseService = {
      client: database,
    } as DatabaseService;

    return {
      service: new ScheduledPublishingService(databaseService),
      findMany,
      updateMany,
    };
  }

  it('publishes a due scheduled article', async () => {
    const { service, findMany, updateMany } = createService();

    const scheduledAt = new Date(Date.now() - 60_000);

    findMany.mockResolvedValueOnce([
      {
        id: '11111111-1111-4111-8111-111111111111',
        scheduledAt,
      },
    ]);

    updateMany.mockResolvedValueOnce({
      count: 1,
    });

    const publishedCount = await service.publishDueArticles();

    expect(publishedCount).toBe(1);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledTimes(1);

    const findArguments = findMany.mock.calls[0]?.[0] as FindManyArguments | undefined;

    expect(findArguments).toBeDefined();
    expect(findArguments?.where.status).toBe('SCHEDULED');
    expect(findArguments?.where.deletedAt).toBeNull();
    expect(findArguments?.where.scheduledAt.lte).toBeInstanceOf(Date);
    expect(findArguments?.orderBy.scheduledAt).toBe('asc');
    expect(findArguments?.take).toBe(100);

    const updateArguments = updateMany.mock.calls[0]?.[0] as UpdateManyArguments | undefined;

    expect(updateArguments).toBeDefined();
    expect(updateArguments?.where.id).toBe('11111111-1111-4111-8111-111111111111');
    expect(updateArguments?.where.status).toBe('SCHEDULED');
    expect(updateArguments?.where.deletedAt).toBeNull();
    expect(updateArguments?.where.scheduledAt.lte).toBeInstanceOf(Date);

    expect(updateArguments?.data.status).toBe('PUBLISHED');
    expect(updateArguments?.data.scheduledAt).toBeNull();
    expect(updateArguments?.data.publishedAt).toBeInstanceOf(Date);
    expect(updateArguments?.data.archivedAt).toBeNull();
  });

  it('does nothing when no scheduled articles are due', async () => {
    const { service, findMany, updateMany } = createService();

    findMany.mockResolvedValueOnce([]);

    const publishedCount = await service.publishDueArticles();

    expect(publishedCount).toBe(0);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('does not count an article that changed before the atomic update', async () => {
    const { service, findMany, updateMany } = createService();

    findMany.mockResolvedValueOnce([
      {
        id: '22222222-2222-4222-8222-222222222222',
        scheduledAt: new Date(Date.now() - 60_000),
      },
    ]);

    updateMany.mockResolvedValueOnce({
      count: 0,
    });

    const publishedCount = await service.publishDueArticles();

    expect(publishedCount).toBe(0);
    expect(updateMany).toHaveBeenCalledTimes(1);
  });

  it('publishes multiple due articles in one scan', async () => {
    const { service, findMany, updateMany } = createService();

    findMany.mockResolvedValueOnce([
      {
        id: '33333333-3333-4333-8333-333333333333',
        scheduledAt: new Date(Date.now() - 120_000),
      },
      {
        id: '44444444-4444-4444-8444-444444444444',
        scheduledAt: new Date(Date.now() - 60_000),
      },
    ]);

    updateMany
      .mockResolvedValueOnce({
        count: 1,
      })
      .mockResolvedValueOnce({
        count: 1,
      });

    const publishedCount = await service.publishDueArticles();

    expect(publishedCount).toBe(2);
    expect(updateMany).toHaveBeenCalledTimes(2);
  });
});
