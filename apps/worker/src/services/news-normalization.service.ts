import type {
  NewsProviderRecord,
  NewsRecordNormalizer,
  NormalizedNewsArticle,
} from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class NewsNormalizationService {
  constructor(private readonly databaseService: DatabaseService) {}

  async normalizeRecord(
    importRecordId: string,
    record: NewsProviderRecord,
    normalizer: NewsRecordNormalizer,
  ): Promise<NormalizedNewsArticle> {
    const normalized = normalizer.normalizeNewsRecord(record);

    await this.databaseService.client.importRecord.update({
      where: {
        id: importRecordId,
      },
      data: {
        status: 'NORMALIZED',
        normalizedPayload: normalized,
        normalizedAt: new Date(),
      },
    });

    return normalized;
  }
}
