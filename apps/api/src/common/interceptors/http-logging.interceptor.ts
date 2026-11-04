import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { createLogger } from '@kurvenfunk/logger';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import type { RequestWithId } from '../types/request-with-id';

const logger = createLogger({
  service: 'api',
});

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const startedAt = process.hrtime.bigint();

    logger.info('Request started', {
      requestId: request.requestId,
      event: 'http.request.started',
      metadata: {
        method: request.method,
        path: request.path,
      },
    });

    return next.handle().pipe(
      finalize(() => {
        const durationNs = process.hrtime.bigint() - startedAt;
        const durationMs = Number(durationNs) / 1_000_000;

        logger.info('Request completed', {
          requestId: request.requestId,
          event: 'http.request.completed',
          metadata: {
            method: request.method,
            path: request.path,
            statusCode: response.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
          },
        });
      }),
    );
  }
}
