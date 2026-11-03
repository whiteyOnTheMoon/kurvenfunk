import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

import { DirectRedCardService } from './direct-red-card.service';
import { KeycloakSessionRevoker } from './keycloak-session-revoker';
import { DirectRedCardController, ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { ModerationViewsController } from './moderation-views.controller';
import { ModerationViewsService } from './moderation-views.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ModerationController, DirectRedCardController, ModerationViewsController],
  providers: [ModerationService, DirectRedCardService, KeycloakSessionRevoker, ModerationViewsService],
})
export class ModerationModule {}
