import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

import { DirectRedCardService } from './direct-red-card.service';
import { KeycloakSessionRevoker } from './keycloak-session-revoker';
import { DirectRedCardController, ModerationController } from './moderation.controller';
import { ModerationInsightsController } from './moderation-insights.controller';
import { ModerationInsightsService } from './moderation-insights.service';
import { ModerationService } from './moderation.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ModerationController, DirectRedCardController, ModerationInsightsController],
  providers: [ModerationService, DirectRedCardService, ModerationInsightsService, KeycloakSessionRevoker],
})
export class ModerationModule {}
