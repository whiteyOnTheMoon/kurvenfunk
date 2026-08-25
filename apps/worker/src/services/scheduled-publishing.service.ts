import { createLogger } from '@kurvenfunk/logger';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const logger = createLogger({
  service: 'worker',
});

const BATCH_SIZE = 100;

@Injectable()
export class ScheduledPublishingService {
  constructor(private readonly databaseService: DatabaseService) {}

  async publishDueArticles(): Promise<number> {
    let publishedCount = 0;

    while (true) {
      const now = new Date();

      const dueArticles = await this.databaseService.client.article.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            lte: now,
          },
          deletedAt: null,
        },
        orderBy: {
          scheduledAt: 'asc',
        },
        take: BATCH_SIZE,
        select: {
          id: true,
          scheduledAt: true,
        },
      });

      if (dueArticles.length === 0) {
        break;
      }

      for (const article of dueArticles) {
        const result = await this.databaseService.client.article.updateMany({
          where: {
            id: article.id,
            status: 'SCHEDULED',
            scheduledAt: {
              lte: now,
            },
            deletedAt: null,
          },
          data: {
            status: 'PUBLISHED',
            scheduledAt: null,
            publishedAt: now,
            archivedAt: null,
          },
        });

        if (result.count === 1) {
          publishedCount += 1;

          logger.info('Scheduled article published', {
            event: 'article.scheduled.published',
            metadata: {
              articleId: article.id,
              scheduledAt: article.scheduledAt?.toISOString() ?? null,
              publishedAt: now.toISOString(),
            },
          });
        }
      }

      if (dueArticles.length < BATCH_SIZE) {
        break;
      }
    }

    return publishedCount;
  }
}
