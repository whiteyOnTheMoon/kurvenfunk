'use client';

import type { FanPreferenceSelection } from '@kurvenfunk/validation';
import { useEffect, useMemo, useRef, useState } from 'react';

import styles from './club-combobox.module.css';

interface ClubComboboxProps {
  apiUrl: string;
  selection?: FanPreferenceSelection;
  disabled?: boolean;
  onSelectionChange: (selection: FanPreferenceSelection) => void;
}

interface Club {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  logo: {
    externalUrl: string | null;
    storageKey: string | null;
    altText: string | null;
  } | null;
}

interface ClubsResponse {
  data?: Club[];
}

/*
 * Temporary UI grouping.
 *
 * League membership is season-dependent and must not become a static Club
 * property. Once the sports import exposes current competition membership,
 * this mapping can be replaced by API data.
 */
const BUNDESLIGA_CLUB_SLUGS = new Set([
  'sc-austria-lustenau',
  'fk-austria-wien',
  'grazer-ak-1902',
  'tsv-hartberg',
  'lask',
  'sk-rapid-wien',
  'sv-ried',
  'scr-altach',
  'fc-red-bull-salzburg',
  'sk-sturm-graz',
  'wsg-tirol',
  'wolfsberger-ac',
]);

const SECOND_LEAGUE_CLUB_SLUGS = new Set([
  'fc-blau-weiss-linz',
  'skn-st-poelten',
  'admira-wacker',
  'fac-wien',
  'fc-liefering',
  'sku-amstetten',
  'first-vienna-fc-1894',
  'young-violets-austria-wien',
  'sv-austria-salzburg',
  'fc-hertha-wels',
  'sk-rapid-ii',
  'ksv-1919',
  'sk-sturm-graz-ii',
  'schwarz-weiss-bregenz',
  'ask-voitsberg',
  'fc-wacker-innsbruck',
]);

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('de-AT');
}

function matchesSearch(club: Club, search: string): boolean {
  const query = normalize(search.trim());

  if (!query) {
    return true;
  }

  return [club.name, club.shortName ?? '', club.slug].some((value) =>
    normalize(value).includes(query),
  );
}

function sortClubs(clubs: Club[]): Club[] {
  return [...clubs].sort((left, right) => left.name.localeCompare(right.name, 'de-AT'));
}

function getClubLogoUrl(club: Club): string {
  if (club.logo?.externalUrl) {
    return club.logo.externalUrl;
  }

  return `/clubs/${club.slug}.svg`;
}

function ClubLogo({ club }: { club: Club }) {
  return (
    <img
      className={styles.logo}
      src={getClubLogoUrl(club)}
      alt=""
      width={30}
      height={30}
      aria-hidden="true"
    />
  );
}

export function ClubCombobox({
  apiUrl,
  selection,
  disabled = false,
  onSelectionChange,
}: ClubComboboxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const selectedClub =
    selection?.fanPreference === 'CLUB'
      ? clubs.find((club) => club.id === selection.favoriteClubId)
      : undefined;

  const filteredGroups = useMemo(() => {
    const matching = clubs.filter((club) => matchesSearch(club, search));

    return {
      bundesliga: sortClubs(matching.filter((club) => BUNDESLIGA_CLUB_SLUGS.has(club.slug))),
      secondLeague: sortClubs(matching.filter((club) => SECOND_LEAGUE_CLUB_SLUGS.has(club.slug))),
    };
  }, [clubs, search]);

  const hasResults = filteredGroups.bundesliga.length > 0 || filteredGroups.secondLeague.length > 0;

  function choose(nextSelection: FanPreferenceSelection) {
    onSelectionChange(nextSelection);
    setOpen(false);
    setSearch('');
  }

  if (loading) {
    return <p>Vereine werden geladen …</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <span className={styles.label}>Auswahl</span>

      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.triggerSelection}>
          {selectedClub ? (
            <>
              <ClubLogo club={selectedClub} />
              <strong>{selectedClub.name}</strong>
            </>
          ) : (
            <>
              <span className={styles.neutralLogo} aria-hidden="true">
                KF
              </span>
              <strong>Neutral</strong>
            </>
          )}
        </span>

        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div className={styles.dropdown}>
          <div className={styles.searchWrapper}>
            <input
              ref={searchRef}
              type="search"
              className={styles.search}
              value={search}
              placeholder="Verein suchen …"
              aria-label="Verein suchen"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className={styles.options} role="listbox" aria-label="Lieblingsverein">
            {filteredGroups.bundesliga.length > 0 ? (
              <ClubGroup
                title="Bundesliga"
                clubs={filteredGroups.bundesliga}
                selectedClubId={selectedClub?.id}
                onChoose={(club) =>
                  choose({
                    fanPreference: 'CLUB',
                    favoriteClubId: club.id,
                  })
                }
              />
            ) : null}

            {filteredGroups.secondLeague.length > 0 ? (
              <ClubGroup
                title="2. Liga"
                clubs={filteredGroups.secondLeague}
                selectedClubId={selectedClub?.id}
                onChoose={(club) =>
                  choose({
                    fanPreference: 'CLUB',
                    favoriteClubId: club.id,
                  })
                }
              />
            ) : null}

            {!hasResults ? <p className={styles.empty}>Kein Verein gefunden.</p> : null}

            <div className={styles.neutralSection}>
              <button
                type="button"
                role="option"
                aria-selected={selection?.fanPreference === 'NEUTRAL'}
                className={styles.option}
                onClick={() =>
                  choose({
                    fanPreference: 'NEUTRAL',
                    favoriteClubId: null,
                  })
                }
              >
                <span className={styles.neutralLogo} aria-hidden="true">
                  KF
                </span>

                <span>Neutral</span>

                {selection?.fanPreference === 'NEUTRAL' ? (
                  <span className={styles.check} aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ClubGroup({
  title,
  clubs,
  selectedClubId,
  onChoose,
}: {
  title: string;
  clubs: Club[];
  selectedClubId?: string;
  onChoose: (club: Club) => void;
}) {
  return (
    <section className={styles.group}>
      <div className={styles.groupTitle}>{title}</div>

      {clubs.map((club) => (
        <button
          key={club.id}
          type="button"
          role="option"
          aria-selected={club.id === selectedClubId}
          className={styles.option}
          onClick={() => onChoose(club)}
        >
          <ClubLogo club={club} />

          <span className={styles.clubName}>{club.name}</span>

          {club.id === selectedClubId ? (
            <span className={styles.check} aria-hidden="true">
              ✓
            </span>
          ) : null}
        </button>
      ))}
    </section>
  );
}
