import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';

export interface CompetitionListItem {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
}

@Injectable()
export class CompetitionsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async findAll(): Promise<CompetitionListItem[]> {
    return this.database.competition.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
