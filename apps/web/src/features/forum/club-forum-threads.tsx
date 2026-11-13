'use client';

import { useEffect, useState } from 'react';

import styles from './forum-overview.module.css';

interface ThreadSummary {
  id: string;
  title: string;
  status: 'OPEN' | 'LOCKED';
  postCount: number;
  author: { id: string; nickname: string | null };
}

function isThreadSummary(value: unknown): value is ThreadSummary {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<ThreadSummary>;
  return (
    typeof row.id === 'string' &&
    typeof row.title === 'string' &&
    (row.status === 'OPEN' || row.status === 'LOCKED') &&
    typeof row.postCount === 'number' &&
    typeof row.author?.id === 'string'
  );
}

export function ClubForumThreads({ apiUrl, forumSlug }: { apiUrl: string; forumSlug: string }) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(false);
      setThreads([]);
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads`,
          { cache: 'no-store', signal: controller.signal },
        );
        if (!response.ok) throw new Error('FORUM_THREADS_REQUEST_FAILED');
        const payload: unknown = await response.json();
        const result = payload as {
          data?: { items?: unknown; hasMore?: unknown };
        };
        if (
          !Array.isArray(result.data?.items) ||
          !result.data.items.every(isThreadSummary) ||
          typeof result.data.hasMore !== 'boolean'
        ) {
          throw new Error('FORUM_THREADS_RESPONSE_INVALID');
        }
        if (!controller.signal.aborted) {
          setThreads(result.data.items);
          setHasMore(result.data.hasMore);
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [apiUrl, forumSlug]);

  if (loading) {
    return (
      <p className={styles.empty} role="status">
        Diskussionen werden geladen …
      </p>
    );
  }
  if (error) {
    return (
      <p className={styles.empty} role="alert">
        Diskussionen sind derzeit nicht erreichbar.
      </p>
    );
  }
  if (threads.length === 0) {
    return <p className={styles.empty}>Hier gibt es noch keine Diskussionsthemen.</p>;
  }

  return (
    <>
      <ul className={styles.forumList}>
        {threads.map((thread) => (
          <li key={thread.id} className={styles.forumItem}>
            <strong>{thread.title}</strong>
            <span>
              {thread.author.nickname ?? 'Mitglied'}
              {' · '}
              {thread.postCount} {thread.postCount === 1 ? 'Beitrag' : 'Beiträge'}
              {thread.status === 'LOCKED' ? ' · Geschlossen' : null}
            </span>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <p className={styles.empty}>
          Weitere Themen werden mit der vollständigen Thread-Paginierung verfügbar.
        </p>
      ) : null}
    </>
  );
}
