'use client';

import { Button, EmptyState, Select, Skeleton } from '@kurvenfunk/ui';
import { useCallback, useEffect, useState } from 'react';

import styles from './news-overview.module.css';

interface Club {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
}

interface Competition {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  lead: string | null;
  publishedAt: string;
  isTopNews: boolean;
  competition: Competition | null;
  clubs: Club[];
}

interface ArticleResponse {
  data: {
    items: Article[];
    pagination: {
      nextCursor: string | null;
      hasNextPage: boolean;
    };
  };
}

interface ClubResponse {
  data: Club[];
}

interface CompetitionResponse {
  data: Competition[];
}

interface NewsOverviewProps {
  apiUrl: string;
}

function formatPublishedAt(value: string) {
  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function ArticleCard({ article }: { article: Article }) {
  const category =
    article.competition?.shortName ??
    article.competition?.name ??
    article.clubs[0]?.shortName ??
    article.clubs[0]?.name ??
    'Fußball';

  return (
    <article className={`${styles.newsCard} ${article.isTopNews ? styles.newsCardFeatured : ''}`}>
      <div className={styles.newsCardMeta}>
        <span>{category}</span>
        <span>{formatPublishedAt(article.publishedAt)}</span>
      </div>

      <h2>{article.title}</h2>

      {article.lead ? <p>{article.lead}</p> : null}

      {article.clubs.length > 0 ? (
        <div className={styles.clubList} aria-label="Vereine">
          {article.clubs.map((club) => (
            <span key={club.id}>{club.shortName ?? club.name}</span>
          ))}
        </div>
      ) : null}

      <span className={styles.readMore}>Weiterlesen →</span>
    </article>
  );
}

export function NewsOverview({ apiUrl }: NewsOverviewProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  const [clubFilter, setClubFilter] = useState('');
  const [competitionFilter, setCompetitionFilter] = useState('');

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(
    async ({
      cursor,
      append,
      signal,
    }: {
      cursor?: string;
      append: boolean;
      signal?: AbortSignal;
    }) => {
      const params = new URLSearchParams({
        limit: '12',
      });

      if (clubFilter) {
        params.set('club', clubFilter);
      }

      if (competitionFilter) {
        params.set('competition', competitionFilter);
      }

      if (cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(`${apiUrl}/api/v1/articles?${params.toString()}`, {
        signal,
      });

      if (!response.ok) {
        throw new Error('News konnten nicht geladen werden.');
      }

      const payload = (await response.json()) as ArticleResponse;

      setArticles((current) => (append ? [...current, ...payload.data.items] : payload.data.items));
      setNextCursor(payload.data.pagination.nextCursor);
      setHasNextPage(payload.data.pagination.hasNextPage);
    },
    [apiUrl, clubFilter, competitionFilter],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadFilters() {
      try {
        const [clubsResponse, competitionsResponse] = await Promise.all([
          fetch(`${apiUrl}/api/v1/clubs`, {
            signal: controller.signal,
          }),
          fetch(`${apiUrl}/api/v1/competitions`, {
            signal: controller.signal,
          }),
        ]);

        if (!clubsResponse.ok || !competitionsResponse.ok) {
          return;
        }

        const [clubsPayload, competitionsPayload] = (await Promise.all([
          clubsResponse.json(),
          competitionsResponse.json(),
        ])) as [ClubResponse, CompetitionResponse];

        setClubs(clubsPayload.data);
        setCompetitions(competitionsPayload.data);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }
      }
    }

    void loadFilters();

    return () => {
      controller.abort();
    };
  }, [apiUrl]);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    void fetchArticles({
      append: false,
      signal: controller.signal,
    })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : 'News konnten nicht geladen werden.',
        );
        setArticles([]);
        setNextCursor(null);
        setHasNextPage(false);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [fetchArticles]);

  async function loadMore() {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      await fetchArticles({
        cursor: nextCursor,
        append: true,
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Weitere News konnten nicht geladen werden.',
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Kurvenfunk</span>
          <h1>News</h1>
          <p>Aktuelle Meldungen aus dem österreichischen Fußball.</p>
        </div>
      </header>

      <section className={styles.filters} aria-label="News filtern">
        <label>
          <span>Verein</span>
          <Select value={clubFilter} onChange={(event) => setClubFilter(event.target.value)}>
            <option value="">Alle Vereine</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.slug}>
                {club.shortName ?? club.name}
              </option>
            ))}
          </Select>
        </label>

        <label>
          <span>Wettbewerb</span>
          <Select
            value={competitionFilter}
            onChange={(event) => setCompetitionFilter(event.target.value)}
          >
            <option value="">Alle Wettbewerbe</option>
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.slug}>
                {competition.shortName ?? competition.name}
              </option>
            ))}
          </Select>
        </label>

        {(clubFilter || competitionFilter) && (
          <Button
            variant="ghost"
            onClick={() => {
              setClubFilter('');
              setCompetitionFilter('');
            }}
          >
            Filter zurücksetzen
          </Button>
        )}
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}

      {isLoading ? (
        <div className={styles.newsGrid} aria-label="News werden geladen">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className={styles.skeletonCard} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState title="Keine News gefunden">
          <p>Für diese Filterkombination sind derzeit keine Artikel vorhanden.</p>
        </EmptyState>
      ) : (
        <>
          <div className={styles.newsGrid}>
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {hasNextPage ? (
            <div className={styles.pagination}>
              <Button variant="secondary" disabled={isLoadingMore} onClick={loadMore}>
                {isLoadingMore ? 'Wird geladen …' : 'Weitere News laden'}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
