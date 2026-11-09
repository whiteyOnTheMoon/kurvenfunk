import { Controller, Get, Header, Param, ParseUUIDPipe } from '@nestjs/common';

import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';

import { UserModerationHistoryService } from './user-moderation-history.service';

/** Private, read-only staff view; never cache internal notes in shared proxies. */
@Controller('moderation/users')
export class UserModerationHistoryController {
  constructor(private readonly histories: UserModerationHistoryService) {}

  @Get(':userId/history')
  @Header('Cache-Control', 'private, no-store')
  @RequirePermissions(PERMISSIONS.USER_WARN)
  getUserHistory(@Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string) {
    return this.histories.history(userId);
  }
}
