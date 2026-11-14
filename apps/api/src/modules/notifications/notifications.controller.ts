import { Controller, Get, Header, Query, Req, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { NotificationInboxService } from './notification-inbox.service';

/** The authenticated subject is the ONLY recipient identity accepted here. */
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly inbox: NotificationInboxService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  list(
    @Req() request: AuthenticatedRequest,
    @Query('cursor') cursor?: unknown,
    @Query('limit') limit?: unknown,
    @Query('filter') filter?: unknown,
  ) {
    return this.inbox.listForUser(request.user!.kurvenfunkUserId, { cursor, limit, filter });
  }

  @Get('unread-count')
  @Header('Cache-Control', 'private, no-store')
  unreadCount(@Req() request: AuthenticatedRequest) {
    return this.inbox.countUnreadForUser(request.user!.kurvenfunkUserId);
  }
}
