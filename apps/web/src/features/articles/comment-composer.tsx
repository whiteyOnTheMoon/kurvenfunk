'use client';

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { COMMENT_BODY_MAX_LENGTH } from '@kurvenfunk/validation';
import { useAuth } from '../auth/auth-provider';
import { CommentVoting, type VoteSummary } from './comment-voting';
import { CommentReport } from './comment-report';
import { type CommentSortMode } from './comment-sort';
import { fetchCommentPage, mergeCommentPages } from './comment-pagination-client';
import styles from './comment-composer.module.css';

const MAX_COMMENT_DISPLAY_DEPTH = 5;

interface CreatedComment {
  id: string;
  status: 'VISIBLE' | 'DELETED';
  parentId: string | null;
  depth: number;
  body: string;
  editedAt: string | null;
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
  const [voteSummaries, setVoteSummaries] = useState<Record<string, VoteSummary>>({});
  const [commentSort, setCommentSort] = useState<CommentSortMode>('newest');
  const voteRevisions = useRef<Record<string, number>>({});
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [commentsLoadError, setCommentsLoadError] = useState<string>();
  const [countDelta, setCountDelta] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const requestVersion = useRef(0);
  const loadMoreAbort = useRef<AbortController | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [replyingTo, setReplyingTo] = useState<string>();
  const [replyBody, setReplyBody] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string>();
  const [editingCommentId, setEditingCommentId] = useState<string>();
  const [editBody, setEditBody] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string>();
  const [deletingCommentId, setDeletingCommentId] = useState<string>();
  const [deleteError, setDeleteError] = useState<string>();
  const [deleteErrorCommentId, setDeleteErrorCommentId] = useState<string>();

  // The article's total count must not shrink to the loaded page size.
  const commentCount = Math.max(0, initialCommentCount + countDelta);

  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;

    loadMoreAbort.current?.abort();
    loadMoreAbort.current = null;

    async function loadFirstPage() {
      try {
        const page = await fetchCommentPage<CreatedComment>(
          apiUrl,
          articleId,
          commentSort,
          undefined,
          controller.signal,
        );

        if (controller.signal.aborted || version !== requestVersion.current) {
          return;
        }

        setComments(page.items);
        setNextCursor(page.pagination.hasNextPage ? page.pagination.nextCursor : null);
        setCommentsLoaded(true);
      } catch {
        if (!controller.signal.aborted && version === requestVersion.current) {
          setCommentsLoadError('Kommentare konnten nicht geladen werden.');
        }
      } finally {
        if (!controller.signal.aborted && version === requestVersion.current) {
          setCommentsLoading(false);
        }
      }
    }

    void loadFirstPage();

    return () => {
      controller.abort();
      loadMoreAbort.current?.abort();
    };
  }, [apiUrl, articleId, commentSort, reloadKey]);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore || commentsLoading || loadMoreAbort.current) {
      return;
    }

    const controller = new AbortController();
    const version = requestVersion.current;

    loadMoreAbort.current = controller;

    setLoadingMore(true);
    setCommentsLoadError(undefined);

    try {
      const page = await fetchCommentPage<CreatedComment>(
        apiUrl,
        articleId,
        commentSort,
        nextCursor,
        controller.signal,
      );

      if (controller.signal.aborted || version !== requestVersion.current) {
        return;
      }

      setComments((current) => mergeCommentPages(current, page.items));

      setNextCursor(page.pagination.hasNextPage ? page.pagination.nextCursor : null);
    } catch {
      if (!controller.signal.aborted && version === requestVersion.current) {
        setCommentsLoadError('Weitere Kommentare konnten nicht geladen werden.');
      }
    } finally {
      if (loadMoreAbort.current === controller) {
        loadMoreAbort.current = null;
      }

      if (version === requestVersion.current) {
        setLoadingMore(false);
      }
    }
  }

  function resetCommentPage() {
    setComments([]);
    setCommentsLoaded(false);
    setCommentsLoading(true);
    setLoadingMore(false);
    setNextCursor(null);
    setCommentsLoadError(undefined);
  }

  function refreshComments() {
    requestVersion.current += 1;
    loadMoreAbort.current?.abort();
    resetCommentPage();
    setReloadKey((current) => current + 1);
  }

  const visibleCommentIds = comments
    .filter((comment) => comment.status === 'VISIBLE')
    .map((comment) => comment.id)
    .join(',');

  useEffect(() => {
    if (!visibleCommentIds) {
      return;
    }

    let cancelled = false;
    const revisionsAtRequestStart = { ...voteRevisions.current };

    async function loadVoteSummaries() {
      const ids = visibleCommentIds.split(',');
      const summaries: Record<string, VoteSummary> = {};

      try {
        // The API accepts a maximum of 100 comment IDs per request.
        for (let offset = 0; offset < ids.length; offset += 100) {
          const batch = ids.slice(offset, offset + 100);

          const endpoint = authenticated && token ? 'reactions/comments/me' : 'reactions/comments';

          const response = await fetch(
            `${apiUrl}/api/v1/${endpoint}?ids=${encodeURIComponent(batch.join(','))}`,
            {
              cache: 'no-store',
              ...(authenticated && token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
            },
          );

          if (!response.ok) {
            throw new Error('VOTE_SUMMARIES_FAILED');
          }

          const payload = (await response.json()) as {
            data?: VoteSummary[];
          };

          if (!Array.isArray(payload.data)) {
            throw new Error('INVALID_VOTE_SUMMARIES');
          }

          for (const summary of payload.data) {
            summaries[summary.commentId] = summary;
          }
        }

        if (!cancelled) {
          setVoteSummaries((current) => {
            const merged = { ...summaries };

            // Never overwrite a vote changed while this request was running.
            for (const commentId of Object.keys(summaries)) {
              const previousRevision = revisionsAtRequestStart[commentId] ?? 0;

              const currentRevision = voteRevisions.current[commentId] ?? 0;

              if (currentRevision > previousRevision && current[commentId]) {
                merged[commentId] = current[commentId];
              }
            }

            return merged;
          });
        }
      } catch {
        // Comments remain usable if voting data cannot be loaded.
      }
    }

    void loadVoteSummaries();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, token, visibleCommentIds]);

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

      setCountDelta((current) => current + 1);
      setBody('');
      refreshComments();
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

  async function handleReplySubmit(event: FormEvent<HTMLFormElement>, parentId: string) {
    event.preventDefault();

    const normalizedBody = replyBody.trim();

    if (!token || !user || user.status !== 'ACTIVE' || normalizedBody.length === 0) {
      return;
    }

    setReplySubmitting(true);
    setReplyError(undefined);

    try {
      const response = await fetch(
        `${apiUrl}/api/v1/articles/${encodeURIComponent(articleId)}/comments/${encodeURIComponent(parentId)}/replies`,
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
          (errorBody?.code === 'COMMENT_REPLY_FORBIDDEN' || errorBody?.code === 'ACCOUNT_BANNED')
        ) {
          throw new Error('COMMENT_REPLY_FORBIDDEN');
        }

        throw new Error('COMMENT_REPLY_FAILED');
      }

      const payload = (await response.json()) as {
        data?: CreatedComment;
      };

      if (!payload.data) {
        throw new Error('INVALID_REPLY_RESPONSE');
      }

      setComments((current) => [...current, payload.data!]);
      setCommentsLoaded(true);
      setCountDelta((current) => current + 1);
      setReplyBody('');
      setReplyingTo(undefined);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'COMMENT_REPLY_FAILED';

      setReplyError(
        message === 'COMMENT_REPLY_FORBIDDEN'
          ? 'Mit deinem aktuellen Accountstatus kannst du keine Antworten schreiben.'
          : 'Deine Antwort konnte nicht veröffentlicht werden. Bitte versuche es erneut.',
      );
    } finally {
      setReplySubmitting(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>, commentId: string) {
    event.preventDefault();

    const comment = comments.find((candidate) => candidate.id === commentId);
    const normalizedBody = editBody.trim();

    if (
      !comment ||
      !token ||
      !user ||
      user.status !== 'ACTIVE' ||
      comment.author?.id !== user.id ||
      normalizedBody.length === 0 ||
      normalizedBody === comment.body
    ) {
      return;
    }

    setEditSubmitting(true);
    setEditError(undefined);

    try {
      const response = await fetch(
        `${apiUrl}/api/v1/articles/${encodeURIComponent(articleId)}/comments/${encodeURIComponent(commentId)}`,
        {
          method: 'PATCH',
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
          (errorBody?.code === 'COMMENT_EDIT_FORBIDDEN' || errorBody?.code === 'ACCOUNT_BANNED')
        ) {
          throw new Error('COMMENT_EDIT_FORBIDDEN');
        }

        throw new Error('COMMENT_EDIT_FAILED');
      }

      const payload = (await response.json()) as {
        data?: CreatedComment;
      };

      if (!payload.data) {
        throw new Error('INVALID_COMMENT_RESPONSE');
      }

      const updatedComment = payload.data;

      setComments((current) =>
        current.map((candidate) =>
          candidate.id === updatedComment.id ? updatedComment : candidate,
        ),
      );
      setEditingCommentId(undefined);
      setEditBody('');
      setEditError(undefined);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'COMMENT_EDIT_FAILED';

      setEditError(
        message === 'COMMENT_EDIT_FORBIDDEN'
          ? 'Du kannst diesen Kommentar nicht bearbeiten.'
          : 'Dein Kommentar konnte nicht gespeichert werden. Bitte versuche es erneut.',
      );
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    const comment = comments.find((candidate) => candidate.id === commentId);

    if (
      !comment ||
      comment.status !== 'VISIBLE' ||
      !token ||
      !user ||
      user.status === 'BANNED' ||
      comment.author?.id !== user.id ||
      deletingCommentId
    ) {
      return;
    }

    if (!window.confirm('Möchtest du diesen Kommentar wirklich löschen?')) {
      return;
    }

    setDeletingCommentId(commentId);
    setDeleteError(undefined);
    setDeleteErrorCommentId(undefined);

    try {
      const response = await fetch(
        `${apiUrl}/api/v1/articles/${encodeURIComponent(articleId)}/comments/${encodeURIComponent(commentId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('COMMENT_DELETE_FAILED');
      }

      // Remove deleted leaves immediately. Preserve deleted parents
      // as anonymized placeholders while visible descendants exist.
      setComments((current) => {
        const hasVisibleDescendant = (parentId: string, visited = new Set<string>()): boolean => {
          if (visited.has(parentId)) {
            return false;
          }

          visited.add(parentId);

          const children = current.filter((candidate) => candidate.parentId === parentId);

          return children.some(
            (child) =>
              child.status === 'VISIBLE' || hasVisibleDescendant(child.id, new Set(visited)),
          );
        };

        if (!hasVisibleDescendant(commentId)) {
          return current.filter((candidate) => candidate.id !== commentId);
        }

        return current.map((candidate) =>
          candidate.id === commentId
            ? {
                ...candidate,
                status: 'DELETED',
                body: '',
                author: null,
                editedAt: null,
              }
            : candidate,
        );
      });

      if (editingCommentId === commentId) {
        setEditingCommentId(undefined);
        setEditBody('');
        setEditError(undefined);
      }

      if (replyingTo === commentId) {
        setReplyingTo(undefined);
        setReplyBody('');
        setReplyError(undefined);
      }

      setCountDelta((current) => current - 1);
      refreshComments();
    } catch {
      setDeleteErrorCommentId(commentId);
      setDeleteError('Der Kommentar konnte nicht gelöscht werden. Bitte versuche es erneut.');
    } finally {
      setDeletingCommentId(undefined);
    }
  }

  function renderComment(comment: CreatedComment, displayDepth = 0): ReactNode {
    const isDeleted = comment.status === 'DELETED';

    const replies = comments
      .filter((candidate) => candidate.parentId === comment.id)
      .sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );

    return (
      <div className={styles.commentBranch} key={comment.id}>
        <article className={styles.createdComment}>
          {!isDeleted ? (
            <div className={styles.commentMeta}>
              <strong>{comment.author?.nickname ?? 'Kurvenfunk User'}</strong>
              <span>
                {new Date(comment.createdAt).toLocaleString('de-AT', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </span>
              {comment.editedAt ? <span>bearbeitet</span> : null}
            </div>
          ) : null}

          {isDeleted ? (
            <p className={styles.deletedComment}>Kommentar gelöscht</p>
          ) : editingCommentId === comment.id ? (
            <form
              className={styles.editForm}
              onSubmit={(event) => void handleEditSubmit(event, comment.id)}
            >
              <label htmlFor={`edit-${comment.id}`}>Kommentar bearbeiten</label>

              <textarea
                id={`edit-${comment.id}`}
                value={editBody}
                onChange={(event) => {
                  setEditBody(event.target.value);
                  setEditError(undefined);
                }}
                maxLength={COMMENT_BODY_MAX_LENGTH}
                rows={4}
                disabled={editSubmitting}
                autoFocus
              />

              <div className={styles.editActions}>
                <span>
                  {editBody.length}/{COMMENT_BODY_MAX_LENGTH}
                </span>

                <div className={styles.editButtons}>
                  <button
                    className={styles.cancelButton}
                    type="button"
                    disabled={editSubmitting}
                    onClick={() => {
                      setEditingCommentId(undefined);
                      setEditBody('');
                      setEditError(undefined);
                    }}
                  >
                    Abbrechen
                  </button>

                  <button
                    type="submit"
                    disabled={
                      editSubmitting ||
                      editBody.trim().length === 0 ||
                      editBody.trim() === comment.body
                    }
                  >
                    {editSubmitting ? 'Wird gespeichert …' : 'Speichern'}
                  </button>
                </div>
              </div>

              {editError ? (
                <p className={styles.error} role="alert">
                  {editError}
                </p>
              ) : null}
            </form>
          ) : (
            <p>{comment.body}</p>
          )}

          {!isDeleted && voteSummaries[comment.id] ? (
            <CommentVoting
              apiUrl={apiUrl}
              commentId={comment.id}
              authorId={comment.author?.id ?? null}
              userId={authenticated ? user?.id : undefined}
              userStatus={user?.status}
              token={authenticated ? token : undefined}
              summary={voteSummaries[comment.id]}
              onVoteChange={(updated) => {
                voteRevisions.current[updated.commentId] =
                  (voteRevisions.current[updated.commentId] ?? 0) + 1;

                setVoteSummaries((current) => ({
                  ...current,
                  [updated.commentId]: updated,
                }));

                if (commentSort === 'popular') {
                  refreshComments();
                }
              }}
            />
          ) : null}

          {!isDeleted ? (
            <div className={styles.commentActions}>
              <CommentReport
                apiUrl={apiUrl}
                commentId={comment.id}
                userId={authenticated ? user?.id : undefined}
                userStatus={user?.status}
                token={authenticated ? token : undefined}
              />

              {authenticated &&
              user &&
              user.status !== 'BANNED' &&
              comment.author?.id === user.id ? (
                <button
                  className={styles.deleteButton}
                  type="button"
                  disabled={Boolean(deletingCommentId)}
                  onClick={() => void handleDelete(comment.id)}
                >
                  {deletingCommentId === comment.id ? 'Wird gelöscht …' : 'Löschen'}
                </button>
              ) : null}

              {authenticated &&
              user?.status === 'ACTIVE' &&
              comment.author?.id === user.id &&
              editingCommentId !== comment.id &&
              deletingCommentId !== comment.id ? (
                <button
                  className={styles.editButton}
                  type="button"
                  onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditBody(comment.body);
                    setEditError(undefined);

                    if (replyingTo === comment.id) {
                      setReplyingTo(undefined);
                      setReplyBody('');
                      setReplyError(undefined);
                    }
                  }}
                >
                  Bearbeiten
                </button>
              ) : null}

              {authenticated &&
              user?.status === 'ACTIVE' &&
              editingCommentId !== comment.id &&
              deletingCommentId !== comment.id ? (
                <button
                  className={styles.replyButton}
                  type="button"
                  onClick={() => {
                    if (replyingTo === comment.id) {
                      setReplyingTo(undefined);
                      setReplyBody('');
                      setReplyError(undefined);
                      return;
                    }

                    setReplyingTo(comment.id);
                    setReplyBody('');
                    setReplyError(undefined);

                    if (editingCommentId === comment.id) {
                      setEditingCommentId(undefined);
                      setEditBody('');
                      setEditError(undefined);
                    }
                  }}
                >
                  {replyingTo === comment.id ? 'Abbrechen' : 'Antworten'}
                </button>
              ) : null}
            </div>
          ) : null}

          {deleteError && deleteErrorCommentId === comment.id ? (
            <p className={styles.error} role="alert">
              {deleteError}
            </p>
          ) : null}

          {!isDeleted && replyingTo === comment.id ? (
            <form
              className={styles.replyForm}
              onSubmit={(event) => void handleReplySubmit(event, comment.id)}
            >
              <label htmlFor={`reply-${comment.id}`}>
                Antwort an {comment.author?.nickname ?? 'Kurvenfunk User'}
              </label>

              <textarea
                id={`reply-${comment.id}`}
                value={replyBody}
                onChange={(event) => {
                  setReplyBody(event.target.value);
                  setReplyError(undefined);
                }}
                maxLength={COMMENT_BODY_MAX_LENGTH}
                rows={3}
                disabled={replySubmitting}
                placeholder="Deine Antwort …"
                autoFocus
              />

              <div className={styles.replyActions}>
                <span>
                  {replyBody.length}/{COMMENT_BODY_MAX_LENGTH}
                </span>
                <button type="submit" disabled={replySubmitting || replyBody.trim().length === 0}>
                  {replySubmitting ? 'Wird veröffentlicht …' : 'Antwort veröffentlichen'}
                </button>
              </div>

              {replyError ? (
                <p className={styles.error} role="alert">
                  {replyError}
                </p>
              ) : null}
            </form>
          ) : null}
        </article>

        {replies.length > 0 ? (
          <div
            className={
              displayDepth < MAX_COMMENT_DISPLAY_DEPTH ? styles.replies : styles.repliesAtDepthLimit
            }
          >
            {replies.map((reply) => renderComment(reply, displayDepth + 1))}
          </div>
        ) : null}
      </div>
    );
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

      {comments.length > 0 || commentCount > 0 || commentsLoading || commentsLoadError ? (
        <>
          <div className={styles.sortControls}>
            <label htmlFor={`comment-sort-${articleId}`}>Sortieren nach</label>

            <select
              id={`comment-sort-${articleId}`}
              value={commentSort}
              onChange={(event) => {
                requestVersion.current += 1;
                loadMoreAbort.current?.abort();
                resetCommentPage();

                setCommentSort(event.target.value as CommentSortMode);
              }}
            >
              <option value="newest">Neueste</option>
              <option value="oldest">Älteste</option>
              <option value="popular">Beliebt</option>
            </select>
          </div>

          <div className={styles.commentList}>
            {comments
              .filter((comment) => comment.parentId === null)
              .map((comment) => renderComment(comment))}
          </div>

          {commentsLoading ? (
            <p className={styles.paginationMessage} role="status">
              Kommentare werden geladen …
            </p>
          ) : null}

          {commentsLoadError ? (
            <p className={styles.error} role="alert">
              {commentsLoadError}
            </p>
          ) : null}

          {commentsLoaded && nextCursor ? (
            <div className={styles.paginationActions}>
              <button type="button" disabled={loadingMore} onClick={() => void handleLoadMore()}>
                {loadingMore ? 'Weitere Kommentare werden geladen …' : 'Weitere Kommentare laden'}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
