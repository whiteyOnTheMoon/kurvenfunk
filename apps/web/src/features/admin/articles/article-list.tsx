'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, EmptyState, Skeleton } from '@kurvenfunk/ui';

import { useAuth } from '../../auth/auth-provider';
import styles from './article-list.module.css';

interface ArticleListProps {
  apiUrl: string;
}

interface EditorialArticle {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  updatedAt: string;
  deletedAt: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  author: {
    id: string;
    nickname: string | null;
  } | null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-AT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Vienna',
  }).format(new Date(value));
}

export function ArticleList({ apiUrl }: ArticleListProps) {
  const { authenticated, initialized, token } = useAuth();

  const [articles, setArticles] = useState<EditorialArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [pendingArticleId, setPendingArticleId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!authenticated || !token) {
      return;
    }

    let cancelled = false;

    async function loadArticles() {
      setLoading(true);
      setError(undefined);

      try {
        const response = await fetch(`${apiUrl}/api/v1/articles/editorial`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = (await response.json().catch(() => null)) as {
          data?: EditorialArticle[];
          error?: {
            message?: string;
          };
        } | null;

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? 'Artikel konnten nicht geladen werden.');
        }

        if (!cancelled) {
          setArticles(payload?.data ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Artikel konnten nicht geladen werden.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadArticles();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, initialized, token]);

  async function changeDeletion(article: EditorialArticle) {
    if (!token || pendingArticleId) {
      return;
    }

    const restore = Boolean(article.deletedAt);

    if (
      !restore &&
      !window.confirm(`Artikel „${article.title}“ löschen? Du kannst ihn später wiederherstellen.`)
    ) {
      return;
    }

    setPendingArticleId(article.id);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(
        `${apiUrl}/api/v1/articles/${encodeURIComponent(article.id)}${restore ? '/restore' : ''}`,
        {
          method: restore ? 'POST' : 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        data?: Pick<
          EditorialArticle,
          'deletedAt' | 'status' | 'updatedAt' | 'publishedAt' | 'scheduledAt'
        >;
        error?: { message?: string };
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(
          payload?.error?.message ??
            (restore
              ? 'Artikel konnte nicht wiederhergestellt werden.'
              : 'Artikel konnte nicht gelöscht werden.'),
        );
      }

      const updated = payload.data;
      setArticles((current) =>
        current.map((entry) => (entry.id === article.id ? { ...entry, ...updated } : entry)),
      );
      setMessage(
        restore
          ? 'Artikel wurde als unveröffentlichter Entwurf wiederhergestellt.'
          : 'Artikel wurde gelöscht und kann wiederhergestellt werden.',
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Aktion konnte nicht abgeschlossen werden.',
      );
    } finally {
      setPendingArticleId(null);
    }
  }

  if (!initialized) {
    return (
      <div className={styles.loading}>
        <Skeleton style={{ height: '110px' }} />
        <Skeleton style={{ height: '110px' }} />
        <Skeleton style={{ height: '110px' }} />
      </div>
    );
  }

  if (!authenticated || !token) {
    return <div className={styles.state}>Du musst angemeldet sein, um Artikel zu verwalten.</div>;
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <Skeleton style={{ height: '110px' }} />
        <Skeleton style={{ height: '110px' }} />
        <Skeleton style={{ height: '110px' }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Redaktion</p>
          <h1>Artikel</h1>
          <p className={styles.intro}>Entwürfe, geplante und veröffentlichte Artikel verwalten.</p>
        </div>

        <Link href="/admin/artikel/neu">
          <Button>Neuer Artikel</Button>
        </Link>
      </header>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className={styles.message} role="status">
          {message}
        </div>
      ) : null}

      {articles.length === 0 ? (
        <EmptyState title="Noch keine Artikel">
          Erstelle den ersten Artikel im Redaktionssystem.
        </EmptyState>
      ) : (
        <div className={styles.list}>
          {articles.map((article) => (
            <div key={article.id} className={styles.cardRow}>
              {article.deletedAt ? (
                <div className={styles.card}>
                  <div className={styles.cardMain}>
                    <div className={styles.cardMeta}>
                      <span className={styles.status}>Gelöscht</span>
                      <span>Zuletzt geändert {formatDate(article.updatedAt)} Uhr</span>
                    </div>
                    <h2>{article.title}</h2>
                    <p>/{article.slug}</p>
                  </div>
                  <div className={styles.cardAside}>
                    <span>{article.author?.nickname ?? 'Kurvenfunk'}</span>
                    <strong>Nur für die Redaktion</strong>
                  </div>
                </div>
              ) : (
                <Link href={`/admin/artikel/${article.id}`} className={styles.card}>
                  <div className={styles.cardMain}>
                    <div className={styles.cardMeta}>
                      <span className={styles.status}>{article.status}</span>
                      <span>Aktualisiert {formatDate(article.updatedAt)} Uhr</span>
                    </div>
                    <h2>{article.title}</h2>
                    <p>/{article.slug}</p>
                  </div>
                  <div className={styles.cardAside}>
                    <span>{article.author?.nickname ?? 'Kurvenfunk'}</span>
                    <strong>Bearbeiten →</strong>
                  </div>
                </Link>
              )}
              <Button
                variant="outline"
                disabled={pendingArticleId !== null}
                onClick={() => void changeDeletion(article)}
              >
                {pendingArticleId === article.id
                  ? 'Verarbeitet …'
                  : article.deletedAt
                    ? 'Wiederherstellen'
                    : 'Löschen'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
