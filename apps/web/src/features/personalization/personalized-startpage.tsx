'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/auth-provider';
import { StartpageLoadingState } from '../loading/loading-states';
import { getClubLogoSrc } from '../clubs/club-media';
import styles from './personalized-startpage.module.css';

type NewsPriority = 'FAVORITE_CLUB' | 'COMPETITION' | 'GENERAL' | 'TOP_NEWS' | 'RECENT';

interface StartpageArticle {
  id: string;
  title: string;
  slug: string;
  lead: string | null;
  publishedAt: string;
  competitionId: string | null;
  priority: NewsPriority;
}

interface StartpageResponse {
  variant: 'CLUB' | 'NEUTRAL';
  favoriteClub: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  } | null;
  competition: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  };
  articles: StartpageArticle[];
}

interface PersonalizedStartpageProps {
  apiUrl: string;
}

interface ApiResponse {
  data?: StartpageResponse;
}

type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED' | 'ABANDONED';

interface PublicClub {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
}

interface PublicMatch {
  id: string;
  kickoff: string;
  matchday: number | null;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeClub: PublicClub;
  awayClub: PublicClub;
}

interface PublicStanding {
  id: string;
  position: number;
  played: number;
  goalDifference: number;
  points: number;
  club: PublicClub;
}

interface MatchesResponse {
  data?: { matches: PublicMatch[] } | null;
}

interface StandingsResponse {
  data?: { standings: PublicStanding[] } | null;
}

const matchLabels: Record<MatchStatus, string> = {
  SCHEDULED: 'Geplant',
  LIVE: 'Live',
  FINISHED: 'Beendet',
  POSTPONED: 'Verschoben',
  CANCELLED: 'Abgesagt',
  ABANDONED: 'Abgebrochen',
};

function formatKickoff(value: string): string {
  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Vienna',
  }).format(new Date(value));
}

function visibleMatchScore(match: PublicMatch): boolean {
  return (
    (match.status === 'LIVE' || match.status === 'FINISHED') &&
    match.homeScore !== null &&
    match.awayScore !== null
  );
}

function teamName(team: PublicClub): string {
  return team.shortName ?? team.name;
}

function formatArticleDate(value: string) {
  return new Intl.DateTimeFormat('de-AT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Vienna',
  }).format(new Date(value));
}

function getArticleCategory(article: StartpageArticle) {
  switch (article.priority) {
    case 'FAVORITE_CLUB':
      return 'Vereinsnews';
    case 'COMPETITION':
      return 'Bundesliga';
    case 'TOP_NEWS':
      return 'Top News';
    case 'GENERAL':
      return 'Allgemein';
    case 'RECENT':
      return 'Aktuell';
  }
}

function ArticleCard({
  article,
  featured = false,
}: {
  article: StartpageArticle;
  featured?: boolean;
}) {
  return (
    <article className={`${styles.newsCard} ${featured ? styles.newsCardFeatured : ''}`}>
      <div className={styles.newsCardMeta}>
        <span>{getArticleCategory(article)}</span>
        <span>{formatArticleDate(article.publishedAt)} Uhr</span>
      </div>

      <Link href={`/artikel/${article.slug}`} className={styles.articleLink}>
        <h3>{article.title}</h3>
        {article.lead ? <p>{article.lead}</p> : null}
        <span className={styles.readMore}>Weiterlesen →</span>
      </Link>
    </article>
  );
}

function NewsGrid({ articles }: { articles: StartpageArticle[] }) {
  return (
    <div className={styles.newsGrid}>
      {articles.map((article, index) => (
        <ArticleCard key={article.id} article={article} featured={index === 0} />
      ))}
    </div>
  );
}

function ClubLogo({ team, size }: { team: PublicClub; size: number }) {
  const src = getClubLogoSrc('', { slug: team.slug, logo: null });
  if (!src) {
    return (
      <span className={styles.logoPlaceholder} aria-label={`Kein Logo für ${team.name} vorhanden`}>
        {team.name.trim().slice(0, 2).toLocaleUpperCase('de-AT')}
      </span>
    );
  }
  return <Image src={src} alt="" width={size} height={size} className={styles.clubLogo} />;
}

function TeamRow({ team, score }: { team: PublicClub; score: number | null }) {
  return (
    <div className={styles.teamRow}>
      <div className={styles.teamIdentity}>
        <ClubLogo team={team} size={30} />
        <span>{teamName(team)}</span>
      </div>
      {score !== null ? <strong className={styles.score}>{score}</strong> : null}
    </div>
  );
}

function MatchCard({ match, compact = false }: { match: PublicMatch; compact?: boolean }) {
  const hasScore = visibleMatchScore(match);
  return (
    <article className={`${styles.matchCard} ${compact ? styles.matchCardCompact : ''}`}>
      <Link href={`/spiele/${match.id}`} className={styles.articleLink}>
        <div className={styles.matchMeta}>
          <span>Bundesliga</span>
          <span>{match.matchday !== null ? `${match.matchday}. Spieltag` : 'Spiel'}</span>
        </div>
        <div className={styles.matchDate}>{formatKickoff(match.kickoff)}</div>
        <div className={styles.teams}>
          <TeamRow team={match.homeClub} score={hasScore ? match.homeScore : null} />
          <TeamRow team={match.awayClub} score={hasScore ? match.awayScore : null} />
        </div>
        <div className={styles.matchStatus}>{matchLabels[match.status]}</div>
      </Link>
    </article>
  );
}

function StandingsTable({
  rows,
  highlightClub,
}: {
  rows: PublicStanding[];
  highlightClub?: string;
}) {
  if (rows.length === 0) {
    return <p className={styles.status}>Noch keine bestätigte Tabelle vorhanden.</p>;
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <span>#</span>
        <span>Verein</span>
        <span>Sp.</span>
        <span>Diff.</span>
        <span>Pkt.</span>
      </div>
      {rows.slice(0, 6).map((row) => (
        <Link
          href={`/vereine/${row.club.slug}`}
          className={`${styles.tableRow} ${row.club.slug === highlightClub ? styles.tableRowHighlighted : ''}`}
          key={row.id}
          aria-label={`${row.position}. ${row.club.name}, ${row.points} Punkte`}
        >
          <span>{row.position}</span>
          <div className={styles.tableClub}>
            <ClubLogo team={row.club} size={24} />
            <span>{teamName(row.club)}</span>
          </div>
          <span>{row.played}</span>
          <span>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
          <strong>{row.points}</strong>
        </Link>
      ))}
    </div>
  );
}

function SectionHeading({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className={styles.sectionHeading}>
      <h2>{title}</h2>
      {meta ? <span>{meta}</span> : null}
    </div>
  );
}

export function PersonalizedStartpage({ apiUrl }: PersonalizedStartpageProps) {
  const { authenticated, initialized, token, user } = useAuth();
  const [startpage, setStartpage] = useState<StartpageResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [matches, setMatches] = useState<PublicMatch[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [tableRows, setTableRows] = useState<PublicStanding[]>([]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    const controller = new AbortController();

    async function loadStartpage() {
      setLoading(true);
      setError(undefined);

      const personalized = authenticated && Boolean(token);

      try {
        const response = await fetch(
          personalized
            ? `${apiUrl}/api/v1/articles/startpage`
            : `${apiUrl}/api/v1/articles/startpage/neutral`,
          {
            headers:
              personalized && token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : undefined,
            signal: controller.signal,
          },
        );

        const body = (await response.json().catch(() => undefined)) as ApiResponse | undefined;

        if (!response.ok || !body?.data) {
          throw new Error('STARTPAGE_LOAD_FAILED');
        }

        setStartpage(body.data);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }

        setError('Die Startseite konnte nicht geladen werden.');
        setStartpage(undefined);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadStartpage();

    return () => controller.abort();
  }, [apiUrl, authenticated, initialized, token, user?.fanPreference, user?.favoriteClubId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRealSports() {
      const [schedule, table] = await Promise.allSettled([
        fetch(`${apiUrl}/api/v1/matches?competition=austrian-bundesliga`, {
          signal: controller.signal,
          cache: 'no-store',
        }).then(async (response) => {
          if (!response.ok) return [];
          const body = (await response.json()) as MatchesResponse;
          return body.data?.matches ?? [];
        }),
        fetch(`${apiUrl}/api/v1/standings/austrian-bundesliga`, {
          signal: controller.signal,
          cache: 'no-store',
        }).then(async (response) => {
          if (!response.ok) return [];
          const body = (await response.json()) as StandingsResponse;
          return body.data?.standings ?? [];
        }),
      ]);

      if (controller.signal.aborted) return;
      setCurrentTime(Date.now());
      setMatches(schedule.status === 'fulfilled' ? schedule.value : []);
      setTableRows(table.status === 'fulfilled' ? table.value : []);
    }

    void loadRealSports();
    return () => controller.abort();
  }, [apiUrl]);

  if (!initialized || loading) {
    return <StartpageLoadingState />;
  }

  if (error || !startpage) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1>Kurvenfunk</h1>
          <p className={styles.error}>{error ?? 'Die Startseite ist derzeit nicht verfügbar.'}</p>
        </div>
      </div>
    );
  }

  const competitionName = startpage.competition.shortName ?? startpage.competition.name;

  const favoriteClubArticles = startpage.articles.filter(
    (article) => article.priority === 'FAVORITE_CLUB',
  );

  const competitionArticles = startpage.articles.filter(
    (article) => article.priority === 'COMPETITION',
  );

  const otherArticles = startpage.articles.filter((article) =>
    ['GENERAL', 'TOP_NEWS', 'RECENT'].includes(article.priority),
  );

  const now = currentTime;
  const clubSlug = startpage.favoriteClub?.slug;
  const clubMatches = clubSlug
    ? matches.filter(
        (match) => match.homeClub.slug === clubSlug || match.awayClub.slug === clubSlug,
      )
    : [];
  const nextMatch =
    clubMatches
      .filter((match) => match.status === 'SCHEDULED' && Date.parse(match.kickoff) >= now)
      .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff))[0] ?? null;
  const lastMatch =
    clubMatches
      .filter((match) => match.status === 'FINISHED')
      .sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff))[0] ?? null;
  const clubStanding = tableRows.find((row) => row.club.slug === clubSlug) ?? null;
  const visibleMatches = [...matches]
    .filter((match) => match.status === 'LIVE' || match.status === 'SCHEDULED')
    .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff))
    .slice(0, 3);

  if (startpage.variant === 'CLUB' && startpage.favoriteClub) {
    const favoriteClub = startpage.favoriteClub;
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <section className={`${styles.hero} ${styles.clubHero}`}>
            <div>
              <span className={`${styles.badge} kf-club-badge`}>Mein Verein</span>
              <h1>{favoriteClub.name}</h1>
              <p>
                Alles Wichtige zu deinem Verein und die wichtigsten Themen aus der {competitionName}
                .
              </p>
            </div>

            {getClubLogoSrc('', { slug: favoriteClub.slug, logo: null }) ? (
              <Image
                src={getClubLogoSrc('', { slug: favoriteClub.slug, logo: null })!}
                alt={favoriteClub.name}
                width={112}
                height={112}
                className={styles.heroLogo}
              />
            ) : null}
          </section>

          <section className={styles.section}>
            <SectionHeading title="Vereinsnews" meta={favoriteClub.shortName ?? undefined} />
            <NewsGrid
              articles={
                favoriteClubArticles.length > 0
                  ? favoriteClubArticles
                  : startpage.articles.slice(0, 3)
              }
            />
          </section>

          <section className={styles.section}>
            <SectionHeading title="Mein Verein" meta="Bundesliga" />

            <div className={styles.clubOverviewGrid}>
              <div>
                <div className={styles.cardLabel}>Nächstes Spiel</div>
                {nextMatch ? (
                  <MatchCard match={nextMatch} />
                ) : (
                  <p className={styles.status}>Noch kein kommendes Spiel hinterlegt.</p>
                )}
              </div>

              <div>
                <div className={styles.cardLabel}>Letztes Ergebnis</div>
                {lastMatch ? (
                  <MatchCard match={lastMatch} />
                ) : (
                  <p className={styles.status}>Noch kein bestätigtes Endergebnis vorhanden.</p>
                )}
              </div>

              <div>
                <div className={styles.cardLabel}>Tabellenposition</div>
                <div className={styles.positionCard}>
                  <span className={styles.positionNumber}>
                    {clubStanding ? `${clubStanding.position}.` : '–'}
                  </span>
                  <span>Platz</span>
                  {clubStanding ? (
                    <>
                      <strong>{clubStanding.points} Punkte</strong>
                      <small>nach {clubStanding.played} Spielen</small>
                    </>
                  ) : (
                    <small>Noch keine bestätigten Tabellenwerte.</small>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <SectionHeading title="Liga News" meta={competitionName} />
            <NewsGrid
              articles={
                competitionArticles.length > 0
                  ? competitionArticles
                  : startpage.articles.slice(0, 3)
              }
            />
          </section>

          {otherArticles.length > 0 ? (
            <section className={styles.section}>
              <SectionHeading title="Weitere News" meta="Aktuell" />
              <NewsGrid articles={otherArticles} />
            </section>
          ) : null}

          <section className={styles.section}>
            <SectionHeading title="Tabelle" meta="Top 6" />
            <StandingsTable rows={tableRows} highlightClub={favoriteClub.slug} />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div>
            <span className={styles.badge}>Kurvenfunk</span>
            <h1>Österreichischer Fußball.</h1>
            <p>News, Spiele und Tabellen aus der {competitionName} auf einen Blick.</p>
          </div>
        </section>

        <section className={styles.section}>
          <SectionHeading title="Top News" meta="Aktuell" />
          <NewsGrid articles={startpage.articles.slice(0, 6)} />
        </section>

        <section className={styles.section}>
          <SectionHeading title="Aktuelle Spiele" meta={competitionName} />
          <div className={styles.matchesGrid}>
            {visibleMatches.length > 0 ? (
              visibleMatches.map((match) => <MatchCard key={match.id} match={match} compact />)
            ) : (
              <p className={styles.status}>Zurzeit keine bestätigten Spielansetzungen verfügbar.</p>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <SectionHeading title="Liga News" meta={competitionName} />
          <NewsGrid
            articles={
              competitionArticles.length > 0 ? competitionArticles : startpage.articles.slice(0, 3)
            }
          />
        </section>

        <section className={styles.section}>
          <SectionHeading title="Tabelle" meta="Top 6" />
          <StandingsTable rows={tableRows} />
        </section>
      </div>
    </div>
  );
}
