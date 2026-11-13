'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import styles from './forum-overview.module.css';

interface UnreadState {
  unread: boolean;
  lastReadSequenceNumber: number;
  latestSequenceNumber: number;
}

function parseStatus(payload: unknown): UnreadState {
  const state = (payload as { data?: Partial<UnreadState> })?.data;
  if (
    typeof state?.unread !== 'boolean' ||
    typeof state.lastReadSequenceNumber !== 'number' ||
    typeof state.latestSequenceNumber !== 'number'
  ) throw new Error('UNREAD_INVALID');
  return state as UnreadState;
}

export function ThreadUnreadToggle({
  apiUrl, forumSlug, threadSlug, revision,
}: {
  apiUrl: string; forumSlug: string; threadSlug: string; revision: number;
}) {
  const { authenticated, initialized, sessionRecovering, token, user } = useAuth();
  const [state, setState] = useState<{ token: string; status: UnreadState } | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const allowed = initialized && !sessionRecovering && authenticated &&
    !!token && user?.status === 'ACTIVE' && user.onboardingCompleted;
  const endpoint = `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads/${encodeURIComponent(threadSlug)}/unread`;
  const status = state?.token === token ? state.status : null;

  useEffect(() => {
    const controller = new AbortController();
    if (!allowed || !token) return () => controller.abort();
    setError(false);
    async function fetchStatus() {
      try {
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store', signal: controller.signal,
        });
        if (!response.ok) throw new Error('UNREAD_FETCH_FAILED');
        const parsed = parseStatus(await response.json());
        if (!controller.signal.aborted) setState({ token: token!, status: parsed });
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    void fetchStatus();
    return () => controller.abort();
  }, [allowed, endpoint, token, revision]);

  async function markRead() {
    if (!allowed || !token || !status?.unread || saving) return;
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(endpoint, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('UNREAD_WRITE_FAILED');
      setState({ token, status: parseStatus(await response.json()) });
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (!initialized || sessionRecovering) return null;
  if (!authenticated || !token || !user) return (
    <p className={styles.subscriptionHint}>
      <Link href="/login">Melde dich an</Link>, um deinen Lesestand zu sehen.
    </p>
  );
  if (!allowed) return null;
  return (
    <div className={styles.unreadControls}>
      <span role="status">{status === null ? 'Lesestand wird geladen …' :
        status.unread ? 'Dieses Thema enthält ungelesene Beiträge.' : 'Alle bekannten Beiträge gelesen.'}</span>
      {status?.unread ? (
        <button type="button" disabled={saving} onClick={() => void markRead()}>
          {saving ? 'Wird markiert …' : 'Als gelesen markieren'}
        </button>
      ) : null}
      {error ? <p role="alert">Lesestand konnte nicht geladen oder gespeichert werden. Bitte aktualisiere die Seite.</p> : null}
    </div>
  );
}
