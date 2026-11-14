'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import {
  appendInboxPage,
  fetchInboxPage,
  fetchUnreadCount,
  type InboxFilter,
  type InboxPage,
} from './notification-inbox-feed';
import styles from './notification-inbox.module.css';

interface InboxSnapshot {
  token: string;
  filter: InboxFilter;
  page: InboxPage;
  unreadCount: number;
}

export function NotificationInbox({ apiUrl }: { apiUrl: string }) {
  const { authenticated, initialized, sessionRecovering, token } = useAuth();
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [snapshot, setSnapshot] = useState<InboxSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const signedIn = initialized && authenticated && !sessionRecovering && !!token;
  const visible =
    signedIn && snapshot?.token === token && snapshot.filter === filter ? snapshot : null;

  useEffect(() => {
    const abort = new AbortController();
    setSnapshot(null);
    setFailed(false);
    setLoadingMore(false);
    if (!signedIn || !token) {
      setLoading(false);
      return () => abort.abort();
    }
    setLoading(true);
    Promise.all([
      fetchInboxPage(apiUrl, token, filter, undefined, abort.signal),
      fetchUnreadCount(apiUrl, token, abort.signal),
    ])
      .then(([page, unreadCount]) => {
        if (!abort.signal.aborted) setSnapshot({ token, filter, page, unreadCount });
      })
      .catch(() => {
        if (!abort.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [apiUrl, signedIn, token, filter, refresh]);

  async function loadMore() {
    if (
      !visible ||
      !token ||
      loadingMore ||
      !visible.page.pagination.hasNextPage ||
      !visible.page.pagination.nextCursor
    ) return;
    const cursor = visible.page.pagination.nextCursor;
    const ownerToken = token;
    const ownerFilter = filter;
    setLoadingMore(true);
    setFailed(false);
    try {
      const next = await fetchInboxPage(apiUrl, ownerToken, ownerFilter, cursor);
      setSnapshot((current) => {
        if (!current || current.token !== ownerToken || current.filter !== ownerFilter) {
          return current;
        }
        return {
          ...current,
          page: {
            items: appendInboxPage(current.page.items, next.items),
            pagination: next.pagination,
          },
        };
      });
    } catch {
      setFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>Mein Kurvenfunk</span>
        <h1>Benachrichtigungen</h1>
        <p>Antworten, Forumaktivität und wichtige Hinweise zu deinem Account.</p>
      </header>

      {!initialized || sessionRecovering ? (
        <p role="status" className={styles.status}>Dein Anmeldestatus wird geprüft …</p>
      ) : !authenticated || !token ? (
        <section className={styles.panel}>
          <h2>Anmeldung erforderlich</h2>
          <p>Benachrichtigungen sind privat. <Link href="/login">Melde dich an</Link>, um deine Nachrichten zu sehen.</p>
        </section>
      ) : (
        <section className={styles.panel} aria-label="Meine Benachrichtigungen">
          <div className={styles.toolbar}>
            <div className={styles.filters} role="group" aria-label="Benachrichtigungen filtern">
              <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Alle</button>
              <button type="button" aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>Ungelesen</button>
            </div>
            {visible ? (
              <span className={styles.count} role="status">
                {visible.unreadCount === 0
                  ? 'Keine ungelesenen Mitteilungen'
                  : String(visible.unreadCount) + ' ungelesen'}
              </span>
            ) : null}
          </div>

          {failed ? (
            <div className={styles.error} role="alert">
              Benachrichtigungen konnten nicht geladen werden.
              <button type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading}>
                Erneut versuchen
              </button>
            </div>
          ) : null}

          {loading && !visible ? (
            <p className={styles.status} role="status">Benachrichtigungen werden geladen …</p>
          ) : visible && visible.page.items.length === 0 ? (
            <p className={styles.status}>
              {filter === 'unread'
                ? 'Du hast keine ungelesenen Benachrichtigungen.'
                : 'Du hast noch keine Benachrichtigungen.'}
            </p>
          ) : visible ? (
            <>
              <ul className={styles.list}>
                {visible.page.items.map((item) => (
                  <li key={item.id} className={item.readAt ? styles.item : styles.unreadItem}>
                    <div className={styles.itemHeader}>
                      <strong>{item.title}</strong>
                      {item.readAt === null ? <span className={styles.unreadTag}>Ungelesen</span> : null}
                    </div>
                    <p>{item.body}</p>
                    <div className={styles.itemFooter}>
                      <time dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleString('de-AT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                      {item.url ? <Link href={item.url}>Zum Inhalt</Link> : null}
                    </div>
                  </li>
                ))}
              </ul>
              {visible.page.pagination.hasNextPage ? (
                <div className={styles.more}>
                  <button type="button" disabled={loadingMore} onClick={() => void loadMore()}>
                    {loadingMore ? 'Wird geladen …' : 'Weitere Benachrichtigungen'}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          <p className={styles.hint}>
            Benachrichtigungen werden beim Öffnen noch nicht als gelesen markiert.
            Die Lesefunktion folgt in Phase 23.227.
          </p>
        </section>
      )}
    </div>
  );
}
