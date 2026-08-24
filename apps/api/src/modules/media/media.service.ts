import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type {
  MediaListQueryInput,
  MediaUploadMetadataInput,
  UpdateMediaMetadataInput,
} from '@kurvenfunk/validation';
import { randomUUID } from 'node:crypto';

import { STORAGE_SERVICE, type StorageService } from '../../infrastructure/storage/storage.types';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

const IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export interface UploadedMediaFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class MediaService {
  private readonly database: DatabaseClient = createPrismaClient();

  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storage: StorageService,
  ) {}

  async upload(file: UploadedMediaFile | undefined, metadata: MediaUploadMetadataInput) {
    if (!file) {
      throw new BadRequestException({
        code: 'MEDIA_FILE_REQUIRED',
        message: 'A media file is required',
      });
    }

    if (file.size <= 0) {
      throw new BadRequestException({
        code: 'MEDIA_FILE_EMPTY',
        message: 'The uploaded media file is empty',
      });
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException({
        code: 'MEDIA_FILE_TOO_LARGE',
        message: 'The uploaded media file exceeds the 10 MB limit',
      });
    }

    const extension = IMAGE_EXTENSIONS[file.mimetype];

    if (!extension) {
      throw new BadRequestException({
        code: 'MEDIA_TYPE_NOT_ALLOWED',
        message: 'Only JPEG, PNG, WebP, GIF and AVIF images are allowed',
      });
    }

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const storageKey = `media/${year}/${month}/${randomUUID()}.${extension}`;

    await this.storage.put({
      key: storageKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    try {
      const media = await this.database.media.create({
        data: {
          storageType: 'INTERNAL',
          storageKey,
          originalFileName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: BigInt(file.size),
          altText: metadata.altText,
          copyright: metadata.copyright,
          source: metadata.source,
          sourceUrl: metadata.sourceUrl,
        },
      });

      return this.serializeMedia(media);
    } catch (error) {
      await this.storage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async list(query: MediaListQueryInput) {
    const media = await this.database.media.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor
        ? {
            cursor: {
              id: query.cursor,
            },
            skip: 1,
          }
        : {}),
      include: {
        _count: {
          select: {
            profileAvatars: true,
            clubLogos: true,
            articleLeads: true,
          },
        },
      },
    });

    const hasMore = media.length > query.limit;
    const items = hasMore ? media.slice(0, query.limit) : media;
    const lastItem = items.at(-1);

    return {
      items: items.map((item) => this.serializeMediaWithUsage(item)),
      nextCursor: hasMore && lastItem ? lastItem.id : null,
    };
  }

  async getById(id: string) {
    const media = await this.database.media.findFirst({
      where: {
        id,
        status: 'ACTIVE',
      },
      include: {
        profileAvatars: {
          select: {
            id: true,
            userId: true,
          },
        },
        clubLogos: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        articleLeads: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media not found',
      });
    }

    return {
      ...this.serializeMedia(media),
      usage: {
        profileAvatars: media.profileAvatars,
        clubLogos: media.clubLogos,
        articleLeads: media.articleLeads,
        total: media.profileAvatars.length + media.clubLogos.length + media.articleLeads.length,
      },
    };
  }

  async update(id: string, input: UpdateMediaMetadataInput) {
    const existing = await this.database.media.findFirst({
      where: {
        id,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media not found',
      });
    }

    const media = await this.database.media.update({
      where: {
        id,
      },
      data: {
        altText: input.altText,
        copyright: input.copyright,
        source: input.source,
        sourceUrl: input.sourceUrl,
      },
    });

    return this.serializeMedia(media);
  }

  async getContent(id: string) {
    const media = await this.database.media.findFirst({
      where: {
        id,
        status: 'ACTIVE',
      },
    });

    if (!media) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media not found',
      });
    }

    if (media.storageType !== 'INTERNAL' || !media.storageKey) {
      throw new NotFoundException({
        code: 'MEDIA_CONTENT_NOT_FOUND',
        message: 'Internal media content not found',
      });
    }

    const object = await this.storage.get(media.storageKey);

    return {
      body: object.body,
      mimeType: object.contentType ?? media.mimeType,
      sizeBytes: Number(media.sizeBytes),
    };
  }

  private serializeMediaWithUsage<
    T extends Parameters<MediaService['serializeMedia']>[0] & {
      _count: {
        profileAvatars: number;
        clubLogos: number;
        articleLeads: number;
      };
    },
  >(media: T) {
    return {
      ...this.serializeMedia(media),
      usage: {
        profileAvatars: media._count.profileAvatars,
        clubLogos: media._count.clubLogos,
        articleLeads: media._count.articleLeads,
        total: media._count.profileAvatars + media._count.clubLogos + media._count.articleLeads,
      },
    };
  }

  private serializeMedia<
    T extends {
      id: string;
      storageType: string;
      storageKey: string | null;
      externalUrl: string | null;
      originalFileName: string | null;
      mimeType: string;
      sizeBytes: bigint;
      width: number | null;
      height: number | null;
      altText: string | null;
      copyright: string | null;
      source: string | null;
      sourceUrl: string | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    },
  >(media: T) {
    return {
      id: media.id,
      storageType: media.storageType,
      storageKey: media.storageKey,
      externalUrl: media.externalUrl,
      originalFileName: media.originalFileName,
      mimeType: media.mimeType,
      sizeBytes: Number(media.sizeBytes),
      width: media.width,
      height: media.height,
      altText: media.altText,
      copyright: media.copyright,
      source: media.source,
      sourceUrl: media.sourceUrl,
      status: media.status,
      contentUrl: `/api/v1/media/${media.id}/content`,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }
}
