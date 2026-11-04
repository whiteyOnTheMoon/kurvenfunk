import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { ArticleEditorialGuard } from '../src/modules/articles/article-editorial.guard';
import { AuthGuard } from '../src/modules/auth/auth.guard';
import { configureApplication } from '../src/bootstrap';

interface MediaResponse {
  data: {
    id: string;
    storageKey: string;
    mimeType: string;
    originalFileName: string;
    sizeBytes: number;
    width: number;
    height: number;
  };
}

describe('Media multipart upload with real isolated PostgreSQL and MinIO', () => {
  let app: INestApplication<App>;
  let database: DatabaseClient;
  let s3: S3Client;
  const saved: Array<{ id: string; key: string }> = [];
  const filenamePrefix = `e2e-media-${randomUUID()}`;
  const bucket = 'e2e-only';

  async function objectCount() {
    const result = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'media/' }));
    return result.KeyCount ?? 0;
  }

  async function assertRejectedWithoutStorage(
    filename: string,
    content: Buffer,
    mime: string,
  ): Promise<void> {
    const beforeObjects = await objectCount();
    const beforeRows = await database.media.count({
      where: { originalFileName: { startsWith: filenamePrefix } },
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/media/upload')
      .attach('file', content, { filename, contentType: mime });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(await objectCount()).toBe(beforeObjects);
    expect(
      await database.media.count({
        where: { originalFileName: { startsWith: filenamePrefix } },
      }),
    ).toBe(beforeRows);
  }

  beforeAll(async () => {
    const databaseUrl = new URL(process.env.DATABASE_URL ?? '');
    const endpoint = new URL(process.env.STORAGE_ENDPOINT ?? '');
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      databaseUrl.hostname !== '127.0.0.1' ||
      databaseUrl.pathname !== '/kurvenfunk_e2e' ||
      endpoint.hostname !== '127.0.0.1' ||
      process.env.STORAGE_BUCKET !== bucket ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error('Real media upload E2E requires disposable local PostgreSQL and MinIO');
    }

    s3 = new S3Client({
      endpoint: endpoint.toString(),
      region: process.env.STORAGE_REGION ?? 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
      },
    });
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    database = createPrismaClient();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      // Authorization is independently tested. This suite exercises the genuine
      // multipart controller, image decoder, database and S3 integration.
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ArticleEditorialGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
    if (database) {
      for (const item of saved) {
        await database.media.delete({ where: { id: item.id } });
      }
      await database.$disconnect();
    }
    if (s3) {
      for (const item of saved) {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: item.key }));
      }
      s3.destroy();
    }
  }, 30000);

  it('accepts multipart PNG, decodes it, stores normalized WebP in MinIO and serves it', async () => {
    const pixels = await sharp({
      create: {
        width: 24,
        height: 16,
        channels: 4,
        background: { r: 10, g: 80, b: 160, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const fileName = `${filenamePrefix}-valid.png`;
    const response = await request(app.getHttpServer())
      .post('/api/v1/media/upload')
      .field('altText', 'Testbild ohne sensible Metadaten')
      .attach('file', pixels, { filename: fileName, contentType: 'image/png' })
      .expect(201);

    const uploaded = (response.body as MediaResponse).data;
    expect(uploaded.originalFileName).toBe(fileName);
    expect(uploaded.mimeType).toBe('image/webp');
    expect(uploaded.width).toBe(24);
    expect(uploaded.height).toBe(16);
    expect(uploaded.storageKey).toMatch(/^media\/\d{4}\/\d{2}\/[0-9a-f-]+\.webp$/);
    saved.push({ id: uploaded.id, key: uploaded.storageKey });

    const record = await database.media.findUniqueOrThrow({ where: { id: uploaded.id } });
    expect(record.mimeType).toBe('image/webp');
    expect(record.width).toBe(24);
    expect(record.height).toBe(16);
    expect(record.sizeBytes).toBe(BigInt(uploaded.sizeBytes));

    const stored = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: uploaded.storageKey }),
    );
    expect(stored.ContentType).toBe('image/webp');
    const storedBytes = Buffer.from(await stored.Body!.transformToByteArray());
    const metadata = await sharp(storedBytes).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(24);
    expect(metadata.height).toBe(16);
    expect(metadata.exif).toBeUndefined();
    expect(storedBytes.length).toBe(uploaded.sizeBytes);

    const served = await request(app.getHttpServer())
      .get(`/api/v1/media/${uploaded.id}/content`)
      .expect(200);
    expect(served.headers['content-type']).toMatch(/^image\/webp/);
    expect(Number(served.headers['content-length'])).toBe(storedBytes.length);
    expect(served.headers['x-content-type-options']).toBe('nosniff');
  }, 30000);

  it('rejects PNG bytes with a forged JPEG MIME before reaching storage', async () => {
    const png = await sharp({
      create: { width: 12, height: 8, channels: 3, background: '#123456' },
    })
      .png()
      .toBuffer();

    await assertRejectedWithoutStorage(`${filenamePrefix}-mismatch.jpg`, png, 'image/jpeg');
  });

  it('rejects corrupted PNGs even when their signature matches', async () => {
    const valid = await sharp({
      create: { width: 12, height: 8, channels: 3, background: '#123456' },
    })
      .png()
      .toBuffer();

    await assertRejectedWithoutStorage(
      `${filenamePrefix}-truncated.png`,
      valid.subarray(0, 24),
      'image/png',
    );
  });

  it('rejects image dimensions above the configured limit without persisting data', async () => {
    const oversized = await sharp({
      create: { width: 8193, height: 1, channels: 3, background: '#123456' },
    })
      .png()
      .toBuffer();

    await assertRejectedWithoutStorage(`${filenamePrefix}-dimensions.png`, oversized, 'image/png');
  });

  it('rejects non-image uploads and does not write any object', async () => {
    await assertRejectedWithoutStorage(
      `${filenamePrefix}-fake.pdf`,
      Buffer.from('%PDF-1.4 not a photograph'),
      'application/pdf',
    );
  });

  it('rejects oversized multipart payloads before image processing and storage', async () => {
    await assertRejectedWithoutStorage(
      `${filenamePrefix}-oversized.png`,
      Buffer.alloc(10 * 1024 * 1024 + 1, 0),
      'image/png',
    );
  }, 30000);
});
