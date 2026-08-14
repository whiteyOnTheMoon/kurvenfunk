import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { KeycloakJwtService } from './keycloak-jwt.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [KeycloakJwtService, AuthGuard],
  exports: [KeycloakJwtService, AuthGuard],
})
export class AuthModule {}
