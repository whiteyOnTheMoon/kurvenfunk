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
  const [search, setSearch] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadClubs() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/clubs`, {
          signal: controller.signal,
        });

        const body = (await response.json().catch(() => undefined)) as ClubsResponse | undefined;

        if (!response.ok || !Array.isArray(body?.data)) {
          setError('Die Vereine konnten nicht geladen werden.');
          return;
        }

        setClubs(body.data);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return;
        }

        setError('Die Vereine konnten nicht geladen werden.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadClubs();

    return () => controller.abort();
  }, [apiUrl]);

  const visibleClubs = clubs.filter((club) =>
    `${club.name} ${club.shortName ?? ''}`
      .toLocaleLowerCase('de-AT')
      .includes(search.trim().toLocaleLowerCase('de-AT')),
  );

  if (loading) {
    return (
      <section>
        <h2>Dein Lieblingsverein</h2>
        <p>Vereine werden geladen …</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Dein Lieblingsverein</h2>
        <p role="alert">{error}</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Dein Lieblingsverein</h2>
      <p>Wähle einen Lieblingsverein oder bleibe neutral.</p>

      <label htmlFor="onboarding-club-search">Verein suchen</label>
      <input
        id="onboarding-club-search"
        type="search"
        placeholder="Vereinsname eingeben …"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <fieldset>
        <legend>Lieblingsverein</legend>

        {visibleClubs.map((club) => {
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

      {visibleClubs.length === 0 ? (
        <p role="status">Kein Verein gefunden. Du kannst Neutral auswählen.</p>
      ) : null}

      {selection?.fanPreference === 'CLUB' ? (
        <p aria-live="polite">
          Ausgewählt: {clubs.find((club) => club.id === selection.favoriteClubId)?.name}
        </p>
      ) : null}

      {selection?.fanPreference === 'NEUTRAL' ? <p aria-live="polite">Ausgewählt: Neutral</p> : null}
    </section>
  );
}
