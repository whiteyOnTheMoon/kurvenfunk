'use client';

import Link from 'next/link';

import { useAuth } from '../../features/auth/auth-provider';

export function LoginClient() {
  const { authenticated, error, initialized, login, user } = useAuth();

  if (!initialized) {
    return <p>Checking login status…</p>;
  }

  if (error === 'ACCOUNT_BANNED') {
    return (
      <main>
        <h1>Account blocked</h1>
        <p>Your Kurvenfunk account is banned.</p>
      </main>
    );
  }

  if (error === 'EMAIL_NOT_VERIFIED') {
    return (
      <main>
        <h1>Email not verified</h1>
        <p>Please verify your email address before signing in.</p>
      </main>
    );
  }

  if (authenticated && user) {
    return (
      <main>
        <h1>Login successful</h1>
        <p>Status: {user.status}</p>
        <Link href="/">Continue to Kurvenfunk</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Login</h1>
      <p>Sign in with your email address and password.</p>

      <button type="button" onClick={() => void login()}>
        Login with email
      </button>
    </main>
  );
}
