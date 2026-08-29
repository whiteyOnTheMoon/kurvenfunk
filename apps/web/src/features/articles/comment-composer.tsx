'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { COMMENT_BODY_MAX_LENGTH } from '@kurvenfunk/validation';
import { useAuth } from '../auth/auth-provider';
import styles from './comment-composer.module.css';

interface CreatedComment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    nickname: string | null;
  } | null;
}

interface CommentComposerProps {
  apiUrl: string;
  articleId: string;
  initialCommentCount: number;
}

interface ApiErrorBody {
  code?: string;
  message?: string;
}

export function CommentComposer({ apiUrl, articleId, initialCommentCount }: CommentComposerProps) {
  const { authenticated, initialized, login, token, user } = useAuth();
  const [body, setBody] = useState('');
  const [comments, setComments] = useState<CreatedComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const commentCount = commentsLoaded ? comments.length : initialCommentCount;

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/articles/${encodeURIComponent(articleId)}/comments`,
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          data?: CreatedComment[];
        };

        if (!cancelled && Array.isArray(payload.data)) {
          setComments(payload.data);
          setCommentsLoaded(true);
        }
      } catch {
        // The article remains usable even if comments cannot be loaded.
      }
    }

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, articleId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedBody = body.trim();

    if (!token || !user || user.status !== 'ACTIVE' || normalizedBody.length === 0) {
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      const response = await fetch(
        `${apiUrl}/api/v1/articles/${encodeURIComponent(articleId)}/comments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: normalizedBody,
          }),
        },
      );

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => undefined)) as
          ApiErrorBody | undefined;

        if (
          response.status === 403 &&
          (errorBody?.code === 'COMMENT_CREATE_FORBIDDEN' || errorBody?.code === 'ACCOUNT_BANNED')
        ) {
          throw new Error('COMMENT_CREATE_FORBIDDEN');
        }

        throw new Error('COMMENT_CREATE_FAILED');
      }

      const payload = (await response.json()) as {
        data?: CreatedComment;
      };

      if (!payload.data) {
        throw new Error('INVALID_COMMENT_RESPONSE');
      }

      setComments((current) => [...current, payload.data!]);
      setCommentsLoaded(true);
      setBody('');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'COMMENT_CREATE_FAILED';

      setError(
        message === 'COMMENT_CREATE_FORBIDDEN'
          ? 'Mit deinem aktuellen Accountstatus kannst du keine Kommentare schreiben.'
          : 'Dein Kommentar konnte nicht veröffentlicht werden. Bitte versuche es erneut.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.composer}>
      <p className={styles.count}>
        {commentCount === 0
          ? 'Zu diesem Artikel gibt es noch keine Beiträge.'
          : `${commentCount} ${commentCount === 1 ? 'Beitrag' : 'Beiträge'} zu diesem Artikel.`}
      </p>

      {!initialized ? (
        <div className={styles.notice}>Anmeldung wird geprüft …</div>
      ) : !authenticated ? (
        <div className={styles.notice}>
          <p>Melde dich an, um an der Diskussion teilzunehmen.</p>
          <button type="button" onClick={() => void login()}>
            Anmelden
          </button>
        </div>
      ) : user?.status !== 'ACTIVE' ? (
        <div className={styles.notice}>
          Mit deinem aktuellen Accountstatus kannst du keine Kommentare schreiben.
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor={`comment-${articleId}`}>Dein Kommentar</label>

          <textarea
            id={`comment-${articleId}`}
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              setError(undefined);
            }}
            maxLength={COMMENT_BODY_MAX_LENGTH}
            rows={5}
            disabled={submitting}
            placeholder="Was sagst du dazu?"
          />

          <div className={styles.actions}>
            <span>
              {body.length}/{COMMENT_BODY_MAX_LENGTH}
            </span>
            <button type="submit" disabled={submitting || body.trim().length === 0}>
              {submitting ? 'Wird veröffentlicht …' : 'Kommentar veröffentlichen'}
            </button>
          </div>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}

      {comments.length > 0 ? (
        <div className={styles.commentList}>
          {comments.map((comment) => (
            <article className={styles.createdComment} key={comment.id}>
              <div>
                <strong>{comment.author?.nickname ?? 'Kurvenfunk User'}</strong>
                <span>
                  {new Date(comment.createdAt).toLocaleString('de-AT', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <p>{comment.body}</p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
