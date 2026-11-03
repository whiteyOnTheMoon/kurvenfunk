import { KeycloakSessionRevoker } from './keycloak-session-revoker';

const SUBJECT = '33333333-3333-4333-8333-333333333333';

describe('KeycloakSessionRevoker', () => {
  const originalEnv = { ...process.env };
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    process.env.KEYCLOAK_ADMIN_INTERNAL_URL = 'http://keycloak:8080';
    process.env.KEYCLOAK_REVOKER_REALM = 'kurvenfunk';
    process.env.KEYCLOAK_REVOKER_CLIENT_ID = 'kurvenfunk-session-revoker';
    process.env.KEYCLOAK_REVOKER_CLIENT_SECRET = 'test-secret';
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
    process.env = { ...originalEnv };
  });

  it('fails closed when the dedicated service account is not configured', async () => {
    delete process.env.KEYCLOAK_REVOKER_CLIENT_SECRET;

    const revoker = new KeycloakSessionRevoker();

    expect(revoker.isConfigured).toBe(false);
    await expect(revoker.revokeSessions(SUBJECT)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('revokes only the selected user sessions with a service-account token', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'temporary-token' })))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const revoker = new KeycloakSessionRevoker();

    await expect(revoker.revokeSessions(SUBJECT)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [tokenUrl, tokenOptions] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBeInstanceOf(URL);
    if (!(tokenUrl instanceof URL)) {
      throw new Error('Expected URL');
    }
    expect(tokenUrl.href).toBe(
      'http://keycloak:8080/realms/kurvenfunk/protocol/openid-connect/token',
    );
    expect(tokenOptions?.method).toBe('POST');
    const tokenBody = tokenOptions?.body;
    expect(tokenBody).toBeInstanceOf(URLSearchParams);
    if (!(tokenBody instanceof URLSearchParams)) {
      throw new Error('Expected URLSearchParams');
    }
    expect(tokenBody.get('grant_type')).toBe('client_credentials');

    const [logoutUrl, logoutOptions] = fetchMock.mock.calls[1];
    expect(logoutUrl).toBeInstanceOf(URL);
    if (!(logoutUrl instanceof URL)) {
      throw new Error('Expected URL');
    }
    expect(logoutUrl.href).toBe(
      `http://keycloak:8080/admin/realms/kurvenfunk/users/${SUBJECT}/logout`,
    );
    expect(logoutOptions?.method).toBe('POST');
    expect(logoutOptions?.headers).toEqual({ authorization: 'Bearer temporary-token' });
  });

  it('retains pending status when Keycloak refuses the operation', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'token' })))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));

    await expect(new KeycloakSessionRevoker().revokeSessions(SUBJECT)).resolves.toBe(false);
  });

  it('retains pending status on failed token acquisition', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(new KeycloakSessionRevoker().revokeSessions(SUBJECT)).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retains pending status when Keycloak cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Connection failed'));

    await expect(new KeycloakSessionRevoker().revokeSessions(SUBJECT)).resolves.toBe(false);
  });
});
