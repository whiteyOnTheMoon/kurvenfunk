import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

import { MAX_IMAGE_BYTES, validateAndNormalizeImage } from './image-validation';

const fixture = {
  create: {
    width: 24,
    height: 16,
    channels: 4 as const,
    background: { r: 100, g: 50, b: 80, alpha: 1 },
  },
};

describe('Strict media image validation', () => {
  it.each([
    ['png', 'image/png'],
    ['jpeg', 'image/jpeg'],
    ['webp', 'image/webp'],
    ['gif', 'image/gif'],
    ['avif', 'image/avif'],
  ] as const)('fully decodes %s and outputs metadata-free WebP', async (format, mimetype) => {
    const buffer = await sharp(fixture).toFormat(format).toBuffer();
    const processed = await validateAndNormalizeImage({ buffer, mimetype });

    expect(processed.mimetype).toBe('image/webp');
    expect(processed.extension).toBe('webp');
    expect(processed.width).toBe(24);
    expect(processed.height).toBe(16);

    const output = await sharp(processed.buffer).metadata();
    expect(output.format).toBe('webp');
    expect(output.exif).toBeUndefined();
    expect(output.width).toBe(24);
    expect(output.height).toBe(16);
  });

  it('rejects forged MIME before decoding', async () => {
    const buffer = await sharp(fixture).png().toBuffer();

    await expect(
      validateAndNormalizeImage({ buffer, mimetype: 'image/jpeg' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects damaged images even with a valid signature', async () => {
    const buffer = await sharp(fixture).png().toBuffer();

    await expect(
      validateAndNormalizeImage({ buffer: buffer.subarray(0, 24), mimetype: 'image/png' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unrecognized bytes and empty payloads', async () => {
    await expect(
      validateAndNormalizeImage({ buffer: Buffer.from('fake-image'), mimetype: 'image/webp' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      validateAndNormalizeImage({ buffer: Buffer.alloc(0), mimetype: 'image/png' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects oversized compressed files without a decoder call', async () => {
    await expect(
      validateAndNormalizeImage({
        buffer: Buffer.alloc(MAX_IMAGE_BYTES + 1),
        mimetype: 'image/png',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects images beyond the safe dimension limit', async () => {
    const buffer = await sharp({
      create: {
        width: 8193,
        height: 1,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await expect(
      validateAndNormalizeImage({ buffer, mimetype: 'image/png' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
