import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { MediaUploadMetadataInput } from '@kurvenfunk/validation';
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
