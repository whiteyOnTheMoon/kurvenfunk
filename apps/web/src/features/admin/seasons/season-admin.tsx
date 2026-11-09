'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '../../auth/auth-provider';
import styles from '../competitions/competition-admin.module.css';

type SeasonStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface Competition {
  id: string;
  name: string;
  slug: string;
}

interface Season {
  id: string;
  competitionId: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
  active: boolean;
}

interface SeasonDraft {
  name: string;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
}

interface ApiPayload<T> {
  data?: T;
  error?: { message?: string };
}

const emptySeason = {
  name: '',
  slug: '',
  startDate: '',
  endDate: '',
  status: 'PLANNED' as SeasonStatus,
};

const statusNames: Record<SeasonStatus, string> = {
  PLANNED: 'Geplant',
  ACTIVE: 'Aktiv',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
};

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiPayload<T> | null;
  if (!response.ok || !payload || payload.data === undefined) {
    throw new Error(payload?.error?.message ?? 'Die Anfrage konnte nicht abgeschlossen werden.');
  }
  return payload.data;
}

export function SeasonAdmin({ apiUrl }: { apiUrl: string }) {
  const { authenticated, initialized, token } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [creating, setCreating] = useState({ ...emptySeason });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SeasonDraft>({
    name: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED',
  });
  const [loading, setLoading] = useState(true);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized || !authenticated || !token) return;
    let cancelled = false;
    async function loadCompetitions() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/competitions/admin/all`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const items = await parseResponse<Competition[]>(response);
        if (!cancelled) {
          setCompetitions(items);
          setSelectedSlug((current) => current || items[0]?.slug || '');
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Laden fehlgeschlagen.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadCompetitions();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, authenticated, initialized, token]);

  useEffect(() => {
    if (!token || !selectedSlug) return;
    let cancelled = false;
    async function loadSeasons() {
      setLoadingSeasons(true);
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/seasons/competition/${encodeURIComponent(selectedSlug)}`,
          { cache: 'no-store' },
        );
        const items = await parseResponse<Season[]>(response);
        if (!cancelled) setSeasons(items);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Saisonen konnten nicht geladen werden.');
      } finally {
        if (!cancelled) setLoadingSeasons(false);
      }
    }
    void loadSeasons();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, token, selectedSlug]);

  async function refreshSeasons(): Promise<void> {
    const response = await fetch(
      `${apiUrl}/api/v1/seasons/competition/${encodeURIComponent(selectedSlug)}`,
      { cache: 'no-store' },
    );
    setSeasons(await parseResponse<Season[]>(response));
  }

  async function save(method: 'POST' | 'PATCH', path: string, body: unknown) {
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiUrl}/api/v1/seasons${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      await parseResponse<Season>(response);
      await refreshSeasons();
      setEditingId(null);
      if (method === 'POST') setCreating({ ...emptySeason });
      setMessage('Saison wurde gespeichert.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }

  if (!initialized || (authenticated && loading)) {
    return <p role="status">Saisonverwaltung wird geladen …</p>;
  }
  if (!authenticated || !token) return null;

  return (
    <section className={styles.page} aria-labelledby="season-admin-title">
      <header>
        <h2 id="season-admin-title">Saisonen verwalten</h2>
        <p>
          Pro Wettbewerb kann nur eine Saison aktiv sein. Frühere Saisonen bleiben im Archiv
          erhalten. Bitte eine laufende Saison zuerst abschließen, bevor du die nächste aktivierst.
        </p>
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className={styles.success} role="status">
          {message}
        </p>
      ) : null}

      <section className={styles.panel} aria-labelledby="season-selection-title">
        <h3 id="season-selection-title">Wettbewerb wählen</h3>
        {competitions.length === 0 ? <p>Keine Wettbewerbe gefunden.</p> : null}
        <label className={styles.form}>
          Wettbewerb
          <select
            value={selectedSlug}
            onChange={(event) => {
              setSelectedSlug(event.target.value);
              setEditingId(null);
              setSeasons([]);
              setError(null);
            }}
          >
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.slug}>
                {competition.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {selectedSlug ? (
        <>
          <section className={styles.panel} aria-labelledby="season-create-title">
            <h3 id="season-create-title">Neue Saison</h3>
            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                void save('POST', `/competition/${encodeURIComponent(selectedSlug)}`, creating);
              }}
            >
              <label>
                Saisonname
                <input
                  required
                  maxLength={80}
                  placeholder="2027/28"
                  value={creating.name}
                  onChange={(event) =>
                    setCreating((old) => ({
                      ...old,
                      name: event.target.value,
                      slug: /^\d{4}\/\d{2}$/.test(event.target.value)
                        ? event.target.value.replace('/', '-')
                        : old.slug,
                    }))
                  }
                />
              </label>
              <label>
                Kennung (bleibt unverändert)
                <input
                  required
                  maxLength={100}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  placeholder="2027-28"
                  value={creating.slug}
                  onChange={(event) => setCreating({ ...creating, slug: event.target.value })}
                />
              </label>
              <label>
                Beginn
                <input
                  type="date"
                  required
                  value={creating.startDate}
                  onChange={(event) => setCreating({ ...creating, startDate: event.target.value })}
                />
              </label>
              <label>
                Ende
                <input
                  type="date"
                  required
                  min={creating.startDate || undefined}
                  value={creating.endDate}
                  onChange={(event) => setCreating({ ...creating, endDate: event.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={creating.status}
                  onChange={(event) =>
                    setCreating({ ...creating, status: event.target.value as SeasonStatus })
                  }
                >
                  {Object.entries(statusNames).map(([value, name]) => (
                    <option key={value} value={value}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={busy || loadingSeasons}>
                Saison anlegen
              </button>
            </form>
          </section>

          <section className={styles.panel} aria-labelledby="season-list-title">
            <h3 id="season-list-title">Saisonarchiv</h3>
            {loadingSeasons ? <p role="status">Saisonen werden geladen …</p> : null}
            {!loadingSeasons && seasons.length === 0 ? <p>Noch keine Saison vorhanden.</p> : null}
            <div className={styles.list}>
              {seasons.map((season) => (
                <article className={styles.item} key={season.id}>
                  <div className={styles.itemHeading}>
                    <div>
                      <h4>{season.name}</h4>
                      <p>
                        <code>{season.slug}</code> · {dateOnly(season.startDate)} bis{' '}
                        {dateOnly(season.endDate)}
                      </p>
                    </div>
                    <span className={season.active ? styles.active : styles.inactive}>
                      {statusNames[season.status]}
                    </span>
                  </div>
                  {editingId === season.id ? (
                    <form
                      className={styles.form}
                      onSubmit={(event) => {
                        event.preventDefault();
                        void save('PATCH', `/${season.id}`, editing);
                      }}
                    >
                      <label>
                        Name
                        <input
                          required
                          maxLength={80}
                          value={editing.name}
                          onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                        />
                      </label>
                      <label>
                        Beginn
                        <input
                          type="date"
                          required
                          value={editing.startDate}
                          onChange={(event) =>
                            setEditing({ ...editing, startDate: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Ende
                        <input
                          type="date"
                          required
                          min={editing.startDate}
                          value={editing.endDate}
                          onChange={(event) => setEditing({ ...editing, endDate: event.target.value })}
                        />
                      </label>
                      <label>
                        Status
                        <select
                          value={editing.status}
                          onChange={(event) =>
                            setEditing({ ...editing, status: event.target.value as SeasonStatus })
                          }
                        >
                          {Object.entries(statusNames).map(([value, name]) => (
                            <option key={value} value={value}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button type="submit" disabled={busy}>
                        Speichern
                      </button>
                      <button type="button" disabled={busy} onClick={() => setEditingId(null)}>
                        Abbrechen
                      </button>
                    </form>
                  ) : (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditingId(season.id);
                          setEditing({
                            name: season.name,
                            startDate: dateOnly(season.startDate),
                            endDate: dateOnly(season.endDate),
                            status: season.status,
                          });
                        }}
                      >
                        Bearbeiten
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
