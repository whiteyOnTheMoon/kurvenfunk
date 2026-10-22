const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const { Test } = require('@nestjs/testing');
const request = require('supertest');
const platformRequire = createRequire(require.resolve('@nestjs/platform-express/package.json'));
const express = platformRequire('express');
const proxyaddr = createRequire(platformRequire.resolve('express'))('proxy-addr');

test('mapped IPv6 trust ranges do not trust arbitrary IPv4 clients', () => {
  assert.equal(proxyaddr.compile('::ffff:10.0.0.0/8')('203.0.113.10'), false);
  assert.equal(proxyaddr.compile('::/1')('203.0.113.10'), false);
  assert.equal(proxyaddr.compile('::ffff:10.0.0.0/104')('10.20.30.40'), true);
  assert.equal(proxyaddr.compile('::ffff:10.0.0.0/104')('203.0.113.10'), false);
});

test('Express ignores forged forwarded IPs from untrusted peers and retains valid proxy support', async () => {
  const app = express();
  app.set('trust proxy', '::ffff:10.0.0.0/8');
  app.get('/ip', (req, res) => res.json({ ip: req.ip }));
  const untrusted = await request(app)
    .get('/ip')
    .set('X-Forwarded-For', '203.0.113.10')
    .expect(200);
  assert.notEqual(untrusted.body.ip, '203.0.113.10');
  app.set('trust proxy', 'loopback');
  const trusted = await request(app).get('/ip').set('X-Forwarded-For', '203.0.113.10').expect(200);
  assert.equal(trusted.body.ip, '203.0.113.10');
});

test('actual MediaController accepts flat uploads and rejects hostile multipart fields before the service', async (t) => {
  // Test actual Nest FileInterceptor/Multer and Zod validation. Auth and storage
  // are explicit boundaries; this is parser regression coverage, not Auth E2E.
  const { MediaController } = require('../dist/modules/media/media.controller.js');
  const { MediaService } = require('../dist/modules/media/media.service.js');
  const { AuthGuard } = require('../dist/modules/auth/auth.guard.js');
  const { ArticleEditorialGuard } = require('../dist/modules/articles/article-editorial.guard.js');
  let calls = 0;
  const fixture = await Test.createTestingModule({
    controllers: [MediaController],
    providers: [
      {
        provide: MediaService,
        useValue: {
          upload(file, metadata) {
            calls++;
            return {
              name: file.originalname,
              bytes: file.buffer.length,
              altText: metadata.altText,
            };
          },
        },
      },
    ],
  })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(ArticleEditorialGuard)
    .useValue({ canActivate: () => true })
    .compile();
  const app = fixture.createNestApplication({ logger: false });
  app.setGlobalPrefix('api/v1');
  await app.init();
  try {
    await t.test('ordinary flat metadata and a file pass through unchanged', async () => {
      calls = 0;
      const result = await request(app.getHttpServer())
        .post('/api/v1/media/upload')
        .field('altText', 'Club badge')
        .attach('file', Buffer.from('image-fixture'), 'badge.png')
        .expect(201);
      assert.deepEqual(result.body, { name: 'badge.png', bytes: 13, altText: 'Club badge' });
      assert.equal(calls, 1);
    });
    for (const field of ['items[10000]', 'items[0][nested]', 'items[10000][nested]']) {
      await t.test(`untrusted field ${field} is rejected without calling upload`, async () => {
        calls = 0;
        // A bounded index protects the runner even if a dependency regresses.
        await request(app.getHttpServer())
          .post('/api/v1/media/upload')
          .field(field, 'bad')
          .attach('file', Buffer.from('image-fixture'), 'badge.png')
          .expect(400);
        assert.equal(calls, 0);
      });
    }
    await t.test('oversized uploads still fail with 413 before storage', async () => {
      calls = 0;
      await request(app.getHttpServer())
        .post('/api/v1/media/upload')
        .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), 'large.png')
        .expect(413);
      assert.equal(calls, 0);
    });
    await t.test('malformed multipart does not reach the upload service', async () => {
      calls = 0;
      await request(app.getHttpServer())
        .post('/api/v1/media/upload')
        .set('Content-Type', 'multipart/form-data')
        .send('missing boundary')
        .expect(400);
      assert.equal(calls, 0);
    });
  } finally {
    await app.close();
  }
});
