'use client';

import type { FanPreferenceSelection } from '@kurvenfunk/validation';
import { useEffect, useState } from 'react';

interface ClubSelectionProps {
  apiUrl: string;
  initialSelection?: FanPreferenceSelection;
  inputName?: string;
  onSelectionChange?: (selection: FanPreferenceSelection) => void;
}

interface Club {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  color1Hex: string;
  color1Rgba: string;
  color2Hex: string | null;
  color2Rgba: string | null;
  color3Hex: string | null;
  color3Rgba: string | null;
  accentColorHex: string | null;
  accentColorRgba: string | null;
  logo: {
    externalUrl: string | null;
    storageKey: string | null;
    altText: string | null;
    mimeType: string;
    source: string | null;
    sourceUrl: string | null;
    copyright: string | null;
  } | null;
}

interface ClubsResponse {
  data?: Club[];
}

type Selection = FanPreferenceSelection | undefined;

function getClubInitials(club: Club): string {
  return (club.shortName ?? club.name)
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function ClubSelection({
  apiUrl,
  initialSelection,
  inputName = 'club-preference',
  onSelectionChange,
}: ClubSelectionProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();

    async function loadClubs() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/clubs`, {
          signal: controller.signal,
        });

        const body = (await response.json().catch(() => undefined)) as ClubsResponse | undefined;

        if (!response.ok || !Array.isArray(body?.data)) {
          setError('The clubs could not be loaded.');
          return;
        }

        setClubs(body.data);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return;
        }

        setError('The clubs could not be loaded.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadClubs();

    return () => controller.abort();
  }, [apiUrl]);

  if (loading) {
    return (
      <section>
        <h2>Choose your club</h2>
        <p>Loading clubs…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Choose your club</h2>
        <p role="alert">{error}</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Choose your club</h2>
      <p>Select your favourite club or choose Neutral.</p>

      <fieldset>
        <legend>Club preference</legend>

        {clubs.map((club) => {
          const checked =
            selection?.fanPreference === 'CLUB' && selection.favoriteClubId === club.id;

          return (
            <label key={club.id}>
              <input
                type="radio"
                name={inputName}
                value={club.id}
                checked={checked}
                onChange={() => {
                  const nextSelection: FanPreferenceSelection = {
                    fanPreference: 'CLUB',
                    favoriteClubId: club.id,
                  };

                  setSelection(nextSelection);
                  onSelectionChange?.(nextSelection);
                }}
              />

              {club.logo?.externalUrl ? (
                <img
                  src={club.logo.externalUrl}
                  alt={club.logo.altText ?? `${club.name} logo`}
                  width={64}
                  height={64}
                />
              ) : (
                <span aria-hidden="true">{getClubInitials(club)}</span>
              )}

              <strong>{club.name}</strong>
            </label>
          );
        })}

        <label>
          <input
            type="radio"
            name={inputName}
            value="neutral"
            checked={selection?.fanPreference === 'NEUTRAL'}
            onChange={() => {
              const nextSelection: FanPreferenceSelection = {
                fanPreference: 'NEUTRAL',
                favoriteClubId: null,
              };

              setSelection(nextSelection);
              onSelectionChange?.(nextSelection);
            }}
          />

          <span aria-hidden="true">KF</span>
          <strong>Neutral</strong>
        </label>
      </fieldset>

      {selection?.fanPreference === 'CLUB' ? (
        <p aria-live="polite">
          Selected: {clubs.find((club) => club.id === selection.favoriteClubId)?.name}
        </p>
      ) : null}

      {selection?.fanPreference === 'NEUTRAL' ? <p aria-live="polite">Selected: Neutral</p> : null}
    </section>
  );
}
