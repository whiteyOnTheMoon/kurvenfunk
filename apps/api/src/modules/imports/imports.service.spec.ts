import { BadRequestException, NotFoundException } from '@nestjs/common';
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
  const importJobUpdate = jest.fn();
  const importRecordCount = jest.fn();
  const importRecordFindMany = jest.fn();
  const importRecordFindUnique = jest.fn();
  const importRecordFindUniqueOrThrow = jest.fn();
  const importRecordUpdate = jest.fn();
  const articleCreate = jest.fn();
  const articleFindUnique = jest.fn();
  const auditLogCreate = jest.fn();
  const importRecordUpdateMany = jest.fn<
    Promise<{ count: number }>,
    [
      {
        where: {
          id: string;
          status: string;
          reviewDecision: null;
        };
        data: {
          status: string;
          reviewDecision: string;
          reviewedById: string;
          reviewedAt: Date;
        };
      },
    ]
  >();
  const entityMatchCount = jest.fn();
  const entityMatchFindMany = jest.fn();
  const transaction = jest.fn();
  const disconnect = jest.fn();

  const database = {
    provider: {
      findMany: providerFindMany,
    },
    importJob: {
      count: importJobCount,
      findMany: importJobFindMany,
      findUnique: importJobFindUnique,
      update: importJobUpdate,
    },
    importRecord: {
      count: importRecordCount,
      findMany: importRecordFindMany,
      findUnique: importRecordFindUnique,
      findUniqueOrThrow: importRecordFindUniqueOrThrow,
      updateMany: importRecordUpdateMany,
      update: importRecordUpdate,
    },
    article: {
      create: articleCreate,
      findUnique: articleFindUnique,
    },
    auditLog: {
      create: auditLogCreate,
    },
    entityMatch: {
      count: entityMatchCount,
      findMany: entityMatchFindMany,
    },
    $transaction: transaction,
    $disconnect: disconnect,
  };

  beforeEach(() => {
    jest.resetAllMocks();

    (createPrismaClient as jest.Mock).mockReturnValue(database);

    transaction.mockImplementation(
      async (callback: (client: typeof database) => Promise<unknown>) => callback(database),
    );
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

  describe('review workflow', () => {
    it('does not allow editorial rejection of sports matching records', async () => {
      importRecordFindUnique.mockResolvedValue({
        id: 'record-1',
        recordType: 'SPORTS_CLUB',
        status: 'REVIEW_REQUIRED',
        reviewDecision: null,
      });

      const service = new ImportsService();
      await expect(service.rejectReview('record-1', 'reviewer-1')).rejects.toEqual(
        new BadRequestException({
          code: 'IMPORT_REVIEW_NOT_ARTICLE',
          message: 'Sportdaten erfordern die separate Admin-Korrekturschnittstelle.',
        }),
      );
      expect(importRecordUpdateMany).not.toHaveBeenCalled();
    });


    it('returns newest unresolved import records first', async () => {
      const records = [
        {
          id: '11111111-1111-4111-8111-111111111111',
          status: 'REVIEW_REQUIRED',
          reviewDecision: null,
        },
      ];

      importRecordFindMany.mockResolvedValue(records);

      const service = new ImportsService();

      await expect(service.getReviewQueue()).resolves.toEqual(records);

      expect(importRecordFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            recordType: 'NEWS_ARTICLE',
            status: 'REVIEW_REQUIRED',
            reviewDecision: null,
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 100,
        }),
      );
    });

    it('approves an unresolved review and creates one audited editorial draft', async () => {
      importRecordFindUnique.mockResolvedValue({
        id: 'record-1',
        importJobId: 'job-1',
        recordType: 'NEWS_ARTICLE',
        normalizedPayload: {
          title: 'Rapid gewinnt',
          lead: 'Eine Zusammenfassung',
          body: 'Das ist der Nachrichtentext.',
          originalUrl: 'https://example.test/news/1',
          authorName: 'Quelle',
        },
        externalUrl: null,
        status: 'REVIEW_REQUIRED',
        reviewDecision: null,
        canonicalEntityId: null,
      });

      importRecordUpdateMany.mockResolvedValue({ count: 1 });
      articleCreate.mockResolvedValue({ id: 'draft-1' });
      importRecordFindUniqueOrThrow.mockResolvedValue({
        id: 'record-1',
        status: 'CREATED',
        reviewDecision: 'APPROVED',
        reviewedById: 'user-1',
        canonicalEntityId: 'draft-1',
        reviewedAt: new Date('2026-08-27T00:00:00.000Z'),
      });

      const service = new ImportsService();
      const result = await service.approveReview('record-1', 'user-1');

      expect(result).toMatchObject({
        id: 'record-1',
        status: 'CREATED',
        reviewDecision: 'APPROVED',
        canonicalEntityId: 'draft-1',
      });
      expect(importRecordUpdateMany).toHaveBeenCalledTimes(1);
      expect(importRecordUpdateMany.mock.calls[0]?.[0]?.data).toEqual(
        expect.objectContaining({ errorCode: null, errorMessage: null }),
      );
      const draftCalls = articleCreate.mock.calls as unknown as Array<
        [{ data: Record<string, unknown>; select: { id: boolean } }]
      >;
      expect(draftCalls[0]?.[0]?.data).toMatchObject({
        importRecordId: 'record-1',
        title: 'Rapid gewinnt',
        status: 'DRAFT',
        authorId: 'user-1',
        originalUrl: 'https://example.test/news/1',
      });
      expect(draftCalls[0]?.[0]?.select).toEqual({ id: true });
      expect(importRecordUpdate).toHaveBeenCalledWith({
        where: { id: 'record-1' },
        data: {
          status: 'CREATED',
          canonicalEntityType: 'ARTICLE',
          canonicalEntityId: 'draft-1',
        },
      });
      expect(importJobUpdate).toHaveBeenCalledTimes(1);
      const auditCalls = auditLogCreate.mock.calls as unknown as Array<
        [{ data: Record<string, unknown> }]
      >;
      expect(auditCalls[0]?.[0]?.data).toMatchObject({
        actorUserId: 'user-1',
        targetId: 'draft-1',
        category: 'EDITORIAL',
      });
    });

    it('returns the existing draft on repeated approval without another write', async () => {
      importRecordFindUnique.mockResolvedValue({
        id: 'record-1',
        status: 'CREATED',
        reviewDecision: 'APPROVED',
        canonicalEntityId: 'draft-1',
      });
      articleFindUnique.mockResolvedValue({ id: 'draft-1' });
      importRecordFindUniqueOrThrow.mockResolvedValue({
        id: 'record-1',
        status: 'CREATED',
        reviewDecision: 'APPROVED',
        canonicalEntityId: 'draft-1',
      });

      const service = new ImportsService();
      await expect(service.approveReview('record-1', 'user-1')).resolves.toMatchObject({
        canonicalEntityId: 'draft-1',
      });
      expect(articleCreate).not.toHaveBeenCalled();
      expect(importRecordUpdateMany).not.toHaveBeenCalled();
      expect(auditLogCreate).not.toHaveBeenCalled();
    });

    it('rejects an article without valid normalized payload without a write', async () => {
      importRecordFindUnique.mockResolvedValue({
        id: 'record-1',
        status: 'REVIEW_REQUIRED',
        recordType: 'NEWS_ARTICLE',
        normalizedPayload: { body: 'Missing title' },
        reviewDecision: null,
      });

      const service = new ImportsService();
      await expect(service.approveReview('record-1', 'user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(importRecordUpdateMany).not.toHaveBeenCalled();
      expect(articleCreate).not.toHaveBeenCalled();
    });

    it('rejects an unresolved review as skipped', async () => {
      importRecordFindUnique.mockResolvedValue({
        id: 'record-1',
        status: 'REVIEW_REQUIRED',
        reviewDecision: null,
        reviewedAt: null,
      });

      importRecordUpdateMany.mockResolvedValue({
        count: 1,
      });

      importRecordFindUniqueOrThrow.mockResolvedValue({
        id: 'record-1',
        status: 'SKIPPED',
        reviewDecision: 'REJECTED',
        reviewedById: 'user-1',
        reviewedAt: new Date('2026-08-27T00:00:00.000Z'),
      });

      const service = new ImportsService();

      await expect(service.rejectReview('record-1', 'user-1')).resolves.toEqual(
        expect.objectContaining({
          status: 'SKIPPED',
          reviewDecision: 'REJECTED',
        }),
      );

      expect(importRecordUpdateMany).toHaveBeenCalledTimes(1);

      const rejectUpdate = importRecordUpdateMany.mock.calls[0]?.[0];

      expect(rejectUpdate.data).toMatchObject({
        status: 'SKIPPED',
        reviewDecision: 'REJECTED',
        reviewedById: 'user-1',
      });
    });

    it('throws when the review record does not exist', async () => {
      importRecordFindUnique.mockResolvedValue(null);

      const service = new ImportsService();

      await expect(service.approveReview('missing', 'user-1')).rejects.toEqual(
        new NotFoundException({
          code: 'IMPORT_RECORD_NOT_FOUND',
          message: 'Import record not found',
        }),
      );

      expect(importRecordUpdateMany).not.toHaveBeenCalled();
    });

    it('rejects an already decided review', async () => {
      importRecordFindUnique.mockResolvedValue({
        id: 'record-1',
        status: 'MATCHED',
        reviewDecision: 'APPROVED',
        reviewedAt: new Date(),
      });

      const service = new ImportsService();

      await expect(service.rejectReview('record-1', 'user-1')).rejects.toEqual(
        new BadRequestException({
          code: 'IMPORT_REVIEW_ALREADY_DECIDED',
          message: 'Import record is not awaiting review',
        }),
      );

      expect(importRecordUpdateMany).not.toHaveBeenCalled();
    });

    it('detects a concurrent review decision', async () => {
      importRecordFindUnique.mockResolvedValue({
        id: 'record-1',
        status: 'REVIEW_REQUIRED',
        recordType: 'NEWS_ARTICLE',
        normalizedPayload: { title: 'Valid reviewed title', body: 'Valid body' },
        reviewDecision: null,
        reviewedAt: null,
      });

      importRecordUpdateMany.mockResolvedValue({
        count: 0,
      });

      const service = new ImportsService();

      await expect(service.approveReview('record-1', 'user-1')).rejects.toEqual(
        new BadRequestException({
          code: 'IMPORT_REVIEW_ALREADY_DECIDED',
          message: 'Import record is not awaiting review',
        }),
      );

      expect(importRecordFindUniqueOrThrow).not.toHaveBeenCalled();
    });
  });

  it('disconnects Prisma on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    const service = new ImportsService();

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
