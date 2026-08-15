'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '../auth/auth-provider';

interface NicknameSelectionProps {
  apiUrl: string;
  onNicknameChange?: (nickname: string | undefined) => void;
}

interface NicknameAvailabilityResponse {
  data?: {
    available: boolean;
    nickname: string;
  };
}

type AvailabilityState = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid' | 'error';

const NICKNAME_MIN_LENGTH = 3;
const NICKNAME_MAX_LENGTH = 24;
const NICKNAME_PATTERN = /^[A-Za-z0-9_-]+$/;
const RESERVED_NICKNAMES = ['admin', 'moderator', 'kurvenfunk', 'support', 'system'];

function getLocalNicknameError(nickname: string): string | undefined {
  const trimmedNickname = nickname.trim();

  if (trimmedNickname.length < NICKNAME_MIN_LENGTH) {
    return `Nickname must contain at least ${NICKNAME_MIN_LENGTH} characters.`;
  }

  if (trimmedNickname.length > NICKNAME_MAX_LENGTH) {
    return `Nickname must contain at most ${NICKNAME_MAX_LENGTH} characters.`;
  }

  if (!NICKNAME_PATTERN.test(trimmedNickname)) {
    return 'Only letters, numbers, underscores and hyphens are allowed.';
  }

  if (RESERVED_NICKNAMES.includes(trimmedNickname.toLowerCase())) {
    return 'This nickname is reserved.';
  }

  return undefined;
}

export function NicknameSelection({ apiUrl, onNicknameChange }: NicknameSelectionProps) {
  const { token } = useAuth();

  const [nickname, setNickname] = useState('');
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>('idle');
  const [availabilityMessage, setAvailabilityMessage] = useState<string>();

  useEffect(() => {
    const trimmedNickname = nickname.trim();
    const localError = getLocalNicknameError(trimmedNickname);

    if (!trimmedNickname || localError || !token) {
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/onboarding/nickname/availability?nickname=${encodeURIComponent(
            trimmedNickname,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        const body = (await response.json().catch(() => undefined)) as
          NicknameAvailabilityResponse | undefined;

        if (!response.ok) {
          if (controller.signal.aborted) {
            return;
          }

          setAvailabilityState('error');
          setAvailabilityMessage('Availability could not be checked.');
          return;
        }

        if (!body?.data || body.data.nickname !== trimmedNickname) {
          setAvailabilityState('error');
          setAvailabilityMessage('Availability could not be checked.');
          return;
        }

        if (body.data.available) {
          setAvailabilityState('available');
          setAvailabilityMessage('This nickname is available.');
          onNicknameChange?.(body.data.nickname);
        } else {
          setAvailabilityState('unavailable');
          setAvailabilityMessage('This nickname is already taken.');
        }
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return;
        }

        setAvailabilityState('error');
        setAvailabilityMessage('Availability could not be checked.');
      }
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [apiUrl, nickname, onNicknameChange, token]);

  return (
    <section>
      <h2>Choose your nickname</h2>

      <p>
        Your nickname must contain 3–24 characters. Letters, numbers, underscores and hyphens are
        allowed.
      </p>

      <div>
        <label htmlFor="nickname">Nickname</label>

        <input
          id="nickname"
          name="nickname"
          type="text"
          minLength={NICKNAME_MIN_LENGTH}
          maxLength={NICKNAME_MAX_LENGTH}
          pattern="[A-Za-z0-9_-]+"
          autoComplete="nickname"
          aria-describedby="nickname-availability"
          aria-invalid={availabilityState === 'invalid' || availabilityState === 'unavailable'}
          value={nickname}
          onChange={(event) => {
            const nextNickname = event.target.value;
            const trimmedNickname = nextNickname.trim();
            const localError = trimmedNickname ? getLocalNicknameError(trimmedNickname) : undefined;

            setNickname(nextNickname);
            onNicknameChange?.(undefined);

            if (!trimmedNickname) {
              setAvailabilityState('idle');
              setAvailabilityMessage(undefined);
            } else if (localError) {
              setAvailabilityState('invalid');
              setAvailabilityMessage(localError);
            } else if (token) {
              setAvailabilityState('checking');
              setAvailabilityMessage('Checking availability…');
            } else {
              setAvailabilityState('idle');
              setAvailabilityMessage(undefined);
            }
          }}
          required
        />

        <p
          id="nickname-availability"
          aria-live="polite"
          role={
            availabilityState === 'invalid' ||
            availabilityState === 'unavailable' ||
            availabilityState === 'error'
              ? 'alert'
              : undefined
          }
        >
          {availabilityMessage}
        </p>
      </div>
    </section>
  );
}
