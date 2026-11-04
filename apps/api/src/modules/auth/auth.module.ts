import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { AccountStatusGuard } from './account-status.guard';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { OnboardingCompletedGuard } from './onboarding-completed.guard';
import { KeycloakJwtService } from './keycloak-jwt.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [KeycloakJwtService, AccountStatusGuard, AuthGuard, OnboardingCompletedGuard],
  exports: [KeycloakJwtService, AccountStatusGuard, AuthGuard, OnboardingCompletedGuard],
})
export class AuthModule {}
