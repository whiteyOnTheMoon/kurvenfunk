import { Controller, Post, Req } from '@nestjs/common';
import type { RequestWithId } from '../../common/types/request-with-id';
import { RequestIdTestService } from './request-id-test.service';

@Controller('request-id-test')
export class RequestIdTestController {
  constructor(private readonly requestIdTestService: RequestIdTestService) {}

  @Post('queue')
  enqueue(@Req() request: RequestWithId) {
    return this.requestIdTestService.enqueue(request.requestId);
  }
}
