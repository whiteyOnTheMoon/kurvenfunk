import type { NormalizedNewsArticle } from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const DUPLICATE_CANDIDATE_STATUSES = [
  'VALIDATED',
  'MATCHED',
  'CREATED',
  'UPDATED',
  'DUPLICATE',
  'REVIEW_REQUIRED',
] as const;

export type NewsDuplicateMethod = 'PROVIDER_ID' | 'URL' | 'HASH' | 'TITLE' | 'TITLE_SIMILARITY';

export type NewsDuplicateDetectionResult =
  | {
      duplicate: false;
    }
  | {
      duplicate: true;
      duplicateOfRecordId: string;
      method: NewsDuplicateMethod;
      similarity?: number;
    };

@Injectable()
export class NewsDuplicateDetectionService {
  constructor(private readonly databaseService: DatabaseService) {}

  async detectDuplicate(
    importRecordId: string,
    article: NormalizedNewsArticle,
  ): Promise<NewsDuplicateDetectionResult> {
    const current = await this.databaseService.client.importRecord.findUnique({
      where: {
        id: importRecordId,
      },
      select: {
        id: true,
        importJobId: true,
        providerId: true,
        recordType: true,
        externalId: true,
        externalUrl: true,
        contentHash: true,
      },
    });

    if (current === null) {
      throw new Error(`Import record not found: ${importRecordId}`);
    }

    if (current.externalId) {
      const match = await this.databaseService.client.importRecord.findFirst({
        where: {
          id: {
            not: current.id,
          },
          providerId: current.providerId,
          recordType: current.recordType,
          externalId: current.externalId,
          status: {
            in: [...DUPLICATE_CANDIDATE_STATUSES],
          },
        },
        select: {
          id: true,
          duplicateOfRecordId: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (match) {
        return this.markDuplicate(
          current.id,
          current.importJobId,
          match.duplicateOfRecordId ?? match.id,
          'PROVIDER_ID',
        );
      }
    }

    if (current.externalUrl) {
      const match = await this.databaseService.client.importRecord.findFirst({
        where: {
          id: {
            not: current.id,
          },
          recordType: current.recordType,
          externalUrl: current.externalUrl,
          status: {
            in: [...DUPLICATE_CANDIDATE_STATUSES],
          },
        },
        select: {
          id: true,
          duplicateOfRecordId: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (match) {
        return this.markDuplicate(
          current.id,
          current.importJobId,
          match.duplicateOfRecordId ?? match.id,
          'URL',
        );
      }
    }

    if (current.contentHash) {
      const match = await this.databaseService.client.importRecord.findFirst({
        where: {
          id: {
            not: current.id,
          },
          recordType: current.recordType,
          contentHash: current.contentHash,
          status: {
            in: [...DUPLICATE_CANDIDATE_STATUSES],
          },
        },
        select: {
          id: true,
          duplicateOfRecordId: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (match) {
        return this.markDuplicate(
          current.id,
          current.importJobId,
          match.duplicateOfRecordId ?? match.id,
          'HASH',
        );
      }
    }

    if (!article.title) {
      return {
        duplicate: false,
      };
    }

    const normalizedTitle = this.normalizeTitle(article.title);

    const candidates = await this.databaseService.client.importRecord.findMany({
      where: {
        id: {
          not: current.id,
        },
        recordType: current.recordType,
        status: {
          in: [...DUPLICATE_CANDIDATE_STATUSES],
        },
      },
      select: {
        id: true,
        duplicateOfRecordId: true,
        normalizedPayload: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    for (const candidate of candidates) {
      const candidateTitle = this.readNormalizedTitle(candidate.normalizedPayload);

      if (!candidateTitle) {
        continue;
      }

      const normalizedCandidateTitle = this.normalizeTitle(candidateTitle);

      if (normalizedCandidateTitle === normalizedTitle) {
        return this.markDuplicate(
          current.id,
          current.importJobId,
          candidate.duplicateOfRecordId ?? candidate.id,
          'TITLE',
        );
      }
    }

    let bestMatch:
      | {
          id: string;
          duplicateOfRecordId: string | null;
          similarity: number;
        }
      | undefined;

    for (const candidate of candidates) {
      const candidateTitle = this.readNormalizedTitle(candidate.normalizedPayload);

      if (!candidateTitle) {
        continue;
      }

      const similarity = this.calculateSimilarity(
        normalizedTitle,
        this.normalizeTitle(candidateTitle),
      );

      if (similarity < 0.92) {
        continue;
      }

      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = {
          id: candidate.id,
          duplicateOfRecordId: candidate.duplicateOfRecordId,
          similarity,
        };
      }
    }

    if (bestMatch) {
      return this.markDuplicate(
        current.id,
        current.importJobId,
        bestMatch.duplicateOfRecordId ?? bestMatch.id,
        'TITLE_SIMILARITY',
        bestMatch.similarity,
      );
    }

    return {
      duplicate: false,
    };
  }

  private async markDuplicate(
    importRecordId: string,
    importJobId: string,
    duplicateOfRecordId: string,
    method: NewsDuplicateMethod,
    similarity?: number,
  ): Promise<NewsDuplicateDetectionResult> {
    await this.databaseService.client.$transaction([
      this.databaseService.client.importRecord.update({
        where: {
          id: importRecordId,
        },
        data: {
          status: 'DUPLICATE',
          duplicateOfRecordId,
          errorCode: null,
          errorMessage: null,
        },
      }),
      this.databaseService.client.importJob.update({
        where: {
          id: importJobId,
        },
        data: {
          duplicateCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return {
      duplicate: true,
      duplicateOfRecordId,
      method,
      ...(similarity !== undefined ? { similarity } : {}),
    };
  }

  private readNormalizedTitle(payload: unknown): string | undefined {
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      return undefined;
    }

    const title = (payload as Record<string, unknown>).title;

    return typeof title === 'string' ? title : undefined;
  }

  private normalizeTitle(title: string): string {
    return title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('de')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private calculateSimilarity(left: string, right: string): number {
    if (left === right) {
      return 1;
    }

    if (left.length < 2 || right.length < 2) {
      return 0;
    }

    const leftPairs = this.createBigrams(left);
    const rightPairs = this.createBigrams(right);

    const rightCounts = new Map<string, number>();

    for (const pair of rightPairs) {
      rightCounts.set(pair, (rightCounts.get(pair) ?? 0) + 1);
    }

    let intersection = 0;

    for (const pair of leftPairs) {
      const count = rightCounts.get(pair) ?? 0;

      if (count > 0) {
        intersection += 1;
        rightCounts.set(pair, count - 1);
      }
    }

    return (2 * intersection) / (leftPairs.length + rightPairs.length);
  }

  private createBigrams(value: string): string[] {
    const result: string[] = [];

    for (let index = 0; index < value.length - 1; index += 1) {
      result.push(value.slice(index, index + 2));
    }

    return result;
  }
}
