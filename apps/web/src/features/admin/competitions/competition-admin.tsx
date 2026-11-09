'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '../../auth/auth-provider';
import styles from './competition-admin.module.css';

interface Competition {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  type: 'LEAGUE' | 'CUP';
  countryCode: string | null;
  active: boolean;
}

interface Draft {
  name: string;
  shortName: string;
  countryCode: string;
}

interface ApiPayload<T> {
  data?: T;
  error?: { message?: string };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiPayload<T> | null;
  if (!response.ok || !payload || payload.data === undefined) {
    throw new Error(payload?.error?.message ?? 'Die Anfrage konnte nicht abgeschlossen werden.');
  }
  return payload.data;
}

export function CompetitionAdmin({ apiUrl }: { apiUrl: string }) {
  const { authenticated, initialized, token } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: '', shortName: '', countryCode: 'AT' });
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newShortName, setNewShortName] = useState('');
  const [newCountry, setNewCountry] = useState('AT');
  const [newType, setNewType] = useState<'LEAGUE' | 'CUP'>('LEAGUE');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load(): Promise<void> {
    if (!token) return;
    const response = await fetch(`${apiUrl}/api/v1/competitions/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCompetitions(await parseResponse<Competition[]>(response));
  }

  useEffect(() => {
    if (!initialized || !authenticated || !token) return;
    let cancelled = false;

    async function initialLoad() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/competitions/admin/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseResponse<Competition[]>(response);
        if (!cancelled) setCompetitions(data);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Laden fehlgeschlagen.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialLoad();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, initialized, authenticated, token]);

  async function write(path: string, method: 'POST' | 'PATCH', input: unknown) {
    if (!token) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiUrl}/api/v1/competitions${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      await parseResponse<Competition>(response);
      await load();
      setEditingId(null);
      if (method === 'POST') {
        setNewName('');
        setNewSlug('');
        setNewShortName('');
        setNewCountry('AT');
        setNewType('LEAGUE');
      }
      setMessage('Wettbewerb wurde gespeichert.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }

  function startEditing(competition: Competition) {
    setEditingId(competition.id);
    setDraft({
      name: competition.name,
      shortName: competition.shortName ?? '',
      countryCode: competition.countryCode ?? '',
    });
  }

  if (!initialized || (authenticated && loading)) {
    return <p role="status">Wettbewerbe werden geladen …</p>;
  }
  if (!authenticated || !token) {
    return <p>Bitte melde dich für die Sportdatenverwaltung an.</p>;
  }

  return (
    <div className={styles.page}>
      <header>
        <p className={styles.eyebrow}>Sportdaten · Phase 21</p>
        <h1>Wettbewerbe verwalten</h1>
        <p>Start: österreichische Bundesliga. Inaktive Wettbewerbe bleiben historisch erhalten.</p>
      </header>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {message ? <p className={styles.success} role="status">{message}</p> : null}

      <section className={styles.panel} aria-labelledby="competition-create-title">
        <h2 id="competition-create-title">Neuer Wettbewerb</h2>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void write('', 'POST', {
              name: newName.trim(),
              slug: newSlug.trim(),
              shortName: newShortName.trim() || null,
              type: newType,
              countryCode: newCountry.trim().toUpperCase() || null,
            });
          }}
        >
          <label>
            Name
            <input
              required
              maxLength={120}
              value={newName}
              onChange={(event) => {
                setNewName(event.target.value);
                setNewSlug(slugify(event.target.value));
              }}
            />
          </label>
          <label>
            Slug (dauerhafte Identität)
            <input
              required
              maxLength={100}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={newSlug}
              onChange={(event) => setNewSlug(event.target.value)}
            />
          </label>
          <label>
            Kurzname (optional)
            <input
              maxLength={60}
              value={newShortName}
              onChange={(event) => setNewShortName(event.target.value)}
            />
          </label>
          <label>
            Typ
            <select
              value={newType}
              onChange={(event) => setNewType(event.target.value as 'LEAGUE' | 'CUP')}
            >
              <option value="LEAGUE">Liga</option>
              <option value="CUP">Pokal</option>
            </select>
          </label>
          <label>
            Ländercode (ISO-2)
            <input
              maxLength={2}
              value={newCountry}
              onChange={(event) => setNewCountry(event.target.value.toUpperCase())}
            />
          </label>
          <button type="submit" disabled={busy}>Wettbewerb erstellen</button>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="competition-list-title">
        <h2 id="competition-list-title">Bestehende Wettbewerbe</h2>
        {competitions.length === 0 ? <p>Noch keine Wettbewerbe vorhanden.</p> : null}
        <div className={styles.list}>
          {competitions.map((competition) => (
            <article className={styles.item} key={competition.id}>
              <div className={styles.itemHeading}>
                <div>
                  <h3>{competition.name}</h3>
                  <p>
                    <code>{competition.slug}</code> · {competition.type} ·{' '}
                    {competition.countryCode ?? 'International'}
                  </p>
                </div>
                <span className={competition.active ? styles.active : styles.inactive}>
                  {competition.active ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              {editingId === competition.id ? (
                <form
                  className={styles.form}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void write(`/${competition.id}`, 'PATCH', {
                      name: draft.name.trim(),
                      shortName: draft.shortName.trim() || null,
                      countryCode: draft.countryCode.trim().toUpperCase() || null,
                    });
                  }}
                >
                  <label>
                    Name
                    <input
                      required
                      maxLength={120}
                      value={draft.name}
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    />
                  </label>
                  <label>
                    Kurzname
                    <input
                      maxLength={60}
                      value={draft.shortName}
                      onChange={(event) => setDraft({ ...draft, shortName: event.target.value })}
                    />
                  </label>
                  <label>
                    Ländercode
                    <input
                      maxLength={2}
                      value={draft.countryCode}
                      onChange={(event) => setDraft({ ...draft, countryCode: event.target.value })}
                    />
                  </label>
                  <button type="submit" disabled={busy}>Änderungen speichern</button>
                  <button type="button" disabled={busy} onClick={() => setEditingId(null)}>
                    Abbrechen
                  </button>
                </form>
              ) : (
                <div className={styles.actions}>
                  <button type="button" disabled={busy} onClick={() => startEditing(competition)}>
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const next = competition.active ? 'deaktivieren' : 'aktivieren';
                      if (!window.confirm(`„${competition.name}“ wirklich ${next}?`)) return;
                      void write(`/${competition.id}`, 'PATCH', {
                        active: !competition.active,
                      });
                    }}
                  >
                    {competition.active ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
