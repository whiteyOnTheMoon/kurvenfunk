import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

import { KeycloakSessionRevoker } from './keycloak-session-revoker';
import { DirectRedCardController, ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ModerationController, DirectRedCardController],
  providers: [ModerationService, KeycloakSessionRevoker],
})
export class ModerationModule {}
