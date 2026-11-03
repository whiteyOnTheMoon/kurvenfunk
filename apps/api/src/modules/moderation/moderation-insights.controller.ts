import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { ModerationInsightsService } from './moderation-insights.service';

/** Tasks 187–188: read-only moderator-only aggregation and history endpoints. */
@Controller('moderation')
export class ModerationInsightsController {
  constructor(private readonly insights: ModerationInsightsService) {}

  @Get('dashboard')
  @RequirePermissions(PERMISSIONS.USER_WARN)
  dashboard() {
    return this.insights.dashboard();
  }

  @Get('users/:userId/history')
  @RequirePermissions(PERMISSIONS.USER_WARN)
  history(
    @Param('userId', new ParseUUIDPipe({ version: '4' }))
    userId: string,
  ) {
    return this.insights.userHistory(userId);
  }
}
