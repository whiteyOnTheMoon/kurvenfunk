import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

import { DirectRedCardService } from './direct-red-card.service';
import { ModerationDashboardController } from './moderation-dashboard.controller';
import { ModerationDashboardService } from './moderation-dashboard.service';
import { KeycloakSessionRevoker } from './keycloak-session-revoker';
import { DirectRedCardController, ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ModerationController, DirectRedCardController, ModerationDashboardController],
  providers: [
    ModerationService,
    DirectRedCardService,
    KeycloakSessionRevoker,
    ModerationDashboardService,
  ],
})
export class ModerationModule {}
