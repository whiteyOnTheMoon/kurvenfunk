import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';

export interface ClubListItem {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  logo: {
    externalUrl: string | null;
    storageKey: string | null;
    altText: string | null;
  } | null;
}

@Injectable()
export class ClubsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async findActive(): Promise<ClubListItem[]> {
    const clubs = await this.database.club.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        logoMedia: {
          select: {
            externalUrl: true,
            storageKey: true,
            altText: true,
          },
        },
      },
    });

    return clubs.map(({ logoMedia, ...club }) => ({
      ...club,
      logo: logoMedia,
    }));
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
