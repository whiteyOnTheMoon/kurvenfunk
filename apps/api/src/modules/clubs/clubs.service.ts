import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Injectable, NotFoundException, type OnModuleDestroy } from '@nestjs/common';

export interface ClubListItem {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  color1Hex: string;
  color1Rgba: string;
  color2Hex: string | null;
  color2Rgba: string | null;
  color3Hex: string | null;
  color3Rgba: string | null;
  accentColorHex: string | null;
  accentColorRgba: string | null;
  logo: {
    externalUrl: string | null;
    storageKey: string | null;
    altText: string | null;
    mimeType: string;
    source: string | null;
    sourceUrl: string | null;
    copyright: string | null;
  } | null;
}

export interface ClubDetail extends ClubListItem {
  website: string | null;
}

const clubListSelect = {
  id: true,
  name: true,
  shortName: true,
  slug: true,
  color1Hex: true,
  color1Rgba: true,
  color2Hex: true,
  color2Rgba: true,
  color3Hex: true,
  color3Rgba: true,
  accentColorHex: true,
  accentColorRgba: true,
  logoMedia: {
    select: {
      externalUrl: true,
      storageKey: true,
      altText: true,
      mimeType: true,
      source: true,
      sourceUrl: true,
      copyright: true,
    },
  },
} as const;

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
      select: clubListSelect,
    });

    return clubs.map(({ logoMedia, ...club }) => ({
      ...club,
      logo: logoMedia,
    }));
  }

  async findActiveBySlug(slug: string): Promise<ClubDetail> {
    const club = await this.database.club.findFirst({
      where: {
        slug,
        active: true,
      },
      select: {
        ...clubListSelect,
        website: true,
      },
    });

    if (!club) {
      throw new NotFoundException({
        code: 'CLUB_NOT_FOUND',
        message: 'Verein wurde nicht gefunden.',
      });
    }

    const { logoMedia, ...data } = club;

    return {
      ...data,
      logo: logoMedia,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
