'use client';

import { useEffect, useState } from 'react';
import { Button, EmptyState, Skeleton } from '@kurvenfunk/ui';

import { useAuth } from '../../auth/auth-provider';
import styles from './import-admin.module.css';

interface ImportAdminProps {
  apiUrl: string;
}

interface ImportSummary {
  totalJobs: number;
  runningJobs: number;
  failedJobs: number;
  deadLetterJobs: number;
  importedRecords: number;
  duplicateRecords: number;
  reviewRequiredRecords: number;
  failedRecords: number;
  matchingProblems: number;
}

interface Provider {
  id: string;
  key: string;
  name: string;
  type: string;
  status: string;
  lastImportAt: string | null;
  jobCount: number;
  recordCount: number;
}

interface ImportOverview {
  summary: ImportSummary;
  providers: Provider[];
}

interface ImportJob {
  id: string;
  kind: string;
  status: string;
  trigger: string;
  queueJobId: string | null;
  receivedCount: number;
  processedCount: number;
  createdCount: number;
  updatedCount: number;
  duplicateCount: number;
  failedCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  provider: {
    id: string;
    key: string;
    name: string;
    type: string;
    status: string;
  };
}

interface MatchingProblem {
  id: string;
  entityType: string;
  externalId: string | null;
  externalName: string | null;
  status: string;
  confidence: string | null;
  method: string | null;
  lastSeenAt: string;
  provider: {
    id: string;
    key: string;
    name: string;
  };
  club: {
    id: string;
    name: string;
    slug: string;
  } | null;
  competition: {
    id: string;
    name: string;
    slug: string;
  } | null;
  match: {
    id: string;
    kickoff: string;
  } | null;
  article: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

interface ReviewItem {
  id: string;
  importJobId: string;
  recordType: string;
  status: string;
  externalId: string | null;
  externalUrl: string | null;
  normalizedPayload: unknown;
  normalizedAt: string | null;
  canonicalEntityType: string | null;
  canonicalEntityId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  reviewDecision: 'APPROVED' | 'REJECTED' | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  provider: {
    id: string;
    key: string;
    name: string;
  };
  importJob: {
    id: string;
    kind: string;
    status: string;
    trigger: string;
    createdAt: string;
  };
}

interface JobList {
  items: ImportJob[];
  nextCursor: string | null;
}

function formatDate(value: string | null) {
  if (!value) {
    return '–';
  }

  return new Intl.DateTimeFormat('de-AT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Vienna',
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ');
}

function statusClass(status: string) {
  if (['SUCCEEDED', 'CREATED', 'UPDATED', 'ACTIVE', 'MATCHED'].includes(status)) {
    return styles.statusSuccess;
  }

  if (['FAILED', 'DEAD_LETTER', 'INACTIVE', 'DISABLED'].includes(status)) {
    return styles.statusDanger;
  }

  if (
    ['PARTIALLY_SUCCEEDED', 'REVIEW_REQUIRED', 'AMBIGUOUS', 'UNMATCHED', 'DEGRADED'].includes(
      status,
    )
  ) {
    return styles.statusWarning;
  }

  if (['RUNNING', 'QUEUED'].includes(status)) {
    return styles.statusRunning;
  }

  return styles.statusNeutral;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`${styles.status} ${statusClass(status)}`}>{formatStatus(status)}</span>;
}

async function readPayload<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as {
    data?: T;
    error?: {
      message?: string;
    };
  } | null;

  if (!response.ok || payload?.data === undefined) {
    throw new Error(payload?.error?.message ?? 'Importdaten konnten nicht geladen werden.');
  }

  return payload.data;
}

function getReviewPayloadSummary(payload: unknown) {
  if (typeof payload !== 'object' || payload === null) {
    return {
      title: 'Unbekannter Artikel',
      lead: null,
      clubNames: [] as string[],
      competitionName: null,
    };
  }

  const value = payload as Record<string, unknown>;

  return {
    title: typeof value.title === 'string' ? value.title : 'Unbekannter Artikel',
    lead: typeof value.lead === 'string' ? value.lead : null,
    clubNames: Array.isArray(value.clubNames)
      ? value.clubNames.filter((item): item is string => typeof item === 'string')
      : [],
    competitionName: typeof value.competitionName === 'string' ? value.competitionName : null,
  };
}

export function ImportAdmin({ apiUrl }: ImportAdminProps) {
  const { authenticated, initialized, token } = useAuth();

  const [overview, setOverview] = useState<ImportOverview>();
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [matchingProblems, setMatchingProblems] = useState<MatchingProblem[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([]);
  const [reviewingId, setReviewingId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>();

  async function requestJobs(cursor?: string) {
    if (!token) {
      throw new Error('Keine gültige Anmeldung vorhanden.');
    }

    const params = new URLSearchParams({
      limit: '30',
    });

    if (cursor) {
      params.set('cursor', cursor);
    }

    const response = await fetch(`${apiUrl}/api/v1/imports/jobs?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return readPayload<JobList>(response);
  }

  useEffect(() => {
    if (!initialized || !authenticated || !token) {
      return;
    }

    let cancelled = false;

    async function loadImportAdmin() {
      setLoading(true);
      setError(undefined);

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [overviewResponse, jobsResponse, matchingResponse, reviewResponse] =
          await Promise.all([
            fetch(`${apiUrl}/api/v1/imports/overview`, { headers }),
            fetch(`${apiUrl}/api/v1/imports/jobs?limit=30`, { headers }),
            fetch(`${apiUrl}/api/v1/imports/matching-problems`, { headers }),
            fetch(`${apiUrl}/api/v1/imports/review-queue`, { headers }),
          ]);

        const [overviewData, jobData, matchingData, reviewData] = await Promise.all([
          readPayload<ImportOverview>(overviewResponse),
          readPayload<JobList>(jobsResponse),
          readPayload<MatchingProblem[]>(matchingResponse),
          readPayload<ReviewItem[]>(reviewResponse),
        ]);

        if (!cancelled) {
          setOverview(overviewData);
          setJobs(jobData.items);
          setNextCursor(jobData.nextCursor);
          setMatchingProblems(matchingData);
          setReviewQueue(reviewData);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Importdaten konnten nicht geladen werden.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadImportAdmin();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, initialized, token]);

  async function decideReview(id: string, decision: 'approve' | 'reject') {
    if (!token) {
      setError('Keine gültige Anmeldung vorhanden.');
      return;
    }

    setReviewingId(id);
    setError(undefined);

    try {
      const response = await fetch(`${apiUrl}/api/v1/imports/review/${id}/${decision}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await readPayload<{
        id: string;
        status: string;
        reviewDecision: string;
      }>(response);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [overviewResponse, reviewResponse] = await Promise.all([
        fetch(`${apiUrl}/api/v1/imports/overview`, { headers }),
        fetch(`${apiUrl}/api/v1/imports/review-queue`, { headers }),
      ]);

      const [overviewData, reviewData] = await Promise.all([
        readPayload<ImportOverview>(overviewResponse),
        readPayload<ReviewItem[]>(reviewResponse),
      ]);

      setOverview(overviewData);
      setReviewQueue(reviewData);
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Review-Entscheidung konnte nicht gespeichert werden.',
      );
    } finally {
      setReviewingId(undefined);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(undefined);

    try {
      const result = await requestJobs(nextCursor);

      setJobs((current) => [...current, ...result.items]);
      setNextCursor(result.nextCursor);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Weitere Import-Jobs konnten nicht geladen werden.',
      );
    } finally {
      setLoadingMore(false);
    }
  }

  if (!initialized) {
    return (
      <div className={styles.loading}>
        <Skeleton style={{ height: '120px' }} />
        <Skeleton style={{ height: '220px' }} />
        <Skeleton style={{ height: '420px' }} />
      </div>
    );
  }

  if (!authenticated || !token) {
    return <div className={styles.state}>Du musst angemeldet sein, um Importe zu verwalten.</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>System</p>
          <h1>Importe</h1>
          <p className={styles.intro}>
            Provider, Import-Jobs, Duplikate, Matchingprobleme und Fehler der Datenpipeline
            überwachen.
          </p>
        </div>
      </header>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className={styles.loading}>
          <Skeleton style={{ height: '120px' }} />
          <Skeleton style={{ height: '220px' }} />
          <Skeleton style={{ height: '420px' }} />
        </div>
      ) : overview ? (
        <>
          <section aria-labelledby="import-summary">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Überblick</p>
                <h2 id="import-summary">Pipeline-Status</h2>
              </div>
            </div>

            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span>Jobs gesamt</span>
                <strong>{overview.summary.totalJobs}</strong>
              </div>
              <div className={styles.metric}>
                <span>Laufend</span>
                <strong>{overview.summary.runningJobs}</strong>
              </div>
              <div className={styles.metric}>
                <span>Importiert</span>
                <strong>{overview.summary.importedRecords}</strong>
              </div>
              <div className={styles.metric}>
                <span>Duplikate</span>
                <strong>{overview.summary.duplicateRecords}</strong>
              </div>
              <div className={styles.metric}>
                <span>Review nötig</span>
                <strong>{overview.summary.reviewRequiredRecords}</strong>
              </div>
              <div className={styles.metric}>
                <span>Matchingprobleme</span>
                <strong>{overview.summary.matchingProblems}</strong>
              </div>
              <div className={styles.metric}>
                <span>Fehler</span>
                <strong>{overview.summary.failedRecords}</strong>
              </div>
              <div className={styles.metric}>
                <span>Dead Letter</span>
                <strong>{overview.summary.deadLetterJobs}</strong>
              </div>
            </div>

            {overview.summary.failedJobs > 0 ? (
              <p className={styles.summaryNote}>
                {overview.summary.failedJobs} fehlgeschlagene oder nur teilweise erfolgreiche Jobs
                vorhanden.
              </p>
            ) : null}
          </section>

          <section aria-labelledby="providers">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Quellen</p>
                <h2 id="providers">Provider</h2>
              </div>
              <span>{overview.providers.length} konfiguriert</span>
            </div>

            {overview.providers.length === 0 ? (
              <EmptyState title="Keine Provider">
                Es sind noch keine Import-Provider konfiguriert.
              </EmptyState>
            ) : (
              <div className={styles.providerGrid}>
                {overview.providers.map((provider) => (
                  <article key={provider.id} className={styles.providerCard}>
                    <div className={styles.providerTop}>
                      <div>
                        <strong>{provider.name}</strong>
                        <span>{provider.key}</span>
                      </div>
                      <StatusBadge status={provider.status} />
                    </div>

                    <dl className={styles.providerStats}>
                      <div>
                        <dt>Typ</dt>
                        <dd>{provider.type}</dd>
                      </div>
                      <div>
                        <dt>Jobs</dt>
                        <dd>{provider.jobCount}</dd>
                      </div>
                      <div>
                        <dt>Records</dt>
                        <dd>{provider.recordCount}</dd>
                      </div>
                    </dl>

                    <p>
                      Letzter Import: <strong>{formatDate(provider.lastImportAt)}</strong>
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="jobs">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Verarbeitung</p>
                <h2 id="jobs">Import-Jobs</h2>
              </div>
              <span>{jobs.length} geladen</span>
            </div>

            {jobs.length === 0 ? (
              <EmptyState title="Noch keine Import-Jobs">
                Sobald ein Provider ausgeführt wird, erscheinen seine Jobs hier.
              </EmptyState>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Provider / Job</th>
                        <th>Status</th>
                        <th>Eingang</th>
                        <th>Importiert</th>
                        <th>Duplikate</th>
                        <th>Fehler</th>
                        <th>Zeitpunkt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id}>
                          <td>
                            <div className={styles.jobIdentity}>
                              <strong>{job.provider.name}</strong>
                              <span>
                                {job.kind} · {job.trigger}
                              </span>
                              <code>{job.id.slice(0, 8)}</code>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={job.status} />
                          </td>
                          <td>{job.receivedCount}</td>
                          <td>{job.createdCount + job.updatedCount}</td>
                          <td>{job.duplicateCount}</td>
                          <td>
                            <span className={job.failedCount > 0 ? styles.countDanger : undefined}>
                              {job.failedCount}
                            </span>
                          </td>
                          <td>{formatDate(job.startedAt ?? job.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.mobileJobs}>
                  {jobs.map((job) => (
                    <article key={job.id} className={styles.mobileJobCard}>
                      <div className={styles.mobileJobHeader}>
                        <div className={styles.jobIdentity}>
                          <strong>{job.provider.name}</strong>
                          <span>
                            {job.kind} · {job.trigger}
                          </span>
                          <code>{job.id.slice(0, 8)}</code>
                        </div>

                        <StatusBadge status={job.status} />
                      </div>

                      <dl className={styles.mobileJobStats}>
                        <div>
                          <dt>Eingang</dt>
                          <dd>{job.receivedCount}</dd>
                        </div>
                        <div>
                          <dt>Importiert</dt>
                          <dd>{job.createdCount + job.updatedCount}</dd>
                        </div>
                        <div>
                          <dt>Duplikate</dt>
                          <dd>{job.duplicateCount}</dd>
                        </div>
                        <div>
                          <dt>Fehler</dt>
                          <dd className={job.failedCount > 0 ? styles.countDanger : undefined}>
                            {job.failedCount}
                          </dd>
                        </div>
                      </dl>

                      <p className={styles.mobileJobDate}>
                        {formatDate(job.startedAt ?? job.createdAt)}
                      </p>
                    </article>
                  ))}
                </div>

                {jobs.some((job) => job.errorMessage) ? (
                  <div className={styles.jobErrors}>
                    <h3>Letzte Job-Fehler</h3>
                    {jobs
                      .filter((job) => job.errorMessage)
                      .slice(0, 10)
                      .map((job) => (
                        <article key={job.id} className={styles.jobError}>
                          <div>
                            <strong>{job.provider.name}</strong>
                            <StatusBadge status={job.status} />
                          </div>
                          <p>{job.errorMessage}</p>
                          <span>
                            {job.errorCode ?? 'IMPORT_ERROR'} ·{' '}
                            {formatDate(job.finishedAt ?? job.createdAt)}
                          </span>
                        </article>
                      ))}
                  </div>
                ) : null}

                {nextCursor ? (
                  <div className={styles.loadMore}>
                    <Button type="button" disabled={loadingMore} onClick={() => void loadMore()}>
                      {loadingMore ? 'Wird geladen …' : 'Mehr Jobs laden'}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </section>

          <section aria-labelledby="review-queue">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Redaktion</p>
                <h2 id="review-queue">Review-Queue</h2>
              </div>
              <span>{reviewQueue.length} offen</span>
            </div>

            {reviewQueue.length === 0 ? (
              <EmptyState title="Keine offenen Reviews">
                Aktuell warten keine importierten Artikel auf eine manuelle Prüfung.
              </EmptyState>
            ) : (
              <div className={styles.reviewList}>
                {reviewQueue.map((item) => {
                  const payload = getReviewPayloadSummary(item.normalizedPayload);
                  const busy = reviewingId === item.id;

                  return (
                    <article key={item.id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <div>
                          <div className={styles.reviewTitle}>
                            <strong>{payload.title}</strong>
                            <StatusBadge status={item.status} />
                          </div>

                          <span>
                            {item.provider.name} · {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>

                      {payload.lead ? <p className={styles.reviewLead}>{payload.lead}</p> : null}

                      <dl className={styles.reviewMeta}>
                        <div>
                          <dt>Confidence</dt>
                          <dd>{item.errorMessage ?? 'Manuelle Prüfung erforderlich'}</dd>
                        </div>

                        <div>
                          <dt>Vereine</dt>
                          <dd>
                            {payload.clubNames.length > 0 ? payload.clubNames.join(', ') : '–'}
                          </dd>
                        </div>

                        <div>
                          <dt>Wettbewerb</dt>
                          <dd>{payload.competitionName ?? '–'}</dd>
                        </div>

                        <div>
                          <dt>Zuordnung</dt>
                          <dd>
                            {item.canonicalEntityType
                              ? `${item.canonicalEntityType} · ${item.canonicalEntityId ?? '–'}`
                              : '–'}
                          </dd>
                        </div>
                      </dl>

                      {item.externalUrl ? (
                        <p className={styles.reviewSource}>
                          <a href={item.externalUrl} target="_blank" rel="noreferrer">
                            Originalquelle öffnen
                          </a>
                        </p>
                      ) : null}

                      <div className={styles.reviewActions}>
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => void decideReview(item.id, 'approve')}
                        >
                          {busy ? 'Wird gespeichert …' : 'Freigeben'}
                        </Button>

                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => void decideReview(item.id, 'reject')}
                        >
                          Ablehnen
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section aria-labelledby="matching-problems">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Zuordnung</p>
                <h2 id="matching-problems">Matchingprobleme</h2>
              </div>
              <span>{matchingProblems.length} offen</span>
            </div>

            {matchingProblems.length === 0 ? (
              <EmptyState title="Keine offenen Matchingprobleme">
                Aktuell sind keine ungeklärten Zuordnungen vorhanden.
              </EmptyState>
            ) : (
              <div className={styles.problemList}>
                {matchingProblems.map((problem) => (
                  <article key={problem.id} className={styles.problemCard}>
                    <div className={styles.problemMain}>
                      <div className={styles.problemTitle}>
                        <strong>
                          {problem.externalName ?? problem.externalId ?? 'Unbekannte Entität'}
                        </strong>
                        <StatusBadge status={problem.status} />
                      </div>
                      <span>
                        {problem.provider.name} · {problem.entityType}
                      </span>
                    </div>

                    <div className={styles.problemMeta}>
                      <span>Confidence: {problem.confidence ?? '–'}</span>
                      <span>Methode: {problem.method ?? '–'}</span>
                      <span>{formatDate(problem.lastSeenAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <EmptyState title="Keine Importdaten">
          Für den Import-Admin konnten keine Daten geladen werden.
        </EmptyState>
      )}
    </div>
  );
}
