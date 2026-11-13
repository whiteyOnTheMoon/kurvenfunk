'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  fetchArticleDiscussionPage,
  mergeArticleDiscussionPages,
  type ArticleDiscussionEntry,
} from './article-discussion-feed';
import styles from './article-discussion-directory.module.css';

function publishedDate(value: string): string {
  return new Intl.DateTimeFormat('de-AT', {
    dateStyle: 'medium',
    timeZone: 'Europe/Vienna',
  }).format(new Date(value));
}

/** No article thread is provisioned; this is a directory of published articles. */
export function ArticleDiscussionDirectory({ apiUrl }: { apiUrl: string }) {
  const [articles, setArticles] = useState<ArticleDiscussionEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [moreError, setMoreError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const page = await fetchArticleDiscussionPage(apiUrl, undefined, controller.signal);
        if (!controller.signal.aborted) {
          setArticles(page.items);
          setCursor(page.pagination.hasNextPage ? page.pagination.nextCursor : null);
        }
      } catch {
        if (!controller.signal.aborted) {
          setArticles([]);
          setCursor(null);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [apiUrl]);

  async function loadMore() {
    if (!cursor || loading || loadingMore) return;
    const next = cursor;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const page = await fetchArticleDiscussionPage(apiUrl, next);
      setArticles((current) => mergeArticleDiscussionPages(current, page.items));
      setCursor(page.pagination.hasNextPage ? page.pagination.nextCursor : null);
    } catch {
      setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/forum" className={styles.backLink}>
          Zum Forum
        </Link>
        <p className={styles.eyebrow}>Community · Artikel</p>
        <h1>Artikel-Diskussionen</h1>
        <p>
          Diskutiere aktuelle Artikel zusammen mit allen, die direkt beim Artikel kommentieren. Es
          gibt nur einen gemeinsamen Kommentarverlauf – keinen zweiten Forenthread.
        </p>
      </header>

      <section aria-label="Veröffentlichte Artikel">
        {loading ? (
          <p role="status" className={styles.notice}>
            Artikel werden geladen …
          </p>
        ) : null}
        {error ? (
          <p role="alert" className={styles.notice}>
            Artikel-Diskussionen sind derzeit nicht erreichbar.
          </p>
        ) : null}
        {!loading && !error && articles.length === 0 ? (
          <p className={styles.notice}>Aktuell sind keine veröffentlichten Artikel vorhanden.</p>
        ) : null}
        {!loading && !error ? (
          <ul className={styles.articleList}>
            {articles.map((article) => (
              <li key={article.id} className={styles.articleCard}>
                <span className={styles.date}>
                  Veröffentlicht am{' '}
                  <time dateTime={article.publishedAt}>{publishedDate(article.publishedAt)}</time>
                </span>
                <h2>
                  <Link href={'/forum/artikel/' + encodeURIComponent(article.slug)}>
                    {article.title}
                  </Link>
                </h2>
                {article.lead ? <p>{article.lead}</p> : null}
                <Link
                  href={'/forum/artikel/' + encodeURIComponent(article.slug)}
                  className={styles.discussLink}
                >
                  Zur gemeinsamen Diskussion
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {cursor && !loading && !error ? (
          <div className={styles.pagination}>
            <button type="button" disabled={loadingMore} onClick={() => void loadMore()}>
              {loadingMore ? 'Weitere Artikel werden geladen …' : 'Weitere Artikel laden'}
            </button>
            {moreError ? (
              <p role="alert">Weitere Artikel konnten nicht geladen werden. Erneut versuchen.</p>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
