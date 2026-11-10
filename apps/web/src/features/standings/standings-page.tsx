'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { EmptyState } from '@kurvenfunk/ui';

import { useAuth } from '../auth/auth-provider';
import { getClubLogoSrc } from '../clubs/club-media';
import { ListPageLoadingState } from '../loading/loading-states';
import styles from './standings-page.module.css';

interface StandingRow {
  id: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  deductionPoints: number;
  club: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  };
}

interface StandingsData {
  competition: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  };
  season: {
    id: string;
    name: string;
    slug: string;
  };
  stage: {
    id: string;
    name: string;
    slug: string;
  } | null;
  standings: StandingRow[];
}

interface ApiResponse {
  data?: StandingsData | null;
}

interface StandingsPageProps {
  apiUrl: string;
}

interface ClubListItem {
  id: string;
  slug: string;
}

interface ClubsResponse {
  data?: ClubListItem[];
}

function formatGoalDifference(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export function StandingsPage({ apiUrl }: StandingsPageProps) {
  const { initialized, user } = useAuth();
  const [data, setData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [favoriteClubSlug, setFavoriteClubSlug] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStandings() {
      setLoading(true);
      setInitialLoading(true);
      setLoadFailed(false);
      setData(null);

      try {
        // The public competition slug is shared with the canonical match schedule.
        const response = await fetch(`${apiUrl}/api/v1/standings/austrian-bundesliga`, {
          cache: 'no-store',
        });

        if (!response.ok) throw new Error('Standings request failed');

        const payload = (await response.json()) as ApiResponse;
        if (active) {
          // A missing season or zero rows must never resurrect a demo table.
          setData(payload.data ?? null);
        }
      } catch {
        if (active) setLoadFailed(true);
      } finally {
        if (active) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    }

    void loadStandings();

    return () => {
      active = false;
    };
  }, [apiUrl]);

  const favoriteClubId = initialized && user?.fanPreference === 'CLUB' ? user.favoriteClubId : null;

  useEffect(() => {
    let active = true;

    async function resolveFavoriteClub() {
      if (!favoriteClubId) {
        setFavoriteClubSlug(null);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/v1/clubs`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ClubsResponse;
        const favoriteClub = payload.data?.find((club) => club.id === favoriteClubId);

        if (active) {
          setFavoriteClubSlug(favoriteClub?.slug ?? null);
        }
      } catch {
        if (active) {
          setFavoriteClubSlug(null);
        }
      }
    }

    void resolveFavoriteClub();

    return () => {
      active = false;
    };
  }, [apiUrl, favoriteClubId]);

  if (initialLoading) {
    return <ListPageLoadingState rows={12} />;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            {data?.competition.shortName ?? data?.competition.name ?? 'Bundesliga'}
          </span>
          <h1>Tabelle</h1>
          <p>
            {data ? data.season.name : 'Aktuelle Saison'}
            {data?.stage ? ` · ${data.stage.name}` : ''}
          </p>
        </div>

        <div className={styles.headerMeta}>
          {data ? <span>{data.standings.length} Vereine</span> : null}
          {loading ? <span>Aktualisiere …</span> : null}
        </div>
      </header>

      <section className={styles.tableSection} aria-labelledby="standings-heading">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Aktueller Stand</span>
            <h2 id="standings-heading">{data?.competition.name ?? 'Österreichische Bundesliga'}</h2>
          </div>
        </div>

        {data && data.standings.length > 0 ? (
          <div className={styles.tableCard}>
            <div className={`${styles.tableGrid} ${styles.tableHeader}`} aria-hidden="true">
              <span>#</span>
              <span>Verein</span>
              <span className={styles.desktopColumn}>Sp.</span>
              <span className={styles.desktopColumn}>S</span>
              <span className={styles.desktopColumn}>U</span>
              <span className={styles.desktopColumn}>N</span>
              <span className={styles.desktopColumn}>Tore</span>
              <span>Diff.</span>
              <span>Pkt.</span>
            </div>

            <div className={styles.rows}>
              {data.standings.map((row) => {
                const logoSrc = getClubLogoSrc(apiUrl, { slug: row.club.slug, logo: null });
                const isFavorite =
                  favoriteClubId === row.club.id ||
                  (favoriteClubSlug !== null && favoriteClubSlug === row.club.slug);

                return (
                  <Link
                    href={`/vereine/${row.club.slug}`}
                    className={`${styles.tableGrid} ${styles.tableRow} ${
                      isFavorite ? styles.favoriteRow : ''
                    }`}
                    key={row.id}
                    aria-label={`${row.position}. ${row.club.name}, ${row.points} Punkte`}
                  >
                    <span className={styles.position}>{row.position}</span>

                    <span className={styles.club}>
                      {logoSrc ? (
                        <Image
                          src={logoSrc}
                          alt=""
                          width={34}
                          height={34}
                          className={styles.clubLogo}
                        />
                      ) : (
                        <span className={styles.clubLogoFallback} aria-hidden="true">
                          {row.club.name.trim().slice(0, 2).toLocaleUpperCase('de-AT')}
                        </span>
                      )}

                      <span className={styles.clubNames}>
                        <strong>{row.club.shortName ?? row.club.name}</strong>
                        <span>{row.club.name}</span>
                      </span>

                      {isFavorite ? (
                        <span className={styles.favoriteBadge}>Mein Verein</span>
                      ) : null}
                    </span>

                    <span className={styles.desktopColumn}>{row.played}</span>
                    <span className={styles.desktopColumn}>{row.won}</span>
                    <span className={styles.desktopColumn}>{row.drawn}</span>
                    <span className={styles.desktopColumn}>{row.lost}</span>
                    <span className={styles.desktopColumn}>
                      {row.goalsFor}:{row.goalsAgainst}
                    </span>
                    <span>{formatGoalDifference(row.goalDifference)}</span>
                    <strong className={styles.points}>{row.points}</strong>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            title={loadFailed ? 'Tabelle derzeit nicht verfügbar' : 'Noch keine aktuelle Tabelle'}
          >
            <p>
              {loadFailed
                ? 'Die aktuellen Tabellenstände konnten nicht geladen werden. Bitte später erneut versuchen.'
                : 'Für die aktuelle Bundesliga-Saison sind noch keine bestätigten Tabellenstände hinterlegt.'}
            </p>
          </EmptyState>
        )}
        {data && data.standings.length > 0 ? (
          <div className={styles.legend}>
            <span>
              <strong>Sp.</strong> Spiele
            </span>
            <span>
              <strong>S</strong> Siege
            </span>
            <span>
              <strong>U</strong> Unentschieden
            </span>
            <span>
              <strong>N</strong> Niederlagen
            </span>
          </div>
        ) : null}
      </section>
    </main>
  );
}
