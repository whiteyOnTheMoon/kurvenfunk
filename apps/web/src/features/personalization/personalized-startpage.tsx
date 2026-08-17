'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/auth-provider';
import {
  clubLastMatch,
  clubNews,
  clubNextMatch,
  clubs,
  currentMatches,
  discussions,
  leagueNews,
  neutralTopNews,
  standings,
  type MockArticle,
  type MockMatch,
} from './startpage-mock-data';
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

function ArticleCard({ article, featured = false }: { article: MockArticle; featured?: boolean }) {
  return (
    <article className={`${styles.newsCard} ${featured ? styles.newsCardFeatured : ''}`}>
      <div className={styles.newsCardMeta}>
        <span>{article.category}</span>
        <span>{article.time}</span>
      </div>

      <h3>{article.title}</h3>
      <p>{article.lead}</p>

      <span className={styles.readMore}>Weiterlesen →</span>
    </article>
  );
}

function NewsGrid({ articles }: { articles: MockArticle[] }) {
  return (
    <div className={styles.newsGrid}>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} featured={article.featured} />
      ))}
    </div>
  );
}

function TeamRow({
  name,
  logo,
  score,
}: {
  name: string;
  logo: string;
  score?: number;
}) {
  return (
    <div className={styles.teamRow}>
      <div className={styles.teamIdentity}>
        <Image src={logo} alt="" width={30} height={30} className={styles.clubLogo} />
        <span>{name}</span>
      </div>
      {score !== undefined ? <strong className={styles.score}>{score}</strong> : null}
    </div>
  );
}

function MatchCard({ match, compact = false }: { match: MockMatch; compact?: boolean }) {
  return (
    <article className={`${styles.matchCard} ${compact ? styles.matchCardCompact : ''}`}>
      <div className={styles.matchMeta}>
        <span>{match.competition}</span>
        <span>{match.matchday}</span>
      </div>

      <div className={styles.matchDate}>{match.date}</div>

      <div className={styles.teams}>
        <TeamRow
          name={match.home.shortName}
          logo={match.home.logo}
          score={match.homeScore}
        />
        <TeamRow
          name={match.away.shortName}
          logo={match.away.logo}
          score={match.awayScore}
        />
      </div>

      {match.status ? <div className={styles.matchStatus}>{match.status}</div> : null}
    </article>
  );
}

function StandingsTable({ highlightClub }: { highlightClub?: string }) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <span>#</span>
        <span>Verein</span>
        <span>Sp.</span>
        <span>Diff.</span>
        <span>Pkt.</span>
      </div>

      {standings.map((row) => (
        <div
          className={`${styles.tableRow} ${
            row.club.slug === highlightClub ? styles.tableRowHighlighted : ''
          }`}
          key={row.club.slug}
        >
          <span>{row.position}</span>

          <div className={styles.tableClub}>
            <Image src={row.club.logo} alt="" width={24} height={24} className={styles.clubLogo} />
            <span>{row.club.shortName}</span>
          </div>

          <span>{row.played}</span>
          <span>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
          <strong>{row.points}</strong>
        </div>
      ))}
    </div>
  );
}

function Discussions() {
  return (
    <div className={styles.discussionList}>
      {discussions.map((discussion) => (
        <article className={styles.discussionCard} key={discussion.id}>
          <span className={styles.discussionContext}>{discussion.context}</span>
          <h3>{discussion.title}</h3>
          <div className={styles.discussionMeta}>
            <span>{discussion.replies} Antworten</span>
            <span>{discussion.lastActivity}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function SectionHeading({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) {
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



  if (!initialized || loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p className={styles.status}>Kurvenfunk wird geladen …</p>
        </div>
      </div>
    );
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
                Alles Wichtige zu deinem Verein und die wichtigsten Themen aus der {competitionName}.
              </p>
            </div>

            <Image
              src={`/clubs/${favoriteClub.slug}.svg`}
              alt={favoriteClub.name}
              width={112}
              height={112}
              className={styles.heroLogo}
            />
          </section>

          <section className={styles.section}>
            <SectionHeading title="Vereinsnews" meta={favoriteClub.shortName ?? undefined} />
            <NewsGrid articles={clubNews} />
          </section>

          <section className={styles.section}>
            <SectionHeading title="Mein Verein" meta="Bundesliga" />

            <div className={styles.clubOverviewGrid}>
              <div>
                <div className={styles.cardLabel}>Nächstes Spiel</div>
                <MatchCard match={clubNextMatch} />
              </div>

              <div>
                <div className={styles.cardLabel}>Letztes Ergebnis</div>
                <MatchCard match={clubLastMatch} />
              </div>

              <div>
                <div className={styles.cardLabel}>Tabellenposition</div>
                <div className={styles.positionCard}>
                  <span className={styles.positionNumber}>1.</span>
                  <span>Platz</span>
                  <strong>9 Punkte</strong>
                  <small>nach 3 Spielen</small>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <SectionHeading title="Liga News" meta={competitionName} />
            <NewsGrid articles={leagueNews} />
          </section>

          <section className={styles.twoColumnSection}>
            <div>
              <SectionHeading title="Tabelle" meta="Top 6" />
              <StandingsTable highlightClub={clubs.sturm.slug} />
            </div>

            <div>
              <SectionHeading title="Diskussionen" meta="Community" />
              <Discussions />
            </div>
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
            <p>News, Spiele und Diskussionen aus der {competitionName} auf einen Blick.</p>
          </div>
        </section>

        <section className={styles.section}>
          <SectionHeading title="Top News" meta="Aktuell" />
          <NewsGrid articles={neutralTopNews} />
        </section>

        <section className={styles.section}>
          <SectionHeading title="Aktuelle Spiele" meta="4. Spieltag" />
          <div className={styles.matchesGrid}>
            {currentMatches.map((match) => (
              <MatchCard key={match.id} match={match} compact />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <SectionHeading title="Liga News" meta={competitionName} />
          <NewsGrid articles={leagueNews} />
        </section>

        <section className={styles.twoColumnSection}>
          <div>
            <SectionHeading title="Tabelle" meta="Top 6" />
            <StandingsTable />
          </div>

          <div>
            <SectionHeading title="Diskussionen" meta="Community" />
            <Discussions />
          </div>
        </section>

      </div>
    </div>
  );
}
