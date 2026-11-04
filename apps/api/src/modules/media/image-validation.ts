import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 20_000_000;
export const MAX_IMAGE_DIMENSION = 8192;

export interface ImageInput {
  mimetype: string;
  buffer: Buffer;
}

export interface ValidatedImage {
  buffer: Buffer;
  mimetype: 'image/webp';
  extension: 'webp';
  width: number;
  height: number;
}

function sniffImageMime(buffer: Buffer): string | undefined {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return 'image/png';
  }

  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  if (
    buffer.length >= 6 &&
    (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')
  ) {
    return 'image/gif';
  }

  if (buffer.length >= 16 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const compatibleBrands = buffer.toString('ascii', 8, Math.min(buffer.length, 64));
    if (compatibleBrands.includes('avif') || compatibleBrands.includes('avis')) {
      return 'image/avif';
    }
  }

  return undefined;
}

/**
 * Decode and re-encode to a single safe browser format. This strips all input
 * metadata and deliberately converts animated images to their first frame.
 * Never store raw untrusted uploads or trust client-provided MIME.
 */
export async function validateAndNormalizeImage(input: ImageInput): Promise<ValidatedImage> {
  const file = input.buffer;

  if (file.length === 0 || file.length > MAX_IMAGE_BYTES) {
    throw new BadRequestException({
      code: 'MEDIA_FILE_INVALID_SIZE',
      message: 'Image must be between 1 byte and 10 MB',
    });
  }

  const detectedMime = sniffImageMime(file);

  if (!detectedMime || detectedMime !== input.mimetype) {
    throw new BadRequestException({
      code: 'MEDIA_CONTENT_TYPE_MISMATCH',
      message: 'Image signature and declared MIME type do not match',
    });
  }

  try {
    const source = sharp(file, {
      failOn: 'error',
      limitInputPixels: MAX_IMAGE_PIXELS,
      pages: 1,
      animated: false,
    });

    const metadata = await source.metadata();

    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > MAX_IMAGE_DIMENSION ||
      metadata.height > MAX_IMAGE_DIMENSION ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS
    ) {
      throw new Error('Unsafe image dimensions');
    }

    const normalized = await sharp(file, {
      failOn: 'error',
      limitInputPixels: MAX_IMAGE_PIXELS,
      pages: 1,
      animated: false,
    })
      .rotate()
      .webp({ quality: 85, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    if (
      normalized.info.width > MAX_IMAGE_DIMENSION ||
      normalized.info.height > MAX_IMAGE_DIMENSION ||
      normalized.data.length > MAX_IMAGE_BYTES
    ) {
      throw new Error('Normalized image exceeds limits');
    }

    return {
      buffer: normalized.data,
      mimetype: 'image/webp',
      extension: 'webp',
      width: normalized.info.width,
      height: normalized.info.height,
    };
  } catch {
    throw new BadRequestException({
      code: 'MEDIA_IMAGE_INVALID',
      message: 'Image is damaged, unsupported or exceeds safe dimensions',
    });
  }
}
