'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '../auth/auth-provider';
import styles from './forum-overview.module.css';

interface ReportItem {
  id: string;
  postId: string | null;
  status: 'OPEN' | 'IN_REVIEW';
  reason: string;
  details: string | null;
  createdAt: string;
  post: {
    id: string;
    content: string | null;
    deleted: boolean;
    thread: {
      title: string;
      slug: string;
      forum: { slug: string; club: { slug: string } | null };
    };
  } | null;
}

const resolutions = [
  ['NO_VIOLATION', 'Kein Verstoß'],
  ['INSUFFICIENT_EVIDENCE', 'Unzureichende Belege'],
  ['ALREADY_HANDLED', 'Bereits erledigt'],
  ['DUPLICATE', 'Doppelte Meldung'],
  ['INVALID_REPORT', 'Ungültige Meldung'],
  ['OTHER', 'Sonstiger Abschluss'],
  ['ACTION_TAKEN', 'Maßnahme durchgeführt'],
] as const;

function ReportReview({
  report,
  token,
  apiUrl,
  reload,
}: {
  report: ReportItem;
  token: string;
  apiUrl: string;
  reload: () => void;
}) {
  const [resolution, setResolution] = useState<(typeof resolutions)[number][0]>('NO_VIOLATION');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [removed, setRemoved] = useState(false);
  const post = report.post;

  async function action(kind: 'remove' | 'resolve') {
    if (saving || note.trim().length < (kind === 'remove' ? 5 : 3) || note.trim().length > 1000) {
      setError(true);
      return;
    }
    if (kind === 'remove' && (!confirmed || !report.postId || post?.deleted)) return;
    if (kind === 'resolve' && resolution === 'ACTION_TAKEN' && !post?.deleted) return;
    setSaving(true);
    setError(false);
    try {
      const endpoint =
        kind === 'remove'
          ? `${apiUrl}/api/v1/moderation/forum-posts/${encodeURIComponent(report.postId!)}/remove`
          : `${apiUrl}/api/v1/moderation/forum-post-reports/${encodeURIComponent(report.id)}/resolve`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(
          kind === 'remove' ? { reason: note.trim() } : { resolution, moderatorNote: note.trim() },
        ),
      });
      if (!response.ok) throw new Error('MODERATION_WRITE_FAILED');
      const payload: unknown = await response.json();
      if (
        kind === 'remove' &&
        typeof (payload as { data?: { removed?: unknown } }).data?.removed !== 'boolean'
      ) {
        throw new Error('MODERATION_INVALID_RESPONSE');
      }
      if (kind === 'remove') setRemoved(true);
      reload();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const link = post?.thread.forum.club?.slug
    ? `/forum/verein/${encodeURIComponent(post.thread.forum.club.slug)}/thema/${encodeURIComponent(post.thread.slug)}`
    : null;

  return (
    <article className={styles.threadPost}>
      <h3>{post?.thread.title ?? 'Beitrag nicht mehr verfügbar'}</h3>
      <p>
        Grund: <strong>{report.reason}</strong> · Eingang:{' '}
        <time dateTime={report.createdAt}>
          {new Date(report.createdAt).toLocaleString('de-AT')}
        </time>
      </p>
      {report.details ? <p>Hinweis: {report.details}</p> : null}
      {post?.deleted ? (
        <p>Beitrag wurde entfernt; ursprünglicher Inhalt ist ausgeblendet.</p>
      ) : (
        <p className={styles.threadPostBody}>{post?.content ?? 'Beitrag nicht verfügbar.'}</p>
      )}
      {link ? (
        <p>
          <Link href={link}>Zum Thema</Link>
        </p>
      ) : null}
      <div className={styles.threadForm}>
        <label htmlFor={'forum-review-note-' + report.id}>Moderationsnotiz (intern)</label>
        <textarea
          id={'forum-review-note-' + report.id}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          minLength={3}
          maxLength={1000}
          rows={3}
          disabled={saving}
        />
        {!post?.deleted && report.postId ? (
          <>
            <label>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={saving}
              />
              Entfernung ausdrücklich bestätigen
            </label>
            <button
              type="button"
              disabled={!confirmed || saving}
              onClick={() => void action('remove')}
            >
              Beitrag moderiert entfernen
            </button>
          </>
        ) : null}
        <label htmlFor={'forum-review-decision-' + report.id}>Entscheidung</label>
        <select
          id={'forum-review-decision-' + report.id}
          value={resolution}
          onChange={(event) => setResolution(event.target.value as (typeof resolutions)[number][0])}
          disabled={saving}
        >
          {resolutions.map(([value, label]) => (
            <option key={value} value={value} disabled={value === 'ACTION_TAKEN' && !post?.deleted}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" disabled={saving} onClick={() => void action('resolve')}>
          Fall abschließen
        </button>
        {removed ? <p role="status">Beitrag wurde entfernt. Bitte Fall abschließen.</p> : null}
        {error ? (
          <p role="alert">
            Änderung nicht möglich. Prüfe die Notiz und den aktuellen Moderationsstatus.
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function ForumReportQueue({ apiUrl }: { apiUrl: string }) {
  const { authenticated, initialized, sessionRecovering, token, user } = useAuth();
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);

  const canModerate =
    initialized &&
    !sessionRecovering &&
    authenticated &&
    !!token &&
    user?.status === 'ACTIVE' &&
    user.onboardingCompleted &&
    user.roles.some((role) => role === 'MODERATOR' || role === 'ADMIN' || role === 'SUPERADMIN');

  useEffect(() => {
    if (!canModerate || !token) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`${apiUrl}/api/v1/moderation/forum-post-reports`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('QUEUE_FAILED');
        const payload: unknown = await response.json();
        const data = (payload as { data?: unknown }).data;
        if (!Array.isArray(data)) throw new Error('QUEUE_INVALID');
        if (!controller.signal.aborted) setItems(data as ReportItem[]);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [apiUrl, canModerate, token, revision]);

  if (!initialized || sessionRecovering) return <p>Moderationsberechtigung wird geprüft …</p>;
  if (!canModerate || !token) return <p>Für diesen Bereich fehlen die Berechtigungen.</p>;

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Forum-Moderation</p>
        <h1>Offene Beitragsmeldungen</h1>
        <p>
          Geschützte Warteschlange für gemeldete Forenbeiträge. Entscheidungen werden auditiert.
        </p>
      </header>
      <section className={styles.threadDetail} aria-label="Moderationsmeldungen">
        {loading ? <p className={styles.status}>Meldungen werden geladen …</p> : null}
        {error ? (
          <p role="alert" className={styles.status}>
            Meldungen konnten nicht geladen werden.
          </p>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <p className={styles.empty}>Keine offenen Forenmeldungen.</p>
        ) : null}
        {!loading &&
          !error &&
          items.map((item) => (
            <ReportReview
              key={item.id}
              report={item}
              token={token}
              apiUrl={apiUrl}
              reload={() => setRevision((value) => value + 1)}
            />
          ))}
      </section>
    </main>
  );
}
