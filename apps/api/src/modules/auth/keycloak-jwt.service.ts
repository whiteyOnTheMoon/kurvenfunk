import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

@Injectable()
export class KeycloakJwtService {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly configService: ConfigService) {
    this.issuer = this.configService.getOrThrow<string>('KEYCLOAK_ISSUER');
    this.audience = this.configService.getOrThrow<string>('KEYCLOAK_AUDIENCE');

    const jwksUrl = this.configService.getOrThrow<string>('KEYCLOAK_JWKS_URL');

    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['RS256'],
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Token subject is missing');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
