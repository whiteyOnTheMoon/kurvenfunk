'use client';

import { useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import styles from './forum-overview.module.css';

export function ThreadLockToggle({
  apiUrl,
  forumSlug,
  threadSlug,
  locked,
  onChanged,
}: {
  apiUrl: string;
  forumSlug: string;
  threadSlug: string;
  locked: boolean;
  onChanged: () => void;
}) {
  const { authenticated, initialized, sessionRecovering, token, user } = useAuth();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const canModerate =
    initialized &&
    !sessionRecovering &&
    authenticated &&
    !!token &&
    user?.status === 'ACTIVE' &&
    user.onboardingCompleted &&
    user.roles.some((role) => role === 'MODERATOR' || role === 'ADMIN' || role === 'SUPERADMIN');

  if (!canModerate) return null;

  const endpoint = `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads/${encodeURIComponent(threadSlug)}/lock`;
  const invalidReason = !locked && reason.trim().length > 0 && reason.trim().length < 5;

  async function toggle() {
    if (!token || saving || invalidReason) return;
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(endpoint, {
        method: locked ? 'DELETE' : 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(locked ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(locked ? {} : { body: JSON.stringify(reason.trim() ? { reason: reason.trim() } : {}) }),
      });
      if (!response.ok) throw new Error('THREAD_LOCK_REQUEST_FAILED');
      const payload: unknown = await response.json();
      const data = (payload as { data?: { locked?: unknown; status?: unknown } }).data;
      if (data?.locked !== !locked || data.status !== (locked ? 'OPEN' : 'LOCKED')) {
        throw new Error('THREAD_LOCK_RESPONSE_INVALID');
      }
      setReason('');
      onChanged();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.pinControls}>
      {!locked ? (
        <label>
          Moderationsgrund (optional)
          <input
            type="text"
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={saving}
          />
        </label>
      ) : null}
      <button
        type="button"
        disabled={saving || invalidReason}
        aria-pressed={locked}
        onClick={() => void toggle()}
      >
        {saving ? 'Wird aktualisiert …' : locked ? 'Thema entsperren' : 'Thema sperren'}
      </button>
      <span role="status">
        {locked ? 'Antworten sind derzeit gesperrt.' : 'Antworten sind erlaubt.'}
      </span>
      {invalidReason ? <p role="alert">Ein Moderationsgrund muss mindestens 5 Zeichen haben.</p> : null}
      {error ? (
        <p role="alert">Der Sperrstatus konnte nicht geändert werden. Bitte erneut versuchen.</p>
      ) : null}
    </div>
  );
}
