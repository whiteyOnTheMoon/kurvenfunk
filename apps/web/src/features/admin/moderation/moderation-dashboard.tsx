'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../auth/auth-provider';
import { CommentReportQueue } from './comment-report-queue';
import styles from './moderation-dashboard.module.css';

interface Overview {
  asOf: string;
  counts: {
    pendingReports: number;
    activeYellowCards: number;
    activeRedCards: number;
    limitedUsers: number;
    bannedUsers: number;
    activeLimitedSanctions: number;
  };
  recentReports: Array<{
    id: string;
    targetType: string;
    status: string;
    reason: string;
    createdAt: string;
  }>;
  recentCards: Array<{
    id: string;
    type: string;
    status: string;
    reasonCode: string;
    issuedAt: string;
    expiresAt: string | null;
    user: { id: string; nickname: string | null; status: string };
  }>;
  recentLimitedSanctions: Array<{
    id: string;
    status: string;
    reasonCode: string;
    startsAt: string;
    expiresAt: string | null;
    user: { id: string; nickname: string | null; status: string } | null;
  }>;
  appeals: { available: false; trackingTask: '20.189' };
}

interface IpSummary {
  counts: {
    activeBlocks: number;
    activeManual: number;
    activeAutomatic: number;
    activeSanction: number;
  };
  recentBlocks: Array<{
    id: string;
    source: string;
    reasonCode: string;
    active: boolean;
    startsAt: string;
    expiresAt: string | null;
    deactivatedAt: string | null;
  }>;
}

async function readDashboard<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Für diese Übersicht besteht keine Berechtigung.');
    }
    throw new Error('Die Moderationsübersicht konnte nicht geladen werden.');
  }

  const payload = (await response.json()) as { data?: T };
  if (!payload.data) throw new Error('Ungültige Antwort der Moderationsübersicht.');
  return payload.data;
}

const dateTime = new Intl.DateTimeFormat('de-AT', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Vienna',
});

function dateLabel(value: string | null) {
  return value ? dateTime.format(new Date(value)) : 'Unbefristet';
}

function personLabel(user: { nickname: string | null } | null) {
  return user?.nickname || 'Konto ohne Anzeigenamen';
}

function OverviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <strong>{value.toLocaleString('de-AT')}</strong>
    </div>
  );
}

/** Task 187: a safe staff-only view, never a ban or IP-block execution tool. */
export function ModerationDashboard({ apiUrl }: { apiUrl: string }) {
  const { initialized, authenticated, token, user } = useAuth();
  const isSuperAdmin = user?.roles.includes('SUPERADMIN') ?? false;
  const [overview, setOverview] = useState<Overview>();
  const [network, setNetwork] = useState<IpSummary>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [networkError, setNetworkError] = useState<string>();
  const [reload, setReload] = useState(0);

  const refresh = useCallback(() => {
    if (!authenticated || !token) return;
    setReload((value) => value + 1);
  }, [authenticated, token]);

  useEffect(() => {
    if (!initialized || !authenticated || !token) return;
    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/moderation/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        const result = await readDashboard<Overview>(response);
        if (!cancelled) setOverview(result);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Dashboard konnte nicht geladen werden.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiUrl, initialized, authenticated, token, reload]);

  useEffect(() => {
    if (!initialized || !authenticated || !token || !isSuperAdmin) return;
    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/moderation/dashboard/ip-blocks`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        const result = await readDashboard<IpSummary>(response);
        if (!cancelled) setNetwork(result);
      } catch {
        if (!cancelled) setNetworkError('Die vertrauliche IP-Block-Übersicht ist nicht verfügbar.');
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiUrl, initialized, authenticated, token, isSuperAdmin, reload]);

  // The surrounding AdminLayout removes this page from the DOM for
  // unauthorized, LIMITED and BANNED identities.
  if (!initialized || !authenticated) {
    return <p role="status">Moderationsberechtigung wird geprüft …</p>;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Community · Phase 20</p>
          <h1>Moderation</h1>
          <p>Meldungen, Karten und aktive Einschränkungen im Überblick.</p>
        </div>
        <button className={styles.refresh} type="button" onClick={refresh}>
          Übersicht aktualisieren
        </button>
      </header>

      {loading && !overview ? <p role="status">Moderationsdaten werden geladen …</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      {overview ? (
        <>
          <section aria-label="Moderationskennzahlen" className={styles.stats}>
            <OverviewStat label="Offene Meldungen und in Prüfung" value={overview.counts.pendingReports} />
            <OverviewStat label="Aktive gelbe Karten" value={overview.counts.activeYellowCards} />
            <OverviewStat label="Aktive rote Karten" value={overview.counts.activeRedCards} />
            <OverviewStat label="LIMITED-Konten" value={overview.counts.limitedUsers} />
            <OverviewStat label="BANNED-Konten" value={overview.counts.bannedUsers} />
            <OverviewStat label="Aktive LIMITED-Sanktionen" value={overview.counts.activeLimitedSanctions} />
          </section>

          <div className={styles.columns}>
            <section className={styles.panel} aria-labelledby="reports-title">
              <div className={styles.sectionTitle}>
                <h2 id="reports-title">Letzte Meldungen</h2>
                <a href="#kommentarmeldungen">Zur Warteschlange</a>
              </div>
              {overview.recentReports.length === 0 ? <p>Keine Meldungen vorhanden.</p> : (
                <ul className={styles.items}>
                  {overview.recentReports.map((report) => (
                    <li key={report.id}>
                      <strong>{report.reason.replaceAll('_', ' ')}</strong>
                      <span>{report.targetType} · {report.status}</span>
                      <time dateTime={report.createdAt}>{dateLabel(report.createdAt)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.panel} aria-labelledby="cards-title">
              <h2 id="cards-title">Letzte gelbe und rote Karten</h2>
              {overview.recentCards.length === 0 ? <p>Keine Karten vorhanden.</p> : (
                <ul className={styles.items}>
                  {overview.recentCards.map((card) => (
                    <li key={card.id}>
                      <strong>{card.type === 'RED' ? 'Rote Karte' : 'Gelbe Karte'} · {card.status}</strong>
                      <span>{personLabel(card.user)} · {card.user.status}</span>
                      <span>{card.reasonCode.replaceAll('_', ' ')}</span>
                      <time dateTime={card.issuedAt}>{dateLabel(card.issuedAt)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.panel} aria-labelledby="limited-title">
              <h2 id="limited-title">Letzte LIMITED-Sanktionen</h2>
              {overview.recentLimitedSanctions.length === 0 ? <p>Keine LIMITED-Sanktionen vorhanden.</p> : (
                <ul className={styles.items}>
                  {overview.recentLimitedSanctions.map((sanction) => (
                    <li key={sanction.id}>
                      <strong>{personLabel(sanction.user)} · {sanction.status}</strong>
                      <span>{sanction.reasonCode.replaceAll('_', ' ')}</span>
                      <span>Bis: {dateLabel(sanction.expiresAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.panel} aria-labelledby="appeals-title">
              <h2 id="appeals-title">Einsprüche</h2>
              <p>Der Einspruchs-Workflow und seine Fallzahlen werden mit Task 20.189 eingeführt.</p>
              <p className={styles.muted}>Noch keine Einspruchszahlen – nicht als „0“ interpretiert.</p>
            </section>
          </div>

          {isSuperAdmin ? (
            <section className={styles.panel} aria-labelledby="ip-blocks-title">
              <h2 id="ip-blocks-title">IP-Sperren · nur SUPERADMIN</h2>
              {networkError ? <p role="alert">{networkError}</p> : null}
              {!network && !networkError ? <p role="status">IP-Übersicht wird geladen …</p> : null}
              {network ? (
                <>
                  <div className={styles.stats}>
                    <OverviewStat label="Aktive IP-Sperren" value={network.counts.activeBlocks} />
                    <OverviewStat label="Manuell" value={network.counts.activeManual} />
                    <OverviewStat label="Automatisch" value={network.counts.activeAutomatic} />
                    <OverviewStat label="Mit Sanktion verknüpft" value={network.counts.activeSanction} />
                  </div>
                  <p className={styles.muted}>Es werden weder IP-Adressen noch Hashwerte angezeigt.</p>
                  {network.recentBlocks.length > 0 ? (
                    <ul className={styles.networkList}>
                      {network.recentBlocks.map((block) => (
                        <li key={block.id}>
                          <strong>{block.source} · {block.active ? 'Gespeichert aktiv' : 'Deaktiviert'}</strong>
                          <span>{block.reasonCode.replaceAll('_', ' ')}</span>
                          <span>Ablauf: {dateLabel(block.expiresAt)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p>Keine IP-Sperren vorhanden.</p>}
                </>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}

      <section id="kommentarmeldungen" className={styles.queue}>
        <CommentReportQueue apiUrl={apiUrl} embedded />
      </section>
    </main>
  );
}
