import { createPrismaClient, type DatabaseClient, type Prisma } from '@kurvenfunk/database';
import type { CreateClubInput, UpdateClubInput } from '@kurvenfunk/validation';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

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

const clubAdminSelect = {
  ...clubListSelect,
  website: true,
  logoMediaId: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

function clubNotFound(): NotFoundException {
  return new NotFoundException({
    code: 'CLUB_NOT_FOUND',
    message: 'Verein wurde nicht gefunden.',
  });
}

function isDatabaseError(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

/** Canonical RGBA values are derived exclusively from validated six-digit HEX. */
export function hexToRgba(hex: string): string {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, 1)`;
}

function colorData(input: {
  color1Hex?: string;
  color2Hex?: string | null;
  color3Hex?: string | null;
  accentColorHex?: string | null;
}) {
  return {
    ...(input.color1Hex !== undefined
      ? { color1Hex: input.color1Hex, color1Rgba: hexToRgba(input.color1Hex) }
      : {}),
    ...(input.color2Hex !== undefined
      ? {
          color2Hex: input.color2Hex,
          color2Rgba: input.color2Hex === null ? null : hexToRgba(input.color2Hex),
        }
      : {}),
    ...(input.color3Hex !== undefined
      ? {
          color3Hex: input.color3Hex,
          color3Rgba: input.color3Hex === null ? null : hexToRgba(input.color3Hex),
        }
      : {}),
    ...(input.accentColorHex !== undefined
      ? {
          accentColorHex: input.accentColorHex,
          accentColorRgba: input.accentColorHex === null ? null : hexToRgba(input.accentColorHex),
        }
      : {}),
  };
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

    if (!club) throw clubNotFound();

    const { logoMedia, ...data } = club;
    return { ...data, logo: logoMedia };
  }

  /** Admin reads include inactive clubs, preserving archive and referenced identities. */
  async findAllForAdmin() {
    const clubs = await this.database.club.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      select: clubAdminSelect,
    });
    return clubs.map(({ logoMedia, ...club }) => ({ ...club, logo: logoMedia }));
  }

  private async ensureActiveImage(
    tx: Prisma.TransactionClient,
    mediaId: string | null | undefined,
  ): Promise<void> {
    if (mediaId === undefined || mediaId === null) return;
    const media = await tx.media.findUnique({
      where: { id: mediaId },
      select: { status: true, mimeType: true },
    });
    if (!media || media.status !== 'ACTIVE' || !/^image\/(png|jpeg|webp)$/.test(media.mimeType)) {
      throw new BadRequestException({
        code: 'CLUB_LOGO_INVALID',
        message: 'Das Vereinslogo muss ein aktives PNG-, JPEG- oder WebP-Medium sein.',
      });
    }
  }

  async create(input: CreateClubInput, actorUserId: string) {
    try {
      const club = await this.database.$transaction(async (tx) => {
        await this.ensureActiveImage(tx, input.logoMediaId);
        const created = await tx.club.create({
          data: {
            name: input.name,
            shortName: input.shortName ?? null,
            slug: input.slug,
            color1Hex: input.color1Hex,
            color1Rgba: hexToRgba(input.color1Hex),
            color2Hex: input.color2Hex ?? null,
            color2Rgba: input.color2Hex ? hexToRgba(input.color2Hex) : null,
            color3Hex: input.color3Hex ?? null,
            color3Rgba: input.color3Hex ? hexToRgba(input.color3Hex) : null,
            accentColorHex: input.accentColorHex ?? null,
            accentColorRgba: input.accentColorHex ? hexToRgba(input.accentColorHex) : null,
            website: input.website ?? null,
            logoMediaId: input.logoMediaId ?? null,
            active: input.active ?? true,
          },
          select: clubAdminSelect,
        });
        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId,
            action: 'ADMIN_CORRECTION',
            category: 'SYSTEM',
            targetType: 'SYSTEM',
            targetId: created.id,
            metadata: {
              entity: 'CLUB',
              operation: 'CREATE',
              slug: created.slug,
              after: {
                name: created.name,
                shortName: created.shortName,
                colors: [
                  created.color1Hex,
                  created.color2Hex,
                  created.color3Hex,
                  created.accentColorHex,
                ],
                website: created.website,
                logoMediaId: created.logoMediaId,
                active: created.active,
              },
            },
          },
        });
        return created;
      });
      const { logoMedia, ...data } = club;
      return { ...data, logo: logoMedia };
    } catch (error) {
      if (isDatabaseError(error, 'P2002')) {
        throw new ConflictException({
          code: 'CLUB_SLUG_TAKEN',
          message: 'Die Vereinskennung ist bereits vergeben.',
        });
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateClubInput, actorUserId: string) {
    try {
      const club = await this.database.$transaction(async (tx) => {
        const previous = await tx.club.findUnique({ where: { id }, select: clubAdminSelect });
        if (!previous) throw clubNotFound();
        await this.ensureActiveImage(tx, input.logoMediaId);
        const updated = await tx.club.update({
          where: { id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.shortName !== undefined ? { shortName: input.shortName } : {}),
            ...colorData(input),
            ...(input.website !== undefined ? { website: input.website } : {}),
            ...(input.logoMediaId !== undefined ? { logoMediaId: input.logoMediaId } : {}),
            ...(input.active !== undefined ? { active: input.active } : {}),
          },
          select: clubAdminSelect,
        });
        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId,
            action: 'ADMIN_CORRECTION',
            category: 'SYSTEM',
            targetType: 'SYSTEM',
            targetId: updated.id,
            metadata: {
              entity: 'CLUB',
              operation: 'UPDATE',
              slug: updated.slug,
              before: {
                name: previous.name,
                shortName: previous.shortName,
                colors: [
                  previous.color1Hex,
                  previous.color2Hex,
                  previous.color3Hex,
                  previous.accentColorHex,
                ],
                website: previous.website,
                logoMediaId: previous.logoMediaId,
                active: previous.active,
              },
              after: {
                name: updated.name,
                shortName: updated.shortName,
                colors: [
                  updated.color1Hex,
                  updated.color2Hex,
                  updated.color3Hex,
                  updated.accentColorHex,
                ],
                website: updated.website,
                logoMediaId: updated.logoMediaId,
                active: updated.active,
              },
            },
          },
        });
        return updated;
      });
      const { logoMedia, ...data } = club;
      return { ...data, logo: logoMedia };
    } catch (error) {
      if (isDatabaseError(error, 'P2025')) throw clubNotFound();
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
