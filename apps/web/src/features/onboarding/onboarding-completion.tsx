'use client';

import type { FanPreferenceSelection } from '@kurvenfunk/validation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import { getPostLoginDestination } from '../admin/admin-access';
import { ClubSelection } from './club-selection';
import { NicknameSelection } from './nickname-selection';

interface OnboardingCompletionProps {
  apiUrl: string;
}

interface ApiErrorResponse {
  code?: string;
  message?: string | string[];
}

export function OnboardingCompletion({ apiUrl }: OnboardingCompletionProps) {
  const router = useRouter();
  const { token, refreshUser } = useAuth();

  const [nickname, setNickname] = useState<string>();
  const [selection, setSelection] = useState<FanPreferenceSelection>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function completeOnboarding() {
    if (!token || !nickname || !selection || submitting) {
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      const response = await fetch(`${apiUrl}/api/v1/onboarding/complete`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          ...selection,
        }),
      });

      const body = (await response.json().catch(() => undefined)) as
        | {
            data?: {
              onboardingCompleted: boolean;
            };
          }
        | ApiErrorResponse
        | undefined;

      if (!response.ok) {
        const apiError = body as ApiErrorResponse | undefined;

        if (apiError?.code === 'NICKNAME_TAKEN') {
          setError('Dieser Nickname ist bereits vergeben. Bitte wähle einen anderen.');
          return;
        }

        if (apiError?.code === 'INVALID_FAVORITE_CLUB') {
          setError('Der ausgewählte Verein ist nicht mehr verfügbar.');
          return;
        }

        setError('Das Profil konnte nicht gespeichert werden.');
        return;
      }

      const result = body as
        | {
            data?: {
              onboardingCompleted: boolean;
            };
          }
        | undefined;

      if (!result?.data?.onboardingCompleted) {
        setError('Das Profil konnte nicht gespeichert werden.');
        return;
      }

      const currentUser = await refreshUser();

      router.replace(getPostLoginDestination(currentUser));
      router.refresh();
    } catch {
      setError('Das Profil konnte nicht gespeichert werden.');
    } finally {
      setSubmitting(false);
    }
  }

  const canComplete = Boolean(token && nickname && selection) && !submitting;

  return (
    <>
      <NicknameSelection apiUrl={apiUrl} onNicknameChange={setNickname} />

      <ClubSelection apiUrl={apiUrl} onSelectionChange={setSelection} />

      <section>
        <h2>Profil abschließen</h2>

        <p>
          Speichere deinen Nickname und deine Vereinsauswahl, um Kurvenfunk zu nutzen.
        </p>

        <button type="button" disabled={!canComplete} onClick={() => void completeOnboarding()}>
          {submitting ? 'Wird gespeichert …' : 'Profil einrichten'}
        </button>

        {error ? <p role="alert">{error}</p> : null}
      </section>
    </>
  );
}
