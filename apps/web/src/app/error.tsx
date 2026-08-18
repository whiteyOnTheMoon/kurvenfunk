'use client';

import Link from 'next/link';

import { ErrorState } from '../features/errors/error-state';

interface ErrorPageProps {
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <ErrorState
      status={500}
      title="Etwas ist schiefgelaufen"
      description="Beim Laden dieser Seite ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut."
      action={
        <>
          <button type="button" className="kf-button kf-button--emphasis" onClick={reset}>
            Erneut versuchen
          </button>
          <Link href="/" className="kf-button kf-button--secondary">
            Zur Startseite
          </Link>
        </>
      }
    />
  );
}
