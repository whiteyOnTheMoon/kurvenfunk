'use client';

import Keycloak from 'keycloak-js';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

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

  useEffect(() => {
    let active = true;
    const client = getKeycloak(authUrl);

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
          setAuthenticated(false);
          setToken(undefined);
          setUser(undefined);
          setInitialized(true);
          return;
        }

        try {
          const currentUser = await fetchCurrentUser(apiUrl, client.token);

          if (!active) {
            return;
          }

          setAuthenticated(true);
          setToken(client.token);
          setUser(currentUser);
          setError(undefined);
        } catch (authError) {
          if (!active) {
            return;
          }

          const message = authError instanceof Error ? authError.message : 'AUTHENTICATION_FAILED';

          setAuthenticated(false);
          setToken(undefined);
          setUser(undefined);
          setError(message);
        } finally {
          if (active) {
            setInitialized(true);
          }
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setAuthenticated(false);
        setToken(undefined);
        setUser(undefined);
        setError('AUTHENTICATION_FAILED');
        setInitialized(true);
      });

    return () => {
      active = false;
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

    if (!client.token) {
      throw new Error('AUTHENTICATION_REQUIRED');
    }

    const currentUser = await fetchCurrentUser(apiUrl, client.token);

    setAuthenticated(true);
    setToken(client.token);
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
