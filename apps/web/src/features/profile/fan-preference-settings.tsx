'use client';

import type { FanPreferenceSelection } from '@kurvenfunk/validation';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/auth-provider';
import { ClubSelection } from '../onboarding/club-selection';

interface FanPreferenceSettingsProps {
  apiUrl: string;
}

interface FanPreferenceResponse {
  data?: {
    fanPreference: 'CLUB' | 'NEUTRAL' | 'UNSET';
    favoriteClubId: string | null;
  };
}

interface ApiErrorResponse {
  code?: string;
  message?: string | string[];
}

export function FanPreferenceSettings({ apiUrl }: FanPreferenceSettingsProps) {
  const { token } = useAuth();
  const [currentSelection, setCurrentSelection] = useState<FanPreferenceSelection>();
  const [selection, setSelection] = useState<FanPreferenceSelection>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    async function loadPreference() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/profiles/me/fan-preference`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const body = (await response.json().catch(() => undefined)) as
          FanPreferenceResponse | undefined;

        if (!response.ok || !body?.data) {
          setError('Your current club preference could not be loaded.');
          return;
        }

        const preference = body.data;

        if (preference.fanPreference === 'CLUB' && preference.favoriteClubId) {
          const initialSelection: FanPreferenceSelection = {
            fanPreference: 'CLUB',
            favoriteClubId: preference.favoriteClubId,
          };
          setCurrentSelection(initialSelection);
          setSelection(initialSelection);
          return;
        }

        if (preference.fanPreference === 'NEUTRAL') {
          const initialSelection: FanPreferenceSelection = {
            fanPreference: 'NEUTRAL',
            favoriteClubId: null,
          };
          setCurrentSelection(initialSelection);
          setSelection(initialSelection);
        }
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return;
        }

        setError('Your current club preference could not be loaded.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadPreference();

    return () => controller.abort();
  }, [apiUrl, token]);

  async function savePreference() {
    if (!token || !selection || submitting) {
      return;
    }

    setSubmitting(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const response = await fetch(`${apiUrl}/api/v1/profiles/me/fan-preference`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selection),
      });

      const body = (await response.json().catch(() => undefined)) as
        FanPreferenceResponse | ApiErrorResponse | undefined;

      if (!response.ok) {
        const apiError = body as ApiErrorResponse | undefined;

        if (apiError?.code === 'INVALID_FAVORITE_CLUB') {
          setError('The selected club is no longer available.');
          return;
        }

        setError('Your club preference could not be saved.');
        return;
      }

      const result = body as FanPreferenceResponse | undefined;

      if (!result?.data) {
        setError('Your club preference could not be saved.');
        return;
      }

      const savedSelection: FanPreferenceSelection =
        result.data.fanPreference === 'CLUB' && result.data.favoriteClubId
          ? {
              fanPreference: 'CLUB',
              favoriteClubId: result.data.favoriteClubId,
            }
          : {
              fanPreference: 'NEUTRAL',
              favoriteClubId: null,
            };

      setCurrentSelection(savedSelection);
      setSelection(savedSelection);
      setSuccess('Your club preference has been saved.');
    } catch {
      setError('Your club preference could not be saved.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return <p role="alert">You must be logged in to change your club preference.</p>;
  }

  if (loading) {
    return <p>Loading your club preference…</p>;
  }

  return (
    <>
      <ClubSelection
        apiUrl={apiUrl}
        initialSelection={currentSelection}
        inputName="profile-club-preference"
        onSelectionChange={(nextSelection) => {
          setSelection(nextSelection);
          setSuccess(undefined);
        }}
      />

      <section>
        <button
          type="button"
          disabled={!selection || submitting}
          onClick={() => void savePreference()}
        >
          {submitting ? 'Saving…' : 'Save club preference'}
        </button>

        {error ? <p role="alert">{error}</p> : null}
        {success ? <p role="status">{success}</p> : null}
      </section>
    </>
  );
}
