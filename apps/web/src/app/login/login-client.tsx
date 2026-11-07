'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../../features/auth/auth-provider';
import { getPostLoginDestination } from '../../features/admin/admin-access';

export function LoginClient() {
  const { authenticated, error, initialized, login, loginWithGoogle, sessionRecovering, user } =
    useAuth();
  const router = useRouter();
  const destination = authenticated && user ? getPostLoginDestination(user) : undefined;

  useEffect(() => {
    if (initialized && destination) {
      router.replace(destination);
    }
  }, [initialized, destination, router]);

  if (!initialized) {
    return <p>Checking login status…</p>;
  }

  if (sessionRecovering) {
    return <p role="status">Deine Sitzung wird erneut geprüft …</p>;
  }

  if (error === 'ACCOUNT_BANNED') {
    return (
      <main>
        <h1>Konto gesperrt</h1>
        <p>
          Dein Kurvenfunk-Konto ist gesperrt. Du kannst dich nicht an Community-Aktionen beteiligen.
        </p>
        <p>Öffentliche Nachrichten, Ergebnisse und Tabellen bleiben zugänglich.</p>
        <p>
          <Link href="/">Zur Startseite</Link>
        </p>
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
        <h1>Anmeldung erfolgreich</h1>
        <p role="status">Du wirst zu deinem Bereich weitergeleitet …</p>
        <p>
          <Link href={destination ?? '/'}>Jetzt weiter</Link>
        </p>
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
