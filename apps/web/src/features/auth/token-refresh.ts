/**
 * De-duplicate Keycloak refresh requests and never return the access token
 * from before the refresh completes.
 */
export interface RefreshableTokenClient {
  readonly token?: string;
  updateToken(minValidity: number): Promise<boolean>;
}

const inFlight = new WeakMap<RefreshableTokenClient, Promise<string>>();

export function ensureFreshToken(
  client: RefreshableTokenClient,
  minValidity = 60,
): Promise<string> {
  const existing = inFlight.get(client);

  if (existing) {
    return existing;
  }

  const pending = client
    .updateToken(minValidity)
    .then(() => {
      if (!client.token) {
        throw new Error('AUTHENTICATION_REQUIRED');
      }

      return client.token;
    })
    .finally(() => {
      inFlight.delete(client);
    });

  inFlight.set(client, pending);
  return pending;
}
