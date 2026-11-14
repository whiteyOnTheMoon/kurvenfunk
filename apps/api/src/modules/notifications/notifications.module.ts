import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { NotificationInboxService } from './notification-inbox.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationInboxService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
