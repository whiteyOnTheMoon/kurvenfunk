'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import styles from './forum-overview.module.css';

interface UnreadState {
  unread: boolean;
  lastReadSequenceNumber: number;
  latestSequenceNumber: number;
  lastReadPostId?: string | null;
}

function parseStatus(payload: unknown): UnreadState {
  const state = (payload as { data?: Partial<UnreadState> })?.data;
  if (
    typeof state?.unread !== 'boolean' ||
    typeof state.lastReadSequenceNumber !== 'number' ||
    typeof state.latestSequenceNumber !== 'number'
  )
    throw new Error('UNREAD_INVALID');
  return state as UnreadState;
}

export function ThreadUnreadToggle({
  apiUrl,
  forumSlug,
  threadSlug,
  revision,
  posts,
}: {
  apiUrl: string;
  forumSlug: string;
  threadSlug: string;
  revision: number;
  posts: { id: string; sequenceNumber: number; deleted: boolean }[];
}) {
  const { authenticated, initialized, sessionRecovering, token, user } = useAuth();
  const [state, setState] = useState<{ key: string; status: UnreadState } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [chosenPost, setChosenPost] = useState<{ key: string; postId: string } | null>(null);
  const allowed =
    initialized &&
    !sessionRecovering &&
    authenticated &&
    !!token &&
    user?.status === 'ACTIVE' &&
    user.onboardingCompleted;
  const endpoint = `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads/${encodeURIComponent(threadSlug)}/unread`;
  // A user switch, token renewal or new thread revision must not inherit old
  // account state, form selections or error messages, even for a single render.
  const requestKey = allowed && user && token ? `${user.id}:${token}:${revision}` : null;
  const status = state?.key === requestKey ? state.status : null;
  const chosenPostId = chosenPost?.key === requestKey ? chosenPost.postId : '';
  const error = failedKey === requestKey;

  useEffect(() => {
    const controller = new AbortController();
    if (!allowed || !token || !requestKey) return () => controller.abort();
    const key: string = requestKey;
    async function fetchStatus() {
      try {
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('UNREAD_FETCH_FAILED');
        const parsed = parseStatus(await response.json());
        if (!controller.signal.aborted) setState({ key, status: parsed });
      } catch {
        if (!controller.signal.aborted) setFailedKey(requestKey);
      }
    }
    void fetchStatus();
    return () => controller.abort();
  }, [allowed, endpoint, requestKey, token]);

  async function markRead() {
    if (!allowed || !token || !requestKey || !status?.unread || saving) return;
    setSaving(true);
    setFailedKey(null);
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('UNREAD_WRITE_FAILED');
      setState({ key: requestKey, status: parseStatus(await response.json()) });
    } catch {
      setFailedKey(requestKey);
    } finally {
      setSaving(false);
    }
  }

  async function setReadPosition() {
    if (!allowed || !token || !requestKey || !chosenPostId || saving) return;
    setSaving(true);
    setFailedKey(null);
    try {
      const response = await fetch(endpoint.slice(0, -'/unread'.length) + '/read-position', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: chosenPostId }),
      });
      if (!response.ok) throw new Error('READ_POSITION_WRITE_FAILED');
      setState({ key: requestKey, status: parseStatus(await response.json()) });
      setChosenPost(null);
    } catch {
      setFailedKey(requestKey);
    } finally {
      setSaving(false);
    }
  }

  if (!initialized || sessionRecovering) return null;
  if (!authenticated || !token || !user)
    return (
      <p className={styles.subscriptionHint}>
        <Link href="/login">Melde dich an</Link>, um deinen Lesestand zu sehen.
      </p>
    );
  if (!allowed) return null;
  return (
    <div className={styles.unreadControls}>
      <span role="status">
        {status === null
          ? 'Lesestand wird geladen …'
          : status.unread
            ? 'Dieses Thema enthält ungelesene Beiträge.'
            : 'Alle bekannten Beiträge gelesen.'}
      </span>
      {status !== null ? (
        <span>
          Leseposition:{' '}
          {status.lastReadSequenceNumber
            ? `Beitrag #${status.lastReadSequenceNumber}`
            : 'noch keiner'}
        </span>
      ) : null}
      {status && posts.some((post) => !post.deleted) ? (
        <>
          <label htmlFor="thread-read-position">Zuletzt gelesener Beitrag</label>
          <select
            id="thread-read-position"
            value={chosenPostId}
            onChange={(event) =>
              requestKey && setChosenPost({ key: requestKey, postId: event.target.value })
            }
            disabled={saving}
          >
            <option value="">Beitrag auswählen</option>
            {posts
              .filter((post) => !post.deleted)
              .map((post) => (
                <option value={post.id} key={post.id}>
                  Beitrag #{post.sequenceNumber}
                </option>
              ))}
          </select>
          <button
            type="button"
            disabled={saving || !chosenPostId}
            onClick={() => void setReadPosition()}
          >
            {saving ? 'Speichert …' : 'Leseposition speichern'}
          </button>
        </>
      ) : null}
      {status?.unread ? (
        <button type="button" disabled={saving} onClick={() => void markRead()}>
          {saving ? 'Wird markiert …' : 'Als gelesen markieren'}
        </button>
      ) : null}
      {error ? (
        <p role="alert">
          Lesestand konnte nicht geladen oder gespeichert werden. Bitte aktualisiere die Seite.
        </p>
      ) : null}
    </div>
  );
}
