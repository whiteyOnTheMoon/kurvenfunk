import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { ConfigService } from '@nestjs/config';
import sharp from 'sharp';

import { validateAndNormalizeImage } from '../../modules/media/image-validation';
import { S3StorageService } from './s3-storage.service';

describe('S3 storage over an isolated HTTP S3-compatible endpoint', () => {
  let server: Server;
  let storage: S3StorageService;
  const objects = new Map<string, { body: Buffer; contentType: string }>();

  beforeAll(async () => {
    server = createServer((req, response) => {
      const key = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;

      if (req.method === 'PUT') {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
          objects.set(key, {
            body: Buffer.concat(chunks),
            contentType: String(req.headers['content-type'] ?? ''),
          });
          response.statusCode = 200;
          response.setHeader('ETag', '"test-etag"');
          response.end();
        });
      } else if (req.method === 'GET') {
        const stored = objects.get(key);
        if (!stored) {
          response.statusCode = 404;
          response.end('<Error><Code>NoSuchKey</Code></Error>');
          return;
        }
        response.statusCode = 200;
        response.setHeader('Content-Type', stored.contentType);
        response.setHeader('Content-Length', String(stored.body.length));
        response.end(stored.body);
      } else if (req.method === 'DELETE') {
        objects.delete(key);
        response.statusCode = 204;
        response.end();
      } else {
        response.statusCode = 405;
        response.end();
      }
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    const configuration: Record<string, string | boolean> = {
      STORAGE_ENDPOINT: `http://127.0.0.1:${address.port}`,
      STORAGE_REGION: 'us-east-1',
      STORAGE_BUCKET: 'e2e-only',
      STORAGE_ACCESS_KEY: 'local-fake',
      STORAGE_SECRET_KEY: 'local-fake',
      STORAGE_FORCE_PATH_STYLE: true,
    };

    const configService = {
      getOrThrow: (key: string) => configuration[key],
      get: (key: string, fallback: string | boolean) => configuration[key] ?? fallback,
    } as unknown as ConfigService;

    storage = new S3StorageService(configService);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('decodes and normalizes an image, then persists, loads and removes its bytes', async () => {
    const source = await sharp({
      create: {
        width: 16,
        height: 12,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .png()
      .toBuffer();

    const image = await validateAndNormalizeImage({
      mimetype: 'image/png',
      buffer: source,
    });

    await storage.put({
      key: 'isolated/media/test.webp',
      body: image.buffer,
      contentType: image.mimetype,
    });

    const result = await storage.get('isolated/media/test.webp');

    expect(result.contentType).toBe('image/webp');
    expect(result.body).toEqual(image.buffer);
    expect((await sharp(result.body).metadata()).format).toBe('webp');

    await storage.delete('isolated/media/test.webp');

    await expect(storage.get('isolated/media/test.webp')).rejects.toThrow();
  });
});
