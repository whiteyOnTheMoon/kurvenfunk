import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/bootstrap';

describe('API with real isolated PostgreSQL and Redis', () => {
  let app: INestApplication<App>;
  const requestId = '632ac529-dfb8-46cc-8258-4d18c2caaf11';

  beforeAll(async () => {
    if (
      process.env.API_E2E_ISOLATED !== 'true' ||
      new URL(process.env.DATABASE_URL ?? '').hostname !== '127.0.0.1' ||
      new URL(process.env.DATABASE_URL ?? '').pathname !== '/kurvenfunk_e2e' ||
      process.env.REDIS_HOST !== '127.0.0.1'
    ) {
      throw new Error(
        'Run test:e2e to create isolated local services; injected databases are forbidden.',
      );
    }
    const fixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = fixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it.each(['health', 'health/live'])(
    'serves the actual /api/v1/%s response contract',
    async (path) => {
      await request(app.getHttpServer())
        .get(`/api/v1/${path}`)
        .set('X-Request-Id', requestId)
        .expect(200)
        .expect('X-Request-Id', requestId)
        .expect({ data: { status: 'ok', service: 'kurvenfunk-api' }, meta: { requestId } });
    },
  );

  it('checks real PostgreSQL SELECT and Redis PING through readiness', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .set('X-Request-Id', requestId)
      .expect(200)
      .expect({
        data: {
          status: 'ok',
          service: 'kurvenfunk-api',
          checks: { postgres: 'ok', redis: 'ok' },
        },
        meta: { requestId },
      });
  });

  it('rejects an unauthenticated auth request using the real guard and error filter', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('X-Request-Id', requestId)
      .expect(401)
      .expect({ code: 'UNAUTHORIZED', message: 'Authorization header is missing', requestId });
  });

  it('rejects a malformed authorization header', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Basic invalid-test-header')
      .set('X-Request-Id', requestId)
      .expect(401)
      .expect({
        code: 'UNAUTHORIZED',
        message: 'Authorization header must use Bearer token',
        requestId,
      });
  });

  it('does not expose unprefixed health routes', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .set('X-Request-Id', requestId)
      .expect(404)
      .expect({ code: 'NOT_FOUND', message: 'Cannot GET /health' });
  });
});
