'use client';

import { type FormEvent, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import styles from './forum-overview.module.css';

const reasons = [
  ['SPAM', 'Spam oder Werbung'],
  ['HARASSMENT', 'Belästigung'],
  ['HATE_OR_ABUSE', 'Hass oder Beleidigung'],
  ['THREAT_OR_VIOLENCE', 'Drohung oder Gewalt'],
  ['PRIVACY', 'Privatsphäre'],
  ['IMPERSONATION', 'Identitätsmissbrauch'],
  ['ILLEGAL_CONTENT', 'Rechtswidriger Inhalt'],
  ['OFF_TOPIC', 'Themenfremd'],
  ['MISINFORMATION', 'Desinformation'],
  ['OTHER', 'Anderer Grund'],
] as const;

export function ForumPostReportButton({
  apiUrl,
  forumSlug,
  threadSlug,
  postId,
  authorId,
}: {
  apiUrl: string;
  forumSlug: string;
  threadSlug: string;
  postId: string;
  authorId: string | null;
}) {
  const { authenticated, initialized, sessionRecovering, token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof reasons)[number][0]>('SPAM');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<'idle' | 'reported' | 'duplicate' | 'error'>('idle');

  const allowed =
    initialized &&
    !sessionRecovering &&
    authenticated &&
    !!token &&
    user?.onboardingCompleted &&
    (user.status === 'ACTIVE' || user.status === 'LIMITED') &&
    authorId !== user.id;

  if (!allowed) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !token || details.trim().length > 1000) return;
    setSaving(true);
    setState('idle');
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads/${encodeURIComponent(threadSlug)}/posts/${encodeURIComponent(postId)}/reports`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason,
            ...(details.trim() ? { details: details.trim() } : {}),
          }),
        },
      );
      if (response.status === 409) {
        setState('duplicate');
        setOpen(false);
        return;
      }
      if (!response.ok) throw new Error('REPORT_FAILED');
      const payload: unknown = await response.json();
      if (typeof (payload as { data?: { id?: unknown } }).data?.id !== 'string') {
        throw new Error('REPORT_INVALID_RESPONSE');
      }
      setState('reported');
      setOpen(false);
    } catch {
      setState('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.postReport}>
      {state === 'reported' || state === 'duplicate' ? (
        <span role="status">
          {state === 'reported' ? 'Deine Meldung wurde übermittelt.' : 'Du hast diesen Beitrag bereits gemeldet.'}
        </span>
      ) : (
        <>
          <button type="button" disabled={saving} onClick={() => setOpen((value) => !value)}>
            {open ? 'Meldung schließen' : 'Beitrag melden'}
          </button>
          {open ? (
            <form onSubmit={(event) => void submit(event)} className={styles.threadForm}>
              <label htmlFor={'forum-report-reason-' + postId}>Meldegrund</label>
              <select
                id={'forum-report-reason-' + postId}
                value={reason}
                onChange={(event) => setReason(event.target.value as (typeof reasons)[number][0])}
                disabled={saving}
              >
                {reasons.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <label htmlFor={'forum-report-details-' + postId}>Details (optional)</label>
              <textarea
                id={'forum-report-details-' + postId}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                maxLength={1000}
                rows={3}
                disabled={saving}
                placeholder="Was sollte die Moderation prüfen?"
              />
              <button type="submit" disabled={saving}>
                {saving ? 'Wird übermittelt …' : 'Meldung absenden'}
              </button>
            </form>
          ) : null}
        </>
      )}
      {state === 'error' ? (
        <p role="alert">Die Meldung konnte nicht übermittelt werden. Bitte versuche es erneut.</p>
      ) : null}
    </div>
  );
}
