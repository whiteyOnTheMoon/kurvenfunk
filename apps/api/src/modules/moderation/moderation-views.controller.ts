import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { ModerationViewsService } from './moderation-views.service';

/**
 * Restricted administrative views: never expose private moderation notes on
 * public endpoints or to users without user.warn.
 */
@Controller('moderation')
export class ModerationViewsController {
  constructor(private readonly views: ModerationViewsService) {}

  @Get('dashboard')
  @RequirePermissions(PERMISSIONS.USER_WARN)
  dashboard() {
    return this.views.dashboard();
  }

  @Get('users/:userId/history')
  @RequirePermissions(PERMISSIONS.USER_WARN)
  userHistory(
    @Param('userId', new ParseUUIDPipe({ version: '4' }))
    userId: string,
  ) {
    return this.views.userHistory(userId);
  }
}
