'use client';

import { type FormEvent, useState } from 'react';

import { useAuth } from '../auth/auth-provider';

interface NicknameSelectionProps {
  apiUrl: string;
}

interface ApiErrorResponse {
  code?: string;
  message?: string | string[];
}

export function NicknameSelection({ apiUrl }: NicknameSelectionProps) {
  const { token } = useAuth();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string>();
  const [savedNickname, setSavedNickname] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || submitting) {
      return;
    }

    setSubmitting(true);
    setError(undefined);
    setSavedNickname(undefined);

    try {
      const response = await fetch(`${apiUrl}/api/v1/onboarding/nickname`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
        }),
      });

      const body = (await response.json().catch(() => undefined)) as
        | {
            data?: {
              id: string;
              nickname: string;
            };
          }
        | ApiErrorResponse
        | undefined;

      if (!response.ok) {
        const apiError = body as ApiErrorResponse | undefined;

        if (apiError?.code === 'NICKNAME_TAKEN') {
          setError('This nickname is already taken.');
          return;
        }

        if (apiError?.code === 'VALIDATION_ERROR') {
          const message = apiError.message;

          setError(
            Array.isArray(message)
              ? message.join(' ')
              : message ?? 'Please choose a valid nickname.',
          );
          return;
        }

        setError('The nickname could not be saved.');
        return;
      }

      const result = body as
        | {
            data?: {
              id: string;
              nickname: string;
            };
          }
        | undefined;

      if (!result?.data?.nickname) {
        setError('The nickname could not be saved.');
        return;
      }

      setNickname(result.data.nickname);
      setSavedNickname(result.data.nickname);
    } catch {
      setError('The nickname could not be saved.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Choose your nickname</h2>
      <p>
        Your nickname must contain 3–24 characters. Letters, numbers,
        underscores and hyphens are allowed.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="nickname">Nickname</label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          minLength={3}
          maxLength={24}
          pattern="[A-Za-z0-9_-]+"
          autoComplete="nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          disabled={submitting}
          required
        />

        <button type="submit" disabled={!token || submitting}>
          {submitting ? 'Saving…' : 'Save nickname'}
        </button>
      </form>

      {error ? <p role="alert">{error}</p> : null}

      {savedNickname ? (
        <p>Your nickname is now {savedNickname}.</p>
      ) : null}
    </section>
  );
}
