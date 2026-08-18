'use client';

import type { FanPreferenceSelection } from '@kurvenfunk/validation';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/auth-provider';
import { ClubCombobox } from './club-combobox';

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
  const { token, refreshUser } = useAuth();
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
          setError('Dein aktueller Lieblingsverein konnte nicht geladen werden.');
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

        setError('Dein aktueller Lieblingsverein konnte nicht geladen werden.');
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
          setError('Der ausgewählte Verein ist nicht mehr verfügbar.');
          return;
        }

        setError('Dein Lieblingsverein konnte nicht gespeichert werden.');
        return;
      }

      const result = body as FanPreferenceResponse | undefined;

      if (!result?.data) {
        setError('Dein Lieblingsverein konnte nicht gespeichert werden.');
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
      await refreshUser();
      setSuccess('Dein Lieblingsverein wurde gespeichert.');
    } catch {
      setError('Dein Lieblingsverein konnte nicht gespeichert werden.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return <p role="alert">Du musst angemeldet sein, um deinen Lieblingsverein zu ändern.</p>;
  }

  if (loading) {
    return <p>Lieblingsverein wird geladen …</p>;
  }

  return (
    <>
      <ClubCombobox
        apiUrl={apiUrl}
        selection={selection ?? currentSelection}
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
          {submitting ? 'Wird gespeichert …' : 'Auswahl speichern'}
        </button>

        {error ? <p role="alert">{error}</p> : null}
        {success ? <p role="status">{success}</p> : null}
      </section>
    </>
  );
}
