import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { KeycloakJwtService } from './keycloak-jwt.service';

@Module({
  providers: [KeycloakJwtService, AuthGuard],
  exports: [KeycloakJwtService, AuthGuard],
})
export class AuthModule {}
