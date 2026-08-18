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

      {articles.length === 0 ? (
        <EmptyState title="Noch keine Artikel">
          Erstelle den ersten Artikel im Redaktionssystem.
        </EmptyState>
      ) : (
        <div className={styles.list}>
          {articles.map((article) => (
            <Link key={article.id} href={`/admin/artikel/${article.id}`} className={styles.card}>
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
          ))}
        </div>
      )}
    </div>
  );
}
