'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { createForumReplySchema, FORUM_THREAD_BODY_MAX_LENGTH } from '@kurvenfunk/validation';

import { getCommentSpamErrorMessage } from '../articles/comment-spam-error';
import { useAuth } from '../auth/auth-provider';
import styles from './forum-overview.module.css';

interface ThreadReplyComposerProps {
  apiUrl: string;
  forumSlug: string;
  threadSlug: string;
  parentPostId?: string;
  parentSequenceNumber?: number;
  onCancelParent: () => void;
  onCreated: () => void;
}

function replyErrorMessage(code: unknown, status: number): string {
  const spamError = getCommentSpamErrorMessage(code);
  if (spamError) return spamError;

  if (code === 'THREAD_LOCKED') return 'Dieses Thema ist für Antworten geschlossen.';
  if (code === 'PARENT_POST_UNAVAILABLE') {
    return 'Auf diesen Beitrag kann nicht mehr geantwortet werden.';
  }
  if (code === 'THREAD_REPLY_CONFLICT') {
    return 'Das Thema wurde gleichzeitig aktualisiert. Bitte versuche es erneut.';
  }
  if (status === 401 || status === 403) {
    return 'Deine Anmeldung oder deine Berechtigung ist nicht mehr gültig.';
  }
  if (status === 404) return 'Dieses Thema ist nicht mehr verfügbar.';
  return 'Deine Antwort konnte nicht veröffentlicht werden. Bitte versuche es erneut.';
}

export function ThreadReplyComposer({
  apiUrl,
  forumSlug,
  threadSlug,
  parentPostId,
  parentSequenceNumber,
  onCancelParent,
  onCreated,
}: ThreadReplyComposerProps) {
  const { authenticated, initialized, sessionRecovering, token, user } = useAuth();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  if (!initialized || sessionRecovering) {
    return <p className={styles.empty}>Anmeldestatus wird geprüft …</p>;
  }
  if (!authenticated || !user || !token) {
    return (
      <p className={styles.empty}>
        <Link href="/login">Melde dich an</Link>, um eine Antwort zu schreiben.
      </p>
    );
  }
  if (user.status !== 'ACTIVE' || !user.onboardingCompleted) {
    return (
      <p className={styles.empty}>
        Zum Antworten benötigst du einen aktiven Account mit abgeschlossenem Onboarding.
      </p>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !token) return;
    const parsed = createForumReplySchema.safeParse({ body, parentPostId });
    if (!parsed.success) {
      setError('Bitte gib eine Nachricht mit höchstens 5.000 Zeichen ein.');
      setSuccess(false);
      return;
    }
    setSubmitting(true);
    setError(undefined);
    setSuccess(false);
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads/${encodeURIComponent(threadSlug)}/posts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsed.data),
        },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => undefined)) as
          { code?: string } | undefined;
        throw new Error(replyErrorMessage(payload?.code, response.status));
      }
      const result = (await response.json()) as { data?: { id?: unknown } };
      if (typeof result.data?.id !== 'string') {
        throw new Error('Die Veröffentlichung konnte nicht bestätigt werden.');
      }
      setBody('');
      setSuccess(true);
      onCreated();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Deine Antwort konnte nicht veröffentlicht werden. Bitte versuche es erneut.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.threadComposer}>
      <h3>Antwort schreiben</h3>
      {parentPostId ? (
        <p className={styles.threadReplyContext}>
          Antwort auf Beitrag #{parentSequenceNumber}
          {' · '}
          <button type="button" disabled={submitting} onClick={onCancelParent}>
            Bezug entfernen
          </button>
        </p>
      ) : null}
      <form onSubmit={(event) => void submit(event)} className={styles.threadForm}>
        <label htmlFor="forum-reply-body">Deine Antwort</label>
        <textarea
          id="forum-reply-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={FORUM_THREAD_BODY_MAX_LENGTH}
          minLength={1}
          rows={5}
          required
          disabled={submitting}
          placeholder="Schreibe einen sachlichen Beitrag …"
        />
        {error ? (
          <p role="alert" className={styles.threadError}>
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" className={styles.threadSuccess}>
            Die Antwort wurde gespeichert. Die Beitragsliste wird aktualisiert.
          </p>
        ) : null}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Wird veröffentlicht …' : 'Antwort veröffentlichen'}
        </button>
      </form>
    </div>
  );
}
