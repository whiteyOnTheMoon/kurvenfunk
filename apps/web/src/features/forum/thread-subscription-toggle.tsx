'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import styles from './forum-overview.module.css';

export function ThreadSubscriptionToggle({
  apiUrl,
  forumSlug,
  threadSlug,
}: {
  apiUrl: string;
  forumSlug: string;
  threadSlug: string;
}) {
  const { authenticated, initialized, sessionRecovering, token, user } = useAuth();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const canSubscribe =
    initialized &&
    !sessionRecovering &&
    authenticated &&
    !!token &&
    user?.status === 'ACTIVE' &&
    user.onboardingCompleted;
  const endpoint = `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads/${encodeURIComponent(threadSlug)}/subscription`;

  useEffect(() => {
    const controller = new AbortController();
    setSubscribed(null);
    setError(false);
    if (!canSubscribe || !token) return () => controller.abort();

    async function load() {
      setLoading(true);
      try {
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('SUBSCRIPTION_FETCH_FAILED');
        const payload: unknown = await response.json();
        const data = (payload as { data?: { subscribed?: unknown } }).data;
        if (typeof data?.subscribed !== 'boolean') throw new Error('SUBSCRIPTION_INVALID');
        if (!controller.signal.aborted) setSubscribed(data.subscribed);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [canSubscribe, endpoint, token]);

  async function toggle() {
    if (!token || !canSubscribe || subscribed === null || saving) return;
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(endpoint, {
        method: subscribed ? 'DELETE' : 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('SUBSCRIPTION_WRITE_FAILED');
      const payload: unknown = await response.json();
      const data = (payload as { data?: { subscribed?: unknown } }).data;
      if (typeof data?.subscribed !== 'boolean' || data.subscribed === subscribed) {
        throw new Error('SUBSCRIPTION_INVALID');
      }
      setSubscribed(data.subscribed);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (!initialized || sessionRecovering) {
    return <p className={styles.subscriptionHint}>Anmeldestatus wird geprüft …</p>;
  }
  if (!authenticated || !user || !token) {
    return (
      <p className={styles.subscriptionHint}>
        <Link href="/login">Melde dich an</Link>, um dieses Thema zu abonnieren.
      </p>
    );
  }
  if (!canSubscribe) {
    return (
      <p className={styles.subscriptionHint}>
        Themen-Abonnements erfordern einen aktiven Account mit abgeschlossenem Onboarding.
      </p>
    );
  }

  return (
    <div className={styles.subscriptionControls}>
      <button
        type="button"
        aria-pressed={subscribed === true}
        disabled={loading || saving || subscribed === null}
        onClick={() => void toggle()}
      >
        {saving
          ? 'Abo wird aktualisiert …'
          : loading || subscribed === null
            ? 'Abo-Status wird geladen …'
            : subscribed
              ? 'Themen-Abo beenden'
              : 'Thema abonnieren'}
      </button>
      {subscribed !== null ? (
        <span role="status">
          {subscribed ? 'Du hast dieses Thema abonniert.' : 'Du hast dieses Thema nicht abonniert.'}
        </span>
      ) : null}
      {error ? (
        <p role="alert">
          Das Abonnement konnte nicht geladen oder geändert werden. Bitte lade die Seite erneut.
        </p>
      ) : null}
    </div>
  );
}
