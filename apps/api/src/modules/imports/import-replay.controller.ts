import { Controller, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { ImportReplayService } from './import-replay.service';

@Controller('imports')
export class ImportReplayController {
  constructor(private readonly replayService: ImportReplayService) {}

  @Post('jobs/:id/retry')
  @RequirePermissions(PERMISSIONS.IMPORT_REPLAY)
  replayDeadLetter(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.replayService.replayDeadLetter(id, request.user!.kurvenfunkUserId);
  }
}
