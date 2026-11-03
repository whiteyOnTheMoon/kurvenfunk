import { Injectable, Logger } from '@nestjs/common';

interface AccessTokenPayload {
  access_token?: unknown;
}

/**
 * Dedicated Keycloak service account: realm-management/manage-users only.
 * No administrator username/password is exposed to the API container.
 */
@Injectable()
export class KeycloakSessionRevoker {
  private readonly logger = new Logger(KeycloakSessionRevoker.name);

  get isConfigured(): boolean {
    return Boolean(
      process.env.KEYCLOAK_REVOKER_CLIENT_ID && process.env.KEYCLOAK_REVOKER_CLIENT_SECRET,
    );
  }

  async revokeSessions(keycloakSubject: string): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('Keycloak session revocation is not configured');
      return false;
    }

    const baseUrl = process.env.KEYCLOAK_ADMIN_INTERNAL_URL ?? 'http://keycloak:8080';
    const realm = encodeURIComponent(process.env.KEYCLOAK_REVOKER_REALM ?? 'kurvenfunk');
    const clientId = process.env.KEYCLOAK_REVOKER_CLIENT_ID!;
    const clientSecret = process.env.KEYCLOAK_REVOKER_CLIENT_SECRET!;

    try {
      const tokenResponse = await fetch(
        new URL(`/realms/${realm}/protocol/openid-connect/token`, baseUrl),
        {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
          }),
          signal: AbortSignal.timeout(5000),
        },
      );

      if (!tokenResponse.ok) {
        this.logger.error(`Keycloak token request failed (HTTP ${tokenResponse.status})`);
        return false;
      }

      const token: AccessTokenPayload = (await tokenResponse.json()) as AccessTokenPayload;

      if (typeof token.access_token !== 'string' || !token.access_token) {
        this.logger.error('Keycloak token response did not contain an access token');
        return false;
      }

      const logoutResponse = await fetch(
        new URL(
          `/admin/realms/${realm}/users/${encodeURIComponent(keycloakSubject)}/logout`,
          baseUrl,
        ),
        {
          method: 'POST',
          headers: { authorization: `Bearer ${token.access_token}` },
          signal: AbortSignal.timeout(5000),
        },
      );

      if (logoutResponse.status !== 204) {
        this.logger.error(`Keycloak session revocation failed (HTTP ${logoutResponse.status})`);
        return false;
      }

      return true;
    } catch {
      this.logger.error('Keycloak session revocation could not reach the identity provider');
      return false;
    }
  }
}
