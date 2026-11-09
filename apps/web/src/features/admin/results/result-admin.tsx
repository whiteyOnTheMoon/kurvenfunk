'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '../../auth/auth-provider';
import styles from './result-admin.module.css';

type ResultStatus = 'LIVE' | 'FINISHED' | 'ABANDONED';
type MatchStatus = 'SCHEDULED' | 'POSTPONED' | 'CANCELLED' | ResultStatus;

interface Competition {
  id: string;
  slug: string;
  name: string;
}

interface Season {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface Match {
  id: string;
  status: MatchStatus;
  kickoff: string;
  matchday: number | null;
  homeScore: number | null;
  awayScore: number | null;
  updatedAt: string;
  homeClub: { id: string; name: string };
  awayClub: { id: string; name: string };
}

interface SeasonMatches {
  season: Season;
  matches: Match[];
}

interface Draft {
  status: ResultStatus;
  homeScore: string;
  awayScore: string;
  expectedUpdatedAt: string;
}

interface ApiPayload<T> {
  data?: T;
  error?: { message?: string | string[] };
}

const statusLabels: Record<MatchStatus, string> = {
  SCHEDULED: 'Angesetzt',
  POSTPONED: 'Verschoben',
  CANCELLED: 'Abgesagt',
  LIVE: 'Live',
  FINISHED: 'Beendet',
  ABANDONED: 'Abgebrochen',
};

const resultStatuses: ResultStatus[] = ['LIVE', 'FINISHED', 'ABANDONED'];

function editableStatuses(status: MatchStatus): ResultStatus[] {
  if (status === 'SCHEDULED') return resultStatuses;
  if (status === 'LIVE') return resultStatuses;
  if (status === 'FINISHED') return ['FINISHED'];
  if (status === 'ABANDONED') return ['ABANDONED'];
  return [];
}

function initialDraft(match: Match): Draft {
  return {
    status: match.status === 'SCHEDULED' ? 'FINISHED' : (match.status as ResultStatus),
    homeScore: match.homeScore === null ? '' : String(match.homeScore),
    awayScore: match.awayScore === null ? '' : String(match.awayScore),
    expectedUpdatedAt: match.updatedAt,
  };
}

function scoresValid(draft: Draft): boolean {
  if ((draft.homeScore === '') !== (draft.awayScore === '')) return false;
  if (draft.status === 'FINISHED' && draft.homeScore === '') return false;
  if (draft.homeScore === '') return true;
  return [draft.homeScore, draft.awayScore].every(
    (score) => /^\d+$/.test(score) && Number(score) >= 0 && Number(score) <= 999,
  );
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiPayload<T> | null;
  if (!response.ok || !payload || payload.data === undefined) {
    const reason = payload?.error?.message;
    throw new Error(
      Array.isArray(reason)
        ? reason.join(', ')
        : (reason ?? 'Die Anfrage konnte nicht abgeschlossen werden.'),
    );
  }
  return payload.data;
}

export function ResultAdmin({ apiUrl }: { apiUrl: string }) {
  const { authenticated, initialized, token } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionSlug, setCompetitionSlug] = useState('');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState('');
  const [data, setData] = useState<SeasonMatches | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated || !initialized || !token) return;
    let cancelled = false;
    async function loadCompetitions() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/competitions/admin/all`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const list = await parseResponse<Competition[]>(response);
        if (!cancelled) {
          setCompetitions(list);
          setCompetitionSlug(list[0]?.slug ?? '');
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Wettbewerbe fehlen.');
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
    if (!competitionSlug || !token) return;
    let cancelled = false;
    async function loadSeasons() {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/seasons/competition/${encodeURIComponent(competitionSlug)}`,
          { cache: 'no-store' },
        );
        const list = await parseResponse<Season[]>(response);
        if (!cancelled) {
          setSeasons(list);
          setSeasonId(list.find((season) => season.status === 'ACTIVE')?.id ?? list[0]?.id ?? '');
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Saisonen fehlen.');
      }
    }
    void loadSeasons();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, competitionSlug, token]);

  useEffect(() => {
    if (!seasonId || !token) return;
    let cancelled = false;
    async function loadMatches() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/matches/admin/season/${seasonId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const matches = await parseResponse<SeasonMatches>(response);
        if (!cancelled) setData(matches);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Ergebnisse fehlen.');
      }
    }
    void loadMatches();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, seasonId, token]);

  async function reload() {
    if (!seasonId || !token) return;
    const response = await fetch(`${apiUrl}/api/v1/matches/admin/season/${seasonId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    setData(await parseResponse<SeasonMatches>(response));
  }

  async function save(match: Match) {
    if (!token || !draft || !scoresValid(draft)) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiUrl}/api/v1/matches/${match.id}/result`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: draft.status,
          homeScore: draft.homeScore === '' ? null : Number(draft.homeScore),
          awayScore: draft.awayScore === '' ? null : Number(draft.awayScore),
          expectedUpdatedAt: draft.expectedUpdatedAt,
        }),
      });
      if (response.status === 409) {
        setEditingId(null);
        setDraft(null);
        await reload();
        throw new Error('Der Spielstand hat sich geändert. Bitte die neuen Daten prüfen.');
      }
      await parseResponse<Match>(response);
      await reload();
      setEditingId(null);
      setDraft(null);
      setMessage('Ergebnis wurde gespeichert und protokolliert.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }

  if (!initialized || (authenticated && loading)) {
    return <p role="status">Ergebnisverwaltung wird geladen …</p>;
  }
  if (!authenticated || !token) return null;

  return (
    <section className={styles.page} aria-labelledby="results-admin-title">
      <header>
        <h2 id="results-admin-title">Ergebnisse verwalten</h2>
        <p>
          Live-Spielstände, Endergebnisse und abgebrochene Spiele. Korrekturen werden
          protokolliert. Terminverschiebungen gehören zur Spielverwaltung darüber.
        </p>
      </header>

      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      {message ? <p role="status" className={styles.success}>{message}</p> : null}

      <div className={styles.filters}>
        <label>
          Wettbewerb
          <select
            value={competitionSlug}
            onChange={(event) => {
              setCompetitionSlug(event.target.value);
              setSeasons([]);
              setSeasonId('');
              setData(null);
              setEditingId(null);
            }}
          >
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.slug}>{competition.name}</option>
            ))}
          </select>
        </label>
        <label>
          Saison
          <select
            value={seasonId}
            onChange={(event) => {
              setSeasonId(event.target.value);
              setData(null);
              setEditingId(null);
            }}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>{season.name} ({season.status})</option>
            ))}
          </select>
        </label>
      </div>

      {data ? (
        <section className={styles.panel} aria-label="Ergebnisse dieser Saison">
          <h3>Spiele der Saison ({data.matches.length})</h3>
          {data.matches.length === 0 ? <p>Noch keine Spielansetzungen vorhanden.</p> : null}
          <div className={styles.list}>
            {data.matches.map((match) => {
              const allowed = editableStatuses(match.status);
              return (
                <article key={match.id} className={styles.match}>
                  <div className={styles.heading}>
                    <div>
                      <h4>{match.homeClub.name} – {match.awayClub.name}</h4>
                      <p>
                        {new Date(match.kickoff).toLocaleString('de-AT')} ·
                        {match.matchday === null ? ' ohne Spieltag' : ` Spieltag ${match.matchday}`}
                      </p>
                    </div>
                    <div className={styles.score}>
                      <strong>
                        {match.homeScore === null ? '–' : match.homeScore}
                        {' : '}
                        {match.awayScore === null ? '–' : match.awayScore}
                      </strong>
                      <span>{statusLabels[match.status]}</span>
                    </div>
                  </div>
                  {editingId === match.id && draft ? (
                    <form
                      className={styles.form}
                      onSubmit={(event) => {
                        event.preventDefault();
                        void save(match);
                      }}
                    >
                      <label>
                        Status
                        <select
                          value={draft.status}
                          onChange={(event) => setDraft({
                            ...draft,
                            status: event.target.value as ResultStatus,
                          })}
                        >
                          {allowed.map((status) => (
                            <option key={status} value={status}>{statusLabels[status]}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Tore Heim
                        <input
                          type="number"
                          min={0}
                          max={999}
                          step={1}
                          value={draft.homeScore}
                          onChange={(event) => setDraft({ ...draft, homeScore: event.target.value })}
                        />
                      </label>
                      <label>
                        Tore Auswärts
                        <input
                          type="number"
                          min={0}
                          max={999}
                          step={1}
                          value={draft.awayScore}
                          onChange={(event) => setDraft({ ...draft, awayScore: event.target.value })}
                        />
                      </label>
                      <p className={styles.hint}>
                        Für beendete Spiele beide Torzahlen angeben (0:0 ist gültig).
                        Bei Live-/abgebrochenen Spielen dürfen beide Werte leer bleiben.
                      </p>
                      <div className={styles.actions}>
                        <button type="submit" disabled={busy || !scoresValid(draft)}>
                          Ergebnis speichern
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(null);
                            setDraft(null);
                          }}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </form>
                  ) : allowed.length ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(match.id);
                        setDraft(initialDraft(match));
                        setError(null);
                      }}
                    >
                      Ergebnis {match.status === 'SCHEDULED' ? 'eintragen' : 'bearbeiten'}
                    </button>
                  ) : (
                    <p className={styles.hint}>
                      Verschobene und abgesagte Spiele können hier kein Ergebnis erhalten.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <p role="status">Wettbewerb und Saison auswählen, um die Ergebnisse zu laden.</p>
      )}
    </section>
  );
}
