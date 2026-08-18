'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import { ListPageLoadingState } from '../loading/loading-states';
import styles from './match-schedule-page.module.css';

type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED' | 'ABANDONED';

interface MatchClub {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
}

interface MatchScheduleItem {
  id: string;
  kickoff: string;
  matchday: number | null;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeClub: MatchClub;
  awayClub: MatchClub;
}

interface MatchScheduleData {
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
  matches: MatchScheduleItem[];
}

interface ApiResponse {
  data?: MatchScheduleData | null;
}

interface ClubListItem {
  id: string;
  slug: string;
}

interface ClubsResponse {
  data?: ClubListItem[];
}

interface MatchSchedulePageProps {
  apiUrl: string;
}

const competitions = [
  {
    slug: 'austrian-bundesliga',
    label: 'Bundesliga',
  },
  {
    slug: 'austrian-2-liga',
    label: '2. Liga',
  },
  {
    slug: 'oefb-cup',
    label: 'ÖFB Cup',
  },
] as const;

const mockClubs = {
  rapid: {
    id: 'mock-rapid',
    name: 'SK Rapid Wien',
    shortName: 'Rapid Wien',
    slug: 'sk-rapid-wien',
  },
  austria: {
    id: 'mock-austria',
    name: 'FK Austria Wien',
    shortName: 'Austria Wien',
    slug: 'fk-austria-wien',
  },
  sturm: {
    id: 'mock-sturm',
    name: 'SK Sturm Graz',
    shortName: 'Sturm Graz',
    slug: 'sk-sturm-graz',
  },
  salzburg: {
    id: 'mock-salzburg',
    name: 'FC Red Bull Salzburg',
    shortName: 'Salzburg',
    slug: 'fc-red-bull-salzburg',
  },
  lask: {
    id: 'mock-lask',
    name: 'LASK',
    shortName: 'LASK',
    slug: 'lask',
  },
  gak: {
    id: 'mock-gak',
    name: 'Grazer AK 1902',
    shortName: 'GAK',
    slug: 'grazer-ak-1902',
  },
};

const mockData: MatchScheduleData = {
  competition: {
    id: 'mock-bundesliga',
    name: 'Österreichische Bundesliga',
    shortName: 'Bundesliga',
    slug: 'austrian-bundesliga',
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
  matches: [
    {
      id: 'mock-match-1',
      kickoff: '2026-07-31T17:30:00.000Z',
      matchday: 1,
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 0,
      homeClub: mockClubs.lask,
      awayClub: mockClubs.gak,
    },
    {
      id: 'mock-match-2',
      kickoff: '2026-08-23T15:00:00.000Z',
      matchday: 4,
      status: 'SCHEDULED',
      homeScore: null,
      awayScore: null,
      homeClub: mockClubs.rapid,
      awayClub: mockClubs.austria,
    },
    {
      id: 'mock-match-3',
      kickoff: '2026-09-12T15:00:00.000Z',
      matchday: 6,
      status: 'SCHEDULED',
      homeScore: null,
      awayScore: null,
      homeClub: mockClubs.sturm,
      awayClub: mockClubs.salzburg,
    },
  ],
};

const statusLabels: Record<MatchStatus, string> = {
  SCHEDULED: 'Geplant',
  LIVE: 'Live',
  FINISHED: 'Beendet',
  POSTPONED: 'Verschoben',
  CANCELLED: 'Abgesagt',
  ABANDONED: 'Abgebrochen',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Vienna',
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('de-AT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Vienna',
  }).format(new Date(value));
}

function getDefaultMatchday(data: MatchScheduleData) {
  const matchdays = Array.from(
    new Set(
      data.matches
        .map((match) => match.matchday)
        .filter((matchday): matchday is number => matchday !== null),
    ),
  ).sort((a, b) => a - b);

  const upcomingMatch = data.matches.find(
    (match) =>
      match.matchday !== null &&
      match.status !== 'FINISHED' &&
      match.status !== 'CANCELLED' &&
      match.status !== 'ABANDONED',
  );

  return upcomingMatch?.matchday ?? matchdays[matchdays.length - 1] ?? null;
}

export function MatchSchedulePage({ apiUrl }: MatchSchedulePageProps) {
  const { initialized, user } = useAuth();

  const [selectedCompetition, setSelectedCompetition] =
    useState<(typeof competitions)[number]['slug']>('austrian-bundesliga');

  const [data, setData] = useState<MatchScheduleData>(mockData);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(true);
  const [favoriteClubSlug, setFavoriteClubSlug] = useState<string | null>(null);
  const [selectedMatchday, setSelectedMatchday] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSchedule() {
      setLoading(true);

      try {
        const response = await fetch(
          `${apiUrl}/api/v1/matches?competition=${encodeURIComponent(selectedCompetition)}`,
          {
            cache: 'no-store',
          },
        );

        if (!response.ok) {
          throw new Error('Schedule request failed');
        }

        const payload = (await response.json()) as ApiResponse;

        if (active && payload.data) {
          setData(payload.data);
          setSelectedMatchday(getDefaultMatchday(payload.data));
          setUsingMockData(false);
        }
      } catch {
        if (active) {
          setUsingMockData(true);

          if (selectedCompetition === 'austrian-bundesliga') {
            setData(mockData);
            setSelectedMatchday(getDefaultMatchday(mockData));
          } else {
            const selected = competitions.find(
              (competition) => competition.slug === selectedCompetition,
            );

            const fallbackData: MatchScheduleData = {
              competition: {
                id: `mock-${selectedCompetition}`,
                name: selected?.label ?? selectedCompetition,
                shortName: selected?.label ?? null,
                slug: selectedCompetition,
              },
              season: mockData.season,
              stage: null,
              matches: [],
            };

            setData(fallbackData);
            setSelectedMatchday(getDefaultMatchday(fallbackData));
          }
        }
      } finally {
        if (active) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    }

    void loadSchedule();

    return () => {
      active = false;
    };
  }, [apiUrl, selectedCompetition]);

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

  const isCup = data.competition.slug === 'oefb-cup';

  const matchdays = useMemo(
    () =>
      Array.from(
        new Set(
          data.matches
            .map((match) => match.matchday)
            .filter((matchday): matchday is number => matchday !== null),
        ),
      ).sort((a, b) => a - b),
    [data.matches],
  );

  const selectedMatchdayIndex =
    selectedMatchday === null ? -1 : matchdays.indexOf(selectedMatchday);

  const visibleMatches = useMemo(
    () =>
      selectedMatchday === null
        ? data.matches.filter((match) => match.matchday === null)
        : data.matches.filter((match) => match.matchday === selectedMatchday),
    [data.matches, selectedMatchday],
  );

  const selectedLabel =
    selectedMatchday === null
      ? 'Weitere Spiele'
      : isCup
        ? `${selectedMatchday}. Runde`
        : `${selectedMatchday}. Spieltag`;

  if (initialLoading) {
    return <ListPageLoadingState rows={6} />;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            {data.competition.shortName ?? data.competition.name}
          </span>

          <h1>Spielplan</h1>

          <p>
            {data.season.name}
            {data.stage ? ` · ${data.stage.name}` : ''}
          </p>
        </div>

        <div className={styles.headerMeta}>
          <span>
            {data.matches.length} {data.matches.length === 1 ? 'Spiel' : 'Spiele'}
          </span>

          {loading ? <span>Aktualisiere …</span> : null}
        </div>
      </header>

      <nav className={styles.competitionTabs} aria-label="Wettbewerb auswählen">
        {competitions.map((competition) => (
          <button
            type="button"
            key={competition.slug}
            className={selectedCompetition === competition.slug ? styles.activeTab : ''}
            onClick={() => setSelectedCompetition(competition.slug)}
          >
            {competition.label}
          </button>
        ))}
      </nav>

      <section className={styles.schedule}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Spiele</span>
            <h2>{data.competition.name}</h2>
          </div>

          {usingMockData ? <span className={styles.previewBadge}>Vorschau</span> : null}
        </div>

        {visibleMatches.length > 0 ? (
          <>
            {matchdays.length > 1 ? (
              <nav
                className={styles.matchdayNavigation}
                aria-label={isCup ? 'Runde auswählen' : 'Spieltag auswählen'}
              >
                <button
                  type="button"
                  aria-label={isCup ? 'Vorherige Runde' : 'Vorheriger Spieltag'}
                  disabled={selectedMatchdayIndex <= 0}
                  onClick={() => {
                    const previous = matchdays[selectedMatchdayIndex - 1];

                    if (previous !== undefined) {
                      setSelectedMatchday(previous);
                    }
                  }}
                >
                  ←
                </button>

                <label className={styles.matchdaySelect}>
                  <span className={styles.srOnly}>
                    {isCup ? 'Runde auswählen' : 'Spieltag auswählen'}
                  </span>

                  <select
                    value={selectedMatchday ?? ''}
                    onChange={(event) => setSelectedMatchday(Number(event.target.value))}
                  >
                    {matchdays.map((matchday) => (
                      <option key={matchday} value={matchday}>
                        {isCup ? `${matchday}. Runde` : `${matchday}. Spieltag`}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  aria-label={isCup ? 'Nächste Runde' : 'Nächster Spieltag'}
                  disabled={
                    selectedMatchdayIndex < 0 || selectedMatchdayIndex >= matchdays.length - 1
                  }
                  onClick={() => {
                    const next = matchdays[selectedMatchdayIndex + 1];

                    if (next !== undefined) {
                      setSelectedMatchday(next);
                    }
                  }}
                >
                  →
                </button>
              </nav>
            ) : null}

            <div className={styles.matchdayList}>
              <section className={styles.matchday}>
                <div className={styles.matchdayHeader}>
                  <h3>{selectedLabel}</h3>
                  <span>
                    {visibleMatches.length} {visibleMatches.length === 1 ? 'Spiel' : 'Spiele'}
                  </span>
                </div>

                <div className={styles.matches}>
                  {visibleMatches.map((match) => {
                    const homeFavorite =
                      favoriteClubId === match.homeClub.id ||
                      favoriteClubSlug === match.homeClub.slug;

                    const awayFavorite =
                      favoriteClubId === match.awayClub.id ||
                      favoriteClubSlug === match.awayClub.slug;

                    const isFavorite = homeFavorite || awayFavorite;
                    const hasScore = match.homeScore !== null && match.awayScore !== null;

                    return (
                      <Link
                        href={`/spiele/${match.id}`}
                        key={match.id}
                        className={`${styles.matchRow} ${isFavorite ? styles.favoriteMatch : ''}`}
                      >
                        <div className={styles.kickoff}>
                          <strong>{formatDate(match.kickoff)}</strong>
                          <span>{formatTime(match.kickoff)}</span>
                        </div>

                        <div className={styles.teams}>
                          <div
                            className={`${styles.team} ${homeFavorite ? styles.favoriteTeam : ''}`}
                          >
                            <span>{match.homeClub.shortName ?? match.homeClub.name}</span>

                            <Image
                              src={`/clubs/${match.homeClub.slug}.svg`}
                              alt=""
                              width={32}
                              height={32}
                              className={styles.logo}
                            />
                          </div>

                          <div
                            className={`${styles.team} ${awayFavorite ? styles.favoriteTeam : ''}`}
                          >
                            <span>{match.awayClub.shortName ?? match.awayClub.name}</span>

                            <Image
                              src={`/clubs/${match.awayClub.slug}.svg`}
                              alt=""
                              width={32}
                              height={32}
                              className={styles.logo}
                            />
                          </div>
                        </div>

                        <div className={styles.result}>
                          {hasScore ? (
                            <>
                              <strong>
                                {match.homeScore}:{match.awayScore}
                              </strong>
                              <span>{statusLabels[match.status]}</span>
                            </>
                          ) : (
                            <>
                              <strong>{formatTime(match.kickoff)}</strong>
                              <span className={match.status === 'LIVE' ? styles.live : ''}>
                                {statusLabels[match.status]}
                              </span>
                            </>
                          )}
                        </div>

                        {isFavorite ? (
                          <span className={styles.favoriteBadge}>Mein Verein</span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            Für diesen Wettbewerb sind derzeit keine Spiele vorhanden.
          </div>
        )}
      </section>
    </main>
  );
}
