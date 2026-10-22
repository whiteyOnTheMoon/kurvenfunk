import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { RequestWithId } from '../types/request-with-id';

export const REQUEST_ID_HEADER = 'x-request-id';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getRequestId(request: RequestWithId): string {
  const header = request.headers[REQUEST_ID_HEADER];

  if (typeof header === 'string' && UUID_V4_PATTERN.test(header)) {
    return header;
  }

  return randomUUID();
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const requestId = getRequestId(request);

    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);

    next();
  }
}
