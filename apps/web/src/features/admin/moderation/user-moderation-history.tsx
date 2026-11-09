'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '../../auth/auth-provider';
import styles from './user-moderation-history.module.css';

interface Bucket<T> {
  items: T[];
  hasMore: boolean;
}

interface Report {
  id: string;
  targetType: string;
  reason: string;
  details: string | null;
  status: string;
  resolution: string | null;
  moderatorNote: string | null;
  assignedModeratorId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

interface Card {
  id: string;
  type: string;
  status: string;
  reasonCode: string;
  userMessage: string | null;
  moderatorNote: string | null;
  escalationSource: string;
  sourceType: string;
  moderatorId: string | null;
  issuedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
}

interface Sanction {
  id: string;
  type: string;
  status: string;
  reasonCode: string;
  userMessage: string | null;
  internalNote: string | null;
  sourceCardId: string | null;
  sourceReportId: string | null;
  createdById: string | null;
  startsAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
}

interface StatusEvent {
  id: string;
  action: 'USER_STATUS_CHANGED';
  actorType: string;
  occurredAt: string;
}

interface History {
  user: { id: string; nickname: string | null; status: string; createdAt: string };
  reports: Bucket<Report>;
  cards: Bucket<Card>;
  sanctions: Bucket<Sanction>;
  statusEvents: Bucket<StatusEvent>;
}

const formatter = new Intl.DateTimeFormat('de-AT', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Vienna',
});

function timestamp(value: string | null) {
  return value ? formatter.format(new Date(value)) : 'Nicht festgelegt';
}

function ConfidentialNote({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  // React text rendering escapes user-supplied notes. Never render note HTML.
  return (
    <div className={styles.note}>
      <strong>{label}</strong>
      <p>{value}</p>
    </div>
  );
}

function ListHeading({
  title,
  count,
  hasMore,
}: {
  title: string;
  count: number;
  hasMore: boolean;
}) {
  return (
    <>
      <h2>
        {title} ({count}
        {hasMore ? '+' : ''})
      </h2>
      {hasMore ? (
        <p className={styles.hint}>Angezeigt werden die 50 neuesten Einträge dieser Kategorie.</p>
      ) : null}
    </>
  );
}

export function UserModerationHistory({ apiUrl, userId }: { apiUrl: string; userId: string }) {
  const { token, authenticated, initialized } = useAuth();
  const [history, setHistory] = useState<History>();
  const [requestedId, setRequestedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [reload, setReload] = useState(0);
  const canShow = authenticated && initialized && requestedId === userId && !loading && !error;

  useEffect(() => {
    if (!initialized || !authenticated || !token) {
      return;
    }
    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/moderation/users/${encodeURIComponent(userId)}/history`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          if (response.status === 404) throw new Error('Dieses Nutzerkonto wurde nicht gefunden.');
          if (response.status === 401 || response.status === 403) {
            throw new Error('Keine Berechtigung für vertrauliche Moderationshistorien.');
          }
          throw new Error('Die Moderationshistorie konnte nicht geladen werden.');
        }
        const json = (await response.json()) as { data?: History };
        if (!json.data || json.data.user.id !== userId) {
          throw new Error('Ungültige Antwort der Moderationshistorie.');
        }
        if (!cancelled) {
          setHistory(json.data);
          setRequestedId(userId);
          setError(undefined);
        }
      } catch (cause) {
        if (!cancelled) {
          setHistory(undefined);
          setError(cause instanceof Error ? cause.message : 'Unbekannter Ladefehler.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      setHistory(undefined);
    };
  }, [apiUrl, userId, initialized, authenticated, token, reload]);

  if (!initialized || !authenticated) {
    return <p role="status">Moderationsberechtigung wird geprüft …</p>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link href="/admin/moderation">← Zur Moderationsübersicht</Link>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setReload((x) => x + 1);
          }}
        >
          Neu laden
        </button>
      </div>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>Vertraulich · nur Moderation</p>
        <h1>Nutzer-Moderationshistorie</h1>
        <p>
          Interne Fallnotizen und frühere Maßnahmen. Nicht öffentlich oder für Betroffene
          freigegeben.
        </p>
      </header>
      {loading ? <p role="status">Historie wird geladen …</p> : null}
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      {canShow && history ? (
        <>
          <section className={styles.summary}>
            <h2>{history.user.nickname || 'Konto ohne Anzeigenamen'}</h2>
            <p>
              Status: <strong>{history.user.status}</strong>
            </p>
            <p>
              Konto-ID: <code>{history.user.id}</code>
            </p>
            <p>Erstellt: {timestamp(history.user.createdAt)}</p>
          </section>

          <section className={styles.section}>
            <ListHeading
              title="Meldungen über dieses Konto"
              count={history.reports.items.length}
              hasMore={history.reports.hasMore}
            />
            {history.reports.items.length === 0 ? (
              <p>Keine Meldungen.</p>
            ) : (
              <ul className={styles.list}>
                {history.reports.items.map((report) => (
                  <li key={report.id} className={styles.card}>
                    <strong>
                      {report.reason.replaceAll('_', ' ')} · {report.status}
                    </strong>
                    <span>
                      {report.targetType} · {timestamp(report.createdAt)}
                    </span>
                    {report.resolution ? <span>Entscheidung: {report.resolution}</span> : null}
                    <ConfidentialNote label="Meldungsdetails" value={report.details} />
                    <ConfidentialNote
                      label="Interne Moderationsnotiz"
                      value={report.moderatorNote}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section}>
            <ListHeading
              title="Karten"
              count={history.cards.items.length}
              hasMore={history.cards.hasMore}
            />
            {history.cards.items.length === 0 ? (
              <p>Keine Karten.</p>
            ) : (
              <ul className={styles.list}>
                {history.cards.items.map((card) => (
                  <li key={card.id} className={styles.card}>
                    <strong>
                      {card.type} · {card.status}
                    </strong>
                    <span>
                      {card.reasonCode.replaceAll('_', ' ')} · {timestamp(card.issuedAt)}
                    </span>
                    <span>
                      Ablauf: {timestamp(card.expiresAt)} · Eskalation: {card.escalationSource}
                    </span>
                    {card.revokedAt ? <span>Widerrufen: {timestamp(card.revokedAt)}</span> : null}
                    <ConfidentialNote label="Interne Moderationsnotiz" value={card.moderatorNote} />
                    <ConfidentialNote label="Nutzer-Nachricht" value={card.userMessage} />
                    <ConfidentialNote label="Widerrufsgrund" value={card.revocationReason} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section}>
            <ListHeading
              title="Sanktionen und frühere Kontosperren"
              count={history.sanctions.items.length}
              hasMore={history.sanctions.hasMore}
            />
            {history.sanctions.items.length === 0 ? (
              <p>Keine Sanktionen.</p>
            ) : (
              <ul className={styles.list}>
                {history.sanctions.items.map((sanction) => (
                  <li key={sanction.id} className={styles.card}>
                    <strong>
                      {sanction.type} · {sanction.status}
                    </strong>
                    <span>
                      {sanction.reasonCode.replaceAll('_', ' ')} · Beginn:{' '}
                      {timestamp(sanction.startsAt)}
                    </span>
                    <span>Ablauf: {timestamp(sanction.expiresAt)}</span>
                    {sanction.revokedAt ? (
                      <span>Widerrufen: {timestamp(sanction.revokedAt)}</span>
                    ) : null}
                    <ConfidentialNote
                      label="Interne Moderationsnotiz"
                      value={sanction.internalNote}
                    />
                    <ConfidentialNote label="Nutzer-Nachricht" value={sanction.userMessage} />
                    <ConfidentialNote label="Widerrufsgrund" value={sanction.revocationReason} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section}>
            <ListHeading
              title="Historische Kontostatusänderungen"
              count={history.statusEvents.items.length}
              hasMore={history.statusEvents.hasMore}
            />
            <p className={styles.hint}>
              Audit-Metadaten und Netzwerkdetails werden nicht angezeigt.
            </p>
            {history.statusEvents.items.length === 0 ? (
              <p>Keine Statusänderungen protokolliert.</p>
            ) : (
              <ul className={styles.list}>
                {history.statusEvents.items.map((event) => (
                  <li key={event.id} className={styles.card}>
                    <strong>Kontostatus geändert</strong>
                    <span>
                      {timestamp(event.occurredAt)} · {event.actorType}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
