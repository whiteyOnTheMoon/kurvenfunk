'use client';

import { useRef, useState } from 'react';
import styles from './comment-voting.module.css';

export type VoteType = 'UPVOTE' | 'DOWNVOTE';

export interface VoteSummary {
  commentId: string;
  upvotes: number;
  downvotes: number;
  score: number;
  viewerVote: VoteType | null;
}

interface Voter {
  userId: string;
  nickname: string | null;
  avatarUrl: string | null;
  type: VoteType;
}

interface VotersResponse {
  items: Voter[];
  nextCursor: string | null;
}

interface CommentVotingProps {
  apiUrl: string;
  commentId: string;
  authorId: string | null;
  userId?: string;
  userStatus?: 'ACTIVE' | 'LIMITED' | 'BANNED';
  token?: string;
  summary: VoteSummary;
  onVoteChange?: (summary: VoteSummary) => void;
}

const PAGE_SIZE = 20;

async function readData<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { data?: T };

  if (payload.data === undefined) {
    throw new Error('Ungültige API-Antwort');
  }

  return payload.data;
}

export function CommentVoting({
  apiUrl,
  commentId,
  authorId,
  userId,
  userStatus,
  token,
  summary,
  onVoteChange,
}: CommentVotingProps) {
  const [localVotes, setLocalVotes] = useState(summary);

  // The parent owns voting state when an update callback is provided.
  const votes = onVoteChange ? summary : localVotes;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [votersError, setVotersError] = useState<string>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const requestRef = useRef(0);

  const canVote =
    Boolean(token && userId) &&
    (userStatus === 'ACTIVE' || userStatus === 'LIMITED') &&
    authorId !== userId;

  async function handleVote(type: VoteType) {
    if (!canVote || !token || submitting) return;

    setSubmitting(true);
    setError(undefined);

    try {
      const removing = votes.viewerVote === type;

      const response = await fetch(
        `${apiUrl}/api/v1/comments/${encodeURIComponent(commentId)}/votes`,
        {
          method: removing ? 'DELETE' : 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            ...(!removing ? { 'Content-Type': 'application/json' } : {}),
          },
          ...(!removing ? { body: JSON.stringify({ type }) } : {}),
        },
      );

      const updated = await readData<VoteSummary>(response);
      setLocalVotes(updated);
      onVoteChange?.(updated);
    } catch {
      setError('Deine Stimme konnte nicht gespeichert werden.');
    } finally {
      setSubmitting(false);
    }
  }

  async function loadVoters(cursor?: string) {
    if (!token) return;

    const requestId = ++requestRef.current;

    setLoadingVoters(true);
    setVotersError(undefined);

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
      });

      if (cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(
        `${apiUrl}/api/v1/comments/${encodeURIComponent(commentId)}/votes/voters?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await readData<VotersResponse>(response);

      if (requestId !== requestRef.current) return;

      setVoters((current) => (cursor ? [...current, ...result.items] : result.items));
      setNextCursor(result.nextCursor);
    } catch {
      if (requestId === requestRef.current) {
        setVotersError('Die Abstimmungen konnten nicht geladen werden.');
      }
    } finally {
      if (requestId === requestRef.current) {
        setLoadingVoters(false);
      }
    }
  }

  function openVoters() {
    if (!token) return;

    setVoters([]);
    setNextCursor(null);
    setVotersError(undefined);

    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }

    void loadVoters();
  }

  return (
    <div className={styles.container}>
      <div className={styles.controls} aria-label="Kommentar bewerten">
        <button
          type="button"
          className={votes.viewerVote === 'UPVOTE' ? styles.selected : styles.vote}
          aria-label="Kommentar positiv bewerten"
          aria-pressed={votes.viewerVote === 'UPVOTE'}
          disabled={!canVote || submitting}
          onClick={() => void handleVote('UPVOTE')}
        >
          ▲
        </button>

        <button
          type="button"
          className={styles.count}
          disabled={!token}
          onClick={openVoters}
          aria-label={`${votes.upvotes} Upvotes – Abstimmende anzeigen`}
        >
          {votes.upvotes}
        </button>

        <span className={styles.score} aria-label={`${votes.score} Punkte`}>
          {votes.score} Punkte
        </span>

        <button
          type="button"
          className={votes.viewerVote === 'DOWNVOTE' ? styles.selected : styles.vote}
          aria-label="Kommentar negativ bewerten"
          aria-pressed={votes.viewerVote === 'DOWNVOTE'}
          disabled={!canVote || submitting}
          onClick={() => void handleVote('DOWNVOTE')}
        >
          ▼
        </button>

        <button
          type="button"
          className={styles.count}
          disabled={!token}
          onClick={openVoters}
          aria-label={`${votes.downvotes} Downvotes – Abstimmende anzeigen`}
        >
          {votes.downvotes}
        </button>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label="Abstimmungen zu diesem Kommentar"
        onClose={() => {
          requestRef.current += 1;
        }}
      >
        <div className={styles.dialogHeader}>
          <strong>Abstimmungen · {votes.upvotes + votes.downvotes}</strong>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Dialog schließen"
          >
            ✕
          </button>
        </div>

        <div className={styles.voters} aria-live="polite">
          {voters.map((voter) => (
            <div className={styles.voter} key={voter.userId}>
              <div className={styles.voterIdentity}>
                {voter.avatarUrl ? (
                  // User profile avatars can have different external hosts.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.avatar}
                    src={voter.avatarUrl}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className={styles.avatarPlaceholder} aria-hidden="true">
                    {voter.nickname?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                )}

                <span className={styles.nickname}>{voter.nickname ?? 'Kurvenfunk User'}</span>
              </div>

              <span
                className={voter.type === 'UPVOTE' ? styles.upvoteSymbol : styles.downvoteSymbol}
                aria-label={voter.type === 'UPVOTE' ? 'Upvote' : 'Downvote'}
                title={voter.type === 'UPVOTE' ? 'Upvote' : 'Downvote'}
              >
                {voter.type === 'UPVOTE' ? '▲' : '▼'}
              </span>
            </div>
          ))}

          {!loadingVoters && voters.length === 0 && !votersError ? (
            <p>Noch keine Stimmen vorhanden.</p>
          ) : null}

          {votersError ? (
            <p className={styles.error} role="alert">
              {votersError}
            </p>
          ) : null}

          {loadingVoters ? <p>Wird geladen …</p> : null}

          {nextCursor && !loadingVoters ? (
            <button
              type="button"
              className={styles.loadMore}
              onClick={() => void loadVoters(nextCursor)}
            >
              Weitere anzeigen
            </button>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
