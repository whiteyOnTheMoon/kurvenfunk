'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import styles from './forum-overview.module.css';

interface ThreadSummary {
  id: string;
  title: string;
  slug: string;
  status: 'OPEN' | 'LOCKED';
  postCount: number;
  pinnedAt: string | null;
  author: { id: string; nickname: string | null };
}

interface ThreadPage {
  items: ThreadSummary[];
  hasMore: boolean;
  nextCursor: string | null;
}

function isThreadSummary(value: unknown): value is ThreadSummary {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<ThreadSummary>;
  return (
    typeof row.id === 'string' &&
    typeof row.title === 'string' &&
    typeof row.slug === 'string' &&
    (row.status === 'OPEN' || row.status === 'LOCKED') &&
    typeof row.postCount === 'number' &&
    (row.pinnedAt === null || typeof row.pinnedAt === 'string') &&
    typeof row.author?.id === 'string'
  );
}

function parsePage(value: unknown): ThreadPage {
  if (!value || typeof value !== 'object') throw new Error('INVALID_THREAD_PAGE');
  const page = value as Partial<ThreadPage>;
  if (
    !Array.isArray(page.items) ||
    !page.items.every(isThreadSummary) ||
    typeof page.hasMore !== 'boolean' ||
    (page.hasMore
      ? typeof page.nextCursor !== 'string' || page.nextCursor.length === 0
      : page.nextCursor !== null)
  ) {
    throw new Error('INVALID_THREAD_PAGE');
  }
  return page as ThreadPage;
}

export function ClubForumThreads({
  apiUrl,
  forumSlug,
  clubSlug,
  revision,
}: {
  apiUrl: string;
  forumSlug: string;
  clubSlug: string;
  revision: number;
}) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const moreRequest = useRef<AbortController | null>(null);

  const endpoint = `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads`;

  useEffect(() => {
    const controller = new AbortController();
    moreRequest.current?.abort();

    async function load() {
      setLoading(true);
      setError(false);
      setMoreError(false);
      setLoadingMore(false);
      setThreads([]);
      setNextCursor(null);
      try {
        const response = await fetch(endpoint, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('FORUM_THREADS_REQUEST_FAILED');
        const payload: unknown = await response.json();
        const page = parsePage((payload as { data?: unknown }).data);
        if (!controller.signal.aborted) {
          setThreads(page.items);
          setNextCursor(page.nextCursor);
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => {
      controller.abort();
      moreRequest.current?.abort();
    };
  }, [endpoint, revision]);

  async function loadMore() {
    if (!nextCursor || loading || loadingMore) return;
    const controller = new AbortController();
    moreRequest.current = controller;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const response = await fetch(`${endpoint}?cursor=${encodeURIComponent(nextCursor)}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('FORUM_THREADS_PAGE_FAILED');
      const payload: unknown = await response.json();
      const page = parsePage((payload as { data?: unknown }).data);
      if (!controller.signal.aborted) {
        setThreads((previous) => {
          const ids = new Set(previous.map((thread) => thread.id));
          return [...previous, ...page.items.filter((thread) => !ids.has(thread.id))];
        });
        setNextCursor(page.nextCursor);
      }
    } catch {
      if (!controller.signal.aborted) setMoreError(true);
    } finally {
      if (!controller.signal.aborted) {
        setLoadingMore(false);
        moreRequest.current = null;
      }
    }
  }

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
            <strong>
              <Link
                href={`/forum/verein/${encodeURIComponent(clubSlug)}/thema/${encodeURIComponent(thread.slug)}`}
              >
                {thread.title}
              </Link>
            </strong>
            <span>
              {thread.author.nickname ?? 'Mitglied'}
              {' · '}
              {thread.postCount} {thread.postCount === 1 ? 'Beitrag' : 'Beiträge'}
              {thread.pinnedAt ? ' · Angepinnt' : null}
              {thread.status === 'LOCKED' ? ' · Geschlossen' : null}
            </span>
          </li>
        ))}
      </ul>
      {nextCursor ? (
        <div className={styles.paginationControls}>
          {moreError ? (
            <p role="alert">Weitere Themen konnten nicht geladen werden. Bitte erneut versuchen.</p>
          ) : null}
          <button type="button" disabled={loadingMore} onClick={() => void loadMore()}>
            {loadingMore ? 'Weitere Themen werden geladen …' : 'Weitere Themen laden'}
          </button>
        </div>
      ) : null}
    </>
  );
}
