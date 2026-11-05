'use client';

import { type FormEvent, useId, useRef, useState } from 'react';
import { REPORT_REASONS, submitCommentReport, type ReportReason } from './comment-report-client';
import styles from './comment-report.module.css';

interface CommentReportProps {
  apiUrl: string;
  commentId: string;
  authorId: string | null;
  userId?: string;
  userStatus?: 'ACTIVE' | 'LIMITED' | 'BANNED';
  token?: string;
}

export function CommentReport({
  apiUrl,
  commentId,
  authorId,
  userId,
  userStatus,
  token,
}: CommentReportProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogId = useId();

  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState(false);
  const [error, setError] = useState<string>();
  const [feedback, setFeedback] = useState<string>();

  const canReport =
    Boolean(token && userId) &&
    authorId !== userId &&
    (userStatus === 'ACTIVE' || userStatus === 'LIMITED');

  function openDialog() {
    if (!canReport || reported) return;

    setReason('');
    setDetails('');
    setError(undefined);

    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }

  function closeDialog() {
    if (submitting) return;

    dialogRef.current?.close();
    setError(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canReport || !token || !reason || submitting || reported) {
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      const result = await submitCommentReport({
        apiUrl,
        commentId,
        token,
        reason,
        details,
      });

      if (result === 'already_reported') {
        setReported(true);
        setFeedback('Du hast diesen Kommentar bereits gemeldet.');
        dialogRef.current?.close();
        return;
      }

      if (result === 'forbidden') {
        setError('Mit deinem aktuellen Accountstatus ist diese Meldung nicht erlaubt.');
        return;
      }

      if (result === 'failed') {
        setError('Die Meldung konnte nicht gesendet werden. Bitte versuche es erneut.');
        return;
      }

      setReported(true);
      setFeedback('Vielen Dank! Deine Meldung wurde übermittelt.');
      dialogRef.current?.close();
    } catch {
      setError('Die Meldung konnte nicht gesendet werden. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!canReport) {
    return null;
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.trigger}
        disabled={reported}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        onClick={openDialog}
      >
        {reported ? 'Gemeldet' : 'Melden'}
      </button>

      {feedback ? (
        <span className={styles.feedback} role="status">
          {feedback}
        </span>
      ) : null}

      <dialog
        ref={dialogRef}
        id={dialogId}
        className={styles.dialog}
        aria-labelledby={`${dialogId}-title`}
        onCancel={(event) => {
          if (submitting) {
            event.preventDefault();
          }
        }}
      >
        <div className={styles.dialogHeader}>
          <h3 id={`${dialogId}-title`}>Kommentar melden</h3>

          <button
            type="button"
            className={styles.closeButton}
            disabled={submitting}
            aria-label="Meldeformular schließen"
            onClick={closeDialog}
          >
            ×
          </button>
        </div>

        <p className={styles.description}>
          Warum möchtest du diesen Kommentar melden? Deine Meldung wird zur Moderation gespeichert.
        </p>

        <form
          className={styles.form}
          aria-busy={submitting}
          onSubmit={(event) => void handleSubmit(event)}
        >
          <label htmlFor={`${dialogId}-reason`}>Meldegrund</label>

          <select
            id={`${dialogId}-reason`}
            value={reason}
            required
            disabled={submitting}
            onChange={(event) => {
              setReason(event.target.value as ReportReason | '');
              setError(undefined);
            }}
          >
            <option value="">Bitte Meldegrund auswählen</option>

            {REPORT_REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <label htmlFor={`${dialogId}-details`}>Zusätzliche Informationen (optional)</label>

          <textarea
            id={`${dialogId}-details`}
            value={details}
            maxLength={1000}
            rows={4}
            disabled={submitting}
            placeholder="Beschreibe das Problem genauer …"
            onChange={(event) => {
              setDetails(event.target.value);
              setError(undefined);
            }}
          />

          <span className={styles.characterCount}>{details.length}/1000 Zeichen</span>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              disabled={submitting}
              onClick={closeDialog}
            >
              Abbrechen
            </button>

            <button type="submit" className={styles.submitButton} disabled={submitting || !reason}>
              {submitting ? 'Wird gesendet …' : 'Meldung absenden'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
