import { type CallHandler, type ExecutionContext } from '@nestjs/common';
import { createLogger } from '@kurvenfunk/logger';
import { of } from 'rxjs';

import { HttpLoggingInterceptor } from './http-logging.interceptor';

jest.mock('@kurvenfunk/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
  })),
}));

describe('HttpLoggingInterceptor', () => {
  it('logs only the pathname and never sensitive query parameters', () => {
    const logger = jest.mocked(createLogger).mock.results[0]?.value as unknown as {
      info: jest.Mock;
    };

    logger.info.mockClear();

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          requestId: 'test-request',
          method: 'GET',
          path: '/api/v1/articles',
          originalUrl: '/api/v1/articles?access_token=secret-value&code=private-code',
        }),
        getResponse: () => ({
          statusCode: 200,
        }),
      }),
    } as unknown as ExecutionContext;

    const next = {
      handle: () => of('response'),
    } as CallHandler;

    new HttpLoggingInterceptor().intercept(context, next).subscribe();

    expect(logger.info).toHaveBeenNthCalledWith(1, 'Request started', {
      requestId: 'test-request',
      event: 'http.request.started',
      metadata: {
        method: 'GET',
        path: '/api/v1/articles',
      },
    });

    expect(logger.info).toHaveBeenNthCalledWith(
      2,
      'Request completed',
      expect.objectContaining({
        requestId: 'test-request',
        event: 'http.request.completed',
        metadata: expect.objectContaining({
          method: 'GET',
          path: '/api/v1/articles',
          statusCode: 200,
        }),
      }),
    );

    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('secret-value');
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('private-code');
  });
});
