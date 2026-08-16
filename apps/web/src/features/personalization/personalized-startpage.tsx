'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/auth-provider';
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

function ArticleList({
  articles,
  emptyMessage,
}: {
  articles: StartpageArticle[];
  emptyMessage: string;
}) {
  if (articles.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.articleGrid}>
      {articles.map((article) => (
        <article className={styles.articleCard} key={article.id}>
          <div className={styles.articleMeta}>
            {new Intl.DateTimeFormat('de-AT', {
              dateStyle: 'medium',
            }).format(new Date(article.publishedAt))}
          </div>

          <h3>{article.title}</h3>

          {article.lead ? <p>{article.lead}</p> : null}
        </article>
      ))}
    </div>
  );
}

function PendingFeature({ title, description }: { title: string; description: string }) {
  return (
    <section className={styles.pendingCard}>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
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

  const articleGroups = useMemo(() => {
    const articles = startpage?.articles ?? [];

    return {
      club: articles.filter((article) => article.priority === 'FAVORITE_CLUB'),
      league: articles.filter((article) => article.priority === 'COMPETITION'),
      general: articles.filter((article) => article.priority === 'GENERAL'),
      top: articles.filter(
        (article) => article.priority === 'TOP_NEWS' || article.priority === 'RECENT',
      ),
    };
  }, [startpage]);

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

  if (startpage.variant === 'CLUB' && startpage.favoriteClub) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <span className={`${styles.badge} kf-club-badge`}>Mein Verein</span>
            <h1>{startpage.favoriteClub.name}</h1>
            <p>
              Deine personalisierte Kurvenfunk-Startseite mit Vereinsnews und den wichtigsten Themen
              aus der {startpage.competition.shortName ?? startpage.competition.name}.
            </p>
          </header>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <h2>Vereinsnews</h2>
              <span className="kf-club-accent">{startpage.favoriteClub.shortName}</span>
            </div>
            <ArticleList
              articles={articleGroups.club}
              emptyMessage="Derzeit gibt es keine aktuellen Vereinsnews."
            />
          </section>

          <div className={styles.sportsGrid}>
            <PendingFeature
              title="Nächstes Spiel"
              description="Wird mit der Sportdaten-Anbindung ergänzt."
            />
            <PendingFeature
              title="Letztes Ergebnis"
              description="Wird mit der Sportdaten-Anbindung ergänzt."
            />
            <PendingFeature
              title="Tabellenposition"
              description="Wird mit der Tabellen-Anbindung ergänzt."
            />
          </div>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <h2>Liga News</h2>
              <span>{startpage.competition.shortName ?? startpage.competition.name}</span>
            </div>
            <ArticleList
              articles={articleGroups.league}
              emptyMessage="Derzeit gibt es keine weiteren Liga-News."
            />
          </section>

          {articleGroups.general.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <h2>Weitere News</h2>
              </div>
              <ArticleList articles={articleGroups.general} emptyMessage="" />
            </section>
          ) : null}

          <PendingFeature
            title="Diskussionen"
            description="Aktuelle Community-Diskussionen werden mit dem Community-Modul ergänzt."
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <span className={styles.badge}>Kurvenfunk</span>
          <h1>Österreichischer Fußball</h1>
          <p>
            Top News und aktuelle Themen aus der{' '}
            {startpage.competition.shortName ?? startpage.competition.name}.
          </p>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Top News</h2>
          </div>
          <ArticleList
            articles={articleGroups.top}
            emptyMessage="Derzeit gibt es keine aktuellen Top News."
          />
        </section>

        <PendingFeature
          title="Aktuelle Spiele"
          description="Aktuelle Spiele werden mit der Sportdaten-Anbindung ergänzt."
        />

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Liga News</h2>
            <span>{startpage.competition.shortName ?? startpage.competition.name}</span>
          </div>
          <ArticleList
            articles={articleGroups.league}
            emptyMessage="Derzeit gibt es keine weiteren Liga-News."
          />
        </section>

        <PendingFeature
          title="Tabelle"
          description="Die aktuelle Tabelle wird mit der Tabellen-Anbindung ergänzt."
        />

        <PendingFeature
          title="Diskussionen"
          description="Aktuelle Community-Diskussionen werden mit dem Community-Modul ergänzt."
        />
      </div>
    </div>
  );
}
