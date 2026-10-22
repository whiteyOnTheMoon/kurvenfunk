import 'reflect-metadata';

// The shared package is ESM; this focused Jest suite only needs its queue name.
jest.mock('@kurvenfunk/types', () => ({ QUEUE_NAMES: { TEST: 'test' } }));

import { getQueueToken } from '@nestjs/bullmq';
import { type INestApplication, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import type { App } from 'supertest/types';

import { RequestIdMiddleware } from '../../common/middleware/request-id.middleware';
import type { RequestWithId } from '../../common/types/request-with-id';
import { RequestIdTestController } from './request-id-test.controller';
import { RequestIdTestModule } from './request-id-test.module';
import { RequestIdTestService } from './request-id-test.service';

describe('Local request-ID diagnostic', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalEnabled = process.env.REQUEST_ID_TEST_ENABLED;
  const requestId = '8c64e467-9db5-4269-a73b-b6d60ab37037';
  const add = jest.fn().mockResolvedValue({ id: 'diagnostic-job' });
  let app: INestApplication<App> | undefined;

  async function start(envFilePath?: string): Promise<INestApplication<App>> {
    const fixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: envFilePath === undefined,
          ...(envFilePath ? { envFilePath } : {}),
        }),
        RequestIdTestModule.register(),
      ],
    })
      .overrideProvider(getQueueToken('test'))
      .useValue({ add })
      .compile();

    const application = fixture.createNestApplication<INestApplication<App>>();
    app = application;
    application.setGlobalPrefix('api/v1');
    const middleware = new RequestIdMiddleware();
    application.use(middleware.use.bind(middleware));
    await application.init();
    return application;
  }

  beforeEach(() => {
    add.mockClear();
    delete process.env.NODE_ENV;
    delete process.env.REQUEST_ID_TEST_ENABLED;
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalEnabled === undefined) delete process.env.REQUEST_ID_TEST_ENABLED;
    else process.env.REQUEST_ID_TEST_ENABLED = originalEnabled;
  });

  it.each([
    ['production', undefined],
    ['production', 'true'],
    ['test', 'true'],
    [undefined, 'true'],
    [undefined, undefined],
    ['development', undefined],
    ['development', 'false'],
    ['development', 'TRUE'],
    ['development', '1'],
    ['development', ''],
  ])('does not register the endpoint for NODE_ENV=%s, opt-in=%s', async (nodeEnv, enabled) => {
    if (nodeEnv !== undefined) process.env.NODE_ENV = nodeEnv;
    if (enabled !== undefined) process.env.REQUEST_ID_TEST_ENABLED = enabled;
    const application = await start();

    await request(application.getHttpServer())
      .post('/api/v1/request-id-test/queue')
      .set('X-Request-Id', requestId)
      .expect(404);

    expect(add).not.toHaveBeenCalled();
    expect(() => application.get(RequestIdTestController)).toThrow();
  });

  it('queues a direct opted-in development request with the original request ID', async () => {
    process.env.NODE_ENV = 'development';
    process.env.REQUEST_ID_TEST_ENABLED = 'true';
    const application = await start();

    await request(application.getHttpServer())
      .post('/api/v1/request-id-test/queue')
      .set('X-Request-Id', requestId)
      .expect(201)
      .expect('X-Request-Id', requestId)
      .expect({ jobId: 'diagnostic-job', requestId });

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('request-id-test', {
      context: { requestId },
      data: { message: 'Request ID propagation test' },
    });
  });

  it('generates a valid request ID when none is supplied', async () => {
    process.env.NODE_ENV = 'development';
    process.env.REQUEST_ID_TEST_ENABLED = 'true';
    const application = await start();
    const response = await request(application.getHttpServer())
      .post('/api/v1/request-id-test/queue')
      .expect(201);

    const generatedId: unknown = response.headers['x-request-id'];
    expect(generatedId).toEqual(
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      ),
    );
    expect(add).toHaveBeenCalledWith('request-id-test', {
      context: { requestId: generatedId },
      data: { message: 'Request ID propagation test' },
    });
  });

  it.each([
    'Forwarded',
    'X-Forwarded-For',
    'X-Forwarded-Host',
    'X-Forwarded-Proto',
    'X-Real-IP',
    'Via',
  ])('rejects proxy-forwarded development requests (%s) without adding a job', async (header) => {
    process.env.NODE_ENV = 'development';
    process.env.REQUEST_ID_TEST_ENABLED = 'true';
    const application = await start();

    await request(application.getHttpServer())
      .post('/api/v1/request-id-test/queue')
      .set(header, '127.0.0.1')
      .expect(404);

    expect(add).not.toHaveBeenCalled();
  });

  it.each(['192.0.2.1', '::ffff:192.0.2.1', undefined])(
    'rejects a non-loopback or unknown socket peer (%s), regardless of forwarded IP',
    (remoteAddress) => {
      const controller = new RequestIdTestController(
        new RequestIdTestService({ add } as unknown as Queue),
      );
      const remoteRequest = {
        socket: { remoteAddress },
        headers: {},
        requestId,
      } as RequestWithId;

      expect(() => controller.enqueue(remoteRequest)).toThrow(NotFoundException);
      expect(add).not.toHaveBeenCalled();
    },
  );

  it('evaluates opt-in after loading the environment file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'request-id-test-'));
    try {
      const envFile = join(directory, '.env');
      await writeFile(envFile, 'NODE_ENV=development\nREQUEST_ID_TEST_ENABLED=true\n');
      const application = await start(envFile);

      await request(application.getHttpServer()).post('/api/v1/request-id-test/queue').expect(201);
      expect(add).toHaveBeenCalledTimes(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
