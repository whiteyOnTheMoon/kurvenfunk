import { NotFoundException } from '@nestjs/common';
import { createPrismaClient } from '@kurvenfunk/database';

import { ImportsService } from './imports.service';

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

describe('ImportsService', () => {
  const providerFindMany = jest.fn<
    Promise<unknown>,
    [
      {
        orderBy: Array<{ name: string }>;
        select: {
          id: boolean;
          key: boolean;
          name: boolean;
          type: boolean;
          status: boolean;
          lastImportAt: boolean;
          createdAt: boolean;
          updatedAt: boolean;
          _count: {
            select: {
              importJobs: boolean;
              importRecords: boolean;
            };
          };
        };
      },
    ]
  >();
  const importJobCount = jest.fn();
  const importJobFindMany = jest.fn();
  const importJobFindUnique = jest.fn();
  const importRecordCount = jest.fn();
  const entityMatchCount = jest.fn();
  const entityMatchFindMany = jest.fn();
  const disconnect = jest.fn();

  const database = {
    provider: {
      findMany: providerFindMany,
    },
    importJob: {
      count: importJobCount,
      findMany: importJobFindMany,
      findUnique: importJobFindUnique,
    },
    importRecord: {
      count: importRecordCount,
    },
    entityMatch: {
      count: entityMatchCount,
      findMany: entityMatchFindMany,
    },
    $disconnect: disconnect,
  };

  beforeEach(() => {
    jest.resetAllMocks();

    (createPrismaClient as jest.Mock).mockReturnValue(database);
  });

  describe('getOverview', () => {
    it('returns providers and import summary counters', async () => {
      providerFindMany.mockResolvedValue([
        {
          id: '11111111-1111-4111-8111-111111111111',
          key: 'fake',
          name: 'Fake Provider',
          type: 'NEWS',
          status: 'ACTIVE',
          lastImportAt: new Date('2026-08-26T20:00:00.000Z'),
          createdAt: new Date('2026-08-20T12:00:00.000Z'),
          updatedAt: new Date('2026-08-26T20:00:00.000Z'),
          _count: {
            importJobs: 5,
            importRecords: 23,
          },
        },
      ]);

      importJobCount
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      importRecordCount
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);

      entityMatchCount.mockResolvedValue(5);

      const service = new ImportsService();

      await expect(service.getOverview()).resolves.toEqual({
        summary: {
          totalJobs: 10,
          runningJobs: 1,
          failedJobs: 2,
          deadLetterJobs: 1,
          importedRecords: 12,
          duplicateRecords: 4,
          reviewRequiredRecords: 3,
          failedRecords: 2,
          matchingProblems: 5,
        },
        providers: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            key: 'fake',
            name: 'Fake Provider',
            type: 'NEWS',
            status: 'ACTIVE',
            lastImportAt: new Date('2026-08-26T20:00:00.000Z'),
            createdAt: new Date('2026-08-20T12:00:00.000Z'),
            updatedAt: new Date('2026-08-26T20:00:00.000Z'),
            jobCount: 5,
            recordCount: 23,
          },
        ],
      });

      expect(providerFindMany).toHaveBeenCalledTimes(1);

      const providerFindManyArguments = providerFindMany.mock.calls[0][0];

      expect(providerFindManyArguments.orderBy).toEqual([{ name: 'asc' }]);
      expect(providerFindManyArguments.select).toMatchObject({
        id: true,
        key: true,
        name: true,
        type: true,
        status: true,
      });

      expect(entityMatchCount).toHaveBeenCalledWith({
        where: {
          status: {
            in: ['UNMATCHED', 'AMBIGUOUS', 'REVIEW_REQUIRED'],
          },
        },
      });
    });
  });

  describe('listJobs', () => {
    it('returns cursor paginated import jobs', async () => {
      importJobFindMany.mockResolvedValue([
        {
          id: '11111111-1111-4111-8111-111111111111',
          createdAt: new Date('2026-08-26T21:00:00.000Z'),
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          createdAt: new Date('2026-08-26T20:00:00.000Z'),
        },
        {
          id: '33333333-3333-4333-8333-333333333333',
          createdAt: new Date('2026-08-26T19:00:00.000Z'),
        },
      ]);

      const service = new ImportsService();

      const result = await service.listJobs({
        limit: 2,
      });

      expect(result).toEqual({
        items: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            createdAt: new Date('2026-08-26T21:00:00.000Z'),
          },
          {
            id: '22222222-2222-4222-8222-222222222222',
            createdAt: new Date('2026-08-26T20:00:00.000Z'),
          },
        ],
        nextCursor: '22222222-2222-4222-8222-222222222222',
      });

      expect(importJobFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 3,
        }),
      );
    });

    it('uses the supplied cursor', async () => {
      importJobFindMany.mockResolvedValue([]);

      const service = new ImportsService();

      await service.listJobs({
        cursor: '11111111-1111-4111-8111-111111111111',
        limit: 30,
      });

      expect(importJobFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: {
            id: '11111111-1111-4111-8111-111111111111',
          },
          skip: 1,
          take: 31,
        }),
      );
    });

    it('caps the limit at 100', async () => {
      importJobFindMany.mockResolvedValue([]);

      const service = new ImportsService();

      await service.listJobs({
        limit: 500,
      });

      expect(importJobFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 101,
        }),
      );
    });
  });

  describe('getJob', () => {
    it('returns an import job with records', async () => {
      const job = {
        id: '11111111-1111-4111-8111-111111111111',
        status: 'SUCCEEDED',
        records: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            status: 'CREATED',
          },
        ],
      };

      importJobFindUnique.mockResolvedValue(job);

      const service = new ImportsService();

      await expect(service.getJob('11111111-1111-4111-8111-111111111111')).resolves.toEqual(job);

      expect(importJobFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: '11111111-1111-4111-8111-111111111111',
          },
        }),
      );
    });

    it('throws when an import job does not exist', async () => {
      importJobFindUnique.mockResolvedValue(null);

      const service = new ImportsService();

      await expect(service.getJob('11111111-1111-4111-8111-111111111111')).rejects.toEqual(
        new NotFoundException({
          code: 'IMPORT_JOB_NOT_FOUND',
          message: 'Import job not found',
        }),
      );
    });
  });

  describe('getMatchingProblems', () => {
    it('returns unresolved matching problems', async () => {
      const matchingProblems = [
        {
          id: '11111111-1111-4111-8111-111111111111',
          entityType: 'CLUB',
          externalId: 'rapid-wien',
          externalName: 'Rapid Wien',
          status: 'AMBIGUOUS',
          confidence: 'MEDIUM',
        },
      ];

      entityMatchFindMany.mockResolvedValue(matchingProblems);

      const service = new ImportsService();

      await expect(service.getMatchingProblems()).resolves.toEqual(matchingProblems);

      expect(entityMatchFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: {
              in: ['UNMATCHED', 'AMBIGUOUS', 'REVIEW_REQUIRED'],
            },
          },
          orderBy: [{ lastSeenAt: 'desc' }, { id: 'desc' }],
          take: 100,
        }),
      );
    });
  });

  it('disconnects Prisma on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    const service = new ImportsService();

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
