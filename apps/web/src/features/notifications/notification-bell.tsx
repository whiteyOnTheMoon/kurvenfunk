'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import { fetchUnreadCount } from './notification-inbox-feed';
import styles from '../../components/layout/app-shell.module.css';

/** No storage, cross-account cache or anonymous counter request. */
export function NotificationBell({ apiUrl }: { apiUrl: string }) {
  const { initialized, authenticated, sessionRecovering, token } = useAuth();
  const [result, setResult] = useState<{ token: string; count: number } | null>(null);
  const enabled = initialized && authenticated && !sessionRecovering && !!token;

  useEffect(() => {
    const abort = new AbortController();
    if (enabled && token) {
      void fetchUnreadCount(apiUrl, token, abort.signal)
        .then((count) => {
          if (!abort.signal.aborted) setResult({ token, count });
        })
        .catch(() => {
          if (!abort.signal.aborted) setResult(null);
        });
    }
    return () => abort.abort();
  }, [apiUrl, enabled, token]);

  if (!enabled || !token) return null;
  const count = result?.token === token ? result.count : null;

  return (
    <Link
      href="/benachrichtigungen"
      className={styles.notificationLink}
      aria-label={
        count === null ? 'Benachrichtigungen' : 'Benachrichtigungen, ' + count + ' ungelesen'
      }
      title="Benachrichtigungen"
    >
      <span aria-hidden="true">🔔</span>
      {count !== null && count > 0 ? (
        <span className={styles.notificationCount} aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
