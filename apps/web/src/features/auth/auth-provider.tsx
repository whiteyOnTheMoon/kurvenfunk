'use client';

import Keycloak from 'keycloak-js';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ensureFreshToken } from './token-refresh';
import { isTemporaryIdentityFailure } from './auth-failure';
import type { AdminRole } from '../admin/admin-access';

type UserStatus = 'ACTIVE' | 'LIMITED' | 'BANNED';

interface AuthProviderProps {
  apiUrl: string;
  authUrl: string;
  children: ReactNode;
}

interface CurrentUser {
  id: string;
  status: UserStatus;
  roles: AdminRole[];
  subject: string;
  fanPreference: 'CLUB' | 'NEUTRAL' | 'UNSET';
  favoriteClubId: string | null;
  onboardingCompleted: boolean;
}

interface AuthContextValue {
  authenticated: boolean;
  initialized: boolean;
  sessionRecovering: boolean;
  login: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginForAppeals: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<CurrentUser>;
  token?: string;
  /** Narrow appeal-only bearer retained for an account rejected as BANNED. */
  appealToken?: string;
  user?: CurrentUser;
  error?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let keycloak: Keycloak | undefined;
let initialization: Promise<boolean> | undefined;

function getKeycloak(authUrl: string): Keycloak {
  if (!keycloak) {
    keycloak = new Keycloak({
      url: authUrl,
      realm: 'kurvenfunk',
      clientId: 'kurvenfunk-web',
    });
  }

  return keycloak;
}

async function fetchCurrentUser(apiUrl: string, token: string): Promise<CurrentUser> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('AUTH_TEMPORARY_UNAVAILABLE');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as
      | {
          code?: string;
          message?: string;
        }
      | undefined;

    if (response.status === 403 && body?.code === 'ACCOUNT_BANNED') {
      throw new Error('ACCOUNT_BANNED');
    }

    if (response.status === 401 && body?.message === 'Email address is not verified') {
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    if (isTemporaryIdentityFailure(response.status)) {
      throw new Error('AUTH_TEMPORARY_UNAVAILABLE');
    }

    throw new Error('AUTHENTICATION_FAILED');
  }

  const body = (await response.json()) as {
    data?: CurrentUser;
  };

  if (!body.data) {
    throw new Error('INVALID_AUTH_RESPONSE');
  }

  return body.data;
}

export function AuthProvider({ apiUrl, authUrl, children }: AuthProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [sessionRecovering, setSessionRecovering] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string>();
  const [appealToken, setAppealToken] = useState<string>();
  const [user, setUser] = useState<CurrentUser>();
  const [error, setError] = useState<string>();
  const currentUserRef = useRef<CurrentUser | undefined>(undefined);
  const logoutRequestedRef = useRef(false);

  useEffect(() => {
    let active = true;
    let renewal: Promise<void> | undefined;
    const client = getKeycloak(authUrl);

    const clearSession = (reason?: string) => {
      if (!active) {
        return;
      }

      currentUserRef.current = undefined;
      setAuthenticated(false);
      setToken(undefined);
      setAppealToken(undefined);
      setUser(undefined);
      setSessionRecovering(false);
      setError(reason);
    };

    const renew = (): Promise<void> => {
      if (renewal) {
        return renewal;
      }

      if (logoutRequestedRef.current || !client.authenticated || !client.token) {
        return Promise.resolve();
      }

      const pending = (async () => {
        try {
          const freshToken = await ensureFreshToken(client);

          if (!active || logoutRequestedRef.current || !client.authenticated) {
            return;
          }

          // After a transient refresh failure we must restore the user as well
          // as the token; authenticated without a user breaks onboarding.
          // Re-read the server-authoritative roles/status on renewal, so
          // revoked admin access disappears without requiring a manual reload.
          const currentUser = await fetchCurrentUser(apiUrl, freshToken);

          if (!active || logoutRequestedRef.current || !client.authenticated) {
            return;
          }

          currentUserRef.current = currentUser;
          setUser(currentUser);
          setToken(freshToken);
          setAppealToken(undefined);
          setAuthenticated(true);
          setSessionRecovering(false);
          setError(undefined);
        } catch (authError) {
          if (!active || logoutRequestedRef.current) {
            return;
          }

          const code = authError instanceof Error ? authError.message : undefined;

          // A network/5xx or temporary Keycloak refresh problem must not
          // redirect staff to login. Hide privileged content until a fresh
          // token AND authoritative application roles are available again.
          if (
            client.authenticated &&
            client.token &&
            code !== 'ACCOUNT_BANNED' &&
            code !== 'EMAIL_NOT_VERIFIED' &&
            code !== 'AUTHENTICATION_FAILED' &&
            code !== 'AUTHENTICATION_REQUIRED'
          ) {
            currentUserRef.current = undefined;
            setAuthenticated(false);
            setToken(undefined);
            setUser(undefined);
            setSessionRecovering(true);
            setError('AUTH_TEMPORARY_UNAVAILABLE');
            return;
          }

          clearSession(
            code === 'ACCOUNT_BANNED' || code === 'EMAIL_NOT_VERIFIED'
              ? code
              : 'AUTHENTICATION_FAILED',
          );
          // Keep ONLY a narrow appeals bearer when the server specifically
          // confirms ACCOUNT_BANNED. Never give it to ordinary token consumers,
          // the admin UI, or unverified/temporarily failed identities.
          if (code === 'ACCOUNT_BANNED' && client.authenticated && client.token) {
            setAppealToken(client.token);
          }
        }
      })();

      renewal = pending.finally(() => {
        renewal = undefined;
      });
      return renewal;
    };

    client.onTokenExpired = () => {
      void renew();
    };

    // Background tabs can suspend timers. Refresh immediately on return, before
    // the next scheduled 30-second check.
    const onResume = () => {
      if (document.visibilityState === 'visible') {
        void renew();
      }
    };

    window.addEventListener('focus', onResume);
    document.addEventListener('visibilitychange', onResume);

    const refreshInterval = window.setInterval(() => {
      void renew();
    }, 30_000);

    initialization ??= client.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    void initialization
      .then(async (isAuthenticated) => {
        if (!active) {
          return;
        }

        if (!isAuthenticated || !client.token) {
          clearSession();
          setInitialized(true);
          return;
        }

        await renew();

        if (active) {
          setInitialized(true);
        }
      })
      .catch(() => {
        clearSession('AUTHENTICATION_FAILED');
        if (active) {
          setInitialized(true);
        }
      });

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', onResume);
      document.removeEventListener('visibilitychange', onResume);
      client.onTokenExpired = undefined;
    };
  }, [apiUrl, authUrl]);

  const login = useCallback(async () => {
    const client = getKeycloak(authUrl);

    await client.login({
      redirectUri: `${window.location.origin}/login`,
    });
  }, [authUrl]);

  const loginWithGoogle = useCallback(async () => {
    const client = getKeycloak(authUrl);

    await client.login({
      redirectUri: `${window.location.origin}/login`,
      idpHint: 'google',
    });
  }, [authUrl]);

  const loginForAppeals = useCallback(async () => {
    const client = getKeycloak(authUrl);
    await client.login({ redirectUri: `${window.location.origin}/appeals` });
  }, [authUrl]);

  const logout = useCallback(async () => {
    const client = getKeycloak(authUrl);

    logoutRequestedRef.current = true;
    currentUserRef.current = undefined;
    setAuthenticated(false);
    setToken(undefined);
    setAppealToken(undefined);
    setUser(undefined);
    setSessionRecovering(false);
    setError(undefined);

    await client.logout({
      redirectUri: `${window.location.origin}/`,
    });
  }, [authUrl]);

  const refreshUser = useCallback(async () => {
    const client = getKeycloak(authUrl);
    if (logoutRequestedRef.current || !client.authenticated) {
      throw new Error('AUTHENTICATION_REQUIRED');
    }

    const freshToken = await ensureFreshToken(client);
    const currentUser = await fetchCurrentUser(apiUrl, freshToken);
    if (logoutRequestedRef.current || !client.authenticated) {
      throw new Error('AUTHENTICATION_REQUIRED');
    }

    currentUserRef.current = currentUser;
    setAuthenticated(true);
    setToken(freshToken);
    setAppealToken(undefined);
    setUser(currentUser);
    setSessionRecovering(false);
    setError(undefined);
    return currentUser;
  }, [apiUrl, authUrl]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticated,
      initialized,
      sessionRecovering,
      login,
      loginWithGoogle,
      loginForAppeals,
      logout,
      refreshUser,
      token,
      appealToken,
      user,
      error,
    }),
    [
      authenticated,
      initialized,
      sessionRecovering,
      login,
      loginWithGoogle,
      loginForAppeals,
      logout,
      refreshUser,
      token,
      appealToken,
      user,
      error,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
