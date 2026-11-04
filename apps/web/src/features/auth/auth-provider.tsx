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

type UserStatus = 'ACTIVE' | 'LIMITED' | 'BANNED';

interface AuthProviderProps {
  apiUrl: string;
  authUrl: string;
  children: ReactNode;
}

interface CurrentUser {
  id: string;
  status: UserStatus;
  subject: string;
  fanPreference: 'CLUB' | 'NEUTRAL' | 'UNSET';
  favoriteClubId: string | null;
  onboardingCompleted: boolean;
}

interface AuthContextValue {
  authenticated: boolean;
  initialized: boolean;
  login: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  token?: string;
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
  const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string>();
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
      setUser(undefined);
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
          const currentUser =
            currentUserRef.current ?? (await fetchCurrentUser(apiUrl, freshToken));

          if (!active || logoutRequestedRef.current || !client.authenticated) {
            return;
          }

          currentUserRef.current = currentUser;
          setUser(currentUser);
          setToken(freshToken);
          setAuthenticated(true);
          setError(undefined);
        } catch (authError) {
          if (!active || logoutRequestedRef.current) {
            return;
          }

          const code = authError instanceof Error ? authError.message : undefined;
          clearSession(
            code === 'ACCOUNT_BANNED' || code === 'EMAIL_NOT_VERIFIED'
              ? code
              : 'AUTHENTICATION_FAILED',
          );
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

  const logout = useCallback(async () => {
    const client = getKeycloak(authUrl);

    logoutRequestedRef.current = true;
    currentUserRef.current = undefined;
    setAuthenticated(false);
    setToken(undefined);
    setUser(undefined);
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
    setUser(currentUser);
    setError(undefined);
  }, [apiUrl, authUrl]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticated,
      initialized,
      login,
      loginWithGoogle,
      logout,
      refreshUser,
      token,
      user,
      error,
    }),
    [authenticated, initialized, login, loginWithGoogle, logout, refreshUser, token, user, error],
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
