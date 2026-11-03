'use client';

import Link from 'next/link';
import { useAuth } from '../../features/auth/auth-provider';

export function LoginClient() {
  const { authenticated, error, initialized, login, loginWithGoogle, logout, user } = useAuth();

  if (!initialized) {
    return <p>Checking login status…</p>;
  }

  if (error === 'ACCOUNT_BANNED') {
    return (
      <main>
        <h1>Konto gesperrt</h1>
        <p>Dieses Kurvenfunk-Konto ist gesperrt. Community-Aktionen sind nicht möglich.</p>
        <p>Du kannst öffentliche Inhalte weiterhin ohne Anmeldung lesen.</p>
      </main>
    );
  }

  if (error === 'EMAIL_NOT_VERIFIED') {
    return (
      <main>
        <h1>E-Mail-Adresse nicht bestätigt</h1>
        <p>Bitte bestätige deine E-Mail-Adresse, bevor du dich anmeldest.</p>
      </main>
    );
  }

  if (authenticated && user) {
    return (
      <main>
        <h1>Anmeldung erfolgreich</h1>
        <p>Status: {user.status}</p>
        {user.status === 'LIMITED' ? (
          <p>
            Dein Konto ist vorübergehend eingeschränkt. Lesen und Abstimmen sind weiterhin
            möglich; neue Kommentare und Forenbeiträge sind derzeit nicht erlaubt.
          </p>
        ) : null}
        <p>
          <Link href="/">Continue to Kurvenfunk</Link>
        </p>
        <button type="button" onClick={() => void logout()}>
          Logout
        </button>
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
      <button type="button" onClick={() => void loginWithGoogle()}>
        Continue with Google
      </button>
    </main>
  );
}
