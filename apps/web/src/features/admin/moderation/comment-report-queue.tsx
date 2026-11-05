'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/auth-provider';
import styles from './comment-report-queue.module.css';

interface CommentReport {
  id: string;
  status: 'OPEN' | 'IN_REVIEW';
  reason: string;
  details: string | null;
  createdAt: string;
  commentId: string | null;
  comment: {
    id: string;
    body: string;
    status: string;
    deletedAt: string | null;
    author: { nickname: string | null } | null;
    article: { slug: string; title: string };
  } | null;
}

type Resolution = 'ACTION_TAKEN' | 'NO_VIOLATION' | 'INSUFFICIENT_EVIDENCE' | 'ALREADY_HANDLED';

async function readPayload<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as {
    data?: T;
    error?: { message?: string };
  } | null;

  if (!response.ok || payload?.data === undefined) {
    if (response.status === 403) {
      throw new Error('Keine Berechtigung zur Bearbeitung von Kommentarmeldungen.');
    }
    throw new Error(payload?.error?.message ?? 'Die Moderationsaktion ist fehlgeschlagen.');
  }

  return payload.data;
}

export function CommentReportQueue({ apiUrl }: { apiUrl: string }) {
  const { authenticated, initialized, token } = useAuth();
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>();
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    if (!initialized) return;
    if (!authenticated || !token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(undefined);

    void (async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/moderation/comment-reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const items = await readPayload<CommentReport[]>(response);
        if (!cancelled) setReports(items);
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : 'Meldungen konnten nicht geladen werden.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, initialized, token]);

  async function resolveReport(report: CommentReport, resolution: Resolution) {
    if (!token || activeId) return;
    const note = notes[report.id]?.trim() ?? '';
    if (note.length < 3) {
      setError('Bitte zuerst eine interne Moderationsnotiz mit mindestens drei Zeichen eingeben.');
      return;
    }

    setActiveId(report.id);
    setError(undefined);
    setMessage(undefined);

    try {
      const authorization = { Authorization: `Bearer ${token}` };
      if (resolution === 'ACTION_TAKEN' && report.comment?.status === 'VISIBLE') {
        const deleteResponse = await fetch(
          `${apiUrl}/api/v1/moderation/comments/${encodeURIComponent(report.comment.id)}`,
          {
            method: 'DELETE',
            headers: { ...authorization, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: note }),
          },
        );
        await readPayload<unknown>(deleteResponse);
      }

      const response = await fetch(
        `${apiUrl}/api/v1/moderation/comment-reports/${encodeURIComponent(report.id)}/resolve`,
        {
          method: 'POST',
          headers: { ...authorization, 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution, moderatorNote: note }),
        },
      );
      await readPayload<unknown>(response);

      setReports((current) => current.filter((entry) => entry.id !== report.id));
      setMessage('Meldung abgeschlossen und Entscheidung protokolliert.');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Die Meldung konnte nicht abgeschlossen werden.',
      );
    } finally {
      setActiveId(undefined);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Community · Phase 19</p>
        <h1>Kommentarmeldungen</h1>
        <p>Offene Meldungen prüfen, Maßnahmen ergreifen und Entscheidungen dokumentieren.</p>
        <p>Weitere Moderationsfunktionen wie Karten und Sanktionen folgen in Phase 20.</p>
      </header>

      {!initialized || loading ? <p role="status">Meldungen werden geladen …</p> : null}
      {initialized && !authenticated ? (
        <p role="alert">Bitte mit einem Moderationskonto anmelden.</p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className={styles.message} role="status">
          {message}
        </p>
      ) : null}

      {!loading && authenticated && !error && reports.length === 0 ? (
        <p>Aktuell sind keine offenen Kommentarmeldungen vorhanden.</p>
      ) : null}

      <div className={styles.list}>
        {reports.map((report) => {
          const isBusy = Boolean(activeId);
          const note = notes[report.id] ?? '';
          const visible = report.comment?.status === 'VISIBLE' && !report.comment.deletedAt;

          return (
            <article key={report.id} className={styles.card}>
              <div className={styles.meta}>
                <strong>{report.reason.replaceAll('_', ' ')}</strong>
                <time dateTime={report.createdAt}>
                  {new Intl.DateTimeFormat('de-AT', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Europe/Vienna',
                  }).format(new Date(report.createdAt))}
                </time>
              </div>

              {report.comment ? (
                <>
                  <p>
                    Artikel:{' '}
                    <a href={`/artikel/${encodeURIComponent(report.comment.article.slug)}`}>
                      {report.comment.article.title}
                    </a>
                  </p>
                  <blockquote className={styles.comment}>{report.comment.body}</blockquote>
                  <p className={styles.meta}>Kommentarstatus: {report.comment.status}</p>
                </>
              ) : (
                <p>Der gemeldete Kommentar ist nicht mehr verfügbar.</p>
              )}

              {report.details ? (
                <p>
                  <strong>Hinweis:</strong> {report.details}
                </p>
              ) : null}

              <label className={styles.noteLabel} htmlFor={`report-note-${report.id}`}>
                Interne Moderationsnotiz
              </label>
              <textarea
                id={`report-note-${report.id}`}
                value={note}
                maxLength={1000}
                rows={3}
                disabled={isBusy}
                placeholder="Entscheidung kurz begründen (mindestens 3 Zeichen)"
                onChange={(event) => {
                  setNotes((current) => ({ ...current, [report.id]: event.target.value }));
                  setError(undefined);
                }}
              />

              <div className={styles.actions}>
                <button
                  disabled={isBusy || note.trim().length < 3}
                  onClick={() => void resolveReport(report, 'NO_VIOLATION')}
                >
                  Kein Verstoß
                </button>
                <button
                  disabled={isBusy || note.trim().length < 3}
                  onClick={() => void resolveReport(report, 'INSUFFICIENT_EVIDENCE')}
                >
                  Nicht ausreichend belegt
                </button>
                {report.comment ? (
                  <button
                    disabled={isBusy || note.trim().length < 3}
                    onClick={() =>
                      void resolveReport(report, visible ? 'ACTION_TAKEN' : 'ALREADY_HANDLED')
                    }
                  >
                    {visible ? 'Kommentar entfernen und abschließen' : 'Bereits bearbeitet'}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
