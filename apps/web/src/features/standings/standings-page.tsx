'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import { ListPageLoadingState } from '../loading/loading-states';
import { clubs } from '../personalization/startpage-mock-data';
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

const standingsMockClubs = {
  gak: {
    name: 'Grazer AK 1902',
    shortName: 'GAK',
    slug: 'grazer-ak-1902',
  },
  ried: {
    name: 'SV Ried',
    shortName: 'Ried',
    slug: 'sv-ried',
  },
  wsg: {
    name: 'WSG Tirol',
    shortName: 'WSG Tirol',
    slug: 'wsg-tirol',
  },
  lustenau: {
    name: 'SC Austria Lustenau',
    shortName: 'Lustenau',
    slug: 'sc-austria-lustenau',
  },
};

const mockRows: StandingRow[] = [
  {
    id: 'mock-sturm',
    position: 1,
    played: 3,
    won: 3,
    drawn: 0,
    lost: 0,
    goalsFor: 8,
    goalsAgainst: 2,
    goalDifference: 6,
    points: 9,
    deductionPoints: 0,
    club: { id: 'mock-sturm', ...clubs.sturm },
  },
  {
    id: 'mock-rapid',
    position: 2,
    played: 3,
    won: 2,
    drawn: 1,
    lost: 0,
    goalsFor: 7,
    goalsAgainst: 3,
    goalDifference: 4,
    points: 7,
    deductionPoints: 0,
    club: { id: 'mock-rapid', ...clubs.rapid },
  },
  {
    id: 'mock-salzburg',
    position: 3,
    played: 3,
    won: 2,
    drawn: 0,
    lost: 1,
    goalsFor: 7,
    goalsAgainst: 4,
    goalDifference: 3,
    points: 6,
    deductionPoints: 0,
    club: { id: 'mock-salzburg', ...clubs.salzburg },
  },
  {
    id: 'mock-austria',
    position: 4,
    played: 3,
    won: 2,
    drawn: 0,
    lost: 1,
    goalsFor: 5,
    goalsAgainst: 3,
    goalDifference: 2,
    points: 6,
    deductionPoints: 0,
    club: { id: 'mock-austria', ...clubs.austria },
  },
  {
    id: 'mock-lask',
    position: 5,
    played: 3,
    won: 1,
    drawn: 2,
    lost: 0,
    goalsFor: 5,
    goalsAgainst: 4,
    goalDifference: 1,
    points: 5,
    deductionPoints: 0,
    club: { id: 'mock-lask', ...clubs.lask },
  },
  {
    id: 'mock-wac',
    position: 6,
    played: 3,
    won: 1,
    drawn: 1,
    lost: 1,
    goalsFor: 4,
    goalsAgainst: 4,
    goalDifference: 0,
    points: 4,
    deductionPoints: 0,
    club: { id: 'mock-wac', ...clubs.wac },
  },
  {
    id: 'mock-hartberg',
    position: 7,
    played: 3,
    won: 1,
    drawn: 1,
    lost: 1,
    goalsFor: 4,
    goalsAgainst: 5,
    goalDifference: -1,
    points: 4,
    deductionPoints: 0,
    club: { id: 'mock-hartberg', ...clubs.hartberg },
  },
  {
    id: 'mock-ried',
    position: 8,
    played: 3,
    won: 1,
    drawn: 0,
    lost: 2,
    goalsFor: 3,
    goalsAgainst: 5,
    goalDifference: -2,
    points: 3,
    deductionPoints: 0,
    club: { id: 'mock-ried', ...standingsMockClubs.ried },
  },
  {
    id: 'mock-altach',
    position: 9,
    played: 3,
    won: 1,
    drawn: 0,
    lost: 2,
    goalsFor: 3,
    goalsAgainst: 6,
    goalDifference: -3,
    points: 3,
    deductionPoints: 0,
    club: { id: 'mock-altach', ...clubs.altach },
  },
  {
    id: 'mock-gak',
    position: 10,
    played: 3,
    won: 0,
    drawn: 2,
    lost: 1,
    goalsFor: 2,
    goalsAgainst: 4,
    goalDifference: -2,
    points: 2,
    deductionPoints: 0,
    club: { id: 'mock-gak', ...standingsMockClubs.gak },
  },
  {
    id: 'mock-wsg',
    position: 11,
    played: 3,
    won: 0,
    drawn: 1,
    lost: 2,
    goalsFor: 2,
    goalsAgainst: 6,
    goalDifference: -4,
    points: 1,
    deductionPoints: 0,
    club: { id: 'mock-wsg', ...standingsMockClubs.wsg },
  },
  {
    id: 'mock-lustenau',
    position: 12,
    played: 3,
    won: 0,
    drawn: 0,
    lost: 3,
    goalsFor: 2,
    goalsAgainst: 8,
    goalDifference: -6,
    points: 0,
    deductionPoints: 0,
    club: { id: 'mock-lustenau', ...standingsMockClubs.lustenau },
  },
];

const mockData: StandingsData = {
  competition: {
    id: 'mock-bundesliga',
    name: 'Österreichische Bundesliga',
    shortName: 'Bundesliga',
    slug: 'bundesliga',
  },
  season: {
    id: 'mock-season',
    name: '2026/27',
    slug: '2026-27',
  },
  stage: {
    id: 'mock-stage',
    name: 'Grunddurchgang',
    slug: 'grunddurchgang',
  },
  standings: mockRows,
};

function formatGoalDifference(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export function StandingsPage({ apiUrl }: StandingsPageProps) {
  const { initialized, user } = useAuth();
  const [data, setData] = useState<StandingsData>(mockData);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(true);
  const [favoriteClubSlug, setFavoriteClubSlug] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStandings() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/standings/bundesliga`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ApiResponse;

        if (active && payload.data && payload.data.standings.length > 0) {
          setData(payload.data);
          setUsingMockData(false);
        }
      } catch {
        // Task 123 remains previewable until the sports-data pipeline is available.
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
            {data.competition.shortName ?? data.competition.name}
          </span>
          <h1>Tabelle</h1>
          <p>
            {data.season.name}
            {data.stage ? ` · ${data.stage.name}` : ''}
          </p>
        </div>

        <div className={styles.headerMeta}>
          <span>{data.standings.length} Vereine</span>
          {loading ? <span>Aktualisiere …</span> : null}
        </div>
      </header>

      <section className={styles.tableSection} aria-labelledby="standings-heading">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Aktueller Stand</span>
            <h2 id="standings-heading">{data.competition.name}</h2>
          </div>

          {usingMockData ? <span className={styles.previewBadge}>Vorschau</span> : null}
        </div>

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
                    <Image
                      src={`/clubs/${row.club.slug}.svg`}
                      alt=""
                      width={34}
                      height={34}
                      className={styles.clubLogo}
                    />

                    <span className={styles.clubNames}>
                      <strong>{row.club.shortName ?? row.club.name}</strong>
                      <span>{row.club.name}</span>
                    </span>

                    {isFavorite ? <span className={styles.favoriteBadge}>Mein Verein</span> : null}
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
      </section>
    </main>
  );
}
