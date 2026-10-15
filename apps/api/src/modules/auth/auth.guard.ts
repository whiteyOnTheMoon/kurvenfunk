import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { UsersService } from '../users/users.service';
import { AccountStatusGuard } from './account-status.guard';
import type { AuthenticatedRequest } from './auth.types';
import { KeycloakJwtService } from './keycloak-jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly keycloakJwtService: KeycloakJwtService,
    private readonly usersService: UsersService,
    private readonly accountStatusGuard: AccountStatusGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    const payload = await this.keycloakJwtService.verifyAccessToken(token);

    if (!payload.sub) {
      throw new UnauthorizedException('Token subject is missing');
    }

    if (payload.email_verified !== true) {
      throw new UnauthorizedException('Email address is not verified');
    }

    const user = await this.usersService.syncKeycloakUser(payload.sub);

    request.user = {
      ...payload,
      sub: payload.sub,
      kurvenfunkUserId: user.id,
      kurvenfunkUserStatus: user.status,
      kurvenfunkFanPreference: user.fanPreference,
      kurvenfunkFavoriteClubId: user.favoriteClubId,
      kurvenfunkOnboardingCompleted: user.onboardingCompleted,
      kurvenfunkRoles: user.roles,
    };

    return this.accountStatusGuard.canActivate(context);
  }

  private extractBearerToken(request: Request): string {
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const match = authorization.match(/^Bearer\s+(\S+)$/i);

    if (!match?.[1]) {
      throw new UnauthorizedException('Authorization header must use Bearer token');
    }

    return match[1];
  }
}
