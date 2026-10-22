import { Controller, NotFoundException, Post, Req } from '@nestjs/common';
import type { RequestWithId } from '../../common/types/request-with-id';
import { RequestIdTestService } from './request-id-test.service';

@Controller('request-id-test')
export class RequestIdTestController {
  constructor(private readonly requestIdTestService: RequestIdTestService) {}

  @Post('queue')
  enqueue(@Req() request: RequestWithId) {
    // Use the socket peer, never a client-controlled forwarded IP. Even opted-in
    // development instances must not expose this diagnostic through a proxy.
    const localPeers = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    const proxyHeaders = [
      'forwarded',
      'x-forwarded-for',
      'x-forwarded-host',
      'x-forwarded-proto',
      'x-real-ip',
      'via',
    ];

    if (
      !localPeers.includes(request.socket.remoteAddress ?? '') ||
      proxyHeaders.some((header) => request.headers[header] !== undefined)
    ) {
      throw new NotFoundException();
    }

    return this.requestIdTestService.enqueue(request.requestId);
  }
}
