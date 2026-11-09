import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { KeycloakJwtService } from '../auth/keycloak-jwt.service';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { UsersService } from '../users/users.service';

/**
 * Exception to the global account-status policy ONLY for filing/listing one's
 * own appeals. It still requires a verified Keycloak JWT and email.
 * Never use this guard on general community or administrative routes.
 */
@Injectable()
export class AppealIdentityGuard implements CanActivate {
  constructor(
    private readonly jwt: KeycloakJwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match?.[1]) {
      throw new UnauthorizedException({
        code: 'APPEAL_AUTH_REQUIRED',
        message: 'A valid Bearer token is required for appeals.',
      });
    }

    const payload = await this.jwt.verifyAccessToken(match[1]);
    if (!payload.sub || payload.email_verified !== true) {
      throw new UnauthorizedException({
        code: 'APPEAL_AUTH_INVALID',
        message: 'A verified account is required for appeals.',
      });
    }

    const user = await this.users.syncKeycloakUser(payload.sub);
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

    // BANNED accounts are intentionally allowed ONLY on appeal submission and
    // the caller's appeal list. They remain forbidden by regular AuthGuard.
    return true;
  }
}
