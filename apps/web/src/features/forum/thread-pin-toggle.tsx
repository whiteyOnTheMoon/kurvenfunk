'use client';

import { useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import styles from './forum-overview.module.css';

export function ThreadPinToggle({
  apiUrl,
  forumSlug,
  threadSlug,
  pinnedAt,
  onChanged,
}: {
  apiUrl: string;
  forumSlug: string;
  threadSlug: string;
  pinnedAt: string | null;
  onChanged: () => void;
}) {
  const { authenticated, initialized, sessionRecovering, token, user } = useAuth();
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

  const pinned = pinnedAt !== null;
  const endpoint = `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads/${encodeURIComponent(threadSlug)}/pin`;

  async function toggle() {
    if (!token || saving) return;
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(endpoint, {
        method: pinned ? 'DELETE' : 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('THREAD_PIN_REQUEST_FAILED');
      const payload: unknown = await response.json();
      const data = (payload as { data?: { pinned?: unknown } }).data;
      if (data?.pinned !== !pinned) throw new Error('THREAD_PIN_RESPONSE_INVALID');
      onChanged();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.pinControls}>
      <button type="button" disabled={saving} aria-pressed={pinned} onClick={() => void toggle()}>
        {saving ? 'Wird aktualisiert …' : pinned ? 'Thema lösen' : 'Thema anpinnen'}
      </button>
      <span role="status">{pinned ? 'Dieses Thema ist angepinnt.' : 'Nicht angepinnt.'}</span>
      {error ? (
        <p role="alert">Der Pin-Status konnte nicht aktualisiert werden. Bitte erneut versuchen.</p>
      ) : null}
    </div>
  );
}
