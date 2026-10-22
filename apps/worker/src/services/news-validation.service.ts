import type { NormalizedNewsArticle } from '@kurvenfunk/types';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DatabaseService } from '../database/database.service';

const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;

    return protocol === 'http:' || protocol === 'https:';
  }, 'Must be an HTTP(S) URL');

const normalizedNewsArticleSchema = z.object({
  externalId: z.string().min(1).optional(),
  originalUrl: httpUrlSchema,
  title: z.string().min(3).max(300),
  lead: z.string().max(1000).optional(),
  body: z.string().min(1).optional(),
  publishedAt: z.iso.datetime({ offset: true }).optional(),
  authorName: z.string().max(200).optional(),
  clubNames: z.array(z.string().min(1).max(200)).max(20),
  competitionName: z.string().max(200).optional(),
});

export type NewsValidationResult =
  | {
      valid: true;
      article: NormalizedNewsArticle;
    }
  | {
      valid: false;
      code: 'NEWS_VALIDATION_FAILED';
      errors: string[];
    };

@Injectable()
export class NewsValidationService {
  constructor(private readonly databaseService: DatabaseService) {}

  async validateRecord(
    importRecordId: string,
    article: NormalizedNewsArticle,
  ): Promise<NewsValidationResult> {
    const result = normalizedNewsArticleSchema.safeParse(article);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'record';

        return `${path}: ${issue.message}`;
      });

      await this.databaseService.client.importRecord.update({
        where: {
          id: importRecordId,
        },
        data: {
          status: 'FAILED',
          errorCode: 'NEWS_VALIDATION_FAILED',
          errorMessage: errors.join('; '),
        },
      });

      return {
        valid: false,
        code: 'NEWS_VALIDATION_FAILED',
        errors,
      };
    }

    await this.databaseService.client.importRecord.update({
      where: {
        id: importRecordId,
      },
      data: {
        status: 'VALIDATED',
        errorCode: null,
        errorMessage: null,
      },
    });

    return {
      valid: true,
      article,
    };
  }
}
