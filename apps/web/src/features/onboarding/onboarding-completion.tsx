'use client';

import type { FanPreferenceSelection } from '@kurvenfunk/validation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '../auth/auth-provider';
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
          setError('This nickname is already taken. Please choose another one.');
          return;
        }

        if (apiError?.code === 'INVALID_FAVORITE_CLUB') {
          setError('The selected club is no longer available.');
          return;
        }

        setError('Your onboarding could not be completed.');
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
        setError('Your onboarding could not be completed.');
        return;
      }

      await refreshUser();

      router.replace('/');
      router.refresh();
    } catch {
      setError('Your onboarding could not be completed.');
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
        <h2>Complete setup</h2>

        <p>
          Save your nickname and choose your favourite club or Neutral before completing your
          account.
        </p>

        <button type="button" disabled={!canComplete} onClick={() => void completeOnboarding()}>
          {submitting ? 'Completing…' : 'Complete onboarding'}
        </button>

        {error ? <p role="alert">{error}</p> : null}
      </section>
    </>
  );
}
