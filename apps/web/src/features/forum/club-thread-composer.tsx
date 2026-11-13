'use client';

import { type FormEvent, useState } from 'react';
import {
  createForumThreadSchema,
  FORUM_THREAD_BODY_MAX_LENGTH,
  FORUM_THREAD_TITLE_MAX_LENGTH,
} from '@kurvenfunk/validation';

import { getCommentSpamErrorMessage } from '../articles/comment-spam-error';
import { useAuth } from '../auth/auth-provider';
import styles from './forum-overview.module.css';

interface ClubThreadComposerProps {
  apiUrl: string;
  forumSlug: string;
  onCreated: () => void;
}

function threadCreationError(code: unknown): string {
  const spamMessage = getCommentSpamErrorMessage(code);
  if (spamMessage) return spamMessage;
  switch (code) {
    case 'THREAD_CREATION_DISABLED':
      return 'In diesem Forum können derzeit keine Themen eröffnet werden.';
    case 'FORUM_NOT_FOUND':
      return 'Dieses Vereinsforum ist nicht mehr verfügbar.';
    case 'PERMISSION_FORBIDDEN':
    case 'ONBOARDING_REQUIRED':
      return 'Zum Eröffnen eines Themas benötigst du einen aktiven Account mit abgeschlossenem Onboarding.';
    default:
      return 'Dein Thema konnte nicht veröffentlicht werden. Bitte versuche es erneut.';
  }
}

export function ClubThreadComposer({ apiUrl, forumSlug, onCreated }: ClubThreadComposerProps) {
  const { authenticated, initialized, sessionRecovering, token, user } = useAuth();
  const [title, setTitle] = useState('');
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
        <a href="/login">Melde dich an</a>, um ein neues Thema zu eröffnen.
      </p>
    );
  }

  if (user.status !== 'ACTIVE' || !user.onboardingCompleted) {
    return (
      <p className={styles.empty}>
        Zum Eröffnen eines Themas benötigst du einen aktiven Account mit abgeschlossenem
        Onboarding.
      </p>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !token) return;

    const parsed = createForumThreadSchema.safeParse({ title, body });
    if (!parsed.success) {
      setError('Bitte gib einen Titel (mindestens 5 Zeichen) und einen Beitrag ein.');
      setSuccess(false);
      return;
    }

    setSubmitting(true);
    setError(undefined);
    setSuccess(false);
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads`,
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
          | { code?: string; message?: string }
          | undefined;
        throw new Error(threadCreationError(payload?.code));
      }
      const payload = (await response.json()) as { data?: { id?: unknown } };
      if (typeof payload.data?.id !== 'string') {
        throw new Error('Die Veröffentlichung konnte nicht bestätigt werden.');
      }

      setTitle('');
      setBody('');
      setSuccess(true);
      onCreated();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Dein Thema konnte nicht veröffentlicht werden. Bitte versuche es erneut.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.threadComposer}>
      <h3>Neues Diskussionsthema</h3>
      <form onSubmit={(event) => void submit(event)} className={styles.threadForm}>
        <label htmlFor="club-thread-title">Titel</label>
        <input
          id="club-thread-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength={5}
          maxLength={FORUM_THREAD_TITLE_MAX_LENGTH}
          placeholder="Worum geht es?"
          required
          disabled={submitting}
        />
        <label htmlFor="club-thread-body">Erster Beitrag</label>
        <textarea
          id="club-thread-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          minLength={1}
          maxLength={FORUM_THREAD_BODY_MAX_LENGTH}
          rows={5}
          placeholder="Starte eine sachliche Diskussion …"
          required
          disabled={submitting}
        />
        {error ? <p role="alert" className={styles.threadError}>{error}</p> : null}
        {success ? (
          <p role="status" className={styles.threadSuccess}>
            Das Thema wurde veröffentlicht und ist in der Übersicht sichtbar.
          </p>
        ) : null}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Wird veröffentlicht …' : 'Thema eröffnen'}
        </button>
      </form>
    </div>
  );
}
