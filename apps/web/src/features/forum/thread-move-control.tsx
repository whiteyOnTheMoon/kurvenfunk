'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import styles from './forum-overview.module.css';

interface MoveTarget {
  id: string;
  name: string;
  slug: string;
  clubSlug: string;
}

function parseClubTargets(payload: unknown, sourceSlug: string): MoveTarget[] {
  if (!payload || typeof payload !== 'object') throw new Error('INVALID_FORUM_CATEGORIES');
  const categories = (payload as { data?: unknown }).data;
  if (!Array.isArray(categories)) throw new Error('INVALID_FORUM_CATEGORIES');
  const targets: MoveTarget[] = [];
  for (const category of categories) {
    if (!category || typeof category !== 'object') continue;
    const forums = (category as { forums?: unknown }).forums;
    if (!Array.isArray(forums)) continue;
    for (const value of forums) {
      if (!value || typeof value !== 'object') continue;
      const forum = value as {
        id?: unknown;
        name?: unknown;
        slug?: unknown;
        club?: { slug?: unknown } | null;
      };
      if (
        typeof forum.id === 'string' &&
        typeof forum.name === 'string' &&
        typeof forum.slug === 'string' &&
        typeof forum.club?.slug === 'string' &&
        forum.slug !== sourceSlug
      ) {
        targets.push({
          id: forum.id,
          name: forum.name,
          slug: forum.slug,
          clubSlug: forum.club.slug,
        });
      }
    }
  }
  return targets;
}

export function ThreadMoveControl({
  apiUrl,
  forumSlug,
  threadSlug,
}: {
  apiUrl: string;
  forumSlug: string;
  threadSlug: string;
}) {
  const router = useRouter();
  const { authenticated, initialized, sessionRecovering, token, user } = useAuth();
  const [targets, setTargets] = useState<MoveTarget[]>([]);
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [targetsError, setTargetsError] = useState(false);

  const canModerate =
    initialized &&
    !sessionRecovering &&
    authenticated &&
    !!token &&
    user?.status === 'ACTIVE' &&
    user.onboardingCompleted &&
    user.roles.some((role) => role === 'MODERATOR' || role === 'ADMIN' || role === 'SUPERADMIN');

  useEffect(() => {
    if (!canModerate) return;
    const controller = new AbortController();

    async function loadTargets() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/forums/categories`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('MOVE_TARGETS_REQUEST_FAILED');
        const payload: unknown = await response.json();
        const rows = parseClubTargets(payload, forumSlug);
        if (!controller.signal.aborted) setTargets(rows);
      } catch {
        if (!controller.signal.aborted) setTargetsError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadTargets();
    return () => controller.abort();
  }, [canModerate, apiUrl, forumSlug]);

  if (!canModerate) return null;

  const invalidReason = reason.trim().length > 0 && reason.trim().length < 5;
  const target = targets.find((item) => item.id === targetId);

  async function move() {
    if (!token || !target || saving || invalidReason) return;
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads/${encodeURIComponent(threadSlug)}/move`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetForumId: target.id,
            ...(reason.trim() ? { reason: reason.trim() } : {}),
          }),
        },
      );
      if (!response.ok) throw new Error('MOVE_THREAD_REQUEST_FAILED');
      const payload: unknown = await response.json();
      const moved = (payload as { data?: { moved?: unknown; forum?: { id?: unknown } } }).data;
      if (moved?.moved !== true || moved.forum?.id !== target.id) {
        throw new Error('MOVE_THREAD_RESPONSE_INVALID');
      }
      router.push(
        `/forum/verein/${encodeURIComponent(target.clubSlug)}/thema/${encodeURIComponent(threadSlug)}`,
      );
    } catch {
      setError(true);
      setSaving(false);
    }
  }

  return (
    <div className={styles.pinControls}>
      <label htmlFor="thread-move-target">Thema verschieben nach</label>
      <select
        id="thread-move-target"
        value={targetId}
        onChange={(event) => setTargetId(event.target.value)}
        disabled={loading || saving || targetsError}
      >
        <option value="">Zielforum auswählen</option>
        {targets.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <label htmlFor="thread-move-reason">Begründung (optional)</label>
      <input
        id="thread-move-reason"
        type="text"
        value={reason}
        maxLength={500}
        onChange={(event) => setReason(event.target.value)}
        disabled={saving}
      />
      <button
        type="button"
        disabled={!target || saving || invalidReason}
        onClick={() => void move()}
      >
        {saving ? 'Wird verschoben …' : 'Thema verschieben'}
      </button>
      {loading ? <span role="status">Zielforen werden geladen …</span> : null}
      {!loading && !targetsError && targets.length === 0 ? (
        <span>Kein anderes öffentliches Vereinsforum verfügbar.</span>
      ) : null}
      {invalidReason ? <p role="alert">Eine Begründung muss mindestens 5 Zeichen haben.</p> : null}
      {targetsError ? <p role="alert">Zielforen sind derzeit nicht verfügbar.</p> : null}
      {error ? <p role="alert">Das Thema konnte nicht verschoben werden.</p> : null}
    </div>
  );
}
