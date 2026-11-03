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
        <p>Dein Kurvenfunk-Konto ist gesperrt. Du kannst dich nicht an Community-Aktionen beteiligen.</p>
        <p>Öffentliche Nachrichten, Ergebnisse und Tabellen bleiben zugänglich.</p>
        <p><Link href="/">Zur Startseite</Link></p>
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
        <h1>Login erfolgreich</h1>
        <p>Kontostatus: {user.status === 'LIMITED' ? 'Vorübergehend eingeschränkt' : 'Aktiv'}</p>
        {user.status === 'LIMITED' && (
          <p>Du kannst weiterhin lesen und abstimmen, aber derzeit keine Kommentare oder Beiträge schreiben.</p>
        )}
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
