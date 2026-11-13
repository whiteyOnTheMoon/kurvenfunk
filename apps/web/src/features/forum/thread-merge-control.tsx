'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import styles from './forum-overview.module.css';

interface MergeTarget {
  id: string;
  title: string;
  slug: string;
}

function parseTargets(value: unknown): {
  items: MergeTarget[];
  nextCursor: string | null;
} {
  if (!value || typeof value !== 'object') throw new Error('INVALID_MERGE_TARGETS');
  const page = (value as { data?: unknown }).data;
  if (!page || typeof page !== 'object') throw new Error('INVALID_MERGE_PAGE');
  const result = page as { items?: unknown; nextCursor?: unknown; hasMore?: unknown };
  if (
    !Array.isArray(result.items) ||
    result.items.some(
      (row: unknown) =>
        !row ||
        typeof row !== 'object' ||
        typeof (row as Partial<MergeTarget>).id !== 'string' ||
        typeof (row as Partial<MergeTarget>).title !== 'string' ||
        typeof (row as Partial<MergeTarget>).slug !== 'string',
    ) ||
    typeof result.hasMore !== 'boolean' ||
    (result.hasMore
      ? typeof result.nextCursor !== 'string'
      : result.nextCursor !== null)
  ) {
    throw new Error('INVALID_MERGE_PAGE');
  }
  return {
    items: result.items as MergeTarget[],
    nextCursor: result.nextCursor as string | null,
  };
}

export function ThreadMergeControl({
  apiUrl,
  forumSlug,
  threadSlug,
  threadId,
  clubSlug,
}: {
  apiUrl: string;
  forumSlug: string;
  threadSlug: string;
  threadId: string;
  clubSlug: string;
}) {
  const router = useRouter();
  const { authenticated, initialized, sessionRecovering, token, user } = useAuth();
  const [targets, setTargets] = useState<MergeTarget[]>([]);
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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

  const endpoint = `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads`;

  useEffect(() => {
    if (!canModerate) return;
    const controller = new AbortController();

    async function loadTargets() {
      try {
        const response = await fetch(endpoint, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('MERGE_TARGETS_REQUEST_FAILED');
        const page = parseTargets(await response.json());
        if (!controller.signal.aborted) {
          setTargets(page.items.filter((item) => item.id !== threadId));
          setNextCursor(page.nextCursor);
        }
      } catch {
        if (!controller.signal.aborted) setTargetsError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadTargets();
    return () => controller.abort();
  }, [canModerate, endpoint, threadId]);

  if (!canModerate) return null;

  const target = targets.find((item) => item.id === targetId);
  const invalidReason = reason.trim().length > 0 && reason.trim().length < 5;

  async function loadMore() {
    if (!nextCursor || loadingMore || saving) return;
    setLoadingMore(true);
    setTargetsError(false);
    try {
      const response = await fetch(`${endpoint}?cursor=${encodeURIComponent(nextCursor)}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('MERGE_TARGETS_PAGE_FAILED');
      const page = parseTargets(await response.json());
      setTargets((previous) => {
        const ids = new Set(previous.map((item) => item.id));
        return [
          ...previous,
          ...page.items.filter((item) => item.id !== threadId && !ids.has(item.id)),
        ];
      });
      setNextCursor(page.nextCursor);
    } catch {
      setTargetsError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  async function merge() {
    if (!token || !target || !confirmed || invalidReason || saving) return;
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(`${endpoint}/${encodeURIComponent(threadSlug)}/merge`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetThreadId: target.id,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        }),
      });
      if (!response.ok) throw new Error('MERGE_THREAD_REQUEST_FAILED');
      const payload: unknown = await response.json();
      const merged = (payload as {
        data?: { target?: { id?: unknown; slug?: unknown; forumSlug?: unknown } };
      }).data;
      if (
        merged?.target?.id !== target.id ||
        merged.target.slug !== target.slug ||
        merged.target.forumSlug !== forumSlug
      ) {
        throw new Error('MERGE_THREAD_RESPONSE_INVALID');
      }
      router.replace(
        `/forum/verein/${encodeURIComponent(clubSlug)}/thema/${encodeURIComponent(target.slug)}`,
      );
    } catch {
      setError(true);
      setSaving(false);
    }
  }

  return (
    <div className={styles.pinControls}>
      <label htmlFor="thread-merge-target">Thema zusammenführen mit</label>
      <select
        id="thread-merge-target"
        value={targetId}
        onChange={(event) => {
          setTargetId(event.target.value);
          setConfirmed(false);
        }}
        disabled={loading || saving}
      >
        <option value="">Bestehendes Zielthema auswählen</option>
        {targets.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      {nextCursor ? (
        <button type="button" disabled={loadingMore || saving} onClick={() => void loadMore()}>
          {loadingMore ? 'Weitere Themen werden geladen …' : 'Weitere Zielthemen laden'}
        </button>
      ) : null}
      <label htmlFor="thread-merge-reason">Moderationsgrund (optional)</label>
      <input
        id="thread-merge-reason"
        type="text"
        value={reason}
        maxLength={500}
        onChange={(event) => setReason(event.target.value)}
        disabled={saving}
      />
      <label>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          disabled={saving}
        />
        Ich bestätige, dass Beiträge und Abonnements in das Zielthema übernommen werden.
      </label>
      <button
        type="button"
        disabled={!target || !confirmed || invalidReason || saving}
        onClick={() => void merge()}
      >
        {saving ? 'Themen werden zusammengeführt …' : 'Themen endgültig zusammenführen'}
      </button>
      {loading ? <span role="status">Mögliche Zielthemen werden geladen …</span> : null}
      {invalidReason ? (
        <p role="alert">Ein Moderationsgrund muss mindestens 5 Zeichen enthalten.</p>
      ) : null}
      {targetsError ? <p role="alert">Zielthemen konnten nicht geladen werden.</p> : null}
      {error ? <p role="alert">Die Themen konnten nicht zusammengeführt werden.</p> : null}
    </div>
  );
}
